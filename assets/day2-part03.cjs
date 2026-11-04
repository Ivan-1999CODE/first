'use strict';

// Part 03 ranges reference the canonical flows. Other parts and chapter paths
// continue to use the original flows, step IDs and storage keys.
module.exports = function day2Part03(d) {
 const task = label => d.rounds.find(r => r.displayLabel === label);
 const scene = (id, label, variant, start, end, title, context, outcome) => {
  const r = task(label), f = d.flows[r.flowIds[variant]];
  if (!f?.steps[start] || !f.steps[end]) throw Error('Missing Day 2 scene: ' + id);
  return {id, taskId:r.id, flowId:f.id, start, end, title, context, outcome};
 };
 return {
  storageKey:d.course.id + '-part03-scenes-v1',
  scenes:[
   scene('mug', 'A', 0, 0, 1, '買杯子：問價與購買',
    '你想買眼前的杯子，預算是 10 美元。先問價格，確認買得起後，再告訴店員你要買。',
    '問清杯子的價格，並表達購買決定。'),
   scene('water', 'A', 0, 2, 3, '買水：數量與總價',
    '這是另一筆購物。店員知道你要買水，每瓶 2 美元；你要 3 瓶，說出數量後再問總價。',
    '說出要買幾瓶水，並聽懂這一筆的總價。'),
   scene('payment', 'B', 0, 0, 1, '詢問付款方式',
    '你已選好 6 美元的杯子，身上有卡片和足夠現金。先問能不能刷卡，再依店員回覆完成付款。',
    '問清付款方式，並依店家規定付款。'),
   scene('own-bag', 'B', 0, 2, 2, '自備袋子',
    '你已買好杯子，也已完成付款。你帶了自己的袋子，聽店員詢問後，禮貌回答。',
    '聽懂袋子的詢問，禮貌表達不需要。'),
   scene('need-bag', 'B', 1, 2, 2, '需要袋子',
    '你已買好杯子，也已完成付款。這次沒有自備袋子，聽店員詢問後，表達你需要袋子。',
    '聽懂袋子的詢問，禮貌表達需要。'),
   scene('budget', 'C', 0, 0, 1, '說預算，找便宜商品',
    '你想買小禮物，只有 10 美元。杯子的價格超出預算，先說明預算，再請店員介紹便宜一點的商品。',
    '說明預算，並找到可負擔的替代商品。')
  ],
  integrated:[
   {id:'single', title:'買杯子並結帳', sources:'A＋B', description:'問價格 → 決定購買 → 付款 → 回答袋子需求'},
   {id:'water', title:'買水並結帳', sources:'A＋B', description:'說數量 → 問總價 → 付款 → 回答袋子需求'},
   {id:'budget', title:'依預算買禮物', sources:'A＋C＋B', description:'問價格 → 說預算、找替代品 → 決定購買 → 結帳'}
  ]
 };
};
