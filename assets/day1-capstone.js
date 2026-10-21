// Day 1, part 08. This teacher-led practice never changes the saved A/B/C learning records.
// The full challenge reuses the newly taught A/B/C language.
const capRoute=flows[0].steps[0].line;
const capRouteZh=flows[0].steps[0].zh;
const capstoneSteps=[
 {id:'ask',title:'你想去火車站。先問路人怎麼走。',words:'get to / train station',answer:'How do I get to the train station?',answerZh:'我要怎麼去火車站？',line:capRoute,zh:capRouteZh,prompt:'先確認你要去的地方。',options:['火車站','郵局'],correct:0,feedback:'已問出去火車站的路線。',retry:'這次的目的地是火車站，再選一次。',context:'路人已知道你要去火車站。這次把各小輪學過的話連起來用。'},
 {id:'repeat',title:'剛才沒聽清楚。請路人再說一次。',words:'say / again',answer:'Could you say that again?',answerZh:'可以再說一次嗎？',line:capRoute,zh:capRouteZh,prompt:'聽清楚後，確認路線。',options:['第一個路口右轉','第一個路口左轉'],correct:0,feedback:'已確認路線：直走到第一個路口，再右轉。',retry:'路人說的是 turn right，請再聽一次或看文字。',context:'不用猜剛才的方向；用 C 學過的句子，請路人重說 A 的路線。'},
 {id:'right',title:'再確認一次：是右轉嗎？',words:'turn / right',answer:'Turn right?',answerZh:'右轉嗎？',line:'Yes, right.',zh:'對，右轉。',prompt:'路人確認的是哪個方向？',options:['→ 右轉','← 左轉'],correct:0,feedback:'方向確認了：右轉。',retry:'right 是右邊；可以重聽，或展開文字再確認。',context:'你已聽到第一個路口右轉。再用 A 的短句確認。'},
 {id:'map',title:'拿出地圖，請路人指給你看。',words:'show / map',answer:'Could you show me on the map?',answerZh:'可以在地圖上指給我看嗎？',line:'Here. The train station is on the right.',zh:'這裡，火車站在右邊。',prompt:'在地圖上，點路人指出的目的地。',options:['右側的火車站','左側的郵局'],correct:0,feedback:'已在地圖確認：火車站在右邊。',retry:'這次去的是火車站，在地圖右側；請再點一次。',context:'沿用 C 的求助句。對方回話只把郵局換成火車站；這個替換已在 C 的聽力用法補充教過。',mapChoices:['station','post']},
 {id:'way',title:'想再確認走法，請路人指路。',words:'show me / the way',answer:'Could you show me the way?',answerZh:'可以告訴我怎麼走嗎？',line:capRoute,zh:capRouteZh,prompt:'確認仍是同一條路線。',options:['第一個路口右轉','第二個路口左轉'],correct:0,feedback:'用 B 的說法，也問到了同一條路線。',retry:'路線仍是第一個路口右轉；再聽一次。',context:'路人已知道你要去火車站。這次重用 B 的說法，請他指路。'},
 {id:'bus',title:'你想搭公車去火車站，問可不可以。',words:'take / bus',answer:'Can I take a bus?',answerZh:'我可以搭公車嗎？',line:'Yes. The bus stop is over there.',zh:'可以，公車站在那邊。',prompt:'可以搭公車。先找出要去的站牌。',options:['公車站牌','火車站'],correct:0,feedback:'已找到公車站牌。接著謝謝路人的幫忙。',retry:'先到公車站牌等車；火車站是這次的目的地。',context:'路人已知道目的地。用 B 的句子問搭公車的方法。',mapChoices:['bus','station']},
 {id:'thanks',title:'路人已幫你問清楚路線與公車，謝謝他。',words:'thank you / help',answer:'Thank you for your help.',answerZh:'謝謝你的幫忙。',line:'You’re welcome.',zh:'不客氣。',prompt:'聽懂道謝後的回應。',options:['不客氣','請重新問路'],correct:0,feedback:'你已用學過的道謝句，禮貌結束這次問路。',retry:'You’re welcome. 是回應道謝的「不客氣」。',context:'重用 A 學過、B 練過的道謝。對方的 You’re welcome. 接在道謝之後。'}
];
let capstoneState;
function resetCapstone(){
 capstoneState={step:0,role:'student',heard:false,choice:null,hint:0,transcript:false,completed:[],done:false};
}
resetCapstone();
function capstoneContext(){return capstoneState.done?'整合練習完成':`對話 ${capstoneState.step+1} / ${capstoneSteps.length}`;}
function capButton(label,attr,extra=''){return btn(label,attr,extra);}
function capAudio(text){return `<div class="cap-audio">${capButton('▶ 聽英文',`data-cap-say="${esc(text)}"`)}${capButton('慢速',`data-cap-say="${esc(text)}" data-cap-slow="true"`)}</div>`;}
function capSupport(t){
 const level=capstoneState.hint;
 const panes=[`<p class="cap-empty">用你記得的英文說就可以。</p>`,`<p class="cap-help-label">把這些字組起來</p><p class="cap-en" lang="en">${esc(t.words)}</p>`,`<p class="cap-en" lang="en">${esc(t.answer)}</p><p class="cap-translation">${esc(t.answerZh)}</p>${capAudio(t.answer)}`];
 return `<div class="cap-support"><div class="cap-hint-tabs" role="group" aria-label="提示程度">${['自己說','關鍵字','看整句'].map((label,i)=>capButton(label,`data-cap-hint="${i}"`,`aria-pressed="${level===i}"`)).join('')}</div><div class="cap-stage">${panes.map((pane,i)=>`<div class="cap-pane" data-cap-pane="${i}" aria-hidden="${level!==i}" ${level===i?'':'inert'}>${pane}</div>`).join('')}</div></div>`;
}
function capListening(t){
 const visible=capstoneState.transcript;
 return `<div class="cap-listening"><div class="cap-listen-controls">${capButton('▶ 播放',`data-cap-say="${esc(t.line)}"`,'aria-label="播放路人回應"')}${capButton('慢速',`data-cap-say="${esc(t.line)}" data-cap-slow="true"`)}${capButton(visible?'收起文字':'看文字','data-cap-transcript',`aria-pressed="${visible}"`)}</div><div class="cap-stage"><div class="cap-pane" aria-hidden="${visible}" ${visible?'inert':''}><p class="cap-empty">先聽一句，聽懂意思就好。<br>需要時可以看文字。</p></div><div class="cap-pane" aria-hidden="${!visible}" ${visible?'':'inert'}><p class="cap-en" lang="en">${esc(t.line)}</p><p class="cap-translation">${esc(t.zh)}</p></div></div></div>`;
}
function capHas(id){
 const t=capstoneSteps[capstoneState.step];
 return capstoneState.completed.includes(id)||(t.id===id&&capstoneState.role==='other'&&capstoneState.heard&&capstoneState.choice===t.correct);
}
function capMap(t){
 const interactive=!capstoneState.done&&capstoneState.role==='other'&&!!t.mapChoices;
 const confirmed=capHas('repeat'),located=capHas('map'),bus=capHas('bus');
 const places=[['station','▥','火車站'],['post','✉','郵局'],['bus','▤','公車站牌']];
 const placeMarkup=places.map(([id,symbol,label])=>{
  const index=interactive?t.mapChoices.indexOf(id):-1;
  const selected=index>=0&&capstoneState.choice===index;
  const classes=`cap-place cap-place-${id}${(id==='station'&&located)||(id==='bus'&&bus)?' cap-known':''}${selected?' cap-selected':''}`;
  const content=`<span class="cap-place-symbol" aria-hidden="true">${symbol}</span><span>${label}</span>${selected?`<span class="cap-place-result">${index===t.correct?'✓ 已確認':'再試一次'}</span>`:''}`;
  return index>=0?capButton(content,`data-cap-choice="${index}"`,`class="${classes}" aria-label="${esc(t.options[index])}" aria-pressed="${selected}" ${capstoneState.heard?'':'disabled'}`):`<div class="${classes}">${content}</div>`;
 }).join('');
 return `<div class="cap-map" role="group" aria-label="教學示意地圖，面朝上：火車站在右前方，郵局在左前方，公車站牌在左側。"><svg viewBox="0 0 440 230" preserveAspectRatio="none" aria-hidden="true"><rect class="cap-block" x="25" y="101" width="128" height="60" rx="14"/><rect class="cap-block" x="285" y="101" width="130" height="60" rx="14"/><path class="cap-road" d="M 82 75 H 359 M 220 75 V 207"/><path class="cap-road-line" d="M 82 75 H 359 M 220 75 V 207"/>${confirmed?'<path class="cap-route" d="M 220 192 V 75 H 342"/><path class="cap-route-arrow" d="m 331 65 12 10 -12 10"/>':''}<circle class="cap-origin" cx="220" cy="198" r="7"/></svg>${placeMarkup}<span class="cap-map-start">你在這裡 · 面朝上 ↑</span></div><div class="cap-map-facts" aria-label="目前已確認的資訊"><span>目的地：火車站</span>${confirmed?'<span>✓ 直走到第一個路口，再右轉</span>':''}${capHas('thanks')?'<span>✓ 已謝謝對方的幫忙</span>':''}${bus?'<span>✓ 可以搭公車</span>':''}</div>`;
}
function capstonePage(){
 const s=capstoneState,t=capstoneSteps[s.step];
 if(s.done)return `<div class="cap-shell cap-complete"><section class="cap-panel cap-dialogue"><p class="cap-role">✓ 整合練習完成</p><h1 class="cap-task">你已問清楚去火車站的方法。</h1><ul class="cap-results"><li>問出目的地，確認直走到第一個路口、右轉。</li><li>沒聽清楚時，請對方重說、指地圖。</li><li>問清楚可以搭公車，並謝謝對方的幫忙。</li></ul><p class="cap-note">再練一次，試著少看一層提示。</p><div class="cap-complete-actions">${capButton('收起提示，再練一次','data-cap-action="reset"','class="primary"')}${capButton('返回 01：先試著說','data-cap-action="return"')}</div></section><section class="cap-panel cap-board" aria-label="情境操作"><h2>這次問到的資訊</h2>${capMap(t)}<p class="cap-note">路線與位置為教學設定。</p></section></div>`;
 const student=s.role==='student',accepted=s.choice===t.correct,ready=!student&&s.heard&&accepted;
 const choices=t.mapChoices?'':`<div class="cap-objects">${t.options.map((label,i)=>capButton(`${esc(label)}${s.choice===i?(i===t.correct?' ✓':' · 再試一次'):''}`,`data-cap-choice="${i}"`,`class="cap-object${s.choice===i&&!accepted?' cap-wrong':''}" aria-pressed="${s.choice===i}" ${s.heard?'':'disabled'}`)).join('')}</div>`;
 return `<div class="cap-shell"><section class="cap-panel cap-dialogue ${student?'cap-student':'cap-other'}" aria-label="當前對話"><div class="cap-role-row"><p class="cap-role">${student?'你 · 旅客':'對方 · 路人'}</p><span class="cap-note">${s.step+1} / ${capstoneSteps.length}</span></div><h1 class="cap-task">${student?esc(t.title):'聽聽路人怎麼說'}</h1>${student?capSupport(t):capListening(t)}<div class="cap-confirm">${student?capButton('我說好了，聽路人回應 →','data-cap-action="spoken"','class="primary"'):`<label class="cap-check"><input type="checkbox" data-cap-heard ${s.heard?'checked':''}><span>${s.heard?'已聽／讀完，請點選符合回覆的物件':'我已聽完，或已讀完文字 →'}</span></label>${capButton('重新說這句','data-cap-action="repeat"','class="cap-quiet"')}`}</div><div class="cap-back">${capButton('← 上一段','data-cap-action="back"',s.step===0?'disabled':'')}${capButton('重新開始','data-cap-action="reset"')}</div></section><section class="cap-panel cap-board" aria-label="情境操作"><div class="cap-board-heading"><h2>${student?'這次要去火車站':esc(t.prompt)}</h2><span class="cap-note">示意地圖</span></div>${capMap(t)}${student?`<div class="cap-context"><p>${esc(t.context)}</p><p class="cap-note">先把題目的意思說出口，再聽路人回應。</p></div>`:`${choices}<div class="cap-feedback ${s.choice!==null&&!accepted?'cap-feedback-retry':''}" role="status">${s.choice!==null?esc(accepted?t.feedback:t.retry):s.heard?'請點選符合回覆的物件。':'先確認聽讀，再點選物件。'}</div>${capButton(s.step===capstoneSteps.length-1?'完成整合挑戰 →':'接著，說下一句 →','data-cap-action="next"',`class="primary cap-next" ${ready?'':'disabled'}`)}`}</section></div>`;
}
function capRender(focusSelector){
 render();
 const control=focusSelector?document.querySelector(focusSelector):null;
 if(control)control.focus({preventScroll:true});else focusSceneStep();
}
function capResetTurn(){
 Object.assign(capstoneState,{role:'student',heard:false,choice:null,hint:0,transcript:false,done:false});
}
document.addEventListener('click',event=>{
 const button=event.target.closest('.cap-shell button');
 if(!button||button.disabled)return;
 const d=button.dataset,s=capstoneState,t=capstoneSteps[s.step];
 if(d.capSay!==undefined){speak(d.capSay,d.capSlow==='true');return;}
 if(d.capHint!==undefined){const level=Number(d.capHint);if(![0,1,2].includes(level))return;stopAudio();s.hint=level;capRender(`[data-cap-hint="${level}"]`);return;}
 if(d.capTranscript!==undefined){s.transcript=!s.transcript;capRender('[data-cap-transcript]');return;}
 if(d.capChoice!==undefined){const value=Number(d.capChoice);if(s.done||s.role!=='other'||!s.heard||!Number.isInteger(value)||!t.options[value])return;s.choice=value;capRender(`[data-cap-choice="${value}"]`);return;}
 if(!d.capAction)return;
 stopAudio();
 if(d.capAction==='spoken'){s.role='other';s.heard=false;s.choice=null;s.transcript=false;capRender();}
 else if(d.capAction==='repeat'){capResetTurn();capRender();}
 else if(d.capAction==='reset'){resetCapstone();capRender();}
 else if(d.capAction==='back'&&s.step>0){s.step--;s.completed=s.completed.slice(0,s.step);capResetTurn();capRender();}
 else if(d.capAction==='next'&&!s.done&&s.role==='other'&&s.heard&&s.choice===t.correct){s.completed[s.step]=t.id;if(s.step===capstoneSteps.length-1){s.done=true;}else{s.step++;capResetTurn();}capRender();}
 else if(d.capAction==='return'){navigate(0);}
});
document.addEventListener('change',event=>{
 const control=event.target.closest('.cap-shell [data-cap-heard]');
 if(!control||capstoneState.role!=='other')return;
 capstoneState.heard=control.checked;capstoneState.choice=null;capRender('[data-cap-heard]');
});
