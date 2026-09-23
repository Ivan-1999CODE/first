const fs=require('fs');
const reference=fs.readFileSync('travel-english-unit3-airport.html','utf8');
const navReference=reference.match(/<nav class="day-switcher"[\s\S]*?<\/nav>/)[0];
const pages=[...navReference.matchAll(/<a[^>]*href="([^"]+)"[^>]*><strong>第 (\d+) 天<\/strong><small>([^<]+)<\/small><\/a>/g)].map(m=>[m[1],+m[2],m[3]]).filter(([f,n])=>n!==12&&fs.existsSync(f));
pages.push(['travel-english-unit12-how.html',12,'How 旅遊問句工具箱']);
pages.sort((a,b)=>a[1]-b[1]);
const sharedStyles=['course-layout-styles','day-switcher-styles'].map(id=>reference.match(new RegExp('<style id="'+id+'">[\\s\\S]*?</style>'))?.[0]||'').join('\n');
const menuSummary=reference.match(/<summary aria-label="課程選單">[\s\S]*?<\/summary>/)[0];
const css=fs.readFileSync('assets/day12.css','utf8');
const code=['day12.js','day12-scenes.js','day12-runtime.js'].map(f=>fs.readFileSync('assets/'+f,'utf8')).join('\n');
const html=`<!doctype html>
<html lang="zh-Hant"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Travel Lab｜第 12 天：How 旅遊問句工具箱</title>
<meta name="description" content="成人旅遊英文第 12 天：提議出遊、問清交通與三種時間、確認票價與人數。七部分互動教材。">
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='8' fill='%23086d66'/%3E%3Ctext x='4' y='25' font-size='24' fill='white'%3E↗%3C/text%3E%3C/svg%3E">
<script data-appearance-init>try{document.documentElement.dataset.theme=localStorage.getItem('travel-lab-theme')==='dark'?'dark':'light';document.documentElement.dataset.size=localStorage.getItem('travel-lab-text-size')==='large'?'large':'standard';}catch{}</script>
${sharedStyles}<style id="day12-styles">${css}</style></head><body>
<a class="skip" href="#main">跳到課程內容</a>
<header class="top"><div class="top-inner"><div><a class="brand" href="index.html"><span aria-hidden="true">↗</span>Travel Lab</a><span class="top-label">一點英文，走遠一點。</span></div><div class="tools"><button id="large" type="button" aria-pressed="false">放大文字</button><button id="theme" type="button" aria-label="切換為深色模式" aria-pressed="false">☾ 深色</button></div></div></header>
<nav class="day-switcher" aria-label="切換單元"><div class="day-switcher-inner"><span class="day-switcher-label">切換單元</span><div class="day-switcher-links">${pages.map(([file,n,name])=>`<a href="${file}"${n===12?' aria-current="page"':''}><strong>第 ${n} 天</strong><small>${name}</small></a>`).join('')}</div></div></nav>
<div id="storageNotice" class="notice" role="status" hidden></div>
<div class="layout"><details id="courseMenu" class="course-menu" open>${menuSummary}<nav class="course-nav" aria-label="第 12 天的七部分課程"><span class="day">DAY 12</span><div id="nav"></div></nav></details><main id="main" tabindex="-1"></main></div>
<footer class="bottom"><a href="index.html">全部課程</a> · 第 12 天：How 旅遊問句工具箱</footer><div id="toast" role="status" hidden></div>
<script id="day12-app">${code}</script></body></html>`;
fs.writeFileSync('travel-english-unit12-how.html',html);
require('./sync-unit12-links.cjs')();
console.log('Built Day 12: standalone HTML with all seven sections and embedded assets.');

// Preserve the Day 13 entry after rebuilding this unit.
require('./sync-unit13-links.cjs')();

// Keep the newest lesson reachable after rebuilding an earlier unit.
require('./sync-unit11-links.cjs')();

// Preserve the Day 14 navigation entry.
require('./sync-unit14-links.cjs')();

// Preserve the shared student speaking cue after each rebuild.
require('./sync-speaking-focus.cjs')('travel-english-unit12-how.html');

// Keep shared translation and speech controls in rebuilt lessons.
require('./sync-lesson-controls.cjs')();
