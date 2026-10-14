import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {taipeiDome,listSections,sectionBounds,seatPosition,sectionSide,sectionRegion} from './stadiums.js';
import {buildTaipeiDome} from './dome.js';
import './style.css';

const state={level:'B1',section:113,row:12,seat:8,mode:'overview',roof:false,loading:true};
const saved=new URLSearchParams(window.location.search);
if(taipeiDome.tiers.some(t=>t.id===saved.get('level')))state.level=saved.get('level');
const initialTier=taipeiDome.tiers.find(t=>t.id===state.level);
if(listSections(initialTier).includes(Number(saved.get('section'))))state.section=Number(saved.get('section'));
if(saved.has('row'))state.row=Math.max(1,Math.min(40,Number(saved.get('row'))||12));
if(saved.has('seat'))state.seat=Math.max(1,Math.min(60,Number(saved.get('seat'))||8));

const root=document.getElementById('app');
root.innerHTML=`
<header class="header"><a class="logo" href="./" aria-label="FIELDVIEW 3D 首頁"><span class="logo-icon">◈</span><span>FIELDVIEW<span class="logo-3d">3D</span><small>TAIWAN BALLPARK PROJECT</small></span></a><div class="header-right"><span class="location-pill"><span class="dot"></span> TAIPEI DOME</span><span class="version">REBUILD 0.2</span></div></header>
<main class="shell">
  <section class="controls-panel" aria-label="座位選擇">
    <span class="kicker"><span class="kicker-rule"></span> BALLPARK 01 / TAIPEI</span>
    <h1>從你的座位，<br/><span>看見整座大巨蛋。</span></h1>
    <p class="lede">依臺北大巨蛋公開座位配置重新建模。旋轉球場、選擇看台區域，再切換成觀眾視角。</p>
    <div class="venue"><div class="venue-icon">◉</div><div><strong>臺北大巨蛋</strong><span>TAIPEI DOME · BASEBALL ONLY</span></div><b>01 / 01</b></div>
    <div class="panel-divider"><span>選擇你的座位</span><small>FIND YOUR VIEW</small></div>
    <div class="control-grid">
     <label class="field level-field"><span>樓層 <small>LEVEL</small></span><select id="level"></select></label>
     <label class="field section-field"><span>看台區 <small>SECTION</small></span><select id="section"></select></label>
     <label class="field"><span>排 <small>ROW · 估算</small></span><input id="row" type="number" min="1" max="40" inputmode="numeric" value="12"/></label>
     <label class="field"><span>座號 <small>SEAT · 估算</small></span><input id="seat" type="number" min="1" max="60" inputmode="numeric" value="8"/></label>
    </div>
    <div class="section-context"><span class="context-dot"></span><span id="section-description">本壘後方 · 內野</span><span id="section-position">B1-113</span></div>
    <button id="go-seat" class="action-primary">進入座位視角 <span>↗</span></button>
    <button id="go-bowl" class="action-outline">↺ 返回球場鳥瞰</button>
    <div class="disclaimer"><b>幾何精度說明</b>分區編號與相對方向參考公開座位圖；階高、排距和座號是視覺重建估算，並非實測或官方 3D CAD，不可直接用來判斷遮蔽或購票。</div>
    <div class="controls-foot"><span>INDEPENDENT 3D STUDY</span><span>臺灣其他棒球場將陸續加入 ↗</span></div>
  </section>
  <section class="explore-panel" aria-label="臺北大巨蛋 3D 模型">
    <div class="explore-heading"><div><span class="kicker">THE STADIUM / 01</span><h2>TAIPEI <em>DOME</em><span class="title-dot">.</span></h2></div><span class="overview-type">ARCHITECTURAL RECONSTRUCTION<br/>NON-OFFICIAL · BASEBALL</span></div>
    <div class="viewer" id="viewer">
      <div class="canvas-container" id="canvas-container"></div>
      <div class="viewer-vignette"></div>
      <div class="viewer-top"><div class="scene-status"><span class="dot"></span><span id="mode-label">球場總覽 / OVERVIEW</span></div><div class="toolbar"><button id="roof-toggle" title="顯示或隱藏大巨蛋屋頂鋼架">屋頂鋼架 <span id="roof-flag">OFF</span></button><button id="camera-reset" title="返回預設視角">↺ 重設</button></div></div>
      <div class="mini-map" id="mini-map"><span>HOME<br/>PLATE</span><i>⌃</i><small>CF</small></div>
      <div class="loading" id="loading"><div class="loading-spinner"></div><span>正在建立球場 3D 幾何…</span><small>INSTANCED STANDS · ROOF TRUSSES · FIELD</small></div>
      <div class="viewer-bottom"><div class="viewer-caption"><div class="caption-kicker">FIELDVIEW / TAIPEI DOME</div><strong id="view-title">完整球場 · 俯瞰視角</strong><span id="view-info">拖曳旋轉 · 雙指縮放 · 點選看台</span></div><div class="model-meta"><div><span>SECTIONS</span><b>REAL MAP ORDER</b></div><div><span>CHAIRS</span><b id="chair-count">—</b></div></div></div>
    </div>
    <div class="quick-links"><button class="view-button selected" id="view-overview"><span>01</span> 球場全景</button><button class="view-button" id="view-plate"><span>02</span> 本壘後方</button><button class="view-button" id="view-first"><span>03</span> 一壘側</button><button class="view-button" id="view-outfield"><span>04</span> 外野看台</button></div>
    <div class="info-row"><div class="current"><span class="current-icon">⌖</span><div><small>目前選擇 · SELECTED LOCATION</small><strong id="seat-summary">B1 · 113 區 · 12 排 · 8 號</strong></div></div><div class="model-alert"><span class="dot dim"></span> VISUAL RECONSTRUCTION · ESTIMATED ELEVATIONS</div></div>
  </section>
</main><footer class="footer"><span>© FIELDVIEW 3D · TAIPEI DOME STUDY</span><span>座位分區：<a href="https://www.farglorydome.com.tw/park-detail/map/" target="_blank" rel="noopener noreferrer">官方平面圖 ↗</a> &nbsp;|&nbsp; 非官方獨立重建</span></footer>`;

const $=id=>document.getElementById(id);
const level=$('level'),section=$('section');
for (const t of taipeiDome.tiers) level.add(new Option(t.label,t.id));
level.value=state.level;
$('row').value=String(state.row);$('seat').value=String(state.seat);

function updateUI(){
 const t=taipeiDome.tiers.find(t=>t.id===state.level);
 if(!listSections(t).includes(Number(state.section)))state.section=listSections(t)[0];
 section.innerHTML='';for(const n of listSections(t))section.add(new Option(`${n} 區 · ${sectionSide(t,n)}`,n));
 section.value=String(state.section);
 $('section-description').textContent=`${sectionSide(t,state.section)} · ${sectionRegion(state.section)}`;
 $('section-position').textContent=`${state.level}–${state.section}`;
 $('seat-summary').textContent=`${state.level} · ${state.section} 區 · ${state.row} 排 · ${state.seat} 號`;
 let share=new URL(window.location.href);share.searchParams.set('level',state.level);share.searchParams.set('section',state.section);
 share.searchParams.set('row',state.row);share.searchParams.set('seat',state.seat);
 window.history.replaceState(null,'',share);
}
updateUI();

const scene=new THREE.Scene();scene.background=new THREE.Color(0x162329);
scene.fog=new THREE.FogExp2(0x162329,.00038);
const camera=new THREE.PerspectiveCamera(47,1,.18,1600);
const renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.65));
renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure=1.45;
renderer.shadowMap.enabled=false; // seat geometry + mesh count favor mobile performance
$('canvas-container').appendChild(renderer.domElement);
const controls=new OrbitControls(camera,renderer.domElement);
controls.enableDamping=true;controls.dampingFactor=.085;controls.enablePan=false;
controls.minDistance=30;controls.maxDistance=530;controls.minPolarAngle=.1;controls.maxPolarAngle=Math.PI*.78;
const sky=new THREE.HemisphereLight(0xdaeaf4,0x647474,3.05);scene.add(sky);
const key=new THREE.DirectionalLight(0xe4f2f2,3.15);key.position.set(-72,150,-45);scene.add(key);
const fill=new THREE.DirectionalLight(0xb8d6c9,1.55);fill.position.set(75,115,125);scene.add(fill);

let dome;
try {
 dome=buildTaipeiDome(scene);
 $('loading').classList.add('hidden');
 $('chair-count').textContent=new Intl.NumberFormat('en-US').format(dome.chairs);
} catch(error){
 console.error('[FIELDVIEW] 3D scene build failed:',error);
 $('loading').innerHTML='<strong>3D 場景載入失敗</strong><p>請重新整理頁面，或使用較新的 Safari / Chrome。</p>';
 throw error;
}
function mark(){dome.select(state.level,state.section,state.row,state.seat);}
mark();

const presets={
 overview:{eye:[194,166,-215],look:[0,27,18],heading:'球場全景 · 俯瞰視角',mode:'球場總覽 / OVERVIEW'},
 plate:{eye:[0,45,-135],look:[0,9,10],heading:'本壘後方 · 看向中外野',mode:'本壘後方 / HOME PLATE'},
 first:{eye:[131,41,-43],look:[0,6,5],heading:'一壘側 · 沿著內野',mode:'一壘側 / FIRST BASE'},
 outfield:{eye:[0,31,141],look:[0,8,-29],heading:'中外野 · 看向本壘',mode:'外野 / CENTER FIELD'}
};
camera.position.set(...presets.overview.eye);controls.target.set(...presets.overview.look);camera.lookAt(controls.target);
let tween=null,yaw=0,pitch=0,mouseDown=null;
function toggleRoof(yes){state.roof=yes;dome.roof.visible=yes;dome.roofCutaway.visible=!yes;$('roof-flag').textContent=yes?'ON':'OFF';$('roof-toggle').classList.toggle('on',yes);}
function setButtons(key){document.querySelectorAll('.view-button').forEach(el=>el.classList.toggle('selected',el.id===`view-${key}`));}
function move(mode){
 state.mode=mode;
 let eye,target,title,modeLabel;
 if(mode==='seat') {
   const tier=taipeiDome.tiers.find(t=>t.id===state.level);
   const p=seatPosition(tier,state.section,state.row,state.seat);
   const radiusOffset=0.23;
   eye=V(p.x-Math.sin(p.angle)*radiusOffset,p.y,p.z-Math.cos(p.angle)*radiusOffset);
   target=V(0,3,-18);
   title=`${state.level} · ${state.section} 區｜座位模擬`;
   modeLabel='FIRST-PERSON / SEAT VIEW';
   toggleRoof(true);
   dome.marker.visible=false;
   setButtons('none');
 }else{
   const preset=presets[mode];eye=V(...preset.eye);target=V(...preset.look);title=preset.heading;modeLabel=preset.mode;
   if(mode==='overview')toggleRoof(false);else toggleRoof(true);
   dome.marker.visible=true;
   setButtons(mode);
 }
 $('mode-label').textContent=modeLabel;$('view-title').textContent=title;
 $('view-info').textContent=mode==='seat'?'拖曳四周環視 · 座位高度為估算':'拖曳旋轉 · 雙指縮放 · 點選看台';
 controls.enabled=false;
 const lookMatrix=new THREE.Matrix4().lookAt(eye,target,V(0,1,0));const quaternion=new THREE.Quaternion().setFromRotationMatrix(lookMatrix);
 tween={fromEye:camera.position.clone(),toEye:eye,fromQuat:camera.quaternion.clone(),toQuat:quaternion,target,mode,start:performance.now()};
}
function updateSeat(){updateUI();mark();if(state.mode==='seat')move('seat');}
level.onchange=()=>{state.level=level.value;state.section=listSections(taipeiDome.tiers.find(t=>t.id===state.level))[0];updateSeat();};
section.onchange=()=>{state.section=Number(section.value);updateSeat();};
for(const id of ['row','seat'])$(id).onchange=()=>{
 const el=$(id);const max=id==='row'?40:60;
 state[id]=Math.min(max,Math.max(1,Math.floor(Number(el.value)||1)));el.value=state[id];updateSeat();
};
$('go-seat').onclick=()=>move('seat');$('go-bowl').onclick=()=>move('overview');
$('view-overview').onclick=()=>move('overview');$('view-plate').onclick=()=>move('plate');
$('view-first').onclick=()=>move('first');$('view-outfield').onclick=()=>move('outfield');
$('camera-reset').onclick=()=>move('overview');$('roof-toggle').onclick=()=>toggleRoof(!state.roof);

// Hit-test the *actual sector meshes* instead of picking the nearest guessed angle.
const raycaster=new THREE.Raycaster(),mouse=new THREE.Vector2();
const canvas=renderer.domElement;
canvas.addEventListener('pointerdown',e=>{mouseDown={x:e.clientX,y:e.clientY,pointerId:e.pointerId};});
canvas.addEventListener('pointermove',e=>{
 if(!mouseDown||state.mode!=='seat'||tween)return;
 if(e.pointerId!==mouseDown.pointerId)return;
 const dx=e.clientX-mouseDown.x,dy=e.clientY-mouseDown.y;
 yaw-=dx*.004;pitch-=dy*.004;
 pitch=Math.min(1.42,Math.max(-1.42,pitch));
 camera.rotation.order='YXZ';camera.rotation.set(pitch,yaw,0,'YXZ');
 mouseDown.x=e.clientX;mouseDown.y=e.clientY;
});
canvas.addEventListener('pointerup',e=>{
 if(!mouseDown)return;
 const offset=Math.hypot(e.clientX-mouseDown.x,e.clientY-mouseDown.y);
 // Seat mode uses drag-look; just clear the pointer.
 if(state.mode==='seat'){mouseDown=null;return;}
 mouseDown=null;
 if(offset>7)return;
 const b=canvas.getBoundingClientRect();mouse.set((e.clientX-b.left)/b.width*2-1,-(e.clientY-b.top)/b.height*2+1);
 raycaster.setFromCamera(mouse,camera);
 const hits=raycaster.intersectObjects(dome.hitMeshes,false);
 if(!hits.length)return;
 const obj=hits[0].object.userData;
 state.level=obj.tier;state.section=obj.section;level.value=state.level;
 updateSeat();
});
canvas.addEventListener('pointercancel',()=>{mouseDown=null;});
window.addEventListener('keydown',e=>{if(e.key==='Escape'&&state.mode==='seat')move('overview');});

let width=0,height=0;
function resize(){
 const container=$('canvas-container'),w=container.clientWidth,h=container.clientHeight;
 if(!w||!h||w===width&&h===height)return;
 width=w;height=h;camera.aspect=w/h;camera.updateProjectionMatrix();renderer.setSize(w,h,false);
}
new ResizeObserver(resize).observe($('canvas-container'));resize();
function render(t){
 requestAnimationFrame(render);
 if(tween){
  const fraction=Math.min(1,(t-tween.start)/950),p=1-(1-fraction)**3;
  camera.position.lerpVectors(tween.fromEye,tween.toEye,p);
  camera.quaternion.copy(tween.fromQuat).slerp(tween.toQuat,p);
  if(fraction===1){
    if(tween.mode==='seat'){
      const euler=new THREE.Euler().setFromQuaternion(camera.quaternion,'YXZ');yaw=euler.y;pitch=euler.x;
      camera.rotation.order='YXZ';
    }else{controls.target.copy(tween.target);controls.enabled=true;controls.update();}
    tween=null;
  }
 }else if(state.mode!=='seat')controls.update();
 if(state.mode!=='seat'&&dome.marker.visible){
  dome.marker.rotation.y+=.004;
  dome.marker.children[0].scale.setScalar(1+.10*Math.sin(t*.002));
 }
 renderer.render(scene,camera);
}
requestAnimationFrame(render);
