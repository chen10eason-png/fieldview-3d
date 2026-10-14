import * as THREE from 'three';
import {taipeiDome, listSections, sectionBounds, seatPosition} from './stadiums.js';

// In-house, procedural 3D reconstruction. No third-party 3D models or textures.
// Public floor plans anchor the section topology, not centimeter-accurate coordinates.
const V=(x,y,z)=>new THREE.Vector3(x,y,z);
const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
const matt=(hex,rough=0.88)=>new THREE.MeshStandardMaterial({color:hex,roughness:rough,metalness:0.08,side:THREE.DoubleSide});
const basic=(hex,opacity=1)=>new THREE.MeshBasicMaterial({color:hex,transparent:opacity<1,opacity,side:THREE.DoubleSide,depthWrite:opacity===1});

const grass=matt(0x417e52), paleGrass=matt(0x458858), dirt=matt(0xb66f4c);
const white=matt(0xf3eee2), concrete=matt(0x687779), darkConcrete=matt(0x263538);
const steel=matt(0x839398,.5), fascia=matt(0x202f34);

function put(scene,geometry,material,x=0,y=0,z=0) {
 const mesh=new THREE.Mesh(geometry,material);mesh.position.set(x,y,z);
 mesh.receiveShadow=true;scene.add(mesh);return mesh;
}
function cuboid(scene,w,h,d,mat,x,y,z){return put(scene,new THREE.BoxGeometry(w,h,d),mat,x,y,z)}
function horizontal(scene,shape,mat,y=0) {
 const mesh=put(scene,new THREE.ShapeGeometry(shape),mat,0,y,0);
 mesh.rotation.x=Math.PI/2;return mesh;
}
function shapeFrom(points){let s=new THREE.Shape();s.moveTo(points[0][0],points[0][1]);points.slice(1).forEach(p=>s.lineTo(p[0],p[1]));s.closePath();return s;}
function lineSegments(scene,segments,mat){const verts=[];for(const [a,b] of segments){verts.push(...a,...b);}const m=new THREE.LineSegments(new THREE.BufferGeometry().setAttribute('position',new THREE.Float32BufferAttribute(verts,3)),mat);scene.add(m);return m;}
function tube(scene,points,radius,material,segments=32) {const curve=new THREE.CatmullRomCurve3(points.map(p=>Array.isArray(p)?V(...p):p));return put(scene,new THREE.TubeGeometry(curve,segments,radius,5,false),material);}
function arcSamples(start,end,count,func){return Array.from({length:count+1},(_,i)=>func(start+(end-start)*i/count,i));}

const wallArc = theta => [70*Math.sin(theta), 28+53*Math.cos(theta)];

function makeField(scene) {
 const root=new THREE.Group();scene.add(root);
 // Infield extends behind the baselines and has a more accurate 90-degree foul-line orientation.
 const home=[0,-42],right=[70,28],left=[-70,28];
 const arc=arcSamples(-Math.PI/2,Math.PI/2,60,a=>wallArc(a));
 const whole=shapeFrom([home,right,...arc.slice(1).reverse(),left]);
 // The warning track follows an irregular outfield arc, rather than a circular wall.
 horizontal(root,whole,dirt,.02);
 // Grass inset from wall, with radial strips inspired by the turf's mowing variations.
 const innerArc=arcSamples(-Math.PI/2,Math.PI/2,64,a=>[66.8*Math.sin(a),28+49.8*Math.cos(a)]);
 const green=shapeFrom([[0,-31],[66.8,27],...innerArc.slice(1).reverse(),[-66.8,27]]);
 horizontal(root,green,grass,.06);
 const wedgeMats=[grass,paleGrass];
 for(let i=0;i<16;i++) {
  const a=-Math.PI/2+i*Math.PI/16,b=-Math.PI/2+(i+1)*Math.PI/16;
  const points=[[0,-14],...arcSamples(a,b,6,q=>[66.8*Math.sin(q),28+49.8*Math.cos(q)])];
  horizontal(root,shapeFrom(points),wedgeMats[i%2],.072);
 }
 // Skin: home to first, second, third. Grass interior leaves distinct red dirt baselines.
 horizontal(root,shapeFrom([[0,-42],[24.8,-22.4],[0,2.8],[-24.8,-22.4]]),dirt,.15);
 horizontal(root,shapeFrom([[0,-30],[13.5,-22.5],[0,-9],[-13.5,-22.5]]),grass,.185);
 // Dirt mound and home circle.
 let mound=put(root,new THREE.CylinderGeometry(3.85,3.85,.29,36),dirt,0,.29,-23.55);
 let plateDisk=put(root,new THREE.CylinderGeometry(5.3,5.3,.11,32),dirt,0,.16,-42);
 // Bases true baseball-diamond proportions, 27.43m side.
 const bases=[[0,-42],[19.4,-22.6],[0,-3.2],[-19.4,-22.6]];
 for(let i=0;i<bases.length;i++) {
  const [x,z]=bases[i];const base=cuboid(root,i===0?1.2:1.45,.12,i===0?1.35:1.45,white,x,.27,z);base.rotation.y=Math.PI/4;
 }
 // Chalk, foul lines, batter boxes, pitch rubber.
 const chalk=new THREE.LineBasicMaterial({color:0xfcf5e5});
 lineSegments(root,[[[0,.31,-42],[70,.31,28]],[[0,.31,-42],[-70,.31,28]],[[19.4,.32,-22.6],[0,.32,-3.2]],[[-19.4,.32,-22.6],[0,.32,-3.2]]],chalk);
 for(const sign of [-1,1]){
  lineSegments(root,[ [[sign*2.3,.27,-47],[sign*2.3,.27,-40.3]],[[sign*4.8,.27,-47],[sign*4.8,.27,-40.3]],[[sign*2.3,.27,-47],[sign*4.8,.27,-47]] ],chalk);
 }
 cuboid(root,.65,.09,.19,white,0,.45,-23.6);
 // Warning-track/outfield wall follows only the outfield arc; yellow cap.
 const panels=[];
 for(let i=0;i<80;i++) {
  const a=-Math.PI/2+i*Math.PI/80,b=-Math.PI/2+(i+1)*Math.PI/80;
  const [x1,z1]=wallArc(a),[x2,z2]=wallArc(b);
  const d=Math.hypot(x2-x1,z2-z1),angle=Math.atan2(x2-x1,z2-z1);
  const wall=cuboid(root,d+.10,7.5,.75,matt(i%7===0?0x1d514a:0x194941), (x1+x2)/2,3.9,(z1+z2)/2);
  wall.rotation.y=angle+Math.PI/2;
  const cap=cuboid(root,d+.12,.21,.9,matt(0xd4b54d),(x1+x2)/2,7.72,(z1+z2)/2);
  cap.rotation.y=wall.rotation.y;
  panels.push(wall);
 }
 // Foul poles at left and right field.
 for(const s of [-1,1]) {
   const pole=cuboid(root,.2,23,.2,matt(0xe4c830),s*70,11.5,28);
   pole.castShadow=false;
   for(let z=2;z<20;z+=2) { // sparse grid on the pole
     cuboid(root,.15,.12,2.3,matt(0xe4c830),s*70,z,28);
   }
 }
 // Dark dugouts adjacent to home plate; entrances open toward turf.
 for(const sign of [-1,1]) {
  const x=sign*41;
  cuboid(root,25,2.3,8,matt(0x203436),x,1.17,-46);
  cuboid(root,25,.45,8,matt(0x536569),x,2.6,-46);
  cuboid(root,24,1.0,.3,matt(0x17272b),x,.80,-50);
 }
 // Simple human scale references on the field, not real teams or live play.
 const personShirt=matt(0xf7e9d6),personPants=matt(0x1d3037);
 [[0,-23.5],[-20,-22.5],[20,-22.5],[0,-3],[-46,37],[45,34],[0,61]].forEach(([x,z])=>{
  const g=new THREE.Group();root.add(g);g.position.set(x,.2,z);
  g.add(new THREE.Mesh(new THREE.CylinderGeometry(.33,.4,1.25,5),personPants));g.children[0].position.y=1;
  const shirt=new THREE.Mesh(new THREE.CylinderGeometry(.48,.43,.77,6),personShirt);shirt.position.y=1.9;g.add(shirt);
  const head=new THREE.Mesh(new THREE.SphereGeometry(.29,7,5),matt(0xb98663));head.position.y=2.55;g.add(head);
 });
 return root;
}

// Curved tier stair-stepping: backs/riser surfaces, gaps at section boundaries,
// white/gray individual chair instances, catwalks and guardrails.
function sectionTierGeometry(tier,a0,a1) {
 const vertices=[];const indices=[];let idx=0;
 const addQuad=(a,b,c,d)=>{
  vertices.push(...a,...b,...c,...d);
  indices.push(idx,idx+1,idx+2,idx,idx+2,idx+3);idx+=4;
 };
 const angularDivisions=Math.max(3,Math.ceil((a1-a0)*52));
 for(let row=0;row<tier.rows;row++) {
  const outer=row+1,inner=row;
  const y=tier.floor+row*tier.rise;
  const lastY=tier.floor+(row+1)*tier.rise;
  for(let i=0;i<angularDivisions;i++) {
   const a=a0+(a1-a0)*i/angularDivisions, b=a0+(a1-a0)*(i+1)/angularDivisions;
   const p=(ang,depth,h)=>[Math.sin(ang)*(tier.rx+depth*tier.pitch),h,tier.centerZ+Math.cos(ang)*(tier.rz+depth*tier.pitch)];
   addQuad(p(a,inner,y),p(b,inner,y),p(b,outer,y),p(a,outer,y));
   // risers give actual separate rows rather than a continuous inclined plane.
   addQuad(p(a,outer,y),p(b,outer,y),p(b,outer,lastY),p(a,outer,lastY));
  }
 }
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));g.setIndex(indices);g.computeVertexNormals();return g;
}

function createSeatInstances(scene,chairs) {
 const seatGeo=new THREE.BoxGeometry(.69,.19,.66),backGeo=new THREE.BoxGeometry(.72,.71,.11);
 const base=new THREE.InstancedMesh(seatGeo,matt(0xffffff),chairs.length);
 const backs=new THREE.InstancedMesh(backGeo,matt(0xffffff),chairs.length);
 base.instanceMatrix.setUsage(THREE.StaticDrawUsage);backs.instanceMatrix.setUsage(THREE.StaticDrawUsage);
 const dummy=new THREE.Object3D(),col=new THREE.Color();
 for(let i=0;i<chairs.length;i++) {
   const seat=chairs[i];
   // Rotation aligns all chairs toward the field regardless of the ellipse tangent.
   dummy.rotation.set(0,seat.a,0);
   dummy.position.set(seat.x,seat.y+.39,seat.z);
   dummy.updateMatrix();base.setMatrixAt(i,dummy.matrix);
   const rad=seat.rx+seat.r*seat.pitch,dep=seat.rz+seat.r*seat.pitch;
   const outX=Math.sin(seat.a)*.36,outZ=Math.cos(seat.a)*.36;
   dummy.position.set(seat.x+outX,seat.y+.80,seat.z+outZ);
   dummy.updateMatrix();backs.setMatrixAt(i,dummy.matrix);
   // Color blocking resembles the white/charcoal irregular rows seen at Taipei Dome.
   const hash=((i*179+seat.section*41+seat.r*17)%101);
   let hex=hash<11?0x25363b:hash<30?0x788b8f:hash<59?0xbdcbd0:0xf0f1e9;
   if(seat.tier==='L3') hex=hash<30?0x2c363b:0xa5aaa5;
   col.setHex(hex);base.setColorAt(i,col);backs.setColorAt(i,col);
 }
 base.instanceMatrix.needsUpdate=true;backs.instanceMatrix.needsUpdate=true;
 if(base.instanceColor)base.instanceColor.needsUpdate=true;
 if(backs.instanceColor)backs.instanceColor.needsUpdate=true;
 base.frustumCulled=false;backs.frustumCulled=false;
 scene.add(base,backs);
 return chairs.length;
}

function makeStands(scene) {
 const tiers=taipeiDome.tiers, hitMeshes=[], meshBySection=new Map(), chairs=[];
 const tierMaterial=[matt(0x5a676a),matt(0x606c6d),matt(0x484f52),matt(0x586364),matt(0x596569)];
 for (const [k,tier] of tiers.entries()) {
  // Structural concourse below each tier, following real inner/outer arcs.
  for(const band of tier.bands) {
   const a0=band.start,a1=band.end;const segments=70;
   const verts=[],indices=[];
   for(let i=0;i<=segments;i++){
    let a=a0+(a1-a0)*i/segments;
    const rx=tier.rx+(.1)*tier.pitch,rz=tier.rz+(.1)*tier.pitch;
    verts.push(rx*Math.sin(a),tier.floor-3.5,tier.centerZ+rz*Math.cos(a),rx*Math.sin(a),tier.floor+.1,tier.centerZ+rz*Math.cos(a));
   }
   for(let i=0;i<segments;i++){let n=2*i;indices.push(n,n+1,n+2,n+1,n+3,n+2);}
   const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(verts,3));g.setIndex(indices);g.computeVertexNormals();
   put(scene,g,fascia);
   // Handrails/guardrail on front of the next deck.
   const points=arcSamples(a0,a1,80,a=>V((tier.rx+.65)*Math.sin(a),tier.floor+1.0,tier.centerZ+(tier.rz+.65)*Math.cos(a)));
   tube(scene,points,.115,steel,110);
  }
  for(const section of listSections(tier)) {
    const bounds=sectionBounds(tier,section);
    if(!bounds)continue;
    const gap=Math.min(.014,(bounds[1]-bounds[0])*.10);
    const [a0,a1]=[bounds[0]+gap,bounds[1]-gap];
    const geo=sectionTierGeometry(tier,a0,a1);
    const mesh=put(scene,geo,tierMaterial[k]);
    mesh.userData={tier:tier.id,section};
    meshBySection.set(`${tier.id}-${section}`,mesh);hitMeshes.push(mesh);
    for(let row=0;row<tier.rows;row++) {
      const rad=tier.rx+(row+.5)*tier.pitch,dep=tier.rz+(row+.5)*tier.pitch;
      const amid=(a0+a1)/2;
      const tangent=Math.hypot(rad*Math.cos(amid),dep*Math.sin(amid));
      const count=clamp(Math.floor((a1-a0)*tangent/1.45),2,22);
      for(let j=0;j<count;j++) {
        let a=a0+(a1-a0)*(j+.5)/count;
        chairs.push({x:rad*Math.sin(a),y:tier.floor+row*tier.rise,
          z:tier.centerZ+dep*Math.cos(a),a,section,r:row,rx:tier.rx,rz:tier.rz,pitch:tier.pitch,tier:tier.id});
      }
    }
    // Vertical concrete aisle walls at section split points.
    if(section%3===0){
      const a=bounds[1];const d0=tier.rx-1,d1=tier.rx+tier.rows*tier.pitch;
      lineSegments(scene,[[[d0*Math.sin(a),tier.floor+.3,tier.centerZ+(tier.rz-1)*Math.cos(a)],
        [d1*Math.sin(a),tier.floor+(tier.rows-1)*tier.rise+.3,tier.centerZ+(tier.rz+tier.rows*tier.pitch)*Math.cos(a)]]],
        new THREE.LineBasicMaterial({color:0xe1e3d7}));
    }
  }
 }
 const numChairs=createSeatInstances(scene,chairs);
 return {hitMeshes,meshBySection,numChairs};
}

function makeVideoTexture() {
 const c=document.createElement('canvas');c.width=1024;c.height=448;const ctx=c.getContext('2d');
 const grd=ctx.createLinearGradient(0,0,1024,448);grd.addColorStop(0,'#10292a');grd.addColorStop(.5,'#123f3c');grd.addColorStop(1,'#0a1f28');
 ctx.fillStyle=grd;ctx.fillRect(0,0,c.width,c.height);
 ctx.strokeStyle='#337966';ctx.lineWidth=4;for(let i=0;i<12;i++){ctx.beginPath();ctx.moveTo(i*100-200,0);ctx.lineTo(i*100+100,448);ctx.stroke();}
 ctx.textAlign='center';ctx.fillStyle='#a9dfca';ctx.font='bold 34px sans-serif';ctx.fillText('TAIPEI DOME',512,102);
 ctx.fillStyle='#ffffff';ctx.font='900 102px sans-serif';ctx.fillText('FIELDVIEW',512,227);
 ctx.fillStyle='#91e6c7';ctx.font='bold 38px sans-serif';ctx.fillText('BASEBALL / 3D',512,303);
 ctx.font='25px sans-serif';ctx.fillStyle='#d6e6e1';ctx.fillText('SEAT VIEW · INDEPENDENT RECONSTRUCTION',512,376);
 const tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace;tex.anisotropy=4;return tex;
}

function makeArchitecture(scene) {
 const group=new THREE.Group();scene.add(group);
 // Actual Taipei Dome has a massive scoreboard on the tall *outfield* end wall.
 // Faceted perimeter follows the grandstand sweep rather than a perfect circle.
 const backWallMat=matt(0x687473),skinMat=matt(0x909796);
 for(let i=0;i<36;i++) {
  const a=-Math.PI/2+i*Math.PI/36,b=-Math.PI/2+(i+1)*Math.PI/36;
  const rx=148,rz=147,cz=16;
  let x1=rx*Math.sin(a),z1=cz+rz*Math.cos(a),x2=rx*Math.sin(b),z2=cz+rz*Math.cos(b);
  let d=Math.hypot(x2-x1,z2-z1),wall=cuboid(group,d+.2,35,2,backWallMat,(x1+x2)/2,65,(z1+z2)/2);
  wall.rotation.y=Math.atan2(x2-x1,z2-z1)+Math.PI/2;
  if(i%4===0) {
   const column=cuboid(group,1.65,44,2.3,skinMat,x1,59,z1);
   column.rotation.y=wall.rotation.y;
  }
 }
 // Center field scoreboard + scoreboard light trays (as in photos).
 cuboid(group,66,31,2.8,matt(0x111d23),0,58.5,161.3);
 const face=put(group,new THREE.PlaneGeometry(60,26.5),new THREE.MeshBasicMaterial({map:makeVideoTexture(),side:THREE.DoubleSide}),0,58.5,159.5);
 // A plane front faces -Z by default; camera behind home at negative Z.
 face.rotation.y=Math.PI;
 for(let s of [-1,1]) {
  const secondary=cuboid(group,16,10,1.6,matt(0x162b31),s*100,42,118);
  const sc=put(group,new THREE.PlaneGeometry(13,7),new THREE.MeshBasicMaterial({color:0x32605c,side:THREE.DoubleSide}),s*100,42,116.9);sc.rotation.y=s*.35;
 }
 // Outer concourse and heavy piers; upper bowl is concentrated behind home plate.
 for(let i=0;i<46;i++){
  const a=-Math.PI/2+i*Math.PI*2/46;
  const x=195*Math.sin(a),z=16+189*Math.cos(a);
  cuboid(group,2.0,52,2.6,matt(0x657175),x,25,z);
 }
 for(const y of [24,37,45,61,78]){
  for(let j=0;j<70;j++){
    const a=-Math.PI/2+j*Math.PI*2/70;
    const b=a+Math.PI*2/70;
    const x1=190*Math.sin(a),z1=16+182*Math.cos(a),x2=190*Math.sin(b),z2=16+182*Math.cos(b);
    const seg=cuboid(group,Math.hypot(x2-x1,z2-z1)+.3,1.25,3.2,matt(0x48565a),(x1+x2)/2,y,(z1+z2)/2);
    seg.rotation.y=Math.atan2(x2-x1,z2-z1)+Math.PI/2;
  }
 }
 // Gate portals on both first/third base sides, distinctly below the bowl.
 for(const sign of [-1,1]){
  const x=sign*183;
  const portal=cuboid(group,22,11,3,matt(0x102529),x,8,6);
  cuboid(group,24,1.25,4,matt(0x97a1a2),x,14,6);
 }
 return group;
}

function roofHeight(x,z){const k=(x/209)**2+((z-16)/201)**2;return 78+56*Math.sqrt(Math.max(0,1-k));}
function makeRoof(scene) {
 const roof=new THREE.Group();scene.add(roof);
 const meshVerts=[],meshIndices=[];
 const div=70,rings=30;
 for(let r=0;r<=rings;r++) {
  const v=r/rings,rx=208*v,rz=200*v;
  for(let i=0;i<=div;i++) {
    const a=i/div*Math.PI*2,x=rx*Math.sin(a),z=16+rz*Math.cos(a);
    meshVerts.push(x,roofHeight(x,z),z);
  }
 }
 for(let r=0;r<rings;r++)for(let i=0;i<div;i++){
  const k=r*(div+1)+i,l=k+div+1;meshIndices.push(k,l,k+1,k+1,l,l+1);
 }
 const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(meshVerts,3));geo.setIndex(meshIndices);geo.computeVertexNormals();
 const shell=new THREE.Mesh(geo,basic(0x48585e,.37));roof.add(shell);
 // A rectilinear diagonal steel-truss grid, approximating the conspicuous Taipei Dome ceiling.
 const lineMat=new THREE.LineBasicMaterial({color:0x9ca8ac,transparent:true,opacity:.80});
 let beams=[];
 for(let u=-185;u<=185;u+=13) {
  let lim=200*Math.sqrt(Math.max(0,1-(u/209)**2));
  let pts=arcSamples(-lim,lim,45,z=>[u,roofHeight(u,z+16)-1.6,z+16]);
  for(let j=0;j<pts.length-1;j++)beams.push([pts[j],pts[j+1]]);
 }
 for(let v=-183;v<=183;v+=13){
  let lim=209*Math.sqrt(Math.max(0,1-(v/201)**2));
  let pts=arcSamples(-lim,lim,45,x=>[x,roofHeight(x,v+16)-1.6,v+16]);
  for(let j=0;j<pts.length-1;j++)beams.push([pts[j],pts[j+1]]);
 }
 lineSegments(roof,beams,lineMat);
 // Thicker long-span ribs form the oval arch instead of radial wheel spokes.
 for(let v=-158;v<=158;v+=40){
   let lim=209*Math.sqrt(1-(v/201)**2);
   tube(roof,arcSamples(-lim,lim,36,x=>V(x,roofHeight(x,v+16)-.7,v+16)),.56,steel,60);
 }
 for(let u=-145;u<=145;u+=48){
   let lim=201*Math.sqrt(1-(u/209)**2);
   tube(roof,arcSamples(-lim,lim,36,z=>V(u,roofHeight(u,z+16)-.7,z+16)),.44,steel,60);
 }
 return roof;
}

// From outside the roof, keep only a rear cutaway lattice visible so viewers can
// read the recognizable arched ceiling without hiding the ballpark below.
function makeRoofCutaway(scene) {
 const half=new THREE.Group();scene.add(half);
 const color=new THREE.LineBasicMaterial({color:0x99adb1,transparent:true,opacity:.72});
 const fragments=[];
 for(let x=-188;x<=188;x+=16) {
  let edge=201*Math.sqrt(Math.max(0,1-(x/209)**2));
  let from=Math.max(18,-edge),to=edge;
  if(to<=from)continue;
  const points=arcSamples(from,to,35,z=>[x,roofHeight(x,z+16),z+16]);
  for(let i=0;i<points.length-1;i++)fragments.push([points[i],points[i+1]]);
 }
 for(let z=22;z<=191;z+=16){
  const edge=209*Math.sqrt(Math.max(0,1-(z/201)**2));
  let points=arcSamples(-edge,edge,46,x=>[x,roofHeight(x,z+16),z+16]);
  for(let i=0;i<points.length-1;i++)fragments.push([points[i],points[i+1]]);
 }
 lineSegments(half,fragments,color);
 return half;
}

function makeSelectedMarker(scene) {
 const marker=new THREE.Group();scene.add(marker);
 const ring=new THREE.Mesh(new THREE.TorusGeometry(2.25,.29,8,30),basic(0x25ffe0));ring.rotation.x=Math.PI/2;marker.add(ring);
 const light=new THREE.Mesh(new THREE.SphereGeometry(.75,12,8),new THREE.MeshBasicMaterial({color:0xd2fff5}));marker.add(light);
 const beam=new THREE.Mesh(new THREE.CylinderGeometry(.12,.12,7,7),basic(0x68ffe4,.57));beam.position.y=4;marker.add(beam);
 return marker;
}

function makeAccent(scene) {
 const floor=new THREE.Mesh(new THREE.PlaneGeometry(470,480),matt(0x111b20));floor.rotation.x=-Math.PI/2;floor.position.set(0,-3.7,15);scene.add(floor);
 const marker=makeSelectedMarker(scene);
 return marker;
}

export function buildTaipeiDome(scene) {
 const marker=makeAccent(scene);
 makeField(scene);
 const stands=makeStands(scene);
 makeArchitecture(scene);
 const roof=makeRoof(scene);
 const roofCutaway=makeRoofCutaway(scene);
 roof.visible=false;roofCutaway.visible=true;
 const selectionMat=new THREE.MeshBasicMaterial({color:0x37f5bc,transparent:true,opacity:.28,side:THREE.DoubleSide,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1});
 let highlight=null;
 function select(level,section,row=8,seat=8){
  if(highlight){scene.remove(highlight);highlight.geometry.dispose();highlight=null;}
  const mesh=stands.meshBySection.get(`${level}-${section}`);
  if(mesh){highlight=new THREE.Mesh(mesh.geometry.clone(),selectionMat);scene.add(highlight);}
  const tier=taipeiDome.tiers.find(t=>t.id===level);
  const pos=tier?seatPosition(tier,section,row,seat):null;
  if(pos)marker.position.set(pos.x,pos.y+.2,pos.z);
  return pos;
 }
 return {roof,roofCutaway,marker,select,hitMeshes:stands.hitMeshes,chairs:stands.numChairs};
}
