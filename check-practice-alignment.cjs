// Compare the actual exercises with the language taught in Part 2. A sentence
// in another task or in the legacy inventory does not count as taught here.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const curriculum = require('./assets/micro-curriculum.cjs');

const unique = values => [...new Set(values)];
const sequence = (steps, key) => steps.map(step => step[key]).join(' ');
const signature = step => JSON.stringify([step.answer, step.answerZh, step.line, step.zh, !!step.askFirst]);
const escapeHtml = value => String(value).replace(/[&<>"']/g, character => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[character]));

function verifyRenderedStudy(data) {
 let selectedRound = data.rounds[0];
 const sandbox = vm.createContext({
  ...data, document: {addEventListener() {}}, mode: 'library', taskRound: 0,
  activeRound: () => selectedRound, taskLabel: round => round.displayLabel || round.id,
  esc: escapeHtml, audio: () => '', studyUsage: () => '', studyRoleHeading: () => '',
  studyVocabulary: () => '', studyAdvanced: () => '', supportCard: () => '', btn: () => ''
 });
 vm.runInContext(fs.readFileSync('assets/dialogue-preview.js', 'utf8'), sandbox);
 vm.runInContext(fs.readFileSync('assets/lesson-guided-study.js', 'utf8'), sandbox);
 let previewExchanges = 0;
 for (const round of data.rounds) {
  selectedRound = round;
  const label = `Day ${data.course.day} / ${round.displayLabel || round.id}`;
  const core = new Set(round.phraseIds.map(id => data.phrases.find(phrase => phrase.id === id).en));
  const variations = [round.variation, ...(round.additionalVariations || [])].flatMap(variation => variation.steps);
  const expectedChanges = unique(variations.map(step => step.answer).filter(answer => !core.has(answer)));
  const changeHtml = sandbox.dgStudyChangedPhrases(round);
  assert.equal((changeHtml.match(/data-study-change=/g) || []).length, expectedChanges.length, `${label}: substitution cards are deduplicated`);
  assert(!/<details\b|\bhidden\b|\binert\b/.test(changeHtml), `${label}: required substitutions are not hidden in optional dialogue`);
  for (const answer of expectedChanges) assert(changeHtml.includes(`<p class="en" lang="en">${escapeHtml(answer)}</p>`), `${label}: visible substitution ${answer}`);

  const taughtListening = Array.from(sandbox.dgStudyHearLines(round));
  for (const step of variations) assert(taughtListening.some(line => line.en === step.line && line.zh === step.zh), `${label}: teach variation listening before practice: ${step.line}`);
  assert.equal(new Set(taughtListening.map(line => line.en)).size, taughtListening.length, `${label}: listening cards are deduplicated`);
  const html = sandbox.phrasePage();
  assert(html.includes(changeHtml), `${label}: the actual study page includes substitution cards`);
  const hearCards = html.match(/<article class="panel study-hear-card">[\s\S]*?<\/article>/g) || [];
  assert.equal(hearCards.length, taughtListening.length, `${label}: the actual study page includes every listening card`);
  for (const line of taughtListening) assert(hearCards.some(card => card.includes(`<p class="en" lang="en">${escapeHtml(line.en)}</p>`)), `${label}: render listening ${line.en}`);
  const preview = sandbox.dgStudyPreviewContent(round);
  assert(/^<details class="panel dg-dialogue-preview">/.test(preview), `${label}: dialogue starts collapsed`);
  const count = (preview.match(/data-exchange=/g) || []).length;
  assert(count >= 1 && count <= 2, `${label}: one short example, at most two exchanges`);
  assert.equal((preview.match(/data-example-kind=/g) || []).length, 1, `${label}: no repeated alternative transcripts`);
  previewExchanges += count;
 }
 return previewExchanges;
}

function verifyLesson(data) {
 const report = {day: data.course.day, tasks: 0, flowSteps: 0, replies: 0, teacherCards: 0, homeworkQuestions: 0, variationSpeaking: 0, variationListening: 0, repeatedPreviewExchanges: 0};
 for (const round of data.rounds) {
  const label = `Day ${data.course.day} / ${round.displayLabel || round.id}`;
  const expect = (condition, message) => assert(condition, `${label}: ${message}`);
  const taughtPhrases = round.phraseIds.map(id => data.phrases.find(phrase => phrase.id === id));
  expect(taughtPhrases.every(Boolean), 'every speaking card exists');
  const speaking = new Map(taughtPhrases.map(phrase => [phrase.en, phrase.zh]));
  const listening = new Map(round.hearLines.map(line => [line.en, line.zh]));
  const roles = (round.role || data.course.replyRole).split('／');
  const variations = [round.variation, ...(round.additionalVariations || [])].filter(Boolean);
  const variationSteps = variations.flatMap(variation => variation.steps);
  const primary = data.flows[round.flowIds[0]].steps;
  const allowedSteps = round.flowIds.flatMap(index => data.flows[index].steps);
  const allowedExchanges = new Set(allowedSteps.map(signature));
  report.tasks++;

  const checkRole = (step, location) => {
   if (step.role) expect(roles.includes(step.role), `${location} unexpectedly changes role to ${step.role}`);
  };
  const checkCoreStep = (step, location) => {
   expect(speaking.has(step.answer), `${location} asks for an untaught answer: ${step.answer}`);
   assert.equal(step.answerZh, speaking.get(step.answer), `${label}: ${location} answer meaning`);
   expect(listening.has(step.line), `${location} introduces an untaught line: ${step.line}`);
   assert.equal(step.zh, listening.get(step.line), `${label}: ${location} listening meaning`);
   checkRole(step, location);
  };

  for (const flowId of round.flowIds) {
   const flow = data.flows[flowId];
   expect(flow, `flow ${flowId} exists`);
   for (const [index, step] of flow.steps.entries()) {
    checkCoreStep(step, `Part 3 step ${index + 1}`);
    report.flowSteps++;
   }
   const prelude = flow.prelude || round.prelude;
   if (prelude) {
    expect(listening.has(prelude.line), `prelude was not taught: ${prelude.line}`);
    assert.equal(prelude.zh, listening.get(prelude.line), `${label}: prelude meaning`);
    checkRole(prelude, 'prelude');
   }
  }

  for (const id of [...round.replyIds, ...(round.extraReplyIds || [])]) {
   const reply = data.replies[id];
   expect(reply, `short exchange ${id} exists`);
   checkCoreStep(reply, `Part 2 short exchange ${id}`);
   expect(allowedExchanges.has(signature(reply)), 'short exchange keeps the taught speaker order and answer');
   if (reply.changeAnswer) expect(speaking.has(reply.changeAnswer), `short exchange follow-up was not taught: ${reply.changeAnswer}`);
   report.replies++;
  }

  // A variation may introduce an explicitly taught substitution. It must have
  // its own meaning and its own matching Part 4 task, rather than silently
  // changing the normal flow or the teacher's main script.
  const variationSpeaking = unique(variationSteps.map(step => step.answer).filter(answer => !speaking.has(answer)));
  const variationListening = unique(variationSteps.map(step => step.line).filter(line => !listening.has(line)));
  report.variationSpeaking += variationSpeaking.length;
  report.variationListening += variationListening.length;
  for (const [index, variation] of variations.entries()) {
   const mission = data.missions[round.missionIds[index]];
   expect(mission, `Part 4 variation ${index + 1} has an exercise`);
   assert.equal(mission.task, variation.task, `${label}: variation context`);
   assert.equal(mission.answer, sequence(variation.steps, 'answer'), `${label}: variation answer`);
   assert.equal(mission.answerZh, sequence(variation.steps, 'answerZh'), `${label}: variation meaning`);
   for (const step of variation.steps) {
    for (const key of ['answer', 'answerZh', 'line', 'zh', 'task']) expect(typeof step[key] === 'string' && step[key].trim(), `variation contains ${key}`);
    checkRole(step, 'Part 4');
   }
  }

  for (const [index, pairId] of round.pairIds.entries()) {
   const pair = data.pairs[pairId];
   const steps = data.flows[round.flowIds[index] ?? round.flowIds[0]].steps;
   expect(pair, `teacher task ${pairId} exists`);
   assert.equal(pair.answer, sequence(steps, 'answer'), `${label}: teacher support uses the same student sentences`);
   assert.equal(pair.answerZh, sequence(steps, 'answerZh'), `${label}: teacher support meaning`);
   assert.equal(pair.first, steps[0].askFirst ? '學生' : '老師', `${label}: teacher starting role`);
   assert.equal(pair.opening, steps[0].askFirst ? steps[0].answerZh : steps[0].zh, `${label}: first spoken meaning`);
   assert.equal(pair.start, steps[0].askFirst ? '' : steps[0].line, `${label}: teacher opening line`);
   assert.deepEqual(pair.goals, steps.map(step => step.label), `${label}: teacher goals stay within the taught task`);
   assert.equal(pair.cards.length, steps.length, `${label}: one teacher card per exchange`);
   pair.cards.forEach((card, stepIndex) => {
    assert.equal(card[1], steps[stepIndex].line, `${label}: teacher card line`);
    assert.equal(card[2], steps[stepIndex].zh, `${label}: teacher card meaning`);
    expect(listening.has(card[1]), `teacher asks an untaught question: ${card[1]}`);
    report.teacherCards++;
   });
  }

  assert.equal(round.checkpoint.answer, sequence(primary, 'answer'), `${label}: full-task review answer`);
  assert.equal(round.home.answer, sequence(primary, 'answer'), `${label}: homework repeats the taught answer`);
  if (round.entryCheckpoint) {
   expect(speaking.has(round.entryCheckpoint.answer), 'short entry question uses one taught sentence');
   assert.equal(round.entryCheckpoint.answerZh, speaking.get(round.entryCheckpoint.answer), `${label}: entry meaning`);
   expect(round.entryCheckpoint.task.length <= 60, 'entry question stays short enough for one instruction');
   expect((round.entryCheckpoint.task.match(/[。！？]/g) || []).length <= 1, 'entry question contains one instruction sentence');
  }
  for (const quiz of round.home.quizzes || [round.home.quiz]) {
   expect(listening.has(quiz.line), `homework listening was not taught: ${quiz.line}`);
   assert.equal(quiz.zh, listening.get(quiz.line), `${label}: homework listening meaning`);
   expect(quiz.options[quiz.correct] !== undefined, 'homework correct option exists');
   report.homeworkQuestions++;
  }
  const previewSteps = [...primary, ...(round.variationMode === 'repeat' ? [] : round.variation.steps), ...(round.additionalVariations || []).flatMap(variation => variation.steps)];
  report.repeatedPreviewExchanges += previewSteps.length - new Set(previewSteps.map(signature)).size;
 }
 return report;
}

function main() {
 const reports = Array.from({length: 13}, (_, index) => {
  const data = curriculum.make(index + 2);
  return {...verifyLesson(data), compactPreviewExchanges: verifyRenderedStudy(data)};
 });
 const totals = reports.reduce((sum, report) => {
  for (const [key, value] of Object.entries(report)) if (key !== 'day') sum[key] = (sum[key] || 0) + value;
  return sum;
 }, {});
 // Prove the check rejects the regressions it is intended to guard against.
 const unlearned = curriculum.make(2);
 unlearned.flows[unlearned.rounds[0].flowIds[0]].steps[0].answer = 'An untaught exercise sentence.';
 assert.throws(() => verifyLesson(unlearned), /untaught answer/);
 const newQuestion = curriculum.make(2);
 newQuestion.rounds[0].home.quiz.line = 'An untaught listening question.';
 if (newQuestion.rounds[0].home.quizzes) newQuestion.rounds[0].home.quizzes[0].line = newQuestion.rounds[0].home.quiz.line;
 assert.throws(() => verifyLesson(newQuestion), /homework listening was not taught/);
 console.log(`PASS practice alignment: ${reports.length} English lessons; ${JSON.stringify(totals)}`);
}

module.exports = {verifyLesson, verifyRenderedStudy};
if (require.main === module) main();
