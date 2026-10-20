/* Generated as sw.js by build-pwa.cjs after all lesson HTML has been rebuilt. */
'use strict';

const VERSION = "db344fbc754c56dd";
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
    "bytes": 40177,
    "sha256": "508602792f43c5c37d9247c643a864d2250e7e5891fe76068fd6bbb84fc536c9",
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
    "bytes": 414913,
    "sha256": "24e193d3264dcc3cb15c18975824644957f34ff6d3f41d7320eee450165f74ca",
    "normalizedText": true
  },
  {
    "path": "travel-english-unit11-what.html",
    "bytes": 493395,
    "sha256": "a2bc90e339b2fb1138f6a529e239ee6cd86727db8c1e1fb8c9202e0eb1054913",
    "normalizedText": true
  },
  {
    "path": "travel-english-unit12-how.html",
    "bytes": 534955,
    "sha256": "47426770072d647fabfcdb137103950085a609cd22a7527d5ec5eca66b96b5e7",
    "normalizedText": true
  },
  {
    "path": "travel-english-unit13-why-which.html",
    "bytes": 370082,
    "sha256": "4386e1ecd32303a0b11f69b2331234d677a314ac1bd640fafdce3afd53d7d9ab",
    "normalizedText": true
  },
  {
    "path": "travel-english-unit14-travel-questions.html",
    "bytes": 482387,
    "sha256": "180f8538f9ce7be308ee43c91dc9c241457e02fa9186336b9b11fc8db4250cf8",
    "normalizedText": true
  },
  {
    "path": "travel-english-unit2-shopping.html",
    "bytes": 436496,
    "sha256": "9384a9d91881c40d98969b1ab8653cef33e6d43a64ce890470b1e203788853fc",
    "normalizedText": true
  },
  {
    "path": "travel-english-unit3-airport.html",
    "bytes": 376951,
    "sha256": "0f9b21e47cc72f87dae74bf060b87b9d4999cbc5b82949863f6398fd493002a6",
    "normalizedText": true
  },
  {
    "path": "travel-english-unit4-transit.html",
    "bytes": 376316,
    "sha256": "67deb181569ac6f50624c5fd7b713e2d0bca9740062e97082c4c85727d5f349e",
    "normalizedText": true
  },
  {
    "path": "travel-english-unit5-getting-around.html",
    "bytes": 444928,
    "sha256": "3277c1682b22341c78dce57f2f33679de10b56e7215ab2843aaa0e4590ba9e64",
    "normalizedText": true
  },
  {
    "path": "travel-english-unit6-ordering.html",
    "bytes": 3007904,
    "sha256": "622bec39ab5cb49c36322a6c2e94f558bcb28d2c29400a9f0d523fc8adba6ebe",
    "normalizedText": true
  },
  {
    "path": "travel-english-unit7-fitting.html",
    "bytes": 368262,
    "sha256": "f7af2874e8c3cf96816cb84980060a8c131230fc53978ca6db4603956af88aae",
    "normalizedText": true
  },
  {
    "path": "travel-english-unit8-hotel.html",
    "bytes": 376702,
    "sha256": "d802ed97e77b9e9101fe477589a7fbc218d273ef10ffb1c7af5b76de6150aae5",
    "normalizedText": true
  },
  {
    "path": "travel-english-unit9-reservations.html",
    "bytes": 460963,
    "sha256": "fc66418ddf17d032fb6c8b731a1052a207ce5cc7804bc38558cd64b6fd7d0bb9",
    "normalizedText": true
  },
  {
    "path": "travel-english.html",
    "bytes": 356222,
    "sha256": "623d14b35479337290ed3d607cfce4bc455079b378e34e5be6d4062210bd4976",
    "normalizedText": true
  },
  {
    "path": "travel-japanese-day0-directions.html",
    "bytes": 2920419,
    "sha256": "250f33d468afba68ebc78f45d00d7a5d871ea21e4a102cdca403a2ba3aa82b2a",
    "normalizedText": true
  },
  {
    "path": "travel-korean-day0-directions.html",
    "bytes": 2431369,
    "sha256": "edbacc23505c7eb6a7f2697d09dcb024d53d5160df9a1f2a35df0a112f1dda82",
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
