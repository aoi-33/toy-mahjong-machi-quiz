# 待ち読み道場

麻雀の聴牌形 (13 枚) から待ち牌を当てる、ブラウザ完結型のミニトレーニングアプリ。

## 概要

- 13 枚の手牌が提示されるので、和了牌 (待ち) をすべて選んで回答するクイズです。
- 単騎・嵌張・辺張・両面・双碰・七対子・国士無双 まで、待ちの種類を網羅して出題します。
- タイマー付きで、正答数とコンボから簡易スコアを算出します。
- ローカルストレージにベストスコアを保存。サーバー不要のフロントエンド SPA です。

## 遊び方

1. 「スタート」を押すと 13 枚の手牌が表示されます。
2. 下部の牌パッドから待ち牌だと思うものをすべてタップ / クリックして選び、「決定」で回答します。
3. 正誤フィードバックと待ち種別 (例: 嵌張、両面、シャンポン) が表示されます。
4. 制限時間 (デフォルト 60 秒) 内に、できるだけ多くの問題に正解しましょう。
5. 終了後、合計スコア・正答数・最長コンボがリザルト画面に出ます。

スコアは「正答ベーススコア × 難易度補正 × コンボ倍率」で決まります。多面待ちや七対子・国士無双の方が高得点です。

## ローカル起動

[mise](https://mise.jdx.dev/) で Node.js 環境を揃えると衝突しません。

```bash
# 依存をインストール
npm install

# 開発サーバー (HMR)
npm run dev
# -> http://localhost:5173
```

## ビルド

```bash
# 型チェック + 本番ビルド
npm run build

# ビルド成果物を確認
npm run preview
```

ビルド成果物は `dist/` 以下に生成されます。`vite.config.ts` の `base` は `'/mahjong-machi-quiz/'` を指しており、GitHub Pages のサブパス公開を前提にしています。

## テスト

```bash
# 単体テスト (Vitest)
npm test

# ウォッチモード
npm run test:watch
```

待ち判定ロジック (`src/domain/wait-calculator.ts`) には、spec の代表的な待ち形 7 ケース + エッジケースのテストが含まれています。

## GitHub Pages デプロイ

1. リポジトリ名を `mahjong-machi-quiz` に合わせる (または `vite.config.ts` の `base` を実リポジトリ名に変更)。
2. `main` ブランチに push し、Actions または手動で次のように成果物を `gh-pages` ブランチへ反映します。

```bash
npm run build
# dist/ を gh-pages ブランチに公開 (例: gh-pages パッケージ等を利用)
npx gh-pages -d dist
```

3. GitHub リポジトリの Settings -> Pages で公開元ブランチを `gh-pages` に設定。
4. 数十秒待つと `https://<user>.github.io/mahjong-machi-quiz/` で公開されます。

## 技術スタック

- [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) (strict)
- [Vite 8](https://vitejs.dev/) — 開発サーバーとバンドラ
- [Vitest 4](https://vitest.dev/) + jsdom — 単体テスト
- CSS Modules + CSS Custom Properties — UI スタイリング、デザイントークンは `src/styles/tokens.css`
- SVG ベースの自作牌コンポーネント (`src/ui/Tile.tsx`)
- ローカルストレージのみのランキング保存 (`src/storage/ranking.ts`)

## ディレクトリ構成

```
src/
  domain/          待ち判定・出題ロジック・スコア計算
    tile.ts
    wait-calculator.ts
    problem-generator.ts
    scoring.ts
  game/            ゲーム状態管理 (reducer / hooks)
  ui/              プレゼンテーションコンポーネント
  storage/         localStorage 永続化
  styles/          デザイントークン / リセット CSS
  __tests__/       Vitest テスト
```

## ライセンス

このリポジトリは学習目的のサンプルです。LICENSE ファイルがなければ全権利留保 (All Rights Reserved) として扱ってください。
