import {readFile,mkdir,writeFile,readdir} from 'node:fs/promises';
const assets={};for(const name of await readdir('dist/client')) {if(name.endsWith('.txt'))continue;assets['/'+name]={type:name.endsWith('.html')?'text/html; charset=utf-8':'application/javascript; charset=utf-8',base64:(await readFile('dist/client/'+name)).toString('base64')};}
await mkdir('dist/server',{recursive:true});await writeFile('dist/server/index.js',(await readFile('worker/handler.mjs','utf8'))+'\nexport default createHandler('+JSON.stringify(assets)+');\n');
