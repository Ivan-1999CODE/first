// The pilot reuses A/B/C from the current curriculum. It never changes their
// identifiers, exercises, or saved records. Letters are presentation labels.
module.exports = function hotelIntegration(data) {
 const clone = value => JSON.parse(JSON.stringify(value));
 const selected = ['A', 'B', 'C'].map(label => data.rounds.find(r => (r.displayLabel || r.id) === label));
 if (selected.some(r => !r)) throw Error('Hotel integration requires tasks A/B/C.');
 const keys = ['checkin', 'name', 'passport', 'nights', 'breakfast', 'checkout', 'elevator'];
 const stages = ['提出入住', '確認訂房', '出示證件', '確認住宿', '住宿資訊', '住宿資訊', '準備上樓'];
 const steps = selected.flatMap(r => data.flows[r.flowIds[0]].steps.map(s => ({...clone(s), sourceId:r.id, sourceLabel:r.displayLabel || r.id})));
 if (steps.length !== keys.length) throw Error('Review hotel integration after changing A/B/C.');
 steps.forEach((s, i) => {
  s.key = keys[i]; s.stage = stages[i];
  delete s.sceneTitle; delete s.sceneContext;
 });
 const alternatives = selected.flatMap(r => [r.variation, ...(r.additionalVariations || [])].filter(Boolean).flatMap(v => v.steps));
 const find = (field, text) => {
  const s = alternatives.find(s => s[field] === text);
  if (!s) throw Error('Missing taught hotel variation: ' + text);
  return clone(s);
 };
 const configs = [
  {id:'original', label:'原訂房', name:'Alex Chen', nights:2, checkout:11, elevator:'左', change:'先完成原訂房的一整段入住。'},
  {id:'name', label:'換訂房姓名', name:'Jamie Lin', nights:2, checkout:11, elevator:'左', change:'訂房姓名改成 Jamie Lin，其他條件相同。', key:'name', replacement:find('answer','I have a reservation under Jamie Lin.')},
  {id:'nights', label:'改住 3 晚', name:'Alex Chen', nights:3, checkout:11, elevator:'左', change:'住宿改成 3 晚，姓名與飯店資訊相同。', key:'nights', replacement:find('answer','I’m staying for three nights.')},
  {id:'checkout', label:'退房改 12 點', name:'Alex Chen', nights:2, checkout:12, elevator:'左', change:'飯店退房時間改成 12 點，其他條件相同。你的問法不變，聽清楚新的時間。', key:'checkout', replacement:find('line','Check-out is at twelve.')},
  {id:'elevator', label:'電梯在右邊', name:'Alex Chen', nights:2, checkout:11, elevator:'右', change:'電梯改在右邊，其他條件相同。問法不變，聽完再決定往哪裡走。', key:'elevator', replacement:find('line','On your right.')}
 ];
 const scenarios = configs.map(c => ({
  ...c, replacement:undefined,
  steps:steps.map(s => c.key === s.key ? {...s, ...c.replacement, key:s.key, stage:s.stage, sourceId:s.sourceId, sourceLabel:s.sourceLabel} : clone(s))
 }));
 for(const c of scenarios)for(const s of c.steps){
  if(s.key==='nights')s.choiceVisuals=s.objects.map(o=>({type:'nights',count:Number(o[1].match(/\d+/)?.[0])||(/三/.test(o[1])?3:2)}));
  if(s.key==='checkout')s.choicePrompt='在時鐘上選出櫃檯確認的退房時間。';
  if(s.key==='elevator')s.choicePrompt='拿好行李，往櫃檯剛指示的電梯走。';
  s.choiceReview={...s.choiceReview,variant:c.id};
 }
 const task = '你抵達飯店，訂房姓名是 Alex Chen，住 2 晚，護照已準備好。請完成入住，並問清楚早餐、退房時間與電梯位置。';
 return {
  version:3, storageKey:'travel-lab-en-day8-integrated-checkin-v1',
  title:'完成飯店入住', sourceIds:selected.map(r => r.id), sourceLabels:['A','B','C'],
  sections:['先試完整情境','整理聽說句子','連起來辦入住','看情境，自己選用','和老師完整接話','看看整體進步','課後再用一次'],
  task, steps, scenarios, sayPrompts:selected.flatMap(r=>clone(r.sayPrompts)),retiredSayPrompts:selected.flatMap(r=>clone(r.retiredSayPrompts||[])),
  practice:require('./day8-integrated-practice.cjs')({steps,scenarios}),
  extended:require('./day8-complete-data.cjs')(data),
  goals:steps.map(s => ({id:s.key,text:({breakfast:'確認是否包含早餐',checkout:'取得正確退房時間',elevator:'確認電梯位置'})[s.key] || s.label})),
  skills:[
   {id:'start',text:'我能提出入住需求，說清楚姓名與住宿晚數。'},
   {id:'respond',text:'我能聽懂櫃檯的要求，接話並出示護照。'},
   {id:'information',text:'我能問清楚早餐、退房時間與電梯位置。'},
   {id:'connect',text:'我能連續完成入住，依對方已說的資訊調整接話。'}
  ],
  alternateQuestions:[
   {key:'name',line:'Could I have your name, please?',zh:'請問你的名字？'},
   {key:'passport',line:'Your passport, please.',zh:'請出示護照。'},
   {key:'nights',line:'How long will you be staying?',zh:'你會住多久？'}
  ],
  quizzes:[
   {id:'checkout',line:'Check-out is at twelve.',zh:'12 點退房。',question:'退房當天最晚幾點離開房間？',options:['上午 11 點','中午 12 點'],correct:1,why:'twelve 是 12；這次要記住中午 12 點。'},
   {id:'elevator',line:'On your right.',zh:'在你的右邊。',question:'拿到房卡後，要往哪邊找電梯？',options:['往右邊','往左邊'],correct:0,why:'right 是右邊，依這次聽到的方向走。'}
  ]
 };
};
