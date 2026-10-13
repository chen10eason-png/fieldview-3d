// Stadium-specific data is deliberately separated from the rendering engine.
// Section positions are estimates for V1, not surveyed stadium geometry.
export const stadiums = {
  taipeiDome: {
    id: 'taipeiDome', name: '臺北大巨蛋', en: 'TAIPEI DOME', city: '臺北市 · 信義區',
    levels: [
      { id: 'B1', label: 'B1 下層', prefix: 100, sections: [...range(102,124), ...range(131,137), ...range(140,146)], radius: 77, height: 7.0, rise: 15 },
      { id: 'L2', label: 'L2 中層', prefix: 200, sections: [...range(202,224), ...range(233,237), ...range(240,244)], radius: 90, height: 24, rise: 10 },
      { id: 'L3', label: 'L3 包廂層（概念）', prefix: 300, sections: [], radius: 104, height: 34, rise: 5 },
      { id: 'L4', label: 'L4 上層', prefix: 400, sections: [...range(401,408), ...range(410,417)], radius: 113, height: 43, rise: 13 },
      { id: 'L5', label: 'L5 高層', prefix: 500, sections: [...range(503,515)], radius: 125, height: 58, rise: 13 },
    ],
  },
};
function range(a,b) { return Array.from({length:b-a+1}, (_,i)=>a+i); }
// Home-plate-side stands are at -Z; +Z points toward the outfield.
export function seatAngle(section) {
  const n = Number(section);
  if (n>=102 && n<=124) return Math.PI/2 + (n-102)/22*Math.PI;
  if (n>=202 && n<=224) return Math.PI/2 + (n-202)/22*Math.PI;
  if (n>=401 && n<=408) return Math.PI/2 + (n-401)/16*Math.PI;
  if (n>=410 && n<=417) return Math.PI+(n-410)/16*Math.PI/2;
  if (n>=503 && n<=515) return Math.PI/2 + (n-503)/12*Math.PI;
  if (n>=131 && n<=137) return Math.PI/2+(n-131)/6*Math.PI/2;
  if (n>=140 && n<=146) return Math.PI+(n-140)/6*Math.PI/2;
  if (n>=233 && n<=237) return Math.PI/2+(n-233)/4*Math.PI/2;
  if (n>=240 && n<=244) return Math.PI+(n-240)/4*Math.PI/2;
  return 0;
}
