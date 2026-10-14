// FIELDVIEW 3D / Taipei Dome section topology.
// Section IDENTITIES & ordering are traced from the public Taipei Dome seating map.
// Distances, elevation, rows and individual chair geometry are estimates, NOT survey data.
const degrees = d => d * Math.PI / 180;

const bands = (...groups) => groups.map(([first, last, startDeg, endDeg]) => ({
  first, last, start: degrees(startDeg), end: degrees(endDeg)
}));

export const taipeiDome = {
  id: 'taipei-dome',
  name: '臺北大巨蛋',
  subtitle: 'TAIPEI DOME · BASEBALL',
  coordinateConvention: '+X = first-base side; -X = third-base side; +Z = center field',
  sources: [
    'https://www.farglorydome.com.tw/park-detail/map/',
    'https://www.wdragons.com/taipei_dome/'
  ],
  // Perspective approximation in meters. Orientation of every section follows public floor plan.
  tiers: [
    { id: 'B1', label: 'B1 下層看台', rx: 83, rz: 82, centerZ: 16, floor: 5, rows: 20, pitch: 1.50, rise: 0.57,
      bands: bands([102, 124, 90, 270], [131, 146, -90, 90]) },
    { id: 'L2', label: 'L2 中層看台', rx: 115, rz: 111, centerZ: 16, floor: 24, rows: 12, pitch: 1.63, rise: 0.65,
      bands: bands([201, 225, 90, 270], [233, 244, -90, 90]) },
    { id: 'L3', label: 'L3 包廂層', rx: 137, rz: 132, centerZ: 16, floor: 36.5, rows: 5, pitch: 1.56, rise: 0.55,
      bands: bands([301, 317, 90, 270]) },
    { id: 'L4', label: 'L4 上層看台', rx: 149, rz: 145, centerZ: 16, floor: 46, rows: 14, pitch: 1.62, rise: 0.70,
      bands: bands([401, 417, 90, 270]) },
    { id: 'L5', label: 'L5 高層看台', rx: 175, rz: 168, centerZ: 16, floor: 61.5, rows: 12, pitch: 1.58, rise: 0.72,
      bands: bands([503, 515, 90, 270]) }
  ]
};

export function listSections(tier) {
  return tier.bands.flatMap(b => Array.from({length:b.last-b.first+1}, (_,i)=>b.first+i));
}

export function sectionBounds(tier, section) {
  const n=Number(section);
  const band=tier.bands.find(b=>n>=b.first && n<=b.last);
  if(!band) return null;
  const fraction=(n-band.first)/(band.last-band.first+1);
  const fractionEnd=(n-band.first+1)/(band.last-band.first+1);
  return [band.start+(band.end-band.start)*fraction,band.start+(band.end-band.start)*fractionEnd];
}

export function sectionCenter(tier, section) {
  const b=sectionBounds(tier,section);
  return b?(b[0]+b[1])/2:null;
}

export function seatPosition(tier, section, row=8, seat=8) {
  const bounds=sectionBounds(tier,section);
  if (!bounds) return null;
  // Approximate seat numbering within each wedge. Actual row counts and number order vary.
  const rowIndex=Math.min(tier.rows-1,Math.max(0,Number(row)-1));
  const rad=tier.rx+(rowIndex+0.5)*tier.pitch;
  const depth=tier.rz+(rowIndex+0.5)*tier.pitch;
  const angle=bounds[0]+(bounds[1]-bounds[0])*Math.max(0.06,Math.min(0.94,(Number(seat)-0.5)/22));
  return { x:rad*Math.sin(angle), y:tier.floor+rowIndex*tier.rise+1.55,
    z:tier.centerZ+depth*Math.cos(angle),angle,row:rowIndex+1 };
}

export function sectionRegion(number) {
  const n=Number(number);
  if ((n>=131&&n<=146)||(n>=233&&n<=244)) return '外野';
  if (n>=301&&n<=317) return '內野包廂';
  if (n>=503&&n<=515) return '內野高層';
  return '內野';
}

export function sectionSide(tier,section) {
  const a=sectionCenter(tier,section);
  if(a===null) return '';
  const x=Math.sin(a),z=Math.cos(a);
  if(z<-.8) return '本壘後方';
  if(z>.72) return '中外野';
  return x>.15?'一壘側':x<-.15?'三壘側':'本壘附近';
}
