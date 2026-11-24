'use strict';

// Generate classroom recordings at build time. The browser only sees MP3s.
// Usage: node generate-english-audio.cjs [--key-file PATH] --all
// A page-inventory.json may also be supplied for an incremental batch.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { parseEnv } = require('node:util');
const { spawnSync } = require('node:child_process');

const directory = path.join(__dirname, 'assets', 'english-audio');
const cache = path.join(__dirname, 'tmp', 'english-voice-cache');
const model = 'gpt-4o-mini-tts', voice = 'marin';
const instructions = 'Speak in clear, natural General American English. Use a calm, conversational teaching pace, slightly slower than normal. Say exactly the supplied word, phrase, or sentence, once, without any introduction or explanation.';
const rate = 24000;
const canonical = text => text.normalize('NFKC').replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/\s+/gu, ' ').trim();
const filename = text => crypto.createHash('sha256').update(text).digest('hex').slice(0,20) + '.mp3';
const readJSON = file => JSON.parse(fs.readFileSync(file, 'utf8').replace(/^\uFEFF/u,''));
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

function writeAtomic(file, bytes) {
  const temp = file + '.' + process.pid + '.partial';
  fs.writeFileSync(temp, bytes);
  fs.renameSync(temp, file);
}
function ffmpeg(args, input) {
  const job = spawnSync('ffmpeg', ['-nostdin','-v','error',...args], {input,maxBuffer:48*1024*1024,windowsHide:true});
  if(job.error || job.status !== 0) throw Error('FFmpeg could not process the audio.');
  return job.stdout;
}
function decode(bytes) {
  return ffmpeg(['-i','pipe:0','-vn','-ac','1','-ar',String(rate),'-f','s16le','pipe:1'],bytes);
}
function voicedPcm(bytes) {
  const pcm = decode(bytes);
  const samples = pcm.length / 2;
  const frames = [], step = rate / 100;
  for (let start=0; start<samples; start+=step) {
    let sum=0;
    const end=Math.min(samples,start+step);
    for (let i=start; i<end; i++) sum+=pcm.readInt16LE(i*2)**2;
    frames.push(Math.sqrt(sum/(end-start)));
  }
  const threshold=Math.max(64,Math.max(...frames)*.009);
  const first=frames.findIndex(x=>x>=threshold), last=frames.findLastIndex(x=>x>=threshold);
  if(first<0 || frames.filter(x=>x>=threshold).length<5) throw Error('Empty or silent recording');
  return pcm.subarray(Math.max(0,(first-7)*step*2), Math.min(pcm.length,(last+12)*step*2));
}
function encoded(pcm) {
  const clip=ffmpeg(['-f','s16le','-ar',String(rate),'-ac','1','-i','pipe:0','-map_metadata','-1','-codec:a','libmp3lame','-b:a','48k','-f','mp3','pipe:1'],pcm);
  voicedPcm(clip);
  return clip;
}
function sentences(text) {
  // Vocabulary alternatives and the gap in a printed sentence frame are
  // audible pauses. Do not read markup such as "slash" or "underscore".
  const alternatives=text.split(/\s+\/\s+|\s*(?:\.{3,}|…|_{2,})\s*/u)
    .map(part=>part.trim().replace(/^[,;:]\s*/u,'')).filter(Boolean);
  if(alternatives.length && (alternatives.length>1 || alternatives[0]!==text))return alternatives.flatMap(sentences);
  // Split only at a sentence boundary followed by an uppercase word or digit.
  // Keep abbreviations such as "Dr. Chen" and "7 p.m. tomorrow" together.
  const parts=[];
  let start=0;
  for(const match of text.matchAll(/[.!?]\s+(?=["']?[A-Z0-9])/g)){
    const end=match.index+1;
    if (/(?:\b(?:Mr|Ms|Mrs|Dr|St|No|Mt|Prof)|\b[A-Za-z](?:\.[A-Za-z])+|\b[A-Z])\.$/u.test(text.slice(start,end))) continue;
    parts.push(text.slice(start,end)); start=match.index+match[0].length;
  }
  parts.push(text.slice(start));
  return parts;
}
async function synthesize(text,key){
  if(!key)throw Error('Configure OPENAI_API_KEY or --key-file to generate missing recordings.');
  let spoken=text;
  for(let attempt=0; attempt<5; attempt++) {
    let response;
    try {
      response=await fetch('https://api.openai.com/v1/audio/speech',{method:'POST',redirect:'error',
        headers:{Authorization:'Bearer '+key,'Content-Type':'application/json'},signal:AbortSignal.timeout(90000),
        body:JSON.stringify({model,voice,input:spoken,instructions,response_format:'mp3'})});
    } catch(error) {
      if(attempt===4 || error.cause?.code==='EACCES')throw Error('Speech API network failure '+(error.cause?.code||error.name));
      await sleep(2000*(attempt+1));continue;
    }
    if(!response.ok){
      const reason=await response.json().catch(()=>({}));
      const code=String(reason?.error?.code||reason?.error?.type||'').replace(/[^\w-]/g,'').slice(0,80);
      if(attempt<4 && (response.status>=500 || response.status===429 && code==='rate_limit_exceeded')){
        await sleep(Math.min(60000,Math.max(3*2**attempt,Number(response.headers.get('retry-after'))||0)*1000));continue;
      }
      throw Error('Speech API HTTP '+response.status+' '+code);
    }
    const bytes=Buffer.from(await response.arrayBuffer());
    try { return encoded(voicedPcm(bytes)); } catch(error) {
      if(attempt===4)throw Error('Unusable speech for '+JSON.stringify(text)+': '+error.message);
      if(!/[.!?]$/.test(spoken))spoken+='.';
    }
  }
}
function courseInventories() {
  const { forPage } = require('./assets/english-audio-course.cjs');
  const { strip } = require('./assets/english-audio-build.cjs');
  const lessons=fs.readdirSync(__dirname).filter(name=>/^travel-english(?:-unit\d+-[\w-]+)?\.html$/.test(name));
  const inventory=Object.fromEntries(lessons.map(name=>[name,
    forPage(name,strip(fs.readFileSync(path.join(__dirname,name),'utf8')))]));
  Object.assign(inventory,readJSON(path.join(__dirname,'original-lessons','english-audio-lines.json')));
  const homeworkDir=path.join(__dirname,'sites','train-station-homework');
  const homeworkSource=path.join(homeworkDir,'content','source-lessons.json');
  if(fs.existsSync(homeworkSource)){
    const library=require(path.join(homeworkDir,'content','normalize.cjs'))(readJSON(homeworkSource));
    inventory['homework']=[...require(path.join(homeworkDir,'build-recordings.cjs')).englishTexts(library)];
  }
  return inventory;
}
async function main(args) {
  let key=process.env.OPENAI_API_KEY;
  if(args[0]==='--key-file'){if(!args[1])throw Error('Missing key file');key=parseEnv(fs.readFileSync(args[1],'utf8')).OPENAI_API_KEY;args=args.slice(2);}
  if(!args.length)throw Error('Supply --all or page inventories containing authored English only.');
  const full=args.length===1 && args[0]==='--all';
  const inventories=full?[courseInventories()]:args.map(readJSON);
  const requested=new Set();
  for(const inventory of inventories)for(const lines of Object.values(inventory)){
    if(!Array.isArray(lines))throw Error('Expected an array of English texts per page');
    for(const line of lines){
      if(typeof line!=='string' || !line.trim() || /[\u3040-\u30ff\u3400-\u9fff\uac00-\ud7af\u0000-\u0008]/u.test(line))throw Error('Invalid English recording: '+JSON.stringify(line));
      requested.add(line);
    }
  }
  fs.mkdirSync(directory,{recursive:true}); fs.mkdirSync(cache,{recursive:true});
  const manifestFile=path.join(directory,'manifest.json');
  const manifest=Object.assign(Object.create(null),!full && fs.existsSync(manifestFile)?readJSON(manifestFile):{});
  const queue=[...new Set([...requested].map(canonical))];
  // Do not regenerate the constituent sentences of a finished recording when
  // a different machine rebuilds the inventory without the temporary cache.
  const pending=queue.filter(text=>!fs.existsSync(path.join(directory,filename(text))));
  const simple=new Set(pending.flatMap(sentences));
  const sourceCache=path.join(__dirname,'tmp','course-ai-voice','cache','en');
  const preexisting=text=>{
    const options={model,voice,instructions,input:text,response_format:'mp3'};
    return path.join(sourceCache,crypto.createHash('sha256').update(JSON.stringify(options)).digest('hex')+'.mp3');
  };
  function readyPath(text){
    const name=filename(text);
    const published=path.join(directory,name);
    return fs.existsSync(published)?published:path.join(cache,name);
  }
  let next=0, ready=0, fatal=null;
  const tasks=[...simple];
  async function worker(){
    while(!fatal && next<tasks.length){
      const text=tasks[next++];
      try {
        const file=readyPath(text);
        if(!fs.existsSync(file)){
          const previous=preexisting(text);
          const clip=fs.existsSync(previous)?encoded(voicedPcm(fs.readFileSync(previous))):await synthesize(text,key);
          writeAtomic(file,clip);
        }
        if(++ready%100===0||ready===tasks.length)console.log('Source clips ready: '+ready+'/'+tasks.length);
      } catch(error){ fatal=error; }
    }
  }
  await Promise.all(Array.from({length:6},worker));
  if(fatal)throw fatal;
  for(const text of pending){
    const target=path.join(directory,filename(text));
    if(fs.existsSync(target))continue;
    const pieces=sentences(text);
    if(pieces.length===1)writeAtomic(target,fs.readFileSync(readyPath(pieces[0])));
    else{
      const chunks=[];
      for(const piece of pieces){if(chunks.length)chunks.push(Buffer.alloc(rate*.20*2));chunks.push(voicedPcm(fs.readFileSync(readyPath(piece))));}
      writeAtomic(target,encoded(Buffer.concat(chunks)));
    }
  }
  for(const raw of requested)manifest[raw]=filename(canonical(raw));
  const ordered=Object.fromEntries(Object.entries(manifest).sort(([a],[b])=>a<b?-1:a>b?1:0));
  const json=JSON.stringify(ordered,null,2)+'\n';
  if(!fs.existsSync(manifestFile) || fs.readFileSync(manifestFile,'utf8')!==json)writeAtomic(manifestFile,json);
  console.log('Ready: '+queue.length+' distinct recordings for '+requested.size+' exact lesson texts; '+pending.length+' added.');
}
if(require.main===module)main(process.argv.slice(2)).catch(error=>{console.error(error.message);process.exitCode=1;});
module.exports={canonical,filename,sentences,courseInventories};
