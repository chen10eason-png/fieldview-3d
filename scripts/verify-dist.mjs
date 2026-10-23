// Guard against accidentally publishing the raw ES module `import 'three'`.
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { resolve, join } from 'node:path';

const dist = resolve('dist');
const htmlPath = join(dist, 'index.html');
if (!existsSync(htmlPath)) throw new Error('Missing dist/index.html: run npm run build first.');
const html = readFileSync(htmlPath, 'utf8');
const jsMatches = [...html.matchAll(/<script\b[^>]*\btype=["']module["'][^>]*\bsrc=["']([^"']+)["']/g)];
if (jsMatches.length !== 1) throw new Error(`Expected one bundled module script, found ${jsMatches.length}.`);
const moduleSrc = jsMatches[0][1];
if (!/^\.\/assets\/[^"'<>]+\.js(?:\?[^"']+)?$/.test(moduleSrc)) {
  throw new Error(`Wrong entrypoint ${moduleSrc}; expected ./assets/<hash>.js`);
}
if (/src\/main\.js|\/fieldview-3d\/assets\//.test(html)) {
  throw new Error('Raw source or old hard-coded GitHub Pages base detected.');
}
const bundlePath = resolve(dist, moduleSrc.split('?')[0]);
if (!bundlePath.startsWith(dist + '/') || !existsSync(bundlePath)) {
  throw new Error(`Missing module file referenced by HTML: ${moduleSrc}`);
}
const bundle = readFileSync(bundlePath, 'utf8');
if (/\bfrom\s*['"]three['"]|\bimport\s*\(\s*['"]three['"]\s*\)/.test(bundle)) {
  throw new Error('Three.js was not bundled: browser cannot resolve bare "three".');
}
const assets = readdirSync(join(dist, 'assets'));
if (!assets.some(name => name.endsWith('.css'))) {
  throw new Error('Missing compiled stylesheet.');
}
if (!existsSync(join(dist, '.nojekyll'))) {
  throw new Error('Missing dist/.nojekyll (copy from public).');
}
console.log(`PASS: ${moduleSrc} (${(bundle.length/1024).toFixed(0)} KiB)`);
console.log(`PASS: ${assets.length} compiled asset files, relative paths, .nojekyll`);
