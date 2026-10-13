import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { stadiums, seatAngle } from './stadiums.js';
import './style.css';

const stadium = stadiums.taipeiDome;
const state = { level:'B1', section:113, row:12, seat:8, mode:'overview', labels:true };
const root = document.getElementById('app');
root.innerHTML = `
<header class="topbar"><a class="brand" href="#" aria-label="首頁"><span class="brand-mark">◈</span><span>FIELD<span class="accent">VIEW</span><small>TAIWAN BALLPARKS / 3D</small></span></a><div class="topright"><span class="version">V 0.1 · PROTOTYPE</span><span class="live"><i></i> 3D SIMULATION</span></div></header>
<main class="layout"><aside class="sidebar">
  <div class="eyebrow">STADIUM 01 / TAIWAN</div><h1>選一個座位，<br/><em>走進球場。</em></h1><p class="intro">從看台到本壘板，探索臺北大巨蛋的模擬觀賽視角。</p>
  <div class="stadium-select"><span class="location-icon">⌖</span><span><b>臺北大巨蛋</b><small>TAIPEI DOME · 臺北市</small></span><span class="dropdown">⌄</span></div>
  <div class="section-title"><span>01</span> 選擇座位 <small>CHOOSE YOUR SEAT</small></div>
  <label class="label" for="level">座位樓層 <span>LEVEL</span></label><select id="level"></select>
  <label class="label" for="section">座位區域 <span>SECTION</span></label><select id="section"></select>
  <div class="two-col"><div><label class="label" for="row">排數 <span>ROW</span></label><input id="row" type="number" min="1" max="40" value="12"/></div><div><label class="label" for="seat">座號 <span>SEAT</span></label><input id="seat" type="number" min="1" max="40" value="8"/></div></div>
  <button id="seatview" class="primary">進入座位視角 <span>↗</span></button><button id="overview" class="secondary">◎　返回 3D 球場總覽</button>
  <div class="note"><span>ⓘ</span> 本站為非官方概念模擬。分區位置、排距、高度與座號均為估算，不能作為實際視野或購票依據。</div>
  <div class="side-footer">NEXT STADIUM <strong>COMING SOON</strong><small>臺灣其他棒球場將陸續加入</small></div>
</aside>
<section class="stage"><div class="stage-head"><div><div class="eyebrow">IMMERSIVE STADIUM EXPERIENCE</div><h2>TAIPEI <span>DOME.</span></h2></div><div class="head-meta">25° 02′ N &nbsp; 121° 33′ E <span>● CONCEPT MODEL</span></div></div>
 <div class="viewer" id="viewer"><div id="canvas" aria-label="可拖曳旋轉的 3D 大巨蛋球場"></div><div class="viewer-gradient"></div><div class="viewer-top"><span class="simtag"><i></i> INTERACTIVE 3D</span><div class="viewer-tools"><button id="toggle-roof" title="切換屋頂示意">⌂ <span>屋頂</span></button><button id="reset" title="重設鏡頭">↺ <span>重設</span></button></div></div><div class="viewer-label"><span id="view-title">球場鳥瞰</span><small id="view-subtitle">DRAG TO EXPLORE · SCROLL TO ZOOM</small></div><div class="nav-hint">☞ <span>拖曳旋轉　·　雙指 / 滾輪縮放　·　點選看台</span></div><div class="compass">N <span>✣</span> S</div></div>
 <div class="bottom"><div class="seat-card"><span class="seat-icon">▧</span><span><small>目前模擬位置 / YOUR SEAT</small><strong id="seat-label">B1 · 113 區 · 12 排 · 8 號</strong></span><span class="status">● SIMULATED</span></div><div class="actions"><button id="home-view">球場全景</button><button id="behind-view">本壘後方</button><button id="outfield-view">外野視角</button></div></div>
 </section></main><footer class="page-footer">FIELDVIEW / MADE FOR BASEBALL FANS <span>INDEPENDENT CONCEPT · NOT AFFILIATED WITH TAIPEI DOME</span></footer>`;

const $ = id => document.getElementById(id);
const levelSelect = $('level'), sectionSelect=$('section');
for (const l of stadium.levels) { const o=document.createElement('option');o.value=l.id;o.textContent=l.label;levelSelect.append(o); }
function sectionOptions(){
  sectionSelect.innerHTML=''; const lvl=stadium.levels.find(l=>l.id===state.level);
  if(!lvl.sections.length){sectionSelect.disabled=true;sectionSelect.add(new Option('尚無一般座位分區資料',''));$('seatview').disabled=true;return;}
  sectionSelect.disabled=false;$('seatview').disabled=false;
  if(!lvl.sections.includes(state.section)) state.section = lvl.sections[Math.floor(lvl.sections.length/2)];
  for(const sec of lvl.sections) sectionSelect.add(new Option(`${sec} 區`,sec)); sectionSelect.value=String(state.section);
  updateLabel();
}
function updateLabel(){ $('seat-label').textContent=`${state.level} · ${state.section} 區 · ${state.row} 排 · ${state.seat} 號`; }
levelSelect.value=state.level; sectionOptions();

const scene=new THREE.Scene(); scene.background=new THREE.Color(0x102029);scene.fog=new THREE.FogExp2(0x102029,.00175);
const camera=new THREE.PerspectiveCamera(48,1,.3,1000);camera.position.set(190,155,225);
const renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2));renderer.shadowMap.enabled=true; renderer.shadowMap.type=THREE.PCFSoftShadowMap;
renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.35;
$('canvas').appendChild(renderer.domElement);
const controls=new OrbitControls(camera,renderer.domElement); controls.enableDamping=true;controls.dampingFactor=.075;controls.minDistance=16;controls.maxDistance=500;controls.maxPolarAngle=Math.PI*.92;controls.target.set(0,4,0);
scene.add(new THREE.HemisphereLight(0xd4f0ff,0x253a35,2.5));
const sunlight=new THREE.DirectionalLight(0xffffff,3.5);sunlight.position.set(-75,150,40);sunlight.castShadow=true;sunlight.shadow.mapSize.set(2048,2048);sunlight.shadow.camera.left=-190;sunlight.shadow.camera.right=190;sunlight.shadow.camera.top=190;sunlight.shadow.camera.bottom=-190;scene.add(sunlight);
const material=(color,roughness=1)=>new THREE.MeshStandardMaterial({color,roughness,side:THREE.DoubleSide});
const grass=material(0x236a49), dirt=material(0xa97042), lines=new THREE.LineBasicMaterial({color:0xf9ead1});
function plane(w,h,mat,x=0,y=0,z=0){let m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),mat);m.rotation.x=-Math.PI/2;m.position.set(x,y,z);m.receiveShadow=true;scene.add(m);return m;}
function box(w,h,d,mat,x,y,z){let m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;scene.add(m);return m;}
function ringSector(inner,outer,a0,a1,y0,y1,mat,segments=24){
 const pos=[],idx=[];for(let j=0;j<=1;j++){const r=j?outer:inner;for(let i=0;i<=segments;i++){const a=a0+(a1-a0)*i/segments;pos.push(Math.sin(a)*r,y0+(r-inner)/(outer-inner)*(y1-y0),Math.cos(a)*r);}}
 for(let i=0;i<segments;i++){let a=i,b=i+1,c=segments+1+i,d=c+1;idx.push(a,b,c,b,d,c);}
 const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));geo.setIndex(idx);geo.computeVertexNormals();const mesh=new THREE.Mesh(geo,mat);mesh.receiveShadow=true;scene.add(mesh);return mesh;
}
// Infield diamond: home at (0,0,0), center field toward +Z.
plane(330,330,material(0x152a33),0,-1,25);
const field=new THREE.Mesh(new THREE.CircleGeometry(74,100),grass);field.rotation.x=-Math.PI/2;field.position.set(0,.06,28);field.receiveShadow=true;scene.add(field);
const infield=new THREE.Mesh(new THREE.ShapeGeometry((()=>{const s=new THREE.Shape();s.moveTo(0,0);s.lineTo(30,30);s.lineTo(0,60);s.lineTo(-30,30);s.closePath();return s;})()),dirt);infield.rotation.x=-Math.PI/2;infield.position.set(0,.13,0);scene.add(infield);
const innerGrass=new THREE.Mesh(new THREE.CircleGeometry(21,4),grass);innerGrass.rotation.x=-Math.PI/2;innerGrass.rotation.z=Math.PI/4;innerGrass.position.set(0,.17,30);scene.add(innerGrass);
for (const [x,z] of [[0,0],[-30,30],[0,60],[30,30]]) box(2,.16,2,material(0xffffff),x,.35,z);
const mound=new THREE.Mesh(new THREE.CylinderGeometry(6,6,.28,32),dirt);mound.position.set(0,.24,30);scene.add(mound);
function line(points,color=0xffffff){let pts=points.map(p=>new THREE.Vector3(...p));let o=new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts),new THREE.LineBasicMaterial({color}));scene.add(o);}
line([[0,.31,0],[-66,.31,66]]);line([[0,.31,0],[66,.31,66]]);
for(let r=0;r<9;r++){const z=20+r*5;let st=-Math.sqrt(Math.max(0,74**2-(z-28)**2)),en=-st;line([[st,.1,z],[en,.1,z]],r%2?0x2c8159:0x246d4e);}
// Dugouts and outfield wall
box(30,4,9,material(0x1d343a),-55,2,0);box(30,4,9,material(0x1d343a),55,2,0);
const wall=new THREE.Mesh(new THREE.CylinderGeometry(77,77,8,100,1,true,0,Math.PI*2),material(0x103e3b));wall.position.set(0,3.8,20);scene.add(wall);
// Concentric seating decks, separated by level and colored alternating groups
const deckMaterials=[material(0x3e6470),material(0x557b86),material(0x355664),material(0x436c78),material(0x64838a)];
const sectionMeshes=[];
const decks=[{inner:80,outer:106,y0:8,y1:21,level:'B1'}, {inner:108,outer:125,y0:28,y1:38,level:'L2'}, {inner:130,outer:147,y0:43,y1:56,level:'L4'}, {inner:151,outer:171,y0:60,y1:78,level:'L5'}];
for(const [deckIndex,deck] of decks.entries()) {
 ringSector(deck.inner,deck.outer,-Math.PI,Math.PI,deck.y0,deck.y1,material(0x1c3540),110);
 for(let i=0;i<56;i++){
   let start=-Math.PI+i*Math.PI*2/56+.006, end=-Math.PI+(i+1)*Math.PI*2/56-.006;
   let mesh=ringSector(deck.inner+1,deck.outer-1,start,end,deck.y0+.45,deck.y1-.7,deckMaterials[(i%4+deckIndex)%deckMaterials.length],5);
   mesh.userData={deck:deck.level,angle:(start+end)/2};sectionMeshes.push(mesh);
   if(i%7===0) {ringSector(deck.inner,deck.outer,start-.009,start+.012,deck.y0+.6,deck.y1+1,material(0xb6bcc0),2);}
 }
 // Thin continuous fascia
 const fascia=new THREE.Mesh(new THREE.CylinderGeometry(deck.inner,deck.inner,1.65,110,1,true),material(deckIndex%2?0x142a34:0x223d48));fascia.position.y=deck.y0+.4;scene.add(fascia);
}
// Structure, scoreboard, architectural roof outline
for(let i=0;i<40;i++){const a=i/40*Math.PI*2,r=178;box(2,88,2,material(0x63767c),r*Math.sin(a),43,r*Math.cos(a));}
const roofGroup=new THREE.Group(); scene.add(roofGroup);
for(let j=0;j<8;j++){const r=177-j*14;const tor=new THREE.Mesh(new THREE.TorusGeometry(r,1.45,9,120),material(0x7a9296,.6));tor.rotation.x=Math.PI/2;tor.position.y=91+j*2;roofGroup.add(tor);}
for(let i=0;i<18;i++){const a=i/18*Math.PI*2;let pts=[new THREE.Vector3(Math.sin(a)*178,89,Math.cos(a)*178),new THREE.Vector3(0,111,0)];let beam=new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts),new THREE.LineBasicMaterial({color:0x546e76}));roofGroup.add(beam);}
const scoreboard=box(39,17,2,material(0x080f15),0,34,96);const screen=box(34,12,.15,new THREE.MeshBasicMaterial({color:0x176e74}),0,34,94.85);
// Show selected section as cyan marker, projected onto approximate inner edge of selected level
const marker=new THREE.Mesh(new THREE.SphereGeometry(2.2,18,12),new THREE.MeshBasicMaterial({color:0x6df2ce}));scene.add(marker);
const markerRing=new THREE.Mesh(new THREE.TorusGeometry(4,0.34,8,32),new THREE.MeshBasicMaterial({color:0x6df2ce}));markerRing.rotation.x=Math.PI/2;scene.add(markerRing);
const targets={overview:{position:new THREE.Vector3(190,155,225),look:new THREE.Vector3(0,25,15)}};
let cameraTween=null;
function moveCamera(pos,look){ cameraTween={fromPos:camera.position.clone(),toPos:pos.clone(),fromLook:controls.target.clone(),toLook:look.clone(),start:performance.now()}; }
function markerPosition(){const lvl=stadium.levels.find(l=>l.id===state.level);const angle=seatAngle(state.section);const r=state.level==='B1'?88:state.level==='L2'?114:state.level==='L4'?137:159;const height=(state.level==='B1'?9:state.level==='L2'?29:state.level==='L4'?45:62)+Math.min(state.row,35)*.33;
 return new THREE.Vector3(Math.sin(angle)*r,height,Math.cos(angle)*r+20);
}
function updateMarker(){const p=markerPosition();marker.position.copy(p);markerRing.position.set(p.x,p.y-.7,p.z);}
function cameraMode(mode){state.mode=mode; let pos,look;
 if(mode==='seat'){pos=markerPosition().clone().add(new THREE.Vector3(0,1.8,0));look=new THREE.Vector3(0,4,25);controls.minDistance=1;controls.maxDistance=500;controls.maxPolarAngle=Math.PI;}
 else if(mode==='behind'){pos=new THREE.Vector3(0,42,-145);look=new THREE.Vector3(0,3,29);}
 else if(mode==='outfield'){pos=new THREE.Vector3(0,34,171);look=new THREE.Vector3(0,6,13);}
 else{pos=new THREE.Vector3(190,155,225);look=new THREE.Vector3(0,25,15);}
 moveCamera(pos,look);$('view-title').textContent=mode==='seat'?`${state.level} · ${state.section} 區模擬視野`:mode==='behind'?'本壘後方':mode==='outfield'?'外野看台':'球場鳥瞰';$('view-subtitle').textContent=mode==='seat'?'ESTIMATED VIEW · NOT SURVEY ACCURATE':'DRAG TO EXPLORE · SCROLL TO ZOOM';
}
levelSelect.addEventListener('change',()=>{state.level=levelSelect.value;sectionOptions();updateMarker();if(state.mode==='seat')cameraMode('seat');});
sectionSelect.addEventListener('change',()=>{state.section=Number(sectionSelect.value);updateLabel();updateMarker();if(state.mode==='seat')cameraMode('seat');});
for(const id of ['row','seat']) $(id).addEventListener('input',()=>{state[id]=Math.min(40,Math.max(1,Number($(id).value)||1));updateLabel();updateMarker();if(state.mode==='seat')cameraMode('seat');});
$('seatview').onclick=()=>cameraMode('seat');$('overview').onclick=()=>cameraMode('overview');$('reset').onclick=()=>cameraMode('overview');$('home-view').onclick=()=>cameraMode('overview');$('behind-view').onclick=()=>cameraMode('behind');$('outfield-view').onclick=()=>cameraMode('outfield');
$('toggle-roof').onclick=()=>{roofGroup.visible=!roofGroup.visible;$('toggle-roof').classList.toggle('active',roofGroup.visible);};
// Click a deck to choose its closest angular section; stays in stadium-local data model.
const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2();let down=null;
renderer.domElement.addEventListener('pointerdown',e=>{down={x:e.clientX,y:e.clientY};});
renderer.domElement.addEventListener('pointerup',e=>{if(!down||Math.hypot(e.clientX-down.x,e.clientY-down.y)>7)return;down=null;let rect=renderer.domElement.getBoundingClientRect();pointer.set((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1);raycaster.setFromCamera(pointer,camera);let hits=raycaster.intersectObjects(sectionMeshes);if(!hits.length)return;let {deck,angle}=hits[0].object.userData;state.level=deck;levelSelect.value=deck;let l=stadium.levels.find(l=>l.id===deck);state.section=l.sections.reduce((best,n)=>Math.abs(angleDiff(seatAngle(n),angle))<Math.abs(angleDiff(seatAngle(best),angle))?n:best,l.sections[0]);sectionOptions();updateMarker();});
function angleDiff(a,b){return Math.atan2(Math.sin(a-b),Math.cos(a-b));}
updateMarker();
const resizeObserver=new ResizeObserver(()=>{const el=$('canvas'),w=el.clientWidth,h=el.clientHeight;if(w&&h){camera.aspect=w/h;camera.updateProjectionMatrix();renderer.setSize(w,h,false);}});resizeObserver.observe($('canvas'));
function animate(t){requestAnimationFrame(animate);if(cameraTween){let k=Math.min(1,(t-cameraTween.start)/850),ease=1-(1-k)**3;camera.position.lerpVectors(cameraTween.fromPos,cameraTween.toPos,ease);controls.target.lerpVectors(cameraTween.fromLook,cameraTween.toLook,ease);if(k===1) cameraTween=null;}controls.update();renderer.render(scene,camera);}requestAnimationFrame(animate);
