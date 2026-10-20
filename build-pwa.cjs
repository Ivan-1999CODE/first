'use strict';

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const ROOT = __dirname;
const BASE = 'https://travel-lab.invalid/';
const TEMPLATE = 'assets/service-worker-template.js';
const ICONS = ['assets/pwa-icon.svg', 'assets/pwa-icon-192.png', 'assets/pwa-icon-512.png', 'assets/pwa-icon-180.png'];
const TEXT_FILE = /\.(?:html|js|css|json|webmanifest|svg)$/i;
const isLesson = name => /^travel-english.*\.html$/.test(name) || /^travel-(?:japanese|korean)-day0-directions\.html$/.test(name);
const digest = contents => crypto.createHash('sha256').update(contents).digest('hex');
const canonicalText = contents => Buffer.from(
  new TextDecoder('utf-8', { fatal: true, ignoreBOM: true }).decode(contents).replace(/\r\n?/g, '\n'),
  'utf8'
);

function attributes(tag) {
  const result = new Map();
  const expression = /([^\s=<>/"']+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+))/g;
  for (const match of tag.matchAll(expression)) {
    result.set(match[1].toLowerCase(), (match[2] ?? match[3] ?? match[4]).replace(/&amp;/g, '&'));
  }
  return result;
}

function buildPwa() {
  const lessons = fs.readdirSync(ROOT).filter(isLesson).sort();
  const documents = ['index.html', ...lessons];
  const contents = new Map();
  const pending = new Set([...documents, 'manifest.webmanifest', ...ICONS]);

  function dependency(reference, owner) {
    const value = reference.trim();
    if (!value || value.startsWith('#') || /^(?:data|blob):/i.test(value)) return;
    const url = new URL(value, new URL(owner, BASE));
    if (url.origin !== new URL(BASE).origin) {
      throw new Error(`離線教材不能依賴外站資源：${owner} → ${value}`);
    }
    if (value.startsWith('/')) {
      throw new Error(`資源請使用相對路徑，以支援子目錄部署：${owner} → ${value}`);
    }
    if (url.search) {
      throw new Error(`預快取資源請以檔案內容版本管理，不加查詢參數：${owner} → ${value}`);
    }
    const relative = decodeURIComponent(url.pathname.slice(1));
    if (!documents.includes(relative) && relative !== 'manifest.webmanifest' && !relative.startsWith('assets/')) {
      throw new Error(`資源不在教材發佈範圍內：${owner} → ${relative}`);
    }
    if (relative.endsWith('.cjs') || relative === TEMPLATE) {
      throw new Error(`建置來源不應成為執行時資源：${owner} → ${relative}`);
    }
    pending.add(relative);
  }

  function cssDependencies(css, owner) {
    for (const match of css.matchAll(/url\(\s*(?:"([^"]*)"|'([^']*)'|([^)\s]+))\s*\)/gi)) {
      dependency(match[1] ?? match[2] ?? match[3], owner);
    }
    for (const match of css.matchAll(/@import\s+(?:"([^"]+)"|'([^']+)')/gi)) {
      dependency(match[1] ?? match[2], owner);
    }
  }

  function htmlDependencies(html, owner) {
    // Script bodies can contain HTML examples and must not be mistaken for actual tags.
    const markup = html.replace(/<!--[\s\S]*?-->/g, '').replace(/(<script\b[^>]*>)[\s\S]*?<\/script\s*>/gi, '$1</script>');
    const tags = /<[a-z][\w:-]*(?:\s+(?:"[^"]*"|'[^']*'|[^'">])*)?\s*\/?>/gi;
    for (const match of markup.matchAll(tags)) {
      const tag = match[0];
      const name = /^<([\w:-]+)/.exec(tag)[1].toLowerCase();
      const attrs = attributes(tag);
      if (attrs.has('src')) dependency(attrs.get('src'), owner);
      if (attrs.has('poster')) dependency(attrs.get('poster'), owner);
      if (name === 'object' && attrs.has('data')) dependency(attrs.get('data'), owner);
      if (name === 'link' && attrs.has('href')) {
        const rel = (attrs.get('rel') || '').toLowerCase().split(/\s+/);
        if (rel.some(value => ['stylesheet', 'icon', 'apple-touch-icon', 'manifest', 'preload', 'modulepreload'].includes(value))) {
          dependency(attrs.get('href'), owner);
        }
      }
      if (attrs.has('srcset')) {
        // Current lessons use inline images. Reject ambiguous data-URL srcsets instead of silently missing candidates.
        const srcset = attrs.get('srcset');
        if (/data:/i.test(srcset)) throw new Error(`請改用單張內嵌 src，或本機檔案 srcset：${owner}`);
        for (const source of srcset.split(',')) dependency(source.trim().split(/\s+/)[0], owner);
      }
      if (attrs.has('style')) cssDependencies(attrs.get('style'), owner);
    }
    for (const match of html.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style\s*>/gi)) cssDependencies(match[1], owner);
  }

  while (pending.size) {
    const relative = pending.values().next().value;
    pending.delete(relative);
    if (contents.has(relative)) continue;
    const absolute = path.resolve(ROOT, relative);
    if (!absolute.startsWith(ROOT + path.sep)) throw new Error(`不合法的資源位置：${relative}`);
    const source = fs.readFileSync(absolute);
    // Windows checkouts and static hosts may use different line endings for identical text.
    const buffer = TEXT_FILE.test(relative) ? canonicalText(source) : source;
    contents.set(relative, buffer);
    if (relative.endsWith('.html')) htmlDependencies(buffer.toString('utf8'), relative);
    if (relative.endsWith('.css')) cssDependencies(buffer.toString('utf8'), relative);
    if (relative.endsWith('.webmanifest')) {
      const manifest = JSON.parse(buffer.toString('utf8'));
      for (const icon of manifest.icons || []) dependency(icon.src, relative);
    }
  }

  const files = [...contents].sort(([a], [b]) => a.localeCompare(b, 'en')).map(([relative, buffer]) => ({
    path: relative,
    bytes: buffer.length,
    sha256: digest(buffer),
    ...(TEXT_FILE.test(relative) ? { normalizedText: true } : {})
  }));
  const template = canonicalText(fs.readFileSync(path.join(ROOT, TEMPLATE))).toString('utf8');
  // No timestamps: the same final HTML, dependencies, and worker logic always produce the same version.
  const version = digest(JSON.stringify(files) + '\n' + template).slice(0, 16);
  const serviceWorker = template
    .replace('__TRAVEL_PWA_VERSION__', JSON.stringify(version))
    .replace('__TRAVEL_PWA_FILES__', JSON.stringify(files, null, 2))
    .replace('__TRAVEL_PWA_LESSONS__', String(lessons.length));
  fs.writeFileSync(path.join(ROOT, 'sw.js'), serviceWorker);
  const bytes = files.reduce((total, entry) => total + entry.bytes, 0);
  console.log(`PWA ${version}: ${lessons.length} 個單元、${files.length} 個檔案、${(bytes / 1024 / 1024).toFixed(1)} MiB`);
  return { version, lessons: lessons.length, files: files.length, bytes };
}

module.exports = buildPwa;
if (require.main === module) buildPwa();
