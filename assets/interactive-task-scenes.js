// Topic-specific Part 03 scenes. State is derived from the current conversation,
// never stored separately, so restarting/backtracking cannot retain future facts.
function vfTaskTheme(t) {
 const id=t.id||'';
 if(/-d2-/.test(id))return 'shopping';
 if(/-d3-/.test(id))return /entry/.test(id)?'immigration':/food-and-declaration/.test(id)?'declaration':/gate-and-repeat/.test(id)?'airport-gates':'airport';
 if(/-d4-/.test(id))return /metro|bus-number|get-off/.test(id)?'transit-map':'tickets';
 if(/-d5-/.test(id))return /directions-and-distance/.test(id)?'walking':'taxi';
 if(/-d7-/.test(id))return 'fitting';
 if(/-d8-/.test(id))return /room-supplies/.test(id)?'room-delivery':/room-service/.test(id)?'room-dining':/room-problem/.test(id)?'room-repair':'hotel';
 if(/-d9-/.test(id))return /booking/.test(id)?'reservation':'admission';
 if(/-d10-/.test(id))return /decline-and-reschedule/.test(id)?'invitation':'requests';
 if(/-d11-/.test(id))return 'companions';
 if(/-d12-rescue-/.test(id))return /closed/.test(id)?'new-itinerary':/late/.test(id)?'meeting':'lost-property';
 return null;
}
const vfTaskNames={shopping:'購物櫃檯',airport:'報到與座位',immigration:'這趟旅行的資料',declaration:'打開行李，說明物品','airport-gates':'航廈指標','transit-map':'搭車示意圖',tickets:'車票與候車資訊',walking:'步行路線',taxi:'這一趟乘車',fitting:'衣服與試穿',hotel:'住宿資料','room-delivery':'客房服務推車','room-dining':'客房點餐','room-repair':'客房報修',reservation:'餐廳訂位簿',admission:'入場票夾',invitation:'我的行程與邀請',requests:'禮貌提出需求',companions:'我與旅伴的旅行卡','new-itinerary':'更換行程',meeting:'聯絡與會合','lost-property':'遺失物求助單'};
function vfNewSituation(t) {
 return /換一筆|換另一件|換(?:一)?個接話起點|改由店員|換個問法|切換問法|情境二|情境三/.test(t.sceneTitle||'');
}
function vfSceneRecords(t,previous,selected) {
 let start=0;
 previous.forEach((x,i)=>{if(vfNewSituation(x.step))start=i;});
 const expand=x=>x.step.sceneFacts?x.step.sceneFacts.map((label,i)=>({label,step:{...x.step,id:x.step.id+'-fact-'+i,label:label,objects:[['',label]],choiceKind:undefined,choiceVisuals:undefined,sceneFacts:undefined}})):[x];
 const earlier=(vfNewSituation(t)?[]:previous.slice(start)).flatMap(expand);
 const preview=selected>=0?{step:t,label:t.objects[selected][1]}:null;
 return {earlier,records:preview?[...earlier,...(t.valid.includes(selected)?expand(preview):[preview])]:earlier,preview,valid:preview?t.valid.includes(selected):null};
}
const vfLast=(xs,predicate)=>xs.filter(predicate).at(-1);
function vfSceneFacts(records) {
 const result=new Map();
 for(const x of records){const s=x.step,k=vfKind(s),name=s.label||s.task||'已確認';result.set(name,{...x,kind:k});}
 return [...result.values()];
}
function vfSceneTiles(records,limit=4){
 return `<div class="vf-scene-items">${records.slice(-limit).map(x=>`<figure data-scene-fact="${esc(x.step.id)}">${vfArt(x.label,x.step)}<figcaption>${esc(x.label)}</figcaption></figure>`).join('')||'<p class="vf-scene-empty">等待這次對話確認資訊</p>'}</div>`;
}
function vfSceneSvg(body,label){return `<svg class="vf-topic-art" viewBox="0 0 440 210" role="img" aria-label="${esc(label)}" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;}
function vfSceneCaption(label,x,y,width=160){return `<foreignObject x="${x-width/2}" y="${y}" width="${width}" height="50"><div xmlns="http://www.w3.org/1999/xhtml" class="vf-svg-caption">${esc(label)}</div></foreignObject>`;}
function vfParcel(x,y,label,t,w=105,h=75){return `<foreignObject x="${x}" y="${y}" width="${w}" height="${h}"><div xmlns="http://www.w3.org/1999/xhtml" class="vf-parcel">${vfArt(label,t)}</div></foreignObject>`;}
function vfNamedDoor(x,name,active=false){return `<g><rect x="${x}" y="35" width="100" height="135" rx="6" class="${active?'vf-selected-fill':'vf-fill'}"/><path d="M${x+50} 62V169M${x+13} 62H${x+87}"/><circle cx="${x+78}" cy="116" r="3"/>${vfText(name,x+50,57,17)}</g>`;}
function vfCheckin(records) {
 const bags=vfLast(records,x=>/行李/.test(x.label));const count=bags?vfNumber(bags.label):0;
 let body='<path d="M25 150H415M250 50H400V145H250Z" class="vf-fill"/><path d="M262 84H388"/>'+vfPerson(330,30,.7)+'<rect x="30" y="115" width="190" height="38" rx="18" class="vf-fill"/>';
 for(let i=0;i<count;i++)body+=`<rect x="${60+i*55}" y="55" width="40" height="60" rx="7" class="vf-selected-fill"/><path d="M${69+i*55} 55V43H${91+i*55}V55"/>`;
 body+=vfText(bags?count+' 件行李':'行李待確認',125,188,19)+vfText('報到櫃檯',325,188,19);
 return vfSceneSvg(body,bags?.label||'行李輸送帶與報到櫃檯');
}
function vfSeating(t,ctx) {
 const {selected,ready,attr}=ctx;
 return `<div class="vf-plane"><span class="vf-window-label">窗戶</span><div class="vf-plane-seats">${t.objects.map((o,i)=>`<button type="button" class="object vf-seat-button" ${attr}="${i}" aria-pressed="${selected===i}" ${ready?'':'disabled'} style="order:${/靠窗/.test(o[1])?0:1}"><span class="vf-seat-shape" aria-hidden="true">${selected===i?'●':''}</span><span>${esc(o[1])}</span></button>`).join('')}</div><span class="vf-aisle-label">走道<br>↑<br>↓</span></div>`;
}
function vfDoors(t,ctx) {
 const {selected,ready,attr}=ctx;
 const heading=vfKind(t)==='gate'?/月台/.test(t.objects[0][1])?'依標示找到月台':'沿走廊找到登機門':/試衣間/.test(t.objects[0][1])?'面朝走廊，找試衣間':'面朝大廳，找電梯';
 return `<div class="vf-doors"><p>${heading}</p><div class="vf-door-options">${t.objects.map((o,i)=>`<button type="button" class="object vf-door-button" ${attr}="${i}" ${ready?'':'disabled'} aria-pressed="${selected===i}" style="order:${/左/.test(o[1])?0:/右/.test(o[1])?1:i}"><span class="vf-door-sign">${esc(o[1])}</span><span class="vf-door-panels" aria-hidden="true"><span></span><span></span></span><span>${selected===i?'● 你走到這裡':'點門口前進'}</span></button>`).join('')}</div><div class="vf-door-floor">↑ 你面向前方</div></div>`;
}
function vfTransitMap(t,records,ctx){
 const {selected,ready,attr}=ctx,labels=t.objects.map(o=>o[1]);
 const lineChoice=labels.some(l=>/綠線|紅線/.test(l)),stationChoice=labels.every(l=>/Central Station|River Market/.test(l))&&!labels.some(l=>/有到|沒有到/.test(l));
 const chosen=selected>=0?labels[selected]:'';
 let body='<path d="M35 70H405" stroke="#42936d" stroke-width="10"/><path d="M220 20V150H395" stroke="#c66b74" stroke-width="10"/>';
 for(const [x,y]of [[35,70],[220,70],[405,70],[220,150],[395,150]])body+=`<circle cx="${x}" cy="${y}" r="9" class="vf-fill"/>`;
 if(chosen){const x=lineChoice?(/紅/.test(chosen)?220:110):/Central/.test(chosen)?220:395,y=lineChoice?(/紅/.test(chosen)?120:70):/Central/.test(chosen)?70:150;body+=/沒有到/.test(chosen)?`<path d="M${x-12} ${y-12}L${x+12} ${y+12}M${x+12} ${y-12}L${x-12} ${y+12}" class="vf-warning"/>`:`<circle cx="${x}" cy="${y}" r="15" class="vf-selected-fill"/>`;}
 body+=vfText('出發站',60,35,17)+vfText('Central Station',220,100,16)+vfText('River Market',365,190,16);
 const map=vfSceneSvg(body,'教學示意路線，出發站、Central Station 與 River Market；不是實際城市路線');
 if(!lineChoice&&!stationChoice)return {stage:map};
 return {operation:`<div class="vf-railmap">${map}<div class="vf-map-actions">${labels.map((label,i)=>`<button class="object" type="button" ${attr}="${i}" ${ready?'':'disabled'} aria-pressed="${selected===i}"><span class="vf-line-swatch ${/紅/.test(label)?'red':'green'}" aria-hidden="true"></span>${esc(label)}${selected===i?' ●':''}</button>`).join('')}</div><p class="fine">點路線或站名；圖上的位置會跟著變。</p></div>`};
}
function vfTaxi(records) {
 const location=vfLast(records,x=>/目的地|入口|下車|停車|等車位置/.test(x.step.label||'')),chosen=location?.label||'';
 const stops=/停車|下車/.test(location?.step.label||''),atEntrance=stops&&/入口|指定/.test(chosen),x=atEntrance?255:75;
 let body='<path d="M20 145H420" stroke-width="28" class="vf-road"/>'+vfNamedDoor(315,/飯店/.test(chosen)?'飯店入口':'入口');
 body+=`<g transform="translate(${x} 85)"><path d="M0 30L15 0H80L100 30V60H0Z" fill="#dab45d"/><path d="M25 5H70L82 27H15Z" class="vf-fill"/><circle cx="20" cy="61" r="11" class="vf-fill"/><circle cx="80" cy="61" r="11" class="vf-fill"/>${vfText('TAXI',50,48,16)}</g>`;
 body+=vfText(chosen||'先向司機確認這一趟',205,201,16);
 return vfSceneSvg(body,chosen||'計程車與入口的位置');
}
function vfShopping(records,t){
 const water=vfLast(records,x=>/瓶水/.test(x.label)),item=vfLast(records,x=>/杯子|磁鐵|上衣|明信片/.test(x.label)),paid=vfLast(records,x=>/改用現金|選擇付款方式/.test(x.step.label||'')),bag=vfLast(records,x=>/袋子/.test(x.step.label||''));
 let body='<path d="M35 65H235L220 165H50Z" class="vf-fill"/><path d="M75 65L110 20M195 65L160 20M35 90H235"/><path d="M285 65H410V165H285Z" class="vf-fill"/>'+vfText('收銀台',347,53,17);
 const goods=water||item;
 if(goods)body+=vfParcel(70,80,goods.label,goods.step,130,85);
 if(paid)body+=vfParcel(300,78,paid.label,paid.step,95,75);
 body+=vfText(bag?/自己/.test(bag.label)?'使用自備袋':'店家提供袋子':'購物籃',135,195,17);
 return vfSceneSvg(body,[goods?.label,paid?.label,bag?.label].filter(Boolean).join('；')||'購物籃與收銀台');
}
function vfOutfit(records,t) {
 const size=vfLast(records,x=>/[SML] 號/.test(x.label)),color=vfLast(records,x=>/藍色|綠色|紅色/.test(x.label)),lastFit=vfLast(records,x=>/太大|太小|合身/.test(x.label)),buy=vfLast(records,x=>/購買/.test(x.step.label||'')),item=vfLast(records,x=>/T-shirt|鞋子/.test(x.label));
 const fit=lastFit&&records.indexOf(lastFit)>records.indexOf(size)?lastFit:null;
 const label=[item?.label,color?.label,size?.label,fit?.label].filter(Boolean).join('、');
 const shirt={objects:[['',label||'上衣']],label:'試穿'};
 const isBought=buy&&!/不買/.test(buy.label);
 const bagColor=/藍色/.test(label)?'#4d8ec9':/綠色/.test(label)?'#569c78':'#8a91b2';
 const bag=vfSvg('<path d="M45 45H195V140H45Z" class="vf-fill"/><path d="M90 45V20H150V45"/>'+(isBought?`<path d="M95 65L68 85L80 105L94 96V130H146V96L160 105L172 85L145 65Q120 78 95 65Z" fill="${bagColor}"/>`:'<path d="M65 60L175 125M175 60L65 125" class="vf-warning"/>'),'購物袋');
 return `<div class="vf-fitting-stage"><div class="vf-mirror">${label?vfArt(label,shirt):'<span class="vf-scene-empty">選好商品後，在這裡試穿</span>'}</div><div class="vf-outfit-tags"><p>尺寸：${esc(size?.label.match(/[SML] 號/)?.[0]||'待確認')}</p><p>顏色：${esc(color?.label.match(/藍色|綠色|紅色/)?.[0]||'待確認')}</p><p>${esc(fit?.label||'試穿感受待確認')}</p>${buy?`<div class="vf-bought">${bag}<span>${isBought?'已把這件放入購物袋':'這次先不買'}</span></div>`:''}</div></div>`;
}
function vfHotelRoom(records,theme){
 const room=vfLast(records,x=>/\d+ 號房/.test(x.label));
 const number=room?.label.match(/\d+(?= 號房)/)?.[0]||'—';
 const supplies=records.filter(x=>/毛巾|一些水|棉被/.test(x.label));
 const repair=vfLast(records,x=>/故障/.test(x.label));
 const help=vfLast(records,x=>/來房間查看/.test(x.label));
 let body=vfNamedDoor(20,number+' 房')+'<path d="M155 145H410M175 145V165M390 145V165"/><circle cx="185" cy="174" r="10"/><circle cx="380" cy="174" r="10"/>';
 supplies.slice(-3).forEach((x,i)=>{body+=vfParcel(160+i*80,65,x.label,x.step,78,75);});
 if(theme==='room-repair')body+=repair?vfParcel(190,20,repair.label,repair.step,180,110):vfText('先指出故障的設備',275,70,17);
 body+=vfText(theme==='room-repair'?(help?'已請人到房間查看':'尚未完成報修'):'客房服務推車',280,203,17);
 return vfSceneSvg(body,[room?.label,...supplies.map(x=>x.label),repair?.label,help?'已請人查看，尚未確認修好':''].filter(Boolean).join('；')||'房門與服務推車');
}
function vfBooking(records){
 const table=vfLast(records,x=>/人桌/.test(x.label)),when=vfLast(records,x=>/點/.test(x.label)),name=vfLast(records,x=>/Alex|Jamie/.test(x.label)),refused=vfLast(records,x=>/不訂位/.test(x.label));
 const people=table?vfNumber(table.label):0,full=when&&/客滿/.test(when.label);
 let body='<ellipse cx="105" cy="95" rx="57" ry="36" class="vf-fill"/>';
 const seats=[[105,32],[105,158],[25,95],[185,95]];
 for(let i=0;i<(full?4:people);i++){const [x,y]=seats[i];body+=`<circle cx="${x}" cy="${y}" r="15" class="vf-selected-fill"/>`;}
 body+='<rect x="230" y="18" width="195" height="177" rx="12" class="vf-fill"/><path d="M230 58H425"/>'+vfText('訂位資料',327,45,20);
 body+=vfSceneCaption(refused?'這次不訂位':when?.label||'時間待確認',327,75,170)+vfSceneCaption(name?.label||'姓名待確認',327,130,170);
 return vfSceneSvg(body,[table?.label,when?.label,name?.label,refused?.label].filter(Boolean).join('；')||'桌型與待填寫的訂位卡');
}
function vfTicketWallet(records){
 const adult=vfLast(records,x=>/成人票/.test(x.label)),child=vfLast(records,x=>/兒童票/.test(x.label)),price=vfLast(records,x=>/總共/.test(x.label));
 const xs=[adult,child].filter(Boolean);let body='<rect x="25" y="65" width="390" height="130" rx="15" class="vf-fill"/>';
 let col=0;for(const [x,isChild] of [[adult,false],[child,true]].filter(([x])=>x)){
  const count=Number(x.label.match(isChild?/(\d+) 張兒童票/:/(\d+) 張成人票/)?.[1]||vfNumber(x.label));
  for(let j=0;j<count;j++){const xx=45+(col++)*80;body+=`<rect x="${xx}" y="25" width="65" height="110" rx="9" class="vf-fill"/>${vfPerson(xx+32,68,isChild?.45:.65)}`;}
 }
 body+='<path d="M25 138H415"/>'+vfText(price?.label||'票種與張數確認後，再問總價',220,173,18);
 return vfSceneSvg(body,xs.map(x=>x.label).concat(price?.label||[]).join('；')||'尚未放入門票的票夾');
}
function vfCompanions(records){
 const partner=x=>/^旅伴|^對方/.test(x.label),mine=records.filter(x=>!partner(x)),other=records.filter(partner);
 return `<div class="vf-person-cards">${[['我',mine],['旅伴',other]].map(([title,xs])=>`<section><h4>${title}</h4>${vfSceneSvg(vfPerson(220,65,1.4),title)}${vfSceneTiles(xs,3)}</section>`).join('')}</div>`;
}
function vfInvitation(records){
 const latest=records.at(-1),tomorrow=latest&&/明天/.test(latest.label);
 return `<div class="vf-diary"><section><h4>今天</h4><div class="vf-diary-slot ${records.some(x=>/已有安排|不能參加/.test(x.label))?'occupied':''}">${records.some(x=>/已有安排|不能參加/.test(x.label))?'已有安排':records.length?'已談到今晚的邀請':'等待說明安排'}</div></section><section><h4>明天</h4><div class="vf-diary-slot ${tomorrow?'proposed':''}">${tomorrow?'已提出改到明天；等對方確認':'尚未提出新時間'}</div></section></div>`;
}
function vfHelpScene(records,theme){
 const location=vfLast(records,x=>/飯店|車站|博物館|服務台/.test(x.label)&&!/紙條/.test(x.label)),object=vfLast(records,x=>/黑色|藍色/.test(x.label)),bus=vfLast(records,x=>/\d+ 號公車/.test(x.label)),written=vfLast(records,x=>/紙條/.test(x.label));
 if(theme==='lost-property')return `<div class="vf-lost-scene"><div class="vf-lost-object">${object?vfArt(object.label,object.step):vfSvg('<path d="M60 55H180V135H60Z" stroke-dasharray="6 7"/><path d="M95 55V35H145V55"/>','物品特徵待描述')}<span>${object?esc(object.label):'物品特徵待描述'}</span></div><div><p>${esc(bus?.label||'車號待確認')}</p><p>${esc(location?.label||'求助位置待確認')}</p>${written?`<div class="vf-written-note">${vfArt(written.label,written.step)}<span>已收好位置紙條</span></div>`:'<p>還沒有位置紙條</p>'}<strong>尚未確認找回物品</strong></div></div>`;
 if(theme==='meeting')return `<div class="vf-contact-scene">${vfSceneSvg('<rect x="20" y="15" width="125" height="185" rx="20" class="vf-fill"/>'+vfPerson(83,76,.8)+vfText('導遊',83,175,17)+'<path d="M165 100H235M220 90L235 100L220 110"/>'+(location?vfParcel(245,25,location.label,location.step,180,120)+vfSceneCaption(location.label,330,150,195):vfSceneCaption('位置待確認',325,95,160)),location?.label||'與導遊聯絡並確認位置')}<span>確認後才前往新的會合點</span></div>`;
 const closed=vfLast(records,x=>/休館|今天有開/.test(x.label)),destination=vfLast(records,x=>/博物館/.test(x.label)),summary=vfLast(records,x=>/確認：/.test(x.label)),duration=vfLast(records,x=>/車程約|每.*一班/.test(x.label));
 return `<div class="vf-new-itinerary">${vfSceneTiles([closed,destination,summary||bus,summary?null:duration].filter(Boolean),4)}<p>${destination?esc(destination.label):'先問清楚景點是否開放'}</p></div>`;
}
function vfRequestScene(records){
 const attention=records.some(x=>/已注意/.test(x.label)),help=records.some(x=>/一起搬/.test(x.label)),items=records.filter(x=>/餐巾紙|拿水|拿茶/.test(x.label));
 return `<div class="vf-request-scene">${vfSceneSvg(vfPerson(help?155:85,65,.95)+vfPerson(help?285:attention?195:340,65,.95)+(help?'<path d="M180 95H260V150H180Z" class="vf-fill"/><path d="M202 95V78H238V95M170 95H202M238 95H270"/>':'')+'<path d="M30 156H410"/>'+vfText(help?'有人一起搬行李':attention?'店員已轉向你':'先引起店員注意',220,195,18),'店員與旅客的互動狀態')}${vfSceneTiles(items,3)}</div>`;
}
function vfTaskOperation(t,ctx,defaultOperation) {
 const theme=vfTaskTheme(t);if(!theme)return vfChoiceArea(t,defaultOperation,ctx);
 const {records,earlier,preview,valid}=vfSceneRecords(t,ctx.previous,ctx.selected),facts=vfSceneFacts(records),kind=vfKind(t);
 let stage='',operation=defaultOperation;
 if(theme==='shopping')stage=vfShopping(records,t);
 if(theme==='airport'){stage=vfCheckin(records);if(kind==='seat')operation=vfSeating(t,ctx);}
 if(theme==='airport-gates')operation=vfDoors(t,ctx);
 if(theme==='immigration'||theme==='hotel'||theme==='tickets')stage=vfSceneTiles(facts,4);
 if(theme==='hotel'&&kind==='direction')operation=vfDoors(t,ctx);
 if(theme==='declaration')stage=`<div class="vf-open-suitcase"><span>行李檢查區</span>${vfSceneTiles(records,2)}</div>`;
 if(theme==='tickets'&&kind==='gate')operation=vfDoors(t,ctx);
 if(theme==='transit-map'){const map=vfTransitMap(t,records,ctx);stage=map.stage||'';operation=map.operation||defaultOperation;}
 if(theme==='walking')stage=kind==='route'?'':vfSceneTiles(records,2);
 if(theme==='taxi')stage=vfTaxi(records);
 if(theme==='fitting'){stage=vfOutfit(records,t);if(kind==='direction')operation=vfDoors(t,ctx);}
 if(theme==='room-delivery'||theme==='room-repair')stage=vfHotelRoom(records,theme);
 if(theme==='room-dining')stage=`<div class="vf-serving-tray">${vfSceneTiles(facts,4)}</div>`;
 if(theme==='reservation')stage=vfBooking(records);
 if(theme==='admission')stage=records.some(x=>/成人票|兒童票/.test(x.label))||/ticket-quantity/.test(t.id)?vfTicketWallet(records):vfSceneTiles(facts,3);
 if(theme==='companions')stage=vfCompanions(records);
 if(theme==='invitation')stage=vfInvitation(records);
 if(theme==='requests')stage=vfRequestScene(records);
 if(['new-itinerary','meeting','lost-property'].includes(theme))stage=vfHelpScene(records,theme);
 if(t.choiceFormat==='station-map')operation=vfTransitMap(t,records,ctx).operation||operation;
 if(t.choiceFormat==='taxi-stop')operation=vfTaxiStop(t,ctx);
 const status=preview?(valid?'已確認的場景':'操作預覽 · 還不符合這次對話'):earlier.length?'接續前面確認的資訊':'資訊會隨下方選擇更新';
 // Display only known facts. Do not copy the scenario's full translated answer.
 return `<section class="vf-task-scene" data-task-theme="${theme}" data-scene-state="${preview?(valid?'confirmed':'preview'):'waiting'}" data-scene-step="${esc(t.id)}">${vfNewSituation(t)?'<p class="vf-scenario-change">換一個情境，從新的條件開始。</p>':''}${vfChoiceArea(t,operation,ctx)}${stage?`<details class="vf-scene-context"><summary>${vfTaskNames[theme]} · 查看目前場景</summary><div class="vf-task-stage" aria-label="資訊顯示區"><p class="vf-stage-label">${status}</p>${stage}</div></details>`:''}</section>`;
}

function vfTaskObjectLabel(label,t,previous){
 if(vfTaskTheme(t)!=='fitting'||!/剛才選|先不買/.test(label))return label;
 const {records}=vfSceneRecords(t,previous,-1);
 const color=vfLast(records,x=>/藍色|綠色|紅色/.test(x.label))?.label.match(/藍色|綠色|紅色/)?.[0];
 const size=vfLast(records,x=>/[SML] 號/.test(x.label))?.label.match(/[SML] 號/)?.[0];
 return [label,color,size].filter(Boolean).join('、');
}

// Draw distinctions that a shared topic icon cannot communicate on its own.
const vfBaseNumber=vfNumber;
vfNumber=function(label){return /不加兒童票/.test(label)?0:vfBaseNumber(label);};
const vfBaseArt=vfArt;
vfArt=function(label,t){
 const k=vfKind(t);
 if(/磁鐵 \d+ 美元|杯子 \d+ 美元/.test(label)){
  const item=/磁鐵/.test(label)?'<path d="M68 25H172V108H68Z" class="vf-fill"/><path d="M83 88L110 52L135 77L151 58L163 88Z" fill="#8b9a54"/><circle cx="143" cy="44" r="9" fill="#dab45d"/>':'<path d="M65 25H155V87Q110 117 65 87Z" class="vf-fill"/><path d="M155 35H178Q200 70 155 80"/>';
  return vfSvg(item+vfText('$'+label.match(/\d+/)[0],120,138,24),label);
 }
 if(/付 \d+ 美元現金/.test(label))return vfSvg('<rect x="28" y="35" width="184" height="90" rx="7" class="vf-fill"/><rect x="42" y="48" width="156" height="63" rx="12"/>'+vfText('$'+label.match(/\d+/)[0],120,91,32),label);
 if(/1 張到/.test(label))return vfSvg('<path d="M18 30H222V57Q202 72 222 87V120H18V87Q38 72 18 57Z" class="vf-fill"/><path d="M55 58H185L173 48M185 58L173 68"/>'+vfText(/Central/.test(label)?'Central Station':'AIRPORT',120,99,21),label);
 if(/機場報到|飯店入住/.test(label))return /機場/.test(label)?vfSvg('<path d="M20 105H220V135H20Z" class="vf-fill"/><path d="M120 20V80M120 35L70 60H170L120 35M120 70L100 85H140L120 70"/>'+vfText('CHECK IN',120,126,16),label):vfBaseArt('飯店', {objects:[['','飯店']],label:'目的地'});
 if(label==='度假')return vfSvg('<path d="M20 126Q120 95 220 126M45 53Q90 5 135 53ZM90 53V118M55 88L110 113H164"/><circle cx="185" cy="35" r="19" fill="#dab45d"/>',label);
 if(label==='出差')return vfSvg('<rect x="32" y="62" width="95" height="68" rx="6" class="vf-fill"/><path d="M57 62V45H102V62M32 86H127M72 86V97H86V86"/><path d="M145 25H212V95H145Z" class="vf-fill"/><path d="M156 43H200M156 58H200M156 74H187"/>',label);
 if(/出示帶來的食物/.test(label))return vfSvg('<circle cx="72" cy="75" r="24" fill="#c9a46d"/><circle cx="106" cy="88" r="20" fill="#c9a46d"/><path d="M64 69H65M80 83H81M107 84H108" stroke-width="6"/><path d="M40 113H130L144 103"/>'+vfPerson(186,52,.85),label);
 if(/未確認就直接離開/.test(label))return vfSvg('<path d="M165 125V20H220V125" class="vf-fill"/>'+vfPerson(67,50,.85)+'<path d="M103 75H195L183 63M195 75L183 87"/>',label);
 if(vfTaskTheme(t)==='taxi'&&k==='vehicle'){
  const waiting=/預約/.test(label),walk=/走路/.test(label),stop=/停車|下車/.test(label);
  if(walk)return vfSvg(vfPerson(120,55,1.1)+'<path d="M35 134H205"/>',label);
  let car='<path d="M25 70L50 35H155L190 70H215V115H25Z" fill="#dab45d"/><path d="M60 42H145L169 70H43Z" class="vf-fill"/><circle cx="62" cy="119" r="15" class="vf-fill"/><circle cx="177" cy="119" r="15" class="vf-fill"/>'+vfText('TAXI',120,99,19);
  if(waiting)car+=vfText(/不是/.test(label)?'×':'✓',204,36,27);
  else if(stop)car+='<path d="M215 37V10M207 10H223"/>'+vfText(/現在/.test(label)?'現在':'入口',120,25,18);
  else if(/繼續/.test(label))car+='<path d="M80 18H170L157 8M170 18L157 28"/>';
  return vfSvg(car,label);
 }
 if(/餐巾紙/.test(label)){
  let body='';for(let i=0;i<vfNumber(label);i++)body+=`<path d="M${35+i*58} 42H${85+i*58}V112H${35+i*58}Z" class="vf-fill"/><path d="M${35+i*58} 42L${85+i*58} 112"/>`;return vfSvg(body,label);
 }
 if(/一起搬袋子|自己繼續搬/.test(label))return vfSvg(vfPerson(65,46,.8)+(/一起/.test(label)?vfPerson(185,46,.8):'')+'<path d="M90 80H160V135H90Z" class="vf-fill"/><path d="M108 80V65H142V80M80 80H108"/>'+(/一起/.test(label)?'<path d="M142 80H170"/>':''),label);
 if(/收好寫著.*紙條/.test(label))return vfSvg('<path d="M55 15H162L190 43V138H55Z" class="vf-fill"/><path d="M162 15V43H190M77 90H169M77 110H152"/>'+vfText('i →',120,68,28),label);
 if(/直接當作包包已經找回/.test(label))return vfBaseArt('包包',t).replace('</svg>',vfText('?',120,100,35)+'</svg>');
 if(/確認訂餐|暫時不訂/.test(label)&&k==='food')return vfBaseArt(label,t).replace('</svg>',/不訂/.test(label)?'<path d="M50 28L190 130" class="vf-warning"/></svg>':'<path d="M160 30L175 45L205 15" class="vf-accent"/></svg>');
 if(/確認：\d+ 號車/.test(label)){
  const bus=label.match(/(\d+) 號車/)?.[1],minutes=label.match(/約 (\d+) 分鐘/)?.[1];
  return vfSvg('<rect x="20" y="30" width="95" height="85" rx="12" class="vf-fill"/><circle cx="40" cy="124" r="8"/><circle cx="95" cy="124" r="8"/>'+vfText(bus,68,82,30)+vfText(minutes+' 分鐘',177,85,23),label);
 }
 if(/兒童票|成人票/.test(label)&&k==='quantity'){
  const n=vfNumber(label);let body='';for(let i=0;i<n;i++){const x=38+i*62;body+=`<rect x="${x}" y="20" width="53" height="105" rx="7" class="vf-fill"/>${vfPerson(x+26,53,/兒童/.test(label)?.45:.65)}`;}return vfSvg(body||'<path d="M30 125H210" stroke-dasharray="6 8"/>',label);
 }
 if(/號房/.test(label)&&/毛巾|水|棉被/.test(label)){
  const art=/棉被/.test(label)?vfSvg('<path d="M35 45H205V130H35Z" class="vf-fill"/><path d="M35 62H205M65 45V130M95 45V130M125 45V130M155 45V130M185 45V130"/>',label):vfBaseArt(label,t);return `<div class="vf-room-parcel">${art}<span>${esc(label.match(/\d+ 號房/)?.[0])}</span></div>`;
 }
 if(k==='supplies'&&/棉被/.test(label))return vfSvg('<path d="M35 45H205V130H35Z" class="vf-fill"/><path d="M35 62H205M65 45V130M95 45V130M125 45V130M155 45V130M185 45V130"/>',label);
 if(k==='clothes'&&/鞋子/.test(label))return vfSvg('<path d="M40 45H95L120 85L195 100V125H35V100Z" class="vf-fill"/><path d="M35 112H195M98 72L122 64M106 83L134 75"/>',label);
 if(k==='activity'&&/人很多|沒有人/.test(label)){
  let body='<path d="M20 130H220"/>';if(/人很多/.test(label))for(let j=0;j<5;j++)body+=vfPerson(40+j*40,70,.55);return vfSvg(body,label);
 }
 if(k==='food'&&/拿水|拿茶/.test(label))return vfSvg('<path d="M70 22H170L158 135H82Z"/>'+`<path d="M78 65H162L155 129H85Z" fill="${/茶/.test(label)?'#bc8a43':'#89c8e4'}" fill-opacity=".6" stroke="none"/>`,label);
 if(k==='clothes'&&/沒有其他尺寸|不能試穿|不要換大/.test(label))return vfSvg('<path d="M55 30H185V125H55Z" class="vf-fill"/><path d="M70 45L170 110M170 45L70 110" class="vf-warning"/>',label);
 if(k==='clothes'&&/先不買/.test(label))return vfBaseArt(label,t).replace('</svg>','<path d="M45 30L195 130" class="vf-warning"/></svg>');
 if(k==='food'&&/沒有帶食物/.test(label))return vfSvg('<rect x="38" y="30" width="164" height="100" rx="14" class="vf-fill"/><rect x="53" y="45" width="134" height="70" rx="8" stroke-dasharray="5 6"/>',label);
 if(k==='calendar'&&/還沒有安排/.test(label))return vfSvg('<rect x="35" y="27" width="170" height="105" rx="8" class="vf-fill"/><path d="M35 55H205M65 17V37M175 17V37"/>'+vfText('空白',120,95,25),label);
 if(/暫時不訂|拒絕/.test(label)&&k==='time')return vfSvg('<rect x="35" y="25" width="170" height="110" rx="8" class="vf-fill"/><path d="M70 50L170 110M170 50L70 110" class="vf-warning"/>'+vfText('未訂位',120,145,16),label);
 return vfBaseArt(label,t);
};
