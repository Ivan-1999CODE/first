// Browser emulation; this does not certify a physical iPad.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
process.env.PLAYWRIGHT_BROWSERS_PATH ||= path.resolve('tmp/playwright-browsers');
const { chromium, webkit } = require(process.env.PLAYWRIGHT_PATH || 'C:/Users/1090602/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const before = process.argv.includes('--before');
const engine = process.argv.includes('--webkit') ? 'webkit' : 'edge';
const out = path.resolve('tmp/day1-task-c-layout', before ? 'before' : engine);
fs.mkdirSync(out, { recursive: true });
const profiles = before ? [[1024, 768]] : [[1024, 768], [1180, 820], [1194, 834], [1366, 1024], [768, 1024], [820, 1180], [834, 1194], [390, 844], [320, 568]];

(async () => {
  const browser = await (engine === 'webkit' ? webkit.launch() : chromium.launch({ channel: 'msedge', headless: true }));
  const report = [];
  try {
    for (const [width, height] of profiles) for (const theme of ['dark', 'light']) for (const size of ['large', 'standard']) {
      const context = await browser.newContext({ viewport: { width, height }, hasTouch: true, reducedMotion: 'reduce' });
      const page = await context.newPage(), errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.addInitScript(({ theme, size }) => {
        localStorage.setItem('travel-lab-theme', theme);
        localStorage.setItem('travel-lab-text-size', size);
      }, { theme, size });
      await page.goto(pathToFileURL(path.resolve('travel-english.html')).href);
      await page.evaluate(() => start(2));
      const label = `${width}x${height}-${theme}-${size}`;
      const capture = before || ((width === 1024 || width === 768) && theme === 'dark' && size === 'large') || (width === 1180 && theme === 'light' && size === 'standard');
      const check = async state => {
        if (capture) await page.locator('.vf-spatial').screenshot({ path: path.join(out, `${label}-${state}.png`) });
        const problems = await page.locator('.vf-spatial').evaluate(board => {
          const issues = [];
          const rect = element => element.getBoundingClientRect();
          const inside = (inner, outer) => inner.left >= outer.left - 1 && inner.right <= outer.right + 1 && inner.top >= outer.top - 1 && inner.bottom <= outer.bottom + 1;
          for (const card of board.querySelectorAll('.vf-object')) {
            const art = card.querySelector('.vf-art'), text = card.querySelector(':scope > span:not(.vf-choice-action):not(.vf-arrived)'), action = card.querySelector('.vf-choice-action');
            const bounds = rect(card);
            if (!inside(bounds, rect(board))) issues.push('card exceeds board');
            for (const element of [art, text, action]) if (!inside(rect(element), bounds)) issues.push('content exceeds card: ' + element.tagName);
            if (rect(text).top < rect(art).bottom - 1 || rect(action).top < rect(text).bottom - 1) issues.push('image, text and action overlap instead of stacking');
            if (rect(text).width < bounds.width * .65) issues.push('label is squeezed into a narrow column');
            for (const element of [text, action]) if (element.scrollWidth > element.clientWidth + 1) issues.push('text overflows');
          }
          if (document.documentElement.scrollWidth > innerWidth + 1) issues.push('page overflows viewport');
          return issues;
        });
        report.push({ label, state, problems });
        fs.writeFileSync(path.join(out, 'report.json'), JSON.stringify(report, null, 2));
        assert.deepEqual(problems, [], `${label}/${state}`);
      };
      assert.equal(await page.locator('.vf-spatial .vf-object').count(), 2);
      assert(await page.locator('.vf-spatial .vf-object').evaluateAll(cards => cards.every(card => card.disabled)));
      await check('locked');
      for (let step = 0; step < 2; step++) {
        await page.locator('#spoken').check();
        await page.locator('#heard').check();
        await check(`step${step}-ready`);
        const indices = await page.evaluate(() => ({ valid: currentStep().valid[0], wrong: currentStep().objects.findIndex((_, index) => !currentStep().valid.includes(index)) }));
        await page.locator(`[data-choice="${indices.wrong}"]`).click();
        assert(await page.locator('[data-act="next"]').isDisabled());
        await check(`step${step}-wrong`);
        const valid = page.locator(`[data-choice="${indices.valid}"]`);
        await valid.hover();
        await valid.press('Tab');
        await page.keyboard.press('Shift+Tab');
        assert.notEqual(await valid.evaluate(element => getComputedStyle(element).outlineStyle), 'none');
        if (capture && step === 0) await page.locator('.vf-spatial').screenshot({ path: path.join(out, `${label}-hover-focus.png`) });
        await valid.press('Enter');
        assert(await page.locator('[data-act="next"]').isEnabled());
        await check(`step${step}-selected`);
        const selection = await page.locator('.vf-spatial [aria-pressed="true"]').getAttribute('data-choice');
        await page.setViewportSize({ width: height, height: width });
        await check(`step${step}-rotated`);
        assert.equal(await page.locator('.vf-spatial [aria-pressed="true"]').getAttribute('data-choice'), selection);
        await page.setViewportSize({ width, height });
        await page.locator('[data-act="next"]').click();
      }
      assert.equal(await page.locator('.vf-final').count(), 1);
      assert.deepEqual(errors, []);
      await context.close();
    }
    console.log(`PASS ${engine}: ${profiles.length * 4} viewport/theme/text combinations; Task C locked, ready, retry, keyboard selection, completion and rotation; ${report.length} layout checks.`);
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
