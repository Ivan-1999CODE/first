// Part 03 only. The same authored steps used by Part 02 remain the source of
// answers, allowed choices, speech and persistence. All drawings are inline/offline.
// Some picture questions need an extra detail in the spoken reply. Keep it
// scoped to Part 03 and use the same line for listening, replay and transcript.
function vfPracticeDialogue(step) {
 return step.practiceReply ? {...step, ...step.practiceReply} : step;
}
// Part 03 navigates actual utterances, including both sides of each exchange.
let vfBackAction=null;
function vfReviewStart(){return 0;}
function vfPreviousUtterance({steps,index,heard,spoken,start=0}){
 const order=s=>s.askFirst?['spoken','heard']:['heard','spoken'];
 const current=order(steps[index]),flags={heard,spoken};
 let position=current.findIndex(role=>!flags[role]);
 if(position<0)position=2;
 if(position===0){if(index<=start)return null;index--;position=2;}
 const previous=order(steps[index]);
 return {index,heard:position===2&&previous[0]==='heard',spoken:position===2&&previous[0]==='spoken'};
}
function vfRewindState(state,target){
 Object.assign(state,target,{choice:-1,feedback:'',done:false});
 state.history=state.history.slice(0,target.index);
}
function vfTranslationPrompt(step){
 return step.answerZh||(typeof answerTranslations==='object'?answerTranslations[step.answer]:'')||'';
}
function vfTranslationHint(step){
 return guidedHint(step.words,step.answer,vfTranslationPrompt(step),'part03-'+(step.id||step.key||step.answer));
}
function vfDialogueNavigation(content,{steps,index,heard,spoken,restart,start=0,onBack,onPrelude}){
 const target=vfPreviousUtterance({steps,index,heard,spoken,start});
 vfBackAction=target?()=>onBack(target):onPrelude||null;
 return `${content}<div class="vf-dialogue-navigation">
  ${btn('← 上一句','data-vf-back',vfBackAction?'':'disabled')}${restart}
 </div>`;
}
document.addEventListener('click',event=>{
 const button=event.target.closest('[data-vf-back]');
 if(!button||button.disabled||!vfBackAction)return;
 stopAudio();dgResetSupport();vfQuantityDraft=null;
 vfBackAction();
 const target=document.querySelector('#ci-flow-turn,#hotel-flow-turn,.dg-speaker .dg-task')||document.querySelector('[data-dg-prelude-heard]');
 target?.setAttribute('tabindex','-1');target?.focus({preventScroll:true});
 if(target){const rect=target.getBoundingClientRect();if(rect.top<(typeof dgStickyHeight==='function'?dgStickyHeight():0)+16||rect.bottom>innerHeight-32)target.scrollIntoView({block:'center',behavior:'instant'});}
});
function vfKind(t) {
 if(t.choiceKind)return t.choiceKind;
 const labels=t.objects.map(o=>o[1]).join(' '), key=t.label||t.task||'';
 if(/冰|糖/.test(labels))return 'drink';
 if(/路口/.test(labels))return 'route';
 if(/靠走道|靠窗/.test(labels))return 'seat';
 if(/左|右/.test(labels))return 'direction';
 if(/牛排|蛋的做法/.test(key)||t.foodKind)return 'food';
 if(/\d+\s*(瓶|條|張|件行李|人桌)|兩人桌|四人桌/.test(labels))return 'quantity';
 if(/單程票|來回票/.test(labels))return 'ticket';
 if(/買這個杯子/.test(labels))return 'cup';
 if(/毛巾|棉被|一些水|餐巾紙/.test(labels))return 'supplies';
 if(/美元|預算|每瓶|總共|總價/.test(labels))return 'money';
 if(/分鐘|小時|\d+[:：]\d+|\d+\s*點/.test(labels))return 'time';
 if(/\d+\s*(天|晚)|今晚|明天|已有安排|還沒有安排/.test(labels))return 'calendar';
 if(/登機門|月台/.test(labels)||/確認 \d+ 號/.test(labels))return 'gate';
 if(/綠線|紅線|轉乘/.test(labels))return 'transit';
 if(/公車|計程車|司機|下車|停車|繼續前進|這班有到|這班沒有到/.test(labels))return 'vehicle';
 if(/太小|太大|合身|換大|換小|[SML] 號|上衣|T-shirt|鞋子|顏色|藍色|紅色|綠色|試穿/.test(labels)&&!/包|行李/.test(labels))return 'clothes';
 if(/刷卡|現金/.test(labels))return 'payment';
 if(/護照|房卡|訂房|Alex|Jamie|入住|退房/.test(labels))return 'document';
 if(/內用|外帶/.test(labels))return 'packing';
 if(/袋子|包包|行李箱/.test(labels))return 'bag';
 if(/冷氣|電視|來房間查看/.test(labels))return 'repair';
 if(/雞肉|三明治|義大利|沙拉|吐司|餅乾|食物|餐點|菜單|早餐|加點|拿水|拿茶|訂餐/.test(labels))return 'food';
 if(/度假|出差|臺灣|日本|家人|朋友|獨自|打招呼|工作/.test(labels))return 'people';
 if(/拍照|健行|閱讀|有趣|很棒|無聊|人很多|沒有人|不喜歡/.test(labels))return 'activity';
 if(/飯店|Hotel|博物館|入口|車站|郵局|警局|服務台|售票|集合|位置|休館|有開|廁所|出口|號房|River Market|Central Station/.test(labels))return 'place';
 return 'conversation';
}
function vfSvg(content,label='') {return `<svg class="vf-art" viewBox="0 0 240 150" role="img" aria-label="${esc(label)}" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">${content}</svg>`;}
const vfText=(s,x=120,y=85,size=23)=>`<text x="${x}" y="${y}" text-anchor="middle" fill="currentColor" stroke="none" font-size="${size}" font-family="system-ui">${esc(s)}</text>`;
const vfPerson=(x,y=54,scale=1)=>`<g transform="translate(${x} ${y}) scale(${scale})"><circle cy="-17" r="10" class="vf-fill"/><path d="M-18 38V12Q-18 0 0 0Q18 0 18 12V38M0 4V42M-11 42V62M11 42V62"/></g>`;
function vfNumber(label) {const m=label.match(/(\d+)\s*(瓶|條|張|件行李|人桌)/);return m?Number(m[1]):/兩人桌/.test(label)?2:/四人桌/.test(label)?4:1;}
function vfArt(label,t) {
 const k=vfKind(t),n=vfNumber(label),no=/不加|沒有|不能|不含|不買|不訂|不再|未|拒絕/.test(label);
 let a='';
 if(k==='drink') {
  const ice=/冰/.test(label)?(/不加冰/.test(label)?0:/少冰/.test(label)?2:6):0;
  a='<path d="M70 23H170L158 133H82Z"/><path d="M78 65H162L155 129H85Z" fill="#b97b37" fill-opacity=".55" stroke="none"/>';
  for(let j=0;j<ice;j++)a+=`<rect x="${88+j%3*23}" y="${70+Math.floor(j/3)*26}" width="18" height="18" rx="3" fill="#d6f3ff" stroke="#497a8c" transform="rotate(${j%2?12:-8} ${97+j%3*23} ${79+Math.floor(j/3)*26})"/>`;
  if(/糖/.test(label)) {a+='<ellipse cx="196" cy="40" rx="16" ry="23"/><path d="M196 63V120"/>';if(!/不加糖/.test(label))a+=/少糖/.test(label)?'<path d="M185 48L196 41L207 48Z" fill="#eee4cc"/>':'<path d="M182 48L196 22L210 48Z" fill="#eee4cc"/>';else a+='<path d="M179 20L211 61" class="vf-warning"/>';}
  if(no&&/冰/.test(label))a+=vfText('0',120,100,25);
 } else if(k==='route'||k==='direction') {
  const right=/右/.test(label),y=/第二/.test(label)?42:94,x=right?205:35;
  a='<path d="M120 140V15M22 42H218M22 94H218" stroke-width="16" class="vf-road"/>';
  a+=`<path d="M120 138V${y}H${x}" class="vf-accent" stroke-width="5"/><path d="M${x+(right?-12:12)} ${y-8}L${x} ${y}L${x+(right?-12:12)} ${y+8}" class="vf-accent"/>`;
 } else if(k==='cup') {
  a='<path d="M65 40H155V105Q110 140 65 105Z" class="vf-fill"/><path d="M155 50H178Q207 85 155 95M55 133H175"/>';if(/不買/.test(label))a+='<path d="M40 25L200 140" class="vf-warning"/>';
 } else if(k==='ticket') {
  a='<path d="M28 40H212V65Q190 75 212 85V120H28V85Q50 75 28 65Z" class="vf-fill"/><path d="M67 68H173L163 58M173 68L163 78"/>';if(/來回/.test(label))a+='<path d="M173 97H67L77 87M67 97L77 107"/>';
 } else if(k==='quantity'||k==='supplies') {
  for(let j=0;j<Math.min(n,6);j++) {
   const x=120+(j-(Math.min(n,6)-1)/2)*33;
   if(/水|瓶/.test(label))a+=`<path d="M${x-7} 40V53L${x-12} 63V115Q${x} 122 ${x+12} 115V63L${x+7} 53V40Z" class="vf-fill"/><path d="M${x-12} 76H${x+12}"/>`;
   else if(/行李/.test(label))a+=`<rect x="${x-13}" y="55" width="26" height="57" rx="6" class="vf-fill"/><path d="M${x-7} 55V40H${x+7}V55M${x-8} 114V120M${x+8} 114V120"/>`;
   else if(/人桌/.test(label))a+=vfPerson(x,55,.65);
   else a+=`<rect x="${x-14}" y="48" width="28" height="64" rx="4" class="vf-fill"/><path d="M${x-10} 100H${x+10}"/>`;
  }
  a+='<path d="M25 123H215"/>';
 } else if(k==='seat') {
  for(let j=0;j<4;j++)a+=`<rect x="${36+j*44+(j>1?10:0)}" y="45" width="30" height="50" rx="7" class="${j===(/靠窗/.test(label)?0:1)?'vf-selected-fill':'vf-fill'}"/>`;
  a+='<path d="M20 25V125M220 25V125M120 22V130" stroke-dasharray="5 8"/>'+vfText('窗',19,18,14)+vfText('走道',120,145,14);
 } else if(k==='money') {
  const value=label.match(/\d+(?:\.\d+)?/)?.[0]||'?';
  a='<path d="M64 12H176V138L162 130L148 138L134 130L120 138L106 130L92 138L78 130L64 138Z" class="vf-fill"/><path d="M82 38H158M82 110H158"/>'+vfText('$'+value,120,85,31)+vfText(/超出預算/.test(label)?'超出預算 ↑':/在預算內/.test(label)?'預算內 ✓':/總|共/.test(label)?'總價':/預算/.test(label)?'預算':'價格',120,105,14);
 } else if(k==='time') {
  const m=label.match(/(\d+)(?:[:：](\d+))?/),hour=Number(m?.[1]||0),minute=/點半/.test(label)?30:Number(m?.[2]||0),duration=/分鐘|小時/.test(label);
  const angle=((hour%12)+minute/60)*Math.PI/6,ma=minute*Math.PI/30;
  a='<circle cx="72" cy="72" r="47" class="vf-fill"/>';
  a+=duration?'<path d="M72 38V72L98 88"/>':`<path d="M72 72L${72+Math.sin(angle)*28} ${72-Math.cos(angle)*28}M72 72L${72+Math.sin(ma)*39} ${72-Math.cos(ma)*39}"/>`;
  a+=vfText(duration?hour+' 分':hour+':'+String(minute).padStart(2,'0'),177,81,23);
  a+=vfText(/每.*班/.test(label)?'班距':/車程/.test(label)?'車程':/明/.test(label)?'明天':/今晚/.test(label)?'今晚':'',177,108,15);
 } else if(k==='calendar') {
  a='<rect x="35" y="27" width="170" height="105" rx="8" class="vf-fill"/><path d="M35 55H205M65 17V37M175 17V37"/>';
  const days=Number(label.match(/\d+/)?.[0]||0);
  a+=vfText(days?days+(/晚/.test(label)?' 晚':' 天'):/明/.test(label)?'明天':'今天',120,92,27);
  a+=vfText(/安排|不能/.test(label)?'已有行程':'行程卡',120,118,14);
 } else if(k==='clothes') {
  const color=/藍/.test(label)?'#4d8ec9':/綠/.test(label)?'#569c78':/紅/.test(label)?'#c35e68':'#8a91b2';
  const width=/太大|L 號/.test(label)?1.18:/太小|S 號/.test(label)?.8:1;
  a=vfPerson(120,40,1.25)+`<g transform="translate(120 0) scale(${width} 1) translate(-120 0)"><path d="M90 42L55 64L70 89L89 78V132H151V78L170 89L185 64L150 42Q120 63 90 42Z" fill="${color}"/></g>`+vfText(label.match(/[SML](?= 號)/)?.[0]||(/合身/.test(label)?'✓':''),120,100,25);
 } else if(k==='payment') {
  a=/現金/.test(label)?'<rect x="35" y="40" width="155" height="75" rx="7" class="vf-fill"/><rect x="49" y="52" width="128" height="50" rx="12"/>'+vfText('$',114,88,28):'<rect x="40" y="35" width="160" height="88" rx="9" class="vf-fill"/><path d="M42 61H198" stroke-width="14"/><rect x="60" y="86" width="24" height="19" rx="3"/>';
 } else if(k==='gate'||k==='place'||k==='direction') {
  a='<path d="M34 130V52H206V130M24 130H216M46 52V25H194V52" class="vf-fill"/><path d="M102 130V84H138V130M55 75H79V95H55ZM160 75H184V95H160Z"/>';
  a+=vfText(label.match(/\d+/)?.[0]||(/休館/.test(label)?'休館':/有開/.test(label)?'OPEN':/Hotel|飯店/.test(label)?'HOTEL':/郵局/.test(label)?'POST':/入口|大門/.test(label)?'入口':/服務台/.test(label)?'i':/廁所/.test(label)?'WC':'目的地'),120,46,18);
  if(/博物館/.test(label))a+='<path d="M49 52L120 12L191 52M65 57V123M86 57V123M154 57V123M175 57V123"/>';
  if(/車站/.test(label))a+='<path d="M108 90H132V115H108ZM108 119L103 130M132 119L137 130"/>';
 } else if(k==='vehicle') {
  a='<rect x="30" y="35" width="180" height="83" rx="14" class="vf-fill"/><path d="M48 53H192V84H48ZM85 53V84M132 53V84"/><circle cx="65" cy="122" r="12"/><circle cx="178" cy="122" r="12"/>';
  a+=vfText(label.match(/\d+/)?.[0]||(/停|下車/.test(label)?'STOP':/計程車|司機/.test(label)?'TAXI':'BUS'),120,108,19);
  if(/這班沒有到/.test(label))a+='<path d="M45 23L195 135" class="vf-warning"/>';
 } else if(k==='transit') {
  const c=/紅/.test(label)?'#bf5962':'#418268';a=`<path d="M25 110H85V45H215" stroke="${c}" stroke-width="10"/>`;
  for(const [x,y] of [[25,110],[85,110],[85,45],[150,45],[215,45]])a+=`<circle cx="${x}" cy="${y}" r="7" class="vf-fill"/>`;
  a+=`<circle cx="${/Central/.test(label)?85:150}" cy="45" r="14"/>`;
 } else if(k==='document') {
  a='<rect x="55" y="20" width="130" height="115" rx="8" class="vf-fill"/><circle cx="88" cy="63" r="15"/><path d="M68 102Q88 72 108 102M122 54H170M122 72H170M122 90H155"/>';
  a+=vfText(/護照/.test(label)?'PASSPORT':/房卡/.test(label)?'305':/Jamie/.test(label)?'Jamie Lin':/Alex/.test(label)?'Alex Chen':/退房/.test(label)?'CHECK OUT':'CHECK IN',120,121,14);
 } else if(k==='packing'||k==='bag') {
  a=/內用/.test(label)?'<ellipse cx="120" cy="87" rx="75" ry="36" class="vf-fill"/><ellipse cx="120" cy="87" rx="52" ry="24"/><path d="M25 40V120M210 40V120M18 40V65H32V40"/>':'<path d="M55 55H185L195 135H45Z" class="vf-fill"/><path d="M90 55V36Q120 5 150 36V55"/>';
  if(/黑色/.test(label))a+='<rect x="68" y="66" width="104" height="57" rx="4" fill="#343b44"/>';
  if(/藍色/.test(label))a+='<rect x="68" y="66" width="104" height="57" rx="4" fill="#4d8ec9"/>';
  a+=vfText(/自己/.test(label)?'我的袋子':/外帶/.test(label)?'TO GO':'',120,105,17);
 } else if(k==='repair') {
  a=/冷氣/.test(label)?'<rect x="30" y="25" width="180" height="58" rx="10" class="vf-fill"/><path d="M45 66H195M65 95V120M120 95V130M175 95V120"/>':'<rect x="38" y="22" width="164" height="95" rx="6" class="vf-fill"/><path d="M120 117V135M88 135H152"/>';
  a+='<path d="M105 42L135 72M135 42L105 72" class="vf-warning"/>';
  if(/來房間查看|自己去大廳/.test(label))a=vfPerson(/自己/.test(label)?60:175,50,.85)+'<path d="M95 135V20H145V135"/>'+vfText(/自己/.test(label)?'→ 大廳':'← 到房間',120,145,15);
 } else if(k==='food') {
  if(t.foodKind&&typeof foodArtwork==='string'){
   const o=phrases.flatMap(p=>p.illustratedOptions||[]).find(o=>label.startsWith(o.en+'｜'));
   if(o)return `<div class="vf-food-image" role="img" aria-label="${esc(label)}" style="background-image:url('${foodArtwork}');background-position:${o.cell%3*50}% ${Math.floor(o.cell/3)*100/3}%"></div>`;
  }
  a='<ellipse cx="120" cy="102" rx="88" ry="32" class="vf-fill"/>';
  if(/菜單/.test(label))a='<path d="M120 35Q60 15 30 35V125Q70 105 120 125Q170 105 210 125V35Q165 15 120 35V125" class="vf-fill"/><path d="M48 55H98M48 75H98M143 55H190M143 75H190"/>';
  else if(/水|茶/.test(label))a+='<path d="M90 30H150L142 112H98Z" fill="#74b4c5" fill-opacity=".4"/>';
  else if(/餅乾/.test(label))a+='<circle cx="100" cy="82" r="27" fill="#c9a46d"/><circle cx="143" cy="91" r="23" fill="#c9a46d"/><path d="M90 72H91M108 92H109M146 88H147" stroke-width="7"/>';
  else if(/義大利|沙拉/.test(label))a+='<path d="M65 90Q85 40 115 80T175 80M70 100Q100 55 135 95T170 65" stroke="#8b9a54" stroke-width="10"/>';
  else a+='<path d="M70 100L118 40L175 100Z" fill="#d5ad70"/><path d="M78 96H167" stroke="#6b9558" stroke-width="9"/>';
  if(/不含|不再/.test(label))a+='<path d="M45 28L195 128" class="vf-warning"/>';
 } else if(k==='people') {
  const total=/家人/.test(label)?3:/朋友|互相/.test(label)?2:1;
  for(let j=0;j<total;j++)a+=vfPerson(120+(j-(total-1)/2)*55,60,.9);
  a+=vfText(/臺灣/.test(label)?'臺灣':/日本/.test(label)?'日本':/度假/.test(label)?'旅行':/出差|工作/.test(label)?'工作':'',120,143,16);
 } else if(k==='activity') {
  if(/拍照/.test(label))a='<rect x="45" y="48" width="150" height="75" rx="10" class="vf-fill"/><circle cx="120" cy="85" r="27"/><path d="M78 48V30H135V48"/>';
  else if(/健行/.test(label))a='<path d="M20 130L91 25L135 90L164 50L220 130Z" class="vf-fill"/>'+vfPerson(128,83,.55);
  else if(/閱讀/.test(label))a='<path d="M120 38Q60 15 35 35V120Q80 100 120 125Q160 100 205 120V35Q160 15 120 38V125" class="vf-fill"/>';
  else {a='<circle cx="120" cy="74" r="51" class="vf-fill"/><circle cx="102" cy="60" r="3"/><circle cx="138" cy="60" r="3"/>';a+=/無聊|不喜歡/.test(label)?'<path d="M98 96H142"/>':'<path d="M95 89Q120 115 145 89"/>';}
 } else {
  a=vfPerson(65,66,.85)+vfPerson(179,66,.85)+'<path d="M91 22H153V62H118L100 78V62H91Z" class="vf-fill"/>';
  a+=vfText(/重|再次|再聽/.test(label)?'↻':/沒有|不|未|掛/.test(label)?'…':/謝|招呼/.test(label)?'♡':'!',122,51,25);
 }
 return vfSvg(a,label);
}
function vfDimension(t){return ({cup:'是否要買這個杯子',ticket:'單程或來回',drink:'冰塊或加糖量',route:'第幾個路口，以及轉彎方向',direction:'左右位置',seat:'窗邊與走道的位置',quantity:'實物數量',money:'單價、總價或預算',time:'時間或分鐘數',calendar:'日期與天數',clothes:'衣服的尺寸、顏色與合身程度',gate:'門號或月台號碼',transit:'路線與轉乘站',vehicle:'車號、目的地或上下車位置',document:'姓名、證件或入住資料',payment:'店家接受的付款方式',place:'地點與開放狀態',people:'人物與同行關係',activity:'誰的興趣與感受',supplies:'要送的物品與房號',food:'餐點與做法',packing:'內用或外帶',bag:'袋子與物品特徵',repair:'要報修的設備',social:'對方這句話的用途',service:'店員現在的安排','cash-set':'每張鈔票加起來的金額',record:'資料卡上的所有條件','requested-item':'對方現在要的資料或物品',decision:'時間、金額與自己的限制',resize:'衣服與身體的比例','outfit-bag':'袋子裡的款式與顏色',parcel:'房號、物品與數量','ticket-set':'成人與兒童的票種及張數','people-pair':'每個人的興趣','location-note':'服務台旁的地標',conversation:'這次要表達的意思'})[vfKind(t)];}
function vfFeedback(t,index){
 if(index<0)return '依剛才的對話選擇；選好後才會顯示回饋。';
 const label=t.objects[index][1];
 if(t.choiceReview?.mode==='preference')return `已記下：${label}。請確認這就是你剛才用英文說的偏好，再繼續。`;
 return t.valid.includes(index)?`✓ 已完成：${label}。${t.result||t.effect||'與這次對話相符，可以繼續。'}`:`請核對${vfDimension(t)}。可以重聽對方，再選一次；需要時也能打開文字提示。`;
}
function vfMap(t,selected,ready,attr) {
 const route=vfKind(t)==='route';
 const coords=t.objects.map((o,i)=>({x:/右/.test(o[1])?77:23,y:route?(/第二/.test(o[1])?29:66):52}));
 const spot=coords[selected];
 return `<div class="vf-map"><svg viewBox="0 0 400 280" preserveAspectRatio="none" role="img" aria-label="示意地圖，從下方向上走，先經過第一個路口，再到第二個路口" fill="none"><path d="M200 255V20M30 81H370M30 185H370" class="vf-road" stroke-width="32"/><path d="M200 255V20M30 81H370M30 185H370" stroke="currentColor" opacity=".35" stroke-dasharray="6 8"/>${spot?`<path d="M200 255V${spot.y*2.8}H${spot.x*4}" class="vf-accent" stroke-width="7"/>`:''}<circle cx="${spot?spot.x*4:200}" cy="${spot?spot.y*2.8:255}" r="11" class="vf-selected-fill"/></svg><span class="vf-road-name first">第一個路口</span><span class="vf-road-name second">第二個路口</span><span class="vf-origin">起點 ↑</span>${t.objects.map((o,i)=>`<button type="button" class="object vf-hotspot" style="left:${coords[i].x}%;top:${coords[i].y}%" ${attr}="${i}" ${ready?'':'disabled'} aria-pressed="${selected===i}">${esc(o[1])}${selected===i?'<span class="vf-arrived">● 你在這裡</span>':''}</button>`).join('')}</div>`;
}
let vfQuantityDraft=null;
const vfResetTurn=resetTurn;
resetTurn=function(){vfQuantityDraft=null;vfResetTurn();};
function vfQuantity(t,ready,opts,selected){
 const count=vfQuantityDraft?.id===t.id?vfQuantityDraft.count:selected>=0?vfNumber(t.objects[selected][1]):0;
 const sample=t.objects[0][1],label=sample.replace(/\d+(?=\s*(瓶|條|張|件行李|人桌))/,String(count));
 return `<div class="vf-counter"><div class="vf-counter-tray">${count?vfArt(label,t):'<p class="vf-empty">準備區還是空的</p>'}</div><div class="vf-counter-controls"><button type="button" data-vf-delta="-1" ${ready&&count>0?'':'disabled'} aria-label="拿走一個">− 拿走</button><output aria-live="polite">${count}</output><button type="button" data-vf-delta="1" ${ready&&count<6?'':'disabled'} aria-label="放入一個">＋ 放入</button></div><p class="fine">每按一次，放入或拿走一個。數量符合對話後再繼續。</p></div><details class="vf-direct" ${selected>=0&&vfQuantityDraft===null?'open':''}><summary>也可以直接放入一組</summary><div class="objects vf-objects">${opts}</div></details>`;
}
function vfSpatial(t,selected,ready,attr){
 const seat=vfKind(t)==='seat';
 return `<div class="vf-spatial ${seat?'vf-airplane':'vf-corridor'}"><p class="vf-spatial-label">${seat?'窗邊 │ 座位 │ 走道':'面朝前方 ↑'}</p><div class="vf-spatial-options">${t.objects.map((o,i)=>`<button type="button" class="object vf-object" ${attr}="${i}" ${ready?'':'disabled'} style="order:${/左|靠窗/.test(o[1])?0:1}" aria-pressed="${selected===i}">${vfArt(o[1],t)}<span>${esc(o[1])}</span>${selected===i?'<span class="vf-arrived">● 你的位置</span>':''}</button>`).join('')}</div></div>`;
}
// Picture application tasks keep the known speaking goal, but require reading
// the picture rather than matching the same Chinese answer twice.
function vfChoiceChallenge(t){
 const k=vfKind(t),labels=t.objects.map(o=>o[1]),all=pattern=>labels.every(l=>pattern.test(l));
 let prompt=t.choicePrompt||'',pictures=false;
 if(k==='seat'){prompt='在座位圖上，點出符合你需求的位置。';pictures=true;}
 else if(k==='drink'){prompt=all(/糖/)?'觀察杯旁的糖匙，選出符合你需求的飲料。':'觀察杯中的冰塊，選出符合你需求的飲料。';pictures=true;}
 else if(k==='ticket'){prompt='看票上的行程箭頭，選出符合你需求的車票。';pictures=true;}
 else if(k==='quantity'&&!all(/到/)){prompt='看實物的數量，選出這次需要的一組。';pictures=true;}
 else if(k==='payment'){prompt='依剛才的對話，選出要交給店員的付款物件。';pictures=true;}
 else if(k==='packing'){prompt='依剛才的需求，選出餐點應該怎麼裝。';pictures=true;}
 else if(k==='clothes'&&all(/T-shirt|鞋子|[SML] 號|藍色|綠色|太小|太大|合身/)&&!labels.some(l=>/買|只有|沒有|繼續/.test(l))){prompt='觀察款式、標籤、顏色或合身程度，選出符合這次對話的衣服。';pictures=true;}
 else if(k==='activity'&&all(/拍照|健行|閱讀/)){prompt=all(/^旅伴|^對方/)?'替旅伴選出符合剛才對話的興趣圖片。':'選出符合你剛才所說興趣的圖片。';pictures=true;}
 else if(k==='food'&&!t.foodKind&&all(/三明治|義大利麵|沙拉|有帶餅乾|沒有帶食物|拿水|拿茶/)){prompt='看清楚餐點或物品，選出符合剛才對話的圖片。';pictures=true;}
 else if(k==='repair'&&all(/冷氣故障|電視故障/)){prompt='點出這次需要報修的設備。';pictures=true;}
 else if(k==='document'&&all(/出示護照|出示房卡/)){prompt='把對方需要的證件交出去。';pictures=true;}
 else if(k==='people'&&all(/度假|出差/)){prompt='選出能代表這趟旅行目的的圖片。';pictures=true;}
 if(t.pictureChoices!==undefined)pictures=t.pictureChoices;
 return {prompt:t.choicePrompt||prompt,pictures};
}
// Apply the same visible action affordance to cards, map points, seats and doors.
// Keep the original buttons and delegated handlers; informational pictures stay inert.
function vfChoiceArea(t,operation,{selected=-1,ready=false,attr='data-choice',listenOnly=false}={}){
 const box=document.createElement('div');box.innerHTML=operation;
 const challenge=vfChoiceChallenge(t);
 const buttons=[...box.querySelectorAll(`[${attr}]`)];
 const visualOrder=[...buttons].sort((a,b)=>(Number(a.style.order)||0)-(Number(b.style.order)||0));
 buttons.forEach(button=>{
  const index=Number(button.getAttribute(attr)),chosen=selected===index;
  const wrong=chosen&&(Array.isArray(t.valid)?!t.valid.includes(index):Number.isInteger(t.correct)&&t.correct!==index);
  const compact=button.matches('.vf-hotspot,.vf-map-actions button,.vf-seat-button');
  button.classList.add('vf-pick');
  button.dataset.pickState=!ready?'locked':chosen?'selected':'ready';
  button.dataset.result=chosen?(wrong?'wrong':'correct'):'pending';
  button.setAttribute('aria-label','選擇：'+t.objects[index][1]);
  if(challenge.pictures){
   button.querySelectorAll('svg text').forEach(text=>{if(text.textContent==='✓')text.remove();});
   const label=button.querySelector('.dg-object-label')||(button.classList.contains('vf-seat-button')?button.querySelector(':scope > span:not(.vf-seat-shape)'):null);
   if(label){const letter=String.fromCharCode(65+visualOrder.indexOf(button));label.textContent='圖 '+letter;label.classList.add('vf-picture-id');}
  }
  const cue=!ready?'尚未開放':wrong?'再試一次':chosen?'已選取':compact?'點選':'點選這張';
  const icon=!ready?'<svg viewBox="0 0 20 20" aria-hidden="true"><rect x="4" y="8" width="12" height="10" rx="2"/><path d="M6 8V5a4 4 0 0 1 8 0v3"/></svg>':`<span aria-hidden="true">${wrong?'↻':chosen?'✓':'→'}</span>`;
  // The shared action label replaces the older door-only text cue.
  if(button.classList.contains('vf-door-button'))button.lastElementChild?.remove();
  button.insertAdjacentHTML('beforeend',`<span class="vf-choice-action"><span>${cue}</span>${icon}</span>`);
 });
 box.querySelectorAll('[data-vf-delta]').forEach(button=>button.classList.add('vf-adjust'));
 const count=!!box.querySelector('[data-vf-delta]'),kind=vfKind(t);
 const instruction=count?'按 ＋ 或 − 調整數量':kind==='route'?'點選地圖上的方向':kind==='seat'?'點選你要的座位':box.querySelector('.vf-doors')?'點選要前往的門口':box.querySelector('.vf-map-actions')?'點選路線或站名':'請點選一張圖片';
 return `<div class="vf-pick-area" data-ready="${ready}"><div class="vf-pick-toolbar"><span class="vf-mode">${({listen:"聽懂後選擇",apply:"看圖操作",decide:"綜合判斷",preference:"你的偏好"})[t.choiceReview?.mode]||"看圖操作"}</span>${ready&&t.line?`<button type="button" class="vf-replay" data-say="${esc(t.line)}" aria-label="重聽對方說話">↻ 重聽對方</button>`:""}</div><h2 class="vf-pick-heading">${ready?esc(challenge.prompt||instruction):listenOnly?"先聽完對方說話":"先完成聽與說"}</h2><p class="vf-pick-help">${ready?(count?"按 ＋ 或 − 調整實物數量。":"點選圖片作答；選好後可以改選。"):listenOnly?"聽完或讀完文字後，圖片就會開放。":"完成聽與說後，圖片就會開放。"}</p>${box.innerHTML}</div>`;
}
function vfPanel(t,{selected=-1,ready=false,attr='data-choice',previous=[]}={}) {
 // Only an available choice in this step may produce a result. A stale choice
 // must never become an answer preview while the listening/speaking gate is shut.
 selected=ready&&Number.isInteger(selected)&&t.objects[selected]?selected:-1;
 const k=vfKind(t),correct=selected>=0&&t.valid.includes(selected),route=k==='route';
 const result=selected<0?'pending':correct?'correct':'wrong';
 const title=route?'在地圖選路口與方向':k==='drink'?'做出這次要的飲料':k==='quantity'?'把指定數量放到準備區':k==='seat'?'在座位圖選位置':'操作圖片，完成這一步';
 // Stable per-step ordering avoids teaching that the first tile is the answer.
 const order=t.objects.map((o,i)=>({o,i}));if([...t.id||''].reduce((n,c)=>n+c.charCodeAt(0),0)%2)order.reverse();
 const objectLabel=label=>typeof vfTaskObjectLabel==='function'?vfTaskObjectLabel(label,t,previous):label;
 const opts=order.map(({o,i})=>`<button type="button" class="object vf-object" ${attr}="${i}" ${ready?'':'disabled'} aria-pressed="${selected===i}" data-result="${selected===i?result:'pending'}">${vfArt(objectLabel(o[1]),t)}<span class="dg-object-label">${esc(o[1])}${selected===i?(correct?' ✓':' · 再試一次'):''}</span></button>`).join('');
 const canCount=k==='quantity'&&attr==='data-choice'&&t.objects.every(o=>/\d+\s*(瓶|條|張|件行李)/.test(o[1]))&&new Set(t.objects.map(o=>vfNumber(o[1]))).size===t.objects.length;
 let operation=route?vfMap(t,selected,ready,attr):['seat','direction'].includes(k)?vfSpatial(t,selected,ready,attr):canCount?vfQuantity(t,ready,opts,selected):`<div class="objects vf-objects">${opts}</div>`;
 if(typeof vfTaskOperation==='function')operation=vfTaskOperation(t,{selected,ready,attr,previous},operation);
 else operation=vfChoiceArea(t,operation,{selected,ready,attr});
 let resultLabel=selected>=0?objectLabel(t.objects[selected][1]):'';
 if(k==='drink'&&/糖/.test(resultLabel)){const ice=previous.filter(x=>vfKind(x.step)==='drink'&&/冰/.test(x.label)).at(-1);if(ice)resultLabel=ice.label+'、'+resultLabel;}
 return `<section class="vf-interaction" data-vf-kind="${k}" data-result="${result}">${operation}<div class="vf-result" aria-label="你的選擇與回饋">${selected<0?'<span class="vf-empty">尚未選擇 · 點選圖片後顯示結果。</span>':`<div class="vf-result-art">${vfArt(resultLabel,t)}</div><div><span class="fine">你剛才選的是</span><p>${esc(resultLabel)}</p><strong class="vf-verdict">${t.choiceReview?.mode==='preference'?'已記錄你的偏好':correct?'✓ 符合對話，可以繼續':'↻ 還不符合對話，請再試一次'}</strong></div>`}</div><div id="${attr==='data-choice'?'flowFeedback':'hi-visual-feedback'}" class="dg-feedback vf-feedback" ${selected<0?'hidden':''} data-result="${result}" role="status"><p class="feedback ${result==='wrong'?'retry':''}">${esc(vfFeedback(t,selected))}</p></div>${previous.length?`<details class="vf-history"><summary>前面已完成的操作 · ${previous.length} 項</summary><div class="vf-records">${previous.map(x=>`<figure>${vfArt(x.label,x.step)}<figcaption>${esc(x.label)}</figcaption></figure>`).join('')}</div></details>`:''}</section>`;
}
function vfHistory(f,values,limit=f.steps.length){return f.steps.slice(0,limit).flatMap((s,i)=>Number.isInteger(values[i])&&s.objects[values[i]]&&s.valid.includes(values[i])?[{step:s,label:s.objects[values[i]][1]}]:[]);}
const vfOriginalScenePage=scenePage;
scenePage=function(){
 const box=document.createElement('div');box.innerHTML=vfOriginalScenePage();
 const f=flows[flow];
 if(finished){const panel=box.querySelector('.dg-completion > section:last-child');if(panel)panel.insertAdjacentHTML('afterbegin',`<div class="vf-records vf-final">${vfHistory(f,history).map(x=>`<figure>${vfArt(x.label,x.step)}<figcaption>${esc(x.label)}</figcaption></figure>`).join('')}</div>`);return box.innerHTML;}
 if(box.querySelector('[data-dg-prelude-heard]')){
  const choices=[...box.querySelectorAll('[data-dg-prelude-choice]')],list=choices[0]?.closest('.objects');
  choices.forEach(b=>{const label=f.prelude.objects[Number(b.dataset.dgPreludeChoice)][1];b.classList.add('vf-object');b.insertAdjacentHTML('afterbegin',vfArt(label,{objects:f.prelude.objects}));});
  if(list){list.classList.add('vf-objects');list.outerHTML=`<div class="vf-interaction">${vfChoiceArea(f.prelude,list.outerHTML,{selected:choices.findIndex(b=>b.getAttribute('aria-pressed')==='true'),ready:!choices[0].disabled,attr:'data-dg-prelude-choice',listenOnly:true})}</div>`;}
  return box.innerHTML;
 }
 const board=box.querySelector('.scene-board');if(!board)return box.innerHTML;
 const t=currentStep(),ready=heard&&spoken;
 const dialogue=box.querySelector('.dg-flow-back')?.parentElement;
 if(dialogue){
  const restart=dialogue.querySelector('.dg-flow-back [data-start]');
  restart.textContent='重新開始本輪任務';
  const restartMarkup=restart.outerHTML;
  dialogue.querySelector('.dg-flow-back').remove();
  const steps=f.steps.map((_,i)=>i===turn?t:lessonStep(f,i,id=>history[f.steps.findIndex(s=>s.id===id)]));
  dialogue.innerHTML=vfDialogueNavigation(dialogue.innerHTML,{key:'task-'+flow,steps,index:turn,heard,spoken,restart:restartMarkup,role:course.replyRole,start:vfReviewStart(),onBack:target=>{turn=target.index;heard=target.heard;spoken=target.spoken;choice=-1;feedback='';history=history.slice(0,turn);render();},onPrelude:course.day===1&&f.prelude?()=>{dgPrelude.done=false;dgPrelude.heard=false;dgPrelude.choice=null;resetTurn();history=[];render();}:null});
 }
 const actions=board.querySelector('.dg-flow-actions')?.innerHTML||btn(turn===f.steps.length-1?'完成這段對話 →':'下一句 →','data-act="next"',canNext()?'class="primary"':'disabled');
 const headingId=course.day===5?'d5-scene-action':'focus-scene-action';
 // Do not expose the context's translated answer on the listening test board.
 board.innerHTML=`${vfPanel(t,{selected:choice,ready,previous:vfHistory(f,history,turn)})}<div class="dg-flow-actions vf-flow-navigation">${actions}</div>`;
 const prompt=board.querySelector('.vf-pick-heading');
 prompt.id=headingId;
 prompt.tabIndex=-1;
 board.dataset.result=choice<0?'pending':accepted(t,choice)?'correct':'wrong';
 return box.innerHTML;
};
document.addEventListener('click',event=>{
 const b=event.target.closest('[data-vf-delta]');if(!b||b.disabled||page!==2||finished||!heard||!spoken)return;
 const t=currentStep(),n=Math.max(0,Math.min(6,(vfQuantityDraft?.id===t.id?vfQuantityDraft.count:choice>=0?vfNumber(t.objects[choice][1]):0)+Number(b.dataset.vfDelta)));
 vfQuantityDraft={id:t.id,count:n};const i=t.objects.findIndex(o=>vfNumber(o[1])===n);
 if(i>=0)choose(i);else{choice=-1;history=history.slice(0,turn);render();const el=document.querySelector('#flowFeedback');el.hidden=false;el.textContent=`你放了 ${n} 個。再核對剛才的數量，繼續放入或拿走。`;}
 document.querySelector(`[data-vf-delta="${b.dataset.vfDelta}"]`)?.focus({preventScroll:true});
});
document.addEventListener('click',event=>{if(event.target.closest('[data-choice]'))vfQuantityDraft=null;},true);
document.addEventListener('change',event=>{if(['heard','spoken'].includes(event.target.id))vfQuantityDraft=null;},true);
