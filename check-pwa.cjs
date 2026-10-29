// Run: node --preserve-symlinks --preserve-symlinks-main check-pwa.cjs
// Add --redirect to simulate clean URLs, and --lf to simulate Git newline conversion.
const fs = require('fs');
const path = require('path');
const http = require('http');
const assert = require('assert/strict');
const { pathToFileURL } = require('url');
process.env.PLAYWRIGHT_BROWSERS_PATH = path.resolve('tmp/playwright-browsers');
const { chromium } = require('C:/Users/1090602/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');

const root = __dirname;
const redirect = process.argv.includes('--redirect');
const normalizeLF = process.argv.includes('--lf');
const out = path.join(root, 'tmp/pwa-qa', (redirect ? 'redirect' : 'standard') + (normalizeLF ? '-lf' : ''));
const lessons = fs.readdirSync(root).filter(name => /^travel-.*\.html$/.test(name)).sort();
const pages = ['index.html', ...lessons];
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'manifest.webmanifest'), 'utf8'));
const workerSource = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
const versionMatch = workerSource.match(/const\s+VERSION\s*=\s*(['"])([^'"]+)\1/);
assert(versionMatch, 'Service worker exports a recognizable VERSION constant');
const initialVersion = versionMatch[2];
const nextVersion = initialVersion + '-qa-next';
const assets = ['manifest.webmanifest', ...manifest.icons.map(icon => icon.src.replace(/^\.\//, ''))];
const filesMatch = workerSource.match(/const\s+FILES\s*=\s*(\[[\s\S]*?\]);/);
assert(filesMatch, 'Service worker includes a generated asset list');
const allFiles = JSON.parse(filesMatch[1]).map(entry => entry.path);
for (const name of [...pages, ...assets]) assert(allFiles.includes(name), `${name} is in the worker asset list`);
const allowed = new Set([...allFiles, 'sw.js']);
const state = { failBroken: true, slowBroken: false, update: false };
const report = { redirect, normalizeLF, version: initialVersion, checks: [], screenshots: [], errors: [] };
const entrySelector = '#field-before-entry-v1-A,#field-before-A1,#field-before-A,#field-before';
async function openEntry(page) {
  const entry = page.locator(entrySelector).first();
  for (const details of await entry.locator('xpath=ancestor::details').all()) {
    if (!await details.evaluate(node => node.open)) await details.locator(':scope > summary').click();
  }
  return entry;
}
fs.mkdirSync(out, { recursive: true });

assert.equal(lessons.length, 16, 'All 16 lessons are included');
assert.equal(manifest.start_url, './index.html', 'Install starts inside the deployed subdirectory');
assert.equal(manifest.scope, './', 'Manifest scope is relative');
for (const file of pages) {
  const html = fs.readFileSync(path.join(root, file), 'utf8');
  for (const [tag, id] of [['script', 'travel-offline-script'], ['style', 'travel-offline-styles']]) {
    assert.equal([...html.matchAll(new RegExp('<' + tag + '\\b[^>]*\\bid="' + id + '"', 'g'))].length, 1, `${file}: ${id} appears once`);
  }
  assert.match(html, /rel="manifest"/, `${file}: manifest link`);
}
for (const name of allFiles) assert(fs.existsSync(path.join(root, name)), `${name} exists`);

// Every test server file stays inside the workspace. Mutated worker versions,
// missing resources, and delays exist only in memory during this test.
const server = http.createServer((req, res) => {
  const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  res.setHeader('Cache-Control', 'no-store');
  if (pathname === '/outside.html') {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.end('<!doctype html><title>Outside PWA scope</title><main>Outside PWA scope</main>');
    return;
  }
  const scoped = pathname.match(/^\/(first|second|broken)\/(.*)$/);
  if (!scoped) { res.writeHead(404); res.end('Not found'); return; }
  const scope = scoped[1];
  let name = scoped[2] || 'index.html';
  if (redirect && name.endsWith('.html')) {
    res.writeHead(302, { Location: `/${scope}/${name.slice(0, -5)}` });
    res.end();
    return;
  }
  if (!name.includes('.')) name += '.html';
  if (!allowed.has(name)) { res.writeHead(404); res.end('Not found'); return; }
  if (scope === 'broken' && name === 'travel-english-unit14-travel-questions.html' && state.failBroken) {
    res.writeHead(503); res.end('Intentional install failure'); return;
  }
  const send = () => {
    if (res.destroyed) return;
    const ext = path.extname(name);
    const types = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript; charset=utf-8', '.webmanifest': 'application/manifest+json', '.png': 'image/png', '.svg': 'image/svg+xml' };
    res.setHeader('Content-Type', types[ext] || 'application/octet-stream');
    if (name === 'sw.js') {
      let source = workerSource;
      if (scope === 'first' && state.update) source = source.replace(versionMatch[0], `const VERSION = ${JSON.stringify(nextVersion)}`);
      res.end(normalizeLF ? source.replace(/\r\n/g, '\n') : source);
    } else {
      let body = fs.readFileSync(path.join(root, name));
      if (normalizeLF && ['.html', '.webmanifest', '.svg'].includes(ext)) body = Buffer.from(body.toString('utf8').replace(/\r\n/g, '\n'));
      res.end(body);
    }
  };
  if (scope === 'broken' && state.slowBroken && name === 'travel-english-unit14-travel-questions.html') setTimeout(send, 1800);
  else send();
});

async function waitForReady(page) {
  await page.waitForFunction(() => document.querySelector('#travel-offline-status')?.textContent.includes('已可離線閱讀'), null, { timeout: 60000 });
  await page.waitForFunction(() => !!navigator.serviceWorker.controller, null, { timeout: 15000 });
  const status = await workerStatus(page);
  assert.equal(status.ready, true, 'Worker confirms complete cache');
  assert.equal(status.lessons, 16, 'Worker confirms all lessons');
  return status;
}

async function workerStatus(page, which = 'active', type = 'TRAVEL_OFFLINE_STATUS') {
  return page.evaluate(async ({ which, type }) => {
    const registration = await navigator.serviceWorker.getRegistration();
    const worker = which === 'controller' ? navigator.serviceWorker.controller : registration?.[which];
    if (!worker) return null;
    return new Promise((resolve, reject) => {
      const channel = new MessageChannel();
      const timer = setTimeout(() => reject(Error('Worker status timed out')), 10000);
      channel.port1.onmessage = event => { clearTimeout(timer); channel.port1.close(); resolve(event.data); };
      worker.postMessage({ type }, [channel.port2]);
    });
  }, { which, type });
}

async function active(page) {
  const iframe = await page.$('#travel-app-views iframe[data-active]');
  return iframe ? iframe.contentFrame() : page.mainFrame();
}

async function changeLesson(page, file) {
  const frame = await active(page);
  const link = frame.locator(`a[href="${file}"],a[href="./${file}"]`).first();
  const dayPicker = frame.locator('#dg-day-picker');
  const menu = frame.locator('.unit-menu');
  if (await dayPicker.count()) {
    if (!await dayPicker.evaluate(el => el.open)) await dayPicker.locator('summary').first().click();
  } else if (await menu.count() && !await menu.evaluate(el => el.open)) {
    await menu.locator('summary').first().click();
  }
  await link.click();
  await page.waitForFunction(file => {
    const frame = document.querySelector('#travel-app-views iframe[data-active]');
    const doc = frame?.contentDocument || document;
    return doc.querySelector('.day-switcher [aria-current="page"]')?.getAttribute('href') === file;
  }, file);
  return active(page);
}

async function screenshot(page, name) {
  const file = path.join(out, name + '.png');
  await page.locator('#travel-offline').screenshot({ path: file });
  report.screenshots.push(path.relative(root, file).replaceAll('\\', '/'));
}

async function checkPanel(page, prefix, controls = false) {
  await page.setViewportSize({ width: 320, height: 900 });
  if (await page.locator('#large').getAttribute('aria-pressed') !== 'true') await page.locator('#large').click();
  const details = page.locator('#travel-offline details');
  if (!await details.evaluate(el => el.open)) await details.locator('summary').click();
  assert(await details.locator('ol').isVisible(), 'Offline instructions actually expand');
  const appearances = [];
  for (const theme of ['light', 'dark']) {
    if (await page.locator('html').getAttribute('data-theme') !== theme) await page.locator('#theme,#themeToggle').click();
    await page.locator('#travel-offline').scrollIntoViewIfNeeded();
    const metrics = await page.locator('#travel-offline').evaluate(el => {
      const rect = el.getBoundingClientRect(), style = getComputedStyle(el);
      return {
        fits: rect.left >= 0 && rect.right <= innerWidth + 1,
        noOverflow: document.documentElement.scrollWidth <= innerWidth + 1,
        background: style.backgroundColor, color: style.color,
        text: el.textContent.trim()
      };
    });
    assert(metrics.fits && metrics.noOverflow, `${prefix}: ${theme} panel fits a 320px screen with enlarged text`);
    assert.notEqual(metrics.color, metrics.background, `${prefix}: status text remains visible`);
    appearances.push(metrics);
    if (controls) {
      const retry = page.locator('#travel-offline-retry');
      assert(await retry.isVisible(), `${prefix}: retry is visible`);
      assert(!await retry.isDisabled(), `${prefix}: retry is enabled after a failed install`);
      await retry.hover();
      await screenshot(page, `${prefix}-${theme}-hover`);
      await retry.focus();
      await page.keyboard.press('Shift+Tab');
      await page.keyboard.press('Tab');
      assert(await retry.evaluate(el => el === document.activeElement), 'Retry is keyboard focusable');
      assert(await retry.evaluate(el => getComputedStyle(el).outlineStyle !== 'none'), 'Keyboard focus on retry is visible');
      await screenshot(page, `${prefix}-${theme}-focus`);
    } else {
      await screenshot(page, `${prefix}-${theme}-expanded`);
      await details.locator('summary').hover();
      await screenshot(page, `${prefix}-${theme}-summary-hover`);
      await details.locator('summary').focus();
      await page.keyboard.press('Shift+Tab');
      await page.keyboard.press('Tab');
      assert(await details.locator('summary').evaluate(el => el === document.activeElement), 'Instructions are keyboard focusable');
      assert(await details.locator('summary').evaluate(el => getComputedStyle(el).outlineStyle !== 'none'), 'Keyboard focus on instructions is visible');
      await screenshot(page, `${prefix}-${theme}-summary-focus`);
    }
  }
  assert.notEqual(appearances[0].color, appearances[1].color, `${prefix}: status colors follow the selected theme`);
}

async function preservedData(page) {
  return page.evaluate(async () => ({
    saved: localStorage.getItem('pwa-qa-existing-answer'),
    cached: await (await (await caches.open('unrelated-app-cache')).match('/outside-record')).text(),
    names: await caches.keys()
  }));
}

async function main() {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const origin = `http://127.0.0.1:${server.address().port}`;
  const base = origin + '/first/';
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  let context;
  try {
    context = await browser.newContext({ viewport: { width: 768, height: 1024 } });
    context.on('page', page => page.on('pageerror', error => report.errors.push(error.message)));
    let page = await context.newPage();
    await page.goto(origin + '/outside.html');
    await page.evaluate(async () => {
      localStorage.setItem('pwa-qa-existing-answer', '保留原本作答');
      await (await caches.open('unrelated-app-cache')).put('/outside-record', new Response('independent cache'));
    });
    assert.equal(await page.evaluate(() => navigator.serviceWorker.controller), null, 'Outside URL is not controlled');
    await page.goto(base + 'index.html');
    const firstStatus = await waitForReady(page);
    assert.equal(firstStatus.version, initialVersion);
    const cacheAudit = await page.evaluate(async expected => {
      const names = (await caches.keys()).filter(name => name.includes(encodeURIComponent(new URL('.', location.href).href)));
      const keys = (await Promise.all(names.map(async name => (await (await caches.open(name)).keys()).map(req => new URL(req.url).pathname.split('/').pop())))).flat();
      return { names, missing: expected.filter(name => !keys.includes(name.split('/').pop())) };
    }, allFiles);
    assert.deepEqual(cacheAudit.missing, [], 'Every lesson, manifest, and icon is stored before readiness');
    assert.equal(cacheAudit.names.length, 1, 'One complete version is active');
    report.checks.push('initial-all-lessons-precache');
    await checkPanel(page, 'ready');
    const preserved = await preservedData(page);
    assert.equal(preserved.saved, '保留原本作答');
    assert.equal(preserved.cached, 'independent cache');
    report.checks.push('existing-storage-and-cache-preserved');

    // No lesson has been opened. Close the online page, then reopen while offline.
    await context.setOffline(true);
    for (const open of context.pages()) await open.close();
    page = await context.newPage();
    await page.goto(base);
    await waitForReady(page);
    assert(await page.locator('main').isVisible(), 'Home opens after all tabs were closed offline');
    await page.goto(base + 'travel-english-unit14-travel-questions.html');
    assert.equal(await page.locator('html').getAttribute('data-course-day'), '14', 'Previously unopened Day 14 loads offline');
    await page.evaluate(() => window.pwaQaIdentity = 'same document');
    const day1 = await changeLesson(page, 'travel-english.html');
    assert.equal(await page.evaluate(() => window.pwaQaIdentity), 'same document', 'Course navigation remains in travelApp');
    const answer = 'Offline answer survives a closed tab.';
    await (await openEntry(day1)).fill(answer);
    await page.close();
    page = await context.newPage();
    await page.goto(base + 'travel-english.html?offline=1#main');
    assert.equal(await page.locator(entrySelector).first().inputValue(), answer, 'Offline answer survives reopening');
    await page.reload();
    assert.equal(await page.locator(entrySelector).first().inputValue(), answer, 'Query/hash reload preserves offline answer');
    for (const route of ['travel-english-unit14-travel-questions?view=offline#main', 'index?offline=1#main', 'index.html?offline=1#main']) {
      await page.goto(base + route);
      assert(await page.locator('main').isVisible(), `${route} works offline`);
      await page.reload();
      assert(await page.locator('main').isVisible(), `${route} reload works offline`);
    }
    report.checks.push('offline-cold-reopen', 'offline-unvisited-day14', 'offline-travelApp-navigation', 'offline-answer-persistence', 'offline-query-hash-and-extensionless-aliases');

    for (const [language, file] of [['Japanese', 'travel-japanese-day0-directions.html'], ['Korean', 'travel-korean-day0-directions.html']]) {
      await page.goto(base + file);
      const decoded = await page.evaluate(async () => {
        const ac = new AudioContext();
        try {
          const results = [];
          for (const [text, url] of Object.entries(day0Audio)) {
            if (!url.startsWith('data:audio/')) throw Error('Recording is not embedded: ' + text);
            const data = Uint8Array.from(atob(url.split(',')[1]), char => char.charCodeAt(0));
            const audio = await ac.decodeAudioData(data.buffer);
            let peak = 0;
            for (const sample of audio.getChannelData(0)) peak = Math.max(peak, Math.abs(sample));
            if (audio.duration < .15 || peak < .001) throw Error('Invalid or silent recording: ' + text);
            results.push(audio.duration);
          }
          return { count: results.length, seconds: results.reduce((sum, duration) => sum + duration, 0) };
        } finally { await ac.close(); }
      });
      assert(decoded.count > 30, `${language} embedded recordings decode without a network`);
      report.checks.push(`${language.toLowerCase()}-offline-audio-${decoded.count}-clips`);
    }
    // Unknown pages must not silently receive a lesson or the home page.
    const missing = await page.evaluate(async () => {
      try { const response = await fetch('not-a-course.html'); return { ok: response.ok, status: response.status }; }
      catch { return { ok: false, status: 'offline' }; }
    });
    assert.equal(missing.ok, false, 'Unknown route is not replaced by an unrelated lesson');
    report.checks.push('unknown-route-not-cached');
    await context.setOffline(false);
    // Browsers can evict individual cache entries. A marker alone must not make
    // an incomplete package look ready, and repairing it must restore offline use.
    await page.evaluate(async ({ name, url }) => {
      const cache = await caches.open(name);
      if (!await cache.delete(url)) throw Error('No cached lesson to evict');
    }, { name: cacheAudit.names[0], url: base + 'travel-english-unit14-travel-questions.html' });
    assert.equal((await workerStatus(page)).ready, false, 'Evicted lesson makes status incomplete');
    assert.equal((await workerStatus(page, 'active', 'TRAVEL_OFFLINE_REPAIR')).ready, true, 'Repair restores the missing lesson');
    await context.setOffline(true);
    await page.goto(base + 'travel-english-unit14-travel-questions.html');
    assert.equal(await page.locator('html').getAttribute('data-course-day'), '14', 'Repaired lesson loads offline');
    await context.setOffline(false);
    report.checks.push('eviction-detected-and-missing-lesson-repaired');

    // Two independent deployments on one origin must keep different SW scopes.
    await page.goto(origin + '/second/index.html');
    await waitForReady(page);
    const secondNames = (await page.evaluate(() => caches.keys())).filter(name => name.includes(encodeURIComponent(origin + '/second/')));
    assert.equal(secondNames.length, 1, 'Second scope has its own complete cache');
    await page.goto(origin + '/outside.html');
    assert.equal(await page.evaluate(() => navigator.serviceWorker.controller), null, 'No controller leaks outside either scope');
    report.checks.push('service-worker-and-cache-scope-isolation');

    // A failed install must remain honestly incomplete; retry downloads again.
    await page.goto(origin + '/broken/index.html');
    await page.waitForFunction(() => {
      const retry = document.querySelector('#travel-offline-retry');
      return retry && !retry.hidden && !retry.disabled && getComputedStyle(retry).display !== 'none';
    }, null, { timeout: 60000 });
    assert(!(await page.locator('#travel-offline-status').innerText()).includes('已可離線閱讀'), 'A partial download is never reported ready');
    await checkPanel(page, 'install-failed', true);
    assert.equal(await page.evaluate(() => navigator.serviceWorker.controller), null, 'Failed worker never controls the page');
    state.failBroken = false;
    state.slowBroken = true;
    await page.locator('#travel-offline-retry').click();
    await page.waitForFunction(() => document.querySelector('#travel-offline-retry')?.disabled, null, { timeout: 5000 });
    await screenshot(page, 'retry-downloading-disabled');
    await waitForReady(page);
    state.slowBroken = false;
    await context.setOffline(true);
    await page.goto(origin + '/broken/travel-english-unit14-travel-questions.html');
    assert.equal(await page.locator('html').getAttribute('data-course-day'), '14');
    await context.setOffline(false);
    report.checks.push('failed-install-does-not-claim-ready', 'retry-controls-keyboard-hover-disabled', 'failed-install-retry-works-offline');

    // Serve a byte-identical package under a new worker version. The active
    // lesson and saved answer stay on the old version until every tab closes.
    await page.goto(base + 'travel-english.html');
    await waitForReady(page);
    assert.equal(await page.locator(entrySelector).first().inputValue(), answer);
    const secondTab = await context.newPage();
    await secondTab.goto(base + 'index.html');
    await waitForReady(secondTab);
    state.update = true;
    await page.evaluate(async () => {
      window.pwaQaRegistration = await navigator.serviceWorker.getRegistration();
      await window.pwaQaRegistration.update();
    });
    await page.waitForFunction(() => !!window.pwaQaRegistration.waiting, null, { timeout: 60000 });
    const waiting = await workerStatus(page, 'waiting');
    assert.equal(waiting.ready, true, 'Waiting update is fully downloaded');
    assert.equal(waiting.version, nextVersion);
    assert.equal((await workerStatus(page, 'controller')).version, initialVersion, 'New worker never interrupts the current lesson');
    const updatePreserved = await preservedData(page);
    assert(secondNames.every(name => updatePreserved.names.includes(name)), 'New installation keeps the second scope cache');
    assert.equal(updatePreserved.saved, '保留原本作答');
    assert.equal(updatePreserved.cached, 'independent cache');
    await page.close();
    assert.equal((await workerStatus(secondTab, 'controller')).version, initialVersion, 'Closing only one tab does not activate the update');
    await secondTab.close();
    for (const open of context.pages()) await open.close();
    page = await context.newPage();
    // Observe activation from outside the worker scope. Reopening a lesson
    // immediately can create a new old-version client before activation starts.
    await page.goto(origin + '/outside.html');
    await page.evaluate(async base => { window.pwaQaRegistration = await navigator.serviceWorker.getRegistration(base); }, base);
    await page.waitForFunction(() => window.pwaQaRegistration?.active?.state === 'activated' && !window.pwaQaRegistration.waiting, null, { timeout: 15000 });
    await page.goto(base + 'travel-english.html');
    assert.equal((await waitForReady(page)).version, nextVersion, 'Update activates when all old tabs have closed');
    assert.equal((await workerStatus(page, 'controller')).version, nextVersion, 'Reopened page is controlled by the new version');
    assert.equal(await page.locator(entrySelector).first().inputValue(), answer, 'Update preserves lesson answers');
    const finalPreserved = await preservedData(page);
    assert.equal(finalPreserved.saved, '保留原本作答');
    assert.equal(finalPreserved.cached, 'independent cache');
    assert(secondNames.every(name => finalPreserved.names.includes(name)), 'Activation preserves other scope caches');
    const firstNames = finalPreserved.names.filter(name => name.includes(encodeURIComponent(base)));
    assert.equal(firstNames.length, 1, 'Activation removes only older caches within this scope');
    assert(firstNames[0].endsWith(nextVersion));
    report.checks.push('complete-update-waits-for-all-tabs', 'update-preserves-answers-and-other-cache-scopes', 'activation-cleans-only-own-old-version');
    await context.setOffline(true);
    await page.reload();
    assert.equal(await page.locator(entrySelector).first().inputValue(), answer, 'New version remains usable offline');
    report.checks.push('updated-version-offline-reload');

    // Existing downloaded HTML is still directly readable without an HTTP host.
    const fileContext = await browser.newContext();
    const localPage = await fileContext.newPage();
    await localPage.goto(pathToFileURL(path.join(root, 'travel-english.html')).href);
    assert(await (await openEntry(localPage)).isVisible());
    assert(!await localPage.evaluate(() => typeof travelApp !== 'undefined'));
    await fileContext.close();
    report.checks.push('standalone-file-reading-preserved');
    assert.deepEqual(report.errors, [], 'No uncaught page errors');
    console.log('PASS PWA: ' + JSON.stringify({ redirect, normalizeLF, version: initialVersion, checks: report.checks, screenshots: report.screenshots.length }));
  } finally {
    fs.writeFileSync(path.join(out, 'report.json'), JSON.stringify(report, null, 2));
    await context?.close();
    await browser.close();
  }
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
}).finally(() => {
  server.closeAllConnections?.();
  server.close();
});
