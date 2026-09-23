const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const files=['travel-english-unit3-airport.html','travel-english-unit4-transit.html','travel-english-unit5-getting-around.html','travel-english-unit6-ordering.html'];
for(const [i,file] of files.entries()){
 const elements=new Map(),events={},spoken=[],writes=[];let stopped=0,focused='';
 const el=s=>{if(!elements.has(s))elements.set(s,{innerHTML:'',setAttribute(){},focus(){focused=s;},querySelectorAll(){return[];}});return elements.get(s);};
 const speech={cancel(){stopped++;},getVoices(){return[];},speak(u){spoken.push(u);}};
 const context=vm.createContext({console,document:{querySelector:el,querySelectorAll:()=>[],addEventListener:(event,fn)=>events[event]=fn},window:{scrollTo(){},addEventListener(){},speechSynthesis:speech},speechSynthesis:speech,SpeechSynthesisUtterance:function(text){this.text=text;},localStorage:{getItem:()=>null,setItem:(...args)=>writes.push(args)},setTimeout:()=>0,clearTimeout(){}});
 const html=fs.readFileSync(file,'utf8');
 vm.runInContext(html.match(/<script>([\s\S]*?)<\/script>/)[1],context);
 const run=s=>vm.runInContext(s,context),main=()=>el('#main').innerHTML;
 const click=dataset=>events.click({target:{closest:()=>({dataset,disabled:false})}});
 run('state.before="Keep my first answer";navigate(1)');
 const baselineWrites=writes.length;
 assert(main().includes('data-workshop-mode="library" aria-pressed="true"'));
 assert(main().includes('我想怎麼說'));
 assert.equal((main().match(/class="phrase"/g)||[]).length,run('phrases.length'));
 assert.equal((main().match(/<summary>看中文意思<\/summary>/g)||[]).length,run('phrases.length'));
 click({workshopMode:'reply'});
 assert.equal(focused,'[data-workshop-mode="reply"]');
 const count=run('phraseWorkshopConfig.replies.length');
 const ids=run('phraseWorkshopConfig.replies.map(q=>q.id)');assert.equal(new Set(ids).size,count);
 for(let n=0;n<count;n++){
  if(n)click({workshopReply:String(n)});
  assert.equal((main().match(/class="panel workshop-card"/g)||[]).length,1);
  assert(main().includes(`${n+1} / ${count}`));
  assert(!/<details[^>]*\sopen(?:\s|>)/.test(main()));
  assert(!main().includes('<textarea'));
  assert(main().includes('<summary>查看對方的英文與中文</summary>'));
  assert(main().includes('<summary>需要一點關鍵字</summary>'));
  const q=run(`phraseWorkshopConfig.replies[${n}]`);
  for(const key of ['id','name','role','en','zh','task','hint','answer','change','changeHint','changeAnswer'])assert(q[key],`${i+3}/${n}/${key}`);
  click({workshopSay:q.en,workshopSlow:'true'});assert.equal(spoken.at(-1).text,q.en);assert.equal(spoken.at(-1).rate,.7);
  click({workshopSay:q.answer});assert.equal(spoken.at(-1).text,q.answer);assert.equal(spoken.at(-1).rate,.9);
  if(n<count-1)assert(main().includes(`data-workshop-reply="${n+1}"`));
 }
 assert(main().includes('進入互動流程'));
 const last=main();click({workshopReply:String(count)});assert.equal(main(),last);
 click({workshopReply:'0'});assert(main().includes('data-workshop-reply="-1" disabled'));assert.equal(focused,'#workshopHeading');
 const first=main();click({workshopReply:'-1'});assert.equal(main(),first);
 // A changed dataset length must update counters and the last-group navigation.
 run('phraseWorkshopConfig.replies.push({...phraseWorkshopConfig.replies[0],id:"extra"})');
 click({workshopReply:String(count)});assert(main().includes(`${count+1} / ${count+1}`));assert(main().includes('進入互動流程'));
 const stopsBefore=stopped;click({workshopMode:'library'});assert(stopped>stopsBefore);
 assert(!main().includes('class="panel workshop-card"'));
 assert.equal(run('state.before'),'Keep my first answer');assert.equal(writes.length,baselineWrites);
 click({page:'2'});assert.equal(run('page'),2);
 assert(!main().includes('class="workshop-modes"'));
 if(i>=2)assert(html.includes(fs.readFileSync(`assets/day${i+3}.js`,'utf8')));
 console.log(`PASS Day ${i+3}: ${count} replies, both modes, collapsed hints, bounded navigation, dynamic count, normal/slow audio, focus, preserved answers, embedded source.`);
}
