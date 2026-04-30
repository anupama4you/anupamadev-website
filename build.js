const fs   = require('fs');
const path = require('path');

const postsDir = path.join(__dirname, 'posts');
const outFile  = path.join(postsDir, 'index.json');

function parseFrontMatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return null;

  const meta = {};
  match[1].split('\n').forEach(line => {
    const colon = line.indexOf(':');
    if (colon === -1) return;
    const key = line.slice(0, colon).trim();
    const val = line.slice(colon + 1).trim().replace(/^["'](.*)["']$/, '$1');
    if (key) meta[key] = val;
  });

  // Parse tags list (- item format)
  const tagsMatch = content.match(/^tags:\n((?:\s+-\s+.+\n?)+)/m);
  if (tagsMatch) {
    meta.tags = tagsMatch[1]
      .split('\n')
      .map(l => l.replace(/^\s+-\s+/, '').trim())
      .filter(Boolean);
  } else if (meta.tags) {
    meta.tags = meta.tags.split(',').map(t => t.trim()).filter(Boolean);
  }

  return meta;
}

function buildIndex() {
  const files = fs.existsSync(postsDir)
    ? fs.readdirSync(postsDir).filter(f => f.endsWith('.md'))
    : [];

  const posts = files
    .map(file => {
      const content = fs.readFileSync(path.join(postsDir, file), 'utf8');
      const meta    = parseFrontMatter(content);
      if (!meta || !meta.title) return null;

      return {
        filename: file,
        slug:     meta.slug || file.replace(/^\d{4}-\d{2}-\d{2}-/, '').replace('.md', ''),
        title:    meta.title,
        date:     meta.date  || '',
        excerpt:  meta.excerpt || '',
        cover:    meta.cover || '',
        tags:     meta.tags  || [],
      };
    })
    .filter(Boolean)
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  fs.writeFileSync(outFile, JSON.stringify(posts, null, 2));
  console.log(`[${new Date().toLocaleTimeString()}] Blog index: ${posts.length} post(s) written`);
}

buildIndex();

// Watch mode: node build.js --watch
if (process.argv.includes('--watch')) {
  console.log('Watching posts/ for changes…');
  let debounce;
  fs.watch(postsDir, (event, filename) => {
    if (!filename || !filename.endsWith('.md')) return;
    clearTimeout(debounce);
    debounce = setTimeout(buildIndex, 150);
  });
}
