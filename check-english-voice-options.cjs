'use strict';
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { forPage } = require('./assets/english-audio-course.cjs');
const { strip } = require('./assets/english-audio-build.cjs');

const day1 = 'travel-english.html';
const voices = ['us-female', 'uk-female', 'us-male', 'uk-male'];
const picker = '#day1-voice-picker';
const trigger = picker + ' > summary';
const captures = path.join(__dirname, 'tmp', 'english-voice-options');
const lessonURL = name => pathToFileURL(path.join(__dirname, name)).href;

async function verifyAudioFiles(page, chapter, decoded) {
  const manifest = require('./assets/english-audio/manifest.json');
  const texts = forPage(chapter, strip(fs.readFileSync(path.join(__dirname, chapter), 'utf8')));
  const hashes = await page.evaluate(async previouslyDecoded => {
    const tables = {
      'us-female': JSON.parse(document.getElementById('english-ai-data').textContent),
      ...JSON.parse(document.getElementById('english-ai-voices').textContent)
    };
    window.voiceTestTables = tables;
    const result = {};
    const known = new Set(previouslyDecoded);
    const decoder = new AudioContext();
    try {
      for (const [voice, recordings] of Object.entries(tables)) {
        result[voice] = {};
        for (const [text, uri] of Object.entries(recordings)) {
          if (!uri.startsWith('data:audio/mpeg;base64,')) throw Error('Missing offline MP3: ' + voice + ' ' + text);
          const bytes = Uint8Array.from(atob(uri.split(',')[1]), c => c.charCodeAt(0));
          const digest = await crypto.subtle.digest('SHA-256', bytes);
          const hex = Array.from(new Uint8Array(digest), value => value.toString(16).padStart(2, '0')).join('');
          if (!known.has(hex)) {
            const clip = await decoder.decodeAudioData(bytes.buffer);
            if (clip.duration < .1 || !clip.getChannelData(0).some(value => Math.abs(value) > .004)) {
              throw Error('Empty audio: ' + voice + ' ' + text);
            }
            known.add(hex);
          }
          result[voice][text] = hex;
        }
      }
    } finally { await decoder.close(); }
    return result;
  }, [...decoded]);
  assert.deepEqual(Object.keys(hashes).sort(), [...voices].sort());
  for (const voice of voices) {
    assert.deepEqual(Object.keys(hashes[voice]).sort(), [...texts].sort(), voice + ' must cover the whole chapter');
    for (const text of texts) {
      const source = path.join(__dirname, 'assets', 'english-audio');
      const firstDayClip = path.join(source, 'day1-' + voice, manifest[text]);
      const file = fs.existsSync(firstDayClip) ? firstDayClip : path.join(source, 'voices', voice, manifest[text]);
      const bytes = fs.readFileSync(file);
      const expected = crypto.createHash('sha256').update(bytes).digest('hex');
      assert.equal(hashes[voice][text], expected, voice + ' ' + text);
      decoded.add(expected);
    }
  }
  for (const text of texts) {
    assert.equal(new Set(voices.map(voice => hashes[voice][text])).size, voices.length, 'Voice variants share a clip: ' + text);
  }
  return voices.length * texts.length;
}

async function choose(page, voice) {
  await page.locator(trigger).click();
  await page.locator(picker + ' label').filter({ has: page.locator('input[value="' + voice + '"]') }).click();
  assert.equal(await checked(page), voice);
  assert.equal(await page.locator('#day1-voice-options').isVisible(), false);
}

function checked(page) {
  return page.locator(picker + ' input:checked').inputValue();
}

async function play(page, selector, voice, rate = 1) {
  const button = page.locator(selector).first();
  const text = await button.evaluate(el => el.dataset.say || el.dataset.englishAiSay || el.dataset.capSay);
  assert(text, 'Playback control has no authored text: ' + selector);
  await button.click();
  await page.waitForFunction(({ text, voice, rate }) => {
    const sound = window.lastCourseAudio;
    const tables = window.voiceTestTables ||= {
      'us-female': JSON.parse(document.getElementById('english-ai-data').textContent),
      ...JSON.parse(document.getElementById('english-ai-voices').textContent)
    };
    return sound && !sound.paused && sound.currentTime > .025 &&
      sound.playbackRate === rate && sound.src === tables[voice][text];
  }, { text, voice, rate }, { timeout: 4500 });
}

async function testPlayback(page, chapter) {
  assert.equal(await checked(page), 'us-female');
  await page.evaluate(() => navigate(1));
  const sentence = '.study-library [data-say]:not([data-slow]):visible';
  for (const voice of voices) {
    if (voice !== await checked(page)) {
      await choose(page, voice);
      assert(await page.evaluate(() => lastCourseAudio.paused && !lastCourseAudio.getAttribute('src')), 'Switch must stop the previous voice');
    }
    await play(page, sentence, voice);
    await play(page, '.study-library [data-slow]:visible', voice, .8);
  }
  const voice = await checked(page);
  await page.locator('.study-vocabulary > summary').click();
  await play(page, '.study-vocabulary .task-words [data-say]:visible', voice);
  await page.locator('.study-navigation [data-study-view="reply"]').click();
  const otherTurn = page.locator('[data-dg-reply-role="other"]:visible');
  if (await otherTurn.count()) await otherTurn.click();
  await play(page, '.dg-study-dialogue [data-say]:visible', voice);
  if (chapter === day1) {
    for (const task of [1, 2]) {
      await page.locator('#dg-menu-open').click();
      await page.locator('[data-dg-task="' + task + '"]').click();
      await page.evaluate(() => navigate(1));
      await play(page, sentence, voice);
    }
  }
  await page.evaluate(() => navigate(4));
  const turn = page.locator('.d5-script-line [data-english-ai-say]').first();
  await turn.evaluate(el => {
    for (let parent = el.parentElement; parent; parent = parent.parentElement) {
      if (parent.tagName === 'DETAILS') parent.open = true;
    }
  });
  await play(page, '.d5-script-line [data-english-ai-say]:visible', voice);
  if (chapter === day1) {
    await page.locator('#dg-menu-open').click();
    await page.locator('[data-ci-group]').first().click();
    await page.evaluate(() => navigate(1));
    await play(page, '#main [data-say]:visible', voice);
  }
  await page.goto(lessonURL(chapter));
  assert.equal(await checked(page), voice, 'Voice persists on reopening');
  await page.evaluate(() => navigate(1));
  await play(page, sentence, voice);
}

async function checkMenu(page, chapter) {
  fs.mkdirSync(captures, { recursive: true });
  const popup = page.locator('#day1-voice-options');
  const menu = page.locator(trigger);
  for (const width of [1100, 320]) {
    await page.setViewportSize({ width, height: 840 });
    const size = page.locator('#large');
    if ((await size.getAttribute('aria-pressed') === 'true') !== (width === 320)) await size.click();
    for (const dark of [false, true]) {
      const theme = page.locator('#theme');
      if ((await theme.getAttribute('aria-pressed') === 'true') !== dark) await theme.click();
      await menu.focus();
      await page.keyboard.press('Enter');
      assert(await popup.isVisible());
      await page.keyboard.press('Tab');
      assert(await page.locator(picker + ' input:focus:checked').count());
      await popup.locator('label').first().hover();
      const bounds = await popup.boundingBox();
      assert(bounds && bounds.x >= 0 && bounds.y >= 0 && bounds.x + bounds.width <= width + 1 && bounds.y + bounds.height <= 841, 'Popup must fit the viewport');
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'Page overflow');
      const options = popup.locator('label');
      assert.equal(await options.count(), 4);
      const states = await options.evaluateAll(labels => {
        const luminance = color => {
          const [r, g, b] = color.match(/[\d.]+/g).map(Number).slice(0, 3).map(channel => {
            const value = channel / 255;
            return value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4;
          });
          return .2126 * r + .7152 * g + .0722 * b;
        };
        return labels.map(label => {
          const rect = label.getBoundingClientRect();
          const top = document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2);
          const ink = luminance(getComputedStyle(label).color);
          const fill = luminance(getComputedStyle(label).backgroundColor);
          return { text: label.textContent, clickable: label.contains(top), contrast: (Math.max(ink, fill) + .05) / (Math.min(ink, fill) + .05) };
        });
      });
      for (const state of states) {
        assert(state.clickable, 'Option is covered by another element: ' + state.text);
        assert(state.contrast >= 4.5, 'Unreadable option: ' + JSON.stringify(state));
      }
      await page.screenshot({ path: path.join(captures, chapter.replace('.html', '') + '-' + width + '-' + (dark ? 'dark' : 'light') + '.png') });
      await page.keyboard.press('Escape');
      assert.equal(await popup.isVisible(), false);
      assert(await menu.evaluate(el => el === document.activeElement));
    }
  }
  await menu.press('Enter');
  await page.keyboard.press('Tab');
  const original = await checked(page);
  await page.keyboard.press('ArrowDown');
  assert.notEqual(await checked(page), original, 'Arrow keys select a voice');
}

async function check(lessons = fs.readdirSync(__dirname).filter(name => /^travel-english(?:-unit\d+-[\w-]+)?\.html$/.test(name)).sort()) {
  let chromium;
  try { ({ chromium } = require('playwright')); }
  catch { ({ chromium } = require('C:/Users/1090602/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright')); }
  const browser = await chromium.launch({ channel: 'msedge' });
  try {
    const decoded = new Set();
    for (const chapter of lessons) {
      const context = await browser.newContext({ offline: true, viewport: { width: 1100, height: 840 } });
      const errors = [];
      const page = await context.newPage();
      page.setDefaultTimeout(6000);
      page.on('pageerror', error => errors.push(error.message));
      await page.addInitScript(() => {
        const NativeAudio = window.Audio;
        window.Audio = function(...args) { return (window.lastCourseAudio = new NativeAudio(...args)); };
        Object.defineProperty(window, 'speechSynthesis', { value: undefined });
      });
      try {
        await page.goto(lessonURL(chapter));
        const count = await verifyAudioFiles(page, chapter, decoded);
        await testPlayback(page, chapter);
        if (chapter === day1 || /-unit(?:2|8|12)-/.test(chapter)) await checkMenu(page, chapter);
        assert.deepEqual(errors, []);
        console.log(chapter + ' · ' + count + ' recordings · four voices, slow playback, vocabulary, dialogue and reopen passed');
      } catch (error) {
        throw new Error(chapter + ': ' + error.message, { cause: error });
      } finally { await context.close(); }
    }
    // Archived lessons and day-zero language primers keep their existing players.
    const archive = path.join(__dirname, 'original-lessons');
    const excepted = fs.readdirSync(archive).filter(name => name.endsWith('.html')).map(name => path.join(archive, name));
    excepted.push(...['travel-japanese-day0-directions.html', 'travel-korean-day0-directions.html'].map(name => path.join(__dirname, name)));
    for (const file of excepted) assert(!fs.readFileSync(file, 'utf8').includes('id="english-ai-voices"'), file);
    console.log(lessons.length + ' lesson pages verified offline with ' + decoded.size + ' distinct MP3 recordings.');
    console.log('Open-menu screenshots: ' + captures);
  } finally { await browser.close(); }
}
module.exports = { check };
if (require.main === module) check(process.argv.length > 2 ? process.argv.slice(2) : undefined).catch(error => { console.error(error); process.exitCode = 1; });
