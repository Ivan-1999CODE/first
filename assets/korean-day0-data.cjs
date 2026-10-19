const d=JSON.parse(JSON.stringify(require('./korean-day0-curriculum.json')));
const lex=require('./korean-day0-language.cjs');
d.readings={...lex.readings};d.kana={};d.numberWords=lex.numbers;
d.day0GlossaryData=lex.glossary;
const parts=text=>String(text).match(/[^.!?]+[.!?]?/g)?.map(s=>s.trim()).filter(Boolean)||[];
const meaning=text=>lex.meanings[text]||parts(text).map(s=>{if(!lex.meanings[s])throw Error('Missing Korean meaning: '+s);return lex.meanings[s];}).join(' ');
const roman=text=>lex.readings[text]||parts(text).map(s=>{if(!lex.readings[s])throw Error('Missing Korean romanization: '+s);return lex.readings[s];}).join(' ');
const answers=[d.course.answer,d.homeAnswer,...d.phrases.map(p=>p.remix),...d.replies.flatMap(q=>[q.answer,q.changeAnswer]),...d.flows.flatMap(f=>f.steps.map(t=>t.answer)),...d.missions.map(m=>m.answer),...d.pairs.map(p=>p.answer),...d.reviewTasks.map(t=>t.answer)].filter(Boolean);
d.answerTranslations=Object.fromEntries(answers.map(s=>[s,meaning(s)]));
// Every playable text, including compound replies and vocabulary, has one clip.
const texts=new Set([...answers,...d.phrases.map(p=>p.en),...d.rounds.flatMap(r=>r.hearLines.map(p=>p.en)),...d.rounds.flatMap(r=>r.words.map(w=>w[0])),...d.numberWords.map(w=>w[0]),...lex.lines.map(l=>l[1]),...d.vocabulary.map(w=>w[0])]);
d.day0AudioTranslations={};
for(const text of texts){d.day0AudioTranslations[text]=meaning(text);d.readings[text]=roman(text);}
module.exports=d;
