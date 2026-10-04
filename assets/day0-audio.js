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
 const style=document.createElement('style');
 style.textContent='.day0-audio-status{position:fixed;bottom:16px;left:50%;transform:translateX(-50%);z-index:100;display:flex;align-items:center;gap:12px;max-width:calc(100% - 24px);padding:12px 16px;background:var(--panel);color:var(--ink);border:2px solid var(--accent);border-radius:14px;box-shadow:0 4px 24px #0003}.day0-audio-status button{flex-shrink:0}';
 document.head.append(style);
 let generation=0,timer=0;
 const message=(text,error=false)=>{clearTimeout(timer);statusText.textContent=text;notice.hidden=!text;stop.hidden=error;if(error)timer=setTimeout(()=>notice.hidden=true,12000);};
 stopAudio=function(){generation++;player.pause();player.removeAttribute('src');player.load();if(window.speechSynthesis)window.speechSynthesis.cancel();message('');};
 stop.onclick=stopAudio;
 speak=function(text,slow=false){
  stopAudio();const token=generation;
  // Reuse recorded sentences when a new task combines familiar lines.
  const clips=[];let remaining=text;
  const keys=Object.keys(day0Audio).sort((a,b)=>b.length-a.length);
  while(remaining){const key=keys.find(k=>remaining.startsWith(k));if(!key)break;clips.push(day0Audio[key]);remaining=remaining.slice(key.length);}
  if(remaining||!clips.length){message('找不到這句的音檔；請展開讀音輔助。',true);return;}
  let clipIndex=0;
  const playClip=()=>{if(token!==generation)return;player.src=clips[clipIndex];player.playbackRate=slow?.8:1;player.play().catch(failed);};
  player.onplaying=()=>{if(token===generation)message(slow?'正在慢速播放日文…':'正在播放日文…');};
  player.onended=()=>{if(token!==generation)return;if(++clipIndex<clips.length)playClip();else message('');};
  const failed=()=>{if(token===generation)message('音檔未能播放。請再按一次；若仍失敗，請用外部 Edge 開啟此檔案。',true);};
  player.onerror=failed;
  message('正在載入日文音檔…');
  playClip();
 };
 window.addEventListener('pagehide',()=>stopAudio());
})();
