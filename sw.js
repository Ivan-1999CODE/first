/* Generated as sw.js by build-pwa.cjs after all lesson HTML has been rebuilt. */
'use strict';

const VERSION = "bec9fb946475dab2";
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
    "bytes": 46482,
    "sha256": "dcd5638a73d5b9d30b97965f36c5e75b3775c39c8f3114acefee1edf93062c87",
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
    "bytes": 746249,
    "sha256": "db01382497a780ba2c3e67a83777b8e420efc01556d7cdbb42825d9c8c8dd6a1",
    "normalizedText": true
  },
  {
    "path": "travel-english-unit11-what.html",
    "bytes": 983398,
    "sha256": "9ca018242ed08002ffc432c78e7f4d33265bb9ceb83914f7fa60ce3f8a48b32c",
    "normalizedText": true
  },
  {
    "path": "travel-english-unit12-how.html",
    "bytes": 897863,
    "sha256": "15d4094f8252a3e31a87e0febcedc48d24bb22906b2138e6725cb85a34e58ba7",
    "normalizedText": true
  },
  {
    "path": "travel-english-unit13-why-which.html",
    "bytes": 897869,
    "sha256": "39420229dc34495d1e59d2a9e8197df32e8593b2a78695b7414d4736eb4ff542",
    "normalizedText": true
  },
  {
    "path": "travel-english-unit14-travel-questions.html",
    "bytes": 897876,
    "sha256": "54c0622f869aec67b21b48e6236c858806869cbc584b438227bf419703d7b9a9",
    "normalizedText": true
  },
  {
    "path": "travel-english-unit2-shopping.html",
    "bytes": 806948,
    "sha256": "3518ca0725bbe32a86e2a3587af7772133264bf9f93505f78bce1e0b1e1ca195",
    "normalizedText": true
  },
  {
    "path": "travel-english-unit3-airport.html",
    "bytes": 834527,
    "sha256": "fcbb9f8dd51a4c20b9a966e7629252f9e73c5d63822535b07ce27e88507ac217",
    "normalizedText": true
  },
  {
    "path": "travel-english-unit4-transit.html",
    "bytes": 929503,
    "sha256": "484d90e6977a1ab7fae272ebee3a06828aee8972688baa1c3db992b69f4a9958",
    "normalizedText": true
  },
  {
    "path": "travel-english-unit5-getting-around.html",
    "bytes": 862905,
    "sha256": "ab7fad07ed3455bc91330759d13797e788e2bbe6f5e66b06695fb4a26593ef5d",
    "normalizedText": true
  },
  {
    "path": "travel-english-unit6-ordering.html",
    "bytes": 3519059,
    "sha256": "ed3eb2dbed46d5a8f7df73fc5cd26cd4c6ebbe0801913f2441ed6e2df1adfd73",
    "normalizedText": true
  },
  {
    "path": "travel-english-unit7-fitting.html",
    "bytes": 865653,
    "sha256": "c208e8dbf53ad0dc392798c2aea3652c6d6a69a18167963d3be6e20a4fc69266",
    "normalizedText": true
  },
  {
    "path": "travel-english-unit8-hotel.html",
    "bytes": 1134278,
    "sha256": "5d4388fd49fccba6f7807b16e9a129f88ca75b930f01eded2f43d5713d750a5b",
    "normalizedText": true
  },
  {
    "path": "travel-english-unit9-reservations.html",
    "bytes": 930473,
    "sha256": "afbbed345625353d320a0b13464e28c299608456d204c6388c0ea18bab27417b",
    "normalizedText": true
  },
  {
    "path": "travel-english.html",
    "bytes": 710541,
    "sha256": "a7d89626149528a56aa19c5e28890297975f339f8f53f260e168b976e185e830",
    "normalizedText": true
  },
  {
    "path": "travel-japanese-day0-directions.html",
    "bytes": 5198029,
    "sha256": "5922f60c3f0c293f6dbadfdcc4dd00a439b4888cd08658d76fda49bf346325a7",
    "normalizedText": true
  },
  {
    "path": "travel-korean-day0-directions.html",
    "bytes": 4226745,
    "sha256": "a9849665f4e7c3a62f8254718dbb33c39c299d29597353ab3ea78e58689c4ca4",
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
