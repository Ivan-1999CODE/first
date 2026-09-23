// Desktop keeps the course rail open; smaller screens use a native disclosure.
(() => {
 const menu=document.querySelector('.course-menu');
 const compact=window.matchMedia('(max-width:1100px)');
 const sync=()=>{menu.open=!compact.matches;};
 sync();
 compact.addEventListener('change',sync);
 menu.addEventListener('click',event=>{
  if(compact.matches && event.target.closest('[data-page]')) menu.open=false;
 });
})();
