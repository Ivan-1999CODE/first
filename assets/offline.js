// Offline storage is separate from lesson answers and appearance preferences.
(() => {
 'use strict';
 if(window.travelOffline)return;
 const embedded=window.parent!==window&&window.frameElement?.hasAttribute('data-travel-view');
 const panel=document.createElement('section');
 panel.id='travel-offline';
 panel.setAttribute('aria-labelledby','travel-offline-heading');
 panel.innerHTML=`
  <h2 id="travel-offline-heading">把教材帶著走</h2>
  <p id="travel-offline-status" role="status" aria-live="polite">正在確認離線教材…</p>
  <p id="travel-offline-update" class="offline-note" hidden></p>
  <button id="travel-offline-retry" type="button" hidden>重試儲存離線教材</button>
  <button id="travel-offline-install" type="button" hidden>安裝到這台裝置</button>
  <details>
   <summary>離線閱讀與安裝說明</summary>
   <ol>
    <li>第一次請連上網路開啟網站，保持頁面開啟，等到顯示「已可離線閱讀」。全套教材約 14 MB。</li>
    <li>之後用同一個瀏覽器開啟原網址，就能離線閱讀目前版本的 16 堂課、切換單元及練習。</li>
    <li>想從主畫面開啟：iPhone／iPad 可用 Safari 的分享選單，選「加入主畫面」；其他裝置可用瀏覽器選單中的安裝功能。</li>
   </ol>
   <p class="offline-note">日文、韓文的教材音檔可離線播放。英文朗讀取決於裝置的離線音色；無聲音時仍可看文字練習。舊教材連結需要網路。</p>
   <p class="offline-note">作答保存在目前瀏覽器，不會自動同步到其他裝置。清除網站資料或裝置清理儲存空間後，可能需要再次連線儲存教材。</p>
  </details>`;
 const main=document.querySelector('main');
 if(document.documentElement.dataset.appearanceKind==='index'&&main)main.insertBefore(panel,main.querySelector('a[href]'));
 else document.body.append(panel);
 const status=panel.querySelector('#travel-offline-status');
 const update=panel.querySelector('#travel-offline-update');
 const retry=panel.querySelector('#travel-offline-retry');
 const install=panel.querySelector('#travel-offline-install');
 let registration=null,prompt=null,running=false,checkSerial=0;
 const state={phase:'preparing',ready:false,update:false,installable:false};
 function render(next){
  const offline=!navigator.onLine;
  const messages={
   preparing:'正在儲存離線教材，請保持頁面開啟…',
   failed:'離線教材尚未儲存完整。請確認網路及裝置空間後重試。',
   file:'這份本機教材可直接閱讀。要安裝及儲存整套課程，請從網站開啟。',
   unsupported:'此瀏覽器目前無法儲存離線教材，請改用支援此功能的瀏覽器及 HTTPS 網址。'
  };
  status.textContent=next.ready?(offline?'目前離線 · 已可離線閱讀 16 堂課。':'已可離線閱讀 · 16 堂課已儲存在這台裝置。'):
   (next.phase==='preparing'&&offline?'目前沒有網路，請連線後完成離線教材儲存。':messages[next.phase]||messages.failed);
  retry.hidden=!['failed','preparing'].includes(next.phase)||next.ready;
  retry.disabled=next.phase==='preparing'&&navigator.onLine;
  retry.textContent=retry.disabled?'正在儲存…':'重試儲存離線教材';
  install.hidden=!next.installable;
  install.disabled=!next.ready;
  update.hidden=!next.update;
  update.textContent='新版教材已備妥。關閉所有教材分頁與應用程式視窗，再重新開啟即可更新。';
 }
 function publish(){
  render(state);
  document.querySelectorAll('iframe[data-travel-view]').forEach(frame=>{
   frame.contentWindow?.dispatchEvent(new CustomEvent('travel-offline-state',{detail:{...state}}));
  });
 }
 window.travelOffline={state};
 if(embedded&&window.parent.travelOffline){
  const parent=window.parent.travelOffline;
  render(parent.state);
  window.addEventListener('travel-offline-state',event=>render(event.detail));
  retry.addEventListener('click',()=>parent.retry?.());
  install.addEventListener('click',()=>parent.install?.());
  return;
 }
 if(location.protocol==='file:'){state.phase='file';publish();return;}
 if(!window.isSecureContext||!('serviceWorker' in navigator)){state.phase='unsupported';publish();return;}
 const base=new URL('.',document.baseURI);
 function ask(worker,type='TRAVEL_OFFLINE_STATUS'){
  return new Promise((resolve,reject)=>{
   const channel=new MessageChannel();
   const timer=setTimeout(()=>{channel.port1.close();reject(Error('Offline status timeout'));},type==='TRAVEL_OFFLINE_STATUS'?12000:120000);
   channel.port1.onmessage=event=>{clearTimeout(timer);channel.port1.close();resolve(event.data);};
   worker.postMessage({type},[channel.port2]);
  });
 }
 async function refresh(){
  const serial=++checkSerial;
  const worker=registration?.active;
  if(!worker){publish();return;}
  try{
   const result=await ask(worker);
   if(serial!==checkSerial)return;
   state.ready=result.ready===true;
   state.phase=state.ready?'ready':registration.installing?'preparing':'failed';
  }catch{
   if(serial!==checkSerial)return;
   state.ready=false;state.phase='failed';
  }
  state.update=Boolean(registration.waiting);
  publish();
 }
 function observe(worker){
  if(!worker)return;
  const changed=()=>{
   if(worker.state==='installed'){
    state.update=Boolean(registration?.active);
    publish();
   }
   if(worker.state==='activated')refresh();
   if(worker.state==='redundant'){
    if(registration?.active)refresh();
    else{state.phase='failed';publish();}
   }
  };
  worker.addEventListener('statechange',changed);
  changed();
 }
 async function start(){
  if(running)return;
  running=true;state.phase='preparing';publish();
  try{
   registration=await navigator.serviceWorker.register(new URL('sw.js',base),{scope:base.href,updateViaCache:'none'});
   registration.addEventListener('updatefound',()=>observe(registration.installing));
   observe(registration.installing);
   await refresh();
   // Explicit retries also request a fresh worker after a failed installation.
   if(!registration.installing)await registration.update();
   if(registration.active&&!state.ready&&!registration.installing&&!registration.waiting){
    state.phase='preparing';publish();
    await ask(registration.active,'TRAVEL_OFFLINE_REPAIR');
    await refresh();
   }
   if(!registration.active&&!registration.installing&&!registration.waiting){state.phase='failed';publish();}
  }catch{
   if(registration?.active)await refresh();
   else{state.phase='failed';publish();}
  }finally{running=false;}
 }
 async function installApp(){
  if(!prompt||!state.ready)return;
  const current=prompt;prompt=null;
  state.installable=false;publish();
  try{await current.prompt();await current.userChoice;}catch{/* Browser menu remains available. */}
 }
 window.travelOffline.retry=start;
 window.travelOffline.install=installApp;
 retry.addEventListener('click',start);
 install.addEventListener('click',installApp);
 window.addEventListener('beforeinstallprompt',event=>{
  event.preventDefault();prompt=event;state.installable=true;publish();
 });
 window.addEventListener('appinstalled',()=>{prompt=null;state.installable=false;publish();});
 navigator.serviceWorker.addEventListener('controllerchange',refresh);
 window.addEventListener('online',()=>state.ready?refresh():start());
 window.addEventListener('offline',refresh);
 window.addEventListener('pageshow',()=>registration&&refresh());
 document.addEventListener('visibilitychange',()=>{
  if(document.visibilityState==='visible'&&registration){
   refresh();registration.update().catch(()=>{});
  }
 });
 start();
})();
