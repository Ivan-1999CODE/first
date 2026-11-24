'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { embed, strip } = require('./assets/english-audio-build.cjs');
const { forPage } = require('./assets/english-audio-course.cjs');

function install(name) {
  const file = path.join(__dirname, name);
  const current = fs.readFileSync(file, 'utf8');
  let html = strip(current);
  const texts = forPage(name, html);
  // The base runtime is also used to build Japanese and Korean lessons. Only
  // replace the English lesson's initial audio hooks; keep shared navigation.
  html = html.replace(/^function speak\(text,slow=false\)\{[^\n]*speechSynthesis[^\n]*\}\r?$/m,
    'function speak(text,slow=false){return window.TravelEnglishAudio?.play(text,slow);}')
    .replace(/^function stopAudio\(\)\{[^\n]*speechSynthesis[^\n]*\}\r?$/m,
      'function stopAudio(){window.TravelEnglishAudio?.stop();}');
  const controls = fs.readFileSync(path.join(__dirname, 'assets/lesson-controls.js'), 'utf8');
  if (!html.includes('<script id="lesson-controls">')) throw Error('Missing lesson controls in ' + name);
  html = html.replace(/<script id="lesson-controls">[\s\S]*?<\/script>/, () =>
    '<script id="lesson-controls">\n' + controls + '</script>');
  if (/\bSpeechSynthesisUtterance\b|speechSynthesis\.speak\(/.test(html)) throw Error('Unconverted English speech handler in ' + name);
  const output = embed(html, texts);
  if (current !== output) fs.writeFileSync(file, output);
  return texts.length;
}
module.exports = install;
if (require.main === module) {
  const names = process.argv.slice(2);
  const files = names.length ? names : fs.readdirSync(__dirname).filter(name => /^travel-english.*\.html$/.test(name));
  for (const file of files) console.log(file + ' · ' + install(file) + ' 段英文錄音');
  require('./build-pwa.cjs')();
}
