'use strict';
const fs = require('node:fs');
const path = require('node:path');
const dir = path.join(__dirname, 'english-audio');
const player = fs.readFileSync(path.join(__dirname, 'english-audio-player.js'), 'utf8');
const styles = fs.readFileSync(path.join(__dirname, 'english-audio.css'), 'utf8');

function strip(html) {
  return html.replace(/<script id="english-ai-(?:data|player|voices|voice-picker)"[^>]*>[\s\S]*?<\/script>\r?\n?/g, '')
    .replace(/<style id="english-ai-(?:styles|voice-styles)">[\s\S]*?<\/style>\r?\n?/g, '');
}

function recordingDirectory(pageName) {
  return pageName === 'travel-english.html' ? path.join(dir, 'day1-us-female') : dir;
}

function recordingPath(file, voice) {
  if (!voice) return path.join(dir, file);
  // The four auditioned Day 1 recordings for each line are also used by later lessons.
  const day1File = path.join(dir, 'day1-' + voice, file);
  if (fs.existsSync(day1File)) return day1File;
  return path.join(dir, 'voices', voice, file);
}

function readRecordings(texts, manifest, voice) {
  const recordings = Object.create(null);
  const encoded = new Map();
  for (const text of new Set(texts)) {
    const file = manifest[text];
    if (!file || !/^[\da-f]{20}\.mp3$/.test(file)) throw Error('Missing English recording: ' + text);
    if (!encoded.has(file)) {
      const bytes = fs.readFileSync(recordingPath(file, voice));
      if (!bytes.length) throw Error('Empty English recording: ' + file);
      encoded.set(file, 'data:audio/mpeg;base64,' + bytes.toString('base64'));
    }
    recordings[text] = encoded.get(file);
  }
  if (!encoded.size) throw Error('No English recordings for lesson');
  return recordings;
}

function jsonScript(id, value) {
  return '<script id="' + id + '" type="application/json">' + JSON.stringify(value).replace(/</g, '\\u003c') + '</script>\n';
}

function embed(html, texts, pageName) {
  const manifest = JSON.parse(fs.readFileSync(path.join(dir, 'manifest.json'), 'utf8'));
  const withVoices = /^travel-english(?:-unit\d+-[\w-]+)?\.html$/.test(pageName || '');
  let markup = jsonScript('english-ai-data', readRecordings(texts, manifest, withVoices ? 'us-female' : null));
  let styleMarkup = '<style id="english-ai-styles">\n' + styles + '</style>\n';
  if (withVoices) {
    const voices = {};
    for (const voice of ['uk-female', 'uk-male', 'us-male']) {
      voices[voice] = readRecordings(texts, manifest, voice);
    }
    markup += jsonScript('english-ai-voices', voices);
    const voiceStyles = fs.readFileSync(path.join(__dirname, 'day1-english-voices.css'), 'utf8');
    styleMarkup += '<style id="english-ai-voice-styles">\n' + voiceStyles + '</style>\n';
  }
  markup += '<script id="english-ai-player">\n' + player + '</script>\n';
  if (withVoices) {
    const picker = fs.readFileSync(path.join(__dirname, 'day1-english-voices.js'), 'utf8');
    markup += '<script id="english-ai-voice-picker">\n' + picker + '</script>\n';
  }
  const plain = strip(html);
  const end = /<\/body>(?=\s*<\/html>\s*$)/i;
  if (!plain.includes('</head>') || !end.test(plain)) throw Error('Incomplete lesson document');
  return plain.replace('</head>', () => styleMarkup + '</head>')
    .replace(end, () => markup + '</body>');
}

module.exports = { embed, strip, recordingDirectory, recordingPath };
