/**
 * FIELDVIEW 3D — Taipei Dome, topology-driven geometry v0.3.
 *
 * Coordinate frame: home plate (0, 0), +Z towards center field, +X towards
 * the first-base (102–112) side of the official seating map.
 *
 * Data behind the geometry:
 *  - Farglory's official seating map: shape, sequence and broad bowl footprint.
 *  - Taipei City Gov't: approximate 230m x 170m clear span, 68m inside height.
 *  - WBSC / public ballpark data: 400ft center, 335ft foul lines.
 *
 * Curves, row elevations, aisle positions and individual chair locations are
 * approximate reverse engineering, not surveyed seat coordinates.
 */
export const reference = Object.freeze({
  centerFieldM: 121.92,
  foulLineM: 102.11,
  roofClearSpanM: [170, 230],
  roofInsideHeightM: 68,
  sources: [
    'https://www.farglorydome.com.tw/park-detail/map/',
    'https://dome.gov.taipei/News_Content.aspx?n=809D227A1A9DB744&s=8CB6D52021B92DBE&sms=72544237BBE4C5F6',
    'https://www.obayashi.co.jp/works/detail/work_2800.html',
    'https://www.cna.com.tw/news/aspt/202311185005.aspx'
  ]
});

// These splines digitize the characteristic *U-shaped infield* and separate
// *outfield* stand shapes seen on the official top-down section diagram.
// The previous model's fully closed elliptical seating decks have been removed.
const infieldAnchors = [
  [-75,71],[-77,59],[-74,45],[-69,32],[-59,14],[-44,-3],[-28,-16],[-13,-22],
  [0,-24],[13,-22],[28,-16],[44,-3],[59,14],[69,32],[74,45],[77,59],[75,71]
];
const outfieldAnchors = [
  [-74,75],[-75,88],[-65,100],[-49,111],[-26,120],[0,124],
  [26,120],[49,111],[65,100],[75,88],[74,75]
];
const wallAnchors = [
  [-72.2,72.2],[-72,88],[-61,103],[-41,115],[-19,120],
  [0,121.92],[19,120],[41,115],[61,103],[72,88],[72.2,72.2]
];

/** Segment-wise Catmull–Rom with uniform control-point interpolation. */
function splineAt(points, fraction) {
  const v=Math.max(0,Math.min(1,Number(fraction)||0));
  const p=v*(points.length-1);let i=Math.min(Math.floor(p),points.length-2);
  const t=p-i,t2=t*t,t3=t2*t;
  let c=points[Math.max(0,i-1)],a=points[i],b=points[i+1],d=points[Math.min(points.length-1,i+2)];
  function interp(k){return .5*((2*a[k])+(-c[k]+b[k])*t+(2*c[k]-5*a[k]+4*b[k]-d[k])*t2+(-c[k]+3*a[k]-3*b[k]+d[k])*t3);}
  return {x:interp(0),z:interp(1)};
}
export function pathPoint(kind,t){return splineAt(kind==='outfield'?outfieldAnchors:kind==='wall'?wallAnchors:infieldAnchors,t);}
export function pathFrame(kind,t){
  const p=pathPoint(kind,t),lo=pathPoint(kind,Math.max(0,t-.0004)),hi=pathPoint(kind,Math.min(1,t+.0004));
  const dx=hi.x-lo.x,dz=hi.z-lo.z,len=Math.hypot(dx,dz)||1;
  // U: outside points behind home; OF: outside points beyond the wall.
  const orient=kind==='infield'?-1:1;
  return {x:p.x,z:p.z,tx:dx/len,tz:dz/len,nx:-orient*dz/len,nz:orient*dx/len};
}
const makeTier=(id,label,kind,first,last,front,rows,pitch,rise,elevation,t0=0,t1=1,reverse=false,widthScale=1)=>({
  id,label,kind,first,last,front,rows,pitch,rise,elevation,t0,t1,reverse,widthScale,
  side:kind==='infield'?'內野':'外野'
});

export const taipeiDome={
 id:'taipeiDome',name:'臺北大巨蛋',english:'TAIPEI DOME',
 tiers:[
  makeTier('IN1','內野下層 · 102–124','infield',102,124,0,14,.74,.47,4.3,0,1,true,.96),
  makeTier('OF1','外野下層 · 131–146','outfield',131,146,1.0,10,.60,.46,4.5,0,1,false,.95),
  makeTier('IN2','內野中層 · 201–225','infield',201,225,12,11,.78,.62,17.7,0,1,true,.83),
  makeTier('OF2','外野中層 · 233–244','outfield',233,244,7,10,.58,.61,16.6,0,1,false,.89),
  makeTier('VIP','內野包廂 · 301–317','infield',301,317,21.5,5,.70,.60,29.6,.16,.84,true,.82),
  makeTier('UP4','上層看台 · 401–417','infield',401,417,26,11,.72,.72,35.0,.13,.87,true,.77),
  makeTier('UP5','高層看台 · 503–515','infield',503,515,36,12,.70,.71,44.3,.22,.78,true,.76)
 ]
};
export function listSections(tier){return Array.from({length:tier.last-tier.first+1},(_,i)=>tier.first+i);}
export function sectionBounds(tier,section){
  let n=Number(section);if(!Number.isInteger(n)||n<tier.first||n>tier.last)return null;
  let a=(n-tier.first)/(tier.last-tier.first+1),b=(n-tier.first+1)/(tier.last-tier.first+1);
  if(tier.reverse)[a,b]=[1-b,1-a];
  return [tier.t0+(tier.t1-tier.t0)*a,tier.t0+(tier.t1-tier.t0)*b];
}
export function sectionCenter(tier,section){let b=sectionBounds(tier,section);return b?(b[0]+b[1])/2:null;}
export function tierPoint(tier,t,depth){
 const p=pathFrame(tier.kind,t),offset=tier.front+depth;
 return {x:(p.x+p.nx*offset)*tier.widthScale,z:p.z+p.nz*offset,y:tier.elevation+depth/tier.pitch*tier.rise,nx:p.nx,nz:p.nz,t};
}
export function approxSeatCount(tier,section,row=1){
 const b=sectionBounds(tier,section);if(!b)return 0;
 const d=Math.max(0,Math.min(tier.rows-1,Number(row)-1))*.75*tier.pitch;
 const p=tierPoint(tier,b[0],d),q=tierPoint(tier,b[1],d);
 return Math.min(28,Math.max(4,Math.floor(Math.hypot(q.x-p.x,q.z-p.z)/.82)));
}
export function seatPosition(tier,section,row=8,seat=8){
  const bounds=sectionBounds(tier,section);if(!bounds)return null;
  const r=Math.min(tier.rows,Math.max(1,Math.floor(Number(row)||1)))-1;
  const count=approxSeatCount(tier,section,r+1);
  const seatFraction=Math.max(.05,Math.min(.95,(Number(seat)-.5)/count));
  const t=bounds[0]+(bounds[1]-bounds[0])*(tier.reverse?1-seatFraction:seatFraction);
  const p=tierPoint(tier,t,(r+.5)*tier.pitch);
  return {...p,angle:Math.atan2(p.nx,p.nz),row:r+1};
}
export function sectionRegion(n){n=Number(n);return n>=131&&n<=146||n>=233&&n<=244?'外野':n>=301&&n<=317?'內野包廂':'內野';}
export function sectionSide(tier,n){
  const c=sectionCenter(tier,n);if(c===null)return '';
  if(tier.kind==='outfield')return Math.abs(c-.5)<.18?'中外野':c<.5?'左外野':'右外野';
  const p=pathPoint('infield',c);
  if(Math.abs(p.x)<23)return '本壘後方';
  return p.x>0?'一壘側':'三壘側';
}
