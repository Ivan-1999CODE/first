// Keep one browser document while isolated lesson views retain their own runtime.
// The downloaded HTML files still work independently, including over file://.
(() => {
 'use strict';
 if(!/^https?:$/.test(location.protocol)&&location.href!=='about:srcdoc')return;
 const base=new URL('.',document.baseURI);
 const route=value=>{
  const url=new URL(value,document.baseURI);
  if(url.origin!==base.origin||new URL('.',url).pathname!==base.pathname)return null;
  // Cloudflare Pages redirects /lesson.html to /lesson on a direct visit.
  let name=url.pathname.slice(base.pathname.length)||'index.html';
  if(!name.includes('.'))name+='.html';
  return /^(?:index|travel-english|travel-english-unit(?:[2-9]|1[0-4])-[a-z-]+|travel-japanese-day0-directions)\.html$/.test(name)?new URL(name,base).href:null;
 };
 const ownURL=route(document.baseURI);
 if(!ownURL)return;
 const embedded=window.parent!==window&&window.frameElement?.hasAttribute('data-travel-view');
 const controller=embedded?window.parent.travelApp:null;
 function wire(app){
  document.addEventListener('click',event=>{
   const a=event.target.closest('a[href]');
   if(!a||event.defaultPrevented||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey||a.hasAttribute('download')||(a.target&&a.target!=='_self'))return;
   const url=new URL(a.href,document.baseURI),target=route(url);
   if(target===ownURL&&url.hash){
    if(embedded){event.preventDefault();const el=document.getElementById(decodeURIComponent(url.hash.slice(1)));el?.scrollIntoView();el?.focus({preventScroll:true});}
    return;
   }
   if(!target)return;
   event.preventDefault();app.open(target,{hash:url.hash});
  });
  const intent=event=>{const a=event.target.closest('a[href]');if(a){const url=route(a.href);if(url&&url!==ownURL)app.prefetch(url);}};
  document.addEventListener('pointerover',intent,{passive:true});
  document.addEventListener('touchstart',intent,{passive:true});
  document.addEventListener('focusin',intent);
  window.addEventListener('travel-appearance-changed',()=>app.appearance(window));
 }
 if(embedded){if(controller)wire(controller);return;}
 if(window.travelApp)return;

 const style=document.createElement('style');
 style.textContent=`
 html.travel-app-framed,html.travel-app-framed body{overflow:hidden!important;height:100%!important}
 .travel-app-framed body>[data-travel-original]{display:none!important}
 #travel-app-views{position:fixed;inset:0;z-index:2000;pointer-events:none}
 #travel-app-views iframe{position:absolute;inset:0;width:100%;height:100%;border:0;background:transparent;visibility:hidden;pointer-events:none}
 #travel-app-views iframe[data-active]{visibility:visible;pointer-events:auto}
 #travel-app-status{position:fixed;z-index:3000;left:50%;bottom:max(20px,env(safe-area-inset-bottom));transform:translateX(-50%);width:max-content;max-width:calc(100% - 32px);padding:12px 16px;border:1px solid #d9c4ac;border-radius:16px;background:#fff7ed;color:#382c22;box-shadow:0 4px 20px #0002;font:16px/1.5 system-ui}
 #travel-app-status[hidden]{display:none}
 #travel-app-status button,#travel-app-status a{display:inline-flex;align-items:center;justify-content:center;min-height:44px;margin:4px;padding:8px 14px;border:1px solid currentColor;border-radius:10px;background:transparent;color:inherit;font:inherit;cursor:pointer}
 #travel-app-status p{margin:0 0 4px}
 `;
 document.head.append(style);
 for(const child of document.body.children)child.setAttribute('data-travel-original','');
 const host=document.createElement('div');host.id='travel-app-views';document.body.append(host);
 const status=document.createElement('div');status.id='travel-app-status';status.hidden=true;
 const message=document.createElement('p');message.role='status';message.setAttribute('aria-live','polite');status.append(message);
 const retry=document.createElement('button');retry.type='button';retry.textContent='重試';
 const direct=document.createElement('a');direct.textContent='直接開啟';
 const cancel=document.createElement('button');cancel.type='button';cancel.textContent='留在這一課';
 status.append(retry,direct,cancel);document.body.append(status);
 const initial={url:ownURL,win:window,title:document.title,scroll:0,used:0};
 const views=new Map([[ownURL,initial]]),sources=new Map(),requests=new Map();
 let current=initial,serial=0,tick=0,statusTimer,idleTimer,pending=null;
 let preference={theme:document.documentElement.dataset.theme,size:document.documentElement.dataset.size};
 window.history.scrollRestoration='manual';
 const initialAddress=location.href;
 window.history.replaceState({travelApp:true},'',initialAddress);
 function showStatus(text,failed=false){
  message.textContent=text;retry.hidden=direct.hidden=!failed;status.hidden=false;
 }
 function clearStatus(){clearTimeout(statusTimer);status.hidden=true;}
 function stop(view){view.win.stopAudio?.();}
 function applyAppearance(view){
  view.win.dispatchEvent(new view.win.CustomEvent('travel-appearance-apply',{detail:preference}));
 }
 function appearance(win){
  preference={theme:win.document.documentElement.dataset.theme,size:win.document.documentElement.dataset.size};
  for(const view of views.values())if(view.win!==win)applyAppearance(view);
 }
 function prefetch(url){
  if(views.has(url)||sources.has(url))return Promise.resolve(sources.get(url));
  if(requests.has(url))return requests.get(url);
  const abort=new AbortController(),timeout=setTimeout(()=>abort.abort(),15000);
  const request=fetch(url,{signal:abort.signal,credentials:'same-origin'}).then(async response=>{
   if(!response.ok||!response.headers.get('content-type')?.includes('text/html'))throw Error('Lesson unavailable');
   const html=await response.text();
   if(!html.includes('id="travel-app-navigation"'))throw Error('Lesson version unavailable');
   sources.set(url,html);
   while(sources.size>5)sources.delete(sources.keys().next().value);
   return html;
  }).finally(()=>{clearTimeout(timeout);requests.delete(url);});
  requests.set(url,request);
  // Speculative requests must never produce an unhandled rejection.
  request.catch(()=>{});return request;
 }
 function scheduleNext(){
  clearTimeout(idleTimer);
  if(navigator.connection?.saveData)return;
  idleTimer=setTimeout(()=>{
   const doc=current.win.document,links=[...doc.querySelectorAll('.day-switcher a[href]')];
   const index=links.findIndex(a=>route(a.href)===current.url);
   const next=links[index+1]||doc.querySelector('main a[href*="travel-"]');
   if(next){const url=route(next.href);if(url&&url!==current.url)prefetch(url);}
  },1000);
 }
 async function prepare(url,token){
  if(views.has(url))return views.get(url);
  const html=await prefetch(url);
  if(token!==serial)return null;
  const parsed=new DOMParser().parseFromString(html,'text/html');
  if(!parsed.querySelector('main'))throw Error('Lesson incomplete');
  const baseTag=document.createElement('base');baseTag.href=url;baseTag.target='_top';
  parsed.head.prepend(baseTag);
  const frame=document.createElement('iframe');frame.setAttribute('data-travel-view','');
  frame.title=parsed.title;frame.setAttribute('aria-hidden','true');frame.tabIndex=-1;
  // No iframe URL navigation: fetched documents are committed only when ready.
  const view={url,title:parsed.title,frame,win:null,scroll:0,used:++tick};
  await new Promise((resolve,reject)=>{
   const timeout=setTimeout(()=>{frame.remove();reject(Error('Lesson preparation timed out'));},15000);
   frame.onload=()=>{
    if(!frame.contentDocument?.querySelector('#travel-app-navigation'))return;
    clearTimeout(timeout);frame.onload=null;
    if(!frame.contentDocument.querySelector('main')?.children.length){frame.remove();reject(Error('Lesson did not render'));return;}
    view.win=frame.contentWindow;resolve();
   };
   frame.srcdoc='<!doctype html>'+parsed.documentElement.outerHTML;host.append(frame);
  });
  if(token!==serial){frame.remove();return null;}
  views.set(url,view);return view;
 }
 function prune(){
  // Keep the initial document plus the two most recently used lesson frames.
  for(const view of [...views.values()].filter(v=>v!==initial&&v!==current).sort((a,b)=>a.used-b.used)){
   if(views.size<=3)break;
   view.frame.remove();views.delete(view.url);
  }
 }
 function commit(view,{pop=false,hash=''}={}){
  current.scroll=current.win.scrollY;
  stop(current);
  current.win.document.querySelectorAll('dialog[open]').forEach(dialog=>dialog.close());
  if(current.frame){current.frame.removeAttribute('data-active');current.frame.setAttribute('aria-hidden','true');current.frame.tabIndex=-1;}
  current=view;current.used=++tick;applyAppearance(view);
  document.documentElement.classList.toggle('travel-app-framed',view!==initial);
  if(view.frame){view.frame.setAttribute('data-active','');view.frame.removeAttribute('aria-hidden');view.frame.removeAttribute('tabindex');}
  document.title=view.title;
  if(!pop)window.history.pushState({travelApp:true},'',view.url+hash);
  view.win.scrollTo({top:view.scroll,behavior:'instant'});
  const main=view.win.document.querySelector('main');
  if(main){main.setAttribute('tabindex','-1');main.focus({preventScroll:true});}
  if(hash){try{view.win.document.getElementById(decodeURIComponent(hash.slice(1)))?.scrollIntoView();}catch{}}
  prune();scheduleNext();
 }
 async function open(url,options={}){
  url=route(url);if(!url)return;
  const token=++serial;clearStatus();clearTimeout(idleTimer);pending={url,options};
  if(url===current.url){pending=null;scheduleNext();return;}
  stop(current);
  retry.onclick=()=>open(url,options);
  direct.href=url;direct.target='_top';
  statusTimer=setTimeout(()=>showStatus('正在準備課程，原課程仍可操作。'),650);
  try{
   const view=await prepare(url,token);
   if(token!==serial||!view)return;
   clearStatus();pending=null;commit(view,options);
  }catch(error){
   if(token!==serial)return;
   clearStatus();
   if(options.pop)window.history.replaceState({travelApp:true},'',current.url);
   // Retrying after a failed Back action must restore a matching URL as well.
   retry.onclick=()=>open(url,{hash:options.hash});
   showStatus('暫時無法開啟這一課。你的原課程和作答仍保留，可以重試。',true);
  }
 }
 cancel.onclick=()=>{
  ++serial;clearStatus();
  if(pending?.options.pop)window.history.replaceState({travelApp:true},'',current.url);
  pending=null;scheduleNext();
 };
 window.travelApp={open,prefetch,appearance};
 wire(window.travelApp);
 window.addEventListener('popstate',()=>{
  const url=route(location.href);
  if(url)open(url,{pop:true,hash:location.hash});
 });
 window.addEventListener('pagehide',()=>stop(current));
 scheduleNext();
})();
