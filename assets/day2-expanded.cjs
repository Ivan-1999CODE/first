const d=JSON.parse(JSON.stringify(require('./day2-rounds-data.cjs')));
d.legacyFile='original-lessons/travel-english-unit2-shopping.html';
const reply=(id,name,line,zh,options,task,answer,change,changeAnswer)=>({id,name,line,zh,options,correct:0,listen:'先聽懂這次需要的資訊，再決定怎麼回應。',why:zh,task,words:answer.split(' ').slice(0,3).join(' ')+'…',answer,change,changeWords:changeAnswer.split(' ').slice(0,3).join(' ')+'…',changeAnswer});
d.replies.push(
 reply('a-bag','回應要不要袋子','Would you like a bag?','需要袋子嗎？',['要不要袋子','要不要換尺寸'],'你有自己的袋子，不需要。','No, thank you.','這次沒有帶袋子，接受店員提供。','Yes, please.'),
 reply('b-stock','想要的尺寸沒有貨','We only have large.','我們只有 L 號。',['只有 L 號','只有 M 號'],'你願意先試試 L 號，詢問能不能試穿。','Can I try it on?','如果你只想買 M 號，這次先不買。','No, thank you.'),
 reply('c-price-eight','再聽一次替代價格','This one is eight dollars.','這個 8 美元。',['8 美元','18 美元'],'你有 10 美元，喜歡這件並決定購買。','I’ll take it.','如果你這次不想買，禮貌回應。','No, thank you.'),
 reply('d-each','分清楚每瓶與總價','It’s two dollars each.','每瓶 2 美元。',['每瓶 2 美元','全部 2 美元'],'你想買 2 瓶水，先說數量，再問總價。','I’d like two bottles of water. How much are they?','改成買 3 瓶水。','I’d like three bottles of water. How much are they.')
);
const step=(id,label,line,zh,task,answer,objects,valid=[0],askFirst=false)=>({id,label,line,zh,task,answer,words:answer.split(' ').slice(0,3).join(' ')+'…',objects:objects.map(x=>['▣',x]),valid,askFirst,effect:'✓ 已更新購物卡。依新的資訊繼續。'});
const more=[
 {id:'a-postcard',name:'A｜換成明信片，付現金',context:'你要買眼前的明信片，有 10 美元現金，不需要袋子。',steps:[step('price','價格','It’s two dollars.','2 美元。','先問眼前明信片多少錢。','How much is this?',['$2','$12'],[0],true),step('payment','付款','Cash or card?','現金或刷卡？','你決定購買，並用現金付款。','I’ll take it. I’ll pay in cash.',['現金','刷卡']),step('bag','袋子','Would you like a bag?','需要袋子嗎？','你有自己的袋子，禮貌婉拒。','No, thank you.',['不需要袋子','需要袋子'])]},
 {id:'b-large',name:'B｜M 號缺貨，換個選擇',context:'你想找 M 號黑色 T-shirt；店裡只剩 L 號。這一趟先試穿看看，再決定。',steps:[step('item','商品','Can I help you?','需要幫忙嗎？','說你在找 T-shirt。','I’m looking for a T-shirt.',['T-shirt','帽子']),step('stock','尺寸','We only have large.','我們只有 L 號。','先問有沒有 M 號，再聽庫存。','Do you have this in medium?',['只有 L 號','只有 M 號'],[0],true),step('try','試穿','Of course.','當然可以。','你願意試 L 號，主動問試穿。','Can I try it on?',['先試穿 L 號','已決定買 M 號'],[0],true)]},
 {id:'c-eight',name:'C｜換成 8 美元預算',context:'你只有 8 美元。杯子 12 美元，明信片 2 美元。這次想買明信片。',steps:[step('budget','預算','The mug is twelve dollars.','杯子 12 美元。','說出你只有 8 美元，詢問便宜的替代品。','I have eight dollars. Do you have something cheaper?',['維持 $8 預算','買 $12 杯子']),step('choice','選擇','This postcard is two dollars.','這張明信片 2 美元。','你喜歡明信片，決定買。','I’ll take it.',['明信片 $2','杯子 $12']),step('pay','付款','Yes, you can pay by card.','可以刷卡。','問能不能刷卡。','Can I pay by card?',['可以刷卡','只收現金'],[0],true)]},
 {id:'d-two',name:'D｜兩瓶水，先聽單價再問總價',context:'你要 2 瓶水，每瓶 2 美元。有 8 美元現金，店裡只收現金。',steps:[step('unit','單價','It’s two dollars each.','每瓶 2 美元。','你聽到每瓶價格，說出要買 2 瓶。','I’d like two bottles of water.',['2 瓶水','3 瓶水']),step('total','總價','Four dollars in total.','總共 4 美元。','主動問這 2 瓶總共多少錢。','How much are they?',['總共 $4','總共 $2'],[0],true),step('pay','付款','Cash only, please.','只收現金。','你有足夠現金，回應店員。','I’ll pay in cash.',['付現金 $4','刷卡'])]}
];
more.forEach((f,i)=>{f.generic=true;f.sceneIcon=['✉','👕','🎁','💧'][i];f.sceneTitle='這一趟的購物卡';f.desc=f.context;f.summary='收起提示，用自己的話說出這次買了什麼，以及付款方式。';d.flows.push(f);d.rounds[i].flowIds.push(i+4);d.rounds[i].replyIds.push(i+8);});
const extra=[
 ['a-bag','買磁鐵，也會婉拒袋子','你想買眼前的磁鐵，先問價格，再決定購買。店員問要不要袋子，你不需要。','How much is this? I’ll take it. No, thank you.'],
 ['b-hat','換成帽子','你想找藍色帽子，說出需求並詢問能否試戴。','I’m looking for a hat. I’d like the blue hat. Can I try it on?'],
 ['c-no','決定先不買','你有 10 美元，杯子要 12 美元。問便宜一點的；替代品也不喜歡，禮貌不買。','I have ten dollars. Do you have something cheaper? No, thank you.'],
 ['d-three-cash','只收現金，這次沒有現金','你問了 3 瓶水的總價，店員說只收現金；你沒有現金，這次先不買。','I’d like three bottles of water. How much are they? No, thank you.']
];
extra.forEach(([id,name,task,answer],i)=>{d.missions.push({id,name,task,words:'先想這次的商品、數量和決定。',answer,check:'有依這次條件說清楚需求，並做出可行的決定嗎？'});d.rounds[i].missionIds.push(i+4);});
d.reviewTasks=d.rounds.map(r=>({...d.missions[r.missionIds[1]],id:r.id,name:r.name}));
for(const [i,r] of d.rounds.entries())d.quizzes.push({...d.replies[r.replyIds.at(-1)],id:'review-'+r.id,task:r.name+'：換資訊再聽一次'});
module.exports=d;
