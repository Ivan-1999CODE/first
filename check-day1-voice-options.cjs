'use strict';

// Preserve the first-day-only check for incremental lesson builds.
require('./check-english-voice-options.cjs').check(['travel-english.html'])
  .catch(error => { console.error(error); process.exitCode = 1; });
