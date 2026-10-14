# FIELDVIEW 3D — Taipei Dome / Geometry Rebuild 0.2

An **independently created, non-official** 3D baseball-seat perspective viewer. The first ballpark is the Taipei Dome. This release completely replaces the V0.1 placeholder concentric-cylinder model with a geometry-based reconstruction.

## What is rebuilt

- Baseball field with a 90° foul-line diamond, base paths, mound, home plate, grass and warning track, and an **outfield-only** curved fence (not a 360° cylinder).
- Separate B1, L2, L3, L4, and L5 audience tiers with true angular **infield vs. outfield** sector topology; home plate is opposite the center-field scoreboard.
- Per-section stepped grandstands, fascia, aisles, guardrails, and ~20k physically separate **GPU-instanced chairs** (count shown by the viewer).
- Outfield scoreboard, vertical wall and internal architecture, and arched oval steel lattice ceiling with a cutaway for bird's-eye views.
- Rotate / pinch zoom / click sections; select level / section / approximate row / approximate seat; first-person look-around from the seat.
- Responsive interface, no login, no database, no paid API or embedded third-party 3D model.

## Reference sources

- [Taipei Dome's official section plan](https://www.farglorydome.com.tw/park-detail/map/): section IDs, relative layout, and infield/outfield bands.
- [Wei Chuan Dragons' Taipei Dome page](https://www.wdragons.com/taipei_dome/): ground-level context and stadium-specific views.
- Publicly available photographs of the inside of Taipei Dome: white/charcoal seat pattern, outfield video wall, spanning steel trusses.

**Important accuracy statement:** Real section IDs and sector order are based on the public plan. The 3D geometry is *independently reconstructed* from images and the floor plan, **not** the stadium's architectural CAD, photogrammetry or an original model from 3dome.tw. Elevations, chair dimensions, row counts, individual seat numbering and occlusion remain approximate. This is not yet a measured, seat-accurate representation; do not rely on it to purchase tickets. The 3dome.tw site itself describes its seat positions as simulated and possibly estimated. Do not copy proprietary assets from there.

## Repo layout

```
fieldview-3d/
├── .github/workflows/deploy-pages.yml
├── src/
│   ├── dome.js          # geometry: field, stands, architecture, steel roof
│   ├── stadiums.js      # section layout and camera position estimates
│   ├── main.js          # UI, camera, pointer handling
│   └── style.css
├── tests/stadium.test.js
├── index.html
├── package.json
├── vite.config.js
├── .gitignore
└── README.md
```

**Do not use `scr`**; the folder's name is `src`. There should be no extra nesting folder and no `node_modules` or `dist` in GitHub. Repository root contains `index.html`.

## Run locally

Requires Node.js 20.19+ or 22.12+.

```
npm install
npm test
npm run dev
npm run build
```

## Deploy GitHub Pages

1. Upload the extracted files keeping the relative folder names (especially `.github/workflows/deploy-pages.yml`, `src/dome.js`, `src/main.js` and `src/stadiums.js`).
2. In GitHub **Settings → Pages → Build and deployment**, set source to **GitHub Actions**.
3. A push to `main` triggers `.github/workflows/deploy-pages.yml`, which runs `npm install`, `npm test`, `npm run build`, and deploys `dist`.
4. Once Actions is green, visit `https://chen10eason-png.github.io/fieldview-3d/`.

**Vite base** is `/fieldview-3d/`. If the repository name changes, update this in `vite.config.js`.

## QA / future calibration priorities

- Visually compare from **113 / 12** behind home, **108** on first base side, **120** on third base side, **138** from outfield and **509** at high level, with real photographs.
- Measure angular section boundaries, exact rows and front-concourse geometry from an authorized survey / CAD plan if available.
- Verify court-to-seating depth, obstructed seats, entrances, handrails, protective netting and actual chair numbering rather than guessing.
- Benchmark on iPhone Safari before claiming production readiness.
