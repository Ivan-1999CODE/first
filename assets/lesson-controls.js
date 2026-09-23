// Shared controls embedded in each lesson's app script.
(() => {
 let showChinese=false;
 const originalRender=render;
 const translations=()=>Array.from(document.querySelectorAll('#main details')).filter(el=>/中文/.test(el.querySelector('summary')?.textContent||''));
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
  if(page!==1)return;
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
 const status=document.createElement('div');status.className='lesson-audio-status';status.role='status';status.setAttribute('aria-live','polite');status.hidden=true;document.body.append(status);
 let current=null,version=0,watchdog=0,messageTimer=0;
 const message=(text,sticky=false)=>{clearTimeout(messageTimer);status.textContent=text;status.hidden=!text;if(text&&!sticky)messageTimer=setTimeout(()=>status.hidden=true,7000);};
 stopAudio=function(){
  version++;clearTimeout(watchdog);current=null;
  if(window.speechSynthesis)window.speechSynthesis.cancel();
  message('');
 };
 speak=function(text,slow=false){
  stopAudio();
  const synth=window.speechSynthesis;
  if(!synth||!window.SpeechSynthesisUtterance){message('此瀏覽器不支援朗讀。請改用 Edge 或 Chrome，或展開中文與英文繼續練習。');return;}
  const token=version;
  const voices=synth.getVoices().filter(v=>/^en(?:[-_]|$)/i.test(v.lang)).sort((a,b)=>Number(b.localService)-Number(a.localService));
  const candidates=voices.length?voices.slice(0,2):[null];
  function play(attempt){
   if(token!==version)return;
   clearTimeout(watchdog);
   const utterance=new window.SpeechSynthesisUtterance(text);current=utterance;
   utterance.lang=candidates[attempt]?.lang||'en-US';
   const normalRate=.9;
   utterance.rate=normalRate*(slow?.8:1);
   if(candidates[attempt])utterance.voice=candidates[attempt];
   const active=()=>token===version&&current===utterance;
   function failed(error){
    if(!active())return;
    clearTimeout(watchdog);current=null;
    if(['interrupted','canceled'].includes(error)){message('');return;}
    synth.cancel();
    if(attempt+1<candidates.length){play(attempt+1);return;}
    message('語音未能播放。請確認裝置音量，或換用 Edge／Chrome 重試；也可展開英文與中文繼續練習。');
   }
   utterance.onstart=()=>{if(active()){clearTimeout(watchdog);message(slow?'正在慢速朗讀…':'正在朗讀…',true);}};
   utterance.onend=()=>{if(active()){clearTimeout(watchdog);current=null;message('');}};
   utterance.onerror=e=>failed(e.error);
   message('正在準備朗讀…',true);
   watchdog=setTimeout(()=>failed('timeout'),5000);
   try{if(synth.paused)synth.resume();synth.speak(utterance);}catch{failed('synthesis-failed');}
  }
  play(0);
 };
 window.addEventListener('pagehide',()=>stopAudio());
 decorate();
})();
