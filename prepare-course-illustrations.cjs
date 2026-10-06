const fs=require('fs'),path=require('path');
const sharp=require('C:/Users/1090602/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const folder=path.join(__dirname,'assets','illustrations');
const manifest=JSON.parse(fs.readFileSync(path.join(folder,'manifest.json'),'utf8'));
(async()=>{
 for(const asset of manifest.assets){
  const buffer=await sharp(asset.source).resize({width:640,height:640,fit:'inside',withoutEnlargement:true}).webp({quality:83,alphaQuality:100}).toBuffer();
  const meta=await sharp(buffer).metadata();
  if(!meta.hasAlpha)throw Error('Transparency missing: '+asset.key);
  fs.writeFileSync(path.join(folder,asset.file),buffer);
  console.log(asset.key+': '+buffer.length+' bytes');
 }
 const preview='C:/Users/1090602/.codex/visualizations/2026/10/04/01a10850-bf3a-7241-8163-260956576adb';
 for(const key of ['guide','asker','notebook','practice'])fs.copyFileSync(path.join(preview,'role-'+key+'.webp'),path.join(folder,key+'.webp'));
})();
