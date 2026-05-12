exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers, body: '{}' };

  let body;
  try { body = JSON.parse(event.body); } catch { return { statusCode: 400, headers, body: '{}' }; }

  const { businessWebsite } = body;
  if (!businessWebsite) return { statusCode: 400, headers, body: '{}' };

  const siteUrl = /^https?:\/\//i.test(businessWebsite) ? businessWebsite : `https://${businessWebsite}`;

  let businessName = siteUrl;
  let businessContext = `Business website: ${siteUrl}`;

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

  try {
    const aiRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 900,
        messages: [{
          role: 'user',
          content: `Create a realistic 6-turn inbound phone call demo for an AI receptionist named Ellie working for this business:

${businessContext}

Return ONLY a valid JSON array. Each object: { "role": "ellie" or "caller", "text": "...", "delay": <number 800-3400> }

Rules:
- Ellie opens with a warm greeting using the business name and asks how she can help
- Caller asks to book an appointment or enquire about a relevant service
- Ellie handles it naturally, asks for a preferred time, confirms the booking
- 6 turns total (ellie, caller, ellie, caller, ellie, caller or similar)
- Warm, natural Australian English
- Keep each message under 30 words
- Delays: ellie messages 800-1200ms, caller messages 2800-3600ms
- Return ONLY the raw JSON array, no markdown fences, no explanation`,
        }],
      }),
    });

    const aiData = await aiRes.json();
    const raw = (aiData.content?.[0]?.text?.trim() || '[]')
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```$/, '');
    const script = JSON.parse(raw);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ script, businessName }),
    };
  } catch (err) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
