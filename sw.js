/* Generated as sw.js by build-pwa.cjs after all lesson HTML has been rebuilt. */
'use strict';

const VERSION = "3508c6ac9d74b0e3";
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
    "bytes": 47780,
    "sha256": "9fb9cc0f1f92452cf6b3ba0bfdf4b22c35995a9e8b0a610e0a441069354ecf6b",
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
    "bytes": 771062,
    "sha256": "e5d388d44535fe0faf04a0a9dc12abcc86430f930ff116d430686ed06784de86",
    "normalizedText": true
  },
  {
    "path": "travel-english-unit11-what.html",
    "bytes": 984077,
    "sha256": "49286da7ba93ccc755b4b2856e278fda6bec88e86740e60f6d5af5e626474d69",
    "normalizedText": true
  },
  {
    "path": "travel-english-unit12-how.html",
    "bytes": 941122,
    "sha256": "a455235fc35ded5c3a4daa1f8f841789bb881deb4c77915f5b123ae785f197e4",
    "normalizedText": true
  },
  {
    "path": "travel-english-unit13-why-which.html",
    "bytes": 941128,
    "sha256": "612995043b667a2bddb8e9826f54f435b47e22c5fe3471a061f14d16f84b114c",
    "normalizedText": true
  },
  {
    "path": "travel-english-unit14-travel-questions.html",
    "bytes": 941135,
    "sha256": "4dcf6f64d2e31d182f7504f1c0728d1905889026125562a11b1ccf5d47e2a61b",
    "normalizedText": true
  },
  {
    "path": "travel-english-unit2-shopping.html",
    "bytes": 863694,
    "sha256": "84dadd7c66b0c0f9b818491a2f8f25a788997fe18540dfee13a8d5cfd22381e3",
    "normalizedText": true
  },
  {
    "path": "travel-english-unit3-airport.html",
    "bytes": 867623,
    "sha256": "0b7938f18fc3f7007d032323558907dce44e57d88af9306182d68b4275a696bd",
    "normalizedText": true
  },
  {
    "path": "travel-english-unit4-transit.html",
    "bytes": 962743,
    "sha256": "0d148d9e5b769cd26a96d63901a1a4c1e9d8ccbc7b138113350a1fe5eb106243",
    "normalizedText": true
  },
  {
    "path": "travel-english-unit5-getting-around.html",
    "bytes": 897516,
    "sha256": "d0dc949a54300d81a89b8fc56a7c0738b854921043282f76c0003fe93538caed",
    "normalizedText": true
  },
  {
    "path": "travel-english-unit6-ordering.html",
    "bytes": 3602810,
    "sha256": "62861d2bbcb6cf2368dd2e89a3eaf91bbc6581bedcd82bb1ad39b065f33e2891",
    "normalizedText": true
  },
  {
    "path": "travel-english-unit7-fitting.html",
    "bytes": 899366,
    "sha256": "c38540e24757c1e45a6a87dff8d130f993056863074f673154ccb88e40eccba2",
    "normalizedText": true
  },
  {
    "path": "travel-english-unit8-hotel.html",
    "bytes": 1172747,
    "sha256": "350356b4ce9934ed38d7a8bbddd188b04b1a15dcc6110b5c431ef01200f3db9d",
    "normalizedText": true
  },
  {
    "path": "travel-english-unit9-reservations.html",
    "bytes": 964594,
    "sha256": "afdc1fcc59d86a48abcb19dbe042159f8f36cf65b6c798b72cd5ab2c4002cd17",
    "normalizedText": true
  },
  {
    "path": "travel-english.html",
    "bytes": 737882,
    "sha256": "6206f5b702eef5f45bf46b5d98d21521523bfe9f8a4faae7da683e58346ac65c",
    "normalizedText": true
  },
  {
    "path": "travel-japanese-day0-directions.html",
    "bytes": 5260752,
    "sha256": "aa5de44c71c60e17202895a7c034bda4188313ec7a9eab6e63962e0df191886a",
    "normalizedText": true
  },
  {
    "path": "travel-korean-day0-directions.html",
    "bytes": 4534839,
    "sha256": "60565c23889bd7e9438f9f3ac43e8b3f7c9344dd146a1169e5d60018647454b9",
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
