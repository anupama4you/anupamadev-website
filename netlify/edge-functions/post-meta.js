export default async (request, context) => {
  const url = new URL(request.url);
  const slug = url.searchParams.get('slug');

  // Pass through non-post requests
  const response = await context.next();
  if (!slug) return response;

  try {
    const indexUrl = new URL('/posts/index.json', request.url);
    const posts = await fetch(indexUrl).then(r => r.json());
    const post = posts.find(p => p.slug === slug);
    if (!post) return response;

    const siteUrl = `${url.protocol}//${url.host}`;
    const pageUrl = request.url;
    const imageUrl = post.cover
      ? (post.cover.startsWith('http') ? post.cover : `${siteUrl}${post.cover}`)
      : `${siteUrl}/assets/og-default.png`;

    const esc = s => String(s)
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    const tags = `
    <meta property="og:type"        content="article">
    <meta property="og:title"       content="${esc(post.title)}">
    <meta property="og:description" content="${esc(post.excerpt)}">
    <meta property="og:url"         content="${esc(pageUrl)}">
    <meta property="og:image"       content="${esc(imageUrl)}">
    <meta property="og:site_name"   content="anupama.dev">
    <meta name="twitter:card"        content="summary_large_image">
    <meta name="twitter:title"       content="${esc(post.title)}">
    <meta name="twitter:description" content="${esc(post.excerpt)}">
    <meta name="twitter:image"       content="${esc(imageUrl)}">`;

    const html = await response.text();
    const modified = html.replace('</head>', `${tags}\n  </head>`);

    return new Response(modified, {
      status: response.status,
      headers: response.headers,
    });
  } catch {
    return response;
  }
};

export const config = { path: '/post.html' };
