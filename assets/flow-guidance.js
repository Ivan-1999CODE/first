// Part 3 uses the same numbered roles and turn guidance in every lesson.
function flowRoleHeader(me,title,subtitle,step){
 return `<div class="role-heading"><span class="turn-number" aria-label="第 ${step} 步">${step}</span><div><p class="role-label">${me?'我・旅客':esc(course.replyRole)}</p><h3>${esc(title)}</h3><p class="fine">${esc(subtitle)}</p></div></div>`;
}
function guidedFlowTurns(t,readingHtml='',header=flowRoleHeader){
 const locked=t.askFirst&&!spoken,selfLocked=!t.askFirst&&!heard;
 const turnClass=(waiting,done)=>` flow-turn turn-${waiting?'waiting':done?'done':'current'}`;
 const turnStatus=(waiting,done,me)=>`<p class="turn-status">${waiting?'等待中 · 請先完成第 1 步':done?'✓ 已完成此步':me?'現在輪到你 · 說完再勾選':'現在聽對方 · 聽完或讀完再勾選'}</p>`;
 const speaker=`<section class="role-frame role-other${turnClass(locked,heard)}" aria-label="${esc(course.replyRole)}會說的話">${header(false,`${t.askFirst?'回覆你':'先聽'} · ${course.replyRole}會說的話`,'聽懂這次需要的資訊即可。',t.askFirst?2:1)}${turnStatus(locked,heard,false)}${locked?'<p class="listen-locked">先到下方開口並勾選，再播放對方回覆。需要時，可自行展開台詞與中文。</p>':audio(t.line)}${flowTranscript(t.line,t.zh,readingHtml)}${check('id="heard"',locked?'尚未輪到 · 先完成下方的開口確認':'我已聽完，或已讀完逐字稿',heard,locked)}</section>`;
 const self=`<section class="role-frame role-self${turnClass(selfLocked,spoken)}" aria-label="我需要說的話">${header(true,t.askFirst?'我先開口':'換我回答','↓ 看這裡，換你說',t.askFirst?1:2)}${turnStatus(selfLocked,spoken,true)}<div class="speaking-task"><p class="task">${esc(t.task)}</p>${hint(t.words,t.answer)}</div>${check('id="spoken"',selfLocked?'尚未輪到 · 先完成上方的聽讀確認':'我已用自己的聲音說',spoken,selfLocked)}</section>`;
 return `${speaker}<div class="dialogue-link" aria-hidden="true">${t.askFirst?'↑ 先從下方開口，再聽回覆':'↓ 聽過以後，換我說'}</div>${self}`;
}
