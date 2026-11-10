import test from 'node:test';
import assert from 'node:assert/strict';
import {coverCrop} from '../src/photoFit.ts';
test('landscape photo fills portrait slot with symmetric horizontal crop',()=>{
 const c=coverCrop(1600,1200,506,614);
 assert.equal(c.sh,1200); assert.equal(c.sy,0);
 assert.ok(Math.abs(c.sw/c.sh-506/614)<1e-9);
 assert.ok(Math.abs(c.sx-(1600-c.sw)/2)<1e-9);
});
test('portrait photo fills landscape slot with symmetric vertical crop',()=>{
 const c=coverCrop(1200,1600,640,460);
 assert.equal(c.sw,1200); assert.equal(c.sx,0);
 assert.equal(c.sy,(1600-c.sh)/2);
});
test('matching aspect ratio preserves the entire photo',()=>{
 assert.deepEqual(coverCrop(1600,1200,640,480),{sx:0,sy:0,sw:1600,sh:1200});
});
