// Preserve the replaced waiting-path records without crediting the new dialogue.
const day6ReadyBaseLoad = load;
load = function() {
 day6ReadyBaseLoad();
 try {
  const saved = JSON.parse(localStorage.getItem(course.id) || '{}');
  if (saved.legacy?.day6ReadyOrder) return;
  const retired = day6ReadyOrder, answers = {};
  for (const key of ['mission-'+retired.retiredMissionId,'note-'+retired.retiredPairId,'before-alt-B','after-alt-B','home-alt-B']) {
   if (typeof saved.answers?.[key] === 'string') answers[key] = saved.answers[key];
  }
  state.legacy = {...state.legacy, day6ReadyOrder:{answers,
   checks:Array.isArray(saved.checks?.[retired.retiredPairId]) ? saved.checks[retired.retiredPairId] : [],
   complete:Array.isArray(saved.complete) && saved.complete.includes(retired.retiredFlowId)}};
  for (const key of ['before-alt-B','after-alt-B','home-alt-B']) state.answers[key] = '';
 } catch { storageFailed = true; }
};
