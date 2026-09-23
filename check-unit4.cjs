const fs = require('fs'), vm = require('vm'), assert = require('assert/strict');
const html = fs.readFileSync('travel-english-unit4-transit.html', 'utf8');
const code = html.match(/<script>([\s\S]*?)<\/script>/)[1];
function boot(saved, broken=false) {
  const elements=new Map(), events={}, storage=new Map(saved||[]);
  function el(s){if(!elements.has(s))elements.set(s,{innerHTML:'',textContent:'',hidden:true,disabled:false,focus(){},setAttribute(){},querySelectorAll(){return[];}});return elements.get(s);}
  const context=vm.createContext({console,document:{querySelector:el,querySelectorAll:()=>[],addEventListener:(n,f)=>events[n]=f},window:{scrollTo(){},addEventListener(){}},localStorage:{getItem:k=>{if(broken)throw Error('blocked');return storage.get(k)},setItem:(k,v)=>{if(broken)throw Error('blocked');storage.set(k,v)}},setTimeout:()=>0,clearTimeout(){}});
  vm.runInContext(code,context);
  return {run:s=>vm.runInContext(s,context),el,events,storage};
}
const {run,el,events,storage}=boot();
for(let p=0;p<7;p++){run(`navigate(${p})`);assert(el('#main').innerHTML.length>1000);}
let turns=6;
function trainClick(value){events.click({target:{closest:()=>({dataset:{train:value},disabled:false})}});}
function readyTrain(){events.change({target:{id:'spoken',checked:true,dataset:{}}});events.change({target:{id:'trainHeard',checked:true,dataset:{}}});}
for(const destination of [0,1])for(const type of ['single','return']){
 run('startScene(0)');
 for(let step=0;step<6;step++){
  assert.equal(run('turn'),step);assert.equal(run('canNext()'),false);
  trainClick('destination-0');assert.equal(run('actionDone'),false);
  readyTrain();
  if(step===0)trainClick('destination-'+destination);
  if(step===1)trainClick(type);
  if(step===2){trainClick('fare-999');assert.equal(run('canNext()'),false);trainClick('fare-'+run('trainPrice()'));}
  if(step===3){trainClick('reader');assert.equal(run('trainData.paid'),false);trainClick('card');assert.equal(run('canNext()'),false);trainClick('reader');assert.equal(run('trainData.paid'),true);assert(el('#arena').innerHTML.includes('printout'));}
  if(step===4){trainClick('time-10:13');assert.equal(run('canNext()'),false);trainClick('time-10:30');}
  if(step===5){trainClick('platform-3');assert.equal(run('canNext()'),false);trainClick('platform-4');assert(el('#arena').innerHTML.includes('train-person'));}
  assert.equal(run('canNext()'),true);run('nextTurn()');
 }
 assert.equal(run('finished'),true);assert.equal(run('trainData.type'),type);assert.equal(run('trainData.platform'),4);
 assert.equal(run('trainData.fare'),[[12,20],[8,14]][destination][type==='single'?0:1]);
}
for(let s=1;s<3;s++){
  run(`startScene(${s})`);
  const n=run('lessons[scene].turns.length');
  for(let t=0;t<n;t++){
    assert.equal(run('turn'),t);assert.equal(run('spoken'),false);assert.equal(run('canNext()'),false);
    run('nextTurn()');assert.equal(run('turn'),t);
    assert(el('#main').innerHTML.includes('<details class="reveal">'));
    assert(!el('#main').innerHTML.includes('<details class="reveal" open'));
    events.change({target:{id:'spoken',checked:true,dataset:{}}});
    if(run('!!lessons[scene].turns[turn].quiz')){
      run('choose((lessons[scene].turns[turn].quiz.correct+1)%3)');assert.equal(run('canNext()'),false);assert(el('#feedback').textContent.includes('再聽一次'));
      run('nextTurn()');assert.equal(run('turn'),t);
      run('choose(lessons[scene].turns[turn].quiz.correct)');
      if(s===2&&t===3){
        assert.equal(run('canNext()'),false);
        run('ride("bell")');assert.equal(run('bellRung'),false);
        run('ride("move");ride("move")');assert.equal(run('busStop'),2);
        run('ride("move")');assert.equal(run('busStop'),2);assert.equal(run('canNext()'),false);
        run('ride("bell");ride("move")');assert.equal(run('busStop'),3);
        assert(el('#arena').innerHTML.includes('STOP REQUESTED'));
      }
    }else{
      assert.equal(run('canNext()'),false);
      if(run('sceneActions[scene][turn].options.length')>1){
        run('interact((sceneActions[scene][turn].correct+1)%sceneActions[scene][turn].options.length)');
        assert.equal(run('canNext()'),false);
      }
      run('interact(sceneActions[scene][turn].correct)');
    }
    assert.equal(run('canNext()'),true);
    assert(el('#arena').innerHTML.includes('travel-map'));
    run('nextTurn()');turns++;
  }
  assert.equal(run('finished'),true);assert(run('state.complete').includes(s));
  run('nextTurn()');assert.equal(run('state.complete.length'),s+1);
}
run('startScene(0)');assert.equal(run('state.complete.length'),3);
assert.equal(run('turn'),0);assert.equal(run('choice'),-1);
events.input({target:{dataset:{field:'before'},value:'<img src=x onerror=alert(1)> & my answer'}});
run('navigate(5)');assert(el('#main').innerHTML.includes('&lt;img'));assert(!el('#main').innerHTML.includes('<img src=x'));
for(let p=0;p<3;p++)for(const r of ['A','B']){
  run(`page=4;pair=${p};role='${r}';render()`);assert(el('#main').innerHTML.includes(`ROLE ${r}`));
  if(r==='A')assert(!el('#main').innerHTML.includes(run('pairCards[pair].secret')));
}
for(const key of ['after','pairNote','homeNote'])events.input({target:{dataset:{field:key},value:'Test '+key}});
events.change({target:{id:'',dataset:{home:'1'},checked:true}});
run('state.ratings=[0,1,2];save()');
const loaded=boot([...storage]);assert.equal(loaded.run('state.before'),'<img src=x onerror=alert(1)> & my answer');assert.equal(loaded.run('state.complete.length'),3);assert.equal(loaded.run('state.home[1]'),true);
const output=run('exportText()');for(const label of ['火車／高鐵買票','捷運轉乘','公車上下車','Test after','Test pairNote','Test homeNote','1/3','能獨立完成'])assert(output.includes(label));
const bad=boot([['travel-lab-unit4-transit-v1','{"complete":[0,0,9,"1"],"ratings":[99,1,null],"before":8}']]);assert.equal(bad.run('state.complete.length'),1);assert.equal(bad.run('state.before'),'');assert.equal(bad.run('state.ratings[0]'),-1);
const malformed=boot([['travel-lab-unit4-transit-v1','{bad']]);assert.equal(malformed.el('#storageNotice').hidden,false);
const blocked=boot([],true);blocked.run('state.before="keep me";save()');assert(blocked.run('exportText()').includes('keep me'));assert.equal(blocked.el('#storageNotice').hidden,false);
run('speak("Hello")');assert(el('#toast').textContent.includes('逐字稿'));
for(const file of ['index.html','travel-english-unit4-transit.html'])for(const m of fs.readFileSync(file,'utf8').matchAll(/href="([^"#]+\.html)"/g))assert(fs.existsSync(m[1]));
console.log(`PASS: 7 pages, ${turns} conversation turns, speaking and listening gates, 6 role cards, persistence, escaped text, export contents, corrupt/blocked storage, speech fallback and local links.`);
function click(dataset){events.click({target:{closest:()=>({dataset,disabled:false})}});}
assert.equal(run('labels.length'),7);
run('navigate(3)');
for(let i=0;i<3;i++){
 click({mission:String(i)});
 const key=run('missions[mission].field');
 assert(el('#main').innerHTML.includes(`id="${key}"`));
 assert(!el('#main').innerHTML.includes('class="reveal" open'));
 events.input({target:{dataset:{field:key},value:'My '+key+' <answer>'}});
}
const reloaded=boot([...storage]);
for(const key of ['ticketNote','metroNote','busNote']){
 assert.equal(reloaded.run(`state.${key}`),'My '+key+' <answer>');
 assert(run('exportText()').includes('My '+key+' <answer>'));
}
click({mission:'0'});assert(el('#main').innerHTML.includes('&lt;answer&gt;'));
run('navigate(5)');assert(!el('#main').innerHTML.includes('data-home='));assert(el('#main').innerHTML.includes('id="after"'));
run('navigate(6)');assert(el('#main').innerHTML.includes('id="homeNote"'));assert(!el('#main').innerHTML.includes('id="after"'));
click({homeChoice:'2'});assert(el('#homeFeedback').textContent.includes('再聽一次'));
click({homeChoice:'0'});assert(el('#homeFeedback').textContent.includes('答對了'));
click({act:'home-listen'});assert(el('#toast').textContent.includes('逐字稿'));
for(let i=0;i<7;i++){
 run(`navigate(${i})`);
 for(const match of el('#main').innerHTML.matchAll(/data-page="(\d+)"/g))assert(Number(match[1])<7);
 assert.equal((el('#nav').innerHTML.match(/data-page=/g)||[]).length,7);
}
run('navigate(99)');assert.equal(run('page'),6);run('navigate(-1)');assert.equal(run('page'),0);
console.log('PASS: three independent drafts, saved/escaped/exported answers, separate review and homework, listening retries, seven navigation entries and valid page links.');
run('startScene(1);interact(0)');assert.equal(run('actionDone'),false);
events.change({target:{id:'spoken',checked:true,dataset:{}}});
click({object:'0'});assert.equal(run('actionDone'),true);
assert(el('#arena').innerHTML.includes('METRO MAP'));
events.change({target:{id:'spoken',checked:false,dataset:{}}});assert.equal(run('canNext()'),false);
events.change({target:{id:'spoken',checked:true,dataset:{}}});
click({act:'next'});assert.equal(run('actionDone'),false);assert.equal(run('turn'),1);
click({act:'back'});assert.equal(run('turn'),0);assert.equal(run('actionDone'),false);
run('startScene(2);turn=3;spoken=true;choose(0);ride("move");ride("move");ride("bell")');
click({choice:'1'});assert.equal(run('busStop'),0);assert.equal(run('bellRung'),false);assert.equal(run('canNext()'),false);
click({scene:'1'});assert.equal(run('busStop'),0);assert.equal(run('actionDone'),false);
console.log('PASS: physical scene actions, wrong-choice retry, speaking guard, back/restart reset, bus station count, stop-bell timing and quiz reselection.');
run('startScene(0);trainData={destination:"Central Station",type:"return",fare:20,paid:true,time:"10:30",platform:4};turn=3');
click({act:'back'});assert.equal(run('turn'),2);assert.equal(run('trainData.fare'),null);assert.equal(run('trainData.paid'),false);assert.equal(run('trainData.time'),null);assert.equal(run('trainData.platform'),null);
assert.equal(run('trainData.type'),'return');assert.equal(run('trainHeard'),false);
click({act:'back'});readyTrain();trainClick('single');assert.equal(run('trainPrice()'),12);assert.equal(run('trainData.fare'),null);
run('startScene(0)');assert.equal(run('trainData.destination'),null);assert.equal(run('trainCard'),false);
console.log('PASS: four destination/ticket combinations, separate speech/reply guards, two-action payment, departure/platform retries, and dependent data reset on back/restart.');
