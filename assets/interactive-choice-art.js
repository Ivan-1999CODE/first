// Data-authored comparison drawings. No image encodes whether an option is
// correct; the same artwork is used for choices, retries and confirmed results.
const vfPreviousArt=vfArt;
function vfChoiceDrawing(v,label){
 const rect=(x,y,w,h)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="7" class="vf-fill"/>`;
 const small=(name,x,y,w=90,h=75)=>`<svg x="${x}" y="${y}" width="${w}" height="${h}" viewBox="0 0 240 150" aria-hidden="true">${vfPreviousArt(name,{objects:[['',name]]}).replace(/^<svg[^>]*>/,'').replace(/<\/svg>$/,'')}</svg>`;
 const clock=(x,y,r,h=10,m=10)=>{const a=(h%12+m/60)*Math.PI/6,b=m*Math.PI/30;return `<circle cx="${x}" cy="${y}" r="${r}" class="vf-fill"/>${[0,1,2,3].map(i=>{const n=i*Math.PI/2;return `<path d="M${x+Math.sin(n)*(r-4)} ${y-Math.cos(n)*(r-4)}L${x+Math.sin(n)*(r-10)} ${y-Math.cos(n)*(r-10)}"/>`;}).join('')}<path d="M${x} ${y}L${x+Math.sin(a)*r*.52} ${y-Math.cos(a)*r*.52}M${x} ${y}L${x+Math.sin(b)*r*.77} ${y-Math.cos(b)*r*.77}"/>`;};
 const arrow=(x,y,right=true)=>`<path d="M${x} ${y}h50m${right?-12:-38} -10l${right?12:-12} 10l${right?-12:12} 10"/>`;
 const shirt=(color='blue',scale=1)=>`<g transform="translate(120 0) scale(${scale} 1) translate(-120 0)"><path d="M90 38L55 60L70 85L89 74V126H151V74L170 85L185 60L150 38Q120 59 90 38Z" fill="${color==='green'?'#659879':'#5d91bb'}"/></g>`;
 let a='';
 switch(v.type){
  case 'cash':a=v.values.map((n,i)=>rect(18+i*107,42,99,68)+vfText('$'+n,67+i*107,85,27)).join('');break;
  case 'calendar':a=rect(14,12,212,130)+'<path d="M14 38H226M45 5V23M195 5V23"/>';for(let i=0;i<21;i++){const x=26+i%7*28,y=47+Math.floor(i/7)*30;a+=`<rect x="${x}" y="${y}" width="23" height="24" rx="4" class="${i<v.days?'vf-selected-fill':'vf-fill'}"/>`+vfText(i+1,x+11,y+17,12);}break;
  case 'nights':a=rect(20,15,200,120);for(let i=0;i<v.count;i++){const x=120+(i-(v.count-1)/2)*60;a+=`<path d="M${x+12} 48a24 24 0 1 0 0 49a21 21 0 0 1 0 -49Z" fill="#d6b675"/>`;}break;
  case 'clock':a=clock(120,76,62,v.hour,v.minute||0)+vfText('12',120,35,13)+vfText('3',163,81,13)+vfText('6',120,124,13)+vfText('9',77,81,13);break;
  case 'booking':a=rect(15,15,95,120)+vfText(v.day,62,82,24)+clock(175,77,54,v.hour,0);break;
  case 'record':a=rect(20,10,200,130)+'<path d="M20 43H220"/>'+vfText(v.title,120,33,15)+v.lines.map((line,i)=>vfText(line,120,78+i*32,18)).join('');break;
  case 'order':a=rect(20,10,200,130)+small('三明治',27,28,88,80)+vfText('$'+v.price,163,58,24)+vfText(v.minutes+' min',163,101,20);break;
  case 'parcel':a=rect(10,8,220,134)+vfText('ROOM '+v.room,120,34,22);for(let i=0;i<v.count;i++){
   const x=120+(i-(v.count-1)/2)*80;
   if(v.item==='water')a+=`<path d="M${x-10} 48V59L${x-19} 72V119Q${x} 129 ${x+19} 119V72L${x+10} 59V48Z" fill="#76b3bf"/><path d="M${x-19} 86H${x+19}M${x-10} 48H${x+10}"/>`;
   else if(v.item==='blanket')a+=`<rect x="${x-48}" y="56" width="96" height="66" rx="8" fill="#c7b397"/><path d="M${x-36} 65V113M${x-20} 65V113M${x-4} 65V113M${x+12} 65V113M${x+28} 65V113M${x+43} 65V113" opacity=".4"/>`;
   else a+=`<rect x="${x-29}" y="53" width="58" height="72" rx="6" fill="#b9cdbb"/><path d="M${x-23} 109H${x+23}M${x-23} 115H${x+23}M${x+19} 56V105"/>`;
  }break;
  case 'tickets':{let n=0;for(const [count,child]of [[v.adults,false],[v.children,true]])for(let i=0;i<count;i++){const x=15+(n++)*73;a+=rect(x,12,65,126)+vfPerson(x+32,62,child?.45:.7)+vfText(child?'CHILD':'ADULT',x+32,125,10);}break;}
  case 'people-pair':a='<path d="M120 10V140"/>'+vfText('我',60,25,17)+vfText('旅伴',180,25,17)+small(v.mine==='camera'?'拍照':'健行',5,38,110,100)+small(v.other==='camera'?'拍照':'健行',125,38,110,100);break;
  case 'resize':a=vfPerson(120,37,1.25)+shirt('blue',v.scale);break;
  case 'outfit-bag':a='<path d="M30 45H210V140H30Z" class="vf-fill"/><path d="M88 45V17H152V45"/>'+`<g transform="translate(60 37) scale(.5)">${shirt(v.color)}</g>`;break;
  case 'meal-order':a=rect(15,10,210,130)+small('三明治',25,33,130,100)+(v.extra?small('拿水',155,40,65,88):'');break;
  case 'tables':a='<ellipse cx="120" cy="78" rx="55" ry="35" class="vf-fill"/>';for(let i=0;i<4;i++){const x=120+Math.sin(i*Math.PI/2)*85,y=78+Math.cos(i*Math.PI/2)*56;a+=`<rect x="${x-16}" y="${y-17}" width="32" height="30" rx="6" class="vf-fill"/>`;if(v.full||i===0)a+=`<circle cx="${x}" cy="${y-8}" r="9" class="vf-selected-fill"/><path d="M${x-10} ${y+10}Q${x} ${y-1} ${x+10} ${y+10}"/>`;}break;
  case 'diary':a=rect(25,15,190,120)+vfText('今晚',120,40,18)+'<path d="M40 53H200M40 85H200M40 117H200"/>'+(v.busy?'<rect x="55" y="60" width="130" height="49" rx="7" class="vf-selected-fill"/>':'');break;
  case 'location-note':a=rect(15,10,210,130)+vfText(v.near,67,39,17)+rect(30,52,75,66)+vfText('i',171,97,42)+'<path d="M135 50H207V123H135Z"/>';break;
  case 'service':a=vfPerson(120,38,.8)+'<path d="M30 75H210V137H30Z" class="vf-fill"/>'+rect(59,94,122,25);break;
  case 'wait':a=clock(120,75,58)+vfText('…',120,84,22);break;
  case 'arrival':case 'departure':a='<path d="M135 135V15H215V135M145 24H205V126" class="vf-fill"/>'+vfPerson(v.type==='arrival'?55:165,60,.85)+arrow(v.type==='arrival'?70:30,95,v.type==='arrival');break;
  case 'thanks':a=vfPerson(55,66,.8)+vfPerson(185,66,.8)+'<path d="M105 70Q85 45 105 38Q118 36 120 48Q126 33 138 39Q158 48 120 78Z"/>';break;
  case 'repeat':a='<path d="M172 45A58 58 0 1 0 175 112M172 15V45H143"/>'+vfText('…',120,87,30);break;
  case 'request':a=vfPerson(60,63,.9)+'<path d="M95 20H215V90H130L110 113V90H95Z" class="vf-fill"/>'+vfText('…',155,67,30);break;
  case 'completed':a=rect(45,12,150,125)+'<path d="M65 40H175M65 67H175M65 94H145"/>'+'<rect x="138" y="106" width="69" height="29" rx="5" class="vf-fill"/>';break;
  case 'interest':a=vfPerson(55,70,.9)+'<path d="M95 15H225V100H125L95 125V100Z" class="vf-fill"/>'+small('健行',106,22,105,75);break;
  case 'photo-memory':a=rect(25,15,190,120)+small('健行',40,20,160,105)+'<path d="M25 117H215"/>';break;
  case 'driver-match':case 'driver-query':a=small('計程車',10,40,165,105)+rect(162,10,67,95)+vfPerson(195,44,.4)+vfText(v.type==='driver-query'?'?':'TAXI',195,94,13);break;
  case 'own-bag':case 'store-bag':
   a='<path d="M45 45H195V135H45Z" class="vf-fill"/><path d="M85 45V18H155V45M45 120L66 98V135M195 120L174 98V135"/>';
   if(v.type==='own-bag')a+='<path class="vf-no-bag" d="M48 22L192 140" stroke="#df4545" stroke-width="8"/>';
   break;
  case 'fitting':a='<path d="M35 135V15H205V135M45 30H195M60 30V128M90 30V128M120 30V128M150 30V128M180 30V128"/>'+vfText('FITTING',120,23,12);break;
  case 'meal-wait':a=small('三明治',15,52,130,88)+clock(179,58,43);break;
  case 'food':a=small('有帶餅乾',25,20,190,120);break;
  case 'passport':a=small('出示護照',25,5,190,140);break;
  case 'bus':a=small('公車',10,10,220,135);break;
  case 'taxi':a=small('計程車',10,10,220,135);break;
  case 'bag-description':a=small('黑色小包包',25,5,190,130)+'<circle cx="177" cy="48" r="30"/><path d="M198 70L220 94"/>';break;
  default:throw Error('Unreviewed choice drawing: '+v.type);
 }
 return vfSvg(a,label);
}
vfArt=function(label,t){
 const index=t.objects.findIndex(o=>o[1]===label),visual=t.choiceVisuals?.[index];
 return visual?vfChoiceDrawing(visual,label):vfPreviousArt(label,t);
};
function vfTaxiStop(t,{selected,ready,attr}){
 const positions=t.objects.map(o=>/入口/.test(o[1])?78:23);
 return `<div class="vf-taxi-stop"><svg viewBox="0 0 400 180" role="img" aria-label="車子在左側，前方右側有入口" fill="none" stroke="currentColor" stroke-width="3"><path d="M10 150H390" class="vf-road" stroke-width="28"/><path d="M295 130V20H375V130M305 30H365V130" class="vf-fill"/>${vfText('入口',335,17,17)}<path d="M40 99L55 70H115L135 99V126H40Z" fill="#d6b675"/><circle cx="58" cy="127" r="10" class="vf-fill"/><circle cx="116" cy="127" r="10" class="vf-fill"/>${vfText('目前位置',87,52,16)}</svg><div class="vf-taxi-points">${t.objects.map((o,i)=>`<button type="button" class="object" ${attr}="${i}" ${ready?'':'disabled'} aria-pressed="${selected===i}" style="order:${positions[i]}"><span>${positions[i]===78?'前方入口':'目前位置'}</span></button>`).join('')}</div></div>`;
}
