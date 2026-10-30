// Collect authored practical lessons and primer sounds without dropping legacy recordings.
// Run normally before generate-day0-audio.py; use --check after both languages are generated.
// --primer-only allows independent primer synthesis while lesson writing is in progress.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const root=__dirname,reportDir=path.join(root,'tmp','day0-practical-audio-qa');
const checking=process.argv.includes('--check');
const primerOnly=process.argv.includes('--primer-only');
const selected=process.argv.slice(2).filter(arg=>!['--check','--primer-only'].includes(arg));
const languages=selected.length?selected:['ja','ko'];
assert(languages.every(language=>['ja','ko'].includes(language)),'Use ja and/or ko, optionally with --check');
fs.mkdirSync(reportDir,{recursive:true});
const readJson=file=>JSON.parse(fs.readFileSync(file,'utf8'));
const hash=file=>crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const reports=[];

for(const language of languages){
 const base=primerOnly?null:require('./assets/micro-day0.cjs').make(language,{legacy:true});
 const lesson=primerOnly?null:require('./assets/day0-practical.cjs').make(language,base);
 const primer=require('./assets/day0-primer-data.cjs').make(language);
 assert((primerOnly||lesson.practicalLexicon)&&primer.groups?.length,'Practical lesson and primer data must be ready');
 const dir=path.join(root,'assets',language==='ko'?'korean-day0-audio':'day0-audio');
 const manifest=readJson(path.join(dir,'manifest.json')),timings=readJson(path.join(dir,'timings.json'));
 const previousTexts=readJson(path.join(dir,'texts.json'));
 const required=new Set();
 const add=text=>{assert.equal(typeof text,'string');assert(text.trim(),'Empty audio text');required.add(text);};
 if(lesson){
  Object.keys(lesson.day0AudioTranslations).forEach(add);
  Object.keys(lesson.practicalLexicon).forEach(add);
 }
 for(const group of primer.groups)for(const item of group.items)add(item.speakText||item.text);
 for(const exercise of primer.exercises)add(exercise.speakText||exercise.text);
 const texts=[...new Set([...Object.keys(manifest),...Object.keys(timings),...previousTexts,...required])];
 const baselinePath=path.join(reportDir,`${language}-baseline.json`);
 if(!fs.existsSync(baselinePath)){
  assert(!checking,'Prepare first so the original audio can be compared after generation');
  const baseline={manifest,timings,hashes:Object.fromEntries(Object.entries(manifest).map(([text,name])=>[text,hash(path.join(dir,name))]))};
  fs.writeFileSync(baselinePath,JSON.stringify(baseline,null,2)+'\n');
 }
 const baseline=readJson(baselinePath);
 const missing=[...required].filter(text=>!manifest[text]);
 if(checking){
  assert.deepEqual(missing,[],`${language}: missing authored recordings`);
  assert(texts.every(text=>manifest[text]),`${language}: previous audio texts must stay available`);
  for(const [text,name] of Object.entries(manifest)){
   const entry=timings[text],file=path.join(dir,name);
   assert(entry?.cues?.length,`${language}: missing cue boundaries for ${text}`);
   assert.equal(hash(file),entry.sha256,`${language}: audio and cue hashes differ for ${text}`);
   let cursor=0,lastEnd=0;
   for(const cue of entry.cues){
    assert.equal(text.slice(cue.from,cue.to),cue.text,`${language}: cue text mismatch for ${text}`);
    assert(!/[^\s。、！？,.!?]/u.test(text.slice(cursor,cue.from)),`${language}: unaligned text in ${text}`);
    assert(cue.start>=lastEnd&&cue.end>cue.start,`${language}: invalid cue times for ${text}`);
    cursor=cue.to;lastEnd=cue.end;
   }
   assert(!/[^\s。、！？,.!?]/u.test(text.slice(cursor)),`${language}: unaligned trailing text in ${text}`);
  }
  for(const [text,name] of Object.entries(baseline.manifest)){
   assert.equal(manifest[text],name,`${language}: a legacy recording was renamed`);
   assert.equal(hash(path.join(dir,name)),baseline.hashes[text],`${language}: a legacy recording changed`);
   assert.deepEqual(timings[text],baseline.timings[text],`${language}: legacy timing changed`);
  }
 }else{
  fs.writeFileSync(path.join(dir,'texts.json'),JSON.stringify(texts,null,2)+'\n');
  assert.deepEqual(readJson(path.join(dir,'texts.json')),texts,'Read-back confirms complete text list');
 }
 const report={language,primerOnly,required:required.size,total:texts.length,existing:Object.keys(manifest).length,original:Object.keys(baseline.manifest).length,newlyRecorded:Object.keys(manifest).length-Object.keys(baseline.manifest).length,missing:missing.length,verified:checking};
 reports.push(report);
 console.log(`${language}: ${checking?'verified':'prepared'} ${texts.length} texts; ${required.size} required, ${Object.keys(manifest).length} recorded, ${missing.length} missing; preserved ${Object.keys(baseline.manifest).length} original clips.`);
}
fs.writeFileSync(path.join(reportDir,(primerOnly?'primer-':'')+(checking?'verification.json':'preparation.json')),JSON.stringify(reports,null,2)+'\n');
