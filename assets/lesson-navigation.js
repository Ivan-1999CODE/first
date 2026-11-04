// Shared navigation for individual tasks and seven-part integrated practice.
// State continues to belong to each lesson's existing runtime.
function dgMenuGroup(title, content) {
 return `<section class="dg-menu-group"><h3>${esc(title)}</h3><div class="dg-task-list">${content}</div></section>`;
}
function dgTaskMenu(selected, attribute='data-dg-task', extra='') {
 return dgMenuGroup('個別任務', rounds.map((r,i)=>{
  const label=r.displayLabel||r.id;
  return btn(`<span class="number">${esc(label)}</span><span>${esc(r.name)}</span><span class="dg-menu-check" aria-hidden="true">${selected===i?'✓':''}</span>`,`${attribute}="${i}"`,`aria-label="任務 ${esc(label)}：${esc(r.name)}" aria-pressed="${selected===i}"`);
 }).join(''))+extra;
}
function dgCapstoneOption(selected=false, attribute='data-page') {
 return btn('<span class="number">08</span><span>整合挑戰 · 自己完成一趟問路</span>'+`<span class="dg-menu-check" aria-hidden="true">${selected?'✓':''}</span>`,`${attribute}="7"`,`aria-pressed="${selected}"`);
}
function dgSectionSwitch(labels, selected, attribute='data-page') {
 return `<nav class="dg-section-switch" aria-label="切換章節">${labels.slice(0,7).map((label,i)=>btn(String(i+1).padStart(2,'0'),`${attribute}="${i}"`,`aria-label="${String(i+1).padStart(2,'0')} ${esc(label)}" title="${esc(label)}" ${selected===i?'aria-current="step"':''}`)).join('')}</nav>`;
}
function dgSetMenuLabel(shortName, fullName) {
 const menu=document.querySelector('#dg-menu-open');
 menu.textContent=shortName+' ▾';
 menu.title=fullName+' · 切換任務與綜合練習';
 menu.setAttribute('aria-label','選擇任務與綜合練習，目前：'+fullName);
 const nav=document.querySelector('.dg-section-switch'),current=nav?.querySelector('[aria-current=step]');
 if(current){const r=current.getBoundingClientRect(),box=nav.getBoundingClientRect();if(r.right>box.right)nav.scrollLeft+=r.right-box.right+4;else if(r.left<box.left)nav.scrollLeft-=box.left-r.left+4;}
}
function dgStickyHeight() {
 return document.querySelector('.top').getBoundingClientRect().height+document.querySelector('#dg-context').getBoundingClientRect().height;
}
function dgScrollLesson() {
 // A normal-flow anchor is stable even while the navigation itself is sticky.
 const anchor=document.querySelector('#dg-lesson-anchor');
 window.scrollTo({top:Math.max(0,anchor.getBoundingClientRect().top+scrollY-document.querySelector('.top').getBoundingClientRect().height),behavior:'instant'});
}
function dgInstallNavigation() {
 const context=document.querySelector('#dg-context'),top=document.querySelector('.top'),dialog=document.querySelector('#dg-course-dialog'),menu=document.querySelector('#dg-menu-open');
 document.body.classList.add('dg-navigation');
 const anchor=document.createElement('div');anchor.id='dg-lesson-anchor';context.before(anchor);
 document.querySelector('#dg-menu-title').textContent='選擇任務與綜合練習';
 menu.setAttribute('aria-expanded','false');
 menu.addEventListener('click',()=>menu.setAttribute('aria-expanded','true'));
 dialog.addEventListener('close',()=>{menu.setAttribute('aria-expanded','false');if(!document.activeElement||document.activeElement===document.body||dialog.contains(document.activeElement))menu.focus({preventScroll:true});});
 const measure=()=>{
  const root=document.documentElement;
  root.style.setProperty('--dg-top-height',top.getBoundingClientRect().height+'px');
  root.style.setProperty('--dg-sticky-height',dgStickyHeight()+'px');
 };
 const observer=new ResizeObserver(measure);observer.observe(top);observer.observe(context);measure();
}
