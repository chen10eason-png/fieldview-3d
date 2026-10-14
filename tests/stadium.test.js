import test from 'node:test';
import assert from 'node:assert/strict';
import {taipeiDome,listSections,sectionBounds,seatPosition,sectionSide} from '../src/stadiums.js';

test('Official-map B1 seating rings are distinct and numbered in the expected sequence',()=>{
 const b=taipeiDome.tiers[0];const all=listSections(b);
 assert.equal(all[0],102);assert.equal(all[22],124);assert.equal(all[23],131);assert.equal(all.at(-1),146);
 assert.equal(new Set(all).size,all.length);
});
test('Home plate vs outfield mapped to opposing sides',()=>{
 const b=taipeiDome.tiers[0];
 const behind=seatPosition(b,113,12,11),outfield=seatPosition(b,138,9,11);
 assert(behind.z<0,`home plate must be behind, z=${behind.z}`);
 assert(outfield.z>0,`outfield must face the other direction, z=${outfield.z}`);
 assert(Math.abs(behind.x)<12);
});
test('First-base and third-base side section orientation',()=>{
 const b=taipeiDome.tiers[0];
 assert(seatPosition(b,103,8,11).x>0);
 assert(seatPosition(b,123,8,11).x<0);
 assert.equal(sectionSide(b,113),'本壘後方');
});
test('Every advertised section has finite seat coordinates',()=>{
 for(const tier of taipeiDome.tiers){
  for(const sec of listSections(tier)){
   const p=seatPosition(tier,sec,8,11);const bound=sectionBounds(tier,sec);
   assert(bound[1]>bound[0],`${tier.id}-${sec} bad angles`);
   assert([p.x,p.y,p.z].every(Number.isFinite),`${tier.id}-${sec} failed position`);
  }
 }
});
