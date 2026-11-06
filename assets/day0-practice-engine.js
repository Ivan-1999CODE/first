/* Pure question generation and practice state. No DOM, storage or audio access. */
(function (root, factory) {
 'use strict';
 const api = factory();
 if (typeof module === 'object' && module.exports) module.exports = api;
 if (root) root.Day0Practice = api;
})(typeof globalThis === 'object' ? globalThis : this, function () {
 'use strict';

 const MODES = new Set(['listen', 'read', 'match']);
 const KO_VOWEL_CAUTION = [new Set(['ae', 'e', 'yae', 'ye']), new Set(['wae', 'we', 'oe'])];

 function shuffled(values, rng) {
  const result = values.slice();
  for (let i = result.length - 1; i > 0; i--) {
   const sample = Number(rng());
   if (!Number.isFinite(sample) || sample < 0 || sample >= 1) throw new RangeError('rng must return a number from 0 (inclusive) to 1 (exclusive)');
   const j = Math.floor(sample * (i + 1));
   [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
 }

 function spreadAcrossGroups(values, rng) {
  const groups = new Map();
  for (const item of values) {
   if (!groups.has(item.groupId)) groups.set(item.groupId, []);
   groups.get(item.groupId).push(item);
  }
  const buckets = shuffled([...groups.values()].map(items => shuffled(items, rng)), rng);
  const result = [];
  // Give each nonempty group a turn before taking a second item from any group.
  for (let turn = 0; result.length < values.length; turn++) {
   for (const bucket of buckets) if (bucket[turn]) result.push(bucket[turn]);
  }
  return result;
 }

 function hira(text) {
  return String(text).normalize('NFKC').replace(/[\u30a1-\u30f6]/gu, c => String.fromCharCode(c.charCodeAt(0) - 0x60));
 }

 function sameSound(a, b, language) {
  const sound = item => String(item.speakText || item.text).normalize('NFKC').trim();
  if (sound(a) === sound(b)) return true;
  if (language === 'ja') {
   const normalize = item => {
    const value = hira(sound(item));
    return value === 'を' ? 'お' : value;
   };
   return normalize(a) === normalize(b);
  }
  // These are conservative assessment exclusions, not a claim that every
  // speaker pronounces every member identically. Do not demand that distinction
  // from a beginner using a single synthetic recording.
  if (a.category === 'vowels' && b.category === 'vowels') {
   return KO_VOWEL_CAUTION.some(set => set.has(a.romaji) && set.has(b.romaji));
  }
  return false;
 }

 function inventory(data) {
  return data.groups.flatMap(group => group.items.map((item, index) => ({
   id: group.id + ':' + index,
   groupId: group.id,
   groupTitle: group.title,
   category: group.category,
   text: item.text,
   speakText: item.speakText || item.text,
   romaji: item.romaji || '',
   zh: item.zh || '',
   note: item.note || ''
  })));
 }

 function matchSupported(item, language) {
  return language === 'ja'
   ? ['hiragana', 'katakana'].includes(item.category)
   : ['vowels', 'consonants'].includes(item.category);
 }

 function matchDisplay(item, language) {
  if (language === 'ko') return item.speakText;
  if (item.category === 'katakana') return hira(item.text);
  return String(item.text).replace(/[\u3041-\u3096]/gu, c => String.fromCharCode(c.charCodeAt(0) + 0x60));
 }

 function questionPrompt(mode, item, language) {
  if (mode === 'read') return '先看字，試著自己念，再揭曉讀音核對。';
  if (mode === 'match') {
   if (language === 'ja') return item.category === 'hiragana' ? '看這個片假名，選出對應的平假名。' : '看這個平假名，選出對應的片假名。';
   return item.category === 'vowels' ? '看完整音節，選出裡面的母音字母。' : '看完整音節，選出開頭的子音字母。';
  }
  if (language === 'ko' && item.category === 'vowels') return '聽拼讀示範，選出裡面的母音字母。';
  if (language === 'ko' && item.category === 'consonants') return '聽拼讀示範，選出開頭的子音字母。';
  return '聽聲音，選出對應的字或詞。';
 }

 function buildQuestion(target, mode, all, selectedIds, language, rng) {
  const q = { ...target, mode, prompt: '', options: [], correct: null };
  if (mode === 'match') q.display = matchDisplay(target, language);
  if (mode !== 'read') {
   const sameCategory = all.filter(item => item.category === target.category && item.id !== target.id);
   const candidates = [
    ...shuffled(sameCategory.filter(item => selectedIds.has(item.groupId)), rng),
    ...shuffled(sameCategory.filter(item => !selectedIds.has(item.groupId)), rng)
   ];
   const chosen = [target];
   for (const item of candidates) {
    if (chosen.some(other => other.text === item.text)) continue;
    if (mode === 'listen' && chosen.some(other => sameSound(other, item, language))) continue;
    chosen.push(item);
    if (chosen.length === 3) break;
   }
   if (chosen.length < 2) {
    q.mode = 'read';
    q.fallbackFrom = mode;
    delete q.display;
   } else {
    q.outsideScope = chosen.some(item => !selectedIds.has(item.groupId));
    q.options = shuffled(chosen, rng).map(item => ({ text: item.text, id: item.id, speakText: item.speakText, romaji: item.romaji }));
    q.correct = q.options.findIndex(item => item.id === target.id);
   }
  }
  q.prompt = questionPrompt(q.mode, target, language);
  return q;
 }

 function buildRound(data, options = {}, rng = Math.random) {
  if (!data || !['ja', 'ko'].includes(data.language) || !Array.isArray(data.groups)) throw new TypeError('Expected Japanese or Korean primer data');
  const mode = options.mode || 'listen';
  const limit = options.limit === undefined ? 5 : options.limit;
  if (!MODES.has(mode)) throw new RangeError('Unsupported practice mode');
  if (![5, 10].includes(limit)) throw new RangeError('Practice limit must be 5 or 10');
  const all = inventory(data);
  const selectedIds = new Set(options.groupIds === undefined ? data.groups.map(group => group.id) : options.groupIds);
  const only = options.onlyKeys === undefined ? null : new Set(options.onlyKeys);
  const previous = new Set(options.previousKeys || []);
  const seenTargets = new Set();
  const eligible = all.filter(item => {
   if (!selectedIds.has(item.groupId) || (only && !only.has(item.id))) return false;
   if (mode === 'match' && !matchSupported(item, data.language)) return false;
   // The same word can occur in a building lesson and a travel-word lesson.
   // Keep one question for that visible target in a mixed round.
   const identity = item.category + ':' + item.text;
   if (seenTargets.has(identity)) return false;
   seenTargets.add(identity);
   return true;
  });
  const targets = [
   ...spreadAcrossGroups(eligible.filter(item => !previous.has(item.id)), rng),
   ...spreadAcrossGroups(eligible.filter(item => previous.has(item.id)), rng)
  ].slice(0, limit);
  return targets.map(item => buildQuestion(item, mode, all, selectedIds, data.language, rng));
 }

 function createSession(questions) {
  if (!Array.isArray(questions)) throw new TypeError('Expected questions array');
  return {
   questions: questions.slice(), index: 0,
   records: questions.map(() => ({ first: null, attempts: [], hint: false, answer: null, done: false, revealed: false, rating: null })),
   finished: questions.length === 0
  };
 }

 function current(session) {
  if (!session || session.finished || !Number.isInteger(session.index)) return null;
  const question = session.questions[session.index], record = session.records[session.index];
  return question && record ? { question, record } : null;
 }

 function answer(session, index) {
  const state = current(session);
  if (!state || state.record.done || state.question.mode === 'read') return false;
  const { question, record } = state;
  if (!Number.isInteger(index) || index < 0 || index >= question.options.length) return false;
  const correct = index === question.correct;
  if (record.first === null) record.first = correct;
  record.attempts.push(index);
  record.answer = index;
  record.done = correct;
  return true;
 }

 function reveal(session) {
  const state = current(session);
  if (!state || state.record.done || state.record.revealed) return false;
  state.record.revealed = true;
  if (state.question.mode !== 'read') state.record.hint = true;
  return true;
 }

 function rate(session, rating) {
  const state = current(session);
  if (!state || state.question.mode !== 'read' || state.record.done || !state.record.revealed || !['known', 'again'].includes(rating)) return false;
  state.record.rating = rating;
  state.record.done = true;
  return true;
 }

 function next(session) {
  const state = current(session);
  if (!state || !state.record.done) return false;
  if (session.index + 1 < session.questions.length) session.index++;
  else session.finished = true;
  return true;
 }

 function summary(session) {
  const report = { total: session.questions.length, answered: 0, firstCorrect: 0, corrected: 0, known: 0, again: 0, reviewKeys: [] };
  session.questions.forEach((question, index) => {
   const record = session.records[index];
   if (record.done) report.answered++;
   if (record.done && record.first === true && !record.hint) report.firstCorrect++;
   if (record.done && (record.first === false || record.hint)) report.corrected++;
   if (record.rating === 'known') report.known++;
   if (record.rating === 'again') report.again++;
   if (record.first === false || record.hint || record.rating === 'again') report.reviewKeys.push(question.id);
  });
  report.reviewKeys = [...new Set(report.reviewKeys)];
  return report;
 }

 return { buildRound, createSession, answer, reveal, rate, next, summary };
});
