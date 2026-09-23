const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
function boot(day,initial=[],blocked=false){
 const file=day===1?'travel-english.html':'travel-english-unit2-shopping.html',html=fs.readFileSync(file,'utf8');
 const code=html.match(new RegExp('<script id="day'+day+'-app">([\\s\\S]*?)</script>'))[1];
 const storage=new Map(initial),els=new Map(),events={};
 const el=s=>{if(!els.has(s))els.set(s,{innerHTML:'',hidden:false,textContent:'',focus(){},setAttribute(){}});return els.get(s);};
 const ctx=vm.createContext({console,setTimeout:()=>1,clearTimeout(){},document:{querySelector:el,documentElement:{dataset:{}},addEventListener:(k,f)=>events[k]=f},window:{addEventListener(){},scrollTo(){},matchMedia:()=>({matches:false,addEventListener(){}})},localStorage:{getItem(k){if(blocked)throw Error();return storage.get(k)},setItem(k,v){if(blocked)throw Error();storage.set(k,v)}}});
 vm.runInContext(code,ctx);return {html,storage,el,events,run:s=>vm.runInContext(s,ctx),check:(id,checked)=>events.change({target:{id,checked,dataset:{}}})};
}
let count=0;
for(const day of [1,2]){
 const {run,el,check,html}=boot(day);
 assert.equal(run('course.labels.length'),7);
 assert(!/<(?:script|img)[^>]+src=/.test(html));
 assert.equal((html.match(/aria-current="page"/g)||[]).length,1);
 for(const m of html.matchAll(/href="([^"#]+\.html)"/g))assert(fs.existsSync(m[1]));
 for(let p=0;p<7;p++){run(`navigate(${p})`);assert(el('#main').innerHTML.length>1000);assert(!/匯出|下載|半日遊|導遊/.test(el('#main').innerHTML));}
 run('navigate(0)');assert(el('#main').innerHTML.indexOf('field-before')<el('#main').innerHTML.indexOf('今天的任務'));
 const task=run('course.task');assert(el('#main').innerHTML.includes(task));run('navigate(5)');assert(el('#main').innerHTML.includes(task));
 const unlock=()=>{const first=run('currentStep().askFirst')?'spoken':'heard',second=first==='spoken'?'heard':'spoken';check(second,true);assert.equal(run(second),false);check(first,true);check(second,true);};
 const paths=day===1?[[0,[0,1,0,0,0]],[1,[0,1,1,0,0]],[2,[0,0,0,0,0]]]:[[0,[0,0,0,0,0]],[0,[0,0,1,0,1]],[0,[0,0,1,1,0]],[1,[0,0,0,0,0]],[1,[0,0,1,1,0]]];
 for(const [f,path] of paths){run(`start(${f})`);for(const [t,c] of path.entries()){
  assert(!run('canNext()'));run('choose(0);next()');assert.equal(run('turn'),t);assert.equal(run('choice'),-1);unlock();
  for(let n=0;n<run('currentStep().objects.length');n++)if(!run(`accepted(currentStep(),${n})`)){run(`choose(${n});next()`);assert.equal(run('turn'),t);assert(!run('canNext()'));}
  run(`choose(${c})`);assert(run('canNext()'));run('next()');count++;
 }assert(run('finished'));}
 run('start(0)');unlock();run('choose(0);next()');unlock();run(`choose(${day===1?1:0});next();back()`);assert.equal(run('history.length'),1);assert(!run('heard'));assert(!run('spoken'));unlock();run(`choose(${day===1?1:0})`);check(run('currentStep().askFirst')?'spoken':'heard',false);assert.equal(run('choice'),-1);assert(!run('canNext()'));
 if(day===2){run('start(0);history=[0,0,1];turn=3');assert(run('currentStep().line').includes('green'));run('history=[0,0,1,1];turn=4');assert(run('currentStep().line').includes('No problem'));assert(run('sceneState()').includes('不需付款'));}
 for(let i=0;i<run('replies.length');i++){run(`reply=${i};mode='reply';navigate(1)`);assert(!/<details[^>]* open/.test(el('#main').innerHTML));}assert(!el('#main').innerHTML.includes(`data-reply="${run('replies.length')}"`));
 const original={before:'Old <script>answer</script>',after:'Different old question',drafts:['old draft'],followups:['follow'],ratings:[2,1,0],home:[true,false,true]};
 const key=`travel-lab-unit${day}-v2`,b=boot(day,[[key,JSON.stringify(original)],['other','safe']]);
 assert.equal(b.run('state.answers.before'),original.before);assert.equal(b.run('state.answers.after'),'');assert.equal(b.run('state.legacy.after'),original.after);
 b.run("state.answers.after='new';save()");assert.equal(b.storage.get(key),JSON.stringify(original));assert.equal(b.storage.get('other'),'safe');const re=boot(day,[...b.storage]);assert.equal(re.run('state.answers.after'),'new');assert.equal(re.run('state.legacy.drafts[0]'),'old draft');re.run('navigate(5)');assert(re.el('#main').innerHTML.includes('&lt;script&gt;'));assert(!re.el('#main').innerHTML.includes('<script>answer'));
 for(const raw of ['broken','null','[]','{"answers":{"before":5},"checks":{},"ratings":[]}']){const x=boot(day,[[run('course.id'),raw]]);x.run('navigate(6)');assert(x.el('#main').innerHTML.length>1000);}
 const blocked=boot(day,[],true);assert(!blocked.el('#storageNotice').hidden);blocked.run("save();speak('test')");assert(blocked.el('#toast').textContent.includes('無法朗讀'));
 console.log(`Day ${day}: state, branches, migration, content and fallback checks passed.`);
}
console.log(`${count} valid workflow steps verified.`);
