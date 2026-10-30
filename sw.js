/* Generated as sw.js by build-pwa.cjs after all lesson HTML has been rebuilt. */
'use strict';

const VERSION = "9f125b11ca1c0648";
const FILES = [
  {
    "path": "assets/pwa-icon-180.png",
    "bytes": 3721,
    "sha256": "e5002048fcdb4dbd24e19f3c5efb010274288adbfa5acf7e1eb22d8f534092bc"
  },
  {
    "path": "assets/pwa-icon-192.png",
    "bytes": 3937,
    "sha256": "b022126eeb939b713ef0733bec80fb8519face2f1e84a7fb060be5f7b8ae91ab"
  },
  {
    "path": "assets/pwa-icon-512.png",
    "bytes": 11514,
    "sha256": "9cdd68580083a79d23118953227b31ab772488a626b8bab45054ca8aac419640"
  },
  {
    "path": "assets/pwa-icon.svg",
    "bytes": 322,
    "sha256": "f7e08c0490023ac567b1411d31b1e8f71f24c54e5bec87b15a11ca15608977db",
    "normalizedText": true
  },
  {
    "path": "index.html",
    "bytes": 46895,
    "sha256": "71db143fe81a21cc9aed325bce0a86aaa6fe75517871455fcdddc364819a0d29",
    "normalizedText": true
  },
  {
    "path": "manifest.webmanifest",
    "bytes": 625,
    "sha256": "4a3e4c6128306a84fd42542259ef606d4f4765c4ef36cfb6a376695b5df6fc7a",
    "normalizedText": true
  },
  {
    "path": "travel-english-unit10-kind-words.html",
    "bytes": 620779,
    "sha256": "a1fe1c3429a8cbbc532972c4b257e5e7fad0b381d0649f424633d403329875cd",
    "normalizedText": true
  },
  {
    "path": "travel-english-unit11-what.html",
    "bytes": 704911,
    "sha256": "46659b62b0aaa3b2adae437cd0413a40dad1fd0daac31d3a0a68c02df39cc7c0",
    "normalizedText": true
  },
  {
    "path": "travel-english-unit12-how.html",
    "bytes": 712120,
    "sha256": "a1eb6f796c66cf747dc271191f27328b8d1187da6cd7b6084bca9bab7091f260",
    "normalizedText": true
  },
  {
    "path": "travel-english-unit13-why-which.html",
    "bytes": 519322,
    "sha256": "6239b4a79419005e2cacaad12a078a42c96ea459704553945bf2a1389d222ae3",
    "normalizedText": true
  },
  {
    "path": "travel-english-unit14-travel-questions.html",
    "bytes": 635457,
    "sha256": "23740f5f89c750845125cb7e08d2b1cc20850633ead534ff08c75b88b964eaec",
    "normalizedText": true
  },
  {
    "path": "travel-english-unit2-shopping.html",
    "bytes": 585631,
    "sha256": "61fb776b1fdf9cc59356462a72a57105b557a36f10d7778c6cabf131c8b81035",
    "normalizedText": true
  },
  {
    "path": "travel-english-unit3-airport.html",
    "bytes": 606765,
    "sha256": "5b2ffc770e225d63f7584a6aab7095d4792e705a071cacb44650058455457737",
    "normalizedText": true
  },
  {
    "path": "travel-english-unit4-transit.html",
    "bytes": 726296,
    "sha256": "df7de36a9c6985ccdb0d818f0b8d76df4b479bb1bf8048f0d104a29d4f9f410a",
    "normalizedText": true
  },
  {
    "path": "travel-english-unit5-getting-around.html",
    "bytes": 677508,
    "sha256": "9102e419e976f20685b502e6c3ece1c04446ff36ff3b4619635610ca4a090d79",
    "normalizedText": true
  },
  {
    "path": "travel-english-unit6-ordering.html",
    "bytes": 3256603,
    "sha256": "88ca1c049b23e4b7f26edbf1ce8ceed3ba5831567e678e2a4ecadf63f4204a1c",
    "normalizedText": true
  },
  {
    "path": "travel-english-unit7-fitting.html",
    "bytes": 615928,
    "sha256": "badd57802ba6ce622bcbe8c1c714f78699636cace37130167248455a64adc4d1",
    "normalizedText": true
  },
  {
    "path": "travel-english-unit8-hotel.html",
    "bytes": 635223,
    "sha256": "b4b9ccada8443788fb794cb9254bda0f275433589034256a91daead1fd1b0c52",
    "normalizedText": true
  },
  {
    "path": "travel-english-unit9-reservations.html",
    "bytes": 712637,
    "sha256": "c7ccda4c6b1609c313f4a092203b7b9e59ac3112a7ee29e78f859fe9e95df858",
    "normalizedText": true
  },
  {
    "path": "travel-english.html",
    "bytes": 544222,
    "sha256": "be7fd6053dfdc313fb1500377563ebbc35db862c5f633723b3a892fadad64cc4",
    "normalizedText": true
  },
  {
    "path": "travel-japanese-day0-directions.html",
    "bytes": 4548834,
    "sha256": "5748e8680d48d3f514a914d4588ac11c31bb97fc1e5b7565a093688186a29d22",
    "normalizedText": true
  },
  {
    "path": "travel-korean-day0-directions.html",
    "bytes": 3781313,
    "sha256": "87abb61054357abe6c18d86d7be982c33e1a2c24d3c20718c7d7720b4f774c38",
    "normalizedText": true
  }
];
const LESSON_COUNT = 16;
const SCOPE = self.registration.scope;
const CACHE_PREFIX = `travel-lab-pwa:${encodeURIComponent(SCOPE)}:`;
const CACHE_NAME = CACHE_PREFIX + VERSION;
const COMPLETE_URL = new URL('__travel_pwa_complete__', SCOPE).href;
const TOTAL_BYTES = FILES.reduce((total, entry) => total + entry.bytes, 0);
const ENTRIES = new Map(FILES.map(entry => [new URL(entry.path, SCOPE).href, entry]));
const ROUTES = new Map();
let repairPending = null;

for (const [url, entry] of ENTRIES) {
  ROUTES.set(new URL(url).pathname, url);
  if (entry.path.endsWith('.html')) ROUTES.set(new URL(url.slice(0, -5)).pathname, url);
}
ROUTES.set(new URL(SCOPE).pathname, new URL('index.html', SCOPE).href);

function canonical(request) {
  if (request.method !== 'GET') return null;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return null;
  const target = ROUTES.get(url.pathname);
  // Queries are harmless for lesson navigation; asset URLs must match their explicit cache entry.
  if (!target || (url.search && !ENTRIES.get(target).path.endsWith('.html'))) return null;
  return target;
}

async function isComplete(cache) {
  const marker = await cache.match(COMPLETE_URL);
  if (!marker) return false;
  try {
    const status = await marker.json();
    if (status.version !== VERSION || status.files !== FILES.length) return false;
  } catch {
    return false;
  }
  // A marker alone is insufficient: browsers or users may remove individual cached responses.
  for (const url of ENTRIES.keys()) if (!await cache.match(url)) return false;
  return true;
}

async function verifiedResponse(url, entry) {
  const abort = new AbortController();
  const timer = setTimeout(() => abort.abort(), 45000);
  try {
  const response = await fetch(new Request(url, { cache: 'reload', credentials: 'same-origin', signal: abort.signal }));
  if (!response.ok || response.type === 'opaque') throw new Error(`Unable to cache ${entry.path}: ${response.status}`);
  if (entry.path.endsWith('.html') && !/^text\/html(?:\s*;|$)/i.test(response.headers.get('content-type') || '')) {
    throw new Error(`Expected HTML for ${entry.path}`);
  }
  const received = await response.arrayBuffer();
  // Hash the same UTF-8/LF representation used by the build, regardless of Git checkout or host line endings.
  // Preserve a leading BOM as content, and reject invalid UTF-8 rather than silently changing it.
  const buffer = entry.normalizedText
    ? new TextEncoder().encode(new TextDecoder('utf-8', { fatal: true, ignoreBOM: true }).decode(received).replace(/\r\n?/g, '\n'))
    : received;
  if (buffer.byteLength !== entry.bytes) throw new Error(`Unexpected size for ${entry.path}`);
  const checksum = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', buffer)), byte => byte.toString(16).padStart(2, '0')).join('');
  if (checksum !== entry.sha256) throw new Error(`Unexpected contents for ${entry.path}`);
  const headers = new Headers(response.headers);
  // fetch() has already decoded the body, so do not retain transport encoding or length.
  headers.delete('content-encoding');
  headers.delete('content-length');
  // Reconstruct the response so hosting redirects do not produce a redirected cached navigation.
  return new Response(buffer, { status: response.status, statusText: response.statusText, headers });
  } finally {
    clearTimeout(timer);
  }
}

function repairMissingEntries() {
  if (repairPending) return repairPending;
  repairPending = (async () => {
    const cache = await caches.open(CACHE_NAME);
    for (const [url, entry] of ENTRIES) {
      if (!await cache.match(url)) await cache.put(url, await verifiedResponse(url, entry));
    }
    await cache.put(COMPLETE_URL, new Response(JSON.stringify({ version: VERSION, files: FILES.length }), {
      headers: { 'content-type': 'application/json' }
    }));
  })().finally(() => { repairPending = null; });
  return repairPending;
}

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    if (await isComplete(cache)) return;
    try {
      const entries = [...ENTRIES];
      let cursor = 0;
      let failed = false;
      const results = await Promise.allSettled(Array.from({ length: Math.min(4, entries.length) }, async () => {
        while (!failed && cursor < entries.length) {
          const [url, entry] = entries[cursor++];
          try {
            await cache.put(url, await verifiedResponse(url, entry));
          } catch (error) {
            failed = true;
            throw error;
          }
        }
      }));
      const failure = results.find(result => result.status === 'rejected');
      if (failure) throw failure.reason;
      await cache.put(COMPLETE_URL, new Response(JSON.stringify({ version: VERSION, files: FILES.length }), {
        headers: { 'content-type': 'application/json' }
      }));
      if (!await isComplete(cache)) throw new Error('Precache is incomplete');
    } catch (error) {
      // All install writes have settled before cleanup. Older working versions remain untouched.
      await caches.delete(CACHE_NAME);
      throw error;
    }
    // Let open lesson tabs finish with their current version. Do not call skipWaiting().
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    if (!await isComplete(cache)) throw new Error('Cannot activate an incomplete offline copy');
    await self.clients.claim();
    const names = await caches.keys();
    await Promise.all(names.filter(name => name.startsWith(CACHE_PREFIX) && name !== CACHE_NAME).map(name => caches.delete(name)));
  })());
});

self.addEventListener('fetch', event => {
  const url = canonical(event.request);
  if (!url) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(url);
    if (cached) return cached;
    // Repair an evicted entry only if its content still matches this installed version.
    try {
      const response = await verifiedResponse(url, ENTRIES.get(url));
      await cache.put(url, response.clone());
      return response;
    } catch {
      return fetch(event.request);
    }
  })());
});

self.addEventListener('message', event => {
  const repair = event.data?.type === 'TRAVEL_OFFLINE_REPAIR';
  if (!repair && event.data?.type !== 'TRAVEL_OFFLINE_STATUS') return;
  const port = event.ports?.[0];
  if (!port) return;
  event.waitUntil((async () => {
    let ready = false;
    let error = false;
    try {
      if (repair) await repairMissingEntries();
      const exists = await caches.has(CACHE_NAME);
      if (exists) ready = await isComplete(await caches.open(CACHE_NAME));
    } catch {
      // Keep any working entries on a failed repair and let the interface offer a retry.
      error = true;
    }
    port.postMessage({ ready, version: VERSION, lessons: LESSON_COUNT, files: FILES.length, bytes: TOTAL_BYTES, ...(error ? { error: true } : {}) });
  })());
});
