function reading(text){
 const value=readings[text]||(String(text).match(/[^.!?]+[.!?]?/g)||[]).map(s=>readings[s.trim()]||'').join(' ');
 return value?`<details class="reading"><summary>看羅馬拼音</summary><p lang="ko-Latn">${esc(value)}</p><p class="fine">拼音只協助起步；先聽韓文再跟讀。eo、eu 各代表一個母音，不能直接照英文拼讀。</p></details>`:'';
}
function lessonStep(f,index){return {...f.steps[index]};}
function lessonScene(){return '';}
