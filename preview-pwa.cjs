// Local testing only. Production hosting must use HTTPS.
const http=require('node:http');
const fs=require('node:fs');
const path=require('node:path');
const root=__dirname;
const allowed=new Set([
 ...fs.readdirSync(root).filter(name=>/^(?:index|travel-english(?:-unit\d+-[a-z-]+)?|travel-(?:japanese|korean)-day0-directions)\.html$/.test(name)),
 'sw.js','manifest.webmanifest','assets/pwa-icon.svg',
 ...[180,192,512].map(size=>`assets/pwa-icon-${size}.png`)
]);
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8',
 '.webmanifest':'application/manifest+json','.svg':'image/svg+xml','.png':'image/png'};
const server=http.createServer((req,res)=>{
 let name;
 try{name=decodeURIComponent(new URL(req.url,'http://localhost').pathname).replace(/^\//,'')||'index.html';}
 catch{res.writeHead(400).end();return;}
 if(!name.includes('.'))name+='.html';
 if(!allowed.has(name)){res.writeHead(404).end('Not found');return;}
 try{
  res.writeHead(200,{'Content-Type':types[path.extname(name)],'Cache-Control':'no-cache'});
  res.end(fs.readFileSync(path.join(root,name)));
 }catch{res.writeHead(404).end('Not found');}
});
const port=process.argv[2]===undefined?4173:Number(process.argv[2]);
server.on('error',error=>{console.error(error.code==='EADDRINUSE'?'連接埠已使用。可在指令最後加上 4174，改用另一個連接埠。':error.message);process.exitCode=1;});
server.listen(port,'127.0.0.1',()=>console.log(`Travel Lab PWA: http://127.0.0.1:${server.address().port}/`));
