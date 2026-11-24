'use strict';

// node generate-course-english-voices.cjs --count
// node generate-course-english-voices.cjs [path-to-key-file]
const fs = require('node:fs');
const path = require('node:path');
const { parseEnv } = require('node:util');
const { accents, voices, synthesize } = require('./generate-day1-english-audio.cjs');
const { strip } = require('./assets/english-audio-build.cjs');
const { forPage } = require('./assets/english-audio-course.cjs');

const root = path.join(__dirname, 'assets', 'english-audio');
const contexts = {
  2: 'A customer and a shop assistant are choosing and buying something at a store.',
  3: 'An air traveler is speaking with airport or immigration staff.',
  4: 'A traveler is talking with transit staff about tickets, trains and connections.',
  5: 'A visitor is asking their way around a city and talking with a local.',
  6: 'A diner and a server are speaking at a restaurant.',
  7: 'A shopper and a clothing store assistant are discussing size and fit.',
  8: 'A hotel guest is speaking with staff at the front desk or about room service.',
  9: 'A visitor is making a reservation or buying admission tickets.',
  10: 'Two people are making polite requests or responding to an invitation.',
  11: 'Two travelers are having a friendly conversation in person.',
  12: 'A traveler is seeking local help with an unexpected problem.'
};
function sceneFor(text, day) {
  if (!/[.!?]/.test(text)) return 'Say the vocabulary or short expression clearly with everyday stress. If given alternatives, separate them with a short pause.';
  return contexts[day] + ' Speak as the person whose turn this line is. Use warm, natural phrasing suited to the situation, with short pauses between thoughts.';
}
function spokenText(text) {
  return text.replace(/\s+\/\s+|\s*→\s*/gu, '. ').replace(/\s*(?:\.{3,}|…|_{2,})\s*/gu, ', ')
    .replace(/([.!?])\./g, '$1').replace(/,\s*,/g, ',').replace(/,\s*$/, '').trim();
}
function plan() {
  const manifest = JSON.parse(fs.readFileSync(path.join(root, 'manifest.json'), 'utf8'));
  const jobs = [], seen = new Set();
  const pages = fs.readdirSync(__dirname).filter(n => /^travel-english-unit\d+-[\w-]+\.html$/.test(n));
  for (const day of Object.keys(contexts)) {
    const page = pages.find(n => n.startsWith('travel-english-unit' + day + '-'));
    if (!page) throw Error('Missing English lesson for day ' + day);
    const texts = forPage(page, strip(fs.readFileSync(path.join(__dirname, page), 'utf8')));
    for (const text of texts) {
      const file = manifest[text];
      if (!/^[a-f0-9]{20}\.mp3$/.test(file)) throw Error('Unknown recording: ' + text);
      if (seen.has(file)) continue;
      seen.add(file);
      for (const [accentId, accent] of Object.entries(accents)) {
        for (const [voiceId, voice] of Object.entries(voices)) {
          const profile = accentId + '-' + voiceId;
          if (fs.existsSync(path.join(root, 'day1-' + profile, file))) continue;
          const output = path.join(root, 'voices', profile, file);
          if (!fs.existsSync(output)) jobs.push({ text, day, accent, voice, profile, output });
        }
      }
    }
  }
  return jobs;
}
async function main() {
  const jobs = plan();
  console.log('Missing recordings: ' + jobs.length);
  if (process.argv[2] === '--count' || !jobs.length) return;
  const key = process.argv[2] ? parseEnv(fs.readFileSync(process.argv[2], 'utf8')).OPENAI_API_KEY : process.env.OPENAI_API_KEY;
  let next = 0, done = 0, error;
  async function worker() {
    while (!error && next < jobs.length) {
      const job = jobs[next++];
      try {
        const bytes = await synthesize(spokenText(job.text), key, job.accent, job.voice, sceneFor(job.text, job.day), true);
        fs.mkdirSync(path.dirname(job.output), { recursive: true });
        const partial = job.output + '.' + process.pid + '.partial';
        fs.writeFileSync(partial, bytes);
        fs.renameSync(partial, job.output);
        if (++done % 100 === 0 || done === jobs.length) console.log(done + '/' + jobs.length);
      } catch (cause) {
        error ??= new Error(job.profile + ' / ' + job.text + ': ' + cause.message);
      }
    }
  }
  await Promise.all(Array.from({ length: 12 }, worker));
  if (error) throw error;
}
if (require.main === module) main().catch(error => { console.error(error.message); process.exitCode = 1; });
