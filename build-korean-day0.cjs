const fs=require('fs'),crypto=require('crypto');
const read=file=>fs.readFileSync(file,'utf8');
const lex=require('./assets/korean-day0-language.cjs');
// Localize the shared Japanese interaction code; Korean content is independent.
function koreanRuntime(source){
 for(const [ja,ko] of [...lex.lines].sort((a,b)=>b[0].length-a[0].length))source=source.replaceAll(ja,ko);
 return source.replaceAll("language==='ja'","language==='ko'").replaceAll('日文','韓文').replaceAll('lang="ja"','lang="ko"').replaceAll("'ja'","'ko'").replaceAll('ja-Latn','ko-Latn').replace("t.line='쭉 가세요.'+line","t.line='쭉 가세요. '+line");
}
function build(){
 const d=require('./assets/micro-day0.cjs').make('ko'),dir='assets/korean-day0-audio/';
 const manifest=JSON.parse(read(dir+'manifest.json')),timings=JSON.parse(read(dir+'timings.json'));
 if(Object.keys(d.day0AudioTranslations).some(t=>!manifest[t]))throw Error('Regenerate Korean audio: some lesson text has no clip.');
 d.day0Timings=Object.fromEntries(Object.entries(manifest).map(([text,name])=>{
  const e=timings[text],hash=crypto.createHash('sha256').update(fs.readFileSync(dir+name)).digest('hex');
  if(!e||e.sha256!==hash)throw Error('Korean audio/timing mismatch: '+text);
  return [text,e.cues.map(c=>{const romaji=lex.cueReadings[c.text];if(!romaji)throw Error('Missing Korean cue reading: '+c.text);return {...c,romaji};})];
 }));
 d.day0Audio=Object.fromEntries(Object.entries(manifest).map(([text,name])=>[text,'data:audio/mpeg;base64,'+fs.readFileSync(dir+name).toString('base64')]));
 d.studyArtwork=require('./assets/course-illustrations.cjs').forLesson(0,d.rounds,d.course.replyRole);
 let runtime=read('assets/day1-2-runtime.js').replace('const tabs=','let tabs=').replace('load();render();appearance();','').replaceAll('英文','韓文').replaceAll('lang="en"','lang="ko"').replace("u.lang='en-US'","u.lang='ko-KR'")
  .replace('${esc(en)}</p><p>${esc(zh)}','${esc(en)}</p>${reading(en)}<p>${esc(zh)}').replace('${audio(answer)}<p class="fine">','${reading(answer)}${audio(answer)}<p class="fine">');
 const data=Object.entries(d).map(([k,v])=>`const ${k}=${JSON.stringify(v).replace(/</g,'\\u003c')};`).join('\n');
 const code=[data,runtime,read('assets/flow-guidance.js'),read('assets/korean-day0-extra.js'),koreanRuntime(read('assets/task-rounds.js')),koreanRuntime(read('assets/task-rounds-expanded.js')),read('assets/study-library.js'),read('assets/korean-day0-library.js'),read('assets/dialogue-preview.js'),read('assets/micro-lessons.js'),read('assets/day0-numbers.js'),'load();render();appearance();',read('assets/day0-audio.js'),read('assets/day0-glossary.js')].join('\n');
 const css=['day1-2.css','speaking-focus.css','task-rounds.css','day0-follow.css','day0-library.css','day0-glossary.css','study-library.css','flow-guidance.css','korean-day0.css','micro-lessons.css','dialogue-preview.css'].map(n=>read('assets/'+n)).join('\n');
 const title='第 0 天：韓文問路與購物・分任務練習';
 let html=read('assets/task-rounds-template.html').replace(/<title>[\s\S]*?<\/title>/,`<title>Travel Lab｜${title}</title>`).replace(/<meta name="description"[^>]*>/,`<meta name="description" content="${d.course.description}">`)
  .replace('<!-- TASK_STYLES -->',()=>`<style id="day0-styles">${css}</style>`).replace('<!-- TASK_APP -->',()=>`<script id="day0-app">${code}</script>`)
  .replace(/<script id="lesson-controls">[\s\S]*?<\/script>\s*/g,'').replace(/ aria-current="page"/g,'')
  .replaceAll('第 14 天的七部分課程','第 0 天韓文版的七部分課程').replaceAll('>DAY 14<','>DAY 0 · 韓文<').replace('第 14 天：旅途中問清楚：Where、When、Who',title);
 html=require('./sync-day0-links.cjs').updateHtml(d.file,html);
 fs.writeFileSync(d.file,html);require('./sync-appearance.cjs')(d.file);
 console.log(`Built ${d.file}: ${d.rounds.length} tasks / ${d.phrases.length} phrases / ${d.flows.length} flows / ${Object.keys(manifest).length} clips.`);
}
function prepareAudio(){
 const d=require('./assets/korean-day0-data.cjs');fs.mkdirSync('assets/korean-day0-audio',{recursive:true});
 fs.writeFileSync('assets/korean-day0-audio/texts.json',JSON.stringify(Object.keys(d.day0AudioTranslations),null,2)+'\n');
 console.log('Prepared '+Object.keys(d.day0AudioTranslations).length+' authored Korean texts.');
}
module.exports={build,prepareAudio};if(require.main===module){if(process.argv.includes('--prepare-audio'))prepareAudio();else build();}
