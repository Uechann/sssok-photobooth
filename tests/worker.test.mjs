import test from 'node:test';
import assert from 'node:assert/strict';
import {createHandler,allowedStorageUrl} from '../worker/handler.mjs';
test('storage accepts only signed HTTPS R2 endpoints',()=>{
 assert.equal(allowedStorageUrl('https://account.r2.cloudflarestorage.com/b/k?X-Amz-Signature=s&X-Amz-Credential=c'),true);
 for(const value of ['http://localhost/a','https://evil.com/?X-Amz-Signature=s','https://account.r2.cloudflarestorage.com.evil.com/?X-Amz-Signature=s','https://user:pass@account.r2.cloudflarestorage.com/b?X-Amz-Signature=s&X-Amz-Credential=c'])assert.equal(allowedStorageUrl(value),false);
});
test('proxy blocks unsupported endpoints and cross-origin writes before upstream',async()=>{
 const app=createHandler({},()=>{throw Error('must not contact upstream');});
 assert.equal((await app.fetch(new Request('https://booth.test/api/admin'))).status,404);
 assert.equal((await app.fetch(new Request('https://booth.test/api/rooms',{method:'POST',headers:{Origin:'https://evil.test'},body:'{}'}))).status,403);
 assert.equal((await app.fetch(new Request('https://booth.test/storage',{method:'PUT',headers:{'X-Upload-URL':'http://localhost'},body:'test'}))).status,400);
});
test('anonymous authentication uses BODY and does not forward cookies',async()=>{
 const app=createHandler({},async(url,options)=>{assert.equal(url,'https://api.ssssok.com/api/v1/auth/anonymous');assert.equal(JSON.parse(options.body).refreshTokenDelivery,'BODY');assert.equal(options.headers.has('cookie'),false);return Response.json({data:{accessToken:'test'}},{headers:{'Set-Cookie':'secret'}});});
 const result=await app.fetch(new Request('https://booth.test/api/auth/anonymous',{method:'POST',headers:{cookie:'secret',Origin:'https://booth.test'},body:'{"nickname":"test"}'}));
 assert.equal(result.status,200);assert.equal(result.headers.has('set-cookie'),false);assert.equal(result.headers.get('cache-control'),'no-store');
});
test('upstream failures cannot return false success',async()=>{
 const app=createHandler({},async()=>{throw new Error('timeout');});
 assert.equal((await app.fetch(new Request('https://booth.test/api/rooms',{method:'POST',body:'{}'}))).status,502);
});
test('static homepage and missing assets have correct responses',async()=>{
 const app=createHandler({'/index.html':{type:'text/html',base64:btoa('<h1>booth</h1>')}});
 const response=await app.fetch(new Request('https://booth.test/'));
 assert.equal(await response.text(),'<h1>booth</h1>');assert.match(response.headers.get('permissions-policy'),/camera=\(self\)/);
 assert.equal((await app.fetch(new Request('https://booth.test/missing.js'))).status,404);
});
