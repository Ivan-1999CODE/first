// Day 1 only. Handouts contain teaching content, never saved student answers.
(() => {
 const entry=document.createElement('button');
 entry.type='button';entry.className='homework-export';entry.dataset.homeworkOpen='';
 entry.textContent='匯出今日回家練習';
 entry.setAttribute('aria-haspopup','dialog');
 const footer=document.querySelector('footer.bottom');footer.classList.add('homework-footer');
 const courseLink=document.createElement('div');courseLink.className='homework-course-link';
 while(footer.firstChild)courseLink.append(footer.firstChild);
 footer.append(courseLink,entry);

 const dialog=document.createElement('dialog');dialog.className='homework-dialog';dialog.setAttribute('aria-labelledby','homework-title');
 dialog.innerHTML=`<div class="homework-heading"><h2 id="homework-title">今日回家練習講義</h2><button type="button" data-homework-close>關閉</button></div>
 <div class="homework-settings"><fieldset><legend>今天要帶回家的任務（可複選）</legend><div class="homework-rounds">${rounds.map(r=>`<label><input type="checkbox" name="homework-round" value="${esc(r.id)}">${esc(r.id+'｜'+r.name)}</label>`).join('')}</div><p class="fine">預選目前這一輪，請依今天實際練習範圍調整。</p></fieldset><label>上課日期（選填）<input id="homework-date" type="date"></label></div>
 <p class="fine">先自己說 → 卡住再看提示 → 換個條件 → 核對參考回答。留白只記關鍵字即可。</p>
 <div class="actions"><button type="button" id="homework-print" disabled>列印／存成 PDF</button></div>
 <p class="fine">在列印視窗選「另存為 PDF」，紙張選 A4，縮放選 100%，關閉頁首頁尾。預覽與 PDF 都使用白底，方便閱讀與列印。</p>
 <p id="homework-status" role="status" aria-live="polite"></p><iframe id="homework-preview" title="今日回家練習講義預覽"></iframe>`;
 document.body.append(dialog);
 const frame=dialog.querySelector('iframe'),printButton=dialog.querySelector('#homework-print'),status=dialog.querySelector('#homework-status');
 let opener=null,revision=0;

 // Independent home scenarios provide the other person's information in Chinese.
 const homeTasks={
  A:{title:'找到火車站',task:'你要去火車站。先禮貌問路；路人告訴你在第二個路口左轉。確認左轉，再問能不能步行，最後道謝。',words:'Excuse me / train station / left / walk / thank you',answer:'Excuse me. How do I get to the train station? Turn left? Can I walk there? Thank you for your help.'},
  B:{title:'郵局太遠，換種走法',task:'你要去郵局。說明目的地並請路人指路；沒聽清楚時請他重說、在地圖上指出位置。問能否步行；得知要走 20 分鐘後，改問能不能搭公車，最後道謝。',words:'going to / post office / way / again / map / walk / bus',answer:'I’m going to the post office. Could you show me the way? Could you say that again? Could you show me on the map? Can I walk there? Can I take a bus? Thank you for your help.'},
  C:{title:'問清楚，再告訴朋友',task:'你和朋友找銀行。先禮貌問銀行在哪；路人說在第一個街角左轉。朋友剛才沒聽見，請你用英文把方向告訴他，再謝謝路人。',words:'tell me / bank / first corner / left / thank you',answer:'Can you tell me where the bank is? Turn left at the first corner. Thank you for your help.'}
 };
 function tasksFor(selected){
  if(selected.length===1){const r=selected[0];return [{...homeTasks[r.id],round:r.id},...r.missionIds.map(i=>({...missions[i],title:missions[i].name,round:r.id}))];}
  const tasks=selected.map(r=>({...homeTasks[r.id],round:r.id}));
  if(tasks.length===2){const r=selected.at(-1),m=missions[r.missionIds[1]];tasks.push({...m,title:m.name,round:r.id});}
  return tasks;
 }
 const paperCSS=`
 *{box-sizing:border-box}html{color-scheme:light}body{margin:0;background:#e9eeeb;color:#20352f;font:12pt/1.6 "Microsoft JhengHei","PingFang TC",sans-serif}h1,h2,h3,p{margin:0 0 10px}h1{font-size:24pt;line-height:1.3;color:#28584f}h2{font-size:17pt;color:#28584f}h3{font-size:13pt;line-height:1.5}p{overflow-wrap:anywhere}.sheet{max-width:794px;margin:18px auto;padding:40px 46px;background:white}.eyebrow{font-size:9pt;color:#52675e;letter-spacing:.07em}.meta{border-bottom:1px solid #b9c9c1;padding-bottom:12px;margin:14px 0 18px;font-size:10.5pt}.guide{padding:12px 16px;background:#eff4f1;border-left:3px solid #527a69;font-size:11pt}.task{margin:20px 0;break-inside:avoid}.task p{font-size:12pt}.notes{height:35px;border-bottom:1px solid #b9c9c1;margin:5px 0 9px}.check{font-size:10pt;color:#42594e}.fine{font-size:10pt;color:#42594e}.hint-row{padding:5px 0;border-bottom:1px solid #d3ddd7;break-inside:avoid}.hint-row b{display:block;font-size:12pt}.hint-row span{font-size:10.5pt}.answer{margin:17px 0;break-inside:avoid}.answer p[lang=en]{font-size:12pt}.tail{margin-top:18px;border-top:1px solid #b9c9c1;padding-top:10px;font-size:9pt;color:#52675e}.hints{margin:14px 0}.phrase-grid{display:grid;grid-template-columns:1fr 1fr;column-gap:24px}.phrase-grid .hint-row{min-width:0}.hint-row b{overflow-wrap:anywhere}.helper{margin:10px 0 14px;font-size:10.5pt}
 @media(max-width:560px){.sheet{margin:0 0 14px;padding:22px 18px}.phrase-grid{grid-template-columns:1fr}h1{font-size:21pt}}
 @page{size:A4;margin:14mm}
 @media print{body{background:white}.sheet{max-width:none;margin:0;padding:0;break-after:page}.sheet:last-child{break-after:auto}.phrase-grid{grid-template-columns:1fr 1fr}h1{font-size:24pt}h2,h3{break-after:avoid}.guide{background:white}a{color:inherit}}
 `;
 function handout(selected,date){
  const tasks=tasksFor(selected),scope=selected.map(r=>r.id).join('＋'),title=`第一天_${scope}_回家練習${date?'_'+date:''}`;
  const heading=(label)=>`<p class="eyebrow">TRAVEL LAB / DAY 1 / ${esc(scope)}</p><h1>${label}</h1><p class="meta">任務 ${esc(scope)} · 姓名：____________ · 上課日期：${date?esc(date):'____________'}</p>`;
  const footer='<p class="tail">第一天｜問路回家練習 · 路線與時間皆為教學設定 · 完成勾選不是評分。</p>';
  const taskSheet=`<section class="sheet">${heading('今天練過的，再說一次。')}<p class="guide">約 5～10 分鐘，完成 ${tasks.length} 個小任務。先不看答案，大聲說一次；卡住再翻後面的提示。留白只記關鍵字或不會的地方，不必抄整句。</p>${tasks.map((t,i)=>`<article class="task"><h2>${i+1}. ${esc(t.title)} <span class="fine">任務 ${esc(t.round)}</span></h2><p>${esc(t.task)}</p><div class="notes"></div><p class="check">□ 自己能說　 □ 需要提示　 □ 想下次再練</p></article>`).join('')}<p class="fine">一個人也能練：把題目的路人資訊當成對方已說的話，再接著說自己的句子。最後挑一題，遮住提示再說一次。</p>${footer}</section>`;
  // Include prerequisites once, even when only B or C is selected.
  const mainIds=new Set(selected.flatMap(r=>r.phraseIds)),allIds=new Set(mainIds);
  selected.forEach(r=>r.reuse.forEach(i=>allIds.add(phrases[i].id)));
  const phraseList=[...allIds].map(id=>phrases.find(p=>p.id===id));
  const hints=`<h2>卡住再看：關鍵字與句型</h2><div class="hints">${tasks.map((t,i)=>`<p class="helper"><b>第 ${i+1} 題：</b><span lang="en">${esc(t.words)}</span></p>`).join('')}</div><div class="phrase-grid">${phraseList.map(p=>`<div class="hint-row"><b lang="en">${esc(p.en)}</b><span>${esc(p.zh.includes('。')?p.zh.split('。')[0]+'。':p.zh)}${mainIds.has(p.id)?'':'（本次會用到的舊句）'}</span></div>`).join('')}</div><p class="helper"><b>替換小工具：</b>Excuse me. 不好意思。${selected.some(r=>r.id==='A')?' bus stop 公車站；Turn right? 右轉嗎？':''}${selected.some(r=>r.id==='B')?' police station 警局':''}${selected.some(r=>r.id==='C')?' first / second corner 第一／第二個街角；one block / two blocks 一／兩個街區；left / right 左／右。':''}</p>`;
  const answers=`<h2>說完再核對：參考回答</h2><p class="fine">意思清楚、符合情境即可，不必逐字相同。先試著說，再看完整句子。</p>${tasks.map((t,i)=>`<article class="answer"><h3>${i+1}. ${esc(t.title)}</h3><p lang="en">${esc(t.answer)}</p></article>`).join('')}`;
  const reference=selected.length===1?`<section class="sheet">${heading('提示與參考回答')}${hints}${answers}${footer}</section>`:`<section class="sheet">${heading('需要時再看提示')}${hints}${footer}</section><section class="sheet">${heading('說完再看參考回答')}${answers}${footer}</section>`;
  return `<!doctype html><html lang="zh-Hant"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title><style>${paperCSS}</style></head><body>${taskSheet}${reference}<\/body></html>`;
 }
 function refresh(){
  const token=++revision;printButton.disabled=true;
  const selected=rounds.filter(r=>dialog.querySelector(`input[value="${r.id}"]`).checked);
  if(!selected.length){frame.hidden=true;frame.srcdoc='';status.textContent='請至少勾選一輪，才能預覽與匯出。';return;}
  status.textContent='正在準備講義預覽…';frame.hidden=false;
  const html=handout(selected,dialog.querySelector('#homework-date').value);
  frame.onload=()=>{
   // Ignore a superseded load after changing the selection quickly.
   if(token!==revision||frame.contentDocument?.title!==new DOMParser().parseFromString(html,'text/html').title)return;
   frame.contentDocument.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();dialog.close();}});
   printButton.disabled=false;status.textContent=`已選 ${selected.map(r=>r.id).join('＋')}，共 ${tasksFor(selected).length} 個小任務。確認內容後可存成 PDF。`;
  };
  frame.srcdoc=html;
 }
 document.addEventListener('click',e=>{const b=e.target.closest('[data-homework-open]');if(!b)return;stopAudio();opener=b;dialog.querySelectorAll('[name=homework-round]').forEach(el=>el.checked=el.value===currentRound().id);dialog.showModal();refresh();});
 dialog.querySelector('[data-homework-close]').addEventListener('click',()=>dialog.close());
 dialog.addEventListener('close',()=>{if(opener?.isConnected)opener.focus({preventScroll:true});});
 dialog.addEventListener('change',e=>{if(e.target.matches('input'))refresh();});
 printButton.addEventListener('click',()=>{
  if(printButton.disabled)return;
  try{frame.contentWindow.focus();frame.contentWindow.print();printButton.focus();}catch{status.textContent='目前瀏覽器無法開啟列印。請用 Edge 或 Chrome 開啟第一天教材，再試一次。';}
 });
})();
