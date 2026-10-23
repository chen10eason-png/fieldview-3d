import * as THREE from 'three';
import {taipeiDome,reference,listSections,sectionBounds,seatPosition,tierPoint,pathPoint,pathFrame} from './stadiums.js';

// Every object is procedural original geometry. Geometry uses a U-shaped inner
// baseball bowl and a SEPARATE shorter outfield stand; only the architectural
// roof is an oval, because Taipei Dome's roof actually is oval.
const V=(x,y,z)=>new THREE.Vector3(x,y,z);
const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
const mat=(color,metalness=0.02,roughness=.82)=>new THREE.MeshStandardMaterial({color,metalness,roughness,side:THREE.DoubleSide});
const lit=(color,opacity=1)=>new THREE.MeshBasicMaterial({color,side:THREE.DoubleSide,transparent:opacity!==1,opacity,depthWrite:opacity===1});
const concrete=mat(0x7c8583),paleConcrete=mat(0xc4c7c0),charcoal=mat(0x252b2c);
const steel=mat(0x9da9ac,.6,.44),dirt=mat(0xb95639),grass=mat(0x367c46),chalk=lit(0xf6f4ec);
const web=lit(0xd2dbd9,.34);

function add(parent,g,m,x=0,y=0,z=0){const o=new THREE.Mesh(g,m);o.position.set(x,y,z);parent.add(o);return o;}
function box(parent,w,h,d,m,x=0,y=0,z=0){return add(parent,new THREE.BoxGeometry(w,h,d),m,x,y,z);}
function ribbon(parent,one,two,m){const verts=[],idx=[];for(let i=0;i<one.length;i++)verts.push(...one[i],...two[i]);
 for(let i=0;i<one.length-1;i++){const a=i*2;idx.push(a,a+1,a+2,a+1,a+3,a+2);}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(verts,3));g.setIndex(idx);g.computeVertexNormals();return add(parent,g,m);}
function tube(parent,points,r,m,sections=64){const path=new THREE.CatmullRomCurve3(points);return add(parent,new THREE.TubeGeometry(path,sections,r,5),m);}
function lines(parent,segments,color=0xe5e7df,opacity=1){const p=[];for(let [a,b] of segments)p.push(...a,...b);
 const material=new THREE.LineBasicMaterial({color,transparent:opacity<1,opacity});
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));const o=new THREE.LineSegments(g,material);parent.add(o);return o;}
function floorShape(parent,coords,y,m){const s=new THREE.Shape();s.moveTo(coords[0][0],coords[0][1]);for(let i=1;i<coords.length;i++)s.lineTo(...coords[i]);s.closePath();
 const result=add(parent,new THREE.ShapeGeometry(s),m,0,y,0);result.rotation.x=Math.PI/2;return result;}
function canvasLabel(text,sub=''){let c=document.createElement('canvas');c.width=1024;c.height=400;let x=c.getContext('2d');
 x.fillStyle='#071a24';x.fillRect(0,0,1024,400);
 x.fillStyle='#1e4a4e';for(let p=-400;p<1450;p+=58){x.save();x.translate(p,0);x.rotate(-.39);x.fillRect(0,-250,4,950);x.restore();}
 x.fillStyle='#e8f6f6';x.textAlign='center';x.font='800 88px sans-serif';x.fillText(text,512,190);
 x.fillStyle='#86d6bd';x.font='700 40px sans-serif';x.fillText(sub,512,284);
 let t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t;}

// One curved arc, *not* a circular sector. Curve interpolation stays in the
// stadium-specific data module, making field wall and outfield seats concentric
// only where the top-down official plan says they should be.
function sampled(tier,depth,a,b,num=40){let v=[];for(let i=0;i<=num;i++){
 const p=tierPoint(tier,a+(b-a)*i/num,depth);v.push([p.x,p.y,p.z]);
 }return v;}
// Approximate front-of-deck safety rails. These are visual references, not
// surveyed positions or reliable seat-obstruction measurements.
function addSafetyRails(parent,tier){
 const samples=Math.max(48,Math.ceil((tier.t1-tier.t0)*100));
 const edge=sampled(tier,-.37,tier.t0,tier.t1,samples);
 const top=edge.map(p=>V(p[0],p[1]+1.12,p[2]));
 const middle=edge.map(p=>V(p[0],p[1]+.59,p[2]));
 tube(parent,top,.067,steel,samples);
 tube(parent,middle,.039,steel,samples);
 const posts=[];
 for(let i=0;i<=samples;i+=5){const p=edge[i];posts.push(p);}
 if(samples%5!==0)posts.push(edge[samples]);
 const postGeo=new THREE.CylinderGeometry(.048,.057,1.12,6);
 const mesh=new THREE.InstancedMesh(postGeo,steel,posts.length),dummy=new THREE.Object3D();
 posts.forEach((p,i)=>{
  dummy.position.set(p[0],p[1]+.56,p[2]);dummy.updateMatrix();
  mesh.setMatrixAt(i,dummy.matrix);
 });
 mesh.instanceMatrix.needsUpdate=true;
 mesh.frustumCulled=false;
 parent.add(mesh);
}
function makeFloor(scene){
 const world=new THREE.Group();scene.add(world);
 box(world,211,1,259,mat(0x232d30),0,-2,30);
 // Real Taipei Dome has broad reddish-orange foul territory, particularly
 // behind home. The grass polygon is NOT a green circular disk.
 floorShape(world,[[-82,83],[-86,30],[-72,-5],[-48,-34],[0,-48],[48,-34],[72,-5],[86,30],[82,83],[55,125],[0,143],[-55,125]],-.02,dirt);
 const wallPoints=Array.from({length:101},(_,i)=>pathPoint('wall',i/100));
 // Official overhead photography shows green turf around the infield and home
 // plate, with a red *perimeter* track. It is NOT a red infield wedge.
 const turfFront=Array.from({length:101},(_,i)=>{
  const p=pathFrame('infield',i/100);return [p.x-p.nx*5.8,p.z-p.nz*5.8];
 });
 floorShape(world,[...wallPoints.map(p=>[p.x,p.z]),...turfFront.reverse()],.045,grass);
 // Outfield warning track, set inside the measured wall profile.
 const wallOuter=[],wallInner=[];
 for(let i=0;i<=90;i++){
  const t=i/90,p=pathFrame('wall',t);
  wallOuter.push([p.x,.08,p.z]);wallInner.push([p.x-p.nx*4.7,.085,p.z-p.nz*4.7]);
 }
 ribbon(world,wallOuter,wallInner,dirt);
 // Foul lines run 335 ft from home to the corner flags.
 tube(world,[V(0,.20,0),V(72.2,.20,72.2)],.09,chalk,2);
 tube(world,[V(0,.20,0),V(-72.2,.20,72.2)],.09,chalk,2);
 const baseLocations=[[0,0],[19.4,19.4],[0,38.79],[-19.4,19.4]];
 for(let [idx,[x,z]] of baseLocations.entries()){
  let p=add(world,new THREE.CylinderGeometry(idx===0?4.5:3.1,idx===0?4.5:3.1,.13,8),dirt,x,.14,z);p.rotation.y=Math.PI/8;
  let b=box(world,idx===0?1.07:1.35,.12,idx===0?1.07:1.35,mat(0xf0eee6),x,.33,z);b.rotation.y=Math.PI/4;
 }
 const mound=add(world,new THREE.CylinderGeometry(3.1,3.1,.34,40),dirt,0,.25,18.44);
 box(world,.55,.1,.2,mat(0xfaf8ed),0,.46,18.44);
 // Catcher's boxes and small batting boxes, only visible at close range.
 const chalkSegments=[];
 for(let s of [-1,1]){
  const x0=s*1.7,x1=s*3.5;
  chalkSegments.push([[x0,.26,-2.35],[x0,.26,1.4]],[[x1,.26,-2.35],[x1,.26,1.4]],[[x0,.26,-2.35],[x1,.26,-2.35]],[[x0,.26,1.4],[x1,.26,1.4]]);
 }
 lines(world,chalkSegments,0xfaf8f1);
 // Proper 3.5m outfield wall rather than the old 7.5m cylinder.
 for(let i=0;i<92;i++){
  const a=pathPoint('wall',i/92),b=pathPoint('wall',(i+1)/92);let len=Math.hypot(b.x-a.x,b.z-a.z);
  const angle=Math.atan2(b.z-a.z,b.x-a.x);
  const obj=box(world,len+.10,3.5,.43,mat(i%9===0?0x234d48:0x164a43),(a.x+b.x)/2,1.75,(a.z+b.z)/2);obj.rotation.y=-angle;
  const cap=box(world,len+.12,.10,.62,mat(0xe5c850),(a.x+b.x)/2,3.52,(a.z+b.z)/2);cap.rotation.y=obj.rotation.y;
 }
 for(let sign of [-1,1]){
  box(world,.14,21,.14,mat(0xf8d023),sign*72.2,12,72.2);
  // triangular warning markings help see the foul pole from the bowl.
  for(let y=6;y<20;y+=3)box(world,.10,.06,2.4,mat(0xf8d023),sign*72.2,y,73.4);
 }
 // Dugouts and railings follow the sides of the *diamond*, not a round ring.
 for(let sign of [-1,1]){
  let dug=box(world,22,2.5,8,mat(0x263a3a),sign*29,1.3,-15);
  dug.rotation.y=sign*.38;
  let ledge=box(world,23,.4,8,mat(0x959e99),sign*29,2.6,-15);ledge.rotation.y=sign*.38;
  const rail=box(world,20,.08,.1,steel,sign*28,3.2,-11.7);rail.rotation.y=sign*.38;
 }
 // The actual 2024+ stadium uses Mizuno artificial turf; no artificial
 // all-dirt infield diamond is painted over it.
 return world;
}

function tierSectionMesh(tier,a,b){
 const v=[],idx=[];let n=0;
 const append=(p0,p1,p2,p3)=>{
  v.push(...p0,...p1,...p2,...p3);idx.push(n,n+1,n+2,n,n+2,n+3);n+=4;
 };
 let steps=Math.max(3,Math.ceil((b-a)*90));
 for(let row=0;row<tier.rows;row++){
  for(let j=0;j<steps;j++){
   const u=a+(b-a)*j/steps,w=a+(b-a)*(j+1)/steps;
   const i0=tierPoint(tier,u,row*tier.pitch),i1=tierPoint(tier,w,row*tier.pitch);
   const o0=tierPoint(tier,u,(row+1)*tier.pitch),o1=tierPoint(tier,w,(row+1)*tier.pitch);
   const top0=[i0.x,i0.y,i0.z],top1=[i1.x,i1.y,i1.z];
   const top2=[o1.x,i1.y,o1.z],top3=[o0.x,i0.y,o0.z];
   append(top0,top1,top2,top3);
   append(top3,top2,[o1.x,o1.y,o1.z],[o0.x,o0.y,o0.z]);
  }
 }
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(v,3));g.setIndex(idx);g.computeVertexNormals();return g;
}
function groupSeats(parent,chairs){
 const seatGeo=new THREE.BoxGeometry(.65,.12,.52),backGeo=new THREE.BoxGeometry(.67,.66,.10);
 // Use GPU instancing to fit iPad/iPhone Safari. No 20,000 separate draw calls.
 const base=new THREE.InstancedMesh(seatGeo,mat(0xffffff),chairs.length),backs=new THREE.InstancedMesh(backGeo,mat(0xffffff),chairs.length);
 const obj=new THREE.Object3D(),color=new THREE.Color();
 chairs.forEach((c,i)=>{
  const yaw=Math.atan2(c.nx,c.nz),rand=((i*97+c.section*37+c.row*23)%101);
  let hex=rand<14?0x26343b:rand<34?0x828e92:rand<51?0xbcc3c6:0xeaece8;
  // Black/white seat mosaic in photos, with darker suite-level chairs.
  if(c.tier==='VIP')hex=rand<62?0x344247:0xc2c7c6;
  obj.rotation.set(0,yaw,0);obj.position.set(c.x,c.y+.32,c.z);obj.updateMatrix();base.setMatrixAt(i,obj.matrix);
  obj.position.set(c.x+c.nx*.31,c.y+.71,c.z+c.nz*.31);obj.updateMatrix();backs.setMatrixAt(i,obj.matrix);
  color.setHex(hex);base.setColorAt(i,color);backs.setColorAt(i,color);
 });
 base.frustumCulled=false;backs.frustumCulled=false;parent.add(base,backs);
 return chairs.length;
}
function stands(scene){
 const group=new THREE.Group();scene.add(group);
 const chairs=[],hitMeshes=[],bySection=new Map();
 const deck=[mat(0x6c7473),mat(0x667174),mat(0x747d7b),mat(0x64706e),mat(0x3f4b4d),mat(0x7d8584),mat(0x818a88)];
 const voidMat=mat(0x283236);
 for(let [k,tier] of taipeiDome.tiers.entries()){
  // Continuous base band per tier, but NEVER connect infield and outfield
  // decks into a single circular ring.
  const t0=tier.t0,t1=tier.t1;
  const baseInner=sampled(tier,0,t0,t1,105).map(p=>[p[0],p[1]-3.1,p[2]]);
  const baseOuter=sampled(tier,.25,t0,t1,105);ribbon(group,baseInner,baseOuter,voidMat);
  // Foreground railings matter most to B1/L2/upper-deck seat viewpoints.
  addSafetyRails(group,tier);
  for(let n of listSections(tier)){
   const limits=sectionBounds(tier,n);if(!limits)continue;
   const gap=.0018,b0=limits[0]+gap,b1=limits[1]-gap;
   const geometry=tierSectionMesh(tier,b0,b1);
   const obj=add(group,geometry,deck[k]);obj.userData={tier:tier.id,section:n};
   hitMeshes.push(obj);bySection.set(`${tier.id}-${n}`,obj);
   const mid=(b0+b1)*.5,pa=tierPoint(tier,b0,0),pb=tierPoint(tier,b1,0);
   const sectionLength=Math.hypot(pa.x-pb.x,pa.z-pb.z);
   const cols=clamp(Math.floor(sectionLength/.89),5,24);
   // Steps and aisles are open gaps between actual sectors.
   for(let r=0;r<tier.rows;r++)for(let j=0;j<cols;j++){
    const t=b0+(b1-b0)*(j+.5)/cols,p=tierPoint(tier,t,(r+.53)*tier.pitch);
    chairs.push({x:p.x,z:p.z,y:p.y,section:n,row:r,tier:tier.id,nx:p.nx,nz:p.nz});
   }
   if((n-tier.first)%4===0){
    const edge=sampled(tier,tier.rows*tier.pitch,b0,b1,8);
    tube(group,edge.map(p=>V(p[0],p[1]+.15,p[2])),.105,paleConcrete,10);
   }
  }
  // Level separation: distinctly different front fascias and exterior strips.
  const low=sampled(tier,-.15,t0,t1,110).map(p=>[p[0],p[1]-2.1,p[2]]);
  const upper=sampled(tier,-.15,t0,t1,110);
  ribbon(group,low,upper,k===4?charcoal:mat(0xa2ada9));
  // Pedestrian concourse separating the stadium's real seating tiers.
  const high=sampled(tier,tier.rows*tier.pitch,t0,t1,105);
  const back=sampled(tier,tier.rows*tier.pitch+1.6,t0,t1,105);
  ribbon(group,high,back,concrete);
 }
 // B1 rear seating sits partly beneath the next deck in published photos.
 // This shallow U-shaped soffit is an estimate; do not interpret it as surveyed.
 const lower=taipeiDome.tiers[0];
 const soffitFront=sampled(lower,7.2,lower.t0,lower.t1,110);
 const soffitRear=sampled(lower,13.2,lower.t0,lower.t1,110);
 const underside=mat(0x4d5a5d);
 ribbon(group,soffitFront.map(p=>[p[0],15.2,p[2]]),soffitRear.map(p=>[p[0],15.2,p[2]]),underside);
 ribbon(group,soffitFront.map(p=>[p[0],15.2,p[2]]),soffitFront.map(p=>[p[0],16.2,p[2]]),mat(0x97a5a5));
 const chairCount=groupSeats(group,chairs);
 return {group,chairCount,hitMeshes,bySection};
}

function glassRibbon(parent,y,z,halfWidth,height){
 let g=box(parent,halfWidth*2,height,.32,mat(0x25434b,.15,.25),0,y,z);return g;
}
function arenaWalls(scene){
 const group=new THREE.Group();scene.add(group);
 const warmGrey=mat(0x989d98),ivory=mat(0xc0c3be),dark=mat(0x273238);
 // Tall flat/polygonal center-field end wall as seen in real 2023–26 photos:
 // it must NOT be the back half of an enclosed gray seating donut.
 const anchors=[[-72,106],[-66,128],[-48,146],[-24,155],[0,156],[24,155],[48,146],[66,128],[72,106]];
 for(let i=0;i<anchors.length-1;i++){
  const a=anchors[i],b=anchors[i+1],d=Math.hypot(b[0]-a[0],b[1]-a[1]);
  const s=box(group,d+.25,21,1.7,warmGrey,(a[0]+b[0])/2,38,(a[1]+b[1])/2);
  s.rotation.y=-Math.atan2(b[1]-a[1],b[0]-a[0]);
  const upper=box(group,d+.3,1.6,2.0,ivory,(a[0]+b[0])/2,49.4,(a[1]+b[1])/2);
  upper.rotation.y=s.rotation.y;
  const band=box(group,d+.4,1.15,2.3,dark,(a[0]+b[0])/2,28.0,(a[1]+b[1])/2);band.rotation.y=s.rotation.y;
 }
 // Scoreboard on the rear center-field wall with lower central camera booth.
 const boardBody=box(group,34,19,1.7,mat(0x101920),0,43.0,153.3);
 box(group,35,.62,2.1,ivory,0,53.0,153.3);
 const scr=add(group,new THREE.PlaneGeometry(31,15),new THREE.MeshBasicMaterial({map:canvasLabel('TAIPEI DOME','BASEBALL · FIELDVIEW 3D'),side:THREE.DoubleSide}),0,43.6,151.95);
 scr.rotation.y=Math.PI; // The screen must face home plate (-Z), not show a mirrored back face.
 // Screens face the field (toward -Z).
 const booth=box(group,23,6.0,4.2,mat(0x151c20),0,30.4,149);
 glassRibbon(group,31,146.75,10,3.8);
 for(let side of [-1,1]){
  const x=side*69;
  box(group,13,9.0,1.3,mat(0x111d21),x,27,121);
  const sideScreen=add(group,new THREE.PlaneGeometry(11.3,6.8),new THREE.MeshBasicMaterial({map:canvasLabel('FIELDVIEW','LIVE · TAIPEI'),side:THREE.DoubleSide}),x,27,120.2);
  sideScreen.rotation.y=Math.PI;
 }
 // Outfield pavilion: catwalks and narrow dark suite glazing, not more upper stands.
 for(let y of [27,30,34]){
  const z=145+(y-27)*.20;
  box(group,123,.85,2.1,y===30?ivory:dark,0,y,z);
 }
 for(let x=-64;x<=64;x+=8){
  box(group,.44,11,.7,mat(0x6c8183,.25),x,27,145);
 }
 // Field-side lower corridor/advertising ribbon can be seen behind the wall.
 for(let sign of [-1,1]){
  const sideStrip=box(group,24,3.6,1.2,dark,sign*60,17,114);
  sideStrip.rotation.y=sign*.51;
 }
 // Piers and horizontal circulation decks outside the infield. Plan is U only.
 const u=taipeiDome.tiers[2];
 for(let t=.03;t<=.98;t+=.062){
  const p=tierPoint(u,t,36);
  box(group,1.7,18,1.7,mat(0x7d8785),p.x,18,p.z);
 }
 return group;
}

// Fixed roof: Taipei Dome does NOT have a retractable roof. Cross-section
// plan approx 170 x 230m, internal peak roughly 68m above the playing surface.
const ROOF={rx:88,rz:118,centerZ:39,rim:50,apex:68};
function roofY(x,z){
 const k=(x/ROOF.rx)**2+((z-ROOF.centerZ)/ROOF.rz)**2;
 return ROOF.rim+(ROOF.apex-ROOF.rim)*Math.sqrt(Math.max(0,1-k));
}
function makeRoof(scene){
 const roof=new THREE.Group(),cutaway=new THREE.Group(),inside=new THREE.Group();scene.add(roof,cutaway,inside);
 const steelM=mat(0xb9c6c4,.54,.46),shellM=mat(0xa0acae,.7,.48);
 // Outside, use a very shallow metallic-oval roof shell, matching aerial photos.
 const v=[],idx=[];const rings=25,N=110;
 for(let r=0;r<=rings;r++)for(let i=0;i<=N;i++){
  const s=r/rings,theta=2*Math.PI*i/N,x=ROOF.rx*s*Math.sin(theta),z=ROOF.centerZ+ROOF.rz*s*Math.cos(theta);
  v.push(x,roofY(x,z),z);
 }
 for(let r=0;r<rings;r++)for(let i=0;i<N;i++){
  let a=r*(N+1)+i,b=a+N+1;idx.push(a,b,a+1,a+1,b,b+1);
 }
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(v,3));g.setIndex(idx);g.computeVertexNormals();add(roof,g,shellM);
 // Facade beneath the silver roof, with alternating horizontal glazed bands.
 for(let i=0;i<N;i++){
  const a=2*Math.PI*i/N,b=2*Math.PI*(i+1)/N;
  const x1=ROOF.rx*Math.sin(a),x2=ROOF.rx*Math.sin(b);
  const z1=ROOF.centerZ+ROOF.rz*Math.cos(a),z2=ROOF.centerZ+ROOF.rz*Math.cos(b);
  const width=Math.hypot(x2-x1,z2-z1)+.25,yaw=-Math.atan2(z2-z1,x2-x1);
  for(const [mid,h,m] of [[13,17,mat(0x68797b,.39)],[26,7,mat(0x7eaaa9,.42,.21)],[37,15,mat(0xa7b2b0,.64)]]){
   const panel=box(roof,width,h,1.2,m,(x1+x2)/2,mid,(z1+z2)/2);panel.rotation.y=yaw;
  }
 }
 // Concentric flattened roof panel seams visible in aerial photographs.
 for(let s of [.38,.68,.88,.997]){
  const pts=[];for(let i=0;i<=120;i++){
   const a=i/120*2*Math.PI,x=ROOF.rx*s*Math.sin(a),z=ROOF.centerZ+ROOF.rz*s*Math.cos(a);
   pts.push(V(x,roofY(x,z)+.11,z));
  }
  tube(roof,pts,.075,steelM,128);
 }
 // Structural diagrid inside. NOT radial wheel spokes: the contractor built
 // thousands of crisscrossing tubular steel members in a doubly-curved grid.
 const segments=[],interiorColor=0xc7d1cf;
 // Divide roofing in x/z stripes and cross diagonals. Trim cutaway above
 // center field so the field is never obscured in the overview.
 for(let x=-83;x<=83;x+=7.3){
  const lim=ROOF.rz*Math.sqrt(Math.max(0,1-(x/ROOF.rx)**2));
  let a=Math.max(ROOF.centerZ-3,ROOF.centerZ-lim),b=ROOF.centerZ+lim;if(a>=b)continue;
  let prev=null;for(let j=0;j<=45;j++){
   const z=a+(b-a)*j/45,p=[x,roofY(x,z)-1.25,z];if(prev)segments.push([prev,p]);prev=p;
  }
 }
 for(let z=ROOF.centerZ-3;z<ROOF.centerZ+ROOF.rz;z+=7.5){
  const lim=ROOF.rx*Math.sqrt(Math.max(0,1-((z-ROOF.centerZ)/ROOF.rz)**2));
  let prev=null;for(let j=0;j<=45;j++){
   const x=-lim+2*lim*j/45,p=[x,roofY(x,z)-1.25,z];if(prev)segments.push([prev,p]);prev=p;
  }
 }
 // Diagonal trusses make the signature crisscross ceiling visible in photographs.
 for(let d=-160;d<=160;d+=14){
  for(let polarity of [-1,1]){
   let prev=null;
   for(let x=-86;x<=86;x+=3.1){
    const z=ROOF.centerZ+58+polarity*x*.80+d*.28;
    if((x/ROOF.rx)**2+((z-ROOF.centerZ)/ROOF.rz)**2>.96||z<ROOF.centerZ-5){prev=null;continue;}
    let p=[x,roofY(x,z)-1.8,z];if(prev)segments.push([prev,p]);prev=p;
   }
  }
 }
 lines(cutaway,segments,interiorColor,.80);
 for(let z=38;z<=139;z+=24){
  const cap=ROOF.rx*Math.sqrt(Math.max(0,1-((z-ROOF.centerZ)/ROOF.rz)**2));
  if(!cap)continue;
  let pts=[];for(let j=0;j<=42;j++){
   let x=-cap+2*cap*j/42;pts.push(V(x,roofY(x,z)-1.45,z));
  }
  tube(cutaway,pts,.32,steel,56);
 }
 // Auditorium floodlights on the underside of the long steel span.
 const lights=lit(0xf4f5ed);
 for(let z of [42,83,118])for(let x=-68;x<=68;x+=12){
  if((x/ROOF.rx)**2+((z-ROOF.centerZ)/ROOF.rz)**2>.88)continue;
  add(cutaway,new THREE.SphereGeometry(.49,8,6),lights,x,roofY(x,z)-3,z);
 }
 // Dense continuous ceiling truss for first-person views. The exterior skin
 // remains hidden in the auditorium so it cannot occlude the playing field.
 const interior=[];
 for(let x=-83;x<=83;x+=8.2){
  const lim=ROOF.rz*Math.sqrt(Math.max(0,1-(x/ROOF.rx)**2));
  let prev=null;for(let j=0;j<=90;j++){
   const z=ROOF.centerZ-lim+2*lim*j/90,p=[x,roofY(x,z)-1.1,z];
   if(prev)interior.push([prev,p]);prev=p;
  }
 }
 for(let z=ROOF.centerZ-116;z<=ROOF.centerZ+116;z+=8.2){
  const lim=ROOF.rx*Math.sqrt(Math.max(0,1-((z-ROOF.centerZ)/ROOF.rz)**2));
  let prev=null;for(let j=0;j<=64;j++){
   const x=-lim+2*lim*j/64,p=[x,roofY(x,z)-1.1,z];
   if(prev)interior.push([prev,p]);prev=p;
  }
 }
 for(let offset=-120;offset<=120;offset+=16){
  for(let slope of [-.77,.77]){
   let prev=null;for(let x=-85;x<=85;x+=3.4){
    const z=ROOF.centerZ+offset+slope*x;
    if((x/ROOF.rx)**2+((z-ROOF.centerZ)/ROOF.rz)**2>.97){prev=null;continue;}
    const point=[x,roofY(x,z)-1.62,z];
    if(prev)interior.push([prev,point]);prev=point;
   }
  }
 }
 lines(inside,interior,0xd6dfe0,.87);
 for(let z=-34;z<130;z+=22){
  const lim=ROOF.rx*Math.sqrt(Math.max(0,1-((z-ROOF.centerZ)/ROOF.rz)**2));
  if(lim<3)continue;
  const pts=[];for(let i=0;i<=36;i++){
   const x=-lim+2*lim*i/36;pts.push(V(x,roofY(x,z)-1.5,z));
  }
  tube(inside,pts,.29,steel,50);
 }
 for(let z of [-26,19,65,111])for(let x=-72;x<=72;x+=12){
  const k=(x/ROOF.rx)**2+((z-ROOF.centerZ)/ROOF.rz)**2;
  if(k<.89)add(inside,new THREE.SphereGeometry(.55,8,6),lit(0xeceee9),x,roofY(x,z)-2.4,z);
 }
 roof.visible=false;cutaway.visible=true;inside.visible=false;
 return {roof,cutaway,inside};
}
function marker(scene){const g=new THREE.Group();scene.add(g);
 const ring=add(g,new THREE.TorusGeometry(1.4,.17,7,32),lit(0x55ffc8));ring.rotation.x=Math.PI/2;
 add(g,new THREE.SphereGeometry(.55,10,8),lit(0xf0fff6),0,.3,0);
 box(g,.18,5,.18,lit(0x64ffdc,.4),0,3.0,0);return g;}

export function buildTaipeiDome(scene){
 makeFloor(scene);
 const stand=stands(scene);
 const walls=arenaWalls(scene);
 const {roof,cutaway,inside}=makeRoof(scene);
 const focus=marker(scene);
 let highlight=null;
 const pickMat=new THREE.MeshBasicMaterial({color:0x60f9ba,opacity:.33,transparent:true,depthWrite:false,side:THREE.DoubleSide,polygonOffset:true,polygonOffsetFactor:-2});
 function select(level,section,row=8,seat=8){
  if(highlight){scene.remove(highlight);highlight=null;}
  const tier=taipeiDome.tiers.find(t=>t.id===level),shape=stand.bySection.get(`${level}-${section}`);
  if(shape){highlight=new THREE.Mesh(shape.geometry,pickMat);scene.add(highlight);}
  const p=tier?seatPosition(tier,section,row,seat):null;
  if(p)focus.position.set(p.x,p.y+.2,p.z);
  return p;
 }
 return {roof,roofCutaway:cutaway,roofInterior:inside,marker:focus,select,hitMeshes:stand.hitMeshes,chairs:stand.chairCount};
}
