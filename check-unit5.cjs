const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const html=fs.readFileSync('travel-english-unit5-getting-around.html','utf8');
const code=html.match(/<script>([\s\S]*?)<\/script>/)[1];
assert.equal(code.trim(),(fs.readFileSync('assets/day5.js','utf8')+'\n'+fs.readFileSync('assets/day5-scenes.js','utf8')).trim());
function boot(saved=[],broken=false){
 const elements=new Map(),events={},storage=new Map(saved);
 const el=s=>{if(!elements.has(s))elements.set(s,{innerHTML:'',textContent:'',hidden:true,disabled:false,focus(){},setAttribute(){},querySelectorAll(){return[];}});return elements.get(s);};
 const ctx=vm.createContext({console,document:{querySelector:el,querySelectorAll:()=>[],addEventListener:(n,f)=>events[n]=f},window:{scrollTo(){},addEventListener(){}},localStorage:{getItem:k=>{if(broken)throw Error('blocked');return storage.get(k);},setItem:(k,v)=>{if(broken)throw Error('blocked');storage.set(k,v);}},setTimeout:()=>0,clearTimeout(){}});
 vm.runInContext(code,ctx);return {run:s=>vm.runInContext(s,ctx),el,events,storage,click:d=>events.click({target:{closest:()=>({dataset:d,disabled:false})}})};
}
const b=boot(),{run,el,events,click,storage}=b;
assert.equal(run('labels.length'),7);assert.equal(run('phrases.length'),12);
for(let p=0;p<7;p++){run(`navigate(${p})`);assert(el('#main').innerHTML.length>500);assert.equal((el('#nav').innerHTML.match(/data-page=/g)||[]).length,7);assert(!el('#main').innerHTML.includes('reveal" open'));}
let turns=0,quizzes=0;
for(let s=0;s<2;s++){
 run(`startScene(${s})`);const n=run('lessons[scene].turns.length');
 for(let t=0;t<n;t++){
  assert.equal(run('turn'),t);assert.equal(run('canNext()'),false);run('nextTurn()');assert.equal(run('turn'),t);
  run('choose(0)');assert.equal(run('choice'),-1);
  events.change({target:{id:'spoken',checked:true,dataset:{}}});
  if(run('!!lessons[scene].turns[turn].interaction')){
   const correct=run('lessons[scene].turns[turn].interaction.correct');run(`choose(${(correct+1)%run('lessons[scene].turns[turn].interaction.options.length')})`);assert.equal(run('canNext()'),false);run('nextTurn()');assert.equal(run('turn'),t);
   run(`choose(${correct})`);assert.equal(run('canNext()'),true);quizzes++;
   if(s===0&&t===1)assert(el('#main').innerHTML.includes('M250 364V120H100V91'));
  }
  run('nextTurn()');turns++;
 }
 assert.equal(run('finished'),true);assert.equal(run('state.complete.length'),s+1);run('nextTurn()');assert.equal(run('state.complete.length'),s+1);
}
run('startScene(0)');assert.equal(run('state.complete.length'),2);assert.equal(run('choice'),-1);
const keys=run('fields.join(",")').split(',');for(const k of keys)events.input({target:{dataset:{field:k},value:k+' <img src=x onerror=alert(1)> &'}});
run('navigate(5)');assert(!el('#main').innerHTML.includes('<img src=x'));assert(el('#main').innerHTML.includes('&lt;img'));
for(let i=0;i<3;i++){run('navigate(3)');click({mission:String(i)});assert(el('#main').innerHTML.includes(['rushNote','fareNote','stopNote'][i]));}
for(let i=0;i<3;i++)for(const r of ['A','B']){run(`page=4;pair=${i};role='${r}';render()`);assert(el('#main').innerHTML.includes('ROLE '+r));if(r==='A')assert(!el('#main').innerHTML.includes(run('pairCards[pair].secret')));}
run('navigate(6)');click({homeMap:'0'});assert(el('#main').innerHTML.includes('再試一次'));click({homeMap:'2'});assert(el('#main').innerHTML.includes('答對了！第一個路口'));assert(el('#main').innerHTML.includes('M250 364V263H380V233'));
click({homeFare:'0'});assert(el('#main').innerHTML.includes('再聽一次：分別'));click({homeFare:'2'});assert(el('#main').innerHTML.includes('答對了！twelve'));
events.change({target:{id:'',dataset:{home:'1'},checked:true}});run('state.ratings=[0,1,2];save()');
const restored=boot([...storage]);for(const k of keys)assert.equal(restored.run('state.'+k),k+' <img src=x onerror=alert(1)> &');assert.equal(restored.run('state.complete.length'),2);assert.equal(restored.run('state.home[1]'),true);
for(const k of keys)assert(run('exportText()').includes(k+' <img'));for(const s of ['第五天','去景點','1/3','能獨立完成'])assert(run('exportText()').includes(s));
const key=run('KEY');const corrupt=boot([[key,'{bad']]);assert.equal(corrupt.el('#storageNotice').hidden,false);
const bad=boot([[key,'{"journeyVersion":2,"complete":[0,0,8,"1"],"ratings":[99,1,null],"before":8}']]);assert.equal(bad.run('state.complete.length'),1);assert.equal(bad.run('state.before'),'');assert.equal(bad.run('state.ratings[0]'),-1);
const blocked=boot([],true);blocked.run('state.before="keep me";save()');assert(blocked.run('exportText()').includes('keep me'));assert.equal(blocked.el('#storageNotice').hidden,false);
run('speak("hello")');assert(el('#toast').textContent.includes('逐字稿'));
run('navigate(99)');assert.equal(run('page'),6);run('navigate(-1)');assert.equal(run('page'),0);
for(const file of ['index.html','travel-english-unit5-getting-around.html'])for(const m of fs.readFileSync(file,'utf8').matchAll(/href="([^"#]+\.html)"/g))assert(fs.existsSync(m[1]));
assert(!/機場|登機|海關|報到|DAY 03/.test(code));
assert.equal(html.match(/<style id="course-layout-styles">\n([\s\S]*?)<\/style>/)[1],fs.readFileSync('assets/course-layout.css','utf8'));
assert.equal(html.match(/<script id="course-layout-script">\n([\s\S]*?)<\/script>/)[1],fs.readFileSync('assets/course-layout.js','utf8'));
console.log(`PASS: 7 pages, 12 phrases, ${turns} turns, ${quizzes} listening checks, route geometry, role information gap, 7 saved/exported fields, homework retries, completion gates, escaped text, corrupt/blocked storage, speech fallback, links and shared layout.`);

const legacy=boot([[key,JSON.stringify({before:'old answer',complete:[0,1,2],home:[true,false,false]})]]);assert.equal(legacy.run('state.before'),'old answer');assert.equal(legacy.run('state.complete.length'),0);assert.equal(legacy.run('state.home[0]'),true);
run('startScene(1)');assert(el('#main').innerHTML.includes('building-scene'));run('turn=1;render()');assert(el('#main').innerHTML.includes('TL-205'));assert(el('#main').innerHTML.includes('street-scene'));run('turn=4;render()');assert(el('#main').innerHTML.includes('SUNNY HOTEL'));
console.log('PASS: two journeys, all action gates, return pickup/car/dropoff scenes, legacy answers retained and obsolete completion reset.');
