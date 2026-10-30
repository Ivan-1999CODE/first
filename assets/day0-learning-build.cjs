const fs=require('node:fs'),crypto=require('node:crypto');
// Both language builders share the same checked, embedded audio preparation.
module.exports=function prepareLearning(d){
 const ko=d.language==='ko',dir=ko?'assets/korean-day0-audio/':'assets/day0-audio/';
 const manifest=JSON.parse(fs.readFileSync(dir+'manifest.json','utf8'));
 d.day0Primer=require('./day0-primer-data.cjs').make(d.language);
 const primerItems=[...d.day0Primer.groups.flatMap(g=>g.items),...d.day0Primer.exercises];
 const lexicon={...d.practicalLexicon};
 for(const item of primerItems){
  const text=item.speakText||item.text;
  if(text&&!lexicon[text])lexicon[text]={zh:item.zh,romaji:item.romaji,kana:item.kana||text};
  // Retain metadata for a previous recording when a primer switches to a less
  // ambiguous sound source (は → ハ), without requiring unused glyph recordings.
  if(item.text!==text&&manifest[item.text]&&!lexicon[item.text])lexicon[item.text]={zh:item.zh,romaji:item.romaji,kana:item.kana||item.text};
 }
 d.optionalTravelPhrases=d.optionalTravelPhrases||null;
 d.readings={...d.readings};d.kana={...d.kana};d.day0AudioTranslations={...d.day0AudioTranslations};
 const glossaryKeys=new Set(d.day0GlossaryData.map(row=>row[0]));
 const taskWords=new Set(d.rounds.flatMap(r=>r.words.map(row=>row[0])));
 for(const [text,entry]of Object.entries(lexicon)){
  if(!entry.zh||!entry.romaji)throw Error('Missing meaning/reading: '+text);
  // Primer syllables can share a recording with numbers (に, 이, 사, 오).
  // Preserve the lesson meaning; the primer supplies its own local explanation.
  const authoredPhrase=Object.hasOwn(d.practicalLexicon,text);
  if(authoredPhrase||!d.readings[text])d.readings[text]=entry.romaji;
  if(authoredPhrase||!d.day0AudioTranslations[text])d.day0AudioTranslations[text]=entry.zh;
  if(!ko&&(authoredPhrase||!d.kana[text]))d.kana[text]=entry.kana||text;
  if(taskWords.has(text)&&!glossaryKeys.has(text))d.day0GlossaryData.push([text,ko?entry.romaji:entry.kana||text,entry.zh]);
 }
 const timings=JSON.parse(fs.readFileSync(dir+'timings.json','utf8'));
 const cueReadings=ko?require('./korean-day0-language.cjs').cueReadings:require('./day0-follow-readings.cjs');
 for(const text of Object.keys(lexicon))if(!manifest[text])throw Error('Audio not prepared: '+text);
 d.day0Timings={};d.day0Audio={};
 for(const [text,file]of Object.entries(manifest)){
  if(!d.day0AudioTranslations[text])throw Error('Missing audio translation: '+text);
  const bytes=fs.readFileSync(dir+file),timing=timings[text];
  if(!timing||timing.sha256!==crypto.createHash('sha256').update(bytes).digest('hex'))throw Error('Audio/timing mismatch: '+text);
  if(!timing.cues.length)throw Error('No audio timing: '+text);
  if(timing.cues.length===1&&timing.cues[0].text===text&&lexicon[text]){
   // A standalone は is ha, while the particle は inside a sentence is wa.
   d.day0Timings[text]=[{...timing.cues[0],romaji:lexicon[text].romaji}];
  }else if(timing.cues.every(c=>cueReadings[c.text])){
   d.day0Timings[text]=timing.cues.map(c=>({...c,romaji:cueReadings[c.text]}));
  }else{
   // New phrases have an authored whole-phrase reading. Never guess a word's reading
   // from an unrelated homograph; keep its actual recorded start/end boundaries.
   const romaji=d.readings[text];if(!romaji)throw Error('Missing audio reading: '+text);
   d.day0Timings[text]=[{text,from:0,to:text.length,start:timing.cues[0].start,end:timing.cues[timing.cues.length-1].end,romaji}];
  }
  d.day0Audio[text]='data:audio/mpeg;base64,'+bytes.toString('base64');
 }
 return d;
};
