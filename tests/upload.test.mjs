import test from 'node:test';
import assert from 'node:assert/strict';
import {uploadFiles} from '../src/api.ts';
test('retry preserves successful upload and only repeats failed registration',async()=>{
 const original=globalThis.fetch;let issued=0,puts=0,registered=0;
 globalThis.fetch=async(url)=>{
  if(url.endsWith('/upload-urls')){issued++;return Response.json({data:{issued:[{mediaId:1,fileName:'photo.jpg',uploadUrl:'https://example.test',headers:{'Content-Type':'image/jpeg'}}],rejected:[]}});}
  if(url==='/storage'){puts++;return new Response(null,{status:200});}
  registered++;if(registered===1)throw new Error('connection lost');
  return Response.json({data:{registered:[],failed:[{mediaId:1,code:'UPLOAD_ALREADY_COMPLETED'}]}});
 };
 try {
  const file=new File(['image'],'photo.jpg',{type:'image/jpeg'});const args={roomId:1,token:'test',files:[file]};
  const first=await uploadFiles(args);assert.equal(first.failed.length,1);
  const retry=await uploadFiles(args);assert.equal(retry.registered.length,1);assert.equal(retry.failed.length,0);assert.equal(issued,1);assert.equal(puts,1);assert.equal(registered,2);
 } finally{globalThis.fetch=original;}
});
test('rejected file never attempts storage PUT or claims success',async()=>{
 const original=globalThis.fetch;let calls=0;globalThis.fetch=async()=>{calls++;return Response.json({data:{issued:[],rejected:[{message:'too large'}]}});};
 try{const result=await uploadFiles({roomId:1,token:'test',files:[new File(['image'],'rejected.jpg')]});assert.equal(result.registered.length,0);assert.equal(result.failed[0].message,'too large');assert.equal(calls,1);}finally{globalThis.fetch=original;}
});
