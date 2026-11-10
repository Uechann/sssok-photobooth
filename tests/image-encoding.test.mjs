import test from 'node:test';
import assert from 'node:assert/strict';
import {encodeJpeg,MAX_IMAGE_BYTES} from '../src/imageEncoding.ts';
test('normal photo keeps default quality',async()=>{
 const qualities=[];const canvas={toBlob(callback,type,quality){qualities.push(quality);callback(new Blob(['image'],{type}));}};
 await encodeJpeg(canvas);assert.deepEqual(qualities,[0.92]);
});
test('large photo reduces quality until below Vercel-safe size',async()=>{
 const qualities=[];const canvas={toBlob(callback,type,quality){qualities.push(quality);callback(new Blob([new Uint8Array(quality>.7?MAX_IMAGE_BYTES+1:100)],{type}));}};
 assert.ok((await encodeJpeg(canvas)).size<=MAX_IMAGE_BYTES);assert.deepEqual(qualities,[.92,.82,.7]);
});
test('uncompressible and broken canvases fail instead of uploading',async()=>{
 await assert.rejects(encodeJpeg({toBlob:cb=>cb({size:MAX_IMAGE_BYTES+1})}),/용량/);
 await assert.rejects(encodeJpeg({toBlob:cb=>cb(null)}),/저장/);
});
