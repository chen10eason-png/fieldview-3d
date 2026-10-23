import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { taipeiDome, seatPosition, sectionBounds } from '../src/stadiums.js';

const read = path => readFileSync(resolve(path), 'utf8');

test('new repository Vite base uses relative asset paths', () => {
  const config=read('vite.config.js');
  assert.match(config, /base:\s*['"]\.\/['"]/);
  assert.doesNotMatch(config, /base:\s*['"]\/fieldview-3d\//);
});

test('only one Pages deployment workflow and .nojekyll present', () => {
  const flow=read('.github/workflows/deploy-pages.yml');
  assert.match(flow, /npm run verify:dist/);
  assert.match(flow, /upload-pages-artifact@v3/);
  assert.match(flow, /deploy-pages@v4/);
  assert.doesNotMatch(flow, /jekyll-build-pages/);
  assert(existsSync('public/.nojekyll'));
});

test('seat view includes A/B comparison, lens FOV, and simulated-geometry disclaimer', () => {
  const main=read('src/main.js');
  const html=read('index.html');
  for(const id of ['remember-a','remember-b','recall-a','recall-b','go-seat']){
    assert(main.includes(id), `missing seat control ${id}`);
  }
  for(const angle of ['72','55','36']) assert(main.includes(`data-lens="${angle}"`));
  assert.match(main, /window\.__fieldviewBooted = true/);
  assert.match(main, /不能據此判定實際遮蔽/);
  assert.match(html, /src="\.\/src\/main\.js"/);
});

test('front rails and simulated overhang are in 3D model; without copying remote assets', () => {
  const dome=read('src/dome.js');
  assert.match(dome, /function addSafetyRails/);
  assert.match(dome, /addSafetyRails\(group,tier\)/);
  assert.match(dome, /soffitFront/);
  assert.match(dome, /scr\.rotation\.y=Math\.PI/);
  assert.doesNotMatch(dome, /baseballviews\.com/);
});

test('all section endpoints have finite valid estimated viewing coordinates',()=>{
  for(const tier of taipeiDome.tiers){
    for(const section of [tier.first,tier.last]){
      assert(sectionBounds(tier,section));
      for(const row of [1,tier.rows]){
        const p=seatPosition(tier,section,row,1);
        assert([p.x,p.y,p.z,p.nx,p.nz].every(Number.isFinite));
        assert(p.y > 0 && p.y < 70);
      }
    }
  }
});
