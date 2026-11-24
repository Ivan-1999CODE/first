'use strict';
const fs = require('node:fs');
const path = require('node:path');
const dir = path.join(__dirname, 'english-audio');
const player = fs.readFileSync(path.join(__dirname, 'english-audio-player.js'), 'utf8');
const styles = fs.readFileSync(path.join(__dirname, 'english-audio.css'), 'utf8');

function strip(html) {
  return html.replace(/<script id="english-ai-(?:data|player)"[^>]*>[\s\S]*?<\/script>\r?\n?/g, '')
    .replace(/<style id="english-ai-styles">[\s\S]*?<\/style>\r?\n?/g, '');
}

function embed(html, texts) {
  const manifest = JSON.parse(fs.readFileSync(path.join(dir, 'manifest.json'), 'utf8'));
  const recordings = Object.create(null);
  const encoded = new Map();
  for (const text of new Set(texts)) {
    const file = manifest[text];
    if (!file || !/^[\da-f]{20}\.mp3$/.test(file)) throw Error('Missing English recording: ' + text);
    if (!encoded.has(file)) {
      const bytes = fs.readFileSync(path.join(dir, file));
      if (!bytes.length) throw Error('Empty English recording: ' + file);
      encoded.set(file, 'data:audio/mpeg;base64,' + bytes.toString('base64'));
    }
    recordings[text] = encoded.get(file);
  }
  if (!encoded.size) throw Error('No English recordings for lesson');
  const safeJson = JSON.stringify(recordings).replace(/</g, '\\u003c');
  const markup = '<script id="english-ai-data" type="application/json">' + safeJson + '</script>\n' +
    '<script id="english-ai-player">\n' + player + '</script>\n';
  const plain = strip(html);
  const end = /<\/body>(?=\s*<\/html>\s*$)/i;
  if (!plain.includes('</head>') || !end.test(plain)) throw Error('Incomplete lesson document');
  return plain.replace('</head>', () => '<style id="english-ai-styles">\n' + styles + '</style>\n</head>')
    .replace(end, () => markup + '</body>');
}

module.exports = { embed, strip };
