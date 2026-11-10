import {createServer} from 'node:http';
import {readFile,readdir} from 'node:fs/promises';
import {createHandler} from '../worker/handler.mjs';
const assets={};for(const name of await readdir('dist/client'))assets['/'+name]={type:name.endsWith('.html')?'text/html; charset=utf-8':'application/javascript',base64:(await readFile('dist/client/'+name)).toString('base64')};
const handler=createHandler(assets);const port=Number(process.env.PORT||3003);
createServer(async(req,res)=>{try{const chunks=[];for await(const chunk of req)chunks.push(chunk);const response=await handler.fetch(new Request(`http://localhost:${port}${req.url}`,{method:req.method,headers:req.headers,...(!['GET','HEAD'].includes(req.method)?{body:Buffer.concat(chunks)}:{})}));res.writeHead(response.status,Object.fromEntries(response.headers));res.end(Buffer.from(await response.arrayBuffer()));}catch{res.writeHead(500);res.end('Internal error');}}).listen(port,'127.0.0.1',()=>console.log(`http://localhost:${port}`));
