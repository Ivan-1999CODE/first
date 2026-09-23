const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const html=fs.readFileSync('travel-english-unit13-why-which.html','utf8');
const code=html.match(/<script id="day13-app">([\s\S]*?)<\/script>/)[1];
assert.equal(code,['day13.js','day13-runtime.js'].map(f=>fs.readFileSync('assets/'+f,'utf8')).join('\n'));
assert.equal(html.match(/<style id="day13-styles">([\s\S]*?)<\/style>/)[1],fs.readFileSync('assets/day13.css','utf8'));
function boot(saved=[],blocked=false){const storage=new Map(saved),elements=new Map(),events={};const el=s=>{if(!elements.has(s))elements.set(s,{innerHTML:'',textContent:'',hidden:false,open:false,dataset:{},focus(){},setAttribute(){}});return elements.get(s);};const ctx=vm.createContext({console,setTimeout:()=>1,clearTimeout(){},document:{querySelector:el,documentElement:{dataset:{theme:'light',size:'standard'}},addEventListener:(n,f)=>events[n]=f},window:{matchMedia:()=>({matches:false,addEventListener(){}}),addEventListener(){},scrollTo(){}},localStorage:{getItem(k){if(blocked)throw Error('blocked');return storage.get(k)},setItem(k,v){if(blocked)throw Error('blocked');storage.set(k,v)}}});vm.runInContext(code,ctx);return {run:s=>vm.runInContext(s,ctx),el,storage,events,click:dataset=>events.click({target:{closest:()=>({dataset,disabled:false})}}),check:(id,checked)=>events.change({target:{id,checked,dataset:{}}})};}

const b=boot(),{run,el,check,click}=b;
assert.equal(run('course.labels.length'),7);
for(let p=0;p<7;p++){run('navigate('+p+')');assert(el('#main').innerHTML.length>1000);assert(!/<details[^>]* open/.test(el('#main').innerHTML));assert(!/匯出|下載/.test(el('#main').innerHTML));}
run('navigate(0)');assert(el('#main').innerHTML.indexOf('field-before')<el('#main').innerHTML.indexOf('一個下午，一起商量'));
// Exercise all 32 combinations of the five independent preference choices.
let turns=0;
for(let mask=0;mask<32;mask++){
 run('start(0)');const choices=[mask&1,(mask>>1)&1,(mask>>2)&1,0,0,(mask>>3)&1,1,(mask>>4)&1,0];
 for(let n=0;n<choices.length;n++){
  assert(!run('canNext()'));run('choose(0);next()');assert.equal(run('choice'),-1);check('spoken',true);assert.equal(run('spoken'),false);check('heard',true);check('spoken',true);
  if(n===6){run('choose(0);next()');assert.equal(run('turn'),6);assert(!run('canNext()'));}
  run('choose('+choices[n]+');next()');turns++;
 }
 assert(run('finished'));assert(run('currentStep().line').includes(choices[0]===0?'park':'museum'));assert(run('currentStep().line').includes(choices[7]===0?'water':'tea'));assert(run('sceneView().text').includes(choices[2]===0?'公車':'計程車'));
}
assert.equal(turns,288);assert.equal(run('state.complete.length'),1);
run('start(0)');check('heard',true);check('spoken',true);run('choose(0);next()');assert(run('currentStep().line').includes('park'));run('back()');check('heard',true);check('spoken',true);run('choose(1);next()');assert(run('currentStep().line').includes('museum'));assert.equal(run('selected("reason")'),undefined);check('heard',true);check('spoken',true);run('choose(0)');check('heard',false);assert.equal(run('selected("reason")'),undefined);assert(!run('canNext()'));
const fields=JSON.parse(run('JSON.stringify(fields)'));for(const key of fields)b.events.input({target:{dataset:{field:key},value:key+' <img src=x onerror=bad()> &'}});
run('navigate(5)');assert(el('#main').innerHTML.includes('&lt;img'));assert(!el('#main').innerHTML.includes('<img'));
for(const id of ['plan','change'])b.events.change({target:{dataset:{pairCheck:id+':0'},checked:true}});
for(const [id,n] of [['choose',1],['reason',2],['suggest',3]])click({rating:id+':'+n});assert.equal((el('#main').innerHTML.match(/class="yellow"/g)||[]).length,3);assert.equal((el('#main').innerHTML.match(/class="green"/g)||[]).length,3);click({rating:'suggest:1'});assert(!el('#main').innerHTML.includes('class="green"'));
for(const key of ['listen','written','spoken'])b.events.change({target:{dataset:{home:key},checked:true}});
const restored=boot([...b.storage]);for(const key of fields)assert.equal(restored.run('state.answers['+JSON.stringify(key)+']'),key+' <img src=x onerror=bad()> &');assert.equal(restored.run('state.complete.length'),1);assert.equal(restored.run('Object.values(state.checks).flat().filter(Boolean).length'),2);assert(restored.run('homeProgress()').includes('3 / 3'));
assert(boot([[run('course.id'),'{broken']]).run('storageFailed'));const blocked=boot([],true);blocked.run('save();speak("hello")');assert(blocked.run('storageFailed'));assert(blocked.el('#toast').textContent.includes('無法朗讀'));
const weird=boot([[run('course.id'),JSON.stringify({answers:{before:7},checks:{plan:[true,'true',1]},ratings:{choose:99},complete:['afternoon','bad','afternoon']})]]);assert.equal(weird.run('state.answers.before'),'');assert.equal(weird.run('state.ratings.choose'),0);assert.equal(weird.run('state.complete.length'),1);assert.equal(weird.run('state.checks.plan.filter(Boolean).length'),1);
for(const file of fs.readdirSync('.').filter(f=>/^travel-english.*\.html$/.test(f))){const h=fs.readFileSync(file,'utf8');assert(h.includes('travel-english-unit13-why-which.html'),file);for(const match of h.matchAll(/href="(?:\.\/)?(travel-english[^"#]+\.html)"/g))assert(fs.existsSync(match[1]),match[1]);}
console.log('PASS: 32 branches / 288 steps, gates, closed café retry, rollback, independent storage, invalid/blocked storage, escaping, ratings, embedded source parity and lesson links.');
