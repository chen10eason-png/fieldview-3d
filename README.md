# FIELDVIEW 3D — 臺北大巨蛋幾何重建 V0.3

**非官方、原創建模的棒球場 3D 視角網站。** 本版以真實場館拓樸（topology）替代前兩版的簡單圓形／同心橢圓形座位平台。主要目標是校正球場的構造與分區，而不是宣稱完成 1:1 精確建模。

## 這次真正重建的地方

1. **內野與外野是兩套看台系統。** 102–124、201–225、301–317、401–417、503–515 沿著本壘後方的 U 形馬蹄看台；131–146、233–244 則沿中外野弧線。內野高層不再繞到外野背後成一個圓環。
2. **球場內野、草皮與外野牆不是圓形。** 本壘位於 `(0,0)`，朝中外野為 +Z；中外野 400 ft（約 121.92m），左右外野 335 ft（約 102.1m）；3.5m 外野牆僅沿外野弧線。草皮延伸到本壘後方，紅色外緣跑道與各壘紅土分開。
3. **屋頂與觀眾席分開。** 固定式橢圓外殼另行建模。球場總覽顯示遠端剖面鋼構；從座位看則改用室內完整鋼構網格；外觀視角顯示完整金屬蛋殼及立面。
4. **實際座位分區方向。** 113 本壘後方，108 一壘側，118 三壘側，138 中外野，509 高層內野。模型以官方座位圖與公開實景決定主要方向，沒有把區號直接平均分配到一整圈。
5. **前端互動。** iPad/iPhone Safari 支援旋轉、雙指縮放、點選看台、選區、估算排與座號、第一人稱拖曳視角，以及建築外觀切換。大量椅子使用 Three.js GPU InstancedMesh 以減少 draw calls。

## 可信度說明

| 內容 | 依據與可信度 |
|---|---|
| 球場方位與分區編號先後 | 官方座位圖，可用來核對相對方位 |
| 屋頂呈橢圓、固定式、鋼構網格 | 市府建築資料與承造單位照片 |
| 室內長寬高、外野距離 | 公開工程／場地資料作尺寸錨點 |
| 看台進退距離、階高、每區排數 | **自行推估，未完成實地測量** |
| 逐排、逐座號的位置和遮蔽物 | **自行推估，不能當成購票的精確視野** |

這份模型 **不是** 臺北大巨蛋的 BIM/CAD、雷射掃描或 3dome.tw 的私有 3D 模型；沒有取得這些資料就不能保證 1:1 重建。網頁已明確顯示「視覺重建／估算」而非「官方座位視角」。

## 參考資料：官方平面圖與內外實景

- [遠雄巨蛋官方座位區平面圖](https://www.farglorydome.com.tw/park-detail/map/) — 區號順序，內外野、看台分界與馬蹄形輪廓。
- [臺北市政府：巨蛋符合棒球賽標準](https://dome.gov.taipei/News_Content.aspx?n=809D227A1A9DB744&s=8CB6D52021B92DBE&sms=72544237BBE4C5F6) — 室內約 230 × 170 × 68m，球場距離。
- [大林組／台北ドーム](https://www.obayashi.co.jp/works/detail/work_2800.html) — 承造單位實景與跨距、曲面鋼管桁架。
- [世界棒壘球總會：臺北大巨蛋職棒開幕](https://www.wbsc.org/en/news/cpbl-opens-2024-season-in-taipei-dome) — 本壘後方視野、計分板與室內座位層次。
- [中央社：大巨蛋球迷開箱、看台視野](https://www.cna.com.tw/news/aspt/202311185005.aspx) — 外野視角、座位拼色與外野看台實景。
- [臺北大巨蛋上空外部屋頂參考](https://www.obayashi.com.tw/public/topic/projects/view/3251247305529102614) — 大巨蛋外觀與屋頂建築結構。

參考照片**只作幾何與視角比對，未以未經許可的照片、3D 資產當作網站素材**。

## 檔案樹

```text
fieldview-3d/
├── .github/
│   └── workflows/
│       └── deploy-pages.yml
├── src/
│   ├── dome.js          # 分開建場地、看台、外野牆、室內屋頂和完整蛋殼
│   ├── stadiums.js      # 馬蹄形／外野弧線、分區範圍、估算座位位置
│   ├── main.js          # 控制面板、相機、觸控和視角切換
│   └── style.css
├── tests/
│   └── stadium.test.js
├── index.html
├── package.json
├── vite.config.js
├── .gitignore
└── README.md
```

請特別確認資料夾是 **`src`，不是 `scr`**，且不要多包一層資料夾。不需要上傳 `dist` 或 `node_modules`。

## 本機執行與 QA

Node.js 22：

```bash
npm install
npm test
npm run dev
npm run build
```

`npm test` 為不依賴瀏覽器的 8 項測試，包含分區順序、內外野的分離、113／108／118／138 相對方位、外野距離和模型座位不穿出屋頂等。**這個交付環境的 npm 連線不通，因此尚未完成 Three.js 的真正瀏覽器渲染驗證**；不得把語法檢查當成 iPhone Safari 實測結果。

## GitHub Pages 部署

1. 解壓縮後把全部檔案放到原 `chen10eason-png/fieldview-3d` Repository 的正確根目錄，覆蓋舊的 `src/main.js`、`src/stadiums.js`、`src/style.css`，並**新增或覆蓋 `src/dome.js`**；同時上傳 `.github/workflows/deploy-pages.yml`。
2. `Settings → Pages → Source` 設為 **GitHub Actions**。
3. `main` 有新 Commit 後，Actions 的 Deploy GitHub Pages 會依序 `npm install`、`npm test`、`npm run build`、部署 `dist`。
4. 查看 <https://chen10eason-png.github.io/fieldview-3d/>，用本壘、左右內野、外野、上層和建築外觀五種角度逐一驗收。

`vite.config.js` 的 `base` 是 `/fieldview-3d/`，不要修改成 `/`。

## 下一階段的「實景誤差修正」

這版仍是幾何重建，**不是最後驗收版**。請優先比較實拍的：① 113 區面對計分板的高度與可見範圍；② 108、118 內野視線方向；③ 138 外野看本壘的位置；④ 509 高層的距離與傾角；⑤ 內部鋼構與外觀屋頂輪廓。如果有官方授權的 CAD、剖面／逐排座標，才能進一步建立可靠的精確座位視角。
