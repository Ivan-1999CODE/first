'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const engine = require('./assets/day0-practice-engine.js');
const primer = require('./assets/day0-primer-data.cjs');

function random(seed) {
 let state = seed >>> 0;
 return () => { state = (Math.imul(state, 1664525) + 1013904223) >>> 0; return state / 4294967296; };
}
function freeze(value) {
 if (value && typeof value === 'object') { Object.values(value).forEach(freeze); Object.freeze(value); }
 return value;
}
const data = { ja: freeze(primer.make('ja')), ko: freeze(primer.make('ko')) };
const expected = Object.fromEntries(Object.entries(data).map(([lang, d]) => [lang, JSON.stringify(d)]));

// Independent, deliberately conservative oracle for ambiguous listening choices.
function soundFamily(option, language, category) {
 let sound = option.speakText.normalize('NFKC');
 if (language === 'ja') {
  sound = sound.replace(/[ァ-ヶ]/gu, c => String.fromCharCode(c.charCodeAt(0) - 96));
  return sound === 'を' ? 'お' : sound;
 }
 if (category === 'vowels') {
  if (['ae', 'e', 'yae', 'ye'].includes(option.romaji)) return 'caution-e';
  if (['wae', 'we', 'oe'].includes(option.romaji)) return 'caution-we';
 }
 return sound;
}
function checkQuestions(questions, language, mode, ids) {
 assert(questions.length <= 10);
 assert.equal(new Set(questions.map(q => q.id)).size, questions.length, 'No repeated target IDs');
 for (const q of questions) {
  assert(ids.includes(q.groupId), 'Targets remain within selected groups');
  assert(q.id.startsWith(q.groupId + ':'));
  assert.equal(typeof q.groupTitle, 'string');
  assert.equal(typeof q.prompt, 'string');
  assert.equal(typeof q.speakText, 'string');
  if (q.mode === 'read') {
   assert.deepEqual(q.options, []);
   assert.equal(q.correct, null);
   continue;
  }
  assert.equal(q.mode, mode);
  assert(q.options.length >= 2 && q.options.length <= 3);
  assert.equal(new Set(q.options.map(o => o.text)).size, q.options.length);
  assert.equal(q.options[q.correct].text, q.text);
  assert.equal(q.options[q.correct].id, q.id);
  if (mode === 'listen') assert.equal(new Set(q.options.map(o => soundFamily(o, language, q.category))).size, q.options.length, 'Listening options cannot share a sound family');
  if (mode === 'match') {
   assert.equal(typeof q.display, 'string');
   if (language === 'ko') assert.equal(q.display, q.speakText);
   else assert.notEqual(q.display, q.text);
  } else assert(!Object.hasOwn(q, 'display'));
 }
}

let roundsChecked = 0;
for (const language of ['ja', 'ko']) {
 const d = data[language], ids = d.groups.map(g => g.id), covered = new Set(), positions = new Set();
 for (const mode of ['listen', 'read', 'match']) {
  for (let seed = 1; seed <= 180; seed++) {
   const questions = engine.buildRound(d, { groupIds: ids, mode, limit: seed % 2 ? 5 : 10 }, random(seed * 701));
   checkQuestions(questions, language, mode, ids);
   if (mode === 'listen') for (const q of questions) { covered.add(q.text); if (q.correct !== null) positions.add(q.correct); }
   roundsChecked++;
  }
 }
 assert.deepEqual(positions, new Set([0, 1, 2]), 'Correct choices vary across every option position');
 const wanted = new Set(d.groups.flatMap(g => g.items.map(item => item.text)));
 assert.deepEqual(covered, wanted, language + ': every existing character/word can be sampled');
 for (const g of d.groups) {
  const questions = engine.buildRound(d, { groupIds: [g.id], mode: 'listen', limit: 10 }, random(44));
  assert.equal(questions.length, g.items.length, 'Small groups are not padded with repeated targets');
  checkQuestions(questions, language, 'listen', [g.id]);
 }
 assert.equal(JSON.stringify(d), expected[language], 'Generating rounds does not mutate primer data');
}

const ja = data.ja, ko = data.ko;
const mixedGroups = ['hiragana-a', 'hiragana-ka'];
const first = engine.buildRound(ja, { groupIds: mixedGroups, mode: 'listen', limit: 5 }, random(12));
const second = engine.buildRound(ja, { groupIds: mixedGroups, mode: 'listen', limit: 5, previousKeys: first.map(q => q.id) }, random(13));
assert(second.every(q => !first.some(prior => prior.id === q.id)), 'Prefer every unseen target before previous targets');
const manyGroups = ['hiragana-a', 'hiragana-ka', 'hiragana-sa', 'hiragana-ta', 'hiragana-na', 'hiragana-ha'];
const sampledGroups = new Set();
for (let seed = 1; seed <= 120; seed++) {
 const two = engine.buildRound(ja, { groupIds: mixedGroups, mode: 'read', limit: 5 }, random(seed * 113));
 assert.deepEqual(new Set(two.map(q => q.groupId)), new Set(mixedGroups), 'A mixed round includes both nonempty groups');
 for (const id of mixedGroups) assert(two.filter(q => q.groupId === id).length >= 2, 'Mix comparable groups before repeating heavily');
 const many = engine.buildRound(ja, { groupIds: manyGroups, mode: 'read', limit: 5 }, random(seed * 131));
 assert.equal(new Set(many.map(q => q.groupId)).size, 5, 'With more groups than questions, sample distinct groups first');
 many.forEach(q => sampledGroups.add(q.groupId));
 roundsChecked += 2;
}
assert.deepEqual(sampledGroups, new Set(manyGroups), 'Every selected group remains eligible across seeded rounds');
const seenA = ja.groups.find(g => g.id === 'hiragana-a').items.map((_, index) => 'hiragana-a:' + index);
const unseenFirst = engine.buildRound(ja, { groupIds: mixedGroups, mode: 'read', limit: 5, previousKeys: seenA }, random(39));
assert(unseenFirst.every(q => q.groupId === 'hiragana-ka'), 'Unseen items take priority even if another group has only previously seen items');
const mostlySeen = [...seenA.slice(1), ...ja.groups.find(g => g.id === 'hiragana-ka').items.map((_, index) => 'hiragana-ka:' + index).slice(1)];
const layered = engine.buildRound(ja, { groupIds: mixedGroups, mode: 'read', limit: 5, previousKeys: mostlySeen }, random(65));
assert.deepEqual(new Set(layered.slice(0, 2).map(q => q.id)), new Set(['hiragana-a:0', 'hiragana-ka:0']), 'Finish the unseen layer before mixing previously seen items');
assert(layered.slice(2).every(q => mostlySeen.includes(q.id)));
const selected = [first[0].id, first[2].id];
const retry = engine.buildRound(ja, { groupIds: mixedGroups, mode: 'read', limit: 10, onlyKeys: selected }, random(99));
assert.deepEqual(new Set(retry.map(q => q.id)), new Set(selected), 'Review IDs remain stable across modes');
assert.equal(engine.buildRound(ja, { groupIds: mixedGroups, mode: 'listen', limit: 5, onlyKeys: [] }).length, 0);
assert.equal(engine.buildRound(ja, { groupIds: [], mode: 'listen', limit: 5 }).length, 0);
const n = engine.buildRound(ja, { groupIds: ['hiragana-n'], mode: 'listen', limit: 5 }, random(3));
assert.equal(n.length, 1);
assert.equal(n[0].text, 'ん');
assert.equal(n[0].outsideScope, true, 'Single-character group explains borrowed choices');
const wa = engine.buildRound(ja, { groupIds: ['hiragana-wa'], mode: 'listen', limit: 5 }, random(4));
assert.equal(wa.length, 2);
assert(wa.every(q => q.outsideScope));
const unsupported = engine.buildRound(ko, { groupIds: ['ko-blocks'], mode: 'match', limit: 5 });
assert.equal(unsupported.length, 0, 'Matching supports letter groups only');
for (const id of ['ko-vowels-extra-1', 'ko-vowels-extra-2', 'ko-consonants-double']) {
 const qs = engine.buildRound(ko, { groupIds: [id], mode: 'listen', limit: 10 }, random(64));
 assert(qs.length > 0, 'Extended letters are available with safe listening choices');
 checkQuestions(qs, 'ko', 'listen', [id]);
}
const single = { language: 'ja', groups: [{ id: 'one', title: 'One', category: 'hiragana', items: [{ text: 'あ', romaji: 'a' }] }] };
const fallback = engine.buildRound(single, { mode: 'listen', limit: 5 });
assert.equal(fallback[0].mode, 'read');
assert.equal(fallback[0].fallbackFrom, 'listen');
assert.equal(fallback[0].correct, null);
assert.deepEqual(fallback[0].options, []);
assert.throws(() => engine.buildRound(ja, { mode: 'bad' }), RangeError);
assert.throws(() => engine.buildRound(ja, { limit: 4 }), RangeError);
assert.throws(() => engine.buildRound(ja, {}, () => 1), RangeError);

// Test public state transitions rather than mirroring private implementation.
const choices = engine.buildRound(ja, { groupIds: mixedGroups, mode: 'listen', limit: 5 }, random(5));
const session = engine.createSession(choices);
assert.equal(engine.next(session), false, 'No skipping an unanswered question');
assert.equal(engine.rate(session, 'known'), false, 'Choices are not oral self-ratings');
assert.equal(engine.answer(session, -1), false);
assert.equal(engine.answer(session, 99), false);
assert.equal(engine.answer(session, 0.5), false);
const wrong = (choices[0].correct + 1) % choices[0].options.length;
assert.equal(engine.answer(session, wrong), true);
assert.equal(session.records[0].first, false);
assert.equal(engine.next(session), false, 'Wrong answer must be resolved first');
assert.equal(engine.answer(session, choices[0].correct), true);
assert.equal(session.records[0].first, false, 'Correction does not overwrite the first attempt');
assert.equal(session.records[0].attempts.length, 2);
assert.equal(engine.answer(session, wrong), false, 'Resolved questions ignore double clicks');
assert.equal(engine.reveal(session), false, 'Cannot retroactively turn a resolved answer into a hint');
assert.deepEqual(engine.summary(session), { total: 5, answered: 1, firstCorrect: 0, corrected: 1, known: 0, again: 0, reviewKeys: [choices[0].id] });
assert.equal(engine.next(session), true);
assert.equal(engine.reveal(session), true);
assert.equal(engine.reveal(session), false);
assert.equal(engine.next(session), false, 'Revealing a choice is not completing it');
assert.equal(engine.answer(session, choices[1].correct), true);
assert.equal(session.records[1].first, true);
assert.equal(engine.summary(session).firstCorrect, 0, 'A hinted first answer does not count as independent');
assert.equal(engine.summary(session).corrected, 2);
assert.equal(engine.next(session), true);
while (!session.finished) {
 assert.equal(engine.answer(session, choices[session.index].correct), true);
 if (session.index === choices.length - 1) assert.equal(session.finished, false, 'Last answer still waits for next');
 assert.equal(engine.next(session), true);
}
assert.equal(engine.summary(session).firstCorrect, 3);
assert.equal(engine.summary(session).answered, 5);
assert.equal(engine.summary(session).reviewKeys.length, 2);
assert.equal(engine.next(session), false);
assert.equal(engine.answer(session, 0), false);
assert.equal(engine.reveal(session), false);

const reading = engine.createSession(engine.buildRound(ko, { groupIds: ['ko-vowels-1'], mode: 'read', limit: 5 }, random(1)));
assert.equal(engine.answer(reading, 0), false, 'No automatic scoring of read-aloud practice');
assert.equal(engine.rate(reading, 'known'), false, 'Reveal before comparing the reading');
assert.equal(engine.reveal(reading), true);
assert.equal(reading.records[0].hint, false);
assert.equal(engine.next(reading), false, 'Revealing still requires self-rating');
assert.equal(engine.rate(reading, 'other'), false);
assert.equal(engine.rate(reading, 'again'), true);
assert.equal(engine.rate(reading, 'known'), false, 'Completed self-rating is stable');
assert.equal(engine.next(reading), true);
assert.equal(engine.reveal(reading), true);
assert.equal(engine.rate(reading, 'known'), true);
assert.deepEqual(engine.summary(reading), { total: 5, answered: 2, firstCorrect: 0, corrected: 0, known: 1, again: 1, reviewKeys: [reading.questions[0].id] });
const reset = engine.createSession(reading.questions);
assert.equal(reset.index, 0);
assert(reset.records.every(r => r.first === null && !r.done && !r.revealed && r.attempts.length === 0));
assert.equal(engine.createSession([]).finished, true);

const context = vm.createContext({});
vm.runInContext(fs.readFileSync('assets/day0-practice-engine.js', 'utf8'), context);
assert.equal(typeof context.Day0Practice.buildRound, 'function', 'Browser global works without CommonJS or DOM');
assert.equal(typeof context.Day0Practice.summary, 'function');
console.log('PASS: ' + roundsChecked + ' seeded mixed rounds, every target reachable, unambiguous choices, scope/review rules, matching, independent scoring, retries, hints, self-rating, finish/reset, immutable input and browser export.');
