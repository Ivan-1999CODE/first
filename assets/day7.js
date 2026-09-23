'use strict';
let phraseMode='library',replyIndex=0;
const clerkReplies=[
 {name:'進店招呼',en:'AT THE DOOR',line:'Can I help you?',zh:'需要幫忙嗎？',task:'你想找一件 T-shirt，告訴店員你在找什麼。',words:'I’m looking for / a T-shirt',answer:'I’m looking for a T-shirt.',change:'如果你只是想先逛逛，可以怎麼回答？',changeWords:'just looking / thank you',changeAnswer:'I’m just looking, thank you.',note:'也可能聽到 May I help you?，語氣較正式，意思相同。'},
 {name:'詢問尺寸',en:'FIND YOUR SIZE',line:'What size do you wear?',zh:'你穿什麼尺寸？',task:'你平常穿 M 號，試著告訴店員。',words:'medium / please',answer:'Medium, please.',change:'再練一次：如果你穿 L 號呢？',changeWords:'large / please',changeAnswer:'Large, please.',note:'S = small、M = medium、L = large。也可以回答 I usually wear a medium.'},
 {name:'選擇顏色',en:'PICK A COLOR',line:'What color would you like?',zh:'你想要什麼顏色？',task:'你想看看藍色的，告訴店員你的選擇。',words:'blue / please',answer:'Blue, please.',change:'換成你喜歡的顏色：綠色或粉紅色，你會怎麼說？',changeWords:'green / pink',changeAnswer:'Green, please. / Pink, please.',note:'可以用顏色加 please 簡短回答，也可以說 I’d like the blue one, please.'},
 {name:'試穿感受',en:'AT THE MIRROR',line:'How does it fit?',zh:'穿起來合身嗎？',task:'試穿後胸口有一點緊，試著描述你的感受。',words:'a little / too tight',answer:'It’s a little too tight.',change:'如果穿起來剛剛好，或是太鬆了呢？',changeWords:'fits well / too loose',changeAnswer:'It fits well. / It’s too loose.',note:'a little 是「有一點」。除了大小，也可以描述 tight（緊）或 loose（鬆）。'},
 {name:'建議換尺寸',en:'TRY ANOTHER SIZE',line:'Would you like to try a larger size?',zh:'你想試試大一點的尺寸嗎？',task:'這件太緊，你願意試大一點的。回應店員的建議。',words:'Yes / please',answer:'Yes, please.',change:'如果這件其實太鬆，你想換小一點的，該怎麼回？',changeWords:'No, thank you / smaller one',changeAnswer:'No, thank you. Do you have a smaller one?',note:'larger size 是較大的尺寸；smaller size 是較小的尺寸。先聽清楚店員提的是哪一種。'}
];
const $=s=>document.querySelector(s), KEY='travel-lab-unit7-fitting-v1';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const labels=['先挑一件喜歡的','尺寸與試穿隨身句','走進服飾店，試穿比較','說出自己的需求','和老師完成一次購物','看看我的進步','課後購物挑戰'];
const phrases=[
 ['詢問其他尺寸','Do you have this in another size?','這件有其他尺寸嗎？'],
 ['詢問其他顏色','Do you have this in another color?','這件有其他顏色嗎？'],
 ['指定尺寸','Do you have this in medium?','這件有 M 號嗎？'],
 ['詢問試穿','Can I try this on?','我可以試穿這件嗎？'],
 ['找試衣間','Where are the fitting rooms?','試衣間在哪裡？'],
 ['太大或太小','It’s too big. / It’s too small.','這件太大了。／這件太小了。'],
 ['太緊或太鬆','It’s too tight. / It’s too loose.','這件太緊了。／這件太鬆了。'],
 ['換大一點','Do you have a bigger one?','有大一點的嗎？'],
 ['換小一點','Do you have a smaller one?','有小一點的嗎？'],
 ['剛好合身','It fits well.','這件很合身。'],
 ['比較喜好','I like this one better.','我比較喜歡這件。'],
 ['決定購買','I’ll take it.','我要買這件。']
];
const colors=[{en:'blue',zh:'藍色',hex:'#7796b4'},{en:'green',zh:'綠色',hex:'#91a58c'},{en:'pink',zh:'粉紅色',hex:'#ce999d'}];
const sizes=['S','M','L'];
const step=(line,zh,task,hint,answer,kind,options,correct,result,extra={})=>({line,zh,task,hint,answer,kind,options,correct,result,...extra});
const lessons=[{name:'從太緊，到剛好合身',en:'THE EVERYDAY TEE',desc:'挑顏色、詢問試穿、找試衣間，把 S 號換成 M 號。',turns:[
 step('Hello! Which color would you like?','你好！你想要哪個顏色？','先說你想看的顏色，再從衣架挑一件。三種都可以。','I’d like / blue / green / pink','I’d like the blue T-shirt, please.','rack',['藍色','綠色','粉紅色'],null,'已把這件衣服帶到你的試穿區。',{set:'color'}),
 step('Here you are. This one is a small.','這件給你。這是 S 號。','你想先試穿看看。開口詢問試穿，再拿起試穿牌。','Can I / try this on','Can I try this on?','ask',['拿起試穿牌'],0,'店員收到你的試穿請求。'),
 step('Of course. You can try it on.','當然，你可以試穿。','先問試衣間在哪裡，再點店內指示牌。','Where / fitting rooms','Where are the fitting rooms?','sign',['查看店內指示牌'],0,'接著聽店員指路，再選試衣間。'),
 step('The fitting rooms are on the right, next to the mirror.','試衣間在右邊，鏡子旁邊。','聽完先用英文確認位置，再點店裡正確的門。','On the right / right','On the right, next to the mirror, right?','room',['左側倉庫','右側試衣間'],1,'布簾已打開。進入試衣間，看看 S 號穿起來的感覺。',{set:'room'}),
 step('How does it fit?','穿起來合身嗎？','看鏡中的衣服：胸口繃緊。先告訴店員太緊，再選符合的試穿感受。','It’s too / tight','It’s too tight.','fit',['太鬆','太緊','剛好'],1,'已記下：S 號太緊，需要換尺寸。'),
 step('Would you like a different size?','你想換其他尺寸嗎？','先問有沒有大一點的，再把 M 號拿到鏡子前。','Do you have / bigger one','Do you have a bigger one?','size',['S','M','L'],1,'已換上 M 號。鏡中的衣服變得合身了。',{set:'size'}),
 step('Here is the medium. How does it feel?','這是 M 號。穿起來感覺如何？','看看新的試穿結果，先說合身，再選符合的感受。','It / fits well','It fits well.','fit',['太緊','剛好','太鬆'],1,'M 號合身。可以挑選最後喜歡的顏色。'),
 step('We also have it in another color. Which one do you prefer?','我們還有另一個顏色。你比較喜歡哪件？','比較兩件 M 號。指著喜歡的那件說「我比較喜歡這件」，再選它。兩件都可以。','I like / this one / better','I like this one better.','compare',['原本顏色','另一個顏色'],null,'你已選好喜歡的顏色，下一步向店員確認。',{set:'compare'}),
 step('', '', '先用英文確認顏色和尺寸，再說要買這件，最後放入購物袋。','Yes / I’ll take it','Yes, I’ll take it, please.','bag',['確認這件，放入購物袋'],0,'你完成了詢問、試穿、換尺寸與比較。',{dynamic:true})
]},{name:'換個顏色，也換個尺寸',en:'FIND YOUR FAVORITE',desc:'練習其他顏色、缺貨時換選擇，把太鬆的 L 號換成 M 號。',turns:[
 step('Welcome! This pink T-shirt is a large.','歡迎！這件粉紅色 T-shirt 是 L 號。','想看看別的顏色。先詢問是否有其他顏色，再點色卡。','Do you have / another color','Do you have this in another color?','ask',['打開其他顏色色卡'],0,'店員正在幫你查看庫存。'),
 step('We have blue and green in large. Pink is sold out in medium.','L 號有藍色和綠色。粉紅色的 M 號賣完了。','先說你想試的顏色，再選藍色或綠色的 L 號。','Can I try / blue / green','Can I try the green one on?','rack',['藍色 · L','綠色 · L','粉紅色 · M（缺貨）'],null,'已拿好你選的 L 號，準備試穿。',{set:'color',allowed:[0,1],why:'粉紅色 M 號已售完。可以選藍色或綠色的 L 號先試穿。'}),
 step('Sure. The fitting room is on the left, opposite the checkout.','可以。試衣間在左邊，收銀台對面。','先用英文確認位置，再點選正確的門。','On the left / opposite / checkout','On the left, opposite the checkout, right?','room',['左側試衣間','右側倉庫'],0,'布簾已打開。穿上 L 號，看看鏡子。',{set:'room'}),
 step('Is the large okay?','L 號可以嗎？','看鏡中的肩線與衣身：衣服太寬鬆。先告訴店員，再選感受。','It’s too / loose','It’s too loose.','fit',['剛好','太緊','太鬆'],2,'已記下：L 號太鬆，需要小一點。'),
 step('We have a medium in that color, too.','這個顏色也有 M 號。','先問有沒有小一點的，再把 M 號拿進試衣間。','Do you have / smaller one','Do you have a smaller one?','size',['S','M','L'],1,'已換上同色 M 號，衣身不再鬆垮。',{set:'size'}),
 step('How about this one?','這件如何？','先表達這件合身，再選符合鏡中結果的感受。','It / fits well','It fits well.','fit',['剛好','太鬆','太緊'],0,'尺寸已確認，可以比較顏色。'),
 step('Both colors are available in medium. Which one do you like better?','這兩個顏色都有 M 號。你比較喜歡哪件？','兩件都是 M 號。先指著喜歡的說明，再選要買的顏色。','I like / this one better','I like this one better.','compare',['原本顏色','另一個顏色'],null,'已保留你喜歡的那一件。',{set:'compare'}),
 step('','','先確認尺寸與顏色，再說「我要買這件」，放進購物袋。','Yes / I’ll take it','Yes, I’ll take it, please.','bag',['確認這件，放入購物袋'],0,'你完成了換顏色、找試衣間、換小一號與選購。',{dynamic:true})
]}];
const missions=[
 {name:'想換大一點',field:'sizeNote',task:'你試穿一件藍色 S 號 T-shirt，覺得太緊。說明問題，詢問大一點的，並指定 M 號。',hint:'too tight / bigger / medium',answer:'It’s too tight. Do you have a bigger one? Do you have this in medium?'},
 {name:'想換小一點',field:'fitNote',task:'你試穿綠色 L 號 T-shirt，覺得太鬆。請店員拿小一點的，再詢問能不能試穿。',hint:'too loose / smaller / try',answer:'It’s too loose. Do you have a smaller one? Can I try this on?'},
 {name:'換色與比較',field:'colorNote',task:'你想看其他顏色，並問試衣間在哪。兩件都合身，指著比較喜歡的那件，告訴店員要買它。',hint:'another color / fitting rooms / better / take',answer:'Do you have this in another color? Where are the fitting rooms? I like this one better. I’ll take it.'}
];
const pairCards=[
 {name:'太緊的上衣',a:'你拿著藍色 S 號上衣。問能否試穿、試衣間在哪。試穿後太緊，想換大一點。最後確認顏色與尺寸。',b:'試衣間在右邊。藍色有 S、M、L，綠色只有 M。先等顧客問，再給資訊。換 M 號後詢問合不合身。',hint:'The fitting rooms are on the right. / Here is the medium. / How does it fit?'},
 {name:'太鬆與缺貨',a:'你拿著粉紅色 L 號上衣，試穿後太鬆。想換粉紅色 M 號；若沒有，問其他顏色，再挑一件。',b:'粉紅色 M 號缺貨；藍色、綠色 M 號有貨。試衣間在左邊。等對方詢問再說明缺貨與替代顏色。',hint:'Sorry, pink is sold out in medium. / We have blue and green. / Would you like to try one on?'},
 {name:'兩件都合身',a:'你想試藍色與綠色 M 號。問試穿和試衣間位置，試穿後說兩件都合身，再比較並選一件買。',b:'兩種顏色都有 M 號。試衣間在收銀台對面。問顧客偏好哪件，最後確認顏色與尺寸。',hint:'The fitting rooms are opposite the checkout. / Which one do you like better? / The blue one in medium?'}
];
const fields=['before','after','sizeNote','fitNote','colorNote','pairNote','homeNote','teacherFeedback'];
const skills=['我能詢問尺寸、顏色、試穿與試衣間位置','我能描述太緊或太鬆，要求換大或換小','我能比較兩件衣服，確認尺寸與顏色後決定購買'];
const homeLine='The green T-shirt is available in medium. Blue is only available in large. The fitting rooms are on the right.';
const pairActivities=[
 {name:'太緊的上衣',task:'你正在試穿一件藍色 S 號上衣，胸口覺得太緊。你想換一件合身的，再決定要不要買。',goal:'讓店員理解不合身的地方，並確認最後的尺寸與決定。',first:'學生',opening:'這件衣服穿起來太緊了。',start:'老師聽完後，回應換尺寸的需要。',stockTags:['藍色 S／M／L：有貨'],line:'How does it fit?',zh:'穿起來合身嗎？',goals:['告訴店員：這件穿起來太緊。','詢問有沒有大一點的尺寸。','回答店員：換尺寸後是否合身。','確認最後的尺寸，並表達購買或不買的決定。'],stock:'藍色 S、M、L 都有貨。顧客要求換大時，先提供 M 號；由學生描述換上後的感受。',guide:[['學生說太緊','Would you like to try a larger size?','詢問是否想試大一點的。'],['學生要求換大一點','Here is the medium. How does it fit?','提供 M 號，再問穿起來如何。'],['學生說明換穿感受','Would you like to take it?','讓學生自行決定是否購買。']],cue:'先提醒「說明哪裡不合身，再問能不能換大一點」；仍卡住時給 too tight / bigger / medium。',sample:'It’s too tight. Do you have a bigger one? It fits well. I’ll take the medium, please.'},
 {name:'太鬆與缺貨',task:'你試穿粉紅色 L 號上衣，覺得太鬆，想換粉紅色 M 號。先問店員，再依對方提供的選擇做決定。',goal:'把換小的需求說清楚，遇到缺貨時還能接著問或做決定。',first:'學生',opening:'這件太鬆了，有小一點的嗎？',start:'老師聽完後，確認需要的尺寸，再提供庫存資訊。',stockTags:['粉紅色 M：缺貨','藍色 M：有貨','綠色 M：有貨'],line:'Is the large okay?',zh:'L 號可以嗎？',goals:['告訴店員：L 號太鬆。','要求小一點的，並說出想要的尺寸。','聽到庫存資訊後，詢問其他顏色或選擇。','確認最後的顏色與尺寸，或禮貌地表示不買。'],stock:'粉紅色 M 號缺貨；藍色與綠色 M 號有貨。等學生要求 M 號時再告知缺貨，不要先把全部庫存說完。',guide:[['學生提出換小的需求','What size would you like?','讓學生說出需要 M 號。若已經說了，直接往下接。'],['學生要求粉紅色 M 號','Sorry, pink is sold out in medium.','告知缺貨，先留時間讓學生追問。'],['學生詢問其他選擇','We have blue and green in medium.','提供替代顏色，再讓學生決定。'],['學生選好顏色','The green one in medium?','綠色 M 號，對嗎？（依實際選擇換成 blue 或 green。）'],['學生決定不買','No problem.','沒問題。']],cue:'先提醒「你還可以問別的顏色，或說先不買」；仍卡住時給 too loose / smaller / another color。',sample:'It’s too loose. Do you have this in medium? Do you have it in another color? I’ll take the blue one in medium, please.'},
 {name:'兩件都合身',task:'你剛試穿藍色與綠色 M 號上衣，兩件都合身。你可以自由決定較喜歡哪件，再告訴店員。',goal:'表達試穿感受與偏好，和店員確認最後的購物決定。',first:'老師',opening:'這兩件，你比較喜歡哪一件？',start:'學生指著喜歡的衣服，用自己的英文回答。',stockTags:['藍色 M：有貨','綠色 M：有貨'],line:'Which one do you like better?',zh:'你比較喜歡哪一件？',goals:['指出自己比較喜歡的顏色。','用自己的英文表達比較與偏好。','回答店員：這件是否合身。','和店員確認最後的顏色、尺寸與決定。'],stock:'藍色與綠色都有 M 號，兩件都合身。可指著畫面上的衣服對話。沒有唯一正確的顏色。',guide:[['學生只回答顏色','Do you like this one better?','指著該顏色，鼓勵學生補充表達偏好。'],['學生說出偏好','Does it fit well?','追問是否合身。'],['學生說合身','The blue one in medium?','依學生實際選擇，換成 blue 或 green 再確認。']],cue:'先提醒「指出喜歡的那件，再說合不合身」；仍卡住時給 this one / better / fits well。',sample:'I like this one better. It fits well. I’ll take the green one in medium, please.'}
];
