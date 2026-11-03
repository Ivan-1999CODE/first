// Part 03 questions only. Keep all taught speech, IDs and accepted indices so
// Part 02 alignment and saved task completion remain stable.
module.exports=function(data){
 for(const flow of data.flows||[])for(const step of flow.steps){
  if(/-d2-budget-and-cheaper-v1-0$/.test(step.id)){
   step.choiceKind='cup';
   step.choicePrompt='聽完杯子的價格，依你剛才說的預算決定下一步。';
   step.objects=[['▣','先不買這個杯子，詢問便宜一點的'],['▣','直接買這個杯子']];
  }
  if(/-d6-merged-day6-price-and-confirmation-v1-0$/.test(step.id)){
   step.choiceKind='food';
   step.choicePrompt='你的預算是 10 美元。聽完價格，決定接下來怎麼做。';
   step.objects=[['▣','再看菜單，詢問便宜一點的'],['▣','直接點這份餐點']];
  }
 }
 return require('./part03-review.cjs').apply(data);
};
