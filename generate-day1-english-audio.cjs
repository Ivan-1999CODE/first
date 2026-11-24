'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { parseEnv } = require('node:util');
const { execFileSync } = require('node:child_process');
const { strip } = require('./assets/english-audio-build.cjs');
const { forPage } = require('./assets/english-audio-course.cjs');

const lesson = 'travel-english.html';
const audioRoot = path.join(__dirname, 'assets', 'english-audio');
const audition = path.join(__dirname, 'output', 'english-voice-audition');
const accents = {
  uk: 'Speak with a contemporary, everyday southern English accent from England, using natural non-rhotic British pronunciation.',
  us: 'Speak with an everyday General American accent from the United States, using natural rhotic American pronunciation.'
};
const voices = {
  female: { id: 'coral', character: 'You are an adult woman speaking to a stranger in person.' },
  male: { id: 'onyx', character: 'You are an adult man speaking to a stranger in person.' }
};
const samples = new Map([
  ['How do I get to the train station?', 'station'],
  ['Thank you for your help.', 'thanks']
]);

function sceneFor(text) {
  if (!/[.!?]/.test(text)) return 'Say this word or phrase on its own, clearly and with its everyday stress, as a pronunciation example.';
  if (/^(Go straight|Here\.|No problem\.|The bus stop|Turn (?:right|left)[. ]|Where would you like|Yes\.|You’re welcome)/.test(text)) {
    return 'You are the friendly local responding to a visitor in the street. Give directions in short, clear groups, as you would while pointing out the route. For a farewell, sound warmly reassuring.';
  }
  if (/^Thank you/.test(text)) return 'You smile and thank the local who has just helped you. Let the gratitude come through in a brief conversational finish.';
  return 'You are a visitor talking to a helpful stranger on the street. Ask or check the directions with a friendly, genuinely curious tone. Where there is a follow-up or a thank-you, let it sound like the next thought in the same conversation.';
}

async function synthesize(text, key, accent, voice, scene = sceneFor(text), compact = false) {
  if (!key) throw Error('Configure OPENAI_API_KEY or pass the project key file as the first argument.');
  const instructions = [accent, voice.character, scene,
    'Use natural connected speech and conversational timing, clear enough for a learner. Speak only the exact supplied text, once, in English.'].join(' ');
  for (let attempt = 0; ; attempt++) {
    let response;
    try {
      response = await fetch('https://api.openai.com/v1/audio/speech', {
        method: 'POST', redirect: 'error', signal: AbortSignal.timeout(90000),
        headers: { Authorization: 'Bearer ' + key, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'gpt-4o-mini-tts', voice: voice.id, instructions,
          input: attempt && !/[.!?]$/.test(text) ? text + '.' : text,
          response_format: compact ? 'pcm' : 'mp3'
        })
      });
    } catch (error) {
      if (attempt >= 4 || error.cause?.code === 'EACCES') throw error;
      await new Promise(resolve => setTimeout(resolve, 2000 * (attempt + 1)));
      continue;
    }
    if (response.ok) {
      const bytes = Buffer.from(await response.arrayBuffer());
      try {
        if (compact) {
          validatePcm(bytes);
          return execFileSync('ffmpeg', ['-nostdin', '-v', 'error', '-xerror', '-f', 's16le',
            '-ac', '1', '-ar', '24000', '-i', 'pipe:0', '-map_metadata', '-1', '-codec:a', 'libmp3lame', '-b:a', '48k',
            '-f', 'mp3', 'pipe:1'], { input: bytes, windowsHide: true, maxBuffer: 8 * 1024 * 1024 });
        }
        validate(bytes);
        return bytes;
      } catch (error) {
        if (attempt >= 3) throw error;
        continue;
      }
    }
    const error = (await response.json().catch(() => ({}))).error || {};
    if (attempt >= 3 || !(response.status >= 500 || response.status === 429 && error.code === 'rate_limit_exceeded')) {
      throw Error('Speech API HTTP ' + response.status + ' ' + String(error.code || '').replace(/[^\w-]/g, ''));
    }
    const seconds = Math.max(2 ** (attempt + 1), Number(response.headers.get('retry-after')) || 0);
    await new Promise(resolve => setTimeout(resolve, Math.min(seconds, 60) * 1000));
  }
}

function validate(bytes) {
  const pcm = execFileSync('ffmpeg', ['-nostdin', '-v', 'error', '-xerror', '-i', 'pipe:0', '-ac', '1', '-ar', '16000', '-f', 's16le', 'pipe:1'], { input: bytes, windowsHide: true });
  validatePcm(pcm);
}

function validatePcm(pcm) {
  let voiced = 0;
  for (let i = 0; i < pcm.length; i += 2) if (Math.abs(pcm.readInt16LE(i)) > 400) voiced++;
  if (voiced < 700) throw Error('Empty or silent speech recording');
}

async function main() {
  const html = fs.readFileSync(path.join(__dirname, lesson), 'utf8');
  const texts = forPage(lesson, strip(html));
  const manifest = JSON.parse(fs.readFileSync(path.join(audioRoot, 'manifest.json'), 'utf8'));
  const key = process.argv[2] ? parseEnv(fs.readFileSync(process.argv[2], 'utf8')).OPENAI_API_KEY : process.env.OPENAI_API_KEY;
  const jobs = [];
  for (const [accentId, accent] of Object.entries(accents)) {
    for (const [voiceId, voice] of Object.entries(voices)) {
      const profile = accentId + '-' + voiceId;
      const output = path.join(audioRoot, 'day1-' + profile);
      fs.mkdirSync(output, { recursive: true });
      for (const text of texts) jobs.push({ profile, accent, voice, output, text });
    }
  }
  let complete = 0, generated = 0, copied = 0, next = 0, failed;
  async function worker() {
    while (!failed && next < jobs.length) {
      const { profile, accent, voice, output, text } = jobs[next++];
      try {
        const name = manifest[text];
        if (!/^[a-f0-9]{20}\.mp3$/.test(name)) throw Error('Missing course manifest entry for ' + text);
        const file = path.join(output, name);
        if (fs.existsSync(file)) {
          validate(fs.readFileSync(file));
        } else {
          const sample = samples.has(text) && path.join(audition, profile + '-' + samples.get(text) + '.mp3');
          let bytes;
          if (sample && fs.existsSync(sample)) {
            bytes = fs.readFileSync(sample);
            validate(bytes);
            copied++;
          } else {
            bytes = await synthesize(text, key, accent, voice);
            generated++;
          }
          const partial = file + '.' + process.pid + '.partial';
          fs.writeFileSync(partial, bytes);
          fs.renameSync(partial, file);
        }
        if (++complete % 30 === 0) console.log(complete + '/' + jobs.length);
      } catch (error) {
        failed = new Error(profile + ' / ' + text + ': ' + error.message);
      }
    }
  }
  await Promise.all(Array.from({ length: 6 }, worker));
  if (failed) throw failed;
  console.log(complete + ' ready; ' + generated + ' newly generated; ' + copied + ' audition clips reused.');
}

if (require.main === module) main().catch(error => { console.error(error.message); process.exitCode = 1; });
module.exports = { accents, voices, synthesize };
