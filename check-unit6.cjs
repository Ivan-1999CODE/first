const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const html=fs.readFileSync('travel-english-unit6-ordering.html','utf8');
const code=html.match(/<script>([\s\S]*?)<\/script>/)[1];
assert.equal(code.trim(),fs.readFileSync('assets/day6.js','utf8').trim());
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
for(let s=0;s<2;s++){
 run(`startScene(${s})`);const n=run('lessons[scene].turns.length');
 for(let t=0;t<n;t++){
  assert.equal(run('turn'),t);assert.equal(run('canNext()'),false);run('nextTurn()');assert.equal(run('turn'),t);
  run('choose(0)');assert.equal(run('choice'),-1);check('spoken',true);assert.equal(run('spoken'),false);
  check('heard',true);run('choose(0)');assert.equal(run('choice'),-1);check('spoken',true);
  const count=run('lessons[scene].turns[turn].kind === "menu" ? 3 : lessons[scene].turns[turn].options.length');
  const correct=run('lessons[scene].turns[turn].correct');
  if(count>1){run(`choose(${(correct+1)%count})`);assert.equal(run('canNext()'),false);assert(el('#main').innerHTML.includes('再試一次'));run('nextTurn()');assert.equal(run('turn'),t);}
  run('choose(99)');assert.notEqual(run('choice'),99);run(`choose(${correct})`);assert.equal(run('canNext()'),true);
  if(t===3&&s===0)assert.equal(run('currentOrder().price'),8.5);
  if(t===2&&s===1)assert.equal(run('currentOrder().price'),18);
  if(t===4&&s===1){assert.equal(run('currentOrder().item'),'tomato');assert.equal(run('currentOrder().price'),12);}
  run('nextTurn()');turns++;
 }
 assert.equal(run('finished'),true);assert.equal(run('state.complete.length'),s+1);
 assert.equal(run('currentOrder().service'),s===0?'外帶':'內用');
 assert.equal(run('currentOrder().price'),s===0?8.5:12);run('nextTurn()');assert.equal(run('state.complete.length'),s+1);
}
assert.equal(turns,13);
// Backtracking removes dependent order data, and reset never clears saved work.
run('startScene(1)');for(let i=0;i<6;i++){check('heard',true);check('spoken',true);run('choose(lessons[scene].turns[turn].correct);nextTurn()');}
assert.equal(run('currentOrder().service'),'內用');run('back()');assert.equal(run('turn'),5);assert.equal(run('currentOrder().service'),null);run('back()');assert.equal(run('currentOrder().item'),'seafood');assert.equal(run('currentOrder().price'),18);
check('heard',true);check('spoken',true);run('choose(1)');assert.equal(run('currentOrder().price'),12);check('heard',false);assert.equal(run('spoken'),false);assert.equal(run('canNext()'),false);assert.equal(run('currentOrder().price'),18);
const keys=run('fields.join(",")').split(',');for(const k of keys)events.input({target:{dataset:{field:k},value:k+' <img src=x onerror=alert(1)> &'}});
run('navigate(5)');assert(!el('#main').innerHTML.includes('<img src=x'));assert(el('#main').innerHTML.includes('&lt;img'));
for(let i=0;i<3;i++){run('navigate(3)');click({mission:String(i)});assert(el('#main').innerHTML.includes(['recommendNote','budgetNote','orderNote'][i]));}
for(let i=0;i<3;i++)for(const r of ['A','B']){run(`page=4;pair=${i};role='${r}';render()`);assert(el('#main').innerHTML.includes('ROLE '+r));if(r==='A')assert(!el('#main').innerHTML.includes(run('pairCards[pair].b')));}
run('navigate(6)');click({homeChoice:'1'});assert(el('#main').innerHTML.includes('再聽一次'));click({homeChoice:'2'});assert(el('#main').innerHTML.includes('答對了'));
events.change({target:{id:'',dataset:{home:'1'},checked:true}});click({rating:'1,2'});
const restored=boot([...storage]);for(const k of keys)assert.equal(restored.run('state.'+k),k+' <img src=x onerror=alert(1)> &');assert.equal(restored.run('state.complete.length'),2);assert.equal(restored.run('state.home[1]'),true);assert.equal(restored.run('state.ratings[1]'),2);
for(const k of keys)assert(run('exportText()').includes(k+' <img'));
assert(run('exportText()').includes('1/3'));assert.equal(restored.run('turn'),0);assert.equal(restored.run('page'),0);
const key=run('KEY');assert.equal(boot([[key,'{bad']]).el('#storageNotice').hidden,false);
const corrupt=boot([[key,'{"complete":[0,0,4,"1"],"ratings":[99,1,null],"before":8}']]);assert.equal(corrupt.run('state.complete.length'),1);assert.equal(corrupt.run('state.before'),'');assert.equal(corrupt.run('state.ratings[0]'),-1);
const blocked=boot([],true);blocked.run('state.before="keep me";save()');assert(blocked.run('exportText()').includes('keep me'));assert.equal(blocked.el('#storageNotice').hidden,false);
run('speak("hello")');assert(el('#toast').textContent.includes('逐字稿'));
run('navigate(99)');assert.equal(run('page'),6);run('navigate(-1)');assert.equal(run('page'),0);
for(const m of html.matchAll(/href="([^"#]+\.html)"/g))assert(fs.existsSync(m[1]),m[1]);
assert(html.includes('prefers-reduced-motion'));assert(html.includes('prefers-reduced-transparency'));assert(html.includes('prefers-contrast'));assert(html.includes('@media(max-width:760px)'));assert.equal((html.match(/<nav class="day-switcher"[\s\S]*?<\/nav>/)[0].match(/aria-current="page"/g)||[]).length,1);
assert(!/DAY 03|機場|車資|海關/.test(code));
console.log('PASS: 7 sections, 12 phrases, 13 interactive turns, listen/speak gates, wrong-answer retries, menu/price/service order state, budget replacement, back/reset, 7 saved/exported fields, 3 role pairs, homework, input escaping, corrupted/blocked storage, speech fallback, navigation links and accessibility CSS.');
