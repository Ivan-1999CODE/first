const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { pathToFileURL } = require('node:url');
const { chromium } = require('C:/Users/1090602/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const curriculum = require('./assets/micro-curriculum.cjs');
const out = path.resolve('tmp/guided-records-qa');
const visualOnly = process.argv.includes('--visual-only');
fs.mkdirSync(out, { recursive: true });

const report = { days: [], records: 0, pairs: 0, quizzes: 0, alternatives: 0, screenshots: [], overflow: [], pageErrors: [] };
const chapter = async (p, index) => {
 await p.locator('#dg-menu-open').click();
 await p.locator(`#nav [data-page="${index}"]`).click();
 assert.equal(await p.evaluate(() => page), index);
};
const task = async (p, index) => {
 const before = await p.evaluate(() => page);
 const button = p.locator(`#dg-context [data-dg-task="${index}"]`);
 await button.focus();
 await p.keyboard.press('Enter');
 assert.deepEqual(await p.evaluate(() => [taskRound, page]), [index, before]);
};
const openAncestors = async locator => {
 for (const details of await locator.locator('xpath=ancestor::details').all()) {
  if (!await details.evaluate(el => el.open)) await details.locator(':scope > summary').click();
 }
};
const fill = async (p, key, value) => {
 const field = p.locator(`[data-field="${key}"]`);
 assert.equal(await field.count(), 1, `One answer field for ${key}`);
 await openAncestors(field);
 await field.fill(value);
 assert.equal(await p.evaluate(key => state.answers[key], key), value);
};
const checkOverflow = async (p, label) => {
 const issue = await p.evaluate(() => {
  const width = innerWidth;
  const visible = el => !!el.getClientRects().length && getComputedStyle(el).visibility !== 'hidden';
  const items = [...document.querySelectorAll('#main *, #dg-context *, dialog[open] *')].filter(el => {
   if (!visible(el)) return false;
   // Hidden panes share a fixed grid with the visible pane; they are not
   // interactive content and do not contribute to a horizontal scrollbar.
   if (el.closest('[aria-hidden="true"], [inert]')) return false;
   // The task strip is intentionally scrollable for lessons with 5–8 tasks.
   if (el.closest('.dg-task-switch')) return false;
   // Native closed details descendants may still report a layout rectangle.
   let node = el;
   while (node.parentElement) {
    const parent = node.parentElement;
    if (parent.tagName === 'DETAILS' && !parent.open && node.tagName !== 'SUMMARY') return false;
    node = parent;
   }
   const rect = el.getBoundingClientRect();
   return rect.width > 0 && (rect.left < -1 || rect.right > width + 1);
  }).slice(0, 10).map(el => ({ tag: el.tagName, class: el.className, text: el.textContent.slice(0, 70) }));
  return { viewport: width, scrollWidth: document.documentElement.scrollWidth, items };
 });
 report.overflow.push({ label, ...issue });
 assert(issue.scrollWidth <= issue.viewport + 1, `${label}: page width ${JSON.stringify(issue)}`);
 assert.deepEqual(issue.items, [], `${label}: visible element bounds`);
};
const shot = async (p, name) => {
 await p.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
 await p.screenshot({ path: path.join(out, name + '.png'), fullPage: true });
 report.screenshots.push(name + '.png');
};

(async () => {
 const browser = await chromium.launch({ channel: 'msedge', headless: true });
 let activePage;
 try {
  for (let day = visualOnly ? 15 : 2; day <= 14; day++) {
   const data = curriculum.make(day);
   const context = await browser.newContext({ viewport: { width: 1024, height: 768 } });
   const p = await context.newPage(); activePage = p;
   p.setDefaultTimeout(8000);
   p.on('pageerror', error => report.pageErrors.push({ day, message: error.message }));
   const oldKeys = [...new Set([data.previousFocusKey, data.previousLesson.key, ...(data.previousLesson.legacyKeys || [])].filter(Boolean))];
   const sentinel = JSON.stringify({ answers: { before: `Day ${day} old answer <keep> & original` }, checks: { existing: [true, false] }, ratings: { existing: 2 } });
   await p.addInitScript(({ oldKeys, sentinel }) => {
    if (!sessionStorage.getItem('guided-records-initialized')) {
     localStorage.setItem('travel-lab-theme', 'light');
     localStorage.setItem('travel-lab-text-size', 'standard');
     oldKeys.forEach(key => localStorage.setItem(key, sentinel));
     sessionStorage.setItem('guided-records-initialized', 'true');
    }
   }, { oldKeys, sentinel });
   await p.goto(pathToFileURL(path.resolve(data.file || 'travel-english-unit2-shopping.html')).href);
   assert.equal(await p.evaluate(() => course.id), data.course.id);
   assert.equal(await p.locator('#dg-context [data-dg-task]').count(), data.rounds.length);
   const answers = {}, checks = {}, taskHome = {};
   for (let index = 0; index < data.rounds.length; index++) {
    const r = data.rounds[index];
    await task(p, index);
    // Every task can still reach every lesson part after the common overlay.
    for (let part = 0; part < 7; part++) {
     await p.evaluate(n => navigate(n), part);
     assert.equal(await p.locator('#main').getAttribute('data-lesson-section'), String(part + 1));
     assert(await p.locator('#main').innerText(), `Day ${day}, ${r.id}, part ${part + 1} renders`);
    }
    await chapter(p, 0);
    answers['before-' + r.id] = `D${day} ${r.id} first <keep> & original`;
    await fill(p, 'before-' + r.id, answers['before-' + r.id]);
    if (r.alternativeCheckpoint) {
     report.alternatives++;
     answers['before-alt-' + r.id] = `D${day} ${r.id} alternative before`;
     await fill(p, 'before-alt-' + r.id, answers['before-alt-' + r.id]);
    }
    // Each variation has its existing independent free-response field.
    await chapter(p, 3);
    for (const n of r.missionIds) {
     if (r.missionIds.length > 1) await p.locator(`[data-mission="${n}"]`).click();
     const m = data.missions[n], key = 'mission-' + m.id;
     answers[key] = `D${day} ${r.id} variation ${m.id}`;
     await fill(p, key, answers[key]);
    }
    await chapter(p, 4);
    for (const n of r.pairIds) {
     if (r.pairIds.length > 1) await p.locator(`[data-pair="${n}"]`).click();
     const pair = data.pairs[n];
     assert.equal(await p.locator('[data-pair-check]').count(), pair.goals.length);
     const first = p.locator(`[data-pair-check="${pair.id}:0"]`);
     await first.check(); assert(await first.isChecked());
     await first.uncheck(); assert(!await first.isChecked());
     await first.check();
     checks[pair.id] = pair.goals.map((_, i) => i === 0);
     const note = 'note-' + pair.id;
     answers[note] = `D${day} ${r.id} live note ${pair.id}`;
     await fill(p, note, answers[note]);
     await p.locator('.dg-teacher > summary').click();
     assert.equal(await p.locator('[data-teacher-card]').count(), pair.cards.length);
     for (const [, line] of pair.cards) assert((await p.locator('.dg-teacher').textContent()).includes(line));
     report.pairs++;
    }
    await chapter(p, 5);
    assert.equal(await p.locator('[data-review-task]').count(), 1, 'Default review shows only current task');
    assert.equal((await p.locator('.dg-before-record .readonly').innerText()).trim(), answers['before-' + r.id]);
    answers['after-' + r.id] = `D${day} ${r.id} now <better> & own`;
    await fill(p, 'after-' + r.id, answers['after-' + r.id]);
    if (r.alternativeCheckpoint) {
     answers['after-alt-' + r.id] = `D${day} ${r.id} alternative after`;
     await fill(p, 'after-alt-' + r.id, answers['after-alt-' + r.id]);
    }
    const skill = r.checkpoint.skills[0];
    for (const level of [1, 2, 3, 1]) {
     const rating = p.locator(`[data-rating="${skill.id}:${level}"]`);
     await rating.click();
     assert.equal(await p.evaluate(id => state.ratings[id], skill.id), level);
     assert.equal(await rating.getAttribute('aria-pressed'), 'true');
    }
    await chapter(p, 6);
    assert.equal(await p.locator('[data-review-task]').count(), 1, 'Default homework shows only current task');
    const questions = r.home.quizzes || [r.home.quiz];
    assert.equal(await p.locator('[data-home-question]').count(), questions.length);
    for (const [qIndex, q] of questions.entries()) {
     const attr = data.course.mergedTasks ? 'data-merged-quiz' : 'data-task-quiz';
     const value = choice => data.course.mergedTasks ? `${r.id}:${qIndex}:${choice}` : `${r.id}:${choice}`;
     const wrong = (q.correct + 1) % q.options.length;
     const wrongButton = p.locator(`[${attr}="${value(wrong)}"]`);
     await wrongButton.focus(); await p.keyboard.press('Space');
     assert.equal(await p.evaluate(id => quizChoices[id], q.id), wrong);
     assert.equal(await p.locator(`[data-home-question="${q.id}"] .feedback.retry`).count(), 1);
     const correctButton = p.locator(`[${attr}="${value(q.correct)}"]`);
     await correctButton.focus(); await p.keyboard.press('Enter');
     assert.equal(await p.evaluate(id => quizChoices[id], q.id), q.correct);
     assert.equal(await correctButton.getAttribute('aria-pressed'), 'true');
     assert.equal(await p.locator(`[data-home-question="${q.id}"] .feedback.retry`).count(), 0);
     assert.equal(await p.evaluate(() => document.activeElement.dataset.mergedQuiz || document.activeElement.dataset.taskQuiz), value(q.correct));
     report.quizzes++;
    }
    answers['home-' + r.id] = `D${day} ${r.id} homework`;
    await fill(p, 'home-' + r.id, answers['home-' + r.id]);
    if (r.alternativeCheckpoint) {
     answers['home-alt-' + r.id] = `D${day} ${r.id} alternative homework`;
     await fill(p, 'home-alt-' + r.id, answers['home-alt-' + r.id]);
    }
    for (const kind of ['listen', 'spoken']) await p.locator(`[data-task-home="${r.id}:${kind}"]`).check();
    taskHome[r.id] = { listen: true, spoken: true };
    assert((await p.locator(`#home-progress-${r.id}`).innerText()).includes('2 / 2'));
    report.records++;
   }
   const verify = async () => {
    const stored = await p.evaluate(() => ({ state, saved: JSON.parse(localStorage.getItem(course.id)) }));
    for (const [key, value] of Object.entries(answers)) {
     assert.equal(stored.state.answers[key], value, `Day ${day}: runtime answer ${key}`);
     assert.equal(stored.saved.answers[key], value, `Day ${day}: persisted answer ${key}`);
    }
    for (const [key, value] of Object.entries(checks)) assert.deepEqual(stored.saved.checks[key], value);
    assert.deepEqual(stored.saved.taskHome, taskHome);
    assert.deepEqual(await p.evaluate(keys => keys.map(key => localStorage.getItem(key)), oldKeys), oldKeys.map(() => sentinel), 'Older storage keys remain byte-for-byte unchanged');
   };
   await verify();
   await p.reload();
   await verify();
   // Revisit a different task after reload, confirming restored UI values.
   await task(p, 0); await chapter(p, 0);
   assert.equal(await p.locator(`[data-field="before-${data.rounds[0].id}"]`).inputValue(), answers['before-' + data.rounds[0].id]);
   await chapter(p, 4);
   assert(await p.locator(`[data-pair-check="${data.pairs[data.rounds[0].pairIds[0]].id}:0"]`).isChecked());
   report.days.push({ day, tasks: data.rounds.length, preservedKeys: oldKeys.length, fields: Object.keys(answers).length, reload: 'PASS' });
   console.log(`Day ${day}: ${data.rounds.length} tasks, records and quizzes PASS`);
   await context.close();
  }
  for (const config of [
   { day: 3, width: 390, height: 844, theme: 'light' },
   { day: 8, width: 1024, height: 768, theme: 'dark' }
  ]) {
   const data = curriculum.make(config.day);
   const context = await browser.newContext({ viewport: { width: config.width, height: config.height } });
   const p = await context.newPage(); activePage = p;
   p.on('pageerror', error => report.pageErrors.push({ day: config.day, message: error.message }));
   await p.addInitScript(theme => { localStorage.setItem('travel-lab-theme', theme); localStorage.setItem('travel-lab-text-size', 'large'); }, config.theme);
   await p.goto(pathToFileURL(path.resolve(data.file || 'travel-english-unit2-shopping.html')).href);
   for (const part of [0, 4, 5, 6]) {
    await chapter(p, part);
    if (part === 4) {
     await p.locator('.dg-teacher > summary').click();
     await p.locator('.dg-teacher-start > summary').click();
     await p.locator('[data-pair-check]').first().check();
    }
    if (part === 5) {
     await p.locator('.dg-review-options > summary').click();
     await p.locator('[data-rating$=":3"]').first().click();
     if (!await p.locator('.dg-review-options').evaluate(el => el.open)) await p.locator('.dg-review-options > summary').click();
     await p.locator('[data-rating$=":3"]').first().focus();
    }
    const label = `day${config.day}-${config.width}-${config.theme}-part${part + 1}`;
    await checkOverflow(p, label);
    await shot(p, label);
   }
   await context.close();
  }
  assert.deepEqual(report.pageErrors, []);
  if (!visualOnly) {
   assert.equal(report.days.length, 13);
   assert.equal(report.records, 58);
   assert.equal(report.pairs, 62);
   assert.equal(report.quizzes, 80);
   assert.equal(report.alternatives, 4);
  }
  report.status = 'PASS';
  console.log(JSON.stringify({ status: report.status, days: report.days.length, tasks: report.records, pairs: report.pairs, quizzes: report.quizzes, alternatives: report.alternatives }));
 } catch (error) {
  report.status = 'FAIL'; report.failure = error.stack;
  if (activePage && !activePage.isClosed()) await activePage.screenshot({ path: path.join(out, 'failure.png'), fullPage: true }).catch(() => {});
  throw error;
 } finally {
  fs.writeFileSync(path.join(out, visualOnly ? 'report-visual.json' : 'report.json'), JSON.stringify(report, null, 2));
  await browser.close();
 }
})().catch(error => { console.error(error); process.exitCode = 1; });
