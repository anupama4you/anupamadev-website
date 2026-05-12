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
  let businessContext = null;
  let businessName    = 'Ellie AI Receptionist';

  if (businessWebsite) {
    const siteUrl = /^https?:\/\//i.test(businessWebsite) ? businessWebsite : `https://${businessWebsite}`;
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
        if (title) businessName = title;
        const parts = [];
        if (title) parts.push(`Business name: "${title}"`);
        if (desc)  parts.push(`About: ${desc}`);
        parts.push(`Website: ${siteUrl}`);
        businessContext = parts.join('. ');
      }
    } catch (_) {}
  }

  // ── Build dynamic system prompt ───────────────────────────
  const systemPrompt = businessContext
    ? `You are Ellie, a warm and professional AI receptionist for the following business.
${businessContext}

Greet callers using the business name. Answer questions about their services, hours and pricing based on the context above. Handle bookings naturally. If you don't know a specific detail, offer to take a message for the team. Speak in natural, friendly Australian English. Keep responses concise — under 30 words unless a question requires more.`
    : `You are Ellie, an AI receptionist built by New Callings (newcallings.com). You are speaking with someone who is exploring whether Ellie could work for their business.

Be warm, friendly and professional. Demonstrate what you can do — explain that you answer calls 24/7, book appointments, send SMS confirmations and integrate with calendars. Answer questions about Ellie's features and pricing. Encourage them to enter their business website to see a personalised demo. Speak in natural, friendly Australian English. Keep responses concise — under 30 words unless a question requires more.`;

  const firstMessage = businessContext
    ? `Hi there, thanks for calling ${businessName}! This is Ellie — how can I help you today?`
    : `Hi! I'm Ellie, your AI receptionist. I'm here to show you what I can do for your business. What would you like to know?`;

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({
      publicKey:    process.env.VAPI_PUBLIC_KEY,
      assistantId:  process.env.VAPI_WEB_ASSISTANT_ID,
      assistantOverrides: {
        firstMessage,
        model: {
          provider: 'anthropic',
          model:    'claude-haiku-4-5-20251001',
          messages: [{ role: 'system', content: systemPrompt }],
        },
      },
      businessName,
    }),
  };
};
