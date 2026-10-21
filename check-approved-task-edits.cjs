// Independent expectations for the explicitly approved edits and their compiled scope.
const assert = require('node:assert/strict');
const clone = value => JSON.parse(JSON.stringify(value));
const unique = values => [...new Set(values)];
const signature = step => [step.answer, step.answerZh, step.line, step.zh, step.askFirst, step.task];
const flattenGroups = data => data.course.taskGroups?.flatMap(group => group.roundIds) || data.rounds.map(round => round.id);

function checkStructure(data) {
 const {rounds, phrases, replies, flows, missions, pairs} = data;
 for (const [field, list] of [['phraseIds', phrases], ['replyIds', replies], ['flowIds', flows], ['missionIds', missions], ['pairIds', pairs]]) {
  const ids = rounds.flatMap(round => round[field]);
  assert.equal(ids.length, list.length, `${field}: all records belong to a round`);
  assert.equal(new Set(ids).size, ids.length, `${field}: no record shared across rounds`);
  ids.forEach(id => assert(field === 'phraseIds' ? list.some(item => item.id === id) : list[id], `${field}: missing ${id}`));
 }
 assert.deepEqual(data.quizzes, rounds.flatMap(r=>r.home.quizzes||[r.home.quiz]));
 const skillIds = [];
 for (const round of rounds) {
  const mode = round.variationMode || 'change';
  assert(['change', 'core', 'repeat'].includes(mode));
  const primary = flows[round.flowIds[0]].steps;
  const alternate = round.variation.steps;
  const additional = round.additionalVariations || [];
  const primaryPhrases = (round.primaryPhraseIds || round.phraseIds).map(id => phrases.find(p => p.id === id));
  const primaryReplies = (round.primaryReplyIds || round.replyIds).map(id => replies[id]);
  const corePhrases = round.phraseIds.map(id => phrases.find(p => p.id === id));
  const maxTurns=round.merged?round.sourceIds.length*2:2;
  assert(primary.length >= 1 && primary.length <= maxTurns, `${round.id}: only approved source turns`);
  if(!round.merged)assert.equal(alternate.length, primary.length);
  assert.deepEqual(primaryPhrases.map(p => p.en), primary.map(s => s.answer));
  assert.deepEqual(primaryReplies.map(signature), primary.map(signature));
  assert.deepEqual(corePhrases.map(p => p.en), mode === 'core' ? unique([...primary, ...alternate].map(s => s.answer)) : primary.map(s => s.answer));
  assert.deepEqual(round.hearLines.map(p => p.en), unique((mode === 'core' ? [...primary, ...alternate] : primary).map(s => s.line)));
  assert.equal(round.flowIds.length, mode === 'core' ? 2 : 1);
  assert.equal(round.pairIds.length, round.flowIds.length);
  const taughtSay = new Set(corePhrases.map(p => p.en));
  const taughtHear = new Set(round.hearLines.map(p => p.en));
  if (mode === 'change') alternate.forEach(s => { taughtSay.add(s.answer); taughtHear.add(s.line); });
  additional.forEach(variation => variation.steps.forEach(s => { taughtSay.add(s.answer); taughtHear.add(s.line); }));
  assert.equal(round.missionIds.length, 1 + additional.length, `${round.id}: every taught variation has its own Part 4 task`);
  if (mode === 'repeat') assert.deepEqual(alternate.map(signature), primary.map(signature), `${round.id}: removed branch cannot reappear in Part 4`);
  for (const [branchIndex, flowId] of round.flowIds.entries()) {
   const flow = flows[flowId], steps = branchIndex ? alternate : primary, pair = pairs[round.pairIds[branchIndex]];
   assert.deepEqual(flow.steps.map(signature), steps.map(signature));
   assert(flow.steps.length >= 1 && flow.steps.length <= maxTurns);
   for (const step of flow.steps) {
    assert(taughtSay.has(step.answer), `${round.id}: untaught student answer ${step.answer}`);
    assert(taughtHear.has(step.line), `${round.id}: untaught teacher line ${step.line}`);
    assert(step.valid.length && step.valid.every(i => Number.isInteger(i) && step.objects[i]));
   }
   assert.deepEqual(pair.cards.map(card => card.slice(1)), steps.map(s => [s.line, s.zh]));
   assert.deepEqual(pair.goals, steps.map(s => s.label));
   assert.equal(pair.answer, steps.map(s => s.answer).join(' '));
   assert.equal(pair.answerZh, steps.map(s => s.answerZh).join(' '));
   assert.equal(pair.first, steps[0].askFirst ? '學生' : '老師');
   assert.equal(pair.start, steps[0].askFirst ? '' : steps[0].line);
   assert.equal(pair.objects, flow.context);
  }
  for (const index of round.replyIds) {
   const reply = replies[index];
   assert(taughtSay.has(reply.answer) && taughtHear.has(reply.line));
   assert([...primary, ...(mode === 'core' ? alternate : [])].some(s => JSON.stringify(signature(s)) === JSON.stringify(signature(reply))));
  }
  if (mode === 'core') {
   for (const step of alternate) assert(round.replyIds.some(i => replies[i].answer === step.answer && replies[i].line === step.line), 'Alternative has a taught short dialogue');
   assert.equal(round.alternativeCheckpoint.answer, alternate.map(s => s.answer).join(' '));
   assert.equal(round.alternativeCheckpoint.task, round.variation.task);
  } else assert.equal(round.alternativeCheckpoint, undefined);
  for (const step of alternate) assert(taughtSay.has(step.answer) && taughtHear.has(step.line), 'Part 4 is taught in Part 2');
  assert.equal(missions[round.missionIds[0]].answer, alternate.map(s => s.answer).join(' '));
  additional.forEach((variation, index) => {
   const mission = missions[round.missionIds[index + 1]];
   assert(variation.task && variation.steps.length >= 1 && variation.steps.length <= 2);
   assert.equal(mission.task, variation.task);
   assert.equal(mission.answer, variation.steps.map(s => s.answer).join(' '));
   assert.equal(mission.answerZh, variation.steps.map(s => s.answerZh).join(' '));
   if (variation.missionId !== undefined) assert([round.missionIds[index + 1], mission.id].includes(variation.missionId));
   for (const step of variation.steps) {
    assert(taughtSay.has(step.answer) && taughtHear.has(step.line), 'Additional Part 4 content is taught in Part 2');
    assert(step.task && step.answerZh && step.zh && typeof step.askFirst === 'boolean');
    assert(step.valid.length && step.valid.every(i => Number.isInteger(i) && step.objects[i]));
   }
  });
  for (const item of [round.checkpoint, round.home]) {
   assert.equal(item.answer, primary.map(s => s.answer).join(' '));
   assert.equal(item.task, flows[round.flowIds[0]].context);
  }
  for(const quiz of round.home.quizzes||[round.home.quiz])assert(taughtHear.has(quiz.line), 'Part 7 introduces no new listening');
  assert.equal(round.checkpoint.skills.length, primary.length);
  skillIds.push(...round.checkpoint.skills.map(s => s.id));
 }
 assert.equal(new Set(skillIds).size, skillIds.length);
 const order = flattenGroups(data);
 assert.equal(order.length, rounds.length);
 assert.deepEqual([...order].sort(), rounds.map(r => r.id).sort(), 'Chapters contain every round once');
}

const approvedGroups = {
 2: [['A', 'F'], ['G', 'H'], ['E']],
 3: [['A', 'B'], ['C'], ['D', 'E'], ['F']],
 5: [['A'], ['B', 'C'], ['D'], ['E']],
 6: [['A'], ['B'], ['C', 'D'], ['E'], ['F', 'H'], ['G']]
};
const approvedCore = {2: [], 3: ['B'], 4: ['A', 'F'], 5: [], 6: ['B']};
const approvedRepeat = {2: [], 3: [], 4: [], 5: [], 6: []};
const allowedRemoved = {
 2: [], 3: [], 4: ['Are you getting off at Central Station?'],
 5: [], 6: []
};
const allowedAdded = {2: [], 3: [], 4: ['No, I want to go to Central Station.'], 5: [], 6: []};

function verifyDay8(data) {
 checkStructure(data);
 assert.equal(data.course.id, 'travel-lab-en-day8-micro-v1', 'Existing answers keep their storage key');
 assert.deepEqual(data.course.taskGroups.map(g => g.roundIds), [['A'], ['B'], ['C', 'D'], ['E', 'E2', 'E3'], ['F', 'H', 'G'], ['I']]);
 const base = require('./assets/curriculum-rounds.cjs').make(8);
 const original = require('./assets/micro-days-7-10.cjs')[8](clone(base));
 assert.equal(data.rounds.length, original.length + 2);
 for (const [index, task] of original.entries()) {
  const round = data.rounds[index];
  assert.equal(round.id, String.fromCharCode(65 + index), 'Original task letters are stable');
  assert.equal(round.key, `micro-en-d8-${task.key}-v1`);
  assert.deepEqual([round.flowIds, round.missionIds, round.pairIds], [[index], [index], [index]], 'Original records keep their array locations');
  assert.deepEqual(data.flows[round.flowIds[0]].steps.map(s => [s.answer, s.line]), task.steps.map(s => [s.answer, s.line]), 'All original main exchanges survive');
  assert.deepEqual(round.variation.steps.map(s => [s.answer, s.line]), task.variation.steps.map(s => [s.answer, s.line]), 'All original variation exchanges survive');
 }
 for (const [id, request] of [['E2', 'Could I have some water, please?'], ['E3', 'Could I have an extra blanket, please?']]) {
  const r = data.rounds.find(r => r.id === id), main = data.flows[r.flowIds[0]].steps;
  assert.deepEqual(main.map(s => s.answer), ['This is room three oh five.', request]);
  assert.deepEqual(r.variation.steps.map(s => s.answer), ['This is room five one two.', request]);
  assert.equal(main[0].line, 'What’s your room number?');
  assert.equal(main[0].askFirst, false);
  assert.equal(main[1].askFirst, true);
  assert(main[1].line.includes('three oh five'));
  assert(r.variation.steps[1].line.includes('five one two'));
 }
 const g = data.rounds.find(r => r.id === 'G');
 assert.equal(data.flows[g.flowIds[0]].steps[0].answer, 'Yes, please.');
 assert.equal(g.variation.steps[0].answer, 'No, thank you.');
}

function verifyDay9(data) {
 checkStructure(data);
 assert.equal(data.course.id, 'travel-lab-en-day9-micro-v2');
 assert.equal(data.previousFocusKey, 'travel-lab-en-day9-micro-v1', 'Deleted task records stay in the earlier version');
 assert.deepEqual(data.rounds.map(r => r.id), ['A', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J']);
 assert.deepEqual(data.course.taskGroups.map(g => g.roundIds), [['A', 'C'], ['D', 'E', 'F'], ['G', 'H'], ['I', 'J']]);
 const base = require('./assets/curriculum-rounds.cjs').make(9);
 const original = require('./assets/micro-days-7-10.cjs')[9](clone(base));
 for (const r of data.rounds) {
  const source = original[r.id.charCodeAt(0) - 65];
  assert.equal(r.key, `micro-en-d9-${source.key}-v1`, 'Remaining task identities do not shift after removing B');
  assert.deepEqual(data.flows[r.flowIds[0]].steps.map(s => [s.answer, s.answerZh, s.line, s.zh, s.askFirst]), source.steps.map(s => [s.answer, s.answerZh, s.line, s.zh, s.askFirst]));
  assert.deepEqual(r.variation.steps.map(s => [s.answer, s.answerZh, s.line, s.zh, s.askFirst]), source.variation.steps.map(s => [s.answer, s.answerZh, s.line, s.zh, s.askFirst]));
 }
 const oldTexts = new Set(original.flatMap(t => [...t.steps, ...t.variation.steps].flatMap(s => [s.answer, s.line])));
 const newTexts = new Set(data.rounds.flatMap(r => [...data.flows[r.flowIds[0]].steps, ...r.variation.steps].flatMap(s => [s.answer, s.line])));
 assert.deepEqual([...newTexts].filter(s => !oldTexts.has(s)), [], 'Grouping adds no untaught English');
 assert.deepEqual([...oldTexts].filter(s => !newTexts.has(s)).sort(), ['Two, please.', 'Tomorrow, please.', 'Today, please.', 'How many people?', 'What day would you like to come?'].sort(), 'Only B-specific utterances are removed');
 assert(!JSON.stringify([data.rounds, data.flows, data.missions, data.pairs, data.quizzes]).includes('micro-en-d9-answer-party-day-v1'), 'B is absent from all current activities');
}

function verifyDay10(data) {
 checkStructure(data);
 assert.equal(data.course.id, 'travel-lab-en-day10-micro-v2');
 assert.equal(data.previousFocusKey, 'travel-lab-en-day10-micro-v1');
 assert.equal(data.course.title, '禮貌請求與婉拒邀請');
 assert.deepEqual(data.rounds.map(r => r.id), ['A', 'B', 'C', 'E', 'F']);
 assert.deepEqual(data.course.taskGroups.map(g => g.roundIds), [['A', 'B', 'C'], ['E', 'F']]);
 const original = require('./assets/micro-days-7-10.cjs')[10](require('./assets/curriculum-rounds.cjs').make(10));
 for (const r of data.rounds) {
  const source = original[r.id.charCodeAt(0) - 65];
  assert.equal(r.key, `micro-en-d10-${source.key}-v1`);
  assert.deepEqual(data.flows[r.flowIds[0]].steps.map(signature), source.steps.map(signature));
  assert.deepEqual(r.variation.steps.map(signature), source.variation.steps.map(signature));
  assert.deepEqual(r.words, source.words);
 }
 const removed = {
  answer: ['No, thank you.', 'Yes, please.', 'I’m sorry.', 'Are you okay?', 'I’m sorry to keep you waiting.', 'Let me help you.', 'That’s okay.', 'Yes, I’m okay.', 'My arm hurts a little.', 'Yes, thank you.'],
  line: ['Would you like some more coffee?', 'Would you like some water?', 'That’s okay.', 'Yes, I’m okay.', 'No problem.', 'Yes, thank you.', 'I’m sorry.', 'Are you okay?', 'Can I help you pick these up?']
 };
 for (const field of ['answer', 'line']) {
  const oldTexts = new Set(original.flatMap(t => [...t.steps, ...t.variation.steps].map(s => s[field])));
  const newTexts = new Set(data.rounds.flatMap(r => [...data.flows[r.flowIds[0]].steps, ...r.variation.steps].map(s => s[field])));
  assert.deepEqual([...newTexts].filter(s => !oldTexts.has(s)), [], 'Grouping adds no new English');
  assert.deepEqual([...oldTexts].filter(s => !newTexts.has(s)).sort(), removed[field].sort(), `Only the six removed tasks lose ${field} lines`);
 }
 const active = JSON.stringify([data.rounds, data.flows, data.missions, data.pairs, data.quizzes]);
 for (const id of ['D', 'G', 'H', 'I', 'J', 'K']) assert(!active.includes(`micro-en-d10-${original[id.charCodeAt(0) - 65].key}-v1`), 'Deleted task is absent from current activities: ' + id);
}

function verifyDay11(data) {
 checkStructure(data);
 assert.equal(data.course.id, 'travel-lab-en-day11-micro-v2');
 assert.equal(data.previousFocusKey, 'travel-lab-en-day11-micro-v1');
 assert.deepEqual(data.rounds.map(r => r.id), ['A', 'B', 'C', 'D', 'E']);
 assert.deepEqual(data.course.taskGroups.map(g => g.roundIds), [['A', 'B'], ['C', 'D', 'E']]);
 const original = require('./assets/micro-days-11-14.cjs')[11](require('./assets/curriculum-rounds.cjs').make(11));
 for (const [index, r] of data.rounds.entries()) {
  const source = original[index];
  assert.equal(r.key, `micro-en-d11-${source.key}-v1`);
  assert.equal(r.role, source.role);
  assert.deepEqual(data.flows[r.flowIds[0]].steps.map(signature), source.steps.map(signature));
  assert.deepEqual(r.variation.steps.map(signature), source.variation.steps.map(signature));
  assert.deepEqual(r.words, source.words);
 }
 const removed = {answer: ['I can’t find my phone.', 'I can’t find my wallet.', 'Thanks.'], line: ['Are you okay?', 'Let me help you look.']};
 for (const field of ['answer', 'line']) {
  const oldTexts = new Set(original.flatMap(t => [...t.steps, ...t.variation.steps].map(s => s[field])));
  const newTexts = new Set(data.rounds.flatMap(r => [...data.flows[r.flowIds[0]].steps, ...r.variation.steps].map(s => s[field])));
  assert.deepEqual([...newTexts].filter(s => !oldTexts.has(s)), [], 'Grouping adds no new English');
  assert.deepEqual([...oldTexts].filter(s => !newTexts.has(s)).sort(), removed[field].sort(), 'Only F-specific sentences are removed');
 }
 assert(!JSON.stringify([data.rounds, data.flows, data.missions, data.pairs, data.quizzes]).includes('micro-en-d11-missing-item-v1'), 'Deleted F is absent from all current activities');
}

function verifyDay2(data){
 checkStructure(data);
 assert.equal(data.course.id,'travel-lab-en-day2-micro-v3');
 assert.equal(data.previousFocusKey,'travel-lab-en-day2-micro-v2');
 assert(data.previousLesson.legacyKeys.includes('travel-lab-en-day2-micro-v1'));
 assert.deepEqual(data.course.taskGroups.map(g=>g.roundIds),approvedGroups[2]);
 const original=require('./assets/micro-days-2-6.cjs')[2](clone(require('./assets/day2-expanded.cjs')));
 const indexes=[0,4,5,6,7];
 assert.deepEqual(data.rounds.map(r=>r.id),['A','E','F','G','H']);
 for(const [index,sourceIndex]of indexes.entries()){
  const round=data.rounds[index],source=original[sourceIndex];
  assert.equal(round.key,`micro-en-d2-${source.key}-v1`);
  assert.deepEqual(data.flows[round.flowIds[0]].steps.map(signature),source.steps.map(signature),'Retained Day 2 dialogue stays unchanged');
  assert.deepEqual(round.variation.steps.map(signature),source.variation.steps.map(signature),'Retained Day 2 variations stay unchanged');
 }
 assert(!JSON.stringify([data.rounds,data.phrases,data.replies,data.flows,data.missions,data.pairs,data.originalPhrases]).includes('Do you have this in medium?'));
 assert(!JSON.stringify([data.rounds,data.phrases,data.replies,data.flows,data.missions,data.pairs,data.originalPhrases]).includes('Can I try it on?'));
 assert(!data.originalPhrases.some(p=>p.en.includes('T-shirt')),'Deleted clothing task does not return in the teacher phrase bank');
}

function verifyApproved(data) {
 const day = data.course.day;
 if(data.course.mergedTasks){
  verifyApproved(require('./assets/micro-curriculum.cjs').make(day,{merge:false}));
  checkStructure(data);
  require('./check-merged-tasks.cjs').verifyMerged(data);
  return;
 }
 if (data.language === 'en' && day === 2) return verifyDay2(data);
 if (data.language === 'en' && day === 8) return verifyDay8(data);
 if (data.language === 'en' && day === 9) return verifyDay9(data);
 if (data.language === 'en' && day === 10) return verifyDay10(data);
 if (data.language === 'en' && day === 11) return verifyDay11(data);
 if (data.language !== 'en' || day < 2 || day > 6) return;
 checkStructure(data);
 const revision = day >= 5 ? 3 : 2;
 assert.equal(data.course.id, `travel-lab-en-day${day}-micro-v${revision}`);
 assert.equal(data.previousFocusKey, `travel-lab-en-day${day}-micro-v${revision - 1}`);
 if (day >= 5) assert(data.previousLesson.legacyKeys.includes(`travel-lab-en-day${day}-micro-v1`), 'The earlier micro record remains available');
 if (approvedGroups[day]) assert.deepEqual(data.course.taskGroups.map(g => g.roundIds), approvedGroups[day], `Day ${day}: approved chapter mapping`);
 assert.deepEqual(data.rounds.filter(r => r.variationMode === 'core').map(r => r.id), approvedCore[day]);
 assert.deepEqual(data.rounds.filter(r => r.variationMode === 'repeat').map(r => r.id), approvedRepeat[day]);
 const base = day === 2 ? require('./assets/day2-expanded.cjs') : require('./assets/curriculum-rounds.cjs').make(day);
 const original = require('./assets/micro-days-2-6.cjs')[day](clone(base));
 assert.deepEqual(data.rounds.map(r => r.key), original.map(t => `micro-en-d${day}-${t.key}-v1`), 'Round keys and source order are preserved');
 const oldTexts = new Set(original.flatMap(t => [...t.steps, ...t.variation.steps].flatMap(s => [s.answer, s.line])));
 const newTexts = new Set(data.rounds.flatMap(r => [...data.flows[r.flowIds[0]].steps, ...r.variation.steps, ...(r.additionalVariations || []).flatMap(v => v.steps)].flatMap(s => [s.answer, s.line])));
 assert.deepEqual([...oldTexts].filter(s => !newTexts.has(s)).sort(), [...allowedRemoved[day]].sort(), `Day ${day}: only approved sentence removals`);
 assert.deepEqual([...newTexts].filter(s => !oldTexts.has(s)).sort(), [...allowedAdded[day]].sort(), `Day ${day}: only approved sentence additions`);
 const round = id => data.rounds.find(r => r.id === id);
 const speaking = id => round(id).phraseIds.map(pid => data.phrases.find(p => p.id === pid).en);
 if (day === 3) assert.deepEqual(speaking('B'), ['An aisle seat, please.', 'A window seat, please.']);
 if (day === 4) {
  assert.deepEqual(speaking('A'), ['One ticket to Central Station, please.', 'Single, please.', 'Return, please.']);
  const r = round('F'), main = data.flows[r.flowIds[0]].steps, other = r.variation.steps;
  assert.deepEqual(main.map(s => [s.askFirst, s.line, s.answer]), [[false, 'Are you getting off at River Market?', 'Yes, that’s right.'], [true, 'Get off at River Market.', 'Where should I get off?']]);
  assert.deepEqual(other.map(s => [s.askFirst, s.line, s.answer]), [[false, 'Are you getting off at River Market?', 'No, I want to go to Central Station.'], [true, 'Get off at Central Station.', 'Where should I get off?']]);
  assert.deepEqual(other.map(s => s.valid), [[1], [1]]);
 }
 if (day === 5) {
  assert(speaking('A').includes('How do I get to the museum?'));
  assert(round('E').hearLines.some(p => p.en === 'Would you like to get out here?'));
  assert(speaking('E').includes('At the entrance, please.'));
  assert.equal(round('A').variation.steps[0].line, 'Go straight. Turn left at the second intersection.');
  assert.equal(round('E').variation.steps[0].answer, 'At the corner, please.');
 }
 if (day === 6) {
  const r = round('B');
  assert.deepEqual(speaking('B'), ['Could we have another minute, please?']);
  assert.deepEqual(r.hearLines.map(p => p.en), ['Are you ready to order?', 'May I take your order?']);
  assert.equal(r.additionalVariations.length, 1, 'The original I variation is restored separately from the core May question');
  assert.deepEqual(r.additionalVariations[0].steps.map(s => [s.line, s.answer]), [['Are you ready to order?', 'Could I have another minute, please?']]);
  assert.deepEqual(r.variation.steps.map(s => [s.line, s.answer]), [['May I take your order?', 'Could we have another minute, please?']]);
  const menu = speaking('E').flatMap((_, i) => data.phrases.find(p => p.id === round('E').phraseIds[i]).illustratedOptions || []);
  assert.equal(menu.length, 11, 'Restoring the variation preserves all steak/egg choices');
  assert(menu.some(option => option.en === 'Well-done'));
  assert(round('H').goal.includes('另一筆'), 'The 8.50 bill is a separate transaction');
 }
}

module.exports = {checkStructure, verifyApproved, flattenGroups};
if (require.main === module) {
 const arg = process.argv.find(a => a.startsWith('--only=') || a.startsWith('--lessons='));
 const days = arg ? arg.split('=')[1].split(',').map(id => Number(id.replace(/^en-/, ''))) : [2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
 assert(days.length && days.every(day => [2, 3, 4, 5, 6, 7, 8, 9, 10, 11].includes(day)), 'Select approved English lessons 2–11');
 for (const day of days) { verifyApproved(require('./assets/micro-curriculum.cjs').make(day)); console.log(`PASS approved Day ${day}: groups, branches, exact sentence changes and Parts 2–7 coverage`); }
}
