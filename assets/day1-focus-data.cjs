const original=require('./day1-2-data.cjs')[0];
const d=JSON.parse(JSON.stringify(original));
d.course.id='travel-lab-unit1-focus-v1';
d.course.legacyKeys=[...original.course.legacyKeys];
d.course.description='一次聚焦幾句，立刻拿去問路。13 句分成三輪，完成一輪再學下一輪。';
d.course.labels=['先試著問路','這一輪的句子與短答','這一輪：跟著做','這一輪：換個情況','這一輪：真人問路','看看我的進步','課後問路挑戰'];
d.previousLesson={key:original.course.id,missions:original.missions,pairs:original.pairs};
d.rounds=[
 {id:'A',name:'找到目的地',goal:'問出車站怎麼走，確認方向與能否步行。',phraseIds:[0,7,9,10],replyIds:[0,2],missionIds:[0,1],pairIds:[0,1],reuse:[],words:[['train station','火車站'],['bus stop','公車站'],['left / right','左／右'],['first / second intersection','第一／第二個路口']],listen:'方向與路口先聽懂即可；確認時重複關鍵字也可以。',bridge:'禮貌起手式：Excuse me.（不好意思。）不另加新句型，直接和問路句一起用。'},
 {id:'B',name:'遇到困難會求助',goal:'說清楚要去郵局；沒聽清楚就重問，太遠就問公車。',phraseIds:[1,2,5,6,8],replyIds:[1,3],missionIds:[2,3],pairIds:[2,3],reuse:[7,10],words:[['post office','郵局'],['police station','警局'],['map','地圖'],['bus','公車']],listen:'Yes / No 可簡短回應；不要求背路人的台詞。',bridge:'把 A 輪的「能不能走路」與道謝帶著用。'},
 {id:'C',name:'換地點，也能帶路',goal:'問銀行與最近超市，再把剛聽到的路線告訴同行朋友。',phraseIds:[3,4,11,12],replyIds:[0],missionIds:[4,5],pairIds:[4,5],reuse:[5,6,10],words:[['bank','銀行'],['nearest supermarket','最近的超市'],['corner','街角、轉角'],['block','街區；相鄰路口間的一段']],listen:'這輪最後兩句換成「你告訴旅伴怎麼走」，先聽路人示範，再自己說。',bridge:'corner 是轉角，不是「第一個」；two blocks 是距離，不等於「第二個路口」。'}
];
const S=(id,line,zh,task,words,answer,objects,valid=[0],askFirst=false,position=null)=>({id,line,zh,task,words,answer,objects,valid,askFirst,position,effect:'✓ 已更新路線卡，確認結果後繼續。'});
const finish=S('finish','You’re welcome.','不客氣。','已經問清楚，謝謝路人。','thank you / help','Thank you for your help.',[['✓','帶著資訊出發']],[0],true);
const a=JSON.parse(JSON.stringify(original.flows[0]));a.id='focus-a';a.name='A｜問路到車站';a.steps.at(-1).askFirst=true;
a.steps[0].position=[210,315,'已問出目的地：車站'];a.steps[1].position=[210,90,'第二個路口'];a.steps[2].position=[85,90,'左轉到車站'];a.steps[3].position=[85,90,'車站 · 步行 10 分鐘'];
d.flows=[a,{id:'focus-b',name:'B｜郵局太遠，找另一種走法',desc:'先問路，再處理聽不清楚與步行太遠。',context:'你在起點，要去郵局。路人會先給口頭路線，你需要時主動請他重說或指地圖。全為教學設定。',summary:'用 B 輪的說法交代目的地、求助，再用 A 輪的句子道謝。',steps:[
 S('ask','Sure. Go straight to the second intersection. Turn right.','當然。直走到第二個路口，再右轉。','先說你要去郵局，接著請對方指路。','going to / post office / show me the way','I’m going to the post office. Could you show me the way?',[['✉','目的地：郵局'],['🚉','目的地：車站']],[0],true,[210,315,'已問郵局路線']),
 S('repeat','Go straight to the second intersection. Turn right.','直走到第二個路口，右轉。','剛才沒聽清楚。主動請路人重說，再聽回覆。','say / again','Could you say that again?',[['②','第二個路口右轉'],['①','第一個路口左轉']],[0],true,[210,90,'重聽後確認第二個路口']),
 S('map','Here. The post office is on the right.','這裡，郵局在右邊。','你還想對照地圖，請他在地圖上指出來。','show / map','Could you show me on the map?',[['→','在地圖標記右側郵局'],['←','標記左側車站']],[0],true,[335,90,'已在地圖找到郵局']),
 S('walk','Yes, but it’s a twenty-minute walk.','可以，但要走 20 分鐘。','用 A 輪學過的句子，問能不能走路。','walk','Can I walk there?',[['20','步行 20 分鐘'],['10','步行 10 分鐘']],[0],true,[335,90,'郵局 · 步行 20 分鐘']),
 S('bus','Yes. The bus stop is at the first intersection, on the left.','可以。站牌在第一個路口左邊。','你不想走 20 分鐘，問能不能改搭公車。','take / bus','Can I take a bus?',[['🚌','標記第一個路口左側站牌'],['✉','繼續標記郵局']],[0],true,[85,215,'改搭公車 · 先找站牌']),finish
 ]},{id:'focus-c',name:'C｜問清楚，再告訴旅伴',desc:'從同一起點，分別問銀行與最近超市的路線。',context:'你和朋友在起點，先查銀行路線，再查最近的超市。圖中路口等距，相鄰路口之間算一個街區；時間、距離皆為教學設定。',summary:'換成你帶路：說出銀行的轉角，以及去超市要直走的街區數。',steps:[
 S('bank','Turn left at the first corner.','在第一個街角左轉。','先禮貌詢問銀行在哪裡。','tell me / where / bank','Can you tell me where the bank is?',[['🏦','查銀行路線'],['🛒','查超市路線']],[0],true,[210,315,'先查銀行路線']),
 S('corner','Which way is the bank?','銀行往哪裡走？','朋友沒聽見路人的話。告訴他在第一個街角左轉。','left / first corner','Turn left at the first corner.',[['←','第一個街角左轉'],['→','第一個街角右轉']],[0],false,[85,215,'銀行：第一個街角左轉']),
 S('market','Go straight for two blocks. Then turn right.','直走兩個街區，再右轉。','回到同一起點查另一條路：你們想買水，詢問最近的超市在哪。','know / nearest supermarket','Do you know where the nearest supermarket is?',[['🛒','從起點查超市路線'],['🏦','沿用銀行路線']],[0],true,[210,315,'回到起點查超市路線']),
 S('blocks','How far do we go straight?','我們要直走多遠？','朋友問要直走多遠。把兩個街區的指示告訴他。','straight / two blocks','Go straight for two blocks.',[['②','從起點直走兩個街區'],['①','只走一個街區']],[0],false,[210,90,'已走兩個街區']),
 S('turn','Turn right. The supermarket is there.','右轉，超市就在那裡。','用 A 輪的確認說法，換成右轉，再標記路線。','turn / right','Turn right?',[['→','右轉到超市'],['←','左轉到車站']],[0],false,[335,90,'已找到最近超市']),finish
 ]}];
const M=(id,name,task,words,answer,check)=>({id,name,task,words,answer,check});
d.missions=[
 M('a-bus','換成公車站','你想搭車，不知道公車站怎麼走。先問位置，再問是否能步行到站牌。','bus stop / get to / walk','How do I get to the bus stop? Can I walk there?','有換成公車站，並問能否走到站牌嗎？'),
 M('a-right','換成右邊','你去車站，路人說到路口右轉。你想確認是右轉，確認後道謝。','right / thank you','Turn right? Thank you for your help.','有把左換成右，並道謝嗎？'),
 M('b-help','想看地圖','你要去警局，但剛才的路線沒聽清楚。你手上有地圖；請路人重說，並在圖上指出位置。','again / map','Could you say that again? Could you show me on the map?','有讓對方知道需要重說與地圖協助嗎？'),
 M('b-bus','走路太遠','你要去郵局。先交代目的地，請路人指路。得知要走 20 分鐘後，詢問能不能搭公車。','going to / way / bus','I’m going to the post office. Could you show me the way? Can I take a bus?','有說目的地、請指路，並因距離改問公車嗎？'),
 M('c-bank','換一個街角','你和朋友找銀行。先向路人問銀行在哪；路人說「第二個街角右轉」。把這段指示轉告朋友。','bank / second corner / right','Can you tell me where the bank is? Turn right at the second corner.','有問銀行，並依新條件換成第二個街角右轉嗎？'),
 M('c-market','換一段距離','你和朋友想買水。問最近的超市在哪，路人說直走一個街區。把這段指示告訴朋友。','nearest supermarket / one block','Do you know where the nearest supermarket is? Go straight for one block.','有問最近超市，並把 two blocks 換成 one block 嗎？')
];
const P=(id,name,opening,next,objects,goals,tags,cards,words,answer)=>({id,name,role:'學生當旅客，老師當路人；C 輪老師也會扮演同行朋友。師生共看畫面。',first:'學生',opening,next,objects,goals,tags,cards,words,answer});
d.pairs=[
 P('a-station','A① 找車站','不好意思，請問怎麼去車站？','聽方向，確認左或右，再問能否步行並道謝。','目的地：車站',['問出目的地','確認左右','問能否步行','道謝'],'第二個路口左轉；步行 10 分鐘。',[['問路','Go straight to the second intersection. Turn left.','分段給路線。'],['確認方向','Yes, left.','確認左轉。'],['問步行','Yes. It’s a ten-minute walk.','回覆可步行。']],'get to / left / walk / thank you','How do I get to the train station? Turn left? Can I walk there? Thank you for your help.'),
 P('a-bus','A② 換成公車站','不好意思，公車站怎麼走？','目的地換了，自己挑 A 輪的句子完成問路。','目的地：公車站',['問公車站路線','確認左右','問能否步行','道謝'],'第一個路口右轉；步行 5 分鐘。',[['問路','Go straight to the first intersection. Turn right.','右轉，觀察學生是否跟著換方向。'],['確認方向','Yes, right.','確認右轉。'],['問步行','Yes. It’s a five-minute walk.','回覆可步行。']],'bus stop / right / walk','How do I get to the bus stop? Turn right? Can I walk there? Thank you for your help.'),
 P('b-post','B① 郵局太遠','我要去郵局，可以告訴我怎麼走嗎？','先問路；有一次沒聽清楚，請重說並看地圖。再問步行資訊，得知太遠後改問公車。','郵局 · 手上有地圖',['交代目的地並請指路','請重說','請在地圖指出','問能否步行後改問公車','道謝'],'第二個路口右轉；步行 20 分鐘；可搭公車。',[['說出目的地並請指路','Go straight to the second intersection. Turn right.','一般速度一次。'],['請重說','Turn right at the second intersection.','放慢重說。'],['請指地圖','Here is the post office.','在紙上畫出起點與目的地。'],['問步行','It’s a twenty-minute walk.','等學生決定下一問。'],['問公車','Yes. The bus stop is over there.','指向站牌。']],'going to / way / again / map / bus','I’m going to the post office. Could you show me the way? Could you say that again? Could you show me on the map? Can I walk there? Can I take a bus?'),
 P('b-police','B② 換成警局','我要去警局，可以告訴我怎麼走嗎？','改去警局，遇到沒聽清楚與路太遠時，自己選擇需要的求助說法。','警局 · 手上有地圖',['交代目的地並請指路','請重說並看地圖','問步行資訊與公車','道謝'],'第一個路口右轉；步行 25 分鐘；可搭公車。',[['請指路','Turn right at the first intersection.','給方向。'],['請重說','The first intersection. Turn right.','慢速重說。'],['請指地圖','Here is the police station.','畫出位置。'],['問步行','It’s a twenty-five-minute walk.','讓學生再問公車。'],['問公車','Yes, you can take a bus.','確認可搭車。']],'police station / again / map / bus','I’m going to the police station. Could you show me the way? Could you say that again? Could you show me on the map? Can I walk there? Can I take a bus?'),
 P('c-bank','C① 問到後，告訴朋友','可以告訴我銀行在哪裡嗎？','老師先當路人給方向，再當沒聽到的朋友；你把路線告訴朋友。','銀行 · 同行朋友',['用禮貌問法問銀行位置','把街角與轉向告訴朋友','需要時自己求助','道謝'],'路人：第一個街角左轉。下一輪改成第二個街角右轉。',[['問銀行','Turn left at the first corner.','路人給方向。'],['要向朋友轉述','Which way is the bank?','老師換成朋友，讓學生帶路。'],['請重說','Turn left at the first corner.','依目前指定方向重說。']],'tell me / bank / first corner','Can you tell me where the bank is? Turn left at the first corner.'),
 P('c-market','C② 找最近超市','你知道最近的超市在哪裡嗎？','老師先當路人說距離，再當朋友問怎麼走。你轉告街區數，再確認左右。','最近的超市 · 同行朋友',['詢問最近的超市','告訴朋友直走幾個街區','確認轉向並道謝'],'直走兩個街區，再右轉。下一輪改成一個街區。',[['問超市','Go straight for two blocks. Then turn right.','先給完整資訊。'],['要向朋友轉述','How far do we go straight?','老師換成朋友。'],['確認轉向','Yes, right.','確認後自然結束。']],'nearest supermarket / two blocks / right','Do you know where the nearest supermarket is? Go straight for two blocks. Turn right? Thank you for your help.')
];
// Preserve all four short-answer groups, but keep A's replacement within its taught language.
d.replies[2].change='改成你不想走路，先簡短婉拒。';d.replies[2].changeWords='no / thank you';d.replies[2].changeAnswer='No, thank you.';
d.replies[0].answer='The train station, please.';
d.rounds.forEach(r=>r.phraseIds=r.phraseIds.map(n=>'phrase-'+n));
module.exports=d;
