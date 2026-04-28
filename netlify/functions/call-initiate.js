exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };

  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken  = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_PHONE_NUMBER;
  const baseUrl    = process.env.URL;

  if (!accountSid || !authToken || !fromNumber) {
    return {
      statusCode: 503,
      headers,
      body: JSON.stringify({ error: 'Live call demo is being set up — use the contact form below to book a real demo with Anupama.' }),
    };
  }

  try {
    const { phone, businessType } = JSON.parse(event.body);

    if (!phone || !businessType) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Phone number and industry are required.' }) };
    }

    const voiceUrl = `${baseUrl}/.netlify/functions/call-voice?biz=${encodeURIComponent(businessType)}`;
    const credentials = Buffer.from(`${accountSid}:${authToken}`).toString('base64');

    const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Calls.json`, {
      method: 'POST',
      headers: {
        Authorization:  `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({ To: phone, From: fromNumber, Url: voiceUrl, Method: 'POST' }),
    });

    const data = await res.json();

    if (!res.ok) throw new Error(data.message || 'Twilio error');

    return { statusCode: 200, headers, body: JSON.stringify({ status: 'calling', callSid: data.sid }) };
  } catch (err) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
