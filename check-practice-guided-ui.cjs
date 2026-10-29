const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { pathToFileURL } = require('node:url');
const { chromium } = require('C:/Users/1090602/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const curriculum = require('./assets/micro-curriculum.cjs');
const out = path.resolve('tmp/practice-guided-qa');
fs.mkdirSync(out, { recursive: true });

(async () => {
 const browser = await chromium.launch({ channel: 'msedge', headless: true });
 const report = { cases: [], errors: [] };
 const chapter = async (p, index) => {
  await p.locator('#dg-menu-open').click();
  await p.locator(`#nav [data-page="${index}"]`).click();
 };
 const bounds = async p => assert(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'No horizontal page overflow');
 try {
  for (const [day, width, theme, size] of [[2, 1024, 'light', 'standard'], [7, 390, 'dark', 'large'], [7, 390, 'light', 'large']]) {
   const data = curriculum.make(day), r = data.rounds[0];
   const context = await browser.newContext({ viewport: { width, height: 844 } });
   const p = await context.newPage();
   p.on('pageerror', error => report.errors.push(error.message));
   await p.addInitScript(({ theme, size }) => {
    localStorage.setItem('travel-lab-theme', theme);
    localStorage.setItem('travel-lab-text-size', size);
   }, { theme, size });
   const url = pathToFileURL(path.resolve(data.file || 'travel-english-unit2-shopping.html')).href;
   await p.goto(url);
   await p.evaluate(() => {
    setTaskRound(0);
    state.answers['before-' + activeRound().id] = 'Original longer task: before.';
    state.answers['after-' + activeRound().id] = 'Original longer task: after.';
    save();
    navigate(0);
   });
   assert.equal(await p.locator('.before-panel > .task').textContent(), r.entryCheckpoint.task);
   assert.equal(await p.locator('.dg-entry-next > button').count(), 1, 'One forward action on the homepage');
   assert.equal(await p.locator('.dg-entry-next [data-page="1"]').count(), 1);
   assert.equal(await p.locator('.dg-entry-note').evaluate(e => e.open), false, 'Writing is optional and collapsed');
   const beforeKey = 'entry-before-' + r.id, afterKey = 'entry-after-' + r.id;
   assert.equal(await p.locator(`[data-field="${beforeKey}"]`).inputValue(), '', 'Old long-task answer is not reused for the new short prompt');
   await bounds(p);
   await p.screenshot({ path: path.join(out, `d${day}-${theme}-${width}-start.png`), fullPage: true });
   await p.locator('.dg-entry-note > summary').focus();
   await p.keyboard.press('Enter');
   await p.locator(`[data-field="${beforeKey}"]`).fill('My first short answer.');
   await p.locator('.dg-entry-next > button').click();
   assert.equal(await p.evaluate(() => page), 1);
   const preview = p.locator('.dg-dialogue-preview');
   assert.equal(await preview.evaluate(e => e.open), false);
   await preview.locator(':scope > summary').focus();
   await p.keyboard.press('Enter');
   assert.equal(await preview.evaluate(e => e.open), true, 'Keyboard can open the short dialogue');
   await preview.scrollIntoViewIfNeeded();
   await bounds(p);
   await p.screenshot({ path: path.join(out, `d${day}-${theme}-${width}-dialogue.png`) });
   if (data.rounds.length > 1) {
    await p.locator('#dg-context [data-dg-task="1"]').click();
    assert.equal(await p.locator('.dg-dialogue-preview').evaluate(e => e.open), false, 'New task starts collapsed');
    await p.locator('#dg-context [data-dg-task="0"]').click();
   }
   await chapter(p, 5);
   assert.equal(await p.locator('.dg-checkpoint-task .task').textContent(), r.entryCheckpoint.task, 'The before and after prompts are identical');
   assert((await p.locator('.dg-before-record').innerText()).includes('My first short answer.'));
   assert.equal(await p.locator('.dg-previous-checkpoint').evaluate(e => e.open), false, 'Long-task history is separate');
   await p.locator(`[data-field="${afterKey}"]`).fill('My improved short answer.');
   await p.locator('.dg-previous-checkpoint > summary').click();
   assert((await p.locator('.dg-previous-checkpoint').innerText()).includes('Original longer task: before.'));
   assert((await p.locator('.dg-previous-checkpoint').innerText()).includes('Original longer task: after.'));
   await bounds(p);
   await p.reload();
   await chapter(p, 5);
   assert.equal(await p.locator(`[data-field="${afterKey}"]`).inputValue(), 'My improved short answer.');
   assert((await p.locator('.dg-before-record').innerText()).includes('My first short answer.'));
   assert.equal(await p.evaluate(() => state.answers['before-' + activeRound().id]), 'Original longer task: before.');
   report.cases.push({ day, width, theme, size, entrySaved: true, legacyPreserved: true });
   await context.close();
  }
  assert.deepEqual(report.errors, []);
  fs.writeFileSync(path.join(out, 'report.json'), JSON.stringify(report, null, 2));
  console.log('PASS: short homepage, one forward action, collapsed brief dialogue, keyboard operation, separate before/after storage and legacy preservation; 3 viewport/theme cases.');
 } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
