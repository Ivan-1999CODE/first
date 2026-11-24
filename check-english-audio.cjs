'use strict';
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const { pathToFileURL } = require('node:url');
const { forPage } = require('./assets/english-audio-course.cjs');
const { strip } = require('./assets/english-audio-build.cjs');
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');

// Inspect the actual buttons produced by each round and by the integrated tasks.
async function checkViews() {
  const missing = new Set();
  const controls = new Set();
  let views = 0, dialogueLines = 0;
  const inspect = async () => {
    await Promise.resolve(); // Allow the render observer to attach controls to new examples.
    const main = document.getElementById('main');
    const selector = '[data-say],[data-cap-say],[data-workshop-say],[data-english-ai-say]';
    for (const button of main.querySelectorAll(selector)) {
      const d = button.dataset;
      const text = d.say || d.capSay || d.workshopSay || d.englishAiSay;
      if (text) {
        controls.add(text);
        if (!TravelEnglishAudio.has(text)) missing.add(text);
      }
    }
    for (const line of main.querySelectorAll('.d5-script-line')) {
      const text = line.querySelector('.d5-script-en').textContent.trim();
      if (!line.querySelector('[data-english-ai-say]')) missing.add('Teacher/student turn: ' + text);
      dialogueLines++;
    }
    views++;
  };
  for (let i = 0; i < rounds.length; i++) {
    if (typeof setTaskRound === 'function') setTaskRound(i); else setRound(i);
    for (let section = 0; section < 7; section++) {
      navigate(section);
      await inspect();
      if (section === 1) {
        document.querySelector('#main [data-study-view="reply"]')?.click();
        await inspect();
        document.querySelector('#main [data-study-view="library"]')?.click();
      }
    }
  }
  if (typeof capstoneSteps !== 'undefined') {
    navigate(7);
    document.querySelector('#main [data-cap-hint="2"]')?.click();
    await inspect();
  }
  for (const group of Array.from(document.querySelectorAll('[data-ci-group]'), el => el.dataset.ciGroup)) {
    document.querySelector('[data-ci-group="' + CSS.escape(group) + '"]').click();
    for (let i = 0; i < 7; i++) {
      document.querySelector('[data-ci-section="' + i + '"]')?.click();
      if (i === 1) document.querySelector('#main [data-ci-all]')?.click();
      await inspect();
    }
  }
  return { views, distinctButtonTexts: controls.size, dialogueLines, missing: [...missing] };
}

async function checkPlaying(page) {
  // Restore an ordinary round before testing the original and newly added controls.
  await page.evaluate(() => window.history.replaceState(null, '', location.pathname + location.search));
  await page.reload();
  await page.evaluate(() => navigate(1));
  const normal = page.locator('#main [data-say]:not([data-slow]):visible').first();
  await normal.click();
  await page.waitForFunction(() => window.lastCourseAudio?.currentTime > .035 && !lastCourseAudio.paused);
  assert.equal(await page.evaluate(() => lastCourseAudio.playbackRate), 1);
  const originalText = await normal.getAttribute('data-say');
  const slow = page.locator('#main [data-slow]:visible').first();
  assert.equal(await slow.getAttribute('data-say'), originalText);
  await slow.click();
  await page.waitForFunction(() => !lastCourseAudio.paused && lastCourseAudio.currentTime > .035);
  assert.equal(await page.evaluate(() => lastCourseAudio.playbackRate), .8);
  await page.locator('.english-ai-status button').click();
  assert(await page.evaluate(() => lastCourseAudio.paused && !lastCourseAudio.getAttribute('src')));
  await page.evaluate(() => navigate(4));
  const turn = page.locator('#main .d5-script-line [data-english-ai-say]').first();
  if (await turn.count()) {
    await turn.evaluate(button => {
      let parent = button.parentElement;
      while (parent) { if (parent.matches('details')) parent.open = true; parent = parent.parentElement; }
    });
    await turn.click();
    await page.waitForFunction(() => !lastCourseAudio.paused && lastCourseAudio.currentTime > .035);
    const text = await turn.getAttribute('data-english-ai-say');
    assert(await page.evaluate(text => lastCourseAudio.src === JSON.parse(document.getElementById('english-ai-data').textContent)[text], text));
    await page.evaluate(() => navigate(0));
    assert(await page.evaluate(() => lastCourseAudio.paused && !lastCourseAudio.getAttribute('src')));
  }
}

async function checkIntegratedPlayback(page) {
  await page.evaluate(() => navigate(7));
  await page.locator('#main [data-cap-hint="2"]').click();
  await page.locator('#main [data-cap-say]:visible').first().click();
  await page.waitForFunction(() => !lastCourseAudio.paused && lastCourseAudio.currentTime > .035);
  await page.locator('#main [data-cap-action="spoken"]').click();
  assert(await page.evaluate(() => lastCourseAudio.paused));
  await page.locator('#main [data-cap-slow]:visible').click();
  await page.waitForFunction(() => !lastCourseAudio.paused && lastCourseAudio.currentTime > .035);
  assert.equal(await page.evaluate(() => lastCourseAudio.playbackRate), .8);
  await page.locator('#dg-menu-open').click();
  await page.locator('[data-ci-group]').first().click();
  await page.evaluate(() => navigate(1));
  await page.locator('#main [data-say]:visible').first().click();
  await page.waitForFunction(() => !lastCourseAudio.paused && lastCourseAudio.currentTime > .035);
  assert(await page.locator('.english-ai-status').isVisible());
  await page.evaluate(() => stopAudio());
  assert(await page.locator('.english-ai-status').isHidden());
}

async function check() {
  let chromium;
  try { ({ chromium } = require('playwright')); }
  catch { ({ chromium } = require('C:/Users/1090602/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright')); }
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const dir = path.join(__dirname, 'assets/english-audio');
  const manifest = JSON.parse(fs.readFileSync(path.join(dir, 'manifest.json'), 'utf8'));
  const files = fs.readdirSync(__dirname).filter(name => /^travel-english.*\.html$/.test(name));
  const decoded = new Set();
  try {
    for (const name of files) {
      const file = path.join(__dirname, name);
      const html = fs.readFileSync(file, 'utf8');
      const expected = forPage(name, strip(html));
      const data = html.match(/<script id="english-ai-data" type="application\/json">([^<]+)<\/script>/);
      assert(data, name + ': embedded recordings');
      const recordings = JSON.parse(data[1]);
      assert.deepEqual(Object.keys(recordings).sort(), [...expected].sort());
      for (const [text, value] of Object.entries(recordings)) {
        assert(value.startsWith('data:audio/mpeg;base64,'));
        const source = fs.readFileSync(path.join(dir, manifest[text]));
        assert.equal(hash(Buffer.from(value.split(',')[1], 'base64')), hash(source), text);
      }
      const context = await browser.newContext({ offline: true, viewport: { width: 1200, height: 850 } });
      const errors = [];
      const page = await context.newPage();
      page.on('pageerror', error => errors.push(error.message));
      await page.addInitScript(() => {
        const NativeAudio = window.Audio;
        window.Audio = function(...args) { return (window.lastCourseAudio = new NativeAudio(...args)); };
        Object.defineProperty(window, 'speechSynthesis', { value: undefined });
        Object.defineProperty(window, 'SpeechSynthesisUtterance', { value: undefined });
      });
      await page.goto(pathToFileURL(file).href);
      const fresh = expected.filter(text => !decoded.has(manifest[text]));
      await page.evaluate(async texts => {
        const entries = JSON.parse(document.getElementById('english-ai-data').textContent);
        const decoder = new AudioContext();
        try {
          for (const text of texts) {
            const bytes = Uint8Array.from(atob(entries[text].split(',')[1]), char => char.charCodeAt(0));
            const clip = await decoder.decodeAudioData(bytes.buffer);
            if (clip.duration < .05 || !clip.getChannelData(0).some(x => Math.abs(x) > .004)) throw Error('Empty audio: ' + text);
          }
        } finally { await decoder.close(); }
      }, fresh);
      fresh.forEach(text => decoded.add(manifest[text]));
      const views = await page.evaluate(checkViews);
      assert.deepEqual(views.missing, [], name + ': missing recordings or teacher/student controls: ' + views.missing.join(' / '));
      await checkPlaying(page);
      if (name === 'travel-english.html') await checkIntegratedPlayback(page);
      assert.deepEqual(errors, []);
      await context.close();
      console.log(name + ' · ' + expected.length + ' recordings · ' + views.views + ' views · ' + views.dialogueLines + ' dialogue turns');
    }
    console.log('Offline English playback verified for ' + files.length + ' lessons and ' + decoded.size + ' different MP3s.');
  } finally { await browser.close(); }
}
module.exports = { checkViews };
if (require.main === module) check().catch(error => { console.error(error); process.exitCode = 1; });
