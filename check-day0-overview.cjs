// Node-only verification for the Day 0 letter overview.
// No browser is launched and no URL is opened by this check.
// Run after both builds. --source-only skips embedded HTML/audio checks.
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { make } = require('./assets/day0-primer-data.cjs');

const sourceOnly = process.argv.includes('--source-only');
const expectedHiragana = 'あいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほまみむめもやゆよらりるれろわをん';
const expectedKatakana = Array.from(expectedHiragana, c => String.fromCharCode(c.charCodeAt(0) + 0x60)).join('');
const expectedVowels = 'ㅏㅑㅓㅕㅗㅛㅜㅠㅡㅣㅐㅒㅔㅖㅘㅙㅚㅝㅞㅟㅢ';
const expectedConsonants = 'ㄱㄴㄷㄹㅁㅂㅅㅇㅈㅊㅋㅌㅍㅎㄲㄸㅃㅆㅉ';
const oldKoreanIds = ['ko-vowels-1', 'ko-vowels-2', 'ko-consonants-1', 'ko-consonants-2', 'ko-blocks', 'ko-familiar'];
const newKoreanIds = ['ko-vowels-extra-1', 'ko-vowels-extra-2', 'ko-consonants-double'];
const originalKoreanQuestions = [
  'ko-vowels-1-0', 'ko-vowels-1-2', 'ko-vowels-1-4', 'ko-vowels-2-0', 'ko-vowels-2-2', 'ko-vowels-2-4',
  'ko-consonants-1-0', 'ko-consonants-1-3', 'ko-consonants-1-6', 'ko-consonants-2-0', 'ko-consonants-2-3', 'ko-consonants-2-6',
  'ko-blocks-0', 'ko-blocks-2', 'ko-blocks-4', 'ko-familiar-0', 'ko-familiar-2', 'ko-familiar-3'
];
const report = [];

function sameSet(actual, expected, message) {
  assert.equal(new Set(actual).size, actual.length, message + ': no duplicates');
  assert.deepEqual([...actual].sort(), [...expected].sort(), message);
}

function embedded(html, name) {
  const prefix = 'const ' + name + '=';
  const line = html.split(/\r?\n/).find(text => text.startsWith(prefix));
  assert(line, 'Built HTML contains ' + name);
  assert(line.endsWith(';'), name + ': JSON assignment terminates');
  return JSON.parse(line.slice(prefix.length, -1));
}

function checkData(data) {
  sameSet(data.groups.map(group => group.id), data.groups.map(group => group.id), data.language + ' group IDs');
  sameSet(data.categories.map(category => category.id), data.categories.map(category => category.id), data.language + ' categories');
  for (const group of data.groups) {
    assert(data.categories.some(category => category.id === group.category), group.id + ': valid category');
    assert(group.items.length > 0, group.id + ': has letters or words');
    for (const item of group.items) {
      for (const key of ['text', 'speakText', 'zh', 'romaji']) assert.equal(typeof item[key], 'string', group.id + '/' + item.text + ': ' + key);
    }
  }
  for (const question of data.exercises) {
    const group = data.groups.find(group => group.id === question.groupId);
    assert(group, question.id + ': valid group');
    assert.notEqual(group.quiz, false, question.id + ': no quiz in a listening-only group');
    assert.equal(question.options[question.correct], question.text, question.id + ': correct choice');
    assert.equal(new Set(question.options).size, question.options.length, question.id + ': distinct choices');
    assert(group.items.some(item => item.text === question.text), question.id + ': taught in this group');
  }

  if (data.language === 'ja') {
    const originalJapaneseQuestions = [];
    for (const [category, expected] of [['hiragana', expectedHiragana], ['katakana', expectedKatakana]]) {
      const groups = data.groups.filter(group => group.category === category);
      assert.equal(groups.flatMap(group => group.items.map(item => item.text)).join(''), expected, category + ': all 46 in order');
      assert.equal(groups.length, 11, category + ': ten rows and standalone nasal');
      for (const group of groups) {
        const row = group.id.slice(category.length + 1);
        const columns = row === 'ya' ? [0, 2, 4] : row === 'wa' ? [0, 4] : row === 'n' ? [0] : [0, 1, 2, 3, 4];
        assert.deepEqual(group.overviewColumns, columns, group.id + ': fixed vowel columns');
        assert.equal(Boolean(group.overviewStandalone), row === 'n', group.id + ': nasal stays outside the five vowel columns');
        assert.equal(group.items.length, columns.length, group.id + ': one column per glyph');
        const indexes = row === 'ya' ? [0, 1, 2] : row === 'wa' ? [0, 1] : row === 'n' ? [0] : [0, 2, 4];
        originalJapaneseQuestions.push(...indexes.map(index => group.id + '-' + index));
      }
    }
    originalJapaneseQuestions.push('ja-familiar-0', 'ja-familiar-1', 'ja-familiar-2', 'ja-rhythm-0', 'ja-rhythm-1', 'ja-rhythm-2');
    sameSet(data.exercises.map(question => question.id), originalJapaneseQuestions, 'All original Japanese question IDs retained');
    for (const [glyph, source] of [['は', 'ハ'], ['へ', 'ヘ'], ['ハ', 'ハ'], ['ヘ', 'ヘ'], ['を', 'お'], ['ヲ', 'お']]) {
      assert.equal(data.groups.flatMap(group => group.items).find(item => item.text === glyph).speakText, source, glyph + ': authored sound source');
    }
    report.push({ language: 'ja', hiragana: 46, katakana: 46, columns: 5 });
  } else {
    const byCategory = category => data.groups.filter(group => group.category === category).flatMap(group => group.items.map(item => item.text));
    sameSet(byCategory('vowels'), [...expectedVowels], 'All 21 Korean vowel letters');
    sameSet(byCategory('consonants'), [...expectedConsonants], 'All 19 Korean consonant letters');
    for (const id of [...oldKoreanIds, ...newKoreanIds]) assert(data.groups.some(group => group.id === id), 'Preserved or added group: ' + id);
    for (const id of oldKoreanIds.slice(0, 4)) assert.equal(data.groups.find(group => group.id === id).overviewSection, 'basic', id + ': basic section');
    for (const id of newKoreanIds) {
      const group = data.groups.find(group => group.id === id);
      assert.equal(group.overviewSection, 'extended', id + ': extended section');
      assert.equal(group.quiz, false, id + ': no unreviewed discrimination quiz');
    }
    assert.equal(data.exercises.length, 18, 'Original Korean exercises retained');
    sameSet(data.exercises.map(question => question.id), originalKoreanQuestions, 'All original Korean question IDs retained');
    assert.equal(data.groups.filter(group => ['vowels', 'consonants'].includes(group.category)).flatMap(group => group.items).length, 40, 'Overview covers 40 letters');
    report.push({ language: 'ko', vowels: 21, consonants: 19, originalQuizCount: 18 });
  }
}

function checkEmbedded(data) {
  const filename = data.language === 'ja' ? 'travel-japanese-day0-directions.html' : 'travel-korean-day0-directions.html';
  const html = fs.readFileSync(path.join(__dirname, filename), 'utf8');
  assert.deepEqual(embedded(html, 'day0Primer'), data, filename + ': embedded primer matches source');
  for (const source of ['assets/day0-practice-engine.js', 'assets/day0-primer.js', 'assets/day0-primer.css', 'assets/day0-practice.css', 'assets/day0-guided.js']) {
    const normalize = text => text.replace(/\r\n/g, '\n').trim();
    assert(normalize(html).includes(normalize(fs.readFileSync(path.join(__dirname, source), 'utf8'))), filename + ': includes current ' + source);
  }
  const audio = embedded(html, 'day0Audio');
  const cues = embedded(html, 'day0Timings');
  const directory = path.join(__dirname, 'assets', data.language === 'ja' ? 'day0-audio' : 'korean-day0-audio');
  const manifest = JSON.parse(fs.readFileSync(path.join(directory, 'manifest.json'), 'utf8'));
  const timings = JSON.parse(fs.readFileSync(path.join(directory, 'timings.json'), 'utf8'));
  const sounds = [...new Set(data.groups.flatMap(group => group.items.map(item => item.speakText)))];
  for (const sound of sounds) {
    assert.equal(typeof manifest[sound], 'string', 'Prepared recording: ' + sound);
    const bytes = fs.readFileSync(path.join(directory, manifest[sound]));
    assert(bytes.length > 100, 'Recording has data: ' + sound);
    assert.equal(timings[sound]?.sha256, crypto.createHash('sha256').update(bytes).digest('hex'), 'Recording matches timing hash: ' + sound);
    assert.equal(audio[sound], 'data:audio/mpeg;base64,' + bytes.toString('base64'), 'Embedded recording matches source: ' + sound);
    assert(cues[sound]?.length, 'Recorded cues exist: ' + sound);
    for (const cue of cues[sound]) {
      assert.equal(sound.slice(cue.from, cue.to), cue.text, 'Cue text maps to source: ' + sound);
      assert(cue.end > cue.start && cue.start >= 0, 'Valid cue interval: ' + sound);
      assert(cue.romaji, 'Cue reading: ' + sound);
    }
  }
  report.find(entry => entry.language === data.language).embeddedSounds = sounds.length;
}

// Minimal host doubles exercise the actual primer render/event closures.
// They deliberately have no layout engine, URL loader, or audio player.
function checkRuntime(data) {
  const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const unescape = value => value.replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
  const attrs = markup => Object.fromEntries([...markup.matchAll(/([\w-]+)="([^"]*)"/g)].map(match => [match[1], unescape(match[2])]));
  const classSet = new Set();
  const listeners = [];
  const storage = { 'travel-lab-record': '{"before":"保留主課回答"}' };
  const courseState = { answers: { before: '保留主課回答' }, complete: ['A'], checks: { A: [true, false] } };
  const originalRecords = JSON.stringify({ storage, courseState });
  let focusSelector = '', stops = 0, playingFixture = null;
  const mapSelection = { textContent: '' };
  const mapAudio = { appended: null, append: panel => { mapAudio.appended = panel; } };
  const node = selector => ({ selector, focus: () => { focusSelector = selector; }, setAttribute() {}, removeAttribute() {} });
  const main = {
    innerHTML: '',
    focus: () => { focusSelector = '#main'; },
    getBoundingClientRect: () => ({ top: 100 - context.window.scrollY }),
    insertAdjacentHTML: (_position, html) => { main.innerHTML += html; },
    querySelector: selector => {
      if (selector === '.hero') return null;
      if (selector === '.follow-translation') return playingFixture?.translation || null;
      if (selector === '.follow-along') return playingFixture?.panel || null;
      if (selector === '.primer-map-audio') return main.innerHTML.includes('class="primer-map-audio"') ? mapAudio : null;
      if (selector === '.primer-map-selection') return main.innerHTML.includes('class="primer-map-selection ') ? mapSelection : null;
      return locate(selector);
    },
    querySelectorAll: () => []
  };
  const menu = { ...node('#dg-menu-open'), textContent: '' };
  const courseMenu = { open: false };
  function buttonRows() {
    return [...main.innerHTML.matchAll(/<button\b([^>]*)>([\s\S]*?)<\/button>/g)].map(match => {
      const attributes = attrs(match[1]);
      const dataset = Object.fromEntries(Object.entries(attributes).filter(([key]) => key.startsWith('data-')).map(([key, value]) => [key.slice(5).replace(/-([a-z])/g, (_m, c) => c.toUpperCase()), value]));
      return { attributes, dataset, content: match[2], disabled: /(?:^|\s)disabled(?:\s|$)/.test(match[1]), closest() { return this; } };
    });
  }
  function matches(row, selector) {
    const expression = selector.match(/^\[([^=\]]+)(?:="([^"]*)")?\]$/);
    assert(expression, 'Test selector is supported: ' + selector);
    return Object.hasOwn(row.attributes, expression[1]) && (expression[2] === undefined || row.attributes[expression[1]] === expression[2]);
  }
  function locate(selector) {
    if (selector === '#main') return main;
    if (selector === '.top') return { getBoundingClientRect: () => ({ height: 64 }) };
    if (selector === '#dg-menu-open') return menu;
    if (selector === '#courseMenu') return courseMenu;
    if (selector.startsWith('#')) return main.innerHTML.includes('id="' + selector.slice(1) + '"') ? node(selector) : null;
    if (selector.startsWith('[data-')) {
      // The assembly target includes a descendant selector; its rendered card
      // is enough for this host double, without pretending to test real focus.
      if (selector.includes(' .')) return main.innerHTML.includes(selector.slice(1, selector.indexOf(']'))) ? node(selector) : null;
      return buttonRows().some(row => matches(row, selector)) ? node(selector) : null;
    }
    return null;
  }
  const context = vm.createContext({
    day0Primer: data,
    esc: escape,
    btn: (label, attributes = '', extra = '') => `<button type="button" ${attributes} ${extra}>${label}</button>`,
    page: 0,
    course: { labels: Array.from({ length: 7 }, (_, i) => String(i + 1)) },
    state: courseState,
    localStorage: {
      getItem: key => storage[key] ?? null,
      setItem: (key, value) => { storage[key] = value; },
      removeItem: key => { delete storage[key]; },
      clear: () => { for (const key of Object.keys(storage)) delete storage[key]; }
    },
    document: {
      body: { classList: { toggle: (name, on) => on ? classSet.add(name) : classSet.delete(name) } },
      querySelector: locate,
      querySelectorAll: () => [],
      addEventListener: (name, callback) => { if (name === 'click') listeners.push(callback); }
    },
    window: {
      scrollY: 0,
      matchMedia: () => ({ matches: true }),
      scrollTo: ({ top }) => { context.window.scrollY = top; }
    },
    stopAudio: () => { stops++; playingFixture = null; mapAudio.appended = null; },
    render: () => { main.innerHTML = '<section>主課</section>'; },
    navigate: next => { context.page = next; context.stopAudio(); context.render(); }
  });
  new vm.Script(fs.readFileSync(path.join(__dirname, 'assets/day0-practice-engine.js'), 'utf8'), { filename: 'assets/day0-practice-engine.js' }).runInContext(context);
  new vm.Script(fs.readFileSync(path.join(__dirname, 'assets/day0-primer.js'), 'utf8'), { filename: 'assets/day0-primer.js' }).runInContext(context);
  function click(selector, index = 0) {
    const button = buttonRows().filter(row => matches(row, selector))[index];
    assert(button, data.language + ': rendered button ' + selector);
    assert.equal(button.disabled, false, 'Clicked control is enabled: ' + selector);
    for (const callback of listeners) callback({ target: button });
    return button;
  }
  function assertOverview() {
    assert.match(main.innerHTML, /class="primer-overview"/, 'Entry renders the full overview');
    assert.doesNotMatch(main.innerHTML, /class="(?:primer-letter-card|primer-quiz)"/, 'Overview does not render detail exercises');
    assert(classSet.has('primer-active'), 'Primer shell is active');
    assert.equal(buttonRows().filter(row => Object.hasOwn(row.dataset, 'primerSound')).length, data.language === 'ja' ? 46 : 40, 'Every overview letter is a sound button');
  }
  context.render();
  click('[data-primer-open]');
  assertOverview();
  assert.equal(focusSelector, '#primerTitle', 'Entry focuses its title');
  if (data.language === 'ja') {
    for (const mode of ['hiragana', 'katakana', 'compare']) {
      click('[data-primer-script="' + mode + '"]');
      assertOverview();
      const sounds = buttonRows().filter(row => Object.hasOwn(row.dataset, 'primerSound'));
      assert.equal(sounds.map(row => row.dataset.primerSound).join(''), mode === 'katakana' ? expectedKatakana : expectedHiragana, mode + ': rendered glyph order');
      assert.equal((main.innerHTML.match(/class="primer-map-pair"/g) || []).length, mode === 'compare' ? 46 : 0, mode + ': paired glyphs');
      assert.match(main.innerHTML, /<thead><tr><th scope="col">選一行<\/th><th scope="col" lang="ja-Latn">a<\/th><th scope="col" lang="ja-Latn">i<\/th><th scope="col" lang="ja-Latn">u<\/th><th scope="col" lang="ja-Latn">e<\/th><th scope="col" lang="ja-Latn">o<\/th>/, 'Five vowel headers in order');
      const prefix = mode === 'katakana' ? 'katakana' : 'hiragana';
      for (const [rowId, expectedColumns] of [['ya', [0, 2, 4]], ['wa', [0, 4]]]) {
        const row = main.innerHTML.match(new RegExp('<tr data-primer-row="' + prefix + '-' + rowId + '">([\\s\\S]*?)</tr>'));
        assert(row, 'Sparse row exists: ' + rowId);
        const cells = [...row[1].matchAll(/<td\b[^>]*>([\s\S]*?)<\/td>/g)];
        assert.equal(cells.length, 5, rowId + ': five fixed cells');
        assert.deepEqual(cells.map((cell, i) => cell[1].includes('data-primer-sound') ? i : -1).filter(i => i >= 0), expectedColumns, rowId + ': glyphs stay in the correct vowel columns');
      }
    }
  } else {
    for (const [section, count] of [['vowels-basic', 10], ['vowels-extended', 11], ['consonants-basic', 14], ['consonants-extended', 5]]) {
      const start = main.innerHTML.indexOf('data-primer-section="' + section + '"');
      assert(start >= 0, 'Korean overview section exists: ' + section);
      const end = main.innerHTML.indexOf('</section>', start);
      assert.equal((main.innerHTML.slice(start, end).match(/data-primer-sound=/g) || []).length, count, section + ': all letters rendered');
    }
  }
  const soundControl = buttonRows().find(row => Object.hasOwn(row.dataset, 'primerSound'));
  const htmlBeforeSound = main.innerHTML;
  const token = { disabled: false, attributes: { 'aria-haspopup': 'dialog', 'aria-expanded': 'false' }, removeAttribute(name) { delete this.attributes[name]; } };
  const followClasses = new Set();
  playingFixture = {
    translation: { textContent: '主課另一個意思，不應出現在字音練習' },
    panel: { classList: { add: name => followClasses.add(name) }, querySelectorAll: () => [token] }
  };
  const expectedPanel = playingFixture.panel;
  click('[data-primer-sound="' + soundControl.dataset.primerSound + '"]');
  assert.equal(main.innerHTML, htmlBeforeSound, 'Sound selection stays in the same overview');
  assert(soundControl.dataset.say && soundControl.dataset.primerMeaning, 'Sound button connects to the shared recording handler with local meaning');
  assert.equal(playingFixture.translation.textContent, soundControl.dataset.primerMeaning, 'Overview overrides unrelated shared-recording meanings');
  assert.equal(mapSelection.textContent, '剛才點選：' + soundControl.dataset.primerMeaning, 'Overview status names the selected letter');
  assert.equal(mapAudio.appended, expectedPanel, 'Shared player panel moves into the dedicated map audio slot');
  assert(followClasses.has('primer-follow'), 'Shared player uses primer styling');
  assert.equal(token.disabled, true, 'Sound guide cannot open unrelated vocabulary dialogs');
  assert.deepEqual(token.attributes, {}, 'Unrelated vocabulary dialog attributes are removed');
  assert(main.innerHTML.indexOf('class="primer-map-audio"') < main.innerHTML.indexOf('class="panel primer-map-panel"'), 'Audio slot is outside the alphabet table/panel');
  assert.equal(JSON.stringify({ storage, courseState }), originalRecords, 'Pointing to a sound preserves course records');

  context.window.scrollY = 640;
  click('[data-primer-romaji]');
  assert.match(main.innerHTML, /class="day0-primer hide-primer-romaji"/, 'Romanization can be hidden');
  assert.equal(context.window.scrollY, 640, 'Romanization toggle preserves scroll');
  const origin = data.language === 'ja' ? 'hiragana-ya' : 'ko-vowels-extra-2';
  click('[data-primer-group="' + origin + '"]');
  assert.match(main.innerHTML, /primer-detail/, 'Group selection opens detail');
  assert.doesNotMatch(main.innerHTML, /class="primer-overview"/, 'Detail replaces overview');
  click('[data-primer-overview]');
  assertOverview();
  assert.equal(context.window.scrollY, 640, 'Returning restores the overview scroll position');
  assert.equal(focusSelector, '[data-primer-group="' + origin + '"]', 'Returning requests focus on the original group');
  assert.match(main.innerHTML, /class="day0-primer hide-primer-romaji"/, 'Returning preserves romanization setting');
  if (data.language === 'ja') assert.equal(buttonRows().find(row => row.dataset.primerScript === 'compare').attributes['aria-pressed'], 'true', 'Returning preserves comparison mode');

  for (const group of data.groups) {
    // All groups are reachable from the overview, in the corresponding script.
    if (data.language === 'ja' && ['hiragana', 'katakana'].includes(group.category)) click('[data-primer-script="' + group.category + '"]');
    click('[data-primer-group="' + group.id + '"]');
    assert.equal((main.innerHTML.match(/class="primer-letter-card"/g) || []).length, group.items.length, group.id + ': all authored cards');
    assert.equal(buttonRows().filter(row => row.dataset.primerView === 'quiz').length, 0, group.id + ': old quiz tabs are removed');
    assert.equal(buttonRows().filter(row => row.dataset.practiceStart === 'group:' + group.id).length, 1, group.id + ': lower practice entry is available');
    assert(main.innerHTML.indexOf('class="primer-letter-card"') < main.innerHTML.indexOf('data-practice-start='), group.id + ': practice follows the study cards');
    click('[data-primer-overview]');
    assertOverview();
  }
  assert(stops > 0, 'Transitions invoke audio stop');
  click('[data-primer-close]');
  assert.equal(classSet.has('primer-active'), false, 'Closing removes the primer shell');
  assert.equal(context.page, 0, 'Closing returns to travel home');
  assert.equal(JSON.stringify({ storage, courseState }), originalRecords, 'Primer leaves course state and stored records unchanged');
  click('[data-primer-open]');
  assertOverview();
  context.navigate(1);
  assert.equal(classSet.has('primer-active'), false, 'Seven-part navigation exits the primer');
  report.find(entry => entry.language === data.language).runtime = { groups: data.groups.length, entry: 'overview', returnState: 'preserved', courseRecords: 'untouched' };
}

for (const language of ['ja', 'ko']) {
  const data = make(language);
  checkData(data);
  checkRuntime(data);
  if (!sourceOnly) checkEmbedded(data);
}
console.log(JSON.stringify({ status: 'PASS', scope: sourceOnly ? 'source data and isolated runtime' : 'source data, isolated runtime and embedded audio integrity', results: report, limitations: ['No browser or visual verification performed; host doubles cannot verify layout or real keyboard focus', sourceOnly ? 'No audio file checks in source-only mode' : 'Audio integrity is checked; playback and pronunciation quality are not assessed'] }, null, 2));
