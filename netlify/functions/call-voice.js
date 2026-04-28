const BIZ_CONFIGS = {
  hair: {
    name: 'Bella Hair Studio',
    greeting: "Good afternoon! Thanks for calling Bella Hair Studio. I'm Nova, your AI receptionist. How can I help you today?",
    services: 'haircuts from $45, colour and highlights from $95, blowouts $45, deep conditioning treatments',
    hours: 'Tuesday to Saturday, 9 AM to 6 PM — closed Sunday and Monday',
    booking: 'appointment slots available Tuesday through Saturday, mornings and afternoons',
  },
  auto: {
    name: 'Elite Auto Service',
    greeting: "G'day! Thanks for calling Elite Auto Service. I'm Nova, your AI receptionist. How can I help?",
    services: 'log book servicing, general repairs, tyres, brakes, roadworthy inspections — all makes and models',
    hours: 'Monday to Friday 7:30 AM to 5 PM, Saturday 8 AM to 1 PM',
    booking: 'bookings available Monday through Saturday, drop-off or wait-while-you-wait',
  },
  cleaning: {
    name: 'Sparkle Cleaning Co.',
    greeting: "Hello! Thanks for calling Sparkle Cleaning. I'm Nova. How can I help you today?",
    services: 'regular home cleaning, end of lease, office cleaning, carpet steam cleaning, spring cleans',
    hours: 'Monday to Saturday, 7 AM to 6 PM',
    booking: 'bookings available Monday through Saturday, one-off or regular scheduled cleans',
  },
  medical: {
    name: 'City Health Clinic',
    greeting: "Good afternoon, City Health Clinic. I'm Nova, your AI receptionist. How can I assist you today?",
    services: 'GP consultations, health assessments, chronic disease management, referrals, pathology',
    hours: 'Monday to Friday 8 AM to 6 PM, Saturday 9 AM to 1 PM — bulk billing available',
    booking: 'same-day and future appointments available, urgent appointments prioritised',
  },
  restaurant: {
    name: 'The Garden Bistro',
    greeting: "Hello! The Garden Bistro, I'm Nova. How can I help you today?",
    services: 'dine-in, takeaway, private dining and function bookings for up to 40 guests',
    hours: 'Tuesday to Sunday, 11 AM to 10 PM — closed Mondays',
    booking: 'table reservations and function enquiries available any time',
  },
  realestate: {
    name: 'Prime Property Group',
    greeting: "Good afternoon! Prime Property Group, I'm Nova. How can I help you today?",
    services: 'residential sales, property management, rentals, market appraisals',
    hours: 'Monday to Saturday 9 AM to 5 PM',
    booking: 'inspection and appraisal bookings available during business hours',
  },
  default: {
    name: 'the business',
    greeting: "Hello! Thanks for calling. I'm Nova, your AI receptionist. How can I help you today?",
    services: 'our full range of services',
    hours: 'standard business hours',
    booking: 'appointment slots available during business hours',
  },
};

function getBiz(bizType) {
  const t = (bizType || '').toLowerCase();
  if (t.includes('hair') || t.includes('beauty') || t.includes('salon')) return BIZ_CONFIGS.hair;
  if (t.includes('auto') || t.includes('mech') || t.includes('car'))     return BIZ_CONFIGS.auto;
  if (t.includes('clean'))                                                 return BIZ_CONFIGS.cleaning;
  if (t.includes('med') || t.includes('clinic') || t.includes('health')) return BIZ_CONFIGS.medical;
  if (t.includes('rest') || t.includes('caf') || t.includes('food'))     return BIZ_CONFIGS.restaurant;
  if (t.includes('real') || t.includes('property'))                       return BIZ_CONFIGS.realestate;
  return BIZ_CONFIGS.default;
}

function buildSystemPrompt(biz) {
  return `You are Nova, an AI receptionist for "${biz.name}" — this is a live voice demo of the Nova AI Receptionist product built by anupama.dev.

Handle the caller's enquiry naturally, professionally, and warmly — exactly as a great receptionist would on a phone call.

Business details:
- Name: ${biz.name}
- Services: ${biz.services}
- Hours: ${biz.hours}
- Bookings: ${biz.booking}

Rules:
- You're on a voice call — keep responses SHORT and natural (2–3 sentences max)
- Warm, conversational tone — never robotic or list-heavy
- When booking: ask for name, mobile number, preferred day and time, one question at a time
- Before wrapping up a booking, confirm the details back to the caller
- If asked if you're AI: confirm you're Nova, an AI receptionist — built by anupama.dev
- Never invent services, pricing, or information not listed above
- Stay in character throughout the call`;
}

function encodeHistory(history) {
  const compact = history.slice(-8).map(m => [m.role[0], m.content]);
  return Buffer.from(JSON.stringify(compact)).toString('base64');
}

function decodeHistory(encoded) {
  if (!encoded) return [];
  try {
    const compact = JSON.parse(Buffer.from(encoded, 'base64').toString());
    return compact.map(([r, c]) => ({ role: r === 'u' ? 'user' : 'assistant', content: c }));
  } catch { return []; }
}

function xml(str) {
  return (str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

exports.handler = async (event) => {
  const params  = event.queryStringParameters || {};
  const bizType = params.biz || '';
  const biz     = getBiz(bizType);
  const baseUrl = process.env.URL || `https://${event.headers.host}`;

  // Parse POST body for Twilio's SpeechResult
  let speechResult = '';
  if (event.body) {
    const body = new URLSearchParams(event.body);
    speechResult = (body.get('SpeechResult') || '').trim();
  }

  let history = decodeHistory(params.h || '');
  let responseText;

  if (!speechResult) {
    // Initial call — speak greeting immediately
    responseText = biz.greeting;
  } else {
    // User spoke — send to Claude
    history.push({ role: 'user', content: speechResult });

    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method:  'POST',
        headers: {
          'x-api-key':         process.env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
          'content-type':      'application/json',
        },
        body: JSON.stringify({
          model:      'claude-haiku-4-5-20251001',
          max_tokens: 150,
          system:     buildSystemPrompt(biz),
          messages:   history,
        }),
      });
      const data = await res.json();
      responseText = data.content?.[0]?.text || "I'm sorry, I didn't catch that. Could you say that again?";
    } catch {
      responseText = "I'm sorry, I'm having a little trouble. Could you repeat that?";
    }
  }

  history.push({ role: 'assistant', content: responseText });
  const newH = encodeURIComponent(encodeHistory(history));
  const actionUrl = `${baseUrl}/.netlify/functions/call-voice?biz=${encodeURIComponent(bizType)}&h=${newH}`;

  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna-Neural">${xml(responseText)}</Say>
  <Gather input="speech" action="${xml(actionUrl)}" method="POST" speechTimeout="auto" language="en-AU" timeout="6">
  </Gather>
  <Say voice="Polly.Joanna-Neural">I didn't catch that — no problem at all. Thanks for trying Nova! Have a great day. Goodbye.</Say>
  <Hangup/>
</Response>`;

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'text/xml; charset=utf-8' },
    body: twiml,
  };
};
