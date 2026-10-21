// Apply the approved Day 3/4 changes without mutating the source task bank.
const clone = value => JSON.parse(JSON.stringify(value));
const objects = (...labels) => labels.map(label => ['▣', label]);

function findTask(tasks, key) {
 const task = tasks.find(item => item.key === key);
 if (!task) throw new Error(`Approved Day 3/4 edits: missing task ${key}`);
 return task;
}

function group(tasks, keys, chapter) {
 keys.forEach(key => { findTask(tasks, key).chapter = {...chapter}; });
}

function editDay3(tasks) {
 group(tasks, ['check-in-and-bags', 'seat-choice'], {
  id: 'day3-check-in', name: '報到、行李與座位', order: 1,
  description: '先練報到與行李，再練座位選擇。兩小輪各自學熟後，再接成一段報到對話。'
 });
 group(tasks, ['gate-and-repeat'], {
  id: 'day3-gate', name: '確認登機門', order: 2,
  description: '先問登機門，沒聽清楚時再請地勤重說同一個號碼。'
 });
 group(tasks, ['visit-purpose-and-days', 'hotel-information'], {
  id: 'day3-entry', name: '入境：目的、天數與住宿', order: 3,
  description: '先回答旅行目的與天數，再回答住宿地點。兩小輪各自學熟後，再接成一段入境問答。'
 });
 group(tasks, ['food-and-declaration'], {
  id: 'day3-customs', name: '食物與申報', order: 4,
  description: '依練習情境如實說明攜帶的食物，再詢問是否需要申報。'
 });

 const seat = findTask(tasks, 'seat-choice');
 seat.variationMode = 'core';
 seat.coreNote = '靠走道與靠窗兩個回答都先學、都要練。每次只按情境選一個回答，不把兩個座位一起要求。';
 seat.changeNote = '與報到、行李合為同一章，保留獨立小輪；把原有靠窗回答移入核心，和靠走道成對練習，沒有刪除原說法。';
 return tasks;
}

function editDay4(tasks) {
 const ticket = findTask(tasks, 'ticket-and-type');
 ticket.variationMode = 'core';
 ticket.coreNote = '單程與來回兩個回答都先學、都要練；每次依票種選一個。加上買票需求，共 3 個不同說法，每次對話說 2 句。';
 ticket.changeNote = '保留買票需求，將原有 Return, please. 移入核心，與 Single, please. 成對練習；每次仍先說需求，再回答票種。';
 ticket.steps[1].label = '選單程票';
 ticket.variation.steps[1].label = '選來回票';

 const off = findTask(tasks, 'get-off-and-confirm');
 const originalStop = off.steps.find(step => step.id === 'stop');
 const originalConfirm = off.steps.find(step => step.id === 'confirm');
 if (!originalStop || !originalConfirm) throw new Error('Approved Day 4 edits: missing stop/confirm step');

 off.name = '確認或更正目的地，再問下車站';
 off.context = '你已搭上車，要去 River Market。司機先向你核對下車目的地，這次說的是正確地點；先回答沒錯，再請司機說清楚應在哪一站下車。';
 off.variationMode = 'core';
 off.coreNote = '肯定與否定更正都先學、都要練。司機說對目的地時回答 Yes；說錯時回答 No 並說出正確目的地，再用同一句問下車站。共 3 個不同說法，每次對話說 2 句。';
 off.changeNote = '保留 Yes, that’s right. 和 Where should I get off?，新增否定更正句「No, I want to go to Central Station.」。兩個情境都改為先確認或更正，再問下車站；否定情境中的司機仍誤問 River Market，不把正確的 Central Station 確認句硬接 No。';
 off.words = [
  ['get off', '下車'], ['River Market', '河畔市集'], ['Central Station', '中央車站'],
  ['that’s right', '沒錯'], ['no', '不是'], ['want to go to', '想去']
 ];

 off.steps = [
  {
   ...originalConfirm,
   label: '確認目的地',
   line: 'Are you getting off at River Market?', zh: '您要在河畔市集下車嗎？',
   answer: 'Yes, that’s right.', answerZh: '對，沒錯。',
   task: '你要去 River Market，司機確認的地點正確，回答沒錯。',
   words: 'yes / right', askFirst: false,
   objects: objects('確認要去 River Market', '更正：要去 Central Station'), valid: [0],
   effect: '✓ 已確認目的地是 River Market；接著問清楚下車站。'
  },
  {
   ...originalStop,
   label: '問下車站',
   line: 'Get off at River Market.', zh: '在河畔市集下車。',
   answer: 'Where should I get off?', answerZh: '我該在哪裡下車？',
   task: '已確認目的地是 River Market，再請司機說清楚應在哪一站下車。',
   words: 'where / get off', askFirst: true,
   objects: objects('在 River Market 下車', '在 Central Station 下車'), valid: [0],
   effect: '✓ 已聽懂司機的指示：在 River Market 下車。'
  }
 ];
 off.variation = {
  condition: '目的地改成 Central Station，司機仍用 River Market 問你',
  task: '這次你要去 Central Station，但司機仍問你是否在 River Market 下車。先說不是並告訴司機正確目的地，再問應在哪一站下車；司機會依更正後的地點回答。',
  steps: [
   {
    ...clone(off.steps[0]),
    label: '更正目的地',
    answer: 'No, I want to go to Central Station.', answerZh: '不是，我想去中央車站。',
    task: '你要去 Central Station，司機卻問 River Market；先否定，再告訴司機正確目的地。',
    words: 'no / want to go to / Central Station', valid: [1],
    effect: '✓ 已把目的地更正為 Central Station；接著問清楚下車站。'
   },
   {
    ...clone(off.steps[1]),
    line: 'Get off at Central Station.', zh: '在中央車站下車。',
    task: '你已把目的地更正為 Central Station，再問應在哪一站下車。',
    valid: [1], effect: '✓ 已聽懂司機的指示：在 Central Station 下車。'
   }
  ]
 };
 return tasks;
}

module.exports = function approvedTaskEditsDay3And4(day, tasks) {
 if (Number(day) !== 3 && Number(day) !== 4) return tasks;
 const result = clone(tasks);
 return Number(day) === 3 ? editDay3(result) : editDay4(result);
};
