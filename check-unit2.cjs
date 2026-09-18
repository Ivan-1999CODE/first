const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const html=fs.readFileSync('travel-english-unit2-shopping.html','utf8');
const code=html.match(/<script>([\s\S]*?)<\/script>/)[1];
const elements=new Map(),events={},storage=new Map();
storage.set('travel-lab-unit2-v1',JSON.stringify({before:'My original answer',ratings:[2,1,2,0],home:[true,true,false]}));
function element(s){if(!elements.has(s))elements.set(s,{innerHTML:'',hidden:true,focus(){},addEventListener(){},setAttribute(){}});return elements.get(s);}
const context=vm.createContext({console,document:{querySelector:element,addEventListener:(name,fn)=>events[name]=fn},window:{scrollTo(){}},localStorage:{getItem:k=>storage.get(k),setItem:(k,v)=>storage.set(k,v)},setTimeout:()=>0,clearTimeout(){}});
vm.runInContext(code,context);
const run=s=>vm.runInContext(s,context);
assert.equal(run('state.before'),'My original answer');
assert.equal(run('state.ratings[0]'),-1);assert.equal(run('state.ratings[1]'),1);
assert.equal(run('state.home[0]'),false);assert.equal(run('state.home[1]'),true);
run('save()');assert(storage.has('travel-lab-unit2-v1'));assert(storage.has('travel-lab-unit2-v2'));
for(let p=0;p<7;p++){run(`page=${p};render()`);assert(element('#main').innerHTML.length>500);assert(!/導航|聽路線|路人|購物街地圖/.test(element('#main').innerHTML));}
const graph=JSON.parse(run('JSON.stringify(clothingScenesNow())'));
const seen=new Set();function visit(id){if(seen.has(id))return;seen.add(id);assert(graph[id]);graph[id].actions.forEach(a=>visit(a[1]));}visit('welcome');assert.equal(seen.size,Object.keys(graph).length);
let transitions=0;
for(const [id,scene] of Object.entries(graph)){
 run(`page=2;clothingScene=${JSON.stringify(id)};clothingText=false;clothingHint=false;render()`);
 assert(!element('#main').innerHTML.includes('>'+scene.line+'</p>'));
 for(let i=0;i<scene.actions.length;i++){
  run(`clothingScene=${JSON.stringify(id)};clothingText=true;clothingHint=true;clothingSpoken=true;clothingAction(${i})`);
  assert.equal(run('clothingScene'),scene.actions[i][1]);assert.equal(run('clothingText'),false);assert.equal(run('clothingHint'),false);transitions++;
 }
}
function click(dataset){if(dataset.clothing!==undefined)run('clothingSpoken=true');events.click({target:{closest:()=>({dataset,disabled:false,closest:()=>null})}});}
run('page=2');click({act:'clothing-reset'});assert.equal(run('clothingScene'),'welcome');assert.equal(run('clothingHistory.length'),0);
click({act:'clothing-text'});assert(element('#main').innerHTML.includes('Hello! Can I help you?'));
click({act:'clothing-hint'});assert(element('#main').innerHTML.includes('I’m looking for… / I’d like the…'));
click({clothing:'0'});assert.equal(run('clothingScene'),'size');
for(let i=0;i<4;i++)for(const role of ['A','B']){run(`page=4;shop=${i};role='${role}';render()`);assert(element('#main').innerHTML.includes(run(`shops[${i}].zh`)));}
run('page=6;homeText=true;render()');assert(element('#main').innerHTML.includes('We have medium in black, but not in blue.'));
console.log(`PASS: 7 pages, ${seen.size} reachable scenes, ${transitions} transitions, controls, 8 role cards, homework and legacy answer migration.`);

for(const [colorIndex,color] of ['blue','pink','green'].entries())for(const [sizeIndex,size] of ['S','M','L'].entries()){
 run('page=2');click({act:'clothing-reset'});assert.equal((element('#main').innerHTML.match(/class="hanging-shirt /g)||[]).length,3);
 click({clothing:String(colorIndex)});assert.equal(run('clothingColor'),color);assert.equal(run('clothingScene'),'size');
 click({clothing:String(sizeIndex)});assert.equal(run('clothingSize'),size);assert.equal(run('clothingScene'),'permission');
 assert(run('clothingScenesNow().permission.line').includes(color));assert(run('clothingScenesNow().permission.line').includes(run('sizeWords[clothingSize]')));
 click({clothing:'0'});assert.equal(run('clothingScene'),'location');click({clothing:'0'});assert.equal(run('clothingScene'),'room');assert(element('#main').innerHTML.includes('room-ready'));
 click({clothing:'0'});assert.equal(run('clothingScene'),'fit');assert(element('#main').innerHTML.includes('正在試穿'));
 click({clothing:'1'});assert.equal(run('clothingScene'),'size');click({clothing:'1'});assert.equal(run('clothingSize'),'M');
 for(const i of [0,0,0,0,0,0,0])click({clothing:String(i)});assert.equal(run('clothingScene'),'done');
}
console.log('PASS: all 9 color/size combinations, fitting-room sequence, resizing and checkout.');

run("page=2;clothingScene='welcome';clothingSpoken=false;clothingHint=false;clothingAnswer=false;render()");
assert(element('#main').innerHTML.indexOf('card conversation')<element('#main').innerHTML.indexOf('class="boutique"'));
run('clothingAction(0)');assert.equal(run('clothingScene'),'welcome');
assert(!/data-clothing="[0-9]+"/.test(element('#main').innerHTML));
assert(!code.includes('window.confirm'));
click({act:'clothing-answer'});assert.equal(run('clothingConfirm'),false);assert.equal(run('clothingAnswer'),false);
click({act:'clothing-confirm-answer'});assert.equal(run('clothingAnswer'),false);
click({act:'clothing-hint'});click({act:'clothing-answer'});assert.equal(run('clothingConfirm'),true);assert.equal(run('clothingAnswer'),false);assert(element('#main').innerHTML.includes('真的要看解答嗎？'));
click({act:'clothing-cancel-answer'});assert.equal(run('clothingConfirm'),false);assert.equal(run('clothingAnswer'),false);
click({act:'clothing-answer'});click({act:'clothing-confirm-answer'});assert.equal(run('clothingConfirm'),false);assert.equal(run('clothingAnswer'),true);assert(element('#main').innerHTML.includes('I’d like the blue T-shirt.'));
click({act:'clothing-spoken'});assert.equal(run('clothingSpoken'),true);assert(element('#main').innerHTML.includes('data-clothing="0"'));
run('clothingAction(0)');assert.equal(run('clothingScene'),'size');assert.equal(run('clothingSpoken'),false);assert.equal(run('clothingAnswer'),false);assert.equal(run('clothingHint'),false);
for(const id of Object.keys(graph)){run('clothingScene='+JSON.stringify(id));if(graph[id].actions.length)assert(run('clothingSuggestions().length')>0);}
click({act:'clothing-reset'});assert.equal(run('clothingSpoken'),false);assert.equal(run('clothingAnswer'),false);
console.log('PASS: conversation first, speaking gate, answer confirmation/cancel, contextual suggestions and per-turn reset.');

run('page=1;render()');assert(element('#main').innerHTML.includes('I’d like the blue T-shirt.'));assert(element('#main').innerHTML.includes('I would like'));console.log('PASS: styled inline confirmation, cancel/confirm guards, and shopping phrase with pronunciation control.');

run("page=4;role='B';resetClerk()");
const played=[];context.Audio=function(src){this.src=src;this.pause=()=>{};this.play=()=>{played.push(src);return Promise.resolve();};};
for(const [i,id] of ['postcard','cap','cup','hat','tshirt','shoes'].entries()){
 assert.equal(run('clerkRound'),i);run('selectClerkProduct('+JSON.stringify(id)+')');assert.equal(run('clerkStage'),'request');
 click({act:'clerk-listen'});assert.equal(played.at(-1),'assets/customer-audio/'+id+'.wav');
 run('selectClerkProduct('+JSON.stringify(id==='cap'?'hat':'cap')+')');assert.equal(run('clerkStage'),'request');assert(run('clerkFeedback').includes('不同'));
 run('selectClerkProduct('+JSON.stringify(id)+')');assert.equal(run('clerkStage'),'price');
 click({act:'clerk-complete'});assert.equal(run('clerkStage'),'price');click({act:'clerk-spoken'});assert.equal(run('clerkSpoken'),false);
 click({act:'clerk-listen'});assert.equal(played.at(-1),'assets/customer-audio/'+(id==='shoes'?'prices':'price')+'.wav');
 click({act:'clerk-spoken'});click({act:'clerk-complete'});assert.equal(run('clerkStage'),'done');assert(element('#main').innerHTML.includes(id==='shoes'?'They’re twenty dollars.':'It’s '));click({act:'clerk-next'});
}
assert.equal(run('clerkRound'),0);assert.equal(run('clerkHeard'),false);
for(const name of ['postcard','cap','cup','hat','tshirt','shoes','price','prices']){
 const wav=fs.readFileSync('assets/customer-audio/'+name+'.wav');assert.equal(wav.toString('ascii',0,4),'RIFF');assert.equal(wav.toString('ascii',8,12),'WAVE');let data=null;for(let off=12;off+8<=wav.length;){const len=wav.readUInt32LE(off+4);if(wav.toString('ascii',off,off+4)==='data'){data=wav.subarray(off+8,off+8+len);break;}off+=8+len+(len%2);}assert(data&&data.length>10000);assert(data.some(x=>x!==0));
}
console.log('PASS: 6 customer rounds, wrong-item feedback, price gate, singular/plural speech, audio paths and 8 nonempty WAV files.');
