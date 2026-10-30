// Day 5 map presentation: choices keep the existing lesson events and gates.
function d5MapMarkup(f, t, {choice, confirmed, correct}) {
 if (!f.id.startsWith('micro-en-d5-')) return '';
 const index = f.steps.findIndex(step => step.id === t.id);
 if (index < 0) return '';
 const selected = Number.isInteger(choice) && choice >= 0 && choice < t.objects.length;
 const label = selected ? t.objects[choice][1] : '';
 const result = selected ? (correct ? 'correct' : 'wrong') : 'pending';
 const directions = f.id.includes('directions-and-distance');
 const taxi = f.id.includes('taxi-trip');
 const pickup = f.id.includes('driver-and-pickup');
 const dropoff = f.id.includes('dropoff-and-stop');
 if (!directions && !taxi && !pickup && !dropoff) return '';
 const routeChoice = directions && index === 0;
 const museumRoute = 'M208 276 V180 H72';
 const cafeRoute = 'M208 276 V84 H72';
 const hotelRoute = 'M208 276 V180 H330';
 let route = '', point = [208, 276], vehicle = !directions, prompt = '完成對話後，點選符合情境的選項。';
 if (directions) {
  prompt = index === 0 ? '面朝地圖上方。點路口的 ① 或 ②，看看你會走到哪裡。' : '路線已問清楚，接著聽步行時間。';
  if (selected || index > 0) {
   const second = index === 0 && label.includes('第二個');
   route = second ? cafeRoute : museumRoute;
   point = second ? [72, 84] : [72, 180];
  }
 } else if (taxi) {
  prompt = ['先決定怎麼移動，再告訴司機目的地。','選一個目的地，看看計程車往哪裡走。','車程多久？聽完後選一個時間。','這趟車多少錢？選出你聽到的車資。'][index] || prompt;
  if (index === 0 && selected) vehicle = !label.includes('走路');
  if ((index === 1 && selected) || index > 1) {
   const hotel = index === 1 && label.includes('飯店');
   route = hotel ? hotelRoute : museumRoute;
   point = hotel ? [330, 180] : [72, 180];
  }
 } else if (pickup) {
  point = [330, 180];
  prompt = index === 0 ? '先確認接你的司機，再說等車位置。' : '選出你的等車位置，讓司機知道去哪裡接你。';
  if (selected) {
   if (index === 1 && label.includes('博物館')) {point = [72, 180]; route = 'M208 276 V180 H72';}
   else if (index === 0 && label.includes('不是')) {point = [208, 248]; route = 'M208 276 V248';}
   else route = hotelRoute;
  }
 } else {
  point = index === 0 ? [150, 180] : [72, 180];
  prompt = index === 0 ? '車還沒到入口。選擇你要在哪裡下車。' : '現在到了入口。告訴司機要停下，還是繼續前進。';
  if (selected) {
   if (index === 0) {point = label.includes('現在') ? [150, 180] : [72, 180]; route = `M150 180 H${point[0]}`;}
   else {point = label.includes('繼續') ? [30, 180] : [72, 180]; route = `M150 180 H${point[0]}`;}
  }
 }
 const stateText = selected ? `${correct ? '✓' : '×'} ${label}${correct ? '' : '，再試一次。'}` : confirmed ? '可以操作了，選一個符合對話的答案。' : '先完成聽、說，地圖就會開放操作。';
 const choiceButton = (item, i, pin = false) => {
  const number = item[1].includes('第二個') ? '②' : '①';
  const style = pin ? `style="left:52%;top:${number === '②' ? 28 : 60}%"` : '';
  return `<button type="button" class="object ${pin ? 'd5-map-pin' : 'd5-map-option'}" data-choice="${i}" aria-pressed="${choice === i}" aria-label="${esc(item[1])}" ${style} ${confirmed ? '' : 'disabled'}>${pin ? `<span aria-hidden="true">${number}</span>` : `<span>${esc(item[1])}${choice === i ? correct ? ' ✓' : ' · 再試一次' : ''}</span>`}</button>`;
 };
 return `<div class="d5-map-container" data-map-step="${esc(t.id)}" data-map-choice="${selected ? choice : ''}" data-map-result="${result}">
  <div class="d5-map-heading"><strong>城市小地圖</strong><span>↑ 面朝上方</span></div>
  <p class="d5-map-instruction">${esc(prompt)}</p>
  <div class="d5-map-canvas" aria-label="城市街道與目前位置">
   <svg viewBox="0 0 400 300" preserveAspectRatio="none" aria-hidden="true" focusable="false">
    <rect class="d5-map-ground" width="400" height="300" rx="16"/>
    <g class="d5-map-block"><rect x="16" y="14" width="164" height="44" rx="9"/><rect x="16" y="111" width="164" height="42" rx="9"/><rect x="16" y="207" width="164" height="77" rx="9"/><rect x="244" y="14" width="140" height="44" rx="9"/><rect x="244" y="111" width="140" height="42" rx="9"/><rect x="244" y="207" width="140" height="77" rx="9"/></g>
    <g class="d5-map-road"><path d="M208 15 V288 M20 84 H380 M20 180 H380"/></g>
    <path class="d5-map-road-line" d="M208 15 V288 M20 84 H380 M20 180 H380"/>
    <g class="d5-map-crossing"><path d="M188 204 H228 M188 212 H228 M188 220 H228 M188 108 H228 M188 116 H228"/></g>
    <g class="d5-map-trees"><circle cx="275" cy="124" r="9"/><circle cx="302" cy="136" r="10"/><circle cx="349" cy="122" r="8"/></g>
    ${route ? `<path class="d5-map-route" d="${route}"/>` : ''}
    <circle class="d5-map-start" cx="208" cy="276" r="5"/>
   </svg>
   <span class="d5-map-place d5-map-cafe"><span aria-hidden="true">☕</span> 咖啡店</span>
   <span class="d5-map-place d5-map-museum"><span aria-hidden="true">🏛</span> 博物館</span>
   <span class="d5-map-place d5-map-park"><span aria-hidden="true">🌳</span> 公園</span>
   <span class="d5-map-place d5-map-hotel"><span aria-hidden="true">🏨</span> 飯店</span>
   <span class="d5-map-origin">出發位置 ↑</span>
   <span class="d5-map-mover" data-map-x="${point[0]}" data-map-y="${point[1]}" style="left:${point[0] / 4}%;top:${point[1] / 3}%" role="img" aria-label="${vehicle ? '計程車' : '旅客'}目前位置"><span aria-hidden="true">${vehicle ? '🚕' : '🚶'}</span></span>
   ${routeChoice ? t.objects.map((item, i) => choiceButton(item, i, true)).join('') : ''}
  </div>
  ${routeChoice ? `<div class="d5-map-key" aria-label="路口選項說明">${t.objects.map((item, i) => `<p>${item[1].includes('第二個') ? '②' : '①'} ${esc(item[1])}</p>`).join('')}</div>` : `<div class="d5-map-options">${t.objects.map((item, i) => choiceButton(item, i)).join('')}</div>`}
  <p class="d5-map-status" aria-live="polite">${esc(stateText)}</p>
  <p class="d5-map-scale">教學示意地圖；時間與距離以本題對話為準。</p>
 </div>`;
}
