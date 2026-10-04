// One controller for the index and every generation of lesson runtime.
(() => {
 const root=document.documentElement;
 const sizeButton=document.getElementById('large');
 const themeButton=document.getElementById('theme')||document.getElementById('themeToggle');
 function update(){
  const dark=root.dataset.theme==='dark',large=root.dataset.size==='large';
  root.dataset.textSize=root.dataset.size;
  document.body.classList.toggle('large',large&&root.dataset.appearanceKind==='legacy');
  sizeButton.textContent=large?'標準文字':'放大文字';
  sizeButton.setAttribute('aria-pressed',String(large));
  themeButton.textContent=dark?'☀ 淺色':'☾ 深色';
  themeButton.setAttribute('aria-label',dark?'切換為淺色模式':'切換為深色模式');
  themeButton.setAttribute('aria-pressed',String(dark));
 }
 const status=document.createElement('div');
 status.className='appearance-status';status.setAttribute('role','status');status.hidden=true;
 document.body.append(status);
 let timer;
 document.addEventListener('click',event=>{
  const button=event.target.closest('button');
  if(button!==sizeButton&&button!==themeButton)return;
  // Earlier lessons have their own click handlers; handle these two controls once.
  event.stopImmediatePropagation();
  const theme=button===themeButton,key=theme?'theme':'size';
  const active=theme?'dark':'large',fallback=theme?'light':'standard';
  root.dataset[key]=root.dataset[key]===active?fallback:active;
  update();
  try{localStorage.setItem(theme?'travel-lab-theme':'travel-lab-text-size',root.dataset[key]);}
  catch{
   status.textContent='已套用外觀；此瀏覽器目前無法保存設定。';status.hidden=false;
   clearTimeout(timer);timer=setTimeout(()=>status.hidden=true,6000);
  }
 },true);
 window.addEventListener('storage',event=>{
  if(event.key==='travel-lab-theme')root.dataset.theme=event.newValue==='dark'?'dark':'light';
  else if(event.key==='travel-lab-text-size')root.dataset.size=event.newValue==='large'?'large':'standard';
  else return;
  update();
 });
 window.addEventListener('pageshow',update);
 update();
})();
