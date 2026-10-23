import test from 'node:test';
import assert from 'node:assert/strict';
import {taipeiDome,reference,listSections,sectionBounds,seatPosition,sectionSide,pathPoint,pathFrame,tierPoint} from '../src/stadiums.js';

const by=id=>taipeiDome.tiers.find(t=>t.id===id);
test('official 1xx / 2xx infield and outfield blocks remain separated',()=>{
 assert.deepEqual([by('IN1').first,by('IN1').last],[102,124]);
 assert.deepEqual([by('OF1').first,by('OF1').last],[131,146]);
 assert.deepEqual([by('IN2').first,by('IN2').last],[201,225]);
 assert.deepEqual([by('OF2').first,by('OF2').last],[233,244]);
 assert.deepEqual([by('UP5').first,by('UP5').last],[503,515]);
 assert.equal(taipeiDome.tiers.length,7);
});
test('U-shaped infield has flat backstop center and separated foul ends',()=>{
 const left=pathPoint('infield',0),back=pathPoint('infield',.5),right=pathPoint('infield',1);
 assert(left.x< -70 && right.x>70);
 assert(Math.abs(back.x)<1&&back.z< -20);
 assert(left.z>65 && right.z>65);
 assert(back.z<left.z-80);
});
test('outfield arc bends forward (not complete circle) with center 400ft',()=>{
 const left=pathPoint('wall',0),center=pathPoint('wall',.5),right=pathPoint('wall',1);
 assert(Math.abs(center.z-reference.centerFieldM)<0.0001);
 assert(Math.abs(left.x+72.2)<.01&&Math.abs(right.x-72.2)<.01);
 assert(Math.abs(Math.hypot(left.x,left.z)-reference.foulLineM)<.25);
});
test('sections map behind home, first base, third base, and center field',()=>{
 const home=seatPosition(by('IN1'),113,7,12),first=seatPosition(by('IN1'),108,7,12),third=seatPosition(by('IN1'),118,7,12);
 assert(Math.abs(home.x)<16,`113 near the plate ${home.x}`);
 assert(first.x>0,`108 first base ${first.x}`);
 assert(third.x<0,`118 third base ${third.x}`);
 assert(home.z<0);
 const out=seatPosition(by('OF1'),138,7,12);
 assert(out.z>115,`outfield center z ${out.z}`);
 assert.equal(sectionSide(by('IN1'),113),'本壘後方');
});
test('no tier is a complete loop; ranges stay on the U or outfield arc',()=>{
 for(const tier of taipeiDome.tiers){
  for(const n of listSections(tier)){
   const range=sectionBounds(tier,n),p=seatPosition(tier,n,7,12);
   assert(range[0]>=0 && range[1]<=1 &&range[0]<range[1]);
   assert([p.x,p.y,p.z,p.nx,p.nz].every(Number.isFinite));
   assert(p.y>0&&p.y<70);
  }
 }
});
test('stands move outward with rows; the geometry does not wrap behind walls',()=>{
 for(const tier of taipeiDome.tiers){
  const t=(tier.t0+tier.t1)*.5,front=tierPoint(tier,t,0),back=tierPoint(tier,t,tier.rows*tier.pitch);
  const p=pathFrame(tier.kind,t);
  const distance=(back.x-front.x)*p.nx+(back.z-front.z)*p.nz;
  assert(distance>0,`${tier.id}: back row must be outward`);
  assert(back.y>front.y);
 }
});

test('all modeled decks fit within oval roof envelope and seated eyes clear the shell',()=>{
 const rx=88,rz=118,cz=39;
 for(const tier of taipeiDome.tiers){
  for(let i=0;i<=100;i++)for(const d of [0,tier.rows*tier.pitch]){
   const p=tierPoint(tier,tier.t0+(tier.t1-tier.t0)*i/100,d);
   const elliptical=(p.x/rx)**2+((p.z-cz)/rz)**2;
   assert(elliptical<1,`${tier.id}: roof footprint intrusion at x=${p.x.toFixed(1)},z=${p.z.toFixed(1)}`);
   const ceiling=50+18*Math.sqrt(1-elliptical);
   assert(p.y+1.6<ceiling,`${tier.id}: viewer's head intersects roof`);
  }
 }
});
test('seat counts are model bounded, rather than invented actual section capacities',async()=>{
 const {approxSeatCount}=await import('../src/stadiums.js');
 for(const tier of taipeiDome.tiers){
  for(const n of listSections(tier)){
   const count=approxSeatCount(tier,n,1);
   assert(count>=4 && count<=28);
   let p=seatPosition(tier,n,1,count);assert([p.x,p.y,p.z].every(Number.isFinite));
  }
 }
});
