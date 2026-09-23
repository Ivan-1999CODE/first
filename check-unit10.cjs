const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const html=fs.readFileSync('travel-english-unit10-kind-words.html','utf8');
const code=html.match(/<script id="day10-app">([\s\S]*?)<\/script>/)[1];
assert.equal(code,['day10.js','day10-runtime.js'].map(f=>fs.readFileSync('assets/'+f,'utf8')).join('\n'));
assert.equal(html.match(/<style id="day10-styles">([\s\S]*?)<\/style>/)[1],fs.readFileSync('assets/day10.css','utf8'));
function boot(saved=[],blocked=false){const storage=new Map(saved),elements=new Map(),events={};const el=s=>{if(!elements.has(s))elements.set(s,{innerHTML:'',textContent:'',hidden:false,open:false,dataset:{},focus(){},setAttribute(){}});return elements.get(s);};const ctx=vm.createContext({console,setTimeout:()=>1,clearTimeout(){},document:{querySelector:el,documentElement:{dataset:{theme:'light',size:'standard'}},addEventListener:(n,f)=>events[n]=f},window:{matchMedia:()=>({matches:false,addEventListener(){}}),addEventListener(){},scrollTo(){}},localStorage:{getItem(k){if(blocked)throw Error('blocked');return storage.get(k)},setItem(k,v){if(blocked)throw Error('blocked');storage.set(k,v)}}});vm.runInContext(code,ctx);return {run:s=>vm.runInContext(s,ctx),el,storage,events,click:dataset=>events.click({target:{closest:()=>({dataset,disabled:false})}}),check:(id,checked)=>events.change({target:{id,checked,dataset:{}}})};}
const b=boot(),{run,el,check,click}=b;
assert.equal(run('course.labels.length'),7);
for(let i=0;i<7;i++){run(`navigate(${i})`);assert(el('#main').innerHTML.length>1000);assert(!/<details[^>]* open/.test(el('#main').innerHTML));assert.equal((el('#nav').innerHTML.match(/data-page=/g)||[]).length,7);assert(!/匯出|下載/.test(el('#main').innerHTML));}
run('navigate(0)');assert(el('#main').innerHTML.indexOf('field-before')<el('#main').innerHTML.indexOf('三個旅途中'));assert(el('#main').innerHTML.includes(run('course.task')));run('navigate(5)');assert(el('#main').innerHTML.includes(run('course.task')));
let turns=0;
for(const [f,branch] of [[0,0],[0,1],[1,0],[1,1],[2,0]]){run(`start(${f})`);const n=run('flows[flow].steps.length');for(let t=0;t<n;t++){
 assert.equal(run('canNext()'),false);run('choose(0);next()');assert.equal(run('choice'),-1);assert.equal(run('turn'),t);check('spoken',true);assert.equal(run('spoken'),false);check('heard',true);check('spoken',true);
 const size=run('currentStep().objects.length');for(let c=0;c<size;c++)if(!run(`accepted(currentStep(),${c})`)){run(`choose(${c});next()`);assert.equal(run('turn'),t);assert(!run('canNext()'));assert(el('#main').innerHTML.includes('再試一次'));}
 const valid=JSON.parse(run('JSON.stringify(currentStep().valid)')),c=valid.length>1?valid[branch]:valid[0];run(`choose(${c})`);assert(run('canNext()'));run('next()');turns++;
 }assert(run('finished'));if(f===0){assert(run('sceneView().text').includes(branch===0?'水':'茶'));assert(run('currentStep().line').includes(branch===0?'water':'tea'));}if(f===1)assert(run('currentStep().line').includes(branch===0?'Tomorrow':'Enjoy'));}
assert.equal(turns,22);assert.equal(run('state.complete.length'),3);
// Changing a prior choice invalidates later state and confirmation text.
run('start(0)');for(const c of [0,1,1,0]){check('heard',true);check('spoken',true);run(`choose(${c});next()`);}assert(run('currentStep().line').includes('water'));run('back()');assert.equal(run('selected("drink")'),undefined);check('heard',true);check('spoken',true);run('choose(1);next()');assert(run('currentStep().line').includes('tea'));run('back()');check('heard',true);check('spoken',true);run('choose(0)');check('heard',false);assert.equal(run('spoken'),false);assert.equal(run('selected("drink")'),undefined);assert(!run('canNext()'));
// Every independently saved field survives reload and is HTML-escaped.
const fields=JSON.parse(run('JSON.stringify(fields)'));
for(const key of fields)b.events.input({target:{dataset:{field:key},value:key+' <img src=x onerror=bad()> &'}});
run('navigate(5)');assert(el('#main').innerHTML.includes('&lt;img'));assert(!el('#main').innerHTML.includes('<img'));assert(run('state.answers.before').startsWith('before'));
for(const id of ['cafe','dinner','map'])b.events.change({target:{dataset:{pairCheck:id+':1'},checked:true}});
for(const [id,n] of [['request',1],['decline',2],['apology',3]])click({rating:id+':'+n});assert.equal((el('#main').innerHTML.match(/class="yellow"/g)||[]).length,3);assert.equal((el('#main').innerHTML.match(/class="green"/g)||[]).length,3);click({rating:'apology:1'});assert(!el('#main').innerHTML.includes('class="green"'));
for(const key of ['listen','written','spoken'])b.events.change({target:{dataset:{home:key},checked:true}});
run('navigate(6)');click({quiz:'supplies:2'});assert(el('#main').innerHTML.includes('再聽一次'));click({quiz:'supplies:0'});assert(el('#main').innerHTML.includes('✓ two napkins'));
const restored=boot([...b.storage]);for(const key of fields)assert.equal(restored.run(`state.answers[${JSON.stringify(key)}]`),key+' <img src=x onerror=bad()> &');assert.equal(restored.run('state.complete.length'),3);assert.equal(restored.run('Object.values(state.checks).flat().filter(Boolean).length'),3);assert(restored.run('homeProgress()').includes('3 / 3'));assert.equal(restored.run('page'),0);
assert(boot([[run('course.id'),'{broken']]).run('storageFailed'));assert(boot([[run('course.id'),'null']]).run('storageFailed'));const blocked=boot([],true);blocked.run('save();speak("hello")');assert(blocked.run('storageFailed'));assert(blocked.el('#toast').textContent.includes('無法朗讀'));
const weird=boot([[run('course.id'),JSON.stringify({answers:{before:7},checks:{cafe:[true,'true',1]},ratings:{request:99},complete:['cafe','bad','cafe']})]]);assert.equal(weird.run('state.answers.before'),'');assert.equal(weird.run('state.ratings.request'),0);assert.equal(weird.run('state.complete.length'),1);assert.equal(weird.run('state.checks.cafe.filter(Boolean).length'),1);
for(const m of html.matchAll(/href="([^"#]+\.html)"/g))assert(fs.existsSync(m[1]),m[1]);
for(const file of fs.readdirSync('.').filter(f=>/^travel-english.*\.html$/.test(f))){const h=fs.readFileSync(file,'utf8'),nav=h.match(/<nav class="day-switcher"[\s\S]*?<\/nav>/)?.[0];assert(nav,file+' navigation');assert.equal((nav.match(/href="travel-english-unit10-kind-words.html"/g)||[]).length,1,file);}
assert(fs.readFileSync('index.html','utf8').includes('travel-english-unit10-kind-words.html'));
assert(!/<script[^>]+src=|<img[^>]+src=|<link[^>]+href="(?!data:)/.test(html));
for(const m of html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g))new vm.Script(m[1]);
console.log('PASS: 7 sections; 14 phrases; 6 short replies; 5 branches / 22 steps; gates, retries, backtracking, dynamic props/dialogue; independent storage, escaping, ratings, homework, fallbacks; standalone build and course links.');
