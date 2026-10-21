// Run after build: node --preserve-symlinks --preserve-symlinks-main check-micro-layout.cjs
// Optional focused rerun: --lessons=en-6,ja-0 --widths=320,390
const fs = require('node:fs');
const path = require('node:path');
const {pathToFileURL} = require('node:url');
const {chromium} = require('C:/Users/1090602/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root = __dirname;
const output = path.join(root, 'tmp', 'all-micro', 'layout');
const args = Object.fromEntries(process.argv.slice(2).filter(s => s.startsWith('--')).map(s => s.slice(2).split('=')));
const ids = args.lessons?.split(',') || [...Array.from({length: 13}, (_, i) => `en-${i + 2}`), 'ja-0', 'ko-0'];
const widths = args.widths?.split(',').map(Number) || [320, 390, 768, 1440];
const report = {
  passed: false, lessons: [], views: 0, failures: [], screenshots: [], keyboardChecks: [],
  widths, themes: ['light', 'dark'], textSize: 'large',
  scope: '15 lessons, seven parts, expanded hints/readings/teacher cards, short-dialogue view, familiar-task mixed review and course menu. Every task additionally checked at 320 px.',
  limitations: ['This is layout QA; spoken audio quality and teaching effectiveness require separate review.']
};
fs.mkdirSync(output, {recursive: true});
function dataFor(id) {
  const [language, day] = id.split('-');
  return language === 'en' ? require('./assets/micro-curriculum.cjs').make(+day) : require('./assets/micro-day0.cjs').make(language);
}
async function openDetails(page) {
  await page.evaluate(() => {
    document.querySelectorAll('#main details').forEach(details => { details.open = true; });
  });
}
async function inspect(page, label) {
  report.views++;
  const result = await page.evaluate(() => {
    const vw = innerWidth;
    const visible = el => el.getClientRects().length && getComputedStyle(el).visibility !== 'hidden';
    const isScrollable = el => {
      for (let p = el; p && p !== document.body; p = p.parentElement) {
        const style = getComputedStyle(p);
        if (/(auto|scroll)/.test(style.overflowX) && p.scrollWidth > p.clientWidth + 2) return true;
      }
      return false;
    };
    const outside = [...document.querySelectorAll('#main *, #courseMenu *, .top *')]
      .filter(el => visible(el) && !isScrollable(el))
      .map(el => ({el, box: el.getBoundingClientRect()}))
      .filter(({box}) => box.width > 0 && (box.left < -2 || box.right > vw + 2))
      .slice(0, 12)
      .map(({el, box}) => ({tag: el.tagName, class: el.className, text: el.textContent.trim().slice(0, 100), left: +box.left.toFixed(1), right: +box.right.toFixed(1)}));
    return {
      viewport: vw,
      documentWidth: document.documentElement.scrollWidth,
      bodyWidth: document.body.scrollWidth,
      outside,
      openDetails: document.querySelectorAll('#main details[open]').length
    };
  });
  if (result.documentWidth > result.viewport + 2 || result.bodyWidth > result.viewport + 2 || result.outside.length) {
    const entry = {label, ...result};
    report.failures.push(entry);
    if (report.failures.length <= 8) {
      const file = `failure-${report.failures.length}.png`;
      await page.screenshot({path: path.join(output, file), fullPage: false});
      entry.screenshot = file;
    }
  }
}
async function capture(page, name, selector) {
  const file = `${name}.png`;
  if (selector) {
    const target = page.locator(selector).first();
    const box = await target.boundingBox();
    if (box && box.height < page.viewportSize().height - 120) {
      await target.screenshot({path: path.join(output, file)});
    } else {
      // A real viewport screenshot avoids stitching a sticky toolbar through
      // the middle of a tall, artificially extended element screenshot.
      await target.evaluate(el => {
        const inset = (document.querySelector('.top')?.getBoundingClientRect().height || 0) + 16;
        window.scrollTo({top: Math.max(0, window.scrollY + el.getBoundingClientRect().top - inset), behavior: 'instant'});
      });
      await page.screenshot({path: path.join(output, file), fullPage: false});
    }
  } else await page.screenshot({path: path.join(output, file), fullPage: false});
  report.screenshots.push(file);
}
async function show(page, part, round, mixed = false, replyView = false) {
  await page.evaluate(({part, round, mixed, replyView}) => {
    setTaskRound(round);
    if (replyView) mode = 'reply';
    navigate(part);
    if (mixed) {
      roundsDone = rounds.map(r => r.id);
      reviewIds = [...roundsDone];
      reviewMode = 'mixed';
      render();
    }
    document.querySelectorAll('#main details').forEach(d => { d.open = true; });
  }, {part, round, mixed, replyView});
}
async function lesson(browser, id) {
  const data = dataFor(id);
  const file = data.file || (id === 'ja-0' ? 'travel-japanese-day0-directions.html' : 'travel-english-unit2-shopping.html');
  const page = await browser.newPage({viewport: {width: 390, height: 844}, reducedMotion: 'reduce'});
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  try {
    await page.goto(pathToFileURL(path.join(root, file)).href, {waitUntil: 'load'});
    const meta = await page.evaluate(() => ({version: microVersion, count: rounds.length, language, courseId: course.id}));
    if (meta.version !== 1 || meta.count !== data.rounds.length) throw Error('Built lesson does not match current task data.');
    // Longest task stresses wrapped text. Day 6 deliberately covers both food option grids.
    let round = data.rounds.reduce((best, r, i) => JSON.stringify(r).length > JSON.stringify(data.rounds[best]).length ? i : best, 0);
    if (id === 'en-6') round = data.rounds.findIndex(r => r.key.includes('steak-and-eggs'));
    if (id === 'ja-0' || id === 'ko-0') round = 1;
    const entry = {id, file, tasks: meta.count, representative: data.rounds[round].id, views: 0};
    report.lessons.push(entry);
    const start = report.views;
    for (const width of widths) {
      await page.setViewportSize({width, height: width >= 768 ? 1000 : 844});
      for (const theme of report.themes) {
        await page.evaluate(theme => {
          document.documentElement.dataset.theme = theme;
          document.documentElement.dataset.size = 'large';
          appearance();
        }, theme);
        for (let part = 0; part < 7; part++) {
          await show(page, part, round);
          await inspect(page, `${id}/${width}/${theme}/part-${part + 1}/current`);
          if (part === 1) {
            if (width === 390 && ['ja-0', 'ko-0'].includes(id)) {
              await capture(page, `${id}-${theme}-readings`, '.study-library');
              await capture(page, `${id}-${theme}-variation`, data.course.studySupplement?'.study-supplement':'.micro-variation');
            }
            if (id === 'en-6' && width === 320 && theme === 'dark') await capture(page, 'en-6-dark-food-options', '.food-usage');
            // Exercise the real subview control, then expand both levels of hints.
            await page.locator('[data-study-view="reply"]').click();
            await openDetails(page);
            await inspect(page, `${id}/${width}/${theme}/part-2/short-dialogue`);
          }
          if (part === 4 && id === 'en-9' && width === 390) {
            const summary = page.locator('details.teacher > summary');
            await summary.focus();
            await page.keyboard.press('Enter');
            await page.keyboard.press('Enter');
            const keyboard = await summary.evaluate(el => ({open: el.parentElement.open, focused: document.activeElement === el}));
            report.keyboardChecks.push({label: `${id}/${theme}/teacher`, ...keyboard});
            if (!keyboard.open || !keyboard.focused) report.failures.push({label: `${id}/${theme}/teacher-keyboard`, ...keyboard});
            await capture(page, `en-9-${theme}-teacher`, 'details.teacher');
          }
          if (part >= 5) {
            await page.evaluate(() => { roundsDone = rounds.map(r => r.id); render(); });
            await page.locator('[data-review-mode="mixed"]').click();
            await openDetails(page);
            await inspect(page, `${id}/${width}/${theme}/part-${part + 1}/mixed`);
            if (id === 'en-10' && part === 5 && width === 390) {
              const option = page.locator('[data-review-round]').first();
              const wasChecked = await option.isChecked();
              await option.focus();
              await page.keyboard.press('Space');
              const keyboard = await option.evaluate((el, wasChecked) => ({toggled: el.checked !== wasChecked, checked: el.checked, focused: document.activeElement === el}), wasChecked);
              report.keyboardChecks.push({label: `${id}/${theme}/mixed`, ...keyboard});
              if (!keyboard.toggled || !keyboard.focused) report.failures.push({label: `${id}/${theme}/mixed-keyboard`, ...keyboard});
              await option.hover();
              await capture(page, `en-10-${theme}-mixed`, '.review-scope');
            }
          }
        }
        // The course menu is a popup at phone/tablet widths.
        if (width <= 768) {
          await page.locator('#courseMenu').evaluate(el => { el.open = true; });
          await inspect(page, `${id}/${width}/${theme}/course-menu`);
          if (id === 'ja-0' && width === 390) {
            await page.locator('#courseMenu summary').focus();
            await page.keyboard.press('Enter');
            await page.keyboard.press('Enter');
            const keyboard = await page.locator('#courseMenu').evaluate(el => ({open: el.open, focused: document.activeElement === el.querySelector('summary')}));
            report.keyboardChecks.push({label: `${id}/${theme}/course-menu`, ...keyboard});
            if (!keyboard.open || !keyboard.focused) report.failures.push({label: `${id}/${theme}/course-menu-keyboard`, ...keyboard});
            await page.locator('#courseMenu summary').hover();
            await capture(page, `ja-0-${theme}-course-menu`, '#courseMenu');
          }
          await page.locator('#courseMenu').evaluate(el => { el.open = false; });
        }
      }
    }
    // A narrow-screen pass covers every task's distinct content, including one-turn tasks.
    await page.setViewportSize({width: 320, height: 844});
    await page.evaluate(() => { document.documentElement.dataset.theme = 'light'; appearance(); });
    for (let task = 0; task < data.rounds.length; task++) {
      for (const part of [1, 2, 3, 4, 5, 6]) {
        await show(page, part, task);
        await inspect(page, `${id}/320/light/all-tasks/${data.rounds[task].id}/part-${part + 1}`);
      }
    }
    entry.views = report.views - start;
    entry.pageErrors = errors;
    if (errors.length) report.failures.push({label: id, pageErrors: errors});
    console.log(`${id}: ${entry.views} layout views, ${errors.length} page errors`);
  } finally { await page.close(); }
}
async function main() {
  const browser = await chromium.launch({channel: 'msedge', headless: true});
  try {
    for (const id of ids) {
      try { await lesson(browser, id); }
      catch (error) { report.failures.push({label: id, error: error.stack || String(error)}); console.error(`${id}: ${error.message}`); }
    }
  } finally { await browser.close(); }
  report.passed = report.failures.length === 0 && report.lessons.length === ids.length;
  const reportFile = args.lessons || args.widths ? 'report-focused.json' : 'report.json';
  fs.writeFileSync(path.join(output, reportFile), JSON.stringify(report, null, 2) + '\n');
  console.log(`${report.passed ? 'PASS' : 'FAIL'}: ${report.lessons.length} lessons, ${report.views} views, ${report.failures.length} failures.`);
  console.log(path.relative(root, path.join(output, reportFile)));
  process.exitCode = report.passed ? 0 : 1;
}
main();
