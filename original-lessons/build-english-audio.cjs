'use strict';

const fs = require('node:fs');
const path = require('node:path');
const {embed} = require('../assets/english-audio-build.cjs');
const lines = require('./english-audio-lines.json');
const root = path.dirname(__dirname);

for (const [relative, texts] of Object.entries(lines)) {
  const file = path.join(root, relative);
  const html = fs.readFileSync(file, 'utf8');
  const updated = embed(html, texts);
  if (html !== updated) fs.writeFileSync(file, updated);
}
console.log('已將 AI 錄音嵌入 ' + Object.keys(lines).length + ' 份舊版英文教材。');
