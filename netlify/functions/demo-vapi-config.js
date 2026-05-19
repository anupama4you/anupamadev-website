exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };

  let businessWebsite;
  try { businessWebsite = JSON.parse(event.body || '{}').businessWebsite; } catch {}

  let businessContext     = null;
  let businessName        = 'Ellie AI Receptionist';
  let businessDescription = '';
  let businessPhone       = '';
  let businessLocation    = '';
  let businessType        = '';

  if (businessWebsite) {
    const siteUrl = /^https?:\/\//i.test(businessWebsite) ? businessWebsite : `https://${businessWebsite}`;
    try {
      businessName = new URL(siteUrl).hostname.replace(/^www\./i, '');
    } catch {
      businessName = String(businessWebsite).replace(/^https?:\/\//i, '').replace(/^www\./i, '').split('/')[0].split('?')[0];
    }
    businessContext = `Website: ${siteUrl}`;

    try {
      // ── Attempt 1: Jina AI Reader ─────────────────────────────
      // Returns clean markdown from any page including JS-rendered SPAs.
      // Free, no API key, handles navigation/cookie-banner removal.
      let jinaTitle   = '';
      let jinaDesc    = '';
      let jinaContent = '';
      let jinaOk      = false;

      try {
        const jinaRes = await fetch(`https://r.jina.ai/${siteUrl}`, {
          headers: {
            'Accept': 'application/json',
            'X-Remove-Selector': 'nav, footer, header, .cookie-notice, .cookie-banner, .popup, .modal',
            'X-Timeout': '8',
          },
          signal: AbortSignal.timeout(10000),
        });
        if (jinaRes.ok) {
          const jinaJson = await jinaRes.json();
          jinaTitle   = jinaJson.data?.title       || '';
          jinaDesc    = jinaJson.data?.description || '';
          jinaContent = jinaJson.data?.content     || '';
          jinaOk = !!(jinaTitle || jinaContent);
        }
      } catch (_) {}

      if (jinaOk) {
        // ── Extract structured fields from Jina markdown ──────────
        const content = jinaContent;

        // Phone: Australian mobile and landline patterns
        const phoneMatch = content.match(/(?:\+?61[\s\-]?|0)[2-9]\d{8}|\b04\d{2}[\s\-]?\d{3}[\s\-]?\d{3}\b/);
        const phone = phoneMatch?.[0]?.trim() || '';

        // Hours: lines containing day names or 24/7
        const hoursMatches = [
          ...content.matchAll(/((?:Mon(?:day)?|Tue(?:sday)?|Wed(?:nesday)?|Thu(?:rsday)?|Fri(?:day)?|Sat(?:urday)?|Sun(?:day)?|Weekday|Weekend|24\/7|Daily)[^\n.]{5,80})/gi),
        ].map(m => m[1].trim()).slice(0, 4);
        const hours = hoursMatches.join('; ');

        // Location: look for suburb + Australian state
        const locationMatch = content.match(/\b([A-Z][a-zA-Z\s]{2,30},?\s+(?:SA|NSW|VIC|QLD|WA|NT|ACT|TAS)\b[^.\n]{0,40})/);
        const location = locationMatch?.[1]?.trim() || '';

        // Services: markdown headings, filtered against boilerplate words
        const boilerplate = new Set([
          'home', 'about', 'about us', 'contact', 'contact us', 'faq', 'blog', 'gallery',
          'testimonials', 'menu', 'navigation', 'footer', 'header', 'privacy', 'terms',
          'sitemap', 'login', 'sign up', 'subscribe', 'newsletter', 'get in touch',
          'reach us', 'find us', 'our team', 'meet the team', 'reviews', 'book now',
        ]);
        const services = [...content.matchAll(/^#{1,3}\s+(.{5,70})$/gm)]
          .map(m => m[1].trim())
          .filter(s => !boilerplate.has(s.toLowerCase()) && !/^(#|\d+\.)/.test(s))
          .slice(0, 8)
          .join(', ');

        // Clean content snippet — strip markdown syntax, trim to 2500 chars
        const snippet = content
          .replace(/!\[.*?\]\(.*?\)/g, '')   // images
          .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // links → keep text
          .replace(/^#{1,6}\s+/gm, '')        // heading markers
          .replace(/[*_`~]{1,3}/g, '')         // bold/italic/code
          .replace(/\n{3,}/g, '\n\n')
          .trim()
          .slice(0, 2500);

        if (jinaTitle) businessName        = jinaTitle;
        if (jinaDesc)  businessDescription = jinaDesc;
        if (phone)     businessPhone       = phone;
        if (location)  businessLocation    = location;

        const parts = [];
        if (jinaTitle) parts.push(`Business name: "${jinaTitle}"`);
        if (jinaDesc)  parts.push(`About: ${jinaDesc}`);
        if (phone)     parts.push(`Phone: ${phone}`);
        if (location)  parts.push(`Location: ${location}`);
        if (hours)     parts.push(`Hours: ${hours}`);
        if (services)  parts.push(`Services/offerings: ${services}`);
        parts.push(`Website: ${siteUrl}`);
        if (snippet)   parts.push(`\nFull page content:\n${snippet}`);
        businessContext = parts.join('. ');

      } else {
        // ── Attempt 2: Direct HTML fetch + schema.org fallback ────
        const res = await fetch(siteUrl, {
          headers: { 'User-Agent': 'Mozilla/5.0 (compatible; EllieAI/1.0)' },
          signal: AbortSignal.timeout(5000),
        });
        if (res.ok) {
          const html = await res.text();

          const extractMeta = (patterns) => {
            for (const re of patterns) {
              const m = html.match(re);
              if (m?.[1]?.trim()) return m[1].trim().slice(0, 300);
            }
            return '';
          };

          const title = extractMeta([
            /<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i,
            /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:title["']/i,
            /<title[^>]*>([^<]+)<\/title>/i,
          ]);
          const desc = extractMeta([
            /<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i,
            /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:description["']/i,
            /<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i,
            /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']description["']/i,
          ]);
          const phone = extractMeta([
            /href=["']tel:([+\d\s\-().]{6,20})["']/i,
            /(?:phone|call us|tel|mob(?:ile)?)[^\w][\s:"'>]*([+\d][\d\s\-().]{5,18}\d)/i,
          ]);

          // Schema.org JSON-LD
          const ldBlocks = html.match(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi) || [];
          const ldItems = [];
          for (const block of ldBlocks) {
            try {
              const obj = JSON.parse(block.replace(/<\/?script[^>]*>/gi, ''));
              ldItems.push(...(Array.isArray(obj) ? obj : [obj]));
            } catch (_) {}
          }

          let location = '';
          for (const item of ldItems) {
            const addr = item.address || item.location?.address;
            if (addr) {
              const p = [addr.streetAddress, addr.addressLocality, addr.addressRegion, addr.addressCountry].filter(Boolean);
              if (p.length) { location = p.join(', '); break; }
            }
          }

          const skipTypes = new Set(['WebPage', 'WebSite', 'BreadcrumbList', 'SiteNavigationElement', 'ItemList']);
          let bizType = '';
          for (const item of ldItems) {
            const t = item['@type'];
            if (!t) continue;
            const candidate = Array.isArray(t) ? t.find(x => !skipTypes.has(x)) : (skipTypes.has(t) ? '' : t);
            if (candidate) { bizType = candidate.replace(/([A-Z])/g, ' $1').trim(); break; }
          }

          // Hours from schema.org openingHours
          let hours = '';
          for (const item of ldItems) {
            if (item.openingHours) {
              hours = (Array.isArray(item.openingHours) ? item.openingHours : [item.openingHours]).join(', ');
              break;
            }
            if (item.openingHoursSpecification) {
              const specs = Array.isArray(item.openingHoursSpecification)
                ? item.openingHoursSpecification : [item.openingHoursSpecification];
              hours = specs.map(s => `${(s.dayOfWeek || []).join('/')} ${s.opens || ''}–${s.closes || ''}`).join(', ');
              break;
            }
          }

          // Extra content from headings
          const h1 = (html.match(/<h1[^>]*>([^<]{5,120})<\/h1>/i) || [])[1]?.trim() || '';
          const h2s = [...html.matchAll(/<h2[^>]*>([^<]{5,100})<\/h2>/gi)]
            .map(m => m[1].trim()).slice(0, 6).join(', ');

          if (title)    businessName        = title;
          if (desc)     businessDescription = desc;
          if (phone)    businessPhone       = phone;
          if (location) businessLocation    = location;
          if (bizType)  businessType        = bizType;

          const parts = [];
          if (title)    parts.push(`Business name: "${title}"`);
          if (bizType)  parts.push(`Business type: ${bizType}`);
          if (desc)     parts.push(`About: ${desc}`);
          if (phone)    parts.push(`Phone: ${phone}`);
          if (location) parts.push(`Location: ${location}`);
          if (hours)    parts.push(`Hours: ${hours}`);
          if (h1)       parts.push(`Main service: ${h1}`);
          if (h2s)      parts.push(`Sections: ${h2s}`);
          parts.push(`Website: ${siteUrl}`);
          businessContext = parts.join('. ');
        }
      }
    } catch (_) {}
  }

  const systemPrompt = businessContext
    ? `You are Ellie, the AI receptionist for ${businessName}. You are on a live call with a customer.

Business context:
${businessContext}

Persona: Warm, professional, calm under pressure. Speak in natural Australian English. Never sound robotic.

How to handle calls:
- Greet: "Thanks for calling ${businessName}, this is Ellie. How can I help you today?"
- For bookings: collect name, phone number, preferred date/time, and reason. Confirm back to them.
- For questions you can answer from the context above: answer confidently and briefly.
- For questions you cannot answer: "I'll make sure the team gets back to you on that — can I take your name and number?"
- For after-hours enquiries: "We're closed right now but I can take your details and the team will call you first thing."
- If directly asked if you're an AI: be honest, then reassure them you can still fully help.

Keep responses under 45 words unless the caller asks for more detail. Never make up pricing, hours, or services not in the context above.`
    : `You are Ellie — a warm, confident AI receptionist built by New Callings (newcallings.com.au).
You are on a live demo call with a small business owner curious about whether Ellie could work for them.

Your personality: friendly, professional, a little witty, never robotic. You speak natural Australian English.

Your goal: Show them exactly how you'd handle their real calls. Gently guide them toward entering their website URL for a personalised demo, or booking a free setup call.

Demo flow:
1. Greet them warmly and acknowledge this is a demo.
2. Ask what kind of business they run.
3. Demonstrate how you'd answer their calls — take a pretend booking, handle an after-hours enquiry, etc.
4. Highlight key benefits naturally in conversation: 24/7 coverage, no missed calls, instant SMS confirmation, calendar integration.
5. If they ask about pricing, say plans start from $99 AUD/month with no lock-in contracts.
6. Close by encouraging them to enter their website for a personalised demo or book a free 30-min setup call at anupama.dev.

Guardrails:
- Keep responses under 40 words unless asked for detail.
- Never fabricate specific technical integrations you are unsure of.
- If asked if you are an AI, say yes honestly — then point out that customers often cannot tell.
- Do not discuss competitors.`;

  const firstMessage = businessContext
    ? `Thanks for calling ${businessName}, this is Ellie. How can I help you today?`
    : `Hi there! You've reached Ellie — I'm an AI receptionist. Is this a demo call, or would you like to see how I'd handle calls for your specific business?`;

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({
      publicKey:   process.env.VAPI_PUBLIC_KEY,
      assistantId: process.env.VAPI_WEB_ASSISTANT_ID,
      assistantOverrides: {
        firstMessage,
        model: {
          provider: 'openai',
          model:    'gpt-4o',
          messages: [{ role: 'system', content: systemPrompt }],
        },
      },
      businessName,
      businessDescription,
      businessPhone,
      businessLocation,
      businessType,
    }),
  };
};
