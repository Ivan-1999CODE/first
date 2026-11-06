// Isolated Node runtime checks for pronunciation practice.
// This does not open a browser, load a URL, or assess visual layout/audio output.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { make } = require('./assets/day0-primer-data.cjs');

const decode = text => text.replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const attributes = text => Object.fromEntries([...text.matchAll(/([\w-]+)="([^"]*)"/g)].map(match => [match[1], decode(match[2])]));
const normalize = text => text.replace(/\r\n/g, '\n').trim();

function createHarness(language, { storageThrows = false, referenceMarkers = false } = {}) {
  const data = make(language), callbacks = {}, bodyClasses = new Set();
  if (referenceMarkers) for (const group of data.groups) for (const item of group.items) {
    item.romaji = 'ReferenceRomaji42'; item.zh = 'ReferenceMeaning42'; item.note = 'ReferenceNote42';
  }
  const storage = { 'travel-lab-main-course': '{"answers":{"before":"原有主課作答"}}' };
  const state = { answers: { before: '原有主課作答' }, complete: ['A'], checks: { A: [true, false] } };
  const mainState = JSON.stringify(state), mainStorage = storage['travel-lab-main-course'];
  let stopCount = 0, session = null, focus = '', seed = 4097;
  const rng = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 0x100000000);
  const element = selector => ({ selector, focus: () => { focus = selector; }, getBoundingClientRect: () => ({ top: 180 - context.window.scrollY }), setAttribute() {}, removeAttribute() {} });
  const main = {
    innerHTML: '',
    focus: () => { focus = '#main'; },
    getBoundingClientRect: () => ({ top: 100 - context.window.scrollY }),
    insertAdjacentHTML: (_position, html) => { main.innerHTML += html; },
    querySelector: selector => locate(selector),
    querySelectorAll: () => []
  };
  const menu = { ...element('#dg-menu-open'), textContent: '' }, courseMenu = { open: false };
  function buttons() {
    return [...main.innerHTML.matchAll(/<button\b([^>]*)>([\s\S]*?)<\/button>/g)].map(match => {
      const attrs = attributes(match[1]);
      const dataset = Object.fromEntries(Object.entries(attrs).filter(([key]) => key.startsWith('data-')).map(([key, value]) => [key.slice(5).replace(/-([a-z])/g, (_m, c) => c.toUpperCase()), value]));
      return { attrs, dataset, content: match[2], disabled: /(?:^|\s)disabled(?:\s|$)/.test(match[1]), closest() { return this; }, focus() { focus = JSON.stringify(attrs); } };
    });
  }
  function matches(button, selector) {
    const match = selector.match(/^\[([^=\]]+)(?:="([^"]*)")?\]$/);
    assert(match, 'Unsupported test selector: ' + selector);
    return Object.hasOwn(button.attrs, match[1]) && (match[2] === undefined || button.attrs[match[1]] === match[2]);
  }
  function find(selector) { return buttons().filter(button => matches(button, selector)); }
  function locate(selector) {
    if (selector === '#main') return main;
    if (selector === '.top') return { getBoundingClientRect: () => ({ height: 64 }) };
    if (selector === '#dg-menu-open') return menu;
    if (selector === '#courseMenu') return courseMenu;
    if (selector === '.hero' || selector.startsWith('.follow-')) return null;
    if (/^\.[\w-]+$/.test(selector)) return new RegExp('class="[^"]*\\b' + selector.slice(1) + '\\b').test(main.innerHTML) ? element(selector) : null;
    if (selector.startsWith('#')) return main.innerHTML.includes('id="' + selector.slice(1) + '"') ? element(selector) : null;
    if (selector.startsWith('[data-') && !selector.includes(' .')) return find(selector).length ? element(selector) : null;
    return null;
  }
  const localStorage = {
    getItem(key) { if (storageThrows) throw Error('Storage unavailable'); return storage[key] ?? null; },
    setItem(key, value) { if (storageThrows) throw Error('Storage unavailable'); storage[key] = String(value); },
    removeItem(key) { if (storageThrows) throw Error('Storage unavailable'); delete storage[key]; }
  };
  const context = vm.createContext({
    day0Primer: data, esc: escape,
    btn: (label, attrs = '', extra = '') => `<button type="button" ${attrs} ${extra}>${label}</button>`,
    page: 0, course: { labels: Array.from({ length: 7 }, (_, i) => String(i + 1)) }, state, localStorage,
    document: {
      body: { classList: { toggle: (name, on) => on ? bodyClasses.add(name) : bodyClasses.delete(name) } },
      querySelector: locate, querySelectorAll: () => [],
      addEventListener: (name, callback) => { (callbacks[name] ||= []).push(callback); }
    },
    window: { scrollY: 0, localStorage, matchMedia: () => ({ matches: true }), scrollTo: ({ top }) => { context.window.scrollY = top; } },
    stopAudio: () => { stopCount++; },
    render: () => { main.innerHTML = '<section>主課</section>'; },
    navigate: next => { context.page = next; context.stopAudio(); context.render(); },
    console, setTimeout: callback => callback(), clearTimeout() {}
  });
  const enginePath = path.join(__dirname, 'assets/day0-practice-engine.js');
  new vm.Script(fs.readFileSync(enginePath, 'utf8'), { filename: enginePath }).runInContext(context);
  const engine = context.Day0Practice;
  assert(engine, 'Practice engine is available to the primer');
  context.Day0Practice = { ...engine,
    buildRound: (content, options, suppliedRng) => engine.buildRound(content, options, suppliedRng || rng),
    createSession: questions => { session = engine.createSession(questions); return session; }
  };
  const primerPath = path.join(__dirname, 'assets/day0-primer.js');
  new vm.Script(fs.readFileSync(primerPath, 'utf8'), { filename: primerPath }).runInContext(context);
  context.render();
  const harness = {
    data, context, engine, storage, main, buttons, find,
    get html() { return main.innerHTML; }, get session() { return session; }, get stops() { return stopCount; }, get focused() { return focus; },
    click(selector, index = 0) {
      const button = find(selector)[index];
      assert(button, language + ': rendered control ' + selector);
      assert.equal(button.disabled, false, language + ': enabled control ' + selector);
      for (const callback of callbacks.click || []) callback({ target: button, preventDefault() {} });
      return button;
    },
    preserved() {
      assert.equal(JSON.stringify(state), mainState, 'Main-course state is unchanged');
      assert.equal(storage['travel-lab-main-course'], mainStorage, 'Main-course storage is unchanged');
      assert(Object.keys(storage).every(key => key === 'travel-lab-main-course' || key === `travel-lab-${language}-primer-practice-v1`), 'Practice uses only its independent storage key');
    }
  };
  harness.click('[data-primer-open]');
  return harness;
}

function checkBuild(language) {
  const file = language === 'ja' ? 'travel-japanese-day0-directions.html' : 'travel-korean-day0-directions.html';
  const html = normalize(fs.readFileSync(path.join(__dirname, file), 'utf8'));
  const engine = normalize(fs.readFileSync(path.join(__dirname, 'assets/day0-practice-engine.js'), 'utf8'));
  const primer = normalize(fs.readFileSync(path.join(__dirname, 'assets/day0-primer.js'), 'utf8'));
  const css = normalize(fs.readFileSync(path.join(__dirname, 'assets/day0-practice.css'), 'utf8'));
  assert(html.includes(engine), file + ': current engine is embedded');
  assert(html.includes(primer), file + ': current practice UI is embedded');
  assert(html.includes(css), file + ': current practice styling is embedded');
  assert(html.indexOf(engine) < html.indexOf(primer), file + ': engine loads before UI');
  assert(/\.primer-practice\s+\.follow-along[^}]*display\s*:\s*none/.test(css), 'Shared audio transcript has a hiding rule during practice');
}

function text(html) { return decode(html.replace(/<[^>]*>/g, ' ')).replace(/\s+/g, ' ').trim(); }

function completeCurrent(h, { wrong = false, hint = false, rating = 'known' } = {}) {
  const session = h.session, q = session.questions[session.index];
  if (q.mode === 'read') {
    h.click('[data-practice-reveal]');
    h.click('[data-practice-rate="' + rating + '"]');
  } else {
    if (hint) h.click('[data-practice-reveal]');
    if (wrong) h.click('[data-practice-answer="' + ((q.correct + 1) % q.options.length) + '"]');
    h.click('[data-practice-answer="' + q.correct + '"]');
  }
  assert.equal(session.finished, false, 'Answering does not silently finish the round');
  h.click('[data-practice-next]');
}

function finishRound(h) {
  let guard = 30;
  while (!h.session.finished && guard-- > 0) completeCurrent(h);
  assert(guard > 0 && h.session.finished, 'The finite round completes');
}

function checkPractice(language) {
  const h = createHarness(language), key = `travel-lab-${language}-primer-practice-v1`;
  const firstGroup = language === 'ja' ? 'hiragana-a' : 'ko-vowels-1';
  const shortGroup = language === 'ja' ? 'hiragana-n' : 'ko-familiar';
  assert.equal(h.find('[data-practice-start="mixed"]').length, 1, 'Overview has one mixed-practice entry');
  h.click('[data-primer-group="' + firstGroup + '"]');
  assert(h.html.indexOf('primer-letter-card') < h.html.indexOf('data-practice-start='), 'Group practice follows its study cards');
  h.click('[data-practice-mode="listen"]');
  h.click('[data-practice-limit="5"]');
  const beforeStart = h.stops;
  h.click('[data-practice-start="group:' + firstGroup + '"]');
  assert(h.stops > beforeStart, 'Starting practice stops earlier audio');
  assert.doesNotMatch(h.html, /class="primer-study-content"/, 'Active practice does not show the study answers');
  assert.equal(h.session.questions.length, 5, 'Group listening uses the requested five available targets');
  const round = h.session;
  const first = round.questions[0], initialRecord = round.records[0];
  assert.equal(initialRecord.first, null, 'Question starts unanswered');
  const play = h.find('[data-practice-audio]')[0];
  assert(play?.dataset.say, 'Listening question connects to recorded audio');
  assert(!play.attrs['aria-label']?.includes(first.speakText), 'Play control does not reveal the spoken answer in its accessible label');
  assert(!text(play.content).includes(first.speakText), 'Play control has no answer text');
  assert.equal(h.find('[data-practice-next]')[0].disabled, true, 'Question cannot advance before completion');
  const beforeListen = JSON.stringify(round);
  h.click('[data-practice-audio]');
  assert.equal(JSON.stringify(round), beforeListen, 'Listening alone does not count an answer');

  // An initial wrong answer cannot become a first-attempt success after repair.
  const wrong = (first.correct + 1) % first.options.length;
  h.click('[data-practice-answer="' + wrong + '"]');
  assert.equal(round.records[0].first, false, 'Wrong-first response is recorded');
  assert.equal(h.find('[data-practice-next]')[0].disabled, true, 'Wrong choice stays on the question');
  h.click('[data-practice-answer="' + first.correct + '"]');
  assert.equal(round.records[0].first, false, 'Repair leaves the first result unchanged');
  assert.equal(h.engine.summary(round).firstCorrect, 0, 'Repair is not counted as unaided first success');
  assert.equal(round.records[0].done, true, 'Corrected answer completes this question');
  h.click('[data-practice-next]');

  // Revealing is help; a subsequent correct answer belongs in review.
  const second = round.questions[round.index];
  h.click('[data-practice-reveal]');
  assert.equal(round.records[round.index].hint, true, 'Peeking is marked as assisted');
  assert.equal(round.records[round.index].done, false, 'Peeking does not complete the question');
  assert.equal(h.find('[data-practice-next]')[0].disabled, true, 'Peeking cannot bypass answering');
  h.click('[data-practice-answer="' + second.correct + '"]');
  assert.equal(h.engine.summary(round).firstCorrect, 0, 'A hinted first answer is not an unaided first success');
  h.click('[data-practice-next]');
  while (round.index < round.questions.length - 1) completeCurrent(h);
  const final = round.questions[round.index];
  h.click('[data-practice-answer="' + final.correct + '"]');
  assert.equal(round.finished, false, 'Last answer waits for the explicit finish action');
  assert.equal(storageHasResult(h, key), false, 'An unfinished round has no saved completion');
  const beforeFinish = h.stops;
  h.click('[data-practice-next]');
  assert(h.stops > beforeFinish, 'Finishing stops audio');
  assert.equal(round.finished, true, 'Explicit last-next finishes the round');
  assert.equal(h.engine.summary(round).firstCorrect, 3, 'Only three unaided first successes are counted');
  assert.match(text(h.html), /3\s*\/\s*5.*第一次無提示答對/, 'Visible result shows the unaided first-answer score');
  assert.deepEqual([...h.engine.summary(round).reviewKeys].sort(), [first.id, second.id].sort(), 'Only the wrong and hinted questions need review');
  assert(storageHasResult(h, key), 'Completed result is saved independently');
  const saved = JSON.parse(h.storage[key]);
  assert.equal(saved.version, 1, 'Practice result format is versioned');
  assert.equal(saved.results['group:' + firstGroup].firstCorrect, 3, 'Stored result preserves the unaided first-answer score');
  assert.deepEqual(saved.results['group:' + firstGroup].reviewKeys.sort(), [first.id, second.id].sort(), 'Stored review keys contain only the targets that needed help');
  assert.equal(h.find('[data-practice-retry="mistakes"]').length, 1, 'A useful review entry is offered');
  h.preserved();

  const beforeRetry = h.stops;
  h.click('[data-practice-retry="mistakes"]');
  assert(h.stops > beforeRetry, 'Starting review stops prior audio');
  assert.deepEqual(Array.from(h.session.questions, q => q.id).sort(), [first.id, second.id].sort(), 'Review round contains only wrong or hinted targets');
  finishRound(h);
  assert.equal(h.find('[data-practice-retry="mistakes"]').length, 0, 'An all-correct result has no empty review action');
  assert.equal(h.find('[data-practice-retry="new"]').length, 1, 'Another round remains available');

  // Exit cancels an unfinished round and preserves the last completed result.
  const previousResult = h.storage[key];
  h.click('[data-practice-retry="new"]');
  assert.equal(h.session.finished, false, 'Another round starts unfinished');
  const abandoned = h.session, beforeExit = h.stops;
  h.click('[data-practice-exit]');
  assert(h.stops > beforeExit, 'Exiting stops audio');
  assert.equal(abandoned.finished, false, 'Exiting does not mark the abandoned round complete');
  assert.equal(h.storage[key], previousResult, 'Exiting preserves the previous completed result');
  assert.match(h.html, /primer-study-content/, 'Exiting restores study content');

  // Reading is a learner judgement and does not manufacture automatic scores.
  h.click('[data-practice-mode="read"]');
  h.click('[data-practice-start="group:' + firstGroup + '"]');
  assert.equal(h.session.questions[0].mode, 'read');
  assert.equal(h.find('[data-practice-answer]').length, 0, 'Reading mode has no automatic answer choices');
  assert.equal(h.find('[data-practice-audio]').length, 0, 'Reading begins before the reference recording is revealed');
  assert.equal(h.find('[data-practice-rate]').length, 0, 'Self-marking follows the reveal');
  completeCurrent(h, { rating: 'again' });
  finishRound(h);
  const reading = h.engine.summary(h.session);
  assert.equal(reading.firstCorrect, 0);
  assert.equal(reading.known, 4);
  assert.equal(reading.again, 1);
  assert.doesNotMatch(text(h.html), /首次[^。]*答對|正確率|自動得分/, 'Reading result does not show an automatic pronunciation score');
  h.click('[data-practice-exit]');
  h.click('[data-primer-overview]');

  // Mixed practice validates selection and advertises the real short-round size.
  h.click('[data-practice-category="' + (language === 'ja' ? 'hiragana' : 'vowels') + '"]');
  h.click('[data-practice-select="none"]');
  assert.equal(h.find('[data-practice-start="mixed"]')[0].disabled, true, 'At least one group is required');
  h.click('[data-practice-group="' + firstGroup + '"]');
  assert.equal(h.find('[data-practice-start="mixed"]')[0].disabled, false, 'One selected group can start');
  h.click('[data-practice-limit="10"]');
  h.click('[data-practice-mode="listen"]');
  h.click('[data-practice-start="mixed"]');
  assert.equal(h.session.questions.length, 5, 'A five-letter pool stays at five when ten are requested');
  assert(h.session.questions.every(q => q.groupId === firstGroup), 'Mixed scope respects the selected group');
  assert.match(text(h.html), /1\s*\/\s*5/, 'Question progress displays the actual pool size');
  h.click('[data-practice-exit]');
  h.click('[data-practice-select="all"]');
  h.click('[data-practice-start="mixed"]');
  assert.equal(h.session.questions.length, 10, 'Ten questions are used when enough targets exist');
  h.click('[data-practice-exit]');

  h.click('[data-practice-mode="match"]');
  h.click('[data-practice-start="mixed"]');
  assert(h.session.questions.every(q => q.mode === 'match'), 'Matching mode reaches the matching question type');
  assert(text(h.html).includes(h.session.questions[0].display), 'Matching displays its authored counterpart or syllable prompt');
  assert.equal(h.find('[data-practice-audio]').length, 0, 'Matching does not give an initial audio answer cue');
  completeCurrent(h);
  h.click('[data-practice-exit]');

  // A tiny group remains usable and tells the learner its actual round length.
  if (language === 'ja') h.click('[data-primer-script="hiragana"]');
  h.click('[data-primer-group="' + shortGroup + '"]');
  h.click('[data-practice-mode="listen"]');
  h.click('[data-practice-limit="5"]');
  h.click('[data-practice-start="group:' + shortGroup + '"]');
  const shortSize = language === 'ja' ? 1 : 4;
  assert.equal(h.session.questions.length, shortSize, 'Small authored group uses the available number of targets');
  assert.match(text(h.html), new RegExp('1\\s*/\\s*' + shortSize), 'Small-round progress is accurate');
  h.click('[data-practice-exit]');
  const beforeClose = h.stops;
  h.click('[data-primer-close]');
  assert(h.stops > beforeClose, 'Returning to the main course stops audio');
  h.preserved();
  return { language, listening: 'first-response and hints preserved', review: 'wrong/hinted only', reading: 'self-marked', scopes: 'one group and 5/10 limits', independentStorage: true };
}

function storageHasResult(h, key) { return Object.hasOwn(h.storage, key); }

function checkUnavailableStorage(language) {
  const h = createHarness(language, { storageThrows: true });
  h.click('[data-primer-group="' + (language === 'ja' ? 'hiragana-a' : 'ko-vowels-1') + '"]');
  h.click('[data-practice-start="group:' + (language === 'ja' ? 'hiragana-a' : 'ko-vowels-1') + '"]');
  finishRound(h);
  assert.equal(h.session.finished, true, 'Unavailable storage does not prevent completing practice');
  assert.match(text(h.html), /暫時無法儲存/, 'Unavailable storage is explained without blocking practice');
  h.preserved();
}

function checkAnswerDisclosure(language) {
  const h = createHarness(language, { referenceMarkers: true });
  const group = language === 'ja' ? 'hiragana-a' : 'ko-vowels-1';
  h.click('[data-primer-group="' + group + '"]');
  for (const mode of ['listen', 'read', 'match']) {
    h.click('[data-practice-mode="' + mode + '"]');
    h.click('[data-practice-start="group:' + group + '"]');
    assert.doesNotMatch(text(h.html), /Reference(?:Romaji|Meaning|Note)42/, mode + ': no reference pronunciation or meaning is visible before revealing');
    assert.doesNotMatch(h.html, /primer-letter-card/, mode + ': study cards cannot expose the answer during practice');
    h.click('[data-practice-reveal]');
    assert.match(text(h.html), /ReferenceRomaji42/, mode + ': reveal shows the reference reading');
    assert.match(text(h.html), /ReferenceMeaning42/, mode + ': reveal shows the reference meaning');
    assert.equal(h.focused, '.pp-reference', mode + ': revealing requests focus on the reference');
    assert.match(h.html, /class="pp-reference"[^>]*tabindex="-1"/, mode + ': the reference can receive programmatic focus');
    h.click('[data-practice-exit]');
  }
  h.preserved();
}

function checkAllGroups(language) {
  const h = createHarness(language);
  let routes = 0;
  for (const group of h.data.groups) {
    if (language === 'ja' && ['hiragana', 'katakana'].includes(group.category)) h.click('[data-primer-script="' + group.category + '"]');
    h.click('[data-primer-group="' + group.id + '"]');
    const modes = h.find('[data-practice-mode]').map(button => button.dataset.practiceMode);
    for (const mode of modes) {
      h.click('[data-practice-mode="' + mode + '"]');
      h.click('[data-practice-start="group:' + group.id + '"]');
      assert(h.session.questions.length > 0, group.id + '/' + mode + ': a usable round starts');
      assert(h.session.questions.every(question => question.groupId === group.id), group.id + '/' + mode + ': targets stay in this group');
      assert.doesNotMatch(h.html, /primer-letter-card/, group.id + '/' + mode + ': study cards stay out of the active exercise');
      completeCurrent(h);
      h.click('[data-practice-exit]');
      routes++;
    }
    h.click('[data-primer-overview]');
  }
  h.preserved();
  return routes;
}

module.exports = { createHarness, checkBuild, checkPractice };

if (require.main === module) {
  const results = [];
  for (const language of ['ja', 'ko']) {
    const result = checkPractice(language);
    checkUnavailableStorage(language);
    checkAnswerDisclosure(language);
    result.groupModeRoutes = checkAllGroups(language);
    results.push(result);
    if (!process.argv.includes('--source-only')) checkBuild(language);
  }
  console.log(JSON.stringify({ status: 'PASS', scope: process.argv.includes('--source-only') ? 'isolated UI runtime' : 'isolated UI runtime and generated HTML', results, limitations: ['No browser or visual layout verification', 'Audio handlers and stop requests are checked; actual playback and pronunciation are not assessed'] }, null, 2));
}
