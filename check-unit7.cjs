const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const html=fs.readFileSync('travel-english-unit7-fitting.html','utf8');
const code=html.match(/<script>([\s\S]*?)<\/script>/)[1];
assert.equal(code.trim(),['day7.js','day7-scenes.js','day7-runtime.js'].map(f=>fs.readFileSync('assets/'+f,'utf8')).join('\n').trim());
for(const m of html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g))new vm.Script(m[1]);
function boot(saved=[],broken=false){
 const elements=new Map(),events={},storage=new Map(saved);
 const el=s=>{if(!elements.has(s))elements.set(s,{innerHTML:'',textContent:'',hidden:true,disabled:false,focus(){},setAttribute(){}});return elements.get(s);};
 const ctx=vm.createContext({console,document:{querySelector:el,addEventListener:(n,f)=>events[n]=f},window:{scrollTo(){},addEventListener(){}},localStorage:{getItem:k=>{if(broken)throw Error('blocked');return storage.get(k);},setItem:(k,v)=>{if(broken)throw Error('blocked');storage.set(k,v);}},setTimeout:()=>0,clearTimeout(){}});
 vm.runInContext(code,ctx);return {run:s=>vm.runInContext(s,ctx),el,events,storage,click:d=>events.click({target:{closest:()=>({dataset:d,disabled:false})}}),check:(id,checked)=>events.change({target:{id,checked,dataset:{}}})};
}
const b=boot(),{run,el,events,click,check,storage}=b;
assert.equal(run('labels.length'),7);assert.equal(run('phrases.length'),12);
for(let p=0;p<7;p++){run(`navigate(${p})`);assert(el('#main').innerHTML.length>600);assert.equal((el('#nav').innerHTML.match(/data-page=/g)||[]).length,7);assert(!el('#main').innerHTML.includes('reveal" open'));}
let turns=0;
for(let s=0;s<2;s++)for(let color=0;color<(s===0?3:2);color++)for(let comparison=0;comparison<2;comparison++){
 run(`startScene(${s})`);const n=run('lessons[scene].turns.length');
 for(let t=0;t<n;t++){
  assert.equal(run('turn'),t);assert.equal(run('canNext()'),false);run('nextTurn();choose(0)');assert.equal(run('turn'),t);assert.equal(run('choice'),-1);
  check('spoken',true);assert.equal(run('spoken'),false);check('heard',true);check('spoken',true);
  const kind=run('lessons[scene].turns[turn].kind'),count=run('lessons[scene].turns[turn].options.length');
  for(let bad=0;bad<count;bad++)if(!run(`accepted(lessons[scene].turns[turn],${bad})`)){run(`choose(${bad})`);assert.equal(run('canNext()'),false);assert(el('#main').innerHTML.includes('再試一次'));run('nextTurn()');assert.equal(run('turn'),t);}
  const correct=kind==='rack'?color:kind==='compare'?comparison:run('lessons[scene].turns[turn].correct');
  run(`choose(${correct})`);assert.equal(run('canNext()'),true);
  if(kind==='rack')assert.equal(run('wardrobe().color'),color);
  if(kind==='size')assert.equal(run('wardrobe().size'),'M');
  if(kind==='room')assert.equal(run('wardrobe().room'),true);
  if(kind==='compare')assert.equal(run('wardrobe().color'),comparison===0?color:(color===0?1:0));
  if(kind==='bag'){assert.equal(run('wardrobe().bag'),true);assert(run('turnText().line').includes(run('colors[wardrobe().color].en')));}
  run('nextTurn()');turns++;
 }
 assert.equal(run('finished'),true);assert.equal(run('wardrobe().size'),'M');run('nextTurn()');
}
assert.equal(turns,86);assert.equal(run('state.complete.length'),2);
// A changed earlier choice invalidates later size/color/room decisions.
run('startScene(0)');for(let i=0;i<6;i++){check('heard',true);check('spoken',true);run('choose(lessons[scene].turns[turn].correct??0);nextTurn()');}
assert.equal(run('wardrobe().size'),'M');run('back()');assert.equal(run('wardrobe().size'),'S');assert.equal(run('canNext()'),false);
check('heard',true);check('spoken',true);run('choose(1)');assert.equal(run('wardrobe().size'),'M');check('heard',false);assert.equal(run('wardrobe().size'),'S');assert.equal(run('spoken'),false);
run('startScene(1)');assert.equal(run('wardrobe().color'),2);assert.equal(run('wardrobe().size'),'L');assert.equal(run('wardrobe().room'),false);
const keys=run('fields.join(",")').split(',');for(const k of keys)events.input({target:{dataset:{field:k},value:k+' <img src=x onerror=alert(1)> &'}});
run('navigate(5)');assert(!el('#main').innerHTML.includes('<img src=x'));assert(el('#main').innerHTML.includes('&lt;img'));
for(let i=0;i<3;i++){run('navigate(3)');click({mission:String(i)});assert(el('#main').innerHTML.includes(['sizeNote','fitNote','colorNote'][i]));}
for(let i=0;i<3;i++){run('navigate(4)');click({pair:String(i)});assert(el('#main').innerHTML.includes(i===2?'① 老師先說':'① 學生先說'));assert(el('#main').innerHTML.includes(run('pairActivities[pair].opening')));assert(el('#main').innerHTML.includes('quick-reply'));assert.equal((el('#main').innerHTML.match(/data-pair-check=/g)||[]).length,4);assert(!el('#main').innerHTML.includes('teacher-guide" open'));events.change({target:{dataset:{pairCheck:i+',1'},checked:true}});assert.equal(run('state.pairChecks['+i+'][1]'),true);}
run('navigate(6)');click({homeChoice:'1'});assert(el('#main').innerHTML.includes('再聽一次'));click({homeChoice:'2'});assert(el('#main').innerHTML.includes('答對了'));
events.change({target:{id:'',dataset:{home:'1'},checked:true}});click({rating:'1,2'});
const restored=boot([...storage]);for(const k of keys)assert.equal(restored.run('state.'+k),k+' <img src=x onerror=alert(1)> &');assert.equal(restored.run('state.complete.length'),2);assert.equal(restored.run('state.home[1]'),true);assert.equal(restored.run('state.ratings[1]'),2);
for(const k of keys)assert(run('exportText()').includes(k+' <img'));assert.equal(restored.run('page'),0);
const key=run('KEY');assert.equal(boot([[key,'{bad']]).el('#storageNotice').hidden,false);
const blocked=boot([],true);blocked.run('state.before="keep me";save()');assert(blocked.run('exportText()').includes('keep me'));
run('speak("hello")');assert(el('#toast').textContent.includes('逐字稿'));
for(const m of html.matchAll(/href="([^"#]+\.html)"/g))assert(fs.existsSync(m[1]),m[1]);
assert(html.includes('prefers-reduced-motion'));assert(html.includes('prefers-reduced-transparency'));assert(html.includes('prefers-contrast'));assert(html.includes('@media(max-width:760px)'));
assert(!/DAY 03|DAY 06|機場|點餐|海關/.test(code));assert(fs.readFileSync('index.html','utf8').includes('travel-english-unit7-fitting.html'));
console.log('PASS: 7 sections, 12 phrases, 17 steps across 10 complete color/comparison paths (86 turns), speech gates, retries and stock, live fit/color/bag state, dynamic clerk confirmation, backtracking, saved/exported work, roles, homework, escaping and storage/audio fallback.');

const fresh=boot([...storage]);for(let i=0;i<3;i++)assert.equal(fresh.run('state.pairChecks['+i+'][1]'),true);assert(fresh.run('exportText()').includes('老師的具體回饋'));assert(fresh.run('exportText()').includes('✓ '));fresh.run('navigate(5)');assert.equal((fresh.el('#main').innerHTML.match(/class="ability-meter"/g)||[]).length,3);assert(!fresh.el('#main').innerHTML.includes('data-field="teacherFeedback"'));assert(fresh.el('#main').innerHTML.includes('老師與學生一起找出：這次做到了什麼，下次要多練習哪一步。'));const legacy=boot([[key,JSON.stringify({before:'old answer',ratings:[0,1,2],pairNote:'old note'})]]);assert.equal(legacy.run('state.before'),'old answer');assert.equal(legacy.run('state.pairNote'),'old note');assert.equal(legacy.run('state.pairChecks.flat().filter(Boolean).length'),0);assert.equal(legacy.run('state.teacherFeedback'),'');console.log('PASS: teacher starts, 3 independent task checklists, collapsed guidance, saved/exported checks and feedback, visual ratings and legacy progress migration.');
