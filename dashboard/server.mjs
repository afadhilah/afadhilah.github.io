import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { compile } from '@mdx-js/mdx';
import remarkGfm from 'remark-gfm';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const BLOG_POSTS_DIR = path.join(ROOT, 'src', 'app', 'blog', 'posts');
const WORK_PROJECTS_DIR = path.join(ROOT, 'src', 'app', 'work', 'projects');
const CONTENT_DATA_PATH = path.join(ROOT, 'src', 'resources', 'content-data.json');
const PUBLIC_DIR = path.join(ROOT, 'public');
const PORT = 3001;

// ── Helpers ──────────────────────────────────────────────────────────

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try { resolve(JSON.parse(body)); }
      catch (e) { reject(e); }
    });
  });
}

function sendJSON(res, data, status = 200) {
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
  });
  res.end(JSON.stringify(data));
}

function sendHTML(res, html) {
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(html);
}

function sendError(res, msg, status = 400) {
  sendJSON(res, { error: msg }, status);
}

function parseFrontmatter(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) return { metadata: {}, content };

  const meta = {};
  const lines = match[1].split('\n');
  let currentKey = null;
  let currentArray = null;

  for (const line of lines) {
    const trimmed = line.trimEnd();
    // Array item
    if (/^\s+-\s/.test(trimmed) && currentKey) {
      const val = trimmed.replace(/^\s+-\s/, '').trim();
      if (!currentArray) currentArray = [];
      // Check if it's a key-value in an array item
      if (val.includes(': ')) {
        const colonIdx = val.indexOf(': ');
        const k = val.substring(0, colonIdx).trim();
        const v = val.substring(colonIdx + 2).trim().replace(/^["']|["']$/g, '');
        if (currentArray.length === 0 || typeof currentArray[currentArray.length - 1] === 'string') {
          currentArray.push({ [k]: v });
        } else {
          currentArray[currentArray.length - 1][k] = v;
        }
      } else {
        currentArray.push(val.replace(/^["']|["']$/g, ''));
      }
    }
    // New key-value pair
    else if (/^\w/.test(trimmed) && trimmed.includes(':')) {
      if (currentKey && currentArray) {
        meta[currentKey] = currentArray;
        currentArray = null;
      }
      const colonIdx = trimmed.indexOf(':');
      const key = trimmed.substring(0, colonIdx).trim();
      const val = trimmed.substring(colonIdx + 1).trim();
      currentKey = key;
      if (val === '' || val === '[]') {
        meta[key] = val === '[]' ? [] : undefined;
        if (val === '') currentArray = [];
      } else {
        meta[key] = val.replace(/^["']|["']$/g, '');
        currentArray = null;
      }
    }
    // Nested key-value (indented, part of array object)
    else if (/^\s{4}\w/.test(trimmed) && currentArray) {
      const colonIdx = trimmed.indexOf(':');
      if (colonIdx > -1) {
        const k = trimmed.substring(0, colonIdx).trim();
        const v = trimmed.substring(colonIdx + 1).trim().replace(/^["']|["']$/g, '');
        if (currentArray.length > 0 && typeof currentArray[currentArray.length - 1] === 'object') {
          currentArray[currentArray.length - 1][k] = v;
        }
      }
    }
  }
  if (currentKey && currentArray) {
    meta[currentKey] = currentArray;
  }

  return { metadata: meta, content: match[2] };
}

function buildFrontmatter(metadata) {
  let fm = '---\n';
  for (const [key, value] of Object.entries(metadata)) {
    if (value === undefined || value === null || value === '') continue;
    if (Array.isArray(value)) {
      if (value.length === 0) continue;
      fm += `${key}:\n`;
      for (const item of value) {
        if (typeof item === 'object') {
          const entries = Object.entries(item);
          fm += `  - ${entries[0][0]}: "${entries[0][1]}"\n`;
          for (let i = 1; i < entries.length; i++) {
            fm += `    ${entries[i][0]}: "${entries[i][1]}"\n`;
          }
        } else {
          fm += `  - "${item}"\n`;
        }
      }
    } else {
      fm += `${key}: "${value}"\n`;
    }
  }
  fm += '---\n';
  return fm;
}

function getMDXFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter(f => f.endsWith('.mdx'));
}

function slugify(filename) {
  return filename.replace(/\.mdx$/, '');
}

function getPosts(dir) {
  const files = getMDXFiles(dir);
  return files.map(file => {
    const raw = fs.readFileSync(path.join(dir, file), 'utf-8');
    const { metadata, content } = parseFrontmatter(raw);
    return { slug: slugify(file), metadata, content };
  }).sort((a, b) => {
    const da = new Date(a.metadata.publishedAt || 0);
    const db = new Date(b.metadata.publishedAt || 0);
    return db - da;
  });
}

function getImages(dir, prefix = '') {
  const results = [];
  if (!fs.existsSync(dir)) return results;
  for (const item of fs.readdirSync(dir)) {
    const full = path.join(dir, item);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      results.push(...getImages(full, `${prefix}${item}/`));
    } else if (/\.(jpg|jpeg|png|gif|svg|webp|avif)$/i.test(item)) {
      results.push(`/images/${prefix}${item}`);
    }
  }
  return results;
}

// ── Routes ───────────────────────────────────────────────────────────

async function handleRequest(req, res) {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const pathname = url.pathname;
  const method = req.method;

  // CORS preflight
  if (method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    });
    return res.end();
  }

  // ── Serve Dashboard HTML ──
  if (pathname === '/' && method === 'GET') {
    const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf-8');
    return sendHTML(res, html);
  }

  // ── Content Data (profile, home, about, etc.) ──
  if (pathname === '/api/content' && method === 'GET') {
    const data = JSON.parse(fs.readFileSync(CONTENT_DATA_PATH, 'utf-8'));
    return sendJSON(res, data);
  }

  if (pathname === '/api/content' && method === 'PUT') {
    const body = await parseBody(req);
    fs.writeFileSync(CONTENT_DATA_PATH, JSON.stringify(body, null, 2), 'utf-8');
    return sendJSON(res, { ok: true });
  }

  // ── Blog Posts ──
  if (pathname === '/api/posts' && method === 'GET') {
    return sendJSON(res, getPosts(BLOG_POSTS_DIR));
  }

  if (pathname === '/api/posts' && method === 'POST') {
    const body = await parseBody(req);
    const slug = body.slug || body.metadata.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const filePath = path.join(BLOG_POSTS_DIR, `${slug}.mdx`);
    if (fs.existsSync(filePath)) return sendError(res, 'Post already exists', 409);
    const content = buildFrontmatter(body.metadata) + '\n' + (body.content || '');
    fs.writeFileSync(filePath, content, 'utf-8');
    return sendJSON(res, { slug, ok: true }, 201);
  }

  const postMatch = pathname.match(/^\/api\/posts\/(.+)$/);
  if (postMatch && method === 'GET') {
    const slug = postMatch[1];
    const filePath = path.join(BLOG_POSTS_DIR, `${slug}.mdx`);
    if (!fs.existsSync(filePath)) return sendError(res, 'Not found', 404);
    const raw = fs.readFileSync(filePath, 'utf-8');
    const parsed = parseFrontmatter(raw);
    return sendJSON(res, { slug, ...parsed });
  }

  if (postMatch && method === 'PUT') {
    const slug = postMatch[1];
    const filePath = path.join(BLOG_POSTS_DIR, `${slug}.mdx`);
    if (!fs.existsSync(filePath)) return sendError(res, 'Not found', 404);
    const body = await parseBody(req);
    const content = buildFrontmatter(body.metadata) + '\n' + (body.content || '');
    fs.writeFileSync(filePath, content, 'utf-8');
    return sendJSON(res, { slug, ok: true });
  }

  if (postMatch && method === 'DELETE') {
    const slug = postMatch[1];
    const filePath = path.join(BLOG_POSTS_DIR, `${slug}.mdx`);
    if (!fs.existsSync(filePath)) return sendError(res, 'Not found', 404);
    fs.unlinkSync(filePath);
    return sendJSON(res, { ok: true });
  }

  // ── Work Projects ──
  if (pathname === '/api/projects' && method === 'GET') {
    return sendJSON(res, getPosts(WORK_PROJECTS_DIR));
  }

  if (pathname === '/api/projects' && method === 'POST') {
    const body = await parseBody(req);
    const slug = body.slug || body.metadata.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const filePath = path.join(WORK_PROJECTS_DIR, `${slug}.mdx`);
    if (fs.existsSync(filePath)) return sendError(res, 'Project already exists', 409);
    const content = buildFrontmatter(body.metadata) + '\n' + (body.content || '');
    fs.writeFileSync(filePath, content, 'utf-8');
    return sendJSON(res, { slug, ok: true }, 201);
  }

  const projMatch = pathname.match(/^\/api\/projects\/(.+)$/);
  if (projMatch && method === 'GET') {
    const slug = projMatch[1];
    const filePath = path.join(WORK_PROJECTS_DIR, `${slug}.mdx`);
    if (!fs.existsSync(filePath)) return sendError(res, 'Not found', 404);
    const raw = fs.readFileSync(filePath, 'utf-8');
    const parsed = parseFrontmatter(raw);
    return sendJSON(res, { slug, ...parsed });
  }

  if (projMatch && method === 'PUT') {
    const slug = projMatch[1];
    const filePath = path.join(WORK_PROJECTS_DIR, `${slug}.mdx`);
    if (!fs.existsSync(filePath)) return sendError(res, 'Not found', 404);
    const body = await parseBody(req);
    const content = buildFrontmatter(body.metadata) + '\n' + (body.content || '');
    fs.writeFileSync(filePath, content, 'utf-8');
    return sendJSON(res, { slug, ok: true });
  }

  if (projMatch && method === 'DELETE') {
    const slug = projMatch[1];
    const filePath = path.join(WORK_PROJECTS_DIR, `${slug}.mdx`);
    if (!fs.existsSync(filePath)) return sendError(res, 'Not found', 404);
    fs.unlinkSync(filePath);
    return sendJSON(res, { ok: true });
  }

  // ── Images ──
  if (pathname === '/api/images' && method === 'GET') {
    const images = getImages(path.join(PUBLIC_DIR, 'images'));
    return sendJSON(res, images);
  }

  // Serve image files for preview
  if (pathname.startsWith('/images/') && method === 'GET') {
    const imgPath = path.join(PUBLIC_DIR, pathname);
    if (!fs.existsSync(imgPath)) return sendError(res, 'Not found', 404);
    const ext = path.extname(imgPath).toLowerCase();
    const mimeTypes = {
      '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png',
      '.gif': 'image/gif', '.svg': 'image/svg+xml', '.webp': 'image/webp',
    };
    res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
    return fs.createReadStream(imgPath).pipe(res);
  }

  // ── Compile MDX (for live preview in dashboard) ──
  if (pathname === '/api/compile-mdx' && method === 'POST') {
    const body = await parseBody(req);
    const source = body.source || '';
    if (!source.trim()) {
      return sendJSON(res, { code: '' });
    }
    try {
      const compiled = await compile(source, {
        outputFormat: 'function-body',
        remarkPlugins: [remarkGfm],
        development: false,
      });
      return sendJSON(res, { code: String(compiled) });
    } catch (e) {
      console.error('MDX Compilation Error:', e);
      return sendJSON(res, { error: `MDX Compilation Error: ${e.message}` }, 400);
    }
  }

  sendError(res, 'Not found', 404);
}

// ── Start Server ─────────────────────────────────────────────────────

const server = http.createServer((req, res) => {
  handleRequest(req, res).catch(err => {
    console.error('Error:', err);
    sendError(res, err.message, 500);
  });
});

server.listen(PORT, () => {
  console.log(`\n  ✨ Portfolio Dashboard running at:\n`);
  console.log(`     http://localhost:${PORT}\n`);
  console.log(`  Managing:`);
  console.log(`     Blog posts: ${BLOG_POSTS_DIR}`);
  console.log(`     Work projects: ${WORK_PROJECTS_DIR}`);
  console.log(`     Content data: ${CONTENT_DATA_PATH}\n`);
});
