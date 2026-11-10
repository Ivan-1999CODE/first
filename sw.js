/* Generated as sw.js by build-pwa.cjs after all lesson HTML has been rebuilt. */
'use strict';

const VERSION = "cbd8540ec02bfd54";
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
    "bytes": 46579,
    "sha256": "6c2f104df3f3da8843a747c529d7cb2eae6edb01122beb87c02f0d65fe2bc55f",
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
    "bytes": 771051,
    "sha256": "652a96ed129c40a1a77e930c071c17a100991ab2cf92f05560913ed1c4887625",
    "normalizedText": true
  },
  {
    "path": "travel-english-unit11-what.html",
    "bytes": 984066,
    "sha256": "c123ff66a670aca6e08b35bf3a059c30992fd047d263fb2ec72801ba8e60775e",
    "normalizedText": true
  },
  {
    "path": "travel-english-unit12-how.html",
    "bytes": 941111,
    "sha256": "5c4022243cd7533f1296a7ac24dec6aec4f9fc82773c0bc795e994798a337f4d",
    "normalizedText": true
  },
  {
    "path": "travel-english-unit13-why-which.html",
    "bytes": 941117,
    "sha256": "03bafd83267a1ce8f6237de348c3108905dec16eafc4495b308157791cfa66e3",
    "normalizedText": true
  },
  {
    "path": "travel-english-unit14-travel-questions.html",
    "bytes": 941124,
    "sha256": "6289fdcebbfc2263fcd9185bd1db487bc298bf6456634ca5e43ff65e6720f82e",
    "normalizedText": true
  },
  {
    "path": "travel-english-unit2-shopping.html",
    "bytes": 863683,
    "sha256": "3f632bc2bd35eb057cff104b3821798b62b94ba07dde8dfb68346dd37caea9af",
    "normalizedText": true
  },
  {
    "path": "travel-english-unit3-airport.html",
    "bytes": 867612,
    "sha256": "7951f31bc81d344931679e3cd8770d72251e08d7f46c428cdd449593aebe2433",
    "normalizedText": true
  },
  {
    "path": "travel-english-unit4-transit.html",
    "bytes": 962732,
    "sha256": "8355e71f86015cacb4871481dbfe22343b7c7073e4e3737e60bf96d0da105257",
    "normalizedText": true
  },
  {
    "path": "travel-english-unit5-getting-around.html",
    "bytes": 897505,
    "sha256": "b080ec79c94172c850fe4e0b905163000d970776b056949492aa00d48fb5074f",
    "normalizedText": true
  },
  {
    "path": "travel-english-unit6-ordering.html",
    "bytes": 3602799,
    "sha256": "cbd4e589b4ab6bacf09f39b3b72edc8a3b1625468ec800f06fa0fd81c0c9e5d4",
    "normalizedText": true
  },
  {
    "path": "travel-english-unit7-fitting.html",
    "bytes": 899355,
    "sha256": "3a7e97aaec5e18464d047bc2d27bdf253f7fc41955512dc9d300a53d09450ca6",
    "normalizedText": true
  },
  {
    "path": "travel-english-unit8-hotel.html",
    "bytes": 1172736,
    "sha256": "e7b1c477dc87f0c92e690f8d59c8fb8096ee443166f300c97f5fd792f45b1247",
    "normalizedText": true
  },
  {
    "path": "travel-english-unit9-reservations.html",
    "bytes": 964583,
    "sha256": "37e4ebb37c82580a6f4d583268eb3c7a0d7b46da1148d14df224cd3a9b831d5c",
    "normalizedText": true
  },
  {
    "path": "travel-english.html",
    "bytes": 737801,
    "sha256": "36bcda2d6757e63478eb853102a4e6bee02a56bebd894c4e3e50a35cc657f73c",
    "normalizedText": true
  },
  {
    "path": "travel-japanese-day0-directions.html",
    "bytes": 5260741,
    "sha256": "3441a0f0a8c21d67242ad5b95671b0b1909d5d143404f56d6b8aa6a6bef14802",
    "normalizedText": true
  },
  {
    "path": "travel-korean-day0-directions.html",
    "bytes": 4534828,
    "sha256": "0f074c970da3e024df1df6d43aebd612ec8fa19e00fb26b16e5e6a199e59997b",
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
