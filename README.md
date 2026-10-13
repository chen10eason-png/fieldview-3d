# FIELDVIEW 3D — Taiwan Ballparks

An original, independent 3D ballpark viewing prototype. V1 covers **Taipei Dome baseball** only.

## Features
- Interactive Three.js stadium: orbit, pan, zoom, reset
- Baseball field, infield, four seating decks and partial roof / structural outline
- Select B1 / L2 / L4 / L5, section, row, seat (L3 reserved as conceptual / non-selectable)
- Approximate seat-level view; outfield and behind-home camera presets
- Clickable approximate seating decks; responsive mobile controls
- No account, no API, no server or database

## Quick start
```bash
npm install
npm run dev
```

## Deploy to Cloudflare Pages
1. Create a new GitHub repository and push these source files.
2. In Cloudflare Dashboard → Workers & Pages → Create → Pages → Connect to Git.
3. Select your repository; framework preset **Vite**; build command `npm run build`; output directory `dist`.
4. Deploy (preview first). Alternatively use `npm run build` and upload `dist` as static assets.

## Accuracy and limitations
**This is an estimated concept model, NOT an accurate digital twin or official seat map.**
The dome envelope, stadium tiers, exact sector positioning, row heights, seat pitch, sightline obstructions, roof and scoreboard are approximations. Row/seat values move the camera approximately; exact seat coordinates have not been calibrated. Section sets derive from public ticketing examples and may differ by event. L3 is intentionally unavailable until official section and seating records can be checked. Never imply ticket price, open seating, visibility or section mapping is definitive.

When adding venues, extend `src/stadiums.js`, then isolate per-venue scene builder and camera transforms. Avoid copying artwork, code or assets from other seat-view services.

The site currently sets `noindex,nofollow`; remove only when public launch is intended.
