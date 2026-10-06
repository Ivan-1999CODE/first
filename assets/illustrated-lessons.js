// Presentation only: retain all lesson data, gates, answer keys and storage identifiers.
const illustratedRole=()=>lessonArtwork.byRound[taskRound]||lessonArtwork.byRound[0];
function lessonPicture(key,className=''){
 const src=lessonArtwork.images[key];
 if(!src)throw Error('Missing lesson illustration: '+key);
 return `<img class="lesson-illustration ${className}" data-illustration="${esc(key)}" src="${src}" width="640" height="640" alt="" decoding="async">`;
}
function lessonCast(role,hero=false){
 return `<div class="lesson-cast${hero?' hero-cast':''}"><figure>${lessonPicture(role.self)}<figcaption>${hero?'': '學生 · '}${esc(role.label)}</figcaption></figure><span class="cast-link" aria-hidden="true">↔</span><figure>${lessonPicture(role.other)}<figcaption>${hero?'':'老師 · '}${esc(role.otherLabel)}</figcaption></figure></div>`;
}
roleAvatar=function(me=false){return lessonPicture(illustratedRole()[me?'self':'other'],'role-avatar role-portrait');};
roleHeader=function(me,title,subtitle){return `<div class="role-heading">${roleAvatar(me)}<div><p class="role-label">${me?'我 · '+esc(illustratedRole().label):esc(course.replyRole)}</p><h3>${esc(title)}</h3><p class="fine">${esc(subtitle)}</p></div></div>`;};
// One role reminder for the whole task, rather than repeating a portrait on every teacher cue.
pairPage=taskPairPage;
course.art=lessonArtwork.heroImage
 ?`<div class="lesson-hero-scene">${lessonPicture(lessonArtwork.heroImage)}</div>`
 :lessonCast({...lessonArtwork,otherLabel:lessonArtwork.byRound[0].otherLabel},true);

const renderBeforeIllustrations=render;
render=function(){
 renderBeforeIllustrations();
 const main=$('#main');
 main.dataset.lessonSection=String(page+1);
 const title=Array.from(main.children).find(n=>n.tagName==='H1');
 if(title){
  const kicker=title.previousElementSibling,lead=title.nextElementSibling;
  const header=document.createElement('header'),copy=document.createElement('div');
  header.className='lesson-section-heading';
  if(kicker?.classList.contains('eyebrow'))copy.append(kicker);
  copy.append(title);
  if(lead?.classList.contains('lead'))copy.append(lead);
  header.append(copy);
  if(page===5){const figure=document.createElement('figure');figure.className='lesson-notebook';figure.innerHTML=lessonPicture('notebook');header.append(figure);}
  main.prepend(header);
 }
 if(page===1&&mode==='library'){
  const intro=main.querySelector('.phrase-role');
  if(intro){intro.querySelector('.role-avatar')?.remove();intro.classList.add('phrase-introduction');}
 }
 if(page===3){
  const panel=main.querySelector('.grid>.panel');
  if(panel){const figure=document.createElement('figure');figure.className='lesson-mission-picture';figure.innerHTML=lessonPicture(illustratedRole().self);panel.prepend(figure);}
 }
 if(page===4){
  const panel=main.querySelector('.role-grid>.panel');
  if(panel){const cast=document.createElement('div');cast.innerHTML=lessonCast(illustratedRole());panel.prepend(cast.firstElementChild);}
 }
};
