const fs=require('fs'),path=require('path');

const lessons={
 0:{self:'asker',other:'guide',label:'旅客',hero:'directions'},
 1:{self:'asker',other:'guide',label:'旅客',hero:'directions'},
 2:{self:'customer',other:'retail-clerk',label:'顧客',hero:'shopping'},
 3:{self:'passenger',other:'airport-staff',label:'旅客',hero:'airport'},
 4:{self:'passenger',other:'station-staff',label:'乘客',hero:'transit'},
 5:{self:'asker',other:'guide',label:'旅客',hero:'directions'},
 6:{self:'diner',other:'server',label:'顧客',hero:'ordering'},
 7:{self:'customer',other:'shop-assistant',label:'顧客',hero:'fitting'},
 8:{self:'passenger',other:'hotel-staff',label:'房客',hero:'hotel'},
 9:{self:'diner',other:'server',label:'顧客',hero:'reservations'},
 10:{self:'polite-guest',other:'cafe-host',label:'顧客',hero:'kindness'},
 11:{self:'asker',other:'companion',label:'旅伴',hero:'conversation',heroImage:'practice'},
 12:{self:'asker',other:'companion',label:'旅伴',hero:'planning'},
 13:{self:'guide',other:'companion',label:'旅伴',hero:'choices'},
 14:{self:'asker',other:'companion',label:'旅伴',hero:'questions'}
};

function rolesFor(day,role,roundId){
 const base=lessons[day];
 if(!base)throw Error('No illustration setup for Day '+day);
 let {self,other,label}=base;
 if(role==='路人')other='guide';
 else if(role==='司機')other='driver';
 else if(/地勤|入境|海關|機場/.test(role))other='airport-staff';
 else if(role==='站務人員'||role==='售票員'){other=role==='售票員'?'ticket-clerk':'station-staff';self=day===9?'asker':'passenger';label='旅客';}
 else if(role==='飯店人員')other='hotel-staff';
 else if(role==='餐廳人員'||role==='店員'&&[6,10].includes(day)){other=day===10?'cafe-host':'server';self=day===10?'polite-guest':'diner';label='顧客';}
 else if(role==='店員')other=day===2&&roundId!=='B'?'retail-clerk':'shop-assistant';
 else if(role==='旅伴'){other='companion';label='旅伴';}
 return {self,other,label,otherLabel:role};
}

function forLesson(day,rounds,defaultRole){
 const lesson=lessons[day];
 const byRound=rounds.map(r=>rolesFor(day,r.role||defaultRole,r.id));
 const keys=new Set(['notebook',lesson.self,lesson.other,lesson.heroImage,...byRound.flatMap(r=>[r.self,r.other])].filter(Boolean));
 const images=Object.fromEntries([...keys].map(key=>[key,'data:image/webp;base64,'+fs.readFileSync(path.join(__dirname,'illustrations',key+'.webp')).toString('base64')]));
 return {...lesson,byRound,images};
}

module.exports={forLesson,rolesFor};
