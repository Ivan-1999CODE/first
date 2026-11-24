// Shared controls embedded in each lesson's app script.
(() => {
 let showChinese=false;
 const originalRender=render;
 const translations=()=>Array.from(document.querySelectorAll('#main details')).filter(el=>!el.closest('.role-other')&&/中文/.test(el.querySelector(':scope > summary')?.textContent||''));
 function updateLabel(){
  const button=document.querySelector('#allChinese');
  if(!button)return;
  const items=translations(),all=items.length>0&&items.every(el=>el.open);
  button.textContent=all?'收起全部中文':'展開全部中文';
  button.setAttribute('aria-expanded',String(all));
 }
 function decorate(){
  const main=document.querySelector('#main');
  main.classList.toggle('lesson-phrase-page',page===1);
  if(page!==1||main.querySelector('.dialogue-workshop,.study-library,.study-navigation'))return;
  const heading=main.querySelector('h1');
  if(!heading)return;
  // Keep the same reading order in phrase cards and listening questions.
  translations().forEach(details=>{
   const parent=details.parentElement;
   const audio=Array.from(parent.children).find(el=>el.classList.contains('actions')&&el.querySelector('button'));
   if(!audio)return;
   const english=details.querySelector(':scope > p[lang="en"]')||parent.querySelector(':scope > p[lang="en"]');
   if(!english)return;
   audio.before(english);
   audio.after(details);
   english.classList.add('lesson-phrase-english');
   audio.classList.add('lesson-phrase-audio');
   details.classList.add('lesson-phrase-chinese');
   details.querySelector('summary').textContent='看中文意思';
  });
  const row=document.createElement('div');row.className='translation-heading';
  heading.before(row);row.append(heading);
  const button=document.createElement('button');button.id='allChinese';button.type='button';
  button.addEventListener('click',()=>{
   const items=translations();showChinese=!items.every(el=>el.open);
   items.forEach(el=>el.open=showChinese);updateLabel();
  });
  row.append(button);
  translations().forEach(el=>{el.open=showChinese;el.addEventListener('toggle',updateLabel);});
  updateLabel();
 }
 render=function(...args){originalRender(...args);decorate();};
 const style=document.createElement('style');
 style.textContent='.translation-heading{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;flex-wrap:wrap}.translation-heading h1{flex:1;min-width:min(100%,240px)}.translation-heading button{flex-shrink:0;min-height:44px;margin-left:auto}.lesson-audio-status{position:fixed;bottom:20px;left:50%;transform:translateX(-50%);z-index:1000;max-width:calc(100% - 32px);width:max-content;background:#202631;color:#fff;padding:12px 20px;border-radius:14px;box-shadow:0 4px 20px #0003}';
 document.head.append(style);
 const typography=document.createElement('style');
 typography.textContent=`
 #main.lesson-phrase-page{--lesson-text-size:17px;font-size:var(--lesson-text-size);line-height:1.7}
 :root[data-size=large] #main.lesson-phrase-page,body.large #main.lesson-phrase-page{--lesson-text-size:20px}
 #main.lesson-phrase-page .lesson-phrase-english{font-size:calc(var(--lesson-text-size)*1.28);line-height:1.6;font-weight:400;letter-spacing:normal;margin:0 0 18px;overflow-wrap:anywhere}
 #main.lesson-phrase-page .lesson-phrase-audio{display:flex;flex-wrap:wrap;gap:9px;margin:0 0 16px}
 #main.lesson-phrase-page .lesson-phrase-audio button,#main.lesson-phrase-page .lesson-phrase-chinese{font-size:var(--lesson-text-size);line-height:1.7}
 #main.lesson-phrase-page .lesson-phrase-chinese{margin:0}
 #main.lesson-phrase-page .lesson-phrase-chinese summary,#main.lesson-phrase-page .lesson-phrase-chinese p:not(.fine){font-size:var(--lesson-text-size);line-height:1.7}
 @media(max-width:700px){#main.lesson-phrase-page .lesson-phrase-english{font-size:calc(var(--lesson-text-size)*1.2)}}
 `;
 document.head.append(typography);
 decorate();
})();
