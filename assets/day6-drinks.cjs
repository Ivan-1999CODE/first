// Task C now teaches drink preferences. New IDs keep dessert answers separate.
const context = '你已點好一杯茶，店員正在準備，冰塊和糖都還沒加。這家店可以調整冰塊與加糖量。你想要不加冰、不加糖；先回答冰塊需求，再回答糖量需求。';
const alternate = '換一次練習：你已點好一杯可調整冰塊與加糖量的茶，這次想要少冰、少糖。店員還沒加冰或糖，依序說清楚兩個需求。';
function steps(less) {
 return [
  {label:less?'要求少冰':'要求不加冰',line:'Would you like ice?',zh:'要加冰嗎？',answer:less?'Less ice, please.':'No ice, please.',answerZh:less?'請少放一點冰。':'請不要加冰。',words:less?'less / ice / please':'no / ice / please',objects:[['◻','不加冰'],['◻','少冰']],valid:[less?1:0],task:less?'茶還沒加冰。你想要一點冰，但比一般少，請告訴店員。':'茶還沒加冰。你不想加任何冰塊，請告訴店員。'},
  {label:less?'要求少糖':'要求不加糖',line:'Would you like sugar?',zh:'要加糖嗎？',answer:less?'Less sugar, please.':'No sugar, please.',answerZh:less?'請少放一點糖。':'請不要加糖。',words:less?'less / sugar / please':'no / sugar / please',objects:[['▤','不加糖'],['▤','少糖']],valid:[less?1:0],task:less?'冰塊需求已說清楚。茶還沒加糖，你想加一點糖，但比一般少，請告訴店員。':'冰塊需求已說清楚。茶還沒加糖，你不想加糖，請告訴店員。'}
 ].map((s,i)=>({...s,id:(less?'less':'no')+'-'+i,askFirst:false,role:'店員',practicePrompt:s.task,effect:'✓ 已確認這一項飲料需求。',...(i===0?{sceneTitle:less?'少冰、少糖':'不加冰、不加糖',sceneContext:less?alternate:context}:{})}));
}
module.exports = function replaceDrinkTask(tasks) {
 return tasks.map(task=>task.key!=='merged-day6-dessert-and-coffee'?task:{
  id:'DRINKS',key:'drink-ice-and-sugar',name:'說清楚冰塊與糖量需求',isMerged:true,
  sourceIds:task.sourceIds,context,goal:context,role:'店員',icon:'🥤',
  steps:steps(false),variationMode:'core',variation:{task:alternate,steps:steps(true)},
  words:[['ice','冰塊'],['sugar','糖'],['no ice','不加冰'],['less ice','少冰'],['no sugar','不加糖'],['less sugar','少糖']],
  coreNote:'先說冰塊，再說糖量；每次只用符合這杯飲料需求的回答。No sugar 指不要另外加糖；這裡的茶尚未加糖。',
  changeNote:'任務 C 改為飲料需求：四種短答先教，再分兩個情境練習，不再使用甜點與咖啡調配內容。',
  homeQuizSteps:steps(false).map((s,i)=>({...s,distractor:i?'要加冰嗎？':'要加糖嗎？'}))
 });
};
