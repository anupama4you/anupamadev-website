exports.handler = async () => ({
  statusCode: 200,
  headers: {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
  },
  body: JSON.stringify({
    publicKey:   process.env.VAPI_PUBLIC_KEY,
    assistantId: process.env.VAPI_EMMA_ASSISTANT_ID || process.env.VAPI_ASSISTANT_ID,
  }),
});
