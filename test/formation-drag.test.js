import test from 'node:test';
import assert from 'node:assert/strict';
import {moveHero} from '../src/formation-drag.js';
test('dragging swaps occupied slots, replaces from roster and removes to roster',()=>{
  const original=[8,9,11,10,7,5];
  assert.deepEqual(moveHero(original,8,4),[7,9,11,10,8,5]);
  assert.deepEqual(moveHero(original,3,4),[8,9,11,10,3,5]);
  assert.deepEqual(moveHero(original,8,null),[null,9,11,10,7,5]);
  assert.deepEqual(moveHero(original,8,0),original);
  assert.deepEqual(original,[8,9,11,10,7,5]);
});
