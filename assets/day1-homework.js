// Shared English homework exporter, installed after all lesson renderers.
// The historical filename is retained. Handouts use teaching content only.
(() => {
 if(document.querySelector('.homework-dialog'))return;
 const escape=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const lesson=`第 ${course.day} 天｜${course.title}`;
 const catalog=rounds.map(r=>({key:'task:'+r.id,kind:'task',label:`任務 ${r.displayLabel||r.id}｜${r.name}`,short:`任務 ${r.displayLabel||r.id}`,exercises:[{title:r.name,context:r.home.task,steps:[r.home]}]}));
 if(typeof chapterIntegration!=='undefined')chapterIntegration.groups.forEach(g=>catalog.push({key:'integrated:'+g.id,kind:'integrated',label:g.title,short:g.title,exercises:g.paths.map(p=>({title:p.title,context:p.context,steps:p.steps}))}));
 if(typeof capstoneSteps!=='undefined')catalog.push({key:'integrated:capstone',kind:'integrated',label:'整合挑戰：自己完成一趟問路',short:'整合挑戰',exercises:[{title:'自己完成一趟問路',context:'你想去火車站。將問路、請重說、看地圖、問公車與道謝連起來，完成這次問路。',steps:capstoneSteps.map(s=>({...s,task:s.title,label:s.title,askFirst:true}))}]});
 if(typeof hotelIntegration!=='undefined'){
  const t=hotelIntegration.practice.transfer,steps=['nights','passport','name','breakfast'].map(key=>({...t.steps.find(s=>s.key===key)}));
  steps[3].task='入住已完成。已確認退房時間與電梯位置，想在飯店吃早餐，但不知道是否包含在房價裡。你會問什麼？';
  catalog.push({key:'integrated:checkin',kind:'integrated',label:'完成入住',short:'完成入住',exercises:[{title:'換一筆訂房資料，再用一次',context:`訂房姓名：${t.name}；住宿：${t.nights} 晚。先依櫃檯的新順序回答問題，再補問缺少的資訊。`,steps}]});
  hotelIntegration.extended.groups.forEach(g=>{
   const h=g.homework,decisions=h.speakSteps.filter(s=>s.id==='yes'||s.id==='no');
   // Accept/decline are alternatives, never consecutive replies in one conversation.
   const steps=h.speakSteps.filter(s=>s.id!=='no').map(s=>s.id==='yes'&&decisions.length===2?{task:'依價格與等候時間，選擇接受訂餐或禮貌婉拒（擇一）。',label:s.label,line:s.line,zh:s.zh,askFirst:false,alternatives:decisions}:s);
   catalog.push({key:'integrated:'+g.id,kind:'integrated',label:g.title,short:g.title,exercises:[{title:g.title,context:h.context,information:h.listen.map(s=>s.zh).join(' '),steps,check:h.check}]});
  });
 }
 const button=()=>'<button type="button" class="homework-export" data-homework-open aria-haspopup="dialog">製作回家功課 PDF</button>';
 const footer=document.querySelector('footer.bottom');
 if(footer){footer.classList.add('homework-footer');const links=document.createElement('div');links.className='homework-course-link';while(footer.firstChild)links.append(footer.firstChild);footer.append(links);footer.insertAdjacentHTML('beforeend',button());}
 function addSectionEntry(){const main=document.querySelector('#main[data-lesson-section="7"]');if(!main||main.querySelector('.homework-section-entry'))return;main.insertAdjacentHTML('beforeend',`<section class="panel homework-section-entry"><div><h2>帶回家再練一次</h2><p>自由勾選本課任務與綜合練習，預覽後列印或存成 PDF。</p></div>${button()}</section>`);}
 const originalRender=render;
 render=function(...args){const result=originalRender.apply(this,args);addSectionEntry();return result;};
 addSectionEntry();
 const choices=kind=>catalog.filter(c=>c.kind===kind).map(c=>`<label><input type="checkbox" name="homework-item" value="${escape(c.key)}"><span>${escape(c.label)}${kind==='integrated'?`<small>${c.exercises.length} 個情境</small>`:''}</span></label>`).join('');
 const dialog=document.createElement('dialog');dialog.className='homework-dialog';dialog.setAttribute('aria-labelledby','homework-title');
 dialog.innerHTML=`<div class="homework-heading"><div><p class="fine">${escape(lesson)}</p><h2 id="homework-title">製作回家功課</h2></div><button type="button" data-homework-close autofocus>關閉</button></div>
 <p>勾選這次要帶回家的內容，可自由搭配，不需要先完成課堂練習。</p>
 <div class="homework-selection-actions"><button type="button" data-homework-select="all">全部勾選</button><button type="button" data-homework-select="none">全部取消</button><label>上課日期（選填）<input id="homework-date" type="date"></label></div>
 <div class="homework-settings"><fieldset><legend>一般任務</legend><div class="homework-rounds">${choices('task')}</div></fieldset>${catalog.some(c=>c.kind==='integrated')?`<fieldset><legend>綜合練習</legend><div class="homework-rounds">${choices('integrated')}</div><p class="fine">每組包含所列的全部情境，與一般任務分開呈現。</p></fieldset>`:''}</div>
 <div class="homework-print-actions"><button type="button" id="homework-print" disabled>列印／存成 PDF</button><p id="homework-status" role="status" aria-live="polite"></p></div>
 <p class="fine">講義依序排列：練習題 → 關鍵字提示 → 參考回答。紙本提供口說練習；聽力請回教材第七部分播放。</p>
 <p class="fine">在列印視窗選「另存為 PDF」，使用 A4 紙張、100% 縮放，關閉頁首頁尾。下方是白底紙本預覽。</p>
 <iframe id="homework-preview" title="回家功課紙本預覽"></iframe>`;
 document.body.append(dialog);
 const frame=dialog.querySelector('iframe'),printButton=dialog.querySelector('#homework-print'),status=dialog.querySelector('#homework-status');
 let opener=null,revision=0,lastContext=null;
 const paperCSS=`
 *{box-sizing:border-box}html{color-scheme:light}body{margin:0;background:#e9eeeb;color:#233c33;font:11pt/1.65 "Microsoft JhengHei","PingFang TC",sans-serif}h1,h2,h3,p{margin:0 0 9px}h1{font-size:24pt;line-height:1.3}h2{font-size:16pt;line-height:1.4}h3{font-size:12pt;line-height:1.5}p,li{overflow-wrap:anywhere}h1,h2,h3{color:#28584f}h2,h3,.exercise-heading{break-after:avoid}.sheet{max-width:794px;margin:18px auto;padding:40px 46px;background:white}.eyebrow{font-size:9pt;color:#52675e;letter-spacing:.04em}.meta{border-bottom:1px solid #b9c9c1;padding-bottom:10px;margin:12px 0 16px;font-size:10pt}.guide{padding:10px 14px;background:#eff4f1;border-left:3px solid #527a69;font-size:10.5pt}.exercise{margin:22px 0}.exercise-heading{border-top:1px solid #b9c9c1;padding-top:12px}.scope,.fine{font-size:10pt;color:#42594e}.scope{margin:0 0 4px}.notes{height:28px;border-bottom:1px solid #b9c9c1;margin:4px 0 8px}.check{font-size:10pt;color:#42594e;break-inside:avoid}.step{margin:9px 0;break-inside:avoid}.step p{margin:3px 0}.phase{font-weight:700;color:#28584f}.information{padding-left:10px;border-left:2px solid #b9c9c1;font-size:10pt;color:#42594e}.reference{padding:7px 0;border-bottom:1px solid #d3ddd7;break-inside:avoid}.reference p{margin:3px 0}.reference .other{font-size:10pt;color:#52675e}.reference .speaker{font-weight:700}.hint-row{display:flex;gap:10px;align-items:baseline;margin:6px 0;break-inside:avoid}.hint-row b{font-size:10pt;flex-shrink:0}.hint-row p{margin:0}
 @media(max-width:560px){.sheet{margin:0 0 14px;padding:22px 18px}h1{font-size:21pt}}
 @page{size:A4;margin:14mm}
 @media print{body{background:white}.exercise{break-inside:avoid}.sheet{max-width:none;margin:0;padding:0;break-after:page}.sheet:last-child{break-after:auto}.guide{background:white}a{color:inherit}}
 `;
 function handout(selected,date,token){
  const scope=selected.map(c=>c.short).join('、'),title=`第${course.day}天_回家功課_${selected.length}項${date?'_'+date:''}`;
  const paperSelfCheck=Number(course.day)===1?'':'<p class="check">□ 自己能說　 □ 需要提示　 □ 想下次再練</p>';
  const exercises=selected.flatMap(c=>c.exercises.map(e=>({...e,key:c.key,kind:c.kind,selection:c.label})));
  const heading=label=>`<p class="eyebrow">TRAVEL LAB / DAY ${course.day}</p><h1>${label}</h1><p class="meta">${escape(lesson)}<br>姓名：____________　上課日期：${date?escape(date):'____________'}<br>本次範圍：${escape(scope)}</p>`;
  const exerciseHeading=(e,i)=>`<div class="exercise-heading"><p class="scope">${e.kind==='task'?'一般任務':'綜合練習'} · ${escape(e.selection)}</p><h2>${i+1}. ${escape(e.title)}</h2></div>`;
  const stepsFor=e=>e.kind==='task'?'':e.steps.map((s,j)=>`<div class="step">${s.phase&&s.phase!=='課後練習'&&s.phase!==e.steps[j-1]?.phase?`<p class="phase">${escape(s.phase)}</p>`:''}${s.phaseContext?`<p class="fine">${escape(s.phaseContext)}</p>`:''}${s.askFirst===false&&s.zh?`<p class="information">對方先問：${escape(s.zh)}</p>`:''}<p>${j+1}. ${escape(s.task||s.label)}</p>${s.askFirst!==false&&s.zh?`<p class="information">對方回應：${escape(s.zh)}</p>`:''}</div>`).join('');
  const questions=`<section class="sheet" data-paper-section="questions">${heading('回家功課 · 先自己說')}<p class="guide">這次共選 ${selected.length} 項，包含 ${exercises.length} 個練習情境。依題目大聲說，用自己的話完成任務；留白可記關鍵字，不必抄整句。紙本的對方資訊可直接閱讀，聽力請回教材第七部分播放。</p>${exercises.map((e,i)=>`<article class="exercise" data-homework-key="${escape(e.key)}">${exerciseHeading(e,i)}<p>${escape(e.context)}</p>${e.information?`<p class="information">這次飯店提供的資訊：${escape(e.information)}</p>`:''}${stepsFor(e)}<div class="notes"></div>${paperSelfCheck}</article>`).join('')}</section>`;
  const hints=`<h2>卡住再看：關鍵字</h2>${exercises.map((e,i)=>`<article class="exercise">${exerciseHeading(e,i)}${e.steps.map((s,j)=>`<div class="hint-row"><b>${e.kind==='task'?'本題':`${j+1}.`}</b><p lang="en">${escape(s.alternatives?s.alternatives.map(a=>a.words).join('　或　'):s.words)}</p></div>`).join('')}</article>`).join('')}`;
  const dialogue=(s,studentOnly=false)=>{const say=`<p class="speaker" lang="en">我：${escape(s.answer)}</p>${s.answerZh?`<p class="fine">${escape(s.answerZh)}</p>`:''}`,other=!studentOnly&&s.line?`<p class="other" lang="en">對方：${escape(s.line)}</p>${s.zh?`<p class="fine">${escape(s.zh)}</p>`:''}`:'';return s.askFirst===false?other+say:say+other;};
  const answers=`<h2>說完再核對：參考回答</h2><p class="fine">意思清楚、符合情境即可，不必逐字相同。對方的話用來理解接話順序。</p>${exercises.map((e,i)=>`<article class="exercise">${exerciseHeading(e,i)}${e.steps.map((s,j)=>`<div class="reference">${e.kind==='integrated'?`<h3>${j+1}. ${escape(s.label||s.task)}</h3>`:''}${s.alternatives?s.alternatives.map(a=>`<p class="fine">${escape(a.task)}</p>${dialogue(a)}`).join('<p class="fine">或（選一種決定）</p>'):dialogue(s,e.kind==='task')}</div>`).join('')}${e.check?`<p class="fine">核對重點：${escape(e.check)}</p>`:''}</article>`).join('')}`;
  const reference=selected.length===1&&selected[0].kind==='task'?`<section class="sheet" data-paper-section="reference">${heading('提示與參考回答')}${hints}${answers}</section>`:`<section class="sheet" data-paper-section="hints">${heading('需要時再看提示')}${hints}</section><section class="sheet" data-paper-section="answers">${heading('說完再看參考回答')}${answers}</section>`;
  return `<!doctype html><html lang="zh-Hant" data-homework-revision="${token}"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escape(title)}</title><style>${paperCSS}</style></head><body>${questions}${reference}<\/body></html>`;
 }
 function refresh(){
  const token=++revision;printButton.disabled=true;
  const checked=new Set([...dialog.querySelectorAll('[name=homework-item]:checked')].map(el=>el.value)),selected=catalog.filter(c=>checked.has(c.key));
  if(!selected.length){frame.hidden=true;frame.srcdoc='';status.textContent='請至少勾選一項，才能預覽與匯出。';return;}
  status.textContent='正在準備講義預覽…';frame.hidden=false;
  frame.onload=()=>{if(token!==revision||frame.contentDocument?.documentElement.dataset.homeworkRevision!==String(token))return;frame.contentDocument.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();dialog.close();}});printButton.disabled=false;const tasks=selected.filter(c=>c.kind==='task').length,groups=selected.length-tasks,count=selected.reduce((n,c)=>n+c.exercises.length,0);status.textContent=`已選 ${tasks} 個任務${groups?`、${groups} 組綜合練習`:''}，共 ${count} 個情境。預覽已更新。`;};
  frame.srcdoc=handout(selected,dialog.querySelector('#homework-date').value,token);
 }
 function currentKey(){
  if(document.querySelector('#main .cap-shell'))return 'integrated:capstone';
  const common=document.querySelector('.ci-content[data-ci-group-id]');if(common)return 'integrated:'+common.dataset.ciGroupId;
  if(document.body.classList.contains('hi-active'))return 'integrated:'+(document.querySelector('.hx-content[data-hx-group]')?.dataset.hxGroup||'checkin');
  const current=typeof currentRound==='function'?currentRound():activeRound();return 'task:'+current.id;
 }
 document.addEventListener('click',e=>{const b=e.target.closest('[data-homework-open]');if(!b)return;stopAudio();opener=b;const current=currentKey();if(current!==lastContext){dialog.querySelectorAll('[name=homework-item]').forEach(el=>el.checked=el.value===current);lastContext=current;}dialog.showModal();dialog.scrollTop=0;refresh();});
 dialog.querySelector('[data-homework-close]').addEventListener('click',()=>dialog.close());
 dialog.addEventListener('close',()=>{if(opener?.isConnected)opener.focus({preventScroll:true});});
 dialog.addEventListener('change',e=>{if(e.target.matches('input'))refresh();});
 dialog.addEventListener('click',e=>{const b=e.target.closest('[data-homework-select]');if(!b)return;dialog.querySelectorAll('[name=homework-item]').forEach(el=>el.checked=b.dataset.homeworkSelect==='all');refresh();});
 printButton.addEventListener('click',()=>{if(printButton.disabled)return;try{frame.contentWindow.focus();frame.contentWindow.print();printButton.focus();}catch{status.textContent='目前瀏覽器無法開啟列印。請用 Edge 或 Chrome 開啟本課教材，再試一次。';}});
})();
