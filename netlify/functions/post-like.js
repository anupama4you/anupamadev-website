const { getStore } = require('@netlify/blobs');

exports.handler = async (event) => {
  const slug = event.queryStringParameters?.slug;
  if (!slug) {
    return { statusCode: 400, body: JSON.stringify({ error: 'slug required' }) };
  }

  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
  };

  try {
    const store = getStore('post-likes');

    if (event.httpMethod === 'POST') {
      const current = await store.get(slug);
      const count = parseInt(current || '0') + 1;
      await store.set(slug, String(count));
      return { statusCode: 200, headers, body: JSON.stringify({ likes: count }) };
    }

    // GET — return current count
    const current = await store.get(slug);
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ likes: parseInt(current || '0') }),
    };
  } catch {
    return { statusCode: 200, headers, body: JSON.stringify({ likes: 0 }) };
  }
};
