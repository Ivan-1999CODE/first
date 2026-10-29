const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const d=require('./assets/day1-focus-data.cjs');
require('./assets/phrase-substitutions.cjs').addSubstitutions(d);
require('./assets/listening-preview.cjs').addListeningPreview(d);
require('./assets/english-answer-translations.cjs').addAnswerTranslations(d);
const sentences=text=>text.match(/[^.!?]+[.!?]+/g)?.map(s=>s.trim())||[];
let checked=0;
for(const [i,r] of d.rounds.entries()){
 const taught=new Set(r.phraseIds.map(id=>d.phrases.find(p=>p.id===id).en));
 for(const change of r.practiceChanges||[])if(change.en)taught.add(change.en);
 const required=[...d.flows[i].steps.map(s=>s.answer),...r.replyIds.map(id=>d.replies[id].answer),d.missions[i].answer,d.pairs[i].answer,r.home.answer,r.entryCheckpoint.answer];
 for(const answer of required)for(const line of sentences(answer)){assert(taught.has(line),`${r.id}: untaught learner sentence: ${line}`);checked++;}
 assert(r.entryCheckpoint.task.length<32,`${r.id}: entry must stay brief`);
 assert.equal((r.entryCheckpoint.task.match(/[。？！]/g)||[]).length,1);
 assert.equal(sentences(r.entryCheckpoint.answer).length,1);
 for(const s of d.flows[i].steps)assert(r.hearLines.some(h=>h.en===s.line),`${r.id}: untaught listening line`);
 for(const q of r.home.quizzes)assert(r.hearLines.some(h=>h.en===q.line),`${r.id}: untaught homework listening line`);
}
const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let current=0;
const context={...d,console,language:'en',focusRound:0,focusKey:d.course.id+'-rounds',roundsDone:[],fields:[],state:{answers:{'before-A':'原完整任務回答','after-A':'原完整任務課後'},ratings:{}},
 currentRound:()=>d.rounds[current],esc:escape,btn:(text,attr,extra='')=>`<button ${attr} ${extra}>${text}</button>`,field:(key,label)=>`<label>${label}<textarea data-field="${key}"></textarea></label>`,
 audio:text=>`<button data-say="${escape(text)}">播放</button>`,guidedHint:()=>'',check:()=>'',ratingNames:['未選','完整句','關鍵字','自己說'],studyArtwork:{images:{guide:'guide',asker:'asker'},byRound:d.rounds.map(()=>({label:'旅客'}))},
 document:{addEventListener(){}},localStorage:{getItem:()=>null},load(){},setRound(){},render(){},studyAdvanced:()=>'',phrasePage:()=>'',studyNavigation:()=>'',phraseCard:()=>'',studyUsage:()=>'',studyRoleHeading:()=>'',studyVocabulary:()=>'',transcript:()=>'',mode:'library'};
vm.createContext(context);
for(const file of ['day1-micro.js','dialogue-preview.js','day1-guided-pages.js','day1-guided-study.js'])vm.runInContext(fs.readFileSync('assets/'+file,'utf8'),context,{filename:file});
vm.runInContext('load()',context);
assert.equal(context.state.answers['before-A'],'原完整任務回答');
assert.equal(context.state.answers['after-A'],'原完整任務課後');
assert.equal(context.state.answers['before-entry-v1-A'],'');
assert(context.fields.includes('after-entry-v1-C'));
for(const [i,r] of d.rounds.entries()){
 current=i;context.focusRound=i;
 const intro=vm.runInContext('intro()',context),progress=vm.runInContext('progressCard(currentRound())',context),study=vm.runInContext('phrasePage()',context);
 assert(intro.includes(escape(r.entryCheckpoint.task))&&progress.includes(escape(r.entryCheckpoint.task)));
 assert(intro.includes(`data-field="before-entry-v1-${r.id}"`));
 assert(progress.includes(`data-field="after-entry-v1-${r.id}"`));
 assert(!intro.includes(escape(r.checkpoint.task)));
 assert(!progress.includes('原完整任務回答'),'Old full task cannot become the new baseline');
 assert(/<details class="dg-entry-record">/.test(intro),'Entry note begins collapsed');
 assert(/<details class="panel dg-study-preview">/.test(study),'Dialogue preview begins collapsed');
 assert.equal((study.match(/data-exchange=/g)||[]).length,1,'Preview only needs one representative exchange');
 const visibleChanges=vm.runInContext('dgStudyPracticeChanges(currentRound())',context);
 assert(!visibleChanges.includes('<details'));
 for(const change of r.practiceChanges||[])if(change.en)assert(visibleChanges.includes(escape(change.en)));
}
assert(vm.runInContext('microLegacyRecords()',context).includes('原完整任務回答'));
// The integrated challenge can only combine sentences already taught in A/B/C.
vm.runInContext(fs.readFileSync('assets/day1-capstone.js','utf8'),context);
const capstone=vm.runInContext('capstoneSteps',context);
const taughtAll=new Set(d.rounds.flatMap(r=>r.phraseIds.map(id=>d.phrases.find(p=>p.id===id).en)));
const heardAll=new Set(d.rounds.flatMap(r=>[...r.hearLines.map(p=>p.en),r.integrationListening?.en].filter(Boolean)));
for(const s of capstone){assert(taughtAll.has(s.answer),`08: untaught answer ${s.answer}`);assert(heardAll.has(s.line),`08: untaught listening ${s.line}`);}
for(const file of ['day1-focus-data.cjs','day1-micro.js','day1-guided-pages.js','day1-guided-study.js','day1-guided.js'])new vm.Script(fs.readFileSync('assets/'+file,'utf8'),{filename:file});
console.log(`PASS: ${checked} learner sentence uses across A/B/C align with part 2; all 7 integrated exchanges are taught; short matching entry/review, separate preserved records, visible required substitutions, and collapsed one-exchange previews.`);
