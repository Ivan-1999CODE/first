// Keep compact navigation reachable without putting fifteen lessons before every page.
(() => {
 const root=document.documentElement,header=document.querySelector('.top');
 const updateHeader=()=>root.style.setProperty('--travel-header-height',`${Math.ceil(header.getBoundingClientRect().height)}px`);
 if(header){updateHeader();new ResizeObserver(updateHeader).observe(header);}
 const menu=document.querySelector('.unit-menu');
 if(!menu)return;
 const compact=matchMedia('(max-width:1100px)');
 function sync(){
  const focused=menu.contains(document.activeElement);
  menu.open=!compact.matches;
  menu.dataset.ready='true';
  if(focused&&compact.matches)menu.querySelector('summary').focus({preventScroll:true});
 }
 sync();compact.addEventListener('change',sync);
 menu.addEventListener('keydown',event=>{
  if(event.key==='Escape'&&compact.matches&&menu.open){
   event.preventDefault();menu.open=false;menu.querySelector('summary').focus({preventScroll:true});
  }
 });
})();
