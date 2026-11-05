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
function vfSceneSvg(body,label){return `<svg class="vf-topic-art" viewBox="0 0 440 210" role="img" aria-label="${esc(label)}" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;}
function vfSeating(t,ctx) {
 const {selected,ready,attr}=ctx;
 return `<div class="vf-plane"><span class="vf-window-label">窗戶</span><div class="vf-plane-seats">${t.objects.map((o,i)=>`<button type="button" class="object vf-seat-button" ${attr}="${i}" aria-pressed="${selected===i}" ${ready?'':'disabled'} style="order:${/靠窗/.test(o[1])?0:1}"><span class="vf-seat-shape" aria-hidden="true">${selected===i?'●':''}</span><span>${esc(o[1])}</span></button>`).join('')}</div><span class="vf-aisle-label">走道<br>↑<br>↓</span></div>`;
}
function vfDoors(t,ctx) {
 const {selected,ready,attr}=ctx;
 const heading=vfKind(t)==='gate'?/月台/.test(t.objects[0][1])?'依標示找到月台':'沿走廊找到登機門':/試衣間/.test(t.objects[0][1])?'面朝走廊，找試衣間':'面朝大廳，找電梯';
 return `<div class="vf-doors"><p>${heading}</p><div class="vf-door-options">${t.objects.map((o,i)=>`<button type="button" class="object vf-door-button" ${attr}="${i}" ${ready?'':'disabled'} aria-pressed="${selected===i}" style="order:${/左/.test(o[1])?0:/右/.test(o[1])?1:i}"><span class="vf-door-sign">${esc(o[1])}</span><span class="vf-door-panels" aria-hidden="true"><span></span><span></span></span><span>${selected===i?'● 你走到這裡':'點門口前進'}</span></button>`).join('')}</div><div class="vf-door-floor">↑ 你面向前方</div></div>`;
}
function vfTransitMap(t,ctx,defaultOperation){
 const {selected,ready,attr}=ctx,labels=t.objects.map(o=>o[1]);
 const lineChoice=labels.some(l=>/綠線|紅線/.test(l)),stationChoice=labels.every(l=>/Central Station|River Market/.test(l))&&!labels.some(l=>/有到|沒有到/.test(l));
 if(!lineChoice&&!stationChoice)return defaultOperation;
 const chosen=selected>=0?labels[selected]:'';
 let body='<path d="M35 70H405" stroke="#42936d" stroke-width="10"/><path d="M220 20V150H395" stroke="#c66b74" stroke-width="10"/>';
 for(const [x,y]of [[35,70],[220,70],[405,70],[220,150],[395,150]])body+=`<circle cx="${x}" cy="${y}" r="9" class="vf-fill"/>`;
 if(chosen){const x=lineChoice?(/紅/.test(chosen)?220:110):/Central/.test(chosen)?220:395,y=lineChoice?(/紅/.test(chosen)?120:70):/Central/.test(chosen)?70:150;body+=/沒有到/.test(chosen)?`<path d="M${x-12} ${y-12}L${x+12} ${y+12}M${x+12} ${y-12}L${x-12} ${y+12}" class="vf-warning"/>`:`<circle cx="${x}" cy="${y}" r="15" class="vf-selected-fill"/>`;}
 body+=vfText('出發站',60,35,17)+vfText('Central Station',220,100,16)+vfText('River Market',365,190,16);
 const map=vfSceneSvg(body,'教學示意路線，出發站、Central Station 與 River Market；不是實際城市路線');
 return `<div class="vf-railmap">${map}<div class="vf-map-actions">${labels.map((label,i)=>`<button class="object" type="button" ${attr}="${i}" ${ready?'':'disabled'} aria-pressed="${selected===i}"><span class="vf-line-swatch ${/紅/.test(label)?'red':'green'}" aria-hidden="true"></span>${esc(label)}${selected===i?' ●':''}</button>`).join('')}</div><p class="fine">點路線或站名；圖上的位置會跟著變。</p></div>`;
}
function vfTaskOperation(t,ctx,defaultOperation) {
 const theme=vfTaskTheme(t);
 if(!theme)return vfChoiceArea(t,defaultOperation,ctx);

 const kind=vfKind(t);
 let operation=defaultOperation;
 if(theme==='airport'&&kind==='seat')operation=vfSeating(t,ctx);
 if(theme==='airport-gates'||(theme==='tickets'&&kind==='gate')||
    ((theme==='fitting'||theme==='hotel')&&kind==='direction'))operation=vfDoors(t,ctx);
 if(theme==='transit-map'||t.choiceFormat==='station-map')operation=vfTransitMap(t,ctx,operation);
 if(t.choiceFormat==='taxi-stop')operation=vfTaxiStop(t,ctx);

 const state=ctx.selected<0?'waiting':t.valid.includes(ctx.selected)?'confirmed':'preview';
 const newSituation=vfNewSituation(t)?'<p class="vf-scenario-change">換一個情境，從新的條件開始。</p>':'';
 return `<section class="vf-task-scene" data-task-theme="${theme}" data-scene-state="${state}" data-scene-step="${esc(t.id)}">${newSituation}${vfChoiceArea(t,operation,ctx)}</section>`;
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
