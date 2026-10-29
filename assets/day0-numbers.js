// Restore the optional number reference after the small-task study page is installed.
// The existing audio player queues these recorded words and handles stop/navigation.
function numberSequenceControls(){
 const sequence=numberWords.map(([word])=>word).join(' ');
 return `<p>按一次，從 1 到 10 一個一個數給你聽；也可以點下面的數字單獨聽。</p><div class="actions number-sequence">${btn('▶ 連續聽 1～10',`data-number-sequence="true" data-say="${esc(sequence)}"`)}${btn('慢速數 1～10',`data-number-sequence="true" data-say="${esc(sequence)}" data-slow="true"`)}</div>`;
}
const day0NumberPhrasePage=phrasePage;
phrasePage=function(){
 const content=day0NumberPhrasePage();
 return mode==='reply'?content:content+(language==='ko'?koreanNumberReference():japaneseNumberReference());
};
