// Part 03 completion controls share placement across the existing practice engines.
// Move the existing delegated buttons; do not change their actions or saved state.
(() => {
 'use strict';
 const nextSelector='[data-page="3"],[data-ci-section="3"],[data-hi-page="3"]';
 const backSelector='[data-page="1"],[data-ci-section="1"],[data-hi-page="1"]';
 const retrySelector='[data-start],[data-d2-restart],[data-ci-restart],[data-hi-flow-restart],[data-hx-restart]';
 const previousRender=render;
 render=function(){
  previousRender();
  const main=document.querySelector('#main');
  const frame=main?.querySelector('.tc-frame,.d1-completion-frame,.integrated-completion')||main?.querySelector('.d2-completion')?.closest('.d2-scene-frame');
  if(!frame)return;
  const footer=main.querySelector('.footer-actions');
  const actions=frame.querySelector('.tc-footer .actions,.d1-completion-footer .actions,.d2-scene-footer .actions,:scope > .ci-complete > .actions');
  if(!footer||!actions)return;
  const back=footer.querySelector(backSelector);
  const next=actions.querySelector(nextSelector)||footer.querySelector(nextSelector)||main.querySelector('.d2-section-link [data-page="3"]');
  if(!back||!next)return;
  footer.querySelectorAll(nextSelector).forEach(button=>{if(button!==next)button.remove();});
  back.textContent='← 返回 02｜把句子帶著走';
  next.textContent='前往 04｜看情境，自己選用 →';
  next.classList.remove('dg-quiet');next.classList.add('primary');
  footer.classList.add('completion-section-nav');
  footer.prepend(back);footer.append(next);
  const sceneLink=main.querySelector('.d2-section-link');
  if(sceneLink&&!sceneLink.querySelector('button'))sceneLink.remove();
  actions.classList.add('completion-retry-actions');
  const retry=actions.querySelector(retrySelector);
  if(retry){retry.classList.add('completion-retry');actions.append(retry);}
 };
})();
