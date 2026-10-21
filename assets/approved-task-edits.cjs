// Explicitly approved curriculum edits. Keep each original task key so its
// provenance remains traceable, while chapters bring related small rounds together.
module.exports=function applyApprovedTaskEdits(day,tasks){
 if(day===2){
  // Clothing and fitting are taught on Day 7. Keep the surviving source IDs
  // stable when removing the old B, C and D tasks from every practice part.
  const removed=new Set(['find-item-and-size','size-unavailable-and-try','color-and-try']);
  tasks=tasks.map((task,index)=>({...task,id:task.id||String.fromCharCode(65+index)})).filter(task=>!removed.has(task.key));
  const chapters=[
   ['price-quantity','問清價格與數量',['price-and-buy','quantity-and-total'],'先練單件價格與購買，再換到買水、數量與總價；兩個購物例子分開練熟。'],
   ['payment-bag','付款與袋子',['card-or-cash','accept-or-decline-bag'],'先付款，再回答是否需要袋子；兩小輪熟悉後才串接。'],
   ['choose-alternative','說預算，找便宜一點的',['budget-and-cheaper'],'說明預算，再詢問負擔得起的替代商品。']
  ];
  for(const [order,[id,name,keys,description]]of chapters.entries())for(const t of tasks)if(keys.includes(t.key))t.chapter={id,name,order,description,position:keys.indexOf(t.key)};
 }
 if(day===3||day===4)tasks=require('./approved-task-edits-day3-4.cjs')(day,tasks);
 if(day===5||day===6)tasks=require('./approved-task-edits-day5-6.cjs')(day,tasks);
 return tasks;
};
