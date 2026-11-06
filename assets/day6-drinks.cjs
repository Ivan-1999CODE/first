// Task C now teaches drink preferences. New IDs keep dessert answers separate.
const context = '你已點好雞肉三明治，店員問要不要升級成含飲料的套餐。你想升級，飲料選茶。這家店的茶可以調整冰塊與加糖量；選好茶後，再說不加冰、不加糖。';
const alternate = '換一次練習：你已點好雞肉三明治，要升級成含飲料的套餐，飲料選茶。這次茶要少冰、少糖；先答應升級並選茶，再依序說清楚冰塊與糖量。';
const ordering = [
 {id:'combo',recordIndex:2,label:'升級成套餐',line:'Would you like to make it a combo with a drink?',zh:'要升級成含飲料的套餐嗎？',answer:'Yes, please.',answerZh:'好的，謝謝。',words:'yes / please',objects:[['▣','雞肉三明治加一杯飲料'],['▣','只有雞肉三明治']],valid:[0],task:'雞肉三明治已點好。店員詢問是否升級成含飲料的套餐，你想升級，請回應。',effect:'✓ 已選擇主餐加飲料的套餐；接著選飲料。'},
 {id:'drink',recordIndex:3,label:'選套餐飲料',line:'What would you like to drink?',zh:'你想喝什麼飲料？',answer:'I’d like tea, please.',answerZh:'我想要茶，謝謝。',words:'like / tea / please',objects:[['▣','拿茶'],['▣','拿水']],valid:[0],task:'你已答應升級套餐。店員詢問飲料，你想喝茶，請告訴他。',effect:'✓ 套餐飲料已選茶；接著確認冰塊與糖量。'}
];
function steps(less) {
 return [
  ...ordering,
  {label:less?'要求少冰':'要求不加冰',line:'Would you like ice?',zh:'要加冰嗎？',answer:less?'Less ice, please.':'No ice, please.',answerZh:less?'請少放一點冰。':'請不要加冰。',words:less?'less / ice / please':'no / ice / please',objects:[['◻','不加冰'],['◻','少冰']],valid:[less?1:0],task:less?'茶還沒加冰。你想要一點冰，但比一般少，請告訴店員。':'茶還沒加冰。你不想加任何冰塊，請告訴店員。'},
  {label:less?'要求少糖':'要求不加糖',line:'Would you like sugar?',zh:'要加糖嗎？',answer:less?'Less sugar, please.':'No sugar, please.',answerZh:less?'請少放一點糖。':'請不要加糖。',words:less?'less / sugar / please':'no / sugar / please',objects:[['▤','不加糖'],['▤','少糖']],valid:[less?1:0],task:less?'冰塊需求已說清楚。茶還沒加糖，你想加一點糖，但比一般少，請告訴店員。':'冰塊需求已說清楚。茶還沒加糖，你不想加糖，請告訴店員。'}
 ].map((s,i)=>({...s,id:s.id||(less?'less':'no')+'-'+(i-2),recordIndex:s.recordIndex??(i-2),askFirst:false,role:'店員',practicePrompt:s.task,effect:s.effect||'✓ 已確認這一項飲料需求。',...(i===0?{sceneTitle:less?'套餐飲料：少冰、少糖':'套餐飲料：不加冰、不加糖',sceneContext:less?alternate:context}:{})}));
}
module.exports = function replaceDrinkTask(tasks) {
 return tasks.map(task=>task.key!=='merged-day6-dessert-and-coffee'?task:{
  id:'DRINKS',key:'drink-ice-and-sugar',name:'升級套餐，選飲料與冰糖量',isMerged:true,
  sourceIds:task.sourceIds,context,goal:context,role:'店員',icon:'🥤',
  steps:steps(false),variationMode:'core',variation:{task:alternate,steps:steps(true)},
  words:[['combo','套餐'],['drink','飲料'],['tea','茶'],['ice','冰塊'],['sugar','糖'],['no ice','不加冰'],['less ice','少冰'],['no sugar','不加糖'],['less sugar','少糖']],
  coreNote:'接續已點好的雞肉三明治：答應升級套餐、選茶，再說冰塊與糖量。兩種冰糖需求分次練。No sugar 指不要另外加糖；這裡的茶尚未加糖。',
  changeNote:'在原有冰糖需求前補上升級套餐與選飲料的問答；個別任務和 A+C+F 使用相同順序，保留原有冰糖題目與作答識別碼。',
  homeQuizSteps:steps(false).sort((a,b)=>a.recordIndex-b.recordIndex).map(s=>({...s,distractor:s.recordIndex===0?'要加糖嗎？':s.recordIndex===1?'要加冰嗎？':s.recordIndex===2?'要再點一份三明治嗎？':'你想吃什麼主餐？'}))
 });
};
