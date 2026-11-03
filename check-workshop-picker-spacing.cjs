const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {pathToFileURL}=require('node:url');
process.env.PLAYWRIGHT_BROWSERS_PATH ||= path.resolve('tmp/playwright-browsers');
const {chromium,webkit}=require(process.env.PLAYWRIGHT_PATH || 'C:/Users/1090602/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const before=process.argv.includes('--before'),engine=process.argv.includes('--webkit')?'webkit':'edge';
const out=path.resolve('tmp/workshop-picker-spacing',before?'before':engine);
fs.mkdirSync(out,{recursive:true});
const files=fs.readdirSync('.').filter(f=>/^travel-english(?:-unit\d+-[^/]+)?\.html$/.test(f));
const day2='travel-english-unit2-shopping.html';
(async()=>{
 const browser=await(engine==='webkit'?webkit.launch():chromium.launch({channel:'msedge',headless:true}));
 const report=[],errors=[];
 try{
  const context=await browser.newContext({hasTouch:true,reducedMotion:'reduce'}),page=await context.newPage();
  page.on('pageerror',error=>errors.push(error.message));
  const cases=before?[{file:day2,width:1180,height:820,theme:'dark',size:'large'}]:[
   ...[[1180,820],[1024,768],[768,1024],[390,844],[320,568]].flatMap(([width,height])=>['dark','light'].flatMap(theme=>['large','standard'].map(size=>({file:day2,width,height,theme,size})))),
   ...files.filter(file=>file!==day2).map(file=>({file,width:1180,height:820,theme:'dark',size:'large'}))
  ];
  for(const c of cases){
   await page.setViewportSize({width:c.width,height:c.height});
   await page.goto(pathToFileURL(path.resolve(before?'tmp/workshop-picker-spacing/before/'+c.file:c.file)).href);
   await page.evaluate(({theme,size})=>{document.documentElement.dataset.theme=theme;document.documentElement.dataset.size=size;navigate(1);},c);
   if(c.file===day2)await page.locator('.dg-task-switch [data-dg-task="2"]').click();
   await page.locator('[data-study-view="reply"]').first().click();
   const picker=page.locator('.workshop-picker').first();
   await picker.waitFor({state:'visible'});
   const name=`${c.file.replace('.html','')}-${c.width}-${c.theme}-${c.size}`;
   const inspect=async()=>picker.evaluate(element=>{
    const issues=[],box=element.getBoundingClientRect(),buttons=[...element.querySelectorAll('button')],rects=buttons.map(b=>b.getBoundingClientRect());
    for(let i=0;i<rects.length;i++){
     const a=rects[i];
     if(a.left<box.left-1||a.right>box.right+1)issues.push('button exceeds picker');
     if(buttons[i].scrollWidth>buttons[i].clientWidth+1)issues.push('label overflows');
     for(let j=i+1;j<rects.length;j++){
      const b=rects[j],gap=Math.max(b.left-a.right,a.left-b.right,b.top-a.bottom,a.top-b.bottom);
      if(gap<11.5)issues.push(`only ${gap.toFixed(1)}px between buttons`);
     }
    }
    if(document.documentElement.scrollWidth>innerWidth+1)issues.push('page overflows viewport');
    return {issues,count:buttons.length,rows:new Set(rects.map(r=>Math.round(r.top))).size};
   });
   const result=await inspect();
   if(before||(c.file===day2&&c.size==='large'&&[1180,320].includes(c.width)))await picker.screenshot({path:path.join(out,name+'.png')});
   report.push({...c,...result});fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));
   assert(result.count>=2,'Multiple exchange buttons render');assert.deepEqual(result.issues,[],name);
   if(c.file===day2){
    assert.equal(result.count,3,'All three Task C exchanges are present');
    for(const index of [1,2,0]){
     const button=picker.locator('button').nth(index);await button.click();
     assert.equal(await picker.locator('button').nth(index).getAttribute('aria-pressed'),'true');
     assert.deepEqual((await inspect()).issues,[],`${name}/selected-${index}`);
    }
    const last=picker.locator('button').last();await last.hover();await last.press('Tab');await page.keyboard.press('Shift+Tab');
    assert.notEqual(await last.evaluate(e=>getComputedStyle(e).outlineStyle),'none');
    if(c.width===1180&&c.size==='large')await picker.screenshot({path:path.join(out,name+'-hover-focus.png')});
   }
  }
  assert.deepEqual(errors,[]);
  console.log(`PASS ${engine}: ${cases.length} layouts, all 14 English lessons, Day 2 Task C switching, wrapping, themes, large type and keyboard focus.`);
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
