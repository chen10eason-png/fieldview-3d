# FIELDVIEW 3D V0.4 — 測試紀錄

測試日期：2026-10-23；Node.js 22.16.0。

## 已通過

- `npm test`：**13 / 13**，分區相對方向、座位幾何、屋頂包絡、座位估算、部署與 V0.4 功能的靜態回歸檢查。
- `node --check`：`src/`、`tests/`、`scripts/`、`vite.config.js` 中所有 JavaScript 檔案語法通過。
- `scripts/verify-dist.mjs` 正向測試：以模擬的 Vite 產物驗證相對資源路徑、JS/CSS 和 `.nojekyll`。
- `scripts/verify-dist.mjs` 反向測試：刻意將產物入口換成 `./src/main.js`，程式會正確拒絕並中止。
- ZIP 根目錄內容與目錄層次核對；不帶舊 Repository Jekyll workflow。

## 尚未實際完成

- **正式 `npm install && npm run build`**：本執行環境無法連線 npm 套件庫，且沒有快取 `three` / `vite`。GitHub Actions 將在上傳新 Repository 後自動執行安裝、13 項測試、建置與 `verify:dist`。
- **iPhone Safari 3D 畫面與效能實測**：需新網站發布後開啟驗證。Node.js 幾何與語法測試不能替代 WebGL 真機測試。
- **逐座實際遮蔽精度**：沒有現場測繪資料，不應聲稱為官方精準視線。

## GitHub 上線後驗收

1. Actions 出現 **Build and Deploy FIELDVIEW 3D** 綠色勾勾。
2. 網址開啟應顯示 3D 模型而非 `Module name 'three' does not resolve`。
3. 檢查鳥瞰、本壘後方、一壘側、外野、屋頂外觀五種模式。
4. 測試 A/B 座位切換、廣角／標準／望遠切換、iPhone 拖曳與縮放。
5. 用公開照片比較模型，明確紀錄不符之處再調整。
