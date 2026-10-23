# FIELDVIEW 3D — 臺北大巨蛋 V0.4

> **完整新 Repository 版本**。原創 Three.js 幾何模型，參考臺北大巨蛋公開座位配置與實景，並借鑑 BaseballViews 的「座位視角優先」操作理念；**沒有複製 BaseballViews 的程式或素材**。

## 主要功能

- 3D 球場總覽、球場本壘／一壘側／外野／屋頂外觀等預設攝影機位置。
- 依看台層級選擇區、排、座號；點擊 3D 看台也可選區。
- 模擬座位第一人稱視角，能拖曳環視，以及廣角／標準／望遠鏡頭切換。
- 暫存座位 A 與座位 B，反覆切換比較（只在目前網頁開啟期間有效）。
- V0.4 新增各層前緣護欄、欄柱、B1 後排上方估算底板，並調整場內大螢幕正反面。
- iPhone / iPad Safari 響應式版型、椅子 InstancedMesh 最佳化、WebGL 低功耗回退。
- 一套 GitHub Actions：跑測試、Vite 打包、檢查編譯輸出、部署到 GitHub Pages。

### 精度限制（務必閱讀）

**這不是官方 3D 渲染，也不是逐座實測視線資料。** 看台弧度、排距、座位、欄杆、底板、鏡頭 FOV 等仍有估算；它不能直接用來判定視野遮蔽或購票好壞。官方分區、實地照片及可靠實測資料優先。

## 建立全新的 GitHub Repository（一次設定）

1. GitHub → **New repository**，名稱自由，例如 `fieldview-dome`。建議 **Public**（GitHub Pages 最容易使用）。
2. **不要**勾選自動產生 README、.gitignore 或任何模板，避免與此專案檔案衝突。
3. 解壓縮 `FIELDVIEW-3D-V0.4-NEW-REPOSITORY.zip`，**將 ZIP 裡的所有檔案與資料夾上傳到 Repository 根目錄**，包含隱藏資料夾 `.github`。不要把 ZIP 當作單一檔案上傳，也不要多包一層資料夾。
4. GitHub → **Settings → Pages → Build and deployment → Source**，選 **GitHub Actions**。
5. GitHub → **Actions → Build and Deploy FIELDVIEW 3D**，確定綠色勾勾；如果第一次設定 Pages 時執行失敗，可在選好 `GitHub Actions` 後點 **Re-run all jobs**。
6. 正式網址會是 `https://你的GitHub帳號.github.io/你的Repository名稱/`。可從 GitHub Settings → Pages 直接點 **Visit site**。

**重要：** 新 Repo 僅包含 `.github/workflows/deploy-pages.yml` 一套發布流程；不要複製舊 Repo 的 Jekyll 工作流程，也不要啟用 `Deploy from a branch`。這正是之前 `Module name 'three' does not resolve` 的主要問題。

### iPad / iPhone 上傳提醒

GitHub 的網站**不會自動解壓 ZIP**。請先在「檔案」App 解壓縮；上傳的是解壓縮後的文件結構（尤其 `.github/workflows/deploy-pages.yml`），不是 ZIP 本身。如果 Safari 無法整個資料夾上傳，可改用桌面電腦、GitHub Desktop，或建立 Repo 後請具有寫入權限的連線協助推送。

## 目錄

```text
.github/workflows/deploy-pages.yml    # 唯一的 GitHub Pages 發布流程
public/.nojekyll                      # 避免 Pages 套用 Jekyll
scripts/verify-dist.mjs              # 阻止發布未編譯的 three 模組
src/main.js                         # 互動、3D 相機與選位
src/dome.js                         # 球場、看台、椅子、鋼構與護欄
src/stadiums.js                     # 分區、估算座位座標、球場尺寸
src/style.css                       # 響應式 UI
tests/stadium.test.js               # 幾何邊界回歸測試
tests/v04.test.js                   # V0.4 與部署預防回歸測試
index.html                          # Vite HTML 入口與啟動錯誤提示
vite.config.js                      # base: ./ (任意新 Repo 名稱都能使用)
package.json                        # Node 套件與指令
README.md                           # 本說明
```

`node_modules/` 與 `dist/` 都是自動產生的產物，**不需要放在 ZIP**，GitHub Actions 會自行安裝及建置。

## 本機測試與驗證

需要 Node.js 22+。

```bash
npm install
npm test
npm run build
npm run verify:dist
npm run dev
```

`verify:dist` 嚴格檢查 `dist/index.html` 的入口必須是 `./assets/*.js`、可找到編譯 JS/CSS、不能殘留原始 `src/main.js` 或裸 `three` import、並有 `.nojekyll`。

完整 iPhone Safari **實機 3D 畫面驗收仍需部署後在手機瀏覽器執行**；本機 Node 幾何測試不能代替手機 WebGL 畫面測試。

## 實景對照參考

- 官方臺北大巨蛋看台配置：<https://www.farglorydome.com.tw/park-detail/map/>
- 臺北市政府場館資料：<https://dome.gov.taipei/>
- 大林組大巨蛋建築工程：<https://www.obayashi.co.jp/works/detail/work_2800.html>
- WBSC 2024 臺北大巨蛋球賽照片：<https://www.wbsc.org/en/news/cpbl-opens-2024-season-in-taipei-dome>
- 座位視角互動設計參考：<https://baseballviews.com/>

下階段應優先用實拍對照 **113 本壘後方、108 一壘側、118 三壘側、138 中外野、509 高層內野**，逐項修正視覺比例。
