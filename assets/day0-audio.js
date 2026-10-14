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
 let generation=0,timer=0,frame=0,panel=null,wordBox=null,heading=null,active=null,eventTrigger=null,wordUrl=null;
 // Capture the clicked playback control before the lesson's delegated click handler.
 document.addEventListener('click',e=>{const b=e.target.closest('[data-say]');if(b&&!b.disabled){eventTrigger=b;queueMicrotask(()=>eventTrigger=null);}},true);
 const message=(text,error=false)=>{clearTimeout(timer);statusText.textContent=text;notice.hidden=!text;stop.hidden=error;if(error)timer=setTimeout(()=>notice.hidden=true,12000);};
 const clearHighlight=()=>{if(active){active.classList.remove('is-current');active.removeAttribute('aria-current');active=null;}};
 const finishFollow=text=>{cancelAnimationFrame(frame);clearHighlight();if(heading)heading.textContent=text;};
 const haltPlayback=()=>{
  generation++;cancelAnimationFrame(frame);
  player.onplaying=player.onended=player.onerror=player.ontimeupdate=player.onseeked=player.onpause=null;
  player.pause();player.removeAttribute('src');player.load();clearHighlight();
  if(wordUrl){URL.revokeObjectURL(wordUrl);wordUrl=null;}
 };
 stopAudio=function(){haltPlayback();panel?.remove();panel=wordBox=heading=null;if(window.speechSynthesis)window.speechSynthesis.cancel();message('');};
 stop.onclick=stopAudio;
 // Make a short WAV from the recorded cue so playback cannot spill into the next word.
 // The same HTML audio player preserves pitch at both normal and slow speed.
 const wordRecording=(buffer,cue)=>{
  const rate=buffer.sampleRate,channels=buffer.numberOfChannels;
  const first=Math.max(0,Math.floor(cue.start*rate)),last=Math.min(buffer.length,Math.ceil(cue.end*rate));
  const frames=last-first;if(frames<=0)throw Error('Empty word recording');
  const bytes=frames*channels*2,wav=new ArrayBuffer(44+bytes),view=new DataView(wav);
  const label=(at,text)=>{for(let i=0;i<text.length;i++)view.setUint8(at+i,text.charCodeAt(i));};
  label(0,'RIFF');view.setUint32(4,36+bytes,true);label(8,'WAVE');label(12,'fmt ');
  view.setUint32(16,16,true);view.setUint16(20,1,true);view.setUint16(22,channels,true);
  view.setUint32(24,rate,true);view.setUint32(28,rate*channels*2,true);view.setUint16(32,channels*2,true);view.setUint16(34,16,true);
  label(36,'data');view.setUint32(40,bytes,true);
  const samples=Array.from({length:channels},(_,i)=>buffer.getChannelData(i));
  const fade=Math.min(Math.round(rate*.003),Math.floor(frames/2));
  for(let i=0;i<frames;i++)for(let channel=0;channel<channels;channel++){
   const gain=fade?Math.min(1,i/fade,(frames-1-i)/fade):1;
   const value=Math.max(-1,Math.min(1,samples[channel][first+i]*gain));
   view.setInt16(44+(i*channels+channel)*2,Math.round(value*(value<0?32768:32767)),true);
  }
  return new Blob([wav],{type:'audio/wav'});
 };
 speak=function(text,slow=false){
  const trigger=eventTrigger||Array.from(document.querySelectorAll('[data-say]')).find(b=>b.dataset.say===text&&b.getClientRects().length);
  stopAudio();const token=generation;
  // Reuse recorded sentences when a new task combines familiar lines.
  const clips=[];let remaining=text;
  const keys=Object.keys(day0Audio).sort((a,b)=>b.length-a.length);
  while(remaining){const key=keys.find(k=>remaining.startsWith(k));if(!key)break;clips.push({text:key,src:day0Audio[key],cues:day0Timings[key]||[]});remaining=remaining.slice(key.length);}
  if(remaining||!clips.length){message('找不到這句的音檔；請展開讀音輔助。',true);return;}
  panel=document.createElement('section');panel.className='follow-along';panel.setAttribute('aria-label','日文同步跟讀');
  panel.innerHTML='<div class="follow-heading"><strong>跟著黃色標示讀</strong><button type="button" aria-expanded="true">只聽聲音</button></div><p class="follow-help">上排日文，下排羅馬字；黃色是現在唸到的詞段。點字卡，只聽這個詞段；慢速跟讀時，字卡也會慢速播放。ō 表示 o 的長音。</p><div class="follow-words"></div>';
  const followPanel=panel,decoded=new Map(),recordings=new Map();
  wordBox=panel.querySelector('.follow-words');heading=panel.querySelector('strong');
  const words=clips.map((clip,ci)=>{let cursor=0;const nodes=clip.cues.map((cue,i)=>{
   if(cue.from>cursor){const punctuation=document.createElement('span');punctuation.className='follow-punctuation';punctuation.textContent=clip.text.slice(cursor,cue.from);wordBox.append(punctuation);}
   const word=document.createElement('button');word.type='button';word.className='follow-token';word.dataset.clip=ci;word.dataset.word=i;
   word.setAttribute('aria-label','單獨聽：'+cue.text+'（'+cue.romaji+'）');
   word.title='只聽「'+cue.text+'」';word.onclick=()=>playWord(ci,i);
   const jp=document.createElement('span');jp.className='follow-japanese';jp.lang='ja';jp.textContent=cue.text;
   const rom=document.createElement('span');rom.className='follow-romaji';rom.lang='ja-Latn';rom.textContent=cue.romaji;
   word.append(jp,rom);wordBox.append(word);cursor=cue.to;return word;
  });if(cursor<clip.text.length){const punctuation=document.createElement('span');punctuation.className='follow-punctuation';punctuation.textContent=clip.text.slice(cursor);wordBox.append(punctuation);}return nodes;});
  const toggle=panel.querySelector('button'),help=panel.querySelector('.follow-help');
  toggle.onclick=()=>{const hidden=!wordBox.hidden;wordBox.hidden=help.hidden=hidden;toggle.textContent=hidden?'顯示跟讀':'只聽聲音';toggle.setAttribute('aria-expanded',String(!hidden));};
  const anchor=trigger?.closest('.actions');if(anchor)anchor.after(panel);else document.querySelector('#main').prepend(panel);
  const recordingFor=async(ci,i)=>{
   const key=ci+':'+i;if(recordings.has(key))return recordings.get(key);
   if(!decoded.has(ci))decoded.set(ci,(async()=>{
    const decoder=new AudioContext();
    try{const bytes=Uint8Array.from(atob(clips[ci].src.split(',')[1]),c=>c.charCodeAt(0));return await decoder.decodeAudioData(bytes.buffer);}
    finally{await decoder.close();}
   })().catch(error=>{decoded.delete(ci);throw error;}));
   const blob=wordRecording(await decoded.get(ci),clips[ci].cues[i]);recordings.set(key,blob);return blob;
  };
  const playWord=async(ci,i)=>{
   if(panel!==followPanel||!followPanel.isConnected)return;
   haltPlayback();const request=generation,cue=clips[ci].cues[i];
   heading.textContent='單獨聽：'+cue.text;message('正在載入「'+cue.text+'」…');
   const failedWord=()=>{if(request===generation){player.pause();finishFollow('詞段未能播放 · 請再點一次字卡');message('這個詞段未能播放，請再點一次字卡。',true);}};
   try{
    const blob=await recordingFor(ci,i);
    if(request!==generation)return;
    if(panel!==followPanel||!followPanel.isConnected){stopAudio();return;}
    wordUrl=URL.createObjectURL(blob);
    const watch=()=>{if(request!==generation)return;if(!followPanel.isConnected){stopAudio();return;}if(!player.paused&&!player.ended)frame=requestAnimationFrame(watch);};
    player.onplaying=()=>{
     if(request!==generation)return;clearHighlight();active=words[ci][i];active.classList.add('is-current');active.setAttribute('aria-current','true');
     heading.textContent=(slow?'慢速單獨聽：':'單獨聽：')+cue.text;message('正在'+(slow?'慢速':'')+'播放「'+cue.text+'」…');watch();
    };
    player.onended=()=>{if(request===generation){finishFollow('詞段播放完畢 · 點字卡可再聽');message('');}};
    player.onerror=failedWord;
    player.src=wordUrl;player.playbackRate=slow?.8:1;await player.play();
   }catch{failedWord();}
  };
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
