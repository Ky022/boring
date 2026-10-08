import test from 'node:test';
import assert from 'node:assert/strict';
import {heroBuild,recommendSquad,battleReview} from '../src/player-experience.js';
import {fresh,applyAction,validSave,heroes} from '../src/game.js';
const unit=(id,role,power,effects=[])=>({id,role,power,ability:{effects}});
test('recommendation counters enemy shields without using an untrained counter',()=>{
 const pool=[unit(0,'骑士',100),unit(1,'治疗',95),unit(2,'法师',90,['break']),unit(3,'法师',89),unit(4,'游侠',88),unit(5,'战士',87),unit(6,'法师',86),unit(7,'法师',1,['purify'])];
 const result=recommendSquad(pool,[unit(20,'骑士',100,['guard','burn'])]);
 assert.equal(result.length,6);assert.equal(new Set(result).size,6);assert.ok(result.includes(2));assert.ok(!result.includes(7));
});
test('server recommendation produces a valid save and puts healing behind front line',()=>{
 const s=fresh();applyAction(s,{type:'smartFormation'});assert.ok(validSave(s));
 for(const id of s.team)if(heroes[id].role==='治疗')assert.ok(s.formation.indexOf(id)>=3);
 assert.deepEqual(s.team,s.formation.filter(id=>id!==null));
});
test('hero guidance reflects actual effects',()=>{
 assert.equal(heroBuild(unit(0,'法师',10,['break'])).focus,'破盾攻坚');
 assert.equal(heroBuild(unit(1,'治疗',10,['purify'])).set,'月泉');
});
test('battle advice uses actual control and absorbed damage evidence',()=>{
 const notes=battleReview({players:[],rounds:4,events:[{side:'e',status:'control'},{side:'p',absorbed:240}]});
 assert.ok(notes.some(n=>n.includes('1次控制')));assert.ok(notes.some(n=>n.includes('240伤害')));
 assert.match(battleReview({players:[],events:[],conditionFailed:true,condition:'12回合内'})[0],/12回合内/);
});
