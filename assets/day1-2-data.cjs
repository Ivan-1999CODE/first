const fs=require('fs');
const old1=require('./day1-original.json'),old2=require('./day2-original.json');
const phrase=rows=>rows.map(([use,en,zh],i)=>({id:'phrase-'+i,use,en,zh}));
const reply=rows=>rows.map(([name,line,zh,task,words,answer,change,changeWords,changeAnswer],i)=>({id:'reply-'+i,name,line,zh,task,words,answer,change,changeWords,changeAnswer}));
const step=(id,line,zh,task,words,answer,objects,valid=[0],askFirst=false)=>({id,line,zh,task,words,answer,objects,valid,askFirst,effect:'✓ 已更新場景。確認畫面中的結果，再繼續下一步。'});
const course1={day:1,id:'travel-lab-unit1-format-v3',legacyKeys:['travel-lab-unit1-v2','travel-lab-unit1-v1'],title:'問一點路，走近目的地。',description:'禮貌開口、聽懂方向，再確認自己要怎麼走。',replyRole:'路人',board:'走出你的路線',task:'你想去車站，也想知道能不能走路到那裡。你遇到一位路人，你會怎麼開口？',words:'Excuse me / train station / walk',answer:'Excuse me. How do I get to the train station? Can I walk there?',review:'有禮貌開口、說出車站，並詢問能不能走路嗎？',tip:'先說目的地，再問路。first / second 是第幾個路口；left / right 是左、右。Can I walk there? 是問能不能走路，不是詢問方向。',labels:['先試著問路','問路隨身句與短答','跟著地圖找到目的地','說出自己的需要','和老師完成問路','看看我的進步','課後問路挑戰'],skills:[{id:'ask',text:'我能禮貌開口，說出目的地並問路。'},{id:'route',text:'我能聽懂路口與左右，確認自己的方向。'},{id:'help',text:'我能詢問走路、請對方重說或指地圖。'}]};
const course2={day:2,id:'travel-lab-unit2-format-v3',legacyKeys:['travel-lab-unit2-v2','travel-lab-unit2-v1'],title:'說出喜歡的，買到需要的。',description:'從找商品、問價格，到回應缺貨與確認付款。',replyRole:'店員',board:'操作商品與付款物件',task:'你想買一份送朋友的小禮物，只有 10 美元。到了店裡，看上一個杯子，想知道價格，也想問能不能刷卡。你會怎麼跟店員說？',words:'looking for / gift / how much / pay by card',answer:'I’m looking for a gift. How much is this mug? Can I pay by card?',review:'有說出想買禮物、詢問杯子價格與付款方式嗎？',tip:'How much is this? 問一件商品；How much are they? 問多件。each 是每件，in total 是總共。I’ll take it. 用在決定買的時候；不買也可以禮貌說 No, thank you.',labels:['先試著說購物需求','購物隨身句與短答','走進商店完成購物','換個情況說需求','和老師完成購物','看看我的進步','課後購物挑戰'],skills:[{id:'need',text:'我能說出商品、尺寸或數量。'},{id:'change',text:'我能詢問價格，遇到缺貨或超出預算時提出替代需求。'},{id:'pay',text:'我能決定買或不買，並確認付款方式。'}]};
const routeTerms=[
 ['街角轉彎｜corner','Turn left at the first corner.','在第一個街角左轉。corner 是街角、轉角；first 才是「第一個」。'],
 ['走幾個街區｜block','Go straight for two blocks.','直走兩個街區。block 是街區；這裡用來表示沿街走的距離，通常以相鄰路口之間的一段計算，不是「第二個路口」。']
];
const replies1=reply([
 ['要去哪裡','Where would you like to go?','你想去哪裡？','你想去火車站。','train station','The train station, please.','改成想去郵局。','post office','The post office, please.'],
 ['要看地圖嗎','Do you have a map?','你有地圖嗎？','你有一張地圖，拿給路人看。','yes / here','Yes. Here it is.','改成你沒有地圖。','no / sorry','No, sorry.'],
 ['能走路嗎','Would you like to walk?','你想走路嗎？','你想走路，簡短回答。','yes / please','Yes, please.','改成你想搭公車。','bus','No, thank you. Can I take a bus?'],
 ['要重說嗎','Would you like me to say that again?','要我再說一次嗎？','你沒聽清楚，請對方再說一次。','yes / please','Yes, please.','改成你已經聽懂。','no / thank you','No, thank you. I understand.']
]);
const replies2=reply([
 ['進店招呼','Can I help you?','需要幫忙嗎？','你想找一件 T-shirt。','looking for / T-shirt','I’m looking for a T-shirt.','改成先看看。','just looking','I’m just looking, thank you.'],
 ['詢問尺寸','What size would you like?','你想要什麼尺寸？','你要 M 號。','medium / please','Medium, please.','改成 L 號。','large','Large, please.'],
 ['選擇顏色','Would you like the black one?','你想要黑色的嗎？','你願意看看黑色的。','yes / please','Yes, please.','改成你想要藍色。','blue','No, thank you. I’d like the blue one.'],
 ['商品數量','How many bottles would you like?','你想要幾瓶？','你要 3 瓶水。','three / bottles','Three bottles, please.','改成 2 瓶。','two','Two bottles, please.'],
 ['付款方式','Cash or card?','現金還是刷卡？','你想刷卡。','card / please','Card, please.','改成付現金。','cash','Cash, please.']
]);
const walkMinutes=id=>id==='post'?15:10;
const walkLine=id=>`Yes. It’s a ${id==='post'?'fifteen':'ten'}-minute walk.`;
const routeFlow=(id,name,dest,destEn,junction,side)=>({id,name,desc:`問出${dest}的路線，確認方向與步行資訊。`,context:`從地圖下方橘色起點出發，面朝上方。這次想去${dest}。地圖與時間皆為教學設定。`,summary:`收起提示，說出怎麼去${dest}，並問能不能走路。`,destination:dest,destEn,junction,side,walkMinutes:walkMinutes(id),steps:[
 step('ask','Of course. I can help you.','當然，我可以幫忙。',`禮貌開口，問怎麼去${dest}。`,'Excuse me / how / get to',`Excuse me. How do I get to the ${destEn}?`,[['📍',dest],['🏨','飯店']],[0],true),
 step('junction',`Go straight to the ${junction===1?'first':'second'} intersection.`,`直走到第 ${junction} 個路口。`,'用自己的英文確認要走到第幾個路口。','first / second / intersection',`The ${junction===1?'first':'second'} intersection?`,[['①','走到第一個路口'],['②','走到第二個路口']],[junction-1]),
 step('turn',`Turn ${side}. The ${destEn} is at the end of the road.`,`往${side==='left'?'左':'右'}轉，${dest}在路的盡頭。`,'確認左轉或右轉，再在地圖走出路線。','turn / left / right',`Turn ${side}?`,[['←','左轉'],['→','右轉']],[side==='left'?0:1]),
 step('walk',walkLine(id),`可以，走路 ${walkMinutes(id)} 分鐘。`,'問能不能走路到那裡。','Can / walk there','Can I walk there?',[[String(walkMinutes(id)),`步行 ${walkMinutes(id)} 分鐘`],['30','步行 30 分鐘']],[0],true),
 step('finish','You’re welcome. Have a nice day!','不客氣，祝你有美好的一天！','用一句英文謝謝對方。','thank you','Thank you for your help.',[['✓','帶著確認好的路線出發']])
]});
const flows1=[routeFlow('station','找到火車站','火車站','train station',2,'left'),routeFlow('post','找到郵局','郵局','post office',2,'right'),routeFlow('bus','找到公車站','公車站','bus stop',1,'left')];
const flows2=[{id:'clothes',name:'缺貨了，換個選擇',desc:'找 M 號上衣、回應藍色缺貨，再決定買或不買。',context:'你需要 M 號 T-shirt，喜歡藍色，也願意看看其他顏色。所有價格使用美元，僅為教學設定。',summary:'說出你最後看的商品、尺寸與買或不買的決定。',steps:[
 step('item','Hello! Can I help you?','你好，需要幫忙嗎？','告訴店員你在找一件 T-shirt。','looking for / T-shirt','I’m looking for a T-shirt.',[['👕','T-shirt'],['👟','鞋子']]),
 step('size','What size would you like?','你想要什麼尺寸？','你需要 M 號，告訴店員。','medium / please','Medium, please.',[['M','M 號'],['L','L 號']]),
 step('color','We have medium in black or green, but not in blue.','M 號有黑色或綠色，沒有藍色。','你需要 M 號，選黑色或綠色，說想先試穿。','try on / black / green','Can I try on the black one?',[['●','黑色 M 號'],['●','綠色 M 號'],['●','藍色 M 號']],[0,1]),
 step('decision','It’s twenty dollars. Would you like to take it?','這件 20 美元，你想買嗎？','試穿後合身。你可以買，也可以禮貌表示先不買。','take it / no thank you','It fits. I’ll take it.',[['🛍','決定購買'],['↩','先不買']],[0,1]),
 step('payment','Cash or card?','現金還是刷卡？','決定你的付款方式。','card / cash','Card, please.',[['💳','刷卡'],['💵','付現']],[0,1])
]},{id:'gift',name:'在預算內選禮物',desc:'杯子超出預算，問便宜一點的，再確認結帳。',context:'你想送朋友小禮物，預算只有 10 美元。杯子 12 美元，磁鐵 4 美元，明信片 2 美元。',summary:'說出你的預算、最後選擇與付款方式。',steps:[
 step('item','Can I help you?','需要幫忙嗎？','說你想找禮物，並詢問杯子的價格。','gift / how much / mug','I’m looking for a gift. How much is this mug?',[['☕','詢問杯子'],['👟','詢問鞋子']]),
 step('budget','The mug is twelve dollars.','杯子 12 美元。','杯子超出 10 美元預算，問有沒有便宜一點的。','ten dollars / cheaper','I have ten dollars. Do you have something cheaper?',[['10','告訴店員預算 10 美元'],['12','直接買 12 美元杯子']]),
 step('alternative','This magnet is four dollars. This postcard is two dollars.','磁鐵 4 美元，明信片 2 美元。','選一件預算內的禮物，告訴店員你要買哪件。','take / magnet / postcard','I’ll take the magnet.',[['🧲','磁鐵 $4'],['✉','明信片 $2']],[0,1]),
 step('payment','Yes, you can pay by card or in cash.','可以，你能刷卡或付現。','先問能不能刷卡，再決定付款方式。','pay by card','Can I pay by card?',[['💳','刷卡'],['💵','付現']],[0,1],true),
 step('finish','Thank you. Here’s your receipt.','謝謝，這是你的收據。','拿到商品與收據，謝謝店員。','thank you','Thank you.',[['🧾','收下商品與收據']])
]}];
const missions1=old1.situations.map((s,i)=>({id:'need-'+i,name:s.name,task:s.prompt+' '+s.follow,words:s.words,answer:s.example+' '+s.followEx,check:'有說清楚目的地或需要，並針對新資訊追問嗎？'}));
// Include the information needed to respond, without exposing the English answer.
const repliesZh=['路人說走路要 20 分鐘。','路人說站牌在馬路對面。','路人說警局在火車站附近。','路人說先直走，再左轉。','路人說銀行關了。','路人說超市在車站附近。'];
missions1.forEach((m,i)=>m.task=old1.situations[i].prompt+' '+repliesZh[i]+' '+old1.situations[i].follow);
const stockZh=['杯子 12 美元，超出預算。','M 號只有黑色，藍色沒有 M 號。','這款球鞋只有 9 號，沒有 8 號。','每瓶水 2 美元，3 瓶共 6 美元，只收現金。'];
const missions2=old2.shops.map((s,i)=>({id:s.id,name:s.zh+'的新情況',task:s.goal+' '+stockZh[i]+' '+s.challenge,words:s.words,answer:s.follow,check:s.challenge}));
const pairs1=old1.places.map(p=>({id:p.id,name:'問路到'+p.zh,role:'學生當旅客，老師當路人；共看畫面。',first:'學生',opening:`不好意思，請問怎麼去${p.zh}？`,next:'老師給方向，學生確認路口和左右；需要時請重說，再詢問能不能走路。',objects:'目的地：'+p.zh+' · 起點面朝北',goals:['禮貌開口說目的地','確認路口與方向','詢問步行或請求協助'],tags:'教學條件：'+(p.path.includes('240')?'第一個':'第二個')+'路口'+(p.x===100?'左':'右')+'轉 · 步行 10 分鐘',cards:[['問怎麼走',p.route,'分段說路口、方向、目的地。'],['問能不能走路','Yes. It’s a ten-minute walk.','回應步行時間。'],['請求重說',p.route,'放慢再說一次，不要求學生背你的台詞。']],words:'Excuse me / get to / walk / again',answer:`Excuse me. How do I get to the ${p.en.toLowerCase()}? Can I walk there?`}));
const pairs2=old2.shops.map(s=>({id:s.id,name:s.zh+'購物任務',role:'學生當顧客，老師當店員；共看畫面。',first:'老師',opening:'你好，需要幫忙嗎？',start:'Hello! Can I help you?',next:s.goal+' 老師依學生說法接話；學生可以選替代商品，也可以不買。',objects:s.goal,goals:['說出商品與需要','詢問價格或尺寸','回應新的條件','確認買或不買及付款需要'],tags:s.stock,cards:[['提出商品需求',s.reply,'提供目前價格或庫存。'],['詢問替代方案',s.answer,'回應需求，再讓學生做決定。'],['想要購買',s.id==='market'?'Cash only, please.':'Cash or card?','依商店條件確認付款。'],['決定不買','No problem. Have a nice day!','自然結束，完成溝通不代表一定要買。']],words:s.words,answer:s.example+' '+s.follow+' '+s.end}));
const quizzes1=[{id:'route',task:'火車站怎麼走？',line:'Go straight to the second intersection. Turn left. The train station is at the end of the road.',zh:'直走到第二個路口，左轉，火車站在路的盡頭。',options:['第一個路口右轉','第二個路口左轉','第二個路口右轉'],correct:1,why:'second 是第二個，left 是左邊。'},{id:'walk',task:'走路要多久？',line:'It’s a ten-minute walk.',zh:'走路 10 分鐘。',options:['10 分鐘','20 分鐘','30 分鐘'],correct:0,why:'ten-minute walk 表示走路 10 分鐘。'}];
const quizzes2=[{id:'stock',task:'哪個選擇有 M 號？',line:'We have medium in black, but not in blue.',zh:'M 號有黑色，沒有藍色。',options:['藍色 M 號','黑色 M 號','兩色都有 M 號'],correct:1,why:'medium in black 是黑色 M 號；not in blue 表示藍色沒有。'},{id:'pay',task:'3 瓶水總共多少，怎麼付？',line:'They’re two dollars each. Six dollars in total. Cash only, please.',zh:'每瓶 2 美元，總共 6 美元，只收現金。',options:['6 美元，付現','2 美元，刷卡','6 美元，刷卡'],correct:0,why:'six dollars in total 是共 6 美元；cash only 是只收現金。'}];
module.exports=[{course:course1,phrases:phrase([...old1.phrases,['詢問能否步行','Can I walk there?','我可以走路到那裡嗎？'],['詢問公車','Can I take a bus?','我可以搭公車嗎？'],['確認方向','Turn left?','左轉嗎？'],['感謝協助','Thank you for your help.','謝謝你的幫忙。'],...routeTerms]),replies:replies1,flows:flows1,missions:missions1,pairs:pairs1,quizzes:quizzes1,homeTask:'你想去郵局寄明信片。問路、確認第二個路口右轉，再問能不能走路；最後謝謝路人。',homeWords:'post office / second / right / walk / thank you',homeAnswer:'Excuse me. How do I get to the post office? Turn right at the second intersection? Can I walk there? Thank you.'},{course:course2,phrases:phrase([...old2.phrases,['詢問多件總價','How much are they?','這些總共多少錢？'],['說明預算','I have ten dollars.','我有 10 美元。'],['說出數量','I’d like three bottles of water.','我想要 3 瓶水。'],['改用現金','I’ll pay in cash.','我會付現金。'],['婉拒購買','No, thank you.','不用了，謝謝。']]),replies:replies2,flows:flows2,missions:missions2,pairs:pairs2,quizzes:quizzes2,homeTask:'你要買 3 瓶水，詢問總價。店員說共 6 美元，只收現金。你有 8 美元現金，回應並完成購買。',homeWords:'three bottles / how much / cash / thank you',homeAnswer:'I’d like three bottles of water. How much are they? Okay. I’ll pay in cash. Thank you.'}].map(d=>{d.course.art=fs.readFileSync(`assets/day${d.course.day}-${d.course.day===1?'directions':'shopping'}.svg`,'utf8').replace(/<\?xml[^>]*>/,'');return d;});
