exports.handler = async (event) => {
  const assistant = event.queryStringParameters?.assistant;

  const assistantId = assistant === 'wam'
    ? process.env.VAPI_WAM_ASSISTANT_ID
    : process.env.VAPI_ASSISTANT_ID;

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
    body: JSON.stringify({
      publicKey: process.env.VAPI_PUBLIC_KEY,
      assistantId,
    }),
  };
};
