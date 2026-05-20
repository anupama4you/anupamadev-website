exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };

  let businessWebsite;
  try { businessWebsite = JSON.parse(event.body || '{}').businessWebsite; } catch {}

  let businessName        = 'Ellie AI Receptionist';
  let businessDescription = '';
  let businessPhone       = '';
  let businessLocation    = '';
  let businessType        = '';
  let systemPrompt, firstMessage;

  // ── Generic demo mode (no URL) ─────────────────────────────
  if (!businessWebsite) {
    systemPrompt = `You are Ellie — a warm, confident AI receptionist built by New Callings (newcallings.com.au).
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

    firstMessage = `Hi there! You've reached Ellie — I'm an AI receptionist. Is this a demo call, or would you like to see how I'd handle calls for your specific business?`;

  } else {
    // ── Personalised mode ──────────────────────────────────────
    const siteUrl = /^https?:\/\//i.test(businessWebsite)
      ? businessWebsite
      : `https://${businessWebsite}`;

    try {
      businessName = new URL(siteUrl).hostname.replace(/^www\./i, '');
    } catch {
      businessName = String(businessWebsite).replace(/^https?:\/\//i, '').replace(/^www\./i, '').split('/')[0];
    }

    // ── Parallel fetch: Jina AI reader + direct HTML ───────────
    // Running both simultaneously caps scraping time at ~6s instead of 15s.
    let jinaContent = '';
    let htmlContent = '';

    const [jinaResult, htmlResult] = await Promise.allSettled([
      fetch(`https://r.jina.ai/${siteUrl}`, {
        headers: {
          'Accept': 'application/json',
          'X-Remove-Selector': 'nav, footer, header, .cookie-notice, .cookie-banner',
          'X-Timeout': '5',
        },
        signal: AbortSignal.timeout(6000),
      }).then(async r => {
        if (!r.ok) return null;
        const j = await r.json();
        const title   = j.data?.title       || '';
        const content = j.data?.content     || '';
        return (title || content) ? `${title}\n${content}` : null;
      }),

      fetch(siteUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; EllieAI/1.0)' },
        signal: AbortSignal.timeout(4000),
      }).then(async r => {
        if (!r.ok) return null;
        const html  = await r.text();
        const title = (html.match(/<title[^>]*>([^<]+)<\/title>/i) || [])[1]?.trim() || '';
        const desc  = (
          html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']{10,300})["']/i) ||
          html.match(/<meta[^>]+content=["']([^"']{10,300})["'][^>]+name=["']description["']/i) ||
          [])[1]?.trim() || '';
        // Strip all tags for readable plain text
        const text = html
          .replace(/<script[\s\S]*?<\/script>/gi, '')
          .replace(/<style[\s\S]*?<\/style>/gi, '')
          .replace(/<[^>]+>/g, ' ')
          .replace(/&nbsp;/g, ' ')
          .replace(/&amp;/g, '&')
          .replace(/\s{2,}/g, ' ')
          .trim()
          .slice(0, 2000);
        return [title, desc, text].filter(Boolean).join('\n');
      }),
    ]);

    if (jinaResult.status === 'fulfilled' && jinaResult.value) jinaContent = jinaResult.value;
    if (htmlResult.status === 'fulfilled' && htmlResult.value) htmlContent = htmlResult.value;

    // Prefer Jina (richer content); fall back to stripped HTML
    const rawContent = jinaContent || htmlContent;

    // ── Claude Haiku: structured extraction ────────────────────
    // Works even with minimal content — can infer from domain name alone.
    try {
      const claudeInput = rawContent
        ? `Website: ${siteUrl}\n\nPage content:\n${rawContent.slice(0, 2800)}`
        : `Website: ${siteUrl}\n\n(Page content unavailable — infer from the domain name and URL)`;

      const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key':           process.env.ANTHROPIC_API_KEY,
          'anthropic-version':   '2023-06-01',
          'content-type':        'application/json',
        },
        body: JSON.stringify({
          model:      'claude-haiku-4-5-20251001',
          max_tokens: 500,
          messages: [{
            role:    'user',
            content: `Extract business information from this website for an AI receptionist. Return ONLY valid JSON, no markdown fences, no explanation.

${claudeInput}

Required JSON:
{
  "name": "full business name",
  "description": "one sentence about what they do",
  "phone": "phone number or empty string",
  "location": "suburb/city and state or empty string",
  "businessType": "e.g. Hair Salon, Dental Clinic, Plumber — or empty string",
  "receptionistContext": "3-4 sentences covering: key services, how bookings work, opening hours if known, and anything an AI receptionist needs to handle inbound calls naturally"
}`,
          }],
        }),
        signal: AbortSignal.timeout(8000),
      });

      if (claudeRes.ok) {
        const claudeData = await claudeRes.json();
        const raw = (claudeData.content?.[0]?.text?.trim() || '{}')
          .replace(/^```(?:json)?\s*/i, '')
          .replace(/\s*```$/, '');
        const info = JSON.parse(raw);

        if (info.name)         businessName        = info.name;
        if (info.description)  businessDescription = info.description;
        if (info.phone)        businessPhone       = info.phone;
        if (info.location)     businessLocation    = info.location;
        if (info.businessType) businessType        = info.businessType;

        const bizContext = info.receptionistContext
          || `${info.name || businessName} — ${info.description || ''}. Website: ${siteUrl}.`;

        systemPrompt = `You are Ellie, the AI receptionist for ${businessName}. You are on a live call with a customer.

Business context:
${bizContext}

Persona: Warm, professional, calm under pressure. Speak in natural Australian English. Never sound robotic.

How to handle calls:
- Greet: "Thanks for calling ${businessName}, this is Ellie. How can I help you today?"
- For bookings: collect name, phone number, preferred date/time, and reason. Confirm back to them.
- For questions answerable from the context above: answer confidently and briefly.
- For questions you cannot answer: "I'll make sure the team gets back to you on that — can I take your name and number?"
- For after-hours enquiries: "We're closed right now but I can take your details and the team will call you first thing."
- If directly asked if you're an AI: be honest, then reassure them you can still fully help.

Keep responses under 45 words unless the caller asks for more detail. Never make up pricing, hours, or services not in the context above.`;

        firstMessage = `Thanks for calling ${businessName}, this is Ellie. How can I help you today?`;
      }
    } catch (_) {}

    // ── Fallback if Claude failed ──────────────────────────────
    if (!systemPrompt) {
      systemPrompt = `You are Ellie, the AI receptionist for ${businessName}. Website: ${siteUrl}. Warm, professional, natural Australian English. Under 45 words per response.`;
      firstMessage = `Thanks for calling ${businessName}, this is Ellie. How can I help you today?`;
    }
  }

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
