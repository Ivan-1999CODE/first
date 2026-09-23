const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const html=fs.readFileSync('travel-english-unit8-hotel.html','utf8');
const code=html.match(/<script>([\s\S]*?)<\/script>/)[1];
assert.equal(code.trim(),['day8.js','day8-scenes.js','day8-runtime.js'].map(f=>fs.readFileSync('assets/'+f,'utf8')).join('\n').trim());
assert.equal(html.match(/<style id="day8-styles">([\s\S]*?)<\/style>/)[1].trim(),['day7.css','day8.css'].map(f=>fs.readFileSync('assets/'+f,'utf8')).join('\n').trim());
for(const m of html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g))new vm.Script(m[1]);
function boot(saved=[],broken=false){
 const els=new Map(),events={},storage=new Map(saved);
 const el=s=>{if(!els.has(s))els.set(s,{innerHTML:'',textContent:'',hidden:true,focus(){},setAttribute(){}});return els.get(s);};
 const ctx=vm.createContext({console,document:{querySelector:el,addEventListener:(n,f)=>events[n]=f},window:{scrollCalls:0,scrollTo(){this.scrollCalls++;},addEventListener(){}},localStorage:{getItem:k=>{if(broken)throw Error('blocked');return storage.get(k);},setItem:(k,v)=>{if(broken)throw Error('blocked');storage.set(k,v);}},setTimeout:()=>0,clearTimeout(){}});
 vm.runInContext(code,ctx);return {run:s=>vm.runInContext(s,ctx),el,events,storage,click:d=>events.click({target:{closest:()=>({dataset:d,disabled:false})}}),check:(id,checked)=>events.change({target:{id,checked,dataset:{}}})};
}
const {run,el,events,click,check,storage}=boot();
assert.equal(run('labels.length'),7);assert.equal(run('phrases.length'),14);assert.equal(run('clerkReplies.length'),6);
for(let p=0;p<7;p++){run(`navigate(${p})`);assert(el('#main').innerHTML.length>600);assert.equal((el('#nav').innerHTML.match(/data-page=/g)||[]).length,7);assert(!/class="(?:teacher-guide|reveal)" open/.test(el('#main').innerHTML));}
run('navigate(0)');assert(el('#main').innerHTML.includes(run('taskBefore')));run('navigate(5)');assert(el('#main').innerHTML.includes(run('taskBefore')));
let turns=0;const paths=[[0,0,0],[0,1,0],[1,0,0],[2,0,0],[2,0,1],[2,1,0],[2,1,1]];
for(const [s,variant,decision] of paths){run(`startScene(${s})`);const n=run('lessons[scene].turns.length');for(let t=0;t<n;t++){
 assert.equal(run('turn'),t);assert.equal(run('canNext()'),false);assert.equal((el('#main').innerHTML.match(/data-act="next"/g)||[]).length,1);assert(!run('sceneView()').includes('data-act="scene-next"'));run('nextTurn();choose(0)');assert.equal(run('choice'),-1);assert.equal(run('turn'),t);
 check('spoken',true);assert.equal(run('spoken'),false);check('heard',true);check('spoken',true);
 const count=run('turnText().options.length');for(let bad=0;bad<count;bad++)if(!run(`accepted(turnText(),${bad})`)){run(`choose(${bad});nextTurn()`);assert.equal(run('turn'),t);assert.equal(run('canNext()'),false);assert(el('#main').innerHTML.includes('再試一次'));}
 const kind=run('turnText().kind'),correct=['bed','food'].includes(kind)?variant:kind==='decision'?decision:run('turnText().correct');run(`choose(${correct})`);
 if(kind==='bed')assert.equal(run('stay().bed'),variant);
 if(kind==='food')assert.equal(run('stay().meal'),variant);
 if(kind==='decision'){assert.equal(run('stay().decision'),decision);assert(run('turnText().line').includes(variant===0?'twenty':'twelve'));}
 if(kind==='finish'){assert.equal(run('turnText().line.includes("canceled")'),decision===1);assert(el('#main').innerHTML.includes(decision===1?'已取消 · 不收費':variant===0?'$20':'$12'));}
 if(run('turnText().travel')){assert.equal(run('canNext()'),false);click({lift:'left'});assert.equal(run('canNext()'),false);click({lift:'right'});assert.equal(run('stay().arrived'),true);}
 assert.equal(run('canNext()'),true);const scrollCalls=run('window.scrollCalls');click({act:'next'});assert.equal(run('window.scrollCalls'),scrollCalls,'Next must not scroll to the page top');turns++;
 }assert.equal(run('finished'),true);run('nextTurn()');assert.equal(run('finished'),true);
}
assert.equal(turns,38);assert.equal(run('state.complete.length'),3);
// Backtracking must invalidate downstream choices and dynamic speech.
run('startScene(2)');for(const c of [0,0,0,0]){check('heard',true);check('spoken',true);run(`choose(${c});nextTurn()`);}assert.equal(run('stay().decision'),0);run('back()');assert.equal(run('stay().decision'),-1);check('heard',true);check('spoken',true);run('choose(1);nextTurn()');assert(run('turnText().line').includes('canceled'));run('back();back();back()');assert.equal(run('stay().meal'),-1);check('heard',true);check('spoken',true);run('choose(1);nextTurn()');assert(run('turnText().line').includes('tomato soup'));check('heard',false);assert.equal(run('spoken'),false);
// Saved work, first-attempt lock and safe rendering.
for(const k of run('fields.join(",")').split(','))events.input({target:{dataset:{field:k},value:k+' <img src=x onerror=alert(1)> &'}});
click({act:'lock-before'});events.input({target:{dataset:{field:'before'},value:'overwrite'}});assert(run('state.before').startsWith('before '));assert.equal(run('state.beforeLocked'),true);
run('navigate(5)');assert(!el('#main').innerHTML.includes('<img src=x'));assert(el('#main').innerHTML.includes('&lt;img'));assert.equal((el('#main').innerHTML.match(/class="ability-meter"/g)||[]).length,3);
for(let i=0;i<3;i++){run('navigate(4)');click({pair:String(i)});assert(el('#main').innerHTML.includes(i===1?'① 老師先說':'① 學生先說'));assert.equal((el('#main').innerHTML.match(/data-pair-check=/g)||[]).length,4);events.change({target:{dataset:{pairCheck:i+',1'},checked:true}});click({rating:i+','+i});}
run('navigate(6)');click({homeChoice:'0,0'});assert(el('#main').innerHTML.includes('再聽一次'));click({homeChoice:'0,2'});click({homeChoice:'1,0'});events.change({target:{dataset:{homeSpoken:''},checked:true}});assert.equal(run('homeCount()'),3);assert(el('#main').innerHTML.includes('課後挑戰完成'));
const restored=boot([...storage]);assert.equal(restored.run('state.beforeLocked'),true);assert.equal(restored.run('state.complete.length'),3);assert.equal(restored.run('state.pairChecks.flat().filter(Boolean).length'),3);assert.equal(restored.run('homeCount()'),3);assert.equal(restored.run('state.ratings.join(",")'),'0,1,2');assert.equal(restored.run('page'),0);
for(const k of run('fields.join(",")').split(','))assert(restored.run('exportText()').includes(k+' <img'));
assert(restored.run('exportText()').includes('✓ '));
const key=run('KEY');assert.equal(boot([[key,'{bad']]).el('#storageNotice').hidden,false);const blocked=boot([],true);blocked.run('state.before="keep me";save()');assert(blocked.run('exportText()').includes('keep me'));assert.equal(blocked.el('#storageNotice').hidden,false);run('speak("Hello")');assert(el('#toast').textContent.includes('逐字稿'));
for(const m of html.matchAll(/href="([^"#]+\.html)"/g))assert(fs.existsSync(m[1]),m[1]);
assert(!/<script[^>]+src=|<link[^>]+href="(?!data:)|<img[^>]+src="(?!data:)/.test(html));assert(!/DAY 03|DAY 07|T-shirt|試衣間/.test(code));assert(fs.readFileSync('index.html','utf8').includes('travel-english-unit8-hotel.html'));
for(const preference of ['prefers-reduced-motion','prefers-reduced-transparency','prefers-contrast'])assert(html.includes(preference));
console.log('PASS: source/build match; 7 sections, 14 phrases, 6 Q&A; 7 paths / 38 turns; speech gates, retry, elevator, dynamic beds/meals/prices/cancellation, backtracking; independent saved work, locked first answer, checklists, ratings, homework, export, escaping and storage/audio fallback.');
