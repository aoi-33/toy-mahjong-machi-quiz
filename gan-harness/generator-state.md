# Generator State — Iteration 001

Date: 2026-05-21

## What Was Built

### ドメインロジック (`src/domain/`)
- `tile.ts` — `Tile` 型、`TileId`、`ALL_TILES` 定数、`idToTile` / `tileToId` / `tilesEqual` / `tileLabel` / `compareTiles` / `sortTiles` ユーティリティ。
- `wait-calculator.ts` — 13 枚手牌から待ち牌を求める `calcWaits`、14 枚和了判定の `isWinningHand`、待ち種別を返す `classifyWait`、表示ラベル `WAIT_LABELS`。通常形 (4 メンツ + 雀頭)、七対子、国士無双の 3 形に対応。
- `problem-generator.ts` — 出題用の `generateQuiz(seed?)`。シードを与えれば再現可能。
- `scoring.ts` — `calcScore()` と `calcDifficulty()`。

### ゲーム状態 (`src/game/`)
- `gameReducer.ts` — `GameState` / `GameAction` / `gameReducer` / `initialState`。
- `useTimer.ts` — 制限時間カウントダウンの React Hook。
- `useGame.ts` — reducer と timer を統合するゲームエントリ Hook。

### 永続化 (`src/storage/`)
- `ranking.ts` — localStorage にベストスコア / コンボを保存・読み出し。

### UI コンポーネント (`src/ui/`, CSS Modules)
- `Tile.tsx` — SVG 牌コンポーネント (萬子・筒子・索子・字牌)。
- `Hand.tsx` — 13 枚手牌を整列表示。
- `AnswerPad.tsx` — 候補牌のグリッド + 選択トグル。
- `Timer.tsx` — 残り時間バー。
- `ScoreBoard.tsx` — 現在スコア / コンボ。
- `ResultScreen.tsx` — リザルト画面 (合計 / 最長コンボ / ベスト)。
- `ComboBadge.tsx` — コンボ通知バッジ。
- `FeedbackOverlay.tsx` — 正誤フィードバックのオーバーレイ。

### アプリ統合
- `src/App.tsx` + `App.module.css` — トップレベル画面遷移 (タイトル / プレイ / リザルト)。
- `src/main.tsx`, `src/index.css`, `src/styles/tokens.css`, `src/styles/reset.css` — エントリポイントと共通スタイル。

### このイテレーションで追加した成果物
- **`src/__tests__/wait-calculator.test.ts`** — spec の 7 ケース (単騎・嵌張・辺張・両面・双碰・七対子・国士 13 面) + `isWinningHand` 5 ケース + `calcWaits` エッジ 3 ケースの計 **15 テスト**。
- **`README.md`** — 日本語ドキュメント (概要 / 遊び方 / ローカル起動 / ビルド / テスト / GitHub Pages デプロイ / 技術スタック / ディレクトリ構成)。
- **`gan-harness/generator-state.md`** — 本ファイル。

## What Changed This Iteration

- **Fixed: `classifyWait` の penchan / ryanmen / shanpon 誤分類**
  - 辺張判定が `(w.num === 3 && hasUpper) || (w.num === 7 && hasLower)` と方向が逆になっていたため、1s2s → 3s 待ちが `ryanmen` 扱いになっていた。隣接 2 枚 (`n-1, n-2` または `n+1, n+2`) の有無で正しく `penchan` / `ryanmen` を切り分けるように修正。
  - 双碰判定が `waits.length === 2` を即 `shanpon` にしていたため、ryanmen の 3s/6s 待ちも shanpon に誤分類されていた。同色かつ差 3 の 2 牌のときは `ryanmen` を返すよう修正。
- **Added: Vitest テスト** — 上記の修正回帰防止を含む 15 ケースを追加。`npm test` で全てパス。
- **Updated: 既存 Vite 雛形の英語 README を、本プロジェクト向けの日本語 README で上書き。**

## Known Issues

- `calcWaits` は `ALL_TILES` を全走査して各候補ごとに `isWinningHand` を呼ぶブルートフォース。13 枚手牌では十分速いが、大量バッチ評価が必要になった場合は最適化余地あり。
- `classifyWait` の `ryanmen` / `penchan` は単一待ちの典型形のみカバー。複雑な多面形は `tamen` に丸めている (spec 範囲では問題なし)。
- README に記載のデプロイ手順は `gh-pages` パッケージを別途導入する前提。CI ワークフローは未整備。
- ESLint は依存に含まれるが、テストファイル向けの `no-explicit-any` 等の厳格な追加ルールは未設定 (本実装ではいずれにせよ `any` 不使用)。

## Dev Server

- URL: http://localhost:5173 (Vite デフォルト)
- 起動コマンド: `npm run dev`
- ビルド: `npm run build`
- テスト: `npm test` (現在 15/15 passing)

## Test Status

```
 Test Files  1 passed (1)
      Tests  15 passed (15)
```
