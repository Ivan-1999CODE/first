'use strict';

// The delivered lessons carry their approved curriculum in one-line JSON declarations.
// Read those declarations without evaluating browser scripts, artwork or saved answers.
const DATA_FIELDS = [
  'course', 'phrases', 'replies', 'rounds', 'flows', 'missions', 'pairs', 'quizzes',
  'originalPhrases', 'answerTranslations', 'chapterIntegration', 'day2Practice',
  'hotelIntegration', 'homeAnswer'
];
const declarations = new RegExp(
  '\\bconst (' + DATA_FIELDS.join('|') + ')\\s*=\\s*([\\[{"][^\\r\\n]*);\\r?$', 'gm'
);
const SPOKEN_FIELDS = new Set([
  'en', 'line', 'answer', 'changeAnswer', 'baseAnswer', 'base', 'reply', 'start',
  'homeAnswer', 'sentences', 'teacher', 'student', 'reference', 'example'
]);
const ENGLISH = /^[\p{Script=Latin}\p{M}0-9\s$£€%:;,/.!?…'’‘“”"()–—-]+$/u;

function forPage(fileName, html) {
  if (!/^travel-english(?:-unit\d+-[\w-]+)?\.html$/.test(fileName)) {
    throw new Error('Expected an English lesson file: ' + fileName);
  }
  // Re-inventorying a delivered page must not carry retired examples forward
  // merely because their old recording keys still appear in its embedded data.
  html = require('./english-audio-build.cjs').strip(html);
  const texts = new Set();
  function add(value) {
    if (typeof value !== 'string') return;
    const text = value.trim();
    if (text && ENGLISH.test(text) && /[A-Za-z]/.test(text)) texts.add(text);
    if (text.includes(' / ')) for (const part of text.split(' / ')) add(part);
  }
  function word(value) {
    if (typeof value !== 'string') return;
    // Normal and slow vocabulary buttons speak slash-separated alternatives as a list.
    add(value);
    add(value.replaceAll(' / ', '. '));
  }
  function visit(value, field) {
    if (typeof value === 'string') {
      if (SPOKEN_FIELDS.has(field)) add(value);
      // Teacher notes sometimes introduce a further example inside Chinese prose.
      // Frame ellipses are retained for the visible phrase, and a slash represents alternatives.
      if (/[\u3400-\u9fff]/u.test(value) && /[A-Za-z]/.test(value) && !value.includes('<')) {
        for (const match of value.matchAll(/[\p{Script=Latin}][\p{Script=Latin}\p{M}\d ’',.!?…/-]*/gu)) {
          const segment = match[0].trim();
          if (field === 'note' || (/^[A-Z]/.test(segment) && /[.!?]$/.test(segment))) add(segment);
        }
      }
      return;
    }
    if (!value || typeof value !== 'object') return;
    if (Array.isArray(value)) {
      for (const item of value) visit(item, field);
      return;
    }
    if (Array.isArray(value.words)) {
      for (const entry of value.words) if (Array.isArray(entry)) word(entry[0]);
    }
    if (Array.isArray(value.cards)) {
      for (const entry of value.cards) if (Array.isArray(entry)) add(entry[1]);
    }
    if (Array.isArray(value.from)) word(value.from[0]);
    if (Array.isArray(value.to)) word(value.to[0]);
    if (value.word && !value.word.includes('→')) word(value.word);
    if (value.en && value.substitutions) {
      for (const group of value.substitutions) {
        word(group.target);
        for (const [term] of group.options) {
          word(term);
          add(value.en.replace(group.target, term));
        }
      }
    }
    for (const item of value.illustratedOptions || []) add(item.en + ', please.');
    for (const [key, child] of Object.entries(value)) visit(child, key);
  }
  let phraseData = false;
  for (const [, field, source] of html.matchAll(declarations)) {
    const data = JSON.parse(source);
    if (field === 'phrases') phraseData = true;
    if (field === 'answerTranslations') Object.keys(data).forEach(add);
    else visit(data, field);
  }
  if (!phraseData || !texts.size) throw new Error('No English curriculum in ' + fileName);
  // A few authored conversations (e.g. the Day 1 capstone) are literal runtime
  // examples rather than JSON. Include sentence literals without reading UI code.
  const scripts = html.replace(declarations, '');
  for (const match of scripts.matchAll(/(?:[>'"`])([A-Z][A-Za-z0-9$£€ ,.!?’-]{0,150}[.!?])(?=[<'"`])/g)) {
    add(match[1]);
  }
  return [...texts].sort();
}
module.exports = { forPage };
