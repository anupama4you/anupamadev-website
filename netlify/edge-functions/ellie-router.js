// Serves ellie.html at the root of ellie.anupama.dev without
// affecting any asset paths (images, JS, audio, etc.)
export default async (request, context) => {
  const url = new URL(request.url);
  if (url.hostname.startsWith('ellie.') && url.pathname === '/') {
    return context.rewrite('/ellie.html');
  }
};

export const config = { path: '/' };
