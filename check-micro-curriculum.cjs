// Verify the authored small-task curriculum independently of the compiler.
// Default: all 15 revised lessons and decoding every required Japanese/Korean clip.
// Optional: --lessons=en-11,en-12,ja-0,ko-0 or --skip-audio-decode.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const vm = require('node:vm');
const {pathToFileURL} = require('node:url');
const {checkStructure, verifyApproved} = require('./check-approved-task-edits.cjs');
const root = __dirname;
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const output = path.join(root, 'tmp', 'all-micro', 'data-report.json');
const allIds = [...Array.from({length: 13}, (_, i) => `en-${i + 2}`), 'ja-0', 'ko-0'];
const requested = process.argv.find(arg => arg.startsWith('--lessons='));
const selectedIds = requested ? requested.slice('--lessons='.length).split(',') : allIds;
const report = {
  completeSeries: selectedIds.length === allIds.length && allIds.every(id => selectedIds.includes(id)),
  selectedLessons: selectedIds, passed: false, checks: 0, failures: [], lessons: [],
  audio: {requiredTextCount: 0, uniqueClips: 0, decodedClips: 0, languages: {}, interactions: {}},
  limitations: ['本腳本驗證資料、讀音函式及音檔解碼；不取代實際頁面的操作、版面或聽覺品質檢查。']
};
const globalKeys = new Set();
const clipsToDecode = new Map();
function check(label, action) {
  report.checks++;
  try { action(); } catch (error) {
    report.failures.push({check: label, message: error.message});
  }
}
async function asyncCheck(label, action) {
  report.checks++;
  try { await action(); } catch (error) {
    report.failures.push({check: label, message: error.stack || error.message});
  }
}
const isText = value => typeof value === 'string' && value.trim().length > 0;
const sentenceCount = text => {
  // Decimal prices and the ordinary a.m./p.m. time markers are not boundaries.
  const clean = text.replace(/(\d)\.(?=\d)/g, '$1').replace(/\b([ap])\.m\./gi, '$1m');
  return (clean.match(/[^.!?。！？]+(?:[.!?。！？]+|$)/g) || []).filter(s => s.trim()).length;
};
function segment(text, dictionary) {
  const keys = Object.keys(dictionary).sort((a, b) => b.length - a.length);
  let remaining = text;
  const parts = [];
  while (remaining) {
    const key = keys.find(candidate => remaining.startsWith(candidate));
    if (!key) return {parts, remaining};
    parts.push(key);
    remaining = remaining.slice(key.length).trimStart();
  }
  return {parts, remaining};
}
const escaped = text => String(text).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');
function readingRenderer(language, data) {
  const filename = language === 'ja' ? 'assets/day0-extra.js' : 'assets/korean-day0-extra.js';
  const source = read(filename).match(/function reading\(text\)\{[\s\S]*?\n\}/)?.[0];
  assert(source, 'Find the real reading renderer');
  const context = vm.createContext({readings: data.readings, kana: data.kana, esc: escaped});
  vm.runInContext(source, context);
  return text => {
    // The Japanese wrapper uses complete kana directly when it is available.
    if (language === 'ja' && isText(data.kana?.[text])) return {kana: true, html: data.kana[text]};
    return {kana: false, html: context.reading(text)};
  };
}
function verifyRecordedLanguage(id, data, required) {
  const language = data.language;
  const folder = language === 'ja' ? 'assets/day0-audio' : 'assets/korean-day0-audio';
  const manifest = JSON.parse(read(`${folder}/manifest.json`));
  const timings = JSON.parse(read(`${folder}/timings.json`));
  const cueReadings = language === 'ja'
    ? require('./assets/day0-follow-readings.cjs')
    : require('./assets/korean-day0-language.cjs').cueReadings;
  const renderer = readingRenderer(language, data);
  const clipKeys = new Set();
  const stats = {requiredTexts: required.size, coveredTexts: 0, readingTexts: 0, translationTexts: 0, uniqueClips: 0};
  for (const [text, sources] of required) {
    const location = `${id}: ${[...sources].join(', ')}: ${text}`;
    const parsed = segment(text, manifest);
    check(`${location}: complete recording coverage`, () => {
      assert.equal(parsed.remaining, '', `Missing recording at: ${parsed.remaining}`);
      assert(parsed.parts.length > 0);
    });
    if (!parsed.remaining && parsed.parts.length) stats.coveredTexts++;
    for (const part of parsed.parts) clipKeys.add(part);
    check(`${location}: audio translation`, () => {
      const direct = data.day0AudioTranslations?.[text];
      if (isText(direct)) return;
      for (const part of parsed.parts) assert(isText(data.day0AudioTranslations?.[part]), `Missing meaning: ${part}`);
      assert(parsed.parts.length > 0 && !parsed.remaining);
    });
    if (isText(data.day0AudioTranslations?.[text]) || (!parsed.remaining && parsed.parts.length && parsed.parts.every(p => isText(data.day0AudioTranslations?.[p])))) stats.translationTexts++;
    const roman = segment(text, data.readings || {});
    check(`${location}: complete reading data`, () => {
      assert.equal(roman.remaining, '', `Missing reading at: ${roman.remaining}`);
      assert(roman.parts.length > 0);
      for (const part of roman.parts) assert(isText(data.readings[part]));
    });
    check(`${location}: the real reading hint includes every segment`, () => {
      const rendered = renderer(text);
      assert(isText(rendered.html), 'Reading hint is empty');
      if (!rendered.kana) for (const part of roman.parts) {
        assert(rendered.html.includes(escaped(data.readings[part])), `Reading hint omits: ${part} → ${data.readings[part]}`);
      }
    });
    if (!roman.remaining && roman.parts.length) stats.readingTexts++;
  }
  for (const text of clipKeys) {
    const file = path.join(root, folder, manifest[text]);
    check(`${id}: valid existing clip ${text}`, () => {
      const bytes = fs.readFileSync(file);
      assert(bytes.length > 100, 'Audio file is empty or implausibly small');
      assert.equal(timings[text]?.sha256, crypto.createHash('sha256').update(bytes).digest('hex'), 'Audio and timing hash differ');
      assert(timings[text].cues.length > 0, 'No timed words');
      let priorEnd = 0;
      for (const cue of timings[text].cues) {
        assert.equal(text.slice(cue.from, cue.to), cue.text);
        assert(cue.start >= priorEnd && cue.end > cue.start, 'Invalid audio boundary');
        assert(isText(cueReadings[cue.text]), `Missing word reading: ${cue.text}`);
        priorEnd = cue.end;
      }
      clipsToDecode.set(`${language}:${manifest[text]}`, {
        language, text, file, finalCue: timings[text].cues.at(-1).end
      });
    });
  }
  stats.uniqueClips = clipKeys.size;
  report.audio.languages[language] = stats;
  report.audio.requiredTextCount += required.size;
}
function verifyLesson(id) {
  assert(allIds.includes(id), 'Unknown lesson selection: ' + id);
  const [language, number] = id.split('-');
  const day = Number(number);
  const data = language === 'en'
    ? require('./assets/micro-curriculum.cjs').make(day)
    : require('./assets/micro-day0.cjs').make(language);
  const summary = {
    id, day, language, title: data.course.title,
    file: data.file || (language === 'ja' ? 'travel-japanese-day0-directions.html' : undefined),
    storageKey: data.course.id, previousStorageKey: data.previousFocusKey,
    taskCount: data.rounds.length, coreUtteranceCount: data.phrases.length, chapters: []
  };
  report.lessons.push(summary);
  const recordedTexts = new Map();
  function required(text, source) {
    if (!isText(text) || language === 'en') return;
    if (!recordedTexts.has(text)) recordedTexts.set(text, new Set());
    recordedTexts.get(text).add(source);
  }
  function hints(text, source) {
    if (language === 'en' || !isText(text)) return;
    // Keyword separators are visual separators, not spoken audio.
    for (const part of text.split(/\s*[/／]\s*/).filter(Boolean)) required(part, source);
  }
  check(`${id}: language, day, new isolated storage key`, () => {
    assert.equal(data.language, language);
    assert.equal(data.course.day, day);
    assert.equal(data.microVersion, 1);
    assert.notEqual(data.course.id, data.previousFocusKey);
    assert.notEqual(data.course.id, data.previousLesson.key);
    assert(!data.previousLesson.legacyKeys.includes(data.course.id));
    assert(!globalKeys.has(data.course.id), 'Storage key used by another lesson');
    globalKeys.add(data.course.id);
  });
  check(`${id}: shared arrays contain exactly this lesson's tasks`, () => {
    checkStructure(data);
    verifyApproved(data);
    assert.equal(data.changeNotes.length, data.rounds.length);
    assert.deepEqual(data.quizzes,data.rounds.flatMap(r=>r.home.quizzes||[r.home.quiz]));
    assert.equal(data.missions.length, data.rounds.reduce((n, r) => n + 1 + (r.additionalVariations || []).length, 0));
    assert.equal(data.support.length, 0, 'Unscoped support phrases must not enter the small cycle');
  });
  for (const [index, round] of data.rounds.entries()) {
    const label = `${id}/${round.id} ${round.name}`;
    const flow = data.flows[round.flowIds[0]];
    const mission = data.missions[round.missionIds[0]];
    const pair = data.pairs[round.pairIds[0]];
    const checkpoint = round.checkpoint;
    const home = round.home;
    const steps = flow.steps;
    const variation = round.variation.steps;
    const additional = round.additionalVariations || [];
    const phraseList = (round.primaryPhraseIds || round.phraseIds).map(phraseId => data.phrases.find(p => p.id === phraseId));
    const replies = (round.primaryReplyIds || round.replyIds).map(replyId => data.replies[replyId]);
    const mode = round.variationMode || 'change';
    const answer = steps.map(step => step.answer).join(' ');
    const answerZh = steps.map(step => step.answerZh).join(' ');
    const changedAnswer = variation.map(step => step.answer).join(' ');
    const changedZh = variation.map(step => step.answerZh).join(' ');
    check(`${label}: stable key and approved task coverage`, () => {
      assert(isText(round.key) && !globalKeys.has(round.key), 'Task key repeated');
      globalKeys.add(round.key);
      assert(steps.length >= 1 && steps.length <= (round.merged?round.sourceIds.length*2:2));
      if(!round.merged)assert.equal(variation.length, steps.length);
      for (const value of [round.name, round.role, flow.context, round.variation.task, data.changeNotes[index].change]) assert(isText(value));
      assert.equal(round.missionIds.length, 1 + additional.length);
      assert.equal(round.flowIds.length, mode === 'core' ? 2 : 1);
      assert.equal(round.pairIds.length, round.flowIds.length);
    });
    check(`${label}: Part 2 core phrases exactly match Part 3 student turns`, () => {
      assert.deepEqual(phraseList.map(p => p?.en), steps.map(s => s.answer));
      assert.deepEqual(phraseList.map(p => p?.zh), steps.map(s => s.answerZh));
      assert.deepEqual(round.hearLines.map(p => [p.en, p.zh]), [...new Map((mode === 'core' ? [...steps, ...variation] : steps).map(s => [s.line, [s.line, s.zh]])).values()]);
    });
    check(`${label}: Part 2 dialogues exactly match Part 3`, () => {
      assert.equal(replies.length, steps.length);
      for (let i = 0; i < steps.length; i++) for (const field of ['answer', 'answerZh', 'line', 'zh', 'words', 'askFirst', 'task']) {
        assert.deepEqual(replies[i][field], steps[i][field], field);
      }
    });
    for (const [i, step] of steps.entries()) if (step.foodKind) {
      check(`${label}: illustrated ${step.foodKind} choices are taught before selection`, () => {
        assert.equal(day, 6);
        const options = require('./assets/day6-food-options.cjs')[step.foodKind];
        const p = phraseList[i];
        assert.equal(options.length, step.foodKind === 'steak' ? 5 : 6);
        assert.deepEqual(p.illustratedOptions, options);
        assert.deepEqual(p.substitutions, [{
          target: step.answer.replace(', please.', ''),
          options: options.map(option => [option.en, option.zh])
        }]);
        assert(options.some(option => `${option.en}, please.` === step.answer));
        assert.deepEqual(step.objects.map(object => object[1]), options.map(option => `${option.en}｜${option.zh}`));
        assert.deepEqual(step.valid, options.map((_, optionIndex) => optionIndex), 'All taught preferences remain acceptable');
        for (const option of options) {
          assert(isText(option.en) && isText(option.zh) && isText(option.description));
          assert(Number.isInteger(option.cell) && option.cell >= 0 && option.cell <= 10);
        }
        assert(fs.statSync(path.join(root, 'assets/illustrations/day6-steak-eggs-atlas.png')).size > 100);
        assert.equal(phraseList.length, steps.length, 'Optional menu choices must not expand the required core count');
      });
    }
    for (const [version, list] of [['main', steps], ['variation', variation], ...additional.map((v, i) => [`additional-${i}`, v.steps])]) {
      for (const [i, step] of list.entries()) {
        check(`${label}/${version}/${i}: a single translated learner sentence`, () => {
          for (const field of ['id', 'label', 'line', 'zh', 'task', 'words', 'answer', 'answerZh']) assert(isText(step[field]), `Missing ${field}`);
          assert.equal(sentenceCount(step.answer), 1, `Learner answer combines sentences: ${step.answer}`);
          assert.equal(typeof step.askFirst, 'boolean');
          assert(step.objects.length >= 2);
          assert(step.objects.every(o => Array.isArray(o) && o.length === 2 && o.every(isText)));
          assert(step.valid.length && step.valid.every(choice => Number.isInteger(choice) && step.objects[choice]));
          assert(isText(data.answerTranslations[step.answer]));
        });
        required(step.answer, `${round.id}/${version}/student`);
        required(step.line, `${round.id}/${version}/other`);
        hints(step.words, `${round.id}/${version}/keyword`);
      }
    }
    check(`${label}: Part 4 uses only the explicitly taught variation`, () => {
      assert.equal(mission.task, round.variation.task);
      assert.equal(mission.answer, changedAnswer);
      assert.equal(mission.answerZh, changedZh);
      assert.equal(mission.words, variation.map(s => s.words).join(' / '));
      const taught = new Set([
        ...round.phraseIds.map(id => data.phrases.find(p => p.id === id).en),
        ...round.hearLines.map(p => p.en),
        ...(mode === 'change' ? variation.flatMap(s => [s.answer, s.line]) : [])
      ]);
      for (const step of variation) {
        assert(taught.has(step.answer));
        assert(taught.has(step.line));
      }
      additional.forEach((v, i) => {
        const task = data.missions[round.missionIds[i + 1]];
        assert.equal(task.task, v.task);
        assert.equal(task.answer, v.steps.map(s => s.answer).join(' '));
        assert.equal(task.answerZh, v.steps.map(s => s.answerZh).join(' '));
        assert.equal(task.words, v.steps.map(s => s.words).join(' / '));
        assert(v.steps.length >= 1 && v.steps.length <= 2);
      });
    });
    check(`${label}: Part 5 keeps the same teacher turns and goals`, () => {
      assert.deepEqual(pair.cards.map(card => card.slice(1)), steps.map(s => [s.line, s.zh]));
      assert.deepEqual(pair.goals, steps.map(s => s.label));
      assert.equal(pair.answer, answer);
      assert.equal(pair.answerZh, answerZh);
      assert.equal(pair.first, steps[0].askFirst ? '學生' : '老師');
      assert.equal(pair.opening, steps[0].askFirst ? steps[0].answerZh : steps[0].zh);
      assert.equal(pair.start, steps[0].askFirst ? '' : steps[0].line);
      assert.equal(pair.objects, flow.context);
    });
    check(`${label}: Parts 1 and 6 use the same checkpoint and Part 7 stays scoped`, () => {
      assert.equal(checkpoint.task, flow.context);
      assert.equal(checkpoint.answer, answer);
      assert.equal(checkpoint.answerZh, answerZh);
      assert.equal(checkpoint.skills.length, steps.length);
      for (const field of ['task', 'words', 'answer', 'answerZh']) assert.equal(home[field], checkpoint[field], field);
      for(const quiz of home.quizzes||[home.quiz]){
        assert(steps.some(s => s.line === quiz.line && s.zh === quiz.zh), 'Homework introduces an untaught line');
        assert.equal(quiz.options[quiz.correct], quiz.zh);
        assert.deepEqual(data.quizzes.find(q=>q.id===quiz.id), quiz);
      }
    });
    for (const [text, source] of [[answer, 'checkpoint/pair/home'], [changedAnswer, 'variation-combined'], [home.quiz.line, 'home-listening']]) required(text, `${round.id}/${source}`);
    hints(checkpoint.words, `${round.id}/checkpoint-keywords`);
    hints(mission.words, `${round.id}/mission-keywords`);
    for (const [word, meaning] of round.words) {
      check(`${label}: translated vocabulary ${word}`, () => { assert(isText(word)); assert(isText(meaning)); });
      required(word.replaceAll(' / ', '. '), `${round.id}/vocabulary-audio`);
    }
    summary.chapters.push({
      id: round.id, key: round.key, name: round.name, context: flow.context,
      mode, chapter: round.chapter, scenarioCount: round.flowIds.length,
      core: steps.map(s => ({answer: s.answer, zh: s.answerZh, teacher: s.line, teacherZh: s.zh, askFirst: s.askFirst})),
      variation: {task: round.variation.task, student: variation.map(s => s.answer), teacher: variation.map(s => s.line)},
      additionalVariations: additional.map(v => ({task: v.task, student: v.steps.map(s => s.answer), teacher: v.steps.map(s => s.line)})),
      optionalChoices: phraseList.filter(p => p.illustratedOptions).map(p => ({
        phrase: p.en, choices: p.illustratedOptions.map(o => ({en: `${o.en}, please.`, zh: o.zh}))
      })),
      change: data.changeNotes[index].change
    });
  }
  check(`${id}: first-round compatibility fields remain scoped`, () => {
    assert.equal(data.course.task, data.rounds[0].checkpoint.task);
    assert.equal(data.course.answer, data.rounds[0].checkpoint.answer);
    assert.equal(data.homeTask, data.rounds[0].home.task);
    assert.equal(data.homeAnswer, data.rounds[0].home.answer);
  });
  if (language !== 'en') {
    for (const [word] of data.numberWords || []) required(word, 'number-vocabulary');
    for (const group of data.course.studySupplement?.groups || []) {
      for (const phrase of group.phrases) required(phrase.en, `supplement/${group.id}`);
    }
    verifyRecordedLanguage(id, data, recordedTexts);
  }
}
async function verifyAudioInteraction(browser) {
  for (const language of ['ja', 'ko']) {
    const lesson = report.lessons.find(item => item.language === language);
    if (!lesson) continue;
    await asyncCheck(`${language}-0: generated-page audio, word glossary and navigation`, async () => {
      const context = await browser.newContext({viewport: {width: 1100, height: 1000}});
      const errors = [];
      const result = {
        playback: false, nativePauseResume: false, normalAndSlow: false,
        wordPlayback: false, glossary: false, stopButton: false, navigationStops: false,
        compoundPlayback: false, screenshots: []
      };
      report.audio.interactions[language] = result;
      try {
        await context.addInitScript(() => {
          const NativeAudio = window.Audio;
          window.Audio = function(...args) { return window.qaAudio = new NativeAudio(...args); };
        });
        const page = await context.newPage();
        page.setDefaultTimeout(10000);
        page.on('pageerror', error => errors.push(error.message));
        await page.goto(pathToFileURL(path.join(root, lesson.file)).href);
        await page.waitForSelector('#main h1');
        await page.evaluate(() => { setTaskRound(1); navigate(1); });
        const text = language === 'ja' ? '駅はどこですか。' : '지하철역은 어디예요?';
        const selector = `[data-say=${JSON.stringify(text)}]`;
        await page.locator(`${selector}:not([data-slow])`).first().click();
        await page.waitForFunction(() => qaAudio.currentTime > .08 && !qaAudio.paused);
        assert.equal(await page.locator('.follow-along').count(), 1);
        assert.equal(await page.locator('.follow-translation').innerText(), language === 'ja' ? '車站在哪裡？' : '地鐵站在哪裡？');
        result.playback = true;
        // There is no separate pause button: test the existing media player's pause/resume.
        const pausedAt = await page.evaluate(() => { qaAudio.pause(); return qaAudio.currentTime; });
        await page.waitForTimeout(100);
        assert(await page.evaluate(time => qaAudio.paused && Math.abs(qaAudio.currentTime - time) < .03, pausedAt));
        await page.evaluate(() => qaAudio.play());
        await page.waitForFunction(time => !qaAudio.paused && qaAudio.currentTime > time + .03, pausedAt);
        result.nativePauseResume = true;
        for (const slow of [false, true]) {
          await page.locator(`${selector}${slow ? '[data-slow]' : ':not([data-slow])'}`).first().click();
          await page.waitForFunction(() => qaAudio.currentTime > .04 && !qaAudio.paused);
          assert.equal(await page.evaluate(() => qaAudio.playbackRate), slow ? .8 : 1);
          assert(await page.evaluate(() => qaAudio.preservesPitch));
          const expectedDuration = await page.evaluate(text => {
            const cue = day0Timings[text][0];
            return cue.end - cue.start;
          }, text);
          await page.locator('.follow-token').first().click();
          await page.waitForFunction(() => qaAudio.src.startsWith('blob:') && qaAudio.currentTime > .015);
          assert(Math.abs(await page.evaluate(() => qaAudio.duration) - expectedDuration) < .01, 'Word playback is cropped to its own cue');
          assert(await page.locator('.jp-glossary').isVisible());
          assert((await page.locator('.jp-glossary').innerText()).trim().length > 0);
          await page.keyboard.press('Escape');
          result.wordPlayback = result.glossary = true;
        }
        result.normalAndSlow = true;
        // Both UI themes must retain the opened word popup.
        for (const theme of ['light', 'dark']) {
          await page.evaluate(theme => document.documentElement.dataset.theme = theme, theme);
          await page.locator('.follow-token').first().click();
          await page.waitForFunction(() => document.querySelector('.jp-glossary')?.getClientRects().length);
          const box = await page.locator('.jp-glossary').boundingBox();
          assert(box && box.x >= 0 && box.y >= 0 && box.x + box.width <= 1102 && box.y + box.height <= 1002);
          const screenshot = path.join(root, 'tmp', 'all-micro', `${language}-audio-glossary-${theme}.png`);
          await page.screenshot({path: screenshot});
          result.screenshots.push(path.relative(root, screenshot));
          await page.keyboard.press('Escape');
        }
        await page.locator(`${selector}:not([data-slow])`).first().click();
        await page.waitForFunction(() => qaAudio.currentTime > .04 && !qaAudio.paused);
        await page.locator('.day0-audio-status button').click();
        assert(await page.evaluate(() => qaAudio.paused && !qaAudio.getAttribute('src')));
        assert.equal(await page.locator('.follow-along').count(), 0);
        result.stopButton = true;
        // Verify concatenated checkpoint answers play the second preserved recording too.
        await page.evaluate(() => { setTaskRound(0); navigate(5); });
        const combined = await page.evaluate(() => rounds[0].checkpoint.answer);
        await page.evaluate(text => speak(text), combined);
        await page.waitForFunction(() => document.querySelector('.follow-token.is-current')?.dataset.clip === '1');
        assert(await page.evaluate(() => !qaAudio.paused));
        result.compoundPlayback = true;
        await page.locator('[data-page="6"]:visible').first().click();
        assert(await page.evaluate(() => qaAudio.paused && !qaAudio.getAttribute('src')));
        assert.equal(await page.locator('.follow-along').count(), 0);
        result.navigationStops = true;
        assert.deepEqual(errors, []);
      } finally { await context.close(); }
    });
  }
}
async function decodeClips() {
  report.audio.uniqueClips = clipsToDecode.size;
  if (process.argv.includes('--skip-audio-decode')) {
    report.limitations.push('本次使用 --skip-audio-decode，未解碼音檔。');
    return;
  }
  const {chromium} = require('C:/Users/1090602/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
  const browser = await chromium.launch({channel: 'msedge', headless: true});
  try {
    const page = await browser.newPage();
    const audio = [...clipsToDecode.entries()].map(([key, clip]) => ({
      key, text: clip.text, finalCue: clip.finalCue,
      bytes: fs.readFileSync(clip.file).toString('base64')
    }));
    const results = await page.evaluate(async clips => {
      const context = new AudioContext();
      const results = [];
      try {
        for (const clip of clips) {
          try {
            const bytes = Uint8Array.from(atob(clip.bytes), char => char.charCodeAt(0));
            const decoded = await context.decodeAudioData(bytes.buffer);
            results.push({key: clip.key, duration: decoded.duration, channels: decoded.numberOfChannels, finalCue: clip.finalCue});
          } catch (error) {
            results.push({key: clip.key, error: error.message});
          }
        }
      } finally { await context.close(); }
      return results;
    }, audio);
    for (const result of results) check(`Audio decode ${result.key}`, () => {
      assert(!result.error, result.error);
      assert(result.duration > 0 && result.channels > 0, 'Empty decoded audio');
      assert(result.finalCue <= result.duration + 0.01, 'Timed word lies outside decoded audio');
      report.audio.decodedClips++;
    });
    await page.close();
    await verifyAudioInteraction(browser);
  } finally { await browser.close(); }
}
async function main() {
  fs.mkdirSync(path.dirname(output), {recursive: true});
  check('Runtime renders the same checkpoint in Parts 1 and 6 and teaches variations in Part 2', () => {
    const source = read('assets/micro-lessons.js');
    const intro = source.slice(source.indexOf('intro=function()'), source.indexOf('supportCard=function()'));
    const progress = source.slice(source.indexOf('function progressCard('), source.indexOf('progressPage=function()'));
    const library = source.slice(source.indexOf('phrasePage=function()'), source.indexOf('listeningReply=function()'));
    assert(intro.includes('esc(r.checkpoint.task)'));
    assert(progress.includes('const c=r.checkpoint') && progress.includes('esc(c.task)'));
    assert(library.includes('r.variation.steps'));
    assert(library.includes('dialoguePreview(') && library.includes('r.additionalVariations'), 'The shared renderer receives both original and added variations');
    assert(source.includes('p.illustratedOptions?studyUsage(p)'), 'Illustrated choices are visible in Part 2');
    const usage = read('assets/study-library.js');
    assert(usage.includes('先挑自己喜歡的一種，不用全部背'));
    assert(usage.includes("audio(o.en+', please.')"), 'Each illustrated choice has a spoken phrase');
  });
  check('Shared dialogue renderer keeps Day 1 prelude, pointing action and all three merged exchanges in order', () => {
    const context = vm.createContext({language: 'en', esc: escaped, audio: () => ''});
    vm.runInContext(read('assets/dialogue-preview.js'), context);
    const day1 = require('./assets/day1-focus-data.cjs'), round = day1.rounds[0], steps = day1.flows[0].steps;
    const html = context.dialoguePreview({steps, role: '路人', task: round.goal, prelude: round.prelude});
    const turns = [...html.matchAll(/<li class="micro-turn[^\"]*" data-speaker="([^\"]+)">([\s\S]*?)<\/li>/g)];
    assert.deepEqual(turns.map(t => t[1]), ['other', 'action', 'self', 'other', 'self', 'other', 'self', 'other']);
    const english = turns.map(t => t[2].match(/<p class="en"[^>]*>([\s\S]*?)<\/p>/)?.[1]).filter(Boolean);
    assert.deepEqual(english, [round.prelude.line, ...steps.flatMap(s => [s.answer, s.line])].map(escaped));
    assert(turns[1][2].includes(escaped(round.prelude.task)), 'Pointing remains an action, not an invented spoken answer');
    assert.deepEqual([...html.matchAll(/class="micro-turn-number">(\d+)</g)].map(m => Number(m[1])), [1, 2, 3, 4, 5, 6, 7, 8]);
  });
  for (const id of selectedIds) {
    try { verifyLesson(id); } catch (error) {
      report.failures.push({check: `${id}: load and inspect`, message: error.stack || error.message});
    }
  }
  try { await decodeClips(); } catch (error) {
    report.failures.push({check: 'Recorded audio decoding', message: error.stack || error.message});
  }
  report.totalTasks = report.lessons.reduce((n, lesson) => n + lesson.taskCount, 0);
  report.totalCoreUtterances = report.lessons.reduce((n, lesson) => n + lesson.coreUtteranceCount, 0);
  report.passed = report.failures.length === 0;
  fs.mkdirSync(path.dirname(output), {recursive: true});
  fs.writeFileSync(output, JSON.stringify(report, null, 2) + '\n', 'utf8');
  console.log(`${report.passed ? 'PASS' : 'FAIL'}: ${report.lessons.length} lessons, ${report.totalTasks} tasks, ${report.totalCoreUtterances} core utterances, ${report.checks} checks, ${report.audio.decodedClips}/${report.audio.uniqueClips} audio clips decoded.`);
  console.log(path.relative(root, output));
  for (const failure of report.failures.slice(0, 30)) console.error(`${failure.check}\n  ${failure.message}`);
  if (report.failures.length > 30) console.error(`... ${report.failures.length - 30} additional failures in the JSON report.`);
  process.exitCode = report.passed ? 0 : 1;
}
main();
