function lessonStep(f,index,get){
 const t={...f.steps[index]};
 if(course.day===2&&f.id==='clothes'){
  const color=get('color')===1?'green':'black',zh=color==='green'?'綠色':'黑色';
  if(t.id==='decision'){t.line=`The ${color} T-shirt in medium is twenty dollars. Would you like to take it?`;t.zh=`這件${zh} M 號 T-shirt 是 20 美元，你想買嗎？`;t.answer=`The ${color} one fits. I’ll take it.`;}
  if(t.id==='payment'&&get('decision')===1){t.line='No problem. Have a nice day!';t.zh='沒問題，祝你有美好的一天！';t.task='你已決定不買，禮貌謝謝店員並離開。';t.words='thank you';t.answer='Thank you. Have a nice day!';t.objects=[['↗','謝謝店員，離開商店']];t.valid=[0];}
 }
 if(course.day===2&&f.id==='gift'&&t.id==='finish'){
  const item=get('alternative')===1?'postcard':'magnet',price=get('alternative')===1?'two':'four';
  t.line=`Here’s your ${item} and your receipt for ${price} dollars. Thank you!`;
  t.zh=`這是你的${item==='postcard'?'明信片':'磁鐵'}與 ${price==='two'?2:4} 美元收據。謝謝！`;
 }
 return t;
}
function lessonScene(f,values,done){
 const get=id=>values[f.steps.findIndex(t=>t.id===id)];
 if(course.day===1){
  const j=get('junction'),turned=get('turn')!==undefined,y=j===undefined?315:j===0?215:90,x=turned?(f.side==='left'?85:335):210;
  const path=j===undefined?'':`<polyline points="210,315 210,${y}${turned?' '+x+','+y:''}" fill="none" stroke="#c47c20" stroke-width="8" stroke-linejoin="round"/>`;
  return `<div class="scene-state"><h3>${esc(f.destination)} · ${done?'✓ 已確認路線':'問路中'}</h3><svg class="lesson-map" viewBox="0 0 420 370" role="img" aria-label="教學地圖，起點朝北，${turned?'已標記到'+f.destination:'目前直走到'+(j===undefined?'起點':j===0?'第一個路口':'第二個路口')}"><rect width="420" height="370" rx="16" fill="#e4eee7"/><path d="M45 90H375M45 215H375M210 45V330" stroke="#fff" stroke-width="26"/>${path}${[[85,90,'火車站'],[335,90,'郵局'],[85,215,'公車站'],[335,215,'警局']].map(([a,b,name])=>`<g><rect x="${a-55}" y="${b-48}" width="110" height="38" rx="8" fill="${name===f.destination?'#146f63':'#5c7069'}"/><text x="${a}" y="${b-23}" text-anchor="middle" fill="white" font-size="15">${name}</text></g>`).join('')}<circle cx="${x}" cy="${y}" r="12" fill="#c47c20" stroke="white" stroke-width="3"/><text x="228" y="155" font-size="14" fill="#294c43">第二個路口 ↑</text><text x="228" y="273" font-size="14" fill="#294c43">第一個路口 ↑</text><text x="210" y="353" text-anchor="middle" font-size="15" fill="#294c43">起點 · 面朝北 ↑</text></svg><p>目前：${j===undefined?'起點':`第 ${j+1} 個路口`}${turned?' → '+(f.side==='left'?'左轉':'右轉')+' → '+esc(f.destination):''}</p><p>步行資訊：${get('walk')===undefined?'待詢問':f.walkMinutes+' 分鐘'}</p></div>`;
 }
 const clothes=f.id==='clothes',chosen=get(clothes?'color':'alternative'),buy=get('decision'),payment=get('payment');
 const item=clothes?(get('item')===undefined?'待選商品':chosen===undefined?'T-shirt':chosen===1?'綠色 T-shirt':'黑色 T-shirt'):(chosen===undefined?'待選禮物':chosen===1?'明信片':'磁鐵');
 const price=clothes?(chosen===undefined?'待詢問':'$20'):(chosen===undefined?'待選擇':chosen===1?'$2':'$4');
 const status=clothes&&buy===1?'這次不購買':done?'✓ 已完成購買':'選購中';
 const color=clothes&&chosen===1?'#39846b':'#343b40';
 const art=clothes?`<svg viewBox="0 0 240 155" role="img" aria-label="${esc(item)}"><path d="m75 20-45 35 30 33 20-18v70h80V70l20 18 30-33-45-35-25 12h-40z" fill="${color}" stroke="#afbbb6" stroke-width="3"/><text x="120" y="92" text-anchor="middle" fill="white" font-size="32">${get('size')===undefined?'?':'M'}</text></svg>`:`<div class="visual" aria-hidden="true">${chosen===undefined?'🎁':chosen===1?'✉':'🧲'}</div>`;
 return `<div class="scene-state"><div class="ticket-title"><span>MY ${clothes?'SHOPPING':'GIFT'}</span><b>${status}</b></div>${art}<div class="receipt-row"><span>商品</span><strong>${item}</strong></div><div class="receipt-row"><span>${clothes?'尺寸':'預算'}</span><strong>${clothes?(get('size')===undefined?'待確認':'M'):'$10'}</strong></div><div class="receipt-row"><span>價格</span><strong>${price}</strong></div><div class="receipt-row"><span>付款</span><strong>${clothes&&buy===1?'不需付款':payment===undefined?'待確認':payment===0?'刷卡':'現金'}</strong></div>${done&&!(clothes&&buy===1)?'<p>🛍 商品與收據已交到你手上。</p>':''}</div>`;
}
