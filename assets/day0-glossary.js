// A local glossary: reading a meaning never requires audio, a network, or storage.
(() => {
 const korean=language==='ko',languageName=korean?'韓文':'日文';
 const main=document.querySelector('#main');
 const entries=day0GlossaryData.map(([text,kana,meaning,note=''])=>({text,kana,meaning,note})).sort((a,b)=>b.text.length-a.text.length);
 const segments=text=>{
  const number=numberWords.find(([jp])=>jp===text);
  if(number)return [{from:0,to:text.length,entry:{text,kana:korean?readings[text]:text,meaning:'數字 '+number[1],note:korean?'這組數字用於金額與分鐘；數物品先練 한 개（一個）、두 개（兩個）。':'這是基本數字的讀法；數物品時，一個、兩個用「ひとつ、ふたつ」。'}}];
  const memo=new Map();
  const parse=at=>{
   if(at===text.length)return [];
   if(memo.has(at))return memo.get(at);
   if(/[\s。、！？,.!?／/]/u.test(text[at]))return parse(at+1);
   for(const entry of entries){
    if(!text.startsWith(entry.text,at))continue;
    const to=at+entry.text.length,rest=parse(to);
    if(rest){const result=[{from:at,to,entry},...rest];memo.set(at,result);return result;}
   }
   memo.set(at,null);return null;
  };
  // Require a complete match. Backtrack when はい would steal は from はいくら.
  return parse(0)||[];
 };
 const panel=document.createElement('aside');
 panel.id='japanese-word-meaning';panel.className='jp-glossary';panel.hidden=true;panel.tabIndex=-1;panel.lang='zh-Hant';
 panel.setAttribute('role','dialog');panel.setAttribute('aria-modal','false');
 panel.setAttribute('aria-labelledby','jp-glossary-title');panel.setAttribute('aria-describedby','jp-glossary-content');
 panel.innerHTML='<div class="jp-glossary-heading"><strong id="jp-glossary-title">詞語意思</strong><button type="button" aria-label="關閉詞語意思">關閉 ×</button></div><div id="jp-glossary-content"></div>';
 document.body.append(panel);
 const content=panel.querySelector('#jp-glossary-content');
 const meanings=new WeakMap();let origin=null;
 const close=(restore=false)=>{
  const previous=origin;origin=null;panel.hidden=true;
  if(previous){previous.classList.remove('jp-word-selected');previous.setAttribute('aria-expanded','false');}
  if(restore&&previous?.isConnected&&previous.getClientRects().length)previous.focus({preventScroll:true});
 };
 const position=()=>{
  if(!origin?.isConnected||!origin.getClientRects().length){close();return;}
  const v=window.visualViewport,left=v?.offsetLeft||0,top=v?.offsetTop||0,width=v?.width||innerWidth,height=v?.height||innerHeight;
  panel.style.maxWidth=Math.max(0,width-24)+'px';panel.style.maxHeight=Math.max(0,height-24)+'px';
  const r=origin.getBoundingClientRect(),p=panel.getBoundingClientRect();
  if(r.bottom<top||r.top>top+height||r.right<left||r.left>left+width){close();return;}
  const x=Math.min(Math.max(left+12,r.left),left+width-p.width-12);
  let y=r.bottom+10;
  if(y+p.height>top+height-12)y=r.top-p.height-10;
  y=Math.max(top+12,Math.min(y,top+height-p.height-12));
  panel.style.left=x+'px';panel.style.top=y+'px';
 };
 const show=(button,items,fragment='')=>{
  if(!items.length)return;
  close();origin=button;
  button.classList.add('jp-word-selected');button.setAttribute('aria-expanded','true');button.setAttribute('aria-controls',panel.id);
  content.replaceChildren();
  for(const entry of items){
   const item=document.createElement('div');item.className='jp-glossary-entry';
   const word=document.createElement('p');word.className='jp-glossary-word';word.lang=language;word.textContent=entry.text;
   const reading=document.createElement('p');reading.className='jp-glossary-reading';reading.lang=korean?'ko-Latn':'ja';reading.textContent=entry.kana;
   const meaning=document.createElement('p');meaning.className='jp-glossary-meaning';meaning.textContent=entry.meaning;
   if(korean){const details=document.createElement('details');details.className='reading';const summary=document.createElement('summary');summary.textContent='看羅馬拼音';details.append(summary,reading);item.append(word,meaning,details);}else item.append(word,reading,meaning);
   if(entry.note){const note=document.createElement('p');note.className='jp-glossary-note';note.textContent=entry.note;item.append(note);}
   content.append(item);
  }
  if(fragment&&!(items.length===1&&items[0].text===fragment)){
   const note=document.createElement('p');note.className='jp-glossary-fragment';
   note.textContent=items.length===1?'「'+fragment+'」在這句中是「'+items[0].text+'」的一部分，請整組理解。':'這個聲音片段包含上面的詞語，請依完整詞語理解。';content.append(note);
  }
  panel.hidden=false;position();panel.focus({preventScroll:true});
 };
 const decorate=()=>{
  const selector=`.en[lang="${language}"], .task-words b[lang="${language}"], .japanese-numbers span[lang="${language}"], .inventory td[lang="${language}"]`;
  let count=0;
  for(const line of main.querySelectorAll(selector)){
   if(line.children.length)continue;
   const text=line.textContent,parts=segments(text);if(!parts.length)continue;
   const fragment=document.createDocumentFragment();let at=0;
   for(const part of parts){
    fragment.append(document.createTextNode(text.slice(at,part.from)));
    const word=document.createElement('button');word.type='button';word.className='jp-word';word.lang='zh-Hant';
    word.setAttribute('aria-label','查看「'+part.entry.text+'」的意思');word.setAttribute('aria-haspopup','dialog');
    word.setAttribute('aria-controls',panel.id);word.setAttribute('aria-expanded','false');
    const label=document.createElement('span');label.lang=language;label.textContent=part.entry.text;word.append(label);
    meanings.set(word,part.entry);fragment.append(word);at=part.to;
   }
   fragment.append(document.createTextNode(text.slice(at)));line.replaceChildren(fragment);count++;
  }
  if(count&&!main.querySelector('.jp-glossary-help')){
   const help=document.createElement('p');help.className='jp-glossary-help';help.textContent='有點線的'+languageName+'可以點一下，看這個詞的意思。';
   const heading=main.querySelector(':scope > .lead, :scope > .lesson-section-heading');
   if(heading)heading.after(help);
  }
 };
 const previousRender=render;
 render=function(){close();previousRender();decorate();};
 const previousStop=stopAudio;
 stopAudio=function(){close();previousStop();};
 document.addEventListener('click',event=>{
  const word=event.target.closest('.jp-word');
  if(word&&meanings.has(word)){if(origin===word)close(true);else show(word,[meanings.get(word)]);return;}
  if(!panel.hidden&&!panel.contains(event.target)&&!origin?.contains(event.target))close();
 });
 panel.querySelector('button').onclick=()=>close(true);
 panel.addEventListener('focusout',event=>{if(!panel.contains(event.relatedTarget)&&!origin?.contains(event.relatedTarget))close();});
 document.addEventListener('keydown',event=>{if(event.key==='Escape'&&!panel.hidden){event.preventDefault();close(true);}});
 document.addEventListener('focusin',event=>{if(!panel.hidden&&!panel.contains(event.target)&&!origin?.contains(event.target))close();});
 document.addEventListener('scroll',event=>{if(!panel.hidden&&!panel.contains(event.target))position();},true);
 document.addEventListener('toggle',()=>{if(origin&&!origin.getClientRects().length)close();},true);
 window.addEventListener('resize',()=>{if(!panel.hidden)position();});
 // Optional readings and wrapped text can change the popup after it is opened.
 if(typeof ResizeObserver==='function')new ResizeObserver(()=>{if(!panel.hidden)position();}).observe(panel);
 panel.addEventListener('toggle',()=>{if(!panel.hidden)position();},true);
 window.addEventListener('pagehide',()=>close());
 // Audio cues can split a meaningful expression (すみ / ません). Use text offsets
 // to show the complete expression while retaining the existing cue-only audio.
 window.day0Glossary={segments,showCue(button,text,cue){
  const parts=segments(text).filter(p=>p.from<cue.to&&p.to>cue.from);
  show(button,parts.map(p=>p.entry),cue.text);
 }};
 decorate();
})();
