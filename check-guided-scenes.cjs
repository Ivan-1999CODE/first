const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const {pathToFileURL} = require('node:url');
const {chromium} = require('C:/Users/1090602/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const curriculum = require('./assets/micro-curriculum.cjs');
const output = path.resolve('tmp/lesson-guided-scenes');
fs.mkdirSync(output, {recursive: true});

(async () => {
 const browser = await chromium.launch({channel: 'msedge', headless: true});
 const report = {days: [], screenshots: [], errors: []};
 try {
  for (let day = 2; day <= 14; day++) {
   const data = curriculum.make(day);
   const file = data.file || 'travel-english-unit2-shopping.html';
   const context = await browser.newContext({viewport: {width: 1024, height: 768}});
   const page = await context.newPage();
   page.on('pageerror', error => report.errors.push({day, message: error.message}));
   await page.goto(pathToFileURL(path.resolve(file)).href);
   assert.equal(await page.locator('body.lesson-guided').count(), 1, `Day ${day} has built guided layer`);
   assert.equal(await page.evaluate(() => course.id), data.course.id);
   const result = await page.evaluate(() => {
    const verify = (value, message) => { if (!value) throw Error(`Day ${course.day}: ${message}`); };
    const click = selector => {
     const element = document.querySelector(selector);
     verify(element && !element.disabled, `Available control ${selector}`);
     element.click();
    };
    const result = {flows: 0, steps: 0, missions: 0, wrongRetries: 0, undo: 0, back: 0, selfFirst: 0, otherFirst: 0, sceneChanges: 0};
    for (let fi = 0; fi < flows.length; fi++) {
     start(fi);
     result.flows++;
     verify(document.querySelectorAll('.dg-speaker').length === 1, 'one current speaker');
     verify(!document.querySelector('.turn-waiting'), 'no waiting role card');
     verify(document.querySelectorAll('#main > .tabs [data-start]').length === (activeRound().flowIds.length > 1 ? activeRound().flowIds.length : 0), 'all alternative flows remain accessible');
     if (activeRound().flowIds.length > 1) {
      click(`#main > .tabs [data-start="${fi}"]`);
      verify(flow === fi && turn === 0 && history.length === 0, 'flow tab starts the selected alternative');
     }
     let visited = 0, wentBack = false;
     while (!finished) {
      verify(visited++ < 100, 'finite flow');
      const t = currentStep(), first = t.askFirst ? 'spoken' : 'heard', second = t.askFirst ? 'heard' : 'spoken';
      result[t.askFirst ? 'selfFirst' : 'otherFirst']++;
      verify(document.querySelectorAll('#heard').length === 1 && document.querySelectorAll('#spoken').length === 1, 'both focus targets retained');
      verify([...document.querySelectorAll('[data-choice]')].every(b => b.disabled), 'objects locked before listening and speaking');
      verify(document.querySelector('[data-act="next"]').disabled, 'next locked initially');
      verify(!document.querySelector('.dg-scene-progress')?.open, 'full task progress starts collapsed');
      const metadata = flows[flow].steps.slice(0, turn + 1).reverse().find(s => s.sceneTitle || s.sceneContext);
      if (metadata?.sceneContext) {
       verify(document.querySelector('.dg-scene-context').textContent.includes(metadata.sceneContext), 'current scene context retained');
       result.sceneChanges++;
      }
      if (t.askFirst) {
       click('.dg-speaker [data-guide-hint][data-level="2"]');
       verify(document.querySelector('.dg-speaker [data-pane="2"] .en').textContent === t.answer, 'original speaking answer retained');
      } else {
       click('.dg-speaker [data-dg-transcript]');
       verify(document.querySelector('.dg-listening .en').textContent === t.line, 'original spoken line retained');
      }
      click('#' + first);
      verify(document.getElementById(first).checked, 'first confirmation stays checked');
      verify(document.getElementById(second).disabled === false, 'second confirmation enabled');
      verify(document.activeElement.id === first, 'focus restored after switching current role');
      if (t.askFirst) {
       const role = t.role || metadata?.role || activeRound().role || course.replyRole;
       verify(document.querySelector('.dg-role').textContent === '對方 · ' + role, 'correct counterpart after scene transition');
       click('.dg-speaker [data-dg-transcript]');
       verify(document.querySelector('.dg-listening .en').textContent === t.line, 'current counterpart line retained');
      } else {
       click('.dg-speaker [data-guide-hint][data-level="2"]');
       verify(document.querySelector('.dg-speaker [data-pane="2"] .en').textContent === t.answer, 'current learner reply retained');
      }
      click('#' + second);
      verify(heard && spoken, 'both steps confirmed');
      verify([...document.querySelectorAll('[data-choice]')].every(b => !b.disabled), 'objects unlocked after both confirmations');
      const bad = t.objects.findIndex((_, i) => !accepted(t, i));
      if (bad >= 0) {
       click(`[data-choice="${bad}"]`);
       verify(!canNext() && !!document.querySelector('.dg-choice-wrong'), 'wrong answer is marked and cannot advance');
       result.wrongRetries++;
      }
      const valid = t.valid[t.valid.length - 1];
      click(`[data-choice="${valid}"]`);
      verify(canNext() && history[turn] === valid, 'valid selection updates history and allows next');
      if (turn === 0) {
       click('#' + first);
       verify(!heard && !spoken && choice === -1 && history.length === 0, 'undo clears dependent confirmations and choices');
       click('#' + first); click('#' + second); click(`[data-choice="${valid}"]`);
       result.undo++;
      }
      result.steps++;
      click('[data-act="next"]');
      if (!wentBack && !finished && turn === 1) {
       click('[data-act="back"]');
       verify(turn === 0 && history.length === 0 && !heard && !spoken && choice === -1, 'back resets dependent step state');
       wentBack = true; result.back++;
      }
     }
     verify(!!document.querySelector('.dg-completion'), 'completion view reached');
     verify(state.complete.includes(flows[fi].id), 'completion saved');
    }
    for (let ri = 0; ri < rounds.length; ri++) {
     if (taskRound !== ri) click(`[data-dg-task="${ri}"]`); else setTaskRound(ri);
     verify(flow === activeRound().flowIds[0] && turn === 0 && history.length === 0 && !heard && !spoken && !finished, 'task switch resets current flow only');
     for (const mi of rounds[ri].missionIds) {
      mission = mi; navigate(3);
      if (rounds[ri].missionIds.length > 1) click(`#main > .tabs [data-mission="${mi}"]`);
      const m = missions[mi], key = 'mission-' + m.id;
      verify(document.querySelector('.dg-task-panel .task').textContent === m.task, 'original mission task retained');
      verify(document.querySelectorAll('#main > .tabs [data-mission]').length === (rounds[ri].missionIds.length > 1 ? rounds[ri].missionIds.length : 0), 'all mission variants remain accessible');
      const hint = document.querySelector('.dg-mission-grid .dg-hint');
      verify(hint.dataset.hintKey === key, 'stable mission hint key');
      verify(hint.querySelector('[data-pane="0"]').getAttribute('aria-hidden') === 'false', 'mission starts without answer');
      click('.dg-mission-grid [data-guide-hint][data-level="1"]');
      verify(hint.querySelector('[data-pane="1"] .dg-keywords').textContent === m.words, 'original mission keywords retained');
      click('.dg-mission-grid [data-guide-hint][data-level="2"]');
      verify(hint.querySelector('[data-pane="2"] .en').textContent === m.answer, 'original mission answer retained');
      const input = document.querySelector(`[data-field="${key}"]`);
      input.value = 'QA ' + m.id; input.dispatchEvent(new Event('input', {bubbles: true}));
      verify(state.answers[key] === input.value, 'mission answer saved under original key');
      result.missions++;
     }
    }
    result.savedKey = course.id;
    result.savedMissions = missions.map(m => ({key: 'mission-' + m.id, answer: state.answers['mission-' + m.id]}));
    return result;
   });
   await page.reload();
   assert.deepEqual(await page.evaluate(expected => expected.map(({key}) => ({key, answer: state.answers[key]})), result.savedMissions), result.savedMissions, `Day ${day} mission answers survive reload`);
   delete result.savedKey; delete result.savedMissions;
   report.days.push({day, ...result});
   console.log(`Day ${day}: ${result.flows} flows, ${result.steps} turns, ${result.missions} missions passed`);
   if ([2, 8].includes(day)) {
    for (const configuration of [{width: 1366, height: 768, theme: 'light', size: 'standard'}, {width: 1024, height: 768, theme: 'dark', size: 'large'}, {width: 390, height: 844, theme: 'light', size: 'large'}]) {
     await page.setViewportSize({width: configuration.width, height: configuration.height});
     await page.evaluate(({theme, size}) => {
      document.documentElement.dataset.theme = theme; document.documentElement.dataset.size = size; appearance();
      setTaskRound(0); start(activeRound().flowIds[0]);
      if (!currentStep().askFirst) document.querySelector('#heard').click();
      document.querySelector('.dg-speaker [data-guide-hint][data-level="2"]').click();
     }, configuration);
     assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), true, 'No horizontal overflow in speaker view');
     let name = `day${day}-${configuration.width}-${configuration.theme}-speaker.png`;
     await page.screenshot({path: path.join(output, name), fullPage: true}); report.screenshots.push(name);
     await page.evaluate(() => {
      start(activeRound().flowIds[0]);
      if (currentStep().askFirst) document.querySelector('#spoken').click();
      document.querySelector('[data-dg-transcript]').click();
      window.dgCheckConfirmTop = document.querySelector('.dg-turn-confirm').getBoundingClientRect().top;
      document.querySelector('.dg-scene-progress').open = true;
     });
     assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), true, 'No horizontal overflow with transcript and progress open');
     assert.equal(await page.evaluate(() => Math.abs(document.querySelector('.dg-turn-confirm').getBoundingClientRect().top - window.dgCheckConfirmTop) < 2), true, 'Opening task progress does not move the current role confirmation');
     name = `day${day}-${configuration.width}-${configuration.theme}-listening.png`;
     await page.screenshot({path: path.join(output, name), fullPage: true}); report.screenshots.push(name);
    }
   }
   await context.close();
  }
  assert.deepEqual(report.errors, [], 'No page errors');
  fs.writeFileSync(path.join(output, 'report.json'), JSON.stringify(report, null, 2));
  console.log('PASS: all guided scenes, saved mission answers, and representative responsive views.');
 } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
