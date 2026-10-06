// Self-contained audio: no runtime network request or installed Japanese voice needed.
(() => {
 const player=new Audio();
 player.preload='none';
 player.preservesPitch=true;
 const notice=document.createElement('div');
 notice.className='day0-audio-status';notice.role='status';notice.hidden=true;
 const statusText=document.createElement('span');notice.append(statusText);
 const stop=document.createElement('button');stop.type='button';stop.textContent='停止播放';notice.append(stop);
 document.body.append(notice);
 let generation=0,timer=0,frame=0,panel=null,wordBox=null,heading=null,active=null,eventTrigger=null;
 // Capture the clicked playback control before the lesson's delegated click handler.
 document.addEventListener('click',e=>{const b=e.target.closest('[data-say]');if(b&&!b.disabled){eventTrigger=b;queueMicrotask(()=>eventTrigger=null);}},true);
 const message=(text,error=false)=>{clearTimeout(timer);statusText.textContent=text;notice.hidden=!text;stop.hidden=error;if(error)timer=setTimeout(()=>notice.hidden=true,12000);};
 const clearHighlight=()=>{if(active){active.classList.remove('is-current');active.removeAttribute('aria-current');active=null;}};
 const finishFollow=text=>{cancelAnimationFrame(frame);clearHighlight();if(heading)heading.textContent=text;};
 stopAudio=function(){generation++;cancelAnimationFrame(frame);player.onplaying=player.onended=player.onerror=player.ontimeupdate=player.onseeked=player.onpause=null;player.pause();player.removeAttribute('src');player.load();clearHighlight();panel?.remove();panel=wordBox=heading=null;if(window.speechSynthesis)window.speechSynthesis.cancel();message('');};
 stop.onclick=stopAudio;
 speak=function(text,slow=false){
  const trigger=eventTrigger||Array.from(document.querySelectorAll('[data-say]')).find(b=>b.dataset.say===text&&b.getClientRects().length);
  stopAudio();const token=generation;
  // Reuse recorded sentences when a new task combines familiar lines.
  const clips=[];let remaining=text;
  const keys=Object.keys(day0Audio).sort((a,b)=>b.length-a.length);
  while(remaining){const key=keys.find(k=>remaining.startsWith(k));if(!key)break;clips.push({text:key,src:day0Audio[key],cues:day0Timings[key]||[]});remaining=remaining.slice(key.length);}
  if(remaining||!clips.length){message('找不到這句的音檔；請展開讀音輔助。',true);return;}
  panel=document.createElement('section');panel.className='follow-along';panel.setAttribute('aria-label','日文同步跟讀');
  panel.innerHTML='<div class="follow-heading"><strong>跟著黃色標示讀</strong><button type="button" aria-expanded="true">只聽聲音</button></div><p class="follow-help">上排日文，下排羅馬字；黃色是現在唸到的詞段。ō 表示 o 的長音。</p><div class="follow-words"></div>';
  wordBox=panel.querySelector('.follow-words');heading=panel.querySelector('strong');
  const words=clips.map((clip,ci)=>{let cursor=0;const nodes=clip.cues.map((cue,i)=>{
   if(cue.from>cursor){const punctuation=document.createElement('span');punctuation.className='follow-punctuation';punctuation.textContent=clip.text.slice(cursor,cue.from);wordBox.append(punctuation);}
   const word=document.createElement('span');word.className='follow-token';word.dataset.clip=ci;word.dataset.word=i;
   const jp=document.createElement('span');jp.className='follow-japanese';jp.lang='ja';jp.textContent=cue.text;
   const rom=document.createElement('span');rom.className='follow-romaji';rom.lang='ja-Latn';rom.textContent=cue.romaji;
   word.append(jp,rom);wordBox.append(word);cursor=cue.to;return word;
  });if(cursor<clip.text.length){const punctuation=document.createElement('span');punctuation.className='follow-punctuation';punctuation.textContent=clip.text.slice(cursor);wordBox.append(punctuation);}return nodes;});
  const toggle=panel.querySelector('button'),help=panel.querySelector('.follow-help');
  toggle.onclick=()=>{const hidden=!wordBox.hidden;wordBox.hidden=help.hidden=hidden;toggle.textContent=hidden?'顯示跟讀':'只聽聲音';toggle.setAttribute('aria-expanded',String(!hidden));};
  const anchor=trigger?.closest('.actions');if(anchor)anchor.after(panel);else document.querySelector('#main').prepend(panel);
  let clipIndex=0;
  const sync=()=>{
   if(token!==generation)return;
   if(!panel?.isConnected){stopAudio();return;}
   const cues=clips[clipIndex].cues,index=cues.findIndex(c=>player.currentTime>=c.start&&player.currentTime<c.end),next=words[clipIndex][index]||null;
   if(next===active)return;clearHighlight();active=next;
   if(active){active.classList.add('is-current');active.setAttribute('aria-current','true');
    if(!wordBox.hidden){const r=active.getBoundingClientRect(),b=wordBox.getBoundingClientRect();if(r.top<b.top||r.bottom>b.bottom)wordBox.scrollTop+=r.top-b.top-8;}
   }
  };
  const tick=()=>{sync();if(token===generation&&!player.paused&&!player.ended)frame=requestAnimationFrame(tick);};
  const playClip=()=>{if(token!==generation)return;clearHighlight();player.src=clips[clipIndex].src;player.playbackRate=slow?.8:1;player.play().catch(failed);};
  player.onplaying=()=>{if(token!==generation)return;heading.textContent=slow?'慢速跟讀 · 跟著黃色標示讀':'跟著黃色標示讀';message(slow?'正在慢速播放日文…':'正在播放日文…');cancelAnimationFrame(frame);tick();};
  player.ontimeupdate=player.onseeked=sync;
  player.onpause=()=>{cancelAnimationFrame(frame);};
  player.onended=()=>{if(token!==generation)return;cancelAnimationFrame(frame);clearHighlight();if(clipIndex+1<clips.length){clipIndex++;playClip();}else{finishFollow('播放完畢 · 可以再聽一次');message('');}};
  const failed=()=>{if(token===generation){player.pause();finishFollow('音檔未能播放 · 可對照文字與讀音');message('音檔未能播放。請再按一次；若仍失敗，請用外部 Edge 開啟此檔案。',true);}};
  player.onerror=failed;
  message('正在載入日文音檔…');
  playClip();
 };
 window.addEventListener('pagehide',()=>stopAudio());
})();
