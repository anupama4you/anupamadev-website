exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };

  let businessWebsite;
  try { businessWebsite = JSON.parse(event.body || '{}').businessWebsite; } catch {}

  // ── Fetch business context if URL provided ────────────────
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
      const res = await fetch(siteUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; EllieAI/1.0)' },
        signal: AbortSignal.timeout(5000),
      });
      if (res.ok) {
        const html = await res.text();

        const extract = (patterns) => {
          for (const re of patterns) {
            const m = html.match(re);
            if (m?.[1]?.trim()) return m[1].trim().slice(0, 300);
          }
          return '';
        };

        const title = extract([
          /<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i,
          /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:title["']/i,
          /<title[^>]*>([^<]+)<\/title>/i,
        ]);
        const desc = extract([
          /<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i,
          /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:description["']/i,
          /<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i,
          /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']description["']/i,
        ]);

        // Phone — tel: links first, then label patterns
        const phone = extract([
          /href=["']tel:([+\d\s\-().]{6,20})["']/i,
          /(?:phone|call us|tel|mob(?:ile)?)[^\w][\s:"'>]*([+\d][\d\s\-().]{5,18}\d)/i,
        ]);

        // Parse schema.org JSON-LD blocks once
        const ldBlocks = html.match(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi) || [];
        const ldItems = [];
        for (const block of ldBlocks) {
          try {
            const obj = JSON.parse(block.replace(/<\/?script[^>]*>/gi, ''));
            const arr = Array.isArray(obj) ? obj : [obj];
            ldItems.push(...arr);
          } catch (_) {}
        }

        // Location from schema.org
        let location = '';
        for (const item of ldItems) {
          const addr = item.address || item.location?.address;
          if (addr) {
            const p = [addr.streetAddress, addr.addressLocality, addr.addressRegion, addr.addressCountry].filter(Boolean);
            if (p.length) { location = p.join(', '); break; }
          }
        }

        // Business type from schema.org
        let bizType = '';
        const skipTypes = new Set(['WebPage', 'WebSite', 'BreadcrumbList', 'SiteNavigationElement', 'ItemList']);
        for (const item of ldItems) {
          const t = item['@type'];
          if (!t) continue;
          const candidate = Array.isArray(t) ? t.find(x => !skipTypes.has(x)) : (skipTypes.has(t) ? '' : t);
          if (candidate) {
            bizType = candidate.replace(/([A-Z])/g, ' $1').trim();
            break;
          }
        }

        if (title) businessName        = title;
        if (desc)  businessDescription = desc;
        if (phone) businessPhone       = phone;
        if (location) businessLocation = location;
        if (bizType)  businessType     = bizType;

        const parts = [];
        if (title)    parts.push(`Business name: "${title}"`);
        if (desc)     parts.push(`About: ${desc}`);
        if (phone)    parts.push(`Phone: ${phone}`);
        if (location) parts.push(`Location: ${location}`);
        if (bizType)  parts.push(`Business type: ${bizType}`);
        parts.push(`Website: ${siteUrl}`);
        businessContext = parts.join('. ');
      }
    } catch (_) {}
  }

  const systemPrompt = businessContext
    ? `You are Ellie, the front-desk receptionist for this specific business:
${businessContext}

Critical behaviour:
- Act as this business's receptionist, not as a generic Ellie demo.
- Open with: "Thanks for calling ${businessName}, this is Ellie. How can I help?"
- Answer only from the business context above and the caller's words.
- If the caller asks about services, bookings, pricing, hours or location and the context does not contain the exact answer, say you can take their details and pass the message to the team.
- Collect the caller's name, phone number, reason for calling, and preferred time when handling a booking or enquiry.
- Never say you are unable to represent the business. You are the receptionist for this call.
- Use natural, concise Australian English. Keep responses under 30 words unless the caller asks for detail.`
    : `You are Ellie, an AI receptionist built by New Callings (newcallings.com). You are speaking with someone exploring whether Ellie could work for their business.

Be warm, friendly and professional. Explain that Ellie can answer calls 24/7, book appointments, send SMS confirmations and integrate with calendars. Encourage them to enter their business website for a personalised demo. Use natural, concise Australian English.`;

  const firstMessage = businessContext
    ? `Thanks for calling ${businessName}, this is Ellie. How can I help?`
    : `Hi! I'm Ellie, your AI receptionist. I'm here to show you what I can do for your business. What would you like to know?`;

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({
      publicKey:   process.env.VAPI_PUBLIC_KEY,
      assistantId: process.env.VAPI_WEB_ASSISTANT_ID,
      assistantOverrides: {
        firstMessage,
        model: {
          provider: 'anthropic',
          model:    'claude-haiku-4-5-20251001',
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
