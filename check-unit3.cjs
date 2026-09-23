const fs = require('fs'), vm = require('vm'), assert = require('assert/strict');
const html = fs.readFileSync('travel-english-unit3-airport.html', 'utf8');
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
let turns=0;
for(let s=0;s<3;s++){
  run(`startScene(${s})`);
  const n=run('lessons[scene].turns.length');
  for(let t=0;t<n;t++){
    assert.equal(run('turn'),t);assert.equal(run('spoken'),false);assert.equal(run('canNext()'),false);
    run('nextTurn()');assert.equal(run('turn'),t);
    assert(el('#main').innerHTML.includes('<details class="reveal">'));
    assert(!el('#main').innerHTML.includes('<details class="reveal" open'));
    run('choose(0)');assert.equal(run('choice'),-1);
    events.change({target:{id:'spoken',checked:true,dataset:{}}});
    assert.equal(run('spoken'),false);
    events.change({target:{id:'heard',checked:true,dataset:{}}});
    events.change({target:{id:'spoken',checked:true,dataset:{}}});
    run('choose((airportStep().correct+1)%airportStep().options.length)');
    assert.equal(run('canNext()'),false);assert(el('#airportScene').innerHTML.includes('再試一次'));
    run('nextTurn()');assert.equal(run('turn'),t);
    run('choose(airportStep().correct)');assert.equal(run('canNext()'),true);
    assert(el('#airportScene').innerHTML.includes(run('airportStep().result')));
    events.change({target:{id:'heard',checked:false,dataset:{}}});
    assert.equal(run('spoken'),false);assert.equal(run('choice'),-1);assert.equal(run('canNext()'),false);
    assert.equal(run('airportHistory.length'),t);
    events.change({target:{id:'heard',checked:true,dataset:{}}});
    events.change({target:{id:'spoken',checked:true,dataset:{}}});
    run('choose(airportStep().correct)');
    run('nextTurn()');turns++;
  }
  assert.equal(run('finished'),true);assert(run('state.complete').includes(s));
  run('nextTurn()');assert.equal(run('state.complete.length'),s+1);
}
run('startScene(0)');assert.equal(run('state.complete.length'),3);
assert.equal(run('turn'),0);assert.equal(run('choice'),-1);
run('airportConfirm("heard",true);airportConfirm("spoken",true);choose(0);nextTurn();airportConfirm("heard",true);airportConfirm("spoken",true);choose(0);airportBack()');
assert.equal(run('turn'),0);assert.equal(run('airportHistory.length'),0);assert.equal(run('heard'),false);
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
const output=run('exportText()');for(const label of ['機場報到','入境查驗','海關申報','Test after','Test pairNote','Test homeNote','1/3','能獨立完成'])assert(output.includes(label));
const bad=boot([['travel-lab-unit3-airport-v1','{"complete":[0,0,9,"1"],"ratings":[99,1,null],"before":8}']]);assert.equal(bad.run('state.complete.length'),1);assert.equal(bad.run('state.before'),'');assert.equal(bad.run('state.ratings[0]'),-1);
const malformed=boot([['travel-lab-unit3-airport-v1','{bad']]);assert.equal(malformed.el('#storageNotice').hidden,false);
const blocked=boot([],true);blocked.run('state.before="keep me";save()');assert(blocked.run('exportText()').includes('keep me'));assert.equal(blocked.el('#storageNotice').hidden,false);
run('speak("Hello")');assert(el('#toast').textContent.includes('逐字稿'));
for(const file of ['index.html','travel-english-unit3-airport.html'])for(const m of fs.readFileSync(file,'utf8').matchAll(/href="([^"#]+\.html)"/g))assert(fs.existsSync(m[1]));
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
for(const key of ['checkinNote','entryNote','customsNote']){
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
