import test from 'node:test';
import assert from 'node:assert/strict';
import gateway from '../api/gateway.mjs';
test('Vercel rewrite restores the health route',async()=>{
 const response=await gateway.fetch(new Request('https://booth.vercel.app/api/gateway?__route=/health'));
 assert.equal(response.status,200);assert.equal((await response.json()).service,'sssok-photobooth');
});
test('rewritten requests retain origin and endpoint restrictions',async()=>{
 const denied=await gateway.fetch(new Request('https://booth.vercel.app/api/gateway?__route=/api/rooms',{method:'POST',headers:{Origin:'https://evil.test'},body:'{}'}));
 assert.equal(denied.status,403);
 const arbitrary=await gateway.fetch(new Request('https://booth.vercel.app/api/gateway?__route=https://evil.test'));
 assert.equal(arbitrary.status,404);
});
