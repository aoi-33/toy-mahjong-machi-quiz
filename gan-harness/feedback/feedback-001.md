# Evaluation — Iteration 001

評価モード: `code-only` (TypeScript ビルド + Vitest + ソースコード静的レビュー)

注意: `gan-harness/spec.md` および `gan-harness/eval-rubric.md` が存在しないため、評価依頼内に記載された
「Critical / Code Quality / Design Compliance / Missing Features」の観点と、
`generator-state.md` 記載の Must-Have に照らしてレビューを実施した。

---

## Scores

| Criterion | Score | Weight | Weighted |
|-----------|------:|-------:|---------:|
| Design Quality (tokens / 牌コンポーネント / 配色) | 7/10 | 0.3 | 2.10 |
| Originality (待ち読み道場ブランディング / 和風モチーフ) | 7/10 | 0.2 | 1.40 |
| Craft (ビルド・型・hooks・状態管理の正確さ) | 4/10 | 0.3 | 1.20 |
| Functionality (`calcWaits` 精度 / ゲームループ / 永続化) | 7/10 | 0.2 | 1.40 |
| **TOTAL** | | | **6.10 / 10** |

## Verdict: **FAIL** (threshold 7.0)

主因は **`npm run build` がコンパイルエラーで失敗する** こと。
テストは 15/15 緑だが、本番ビルドが通らない以上「成果物をデプロイできる状態」ではない。
Craft 評価が重み 0.3 で大きく沈み、6.10 で閾値割れ。

---

## Critical Issues (must fix)

### C1. `npm run build` がコケる (TS6133 / TS2769)
`tsc -b` で次の 3 件のエラーが発生し、`vite build` 以前に止まる:

```
src/game/useGame.ts(2,42): error TS6133: 'GameAction' is declared but its value is never read.
src/ui/ScoreBoard.tsx(10,62): error TS6133: 'streak' is declared but its value is never read.
vite.config.ts(7,3): error TS2769: No overload matches this call.
  Object literal may only specify known properties, and 'test' does not exist in type 'UserConfigExport'.
```

修正:
- `src/game/useGame.ts:2` — `import { gameReducer, initialState, type GameAction } from './gameReducer'` から `GameAction` を削除する (実コードで未使用)。
- `src/ui/ScoreBoard.tsx:10` — `streak` を props から受け取っているのに JSX で使っていない。props インターフェースから `streak` を消すか、`ComboBadge` を内包してこの場で `streak` を表示する。呼び出し側 (`App.tsx:25`) も合わせて修正。
- `vite.config.ts:1` — `import { defineConfig } from 'vite'` を `import { defineConfig } from 'vitest/config'` に変更する (もしくはファイル先頭に `/// <reference types="vitest" />` を追加)。これで `test` プロパティが型認識される。

これらは全て**機械的に直せる**ので、最低限ここを潰さない限り次のイテレーションは無意味。

### C2. `useGame` 内で render 中に副作用 (`saveHighScore`) を実行している
`src/game/useGame.ts:31-33`:
```ts
if (state.phase === 'finished' && state.score > loadHighScore()) {
  saveHighScore(state.score);
}
```
これはコンポーネント render の度に走る純粋でない処理。`StrictMode` 配下では二重実行されるし、再レンダリングごとに localStorage を読み書きする。

修正: `useEffect(() => { if (phase === 'finished') saveHighScore(state.score); }, [state.phase, state.score])` に移す。
合わせて `state.highScore` が reducer 内で `Math.max(state.highScore, newScore)` で更新されているので、保存対象は `state.highScore` の方が一貫する。

### C3. `useGame.submitAnswer` / `pass` の `setTimeout` が effect の外
`src/game/useGame.ts:22, 27`:
```ts
const submitAnswer = useCallback(() => {
  dispatch({ type: 'SUBMIT_ANSWER' });
  setTimeout(() => dispatch({ type: 'SHOW_NEXT' }), 1200);
}, []);
```
アンマウント時にクリアされない裸の `setTimeout`。コンポーネントが unmount された後にもう一度 dispatch が走り、警告 (React 19 でも避けるべき) を吐く可能性。

修正: reducer 側で `phase === 'feedback'` への遷移をトリガに、`useEffect` で `setTimeout` を張り、cleanup で `clearTimeout` する。あるいは `feedbackUntil` のような時刻を state に持たせ、Timer hook と統合する。

---

## Major Issues (should fix)

### M1. ResultScreen に絵文字 `🏆` — 「絵文字禁止」ルール違反
`src/ui/ResultScreen.tsx:34`:
```tsx
{state.score > state.highScore - calcLastScore(state) && (
  <div className={styles.newRecord}>🏆 NEW RECORD!</div>
)}
```
依頼で「SVG 牌コンポーネントが絵文字を使っていないか / グラデーション禁止」が design compliance に明記されている。牌側はクリアだが、UI 全体で絵文字を排する意図のはず。

修正: 🏆 を `<svg>` の月桂冠アイコン (もしくは 「最」「新」のスタンプ風 SVG) に置き換える。`tokens.css` の `--color-gold` を活かしてシンプルに `★` 相当の SVG を `--color-gold` で塗る、あるいは "新記録" の篆書風テキストでも spec の和テイストに合う。

### M2. ResultScreen の `NEW RECORD!` 判定がデッドコード由来でほぼ常に true
同じく `ResultScreen.tsx:33-35` の条件:
```ts
state.score > state.highScore - calcLastScore(state)
// calcLastScore は function calcLastScore(_s: GameState): number { return 0; }
```
`calcLastScore` が常に 0 を返すため、条件は `state.score > state.highScore` になる。ところが `gameReducer.SUBMIT_ANSWER` 内で `highScore: Math.max(state.highScore, newScore)` と更新済みなので、リザルト画面到達時は **常に `score <= highScore`** で、結果として `🏆 NEW RECORD!` は**絶対に表示されない**。

修正: `gameReducer.initialState` で `prevHighScore` を保持しておくか、`useGame` 開始時に `loadHighScore()` の値をローカル変数で覚えておいて ResultScreen に「過去ベストを更新したか」フラグとして渡す。`calcLastScore` のスタブは削除。

### M3. `FeedbackOverlay` の正解表示が `tileLabel()` を使わず生 ID
`src/ui/FeedbackOverlay.tsx:20`:
```tsx
正解: {correctWaits.map(t => `${t.num}${t.suit}`).join(' ')}
```
`5s`, `1z` のような内部表現がそのまま出る。ユーザに見せる表記は `tile.ts:24` の `tileLabel()` (`5索`, `東` など) を使うべき。出題側 (Hand / AnswerPad) が漢字記号で揃っているのに、フィードバックだけ英数字に降りるのは一貫性を欠く。

修正: `import { tileLabel } from '../domain/tile'` して `.map(tileLabel)` に置換。

### M4. `problem-generator.ts` のシャッフルロジックが意図と違う
`src/domain/problem-generator.ts:46-50`:
```ts
const rand = makePrng(actualSeed);
const deck = shuffle(buildDeck(), rand);
for (let attempt = 0; attempt < 50; attempt++) {
  const shuffled = shuffle(deck, makePrng(actualSeed + attempt));
  ...
}
```
- 最初に作った `deck` (1 回目のシャッフル済み) を更に `actualSeed + attempt` の新 PRNG で再シャッフルしている。`attempt = 0` の時の `deck` と `shuffled` は別物 (二重にシャッフルされている) なので、ユーザが「同じシードで遊ぶ」と言われたときの再現性が `attempt` のオフセットに引きずられて分かりづらい。
- また `actualSeed + attempt` を `>>> 0` する保証がない (PRNG 側で `seed >>> 0` してるので動くが、コードリーディングが辛い)。

修正: 最初の `shuffle(buildDeck(), rand)` を消し、ループ内で `shuffle(buildDeck(), makePrng(actualSeed + attempt))` に統一する。`seed` プロパティに返している値も `actualSeed + attempt` ではなく、`actualSeed` を残してリプレイ時にも `attempt` の探索フェーズ込みで再現できるようにする。

### M5. `Hand` / `AnswerPad` の React key に配列 index を使用
`src/ui/Hand.tsx:13` / `src/ui/AnswerPad.tsx:34, 47`:
```tsx
{tiles.map((tile, i) => <Tile key={i} ... />)}
```
手牌は次の問題でガラッと中身が入れ替わる。index key だと React が古いノードを再利用しようとして、`Tile` 内の `aria-pressed` や hover state が前の問題から残る。

修正: `key={tileToId(tile)}` に変更。同じ牌が手牌に複数枚あるケース (`8m, 8m, 8m`) では `key={`${tileToId(tile)}-${i}`}` にする。AnswerPad は重複ない 34 種なので `tileToId(tile)` だけで OK。

### M6. ESLint / 厳格ルールの設定が空に近い
`package.json` には `eslint`, `eslint-plugin-react-hooks`, `typescript-eslint` が入っているが、`eslint.config.js` の中身は未確認 (依頼内では参照していない)。`no-explicit-any` / `react-hooks/exhaustive-deps` / `react-hooks/rules-of-hooks` が `error` で有効でない場合、上記 C2/M5 のような問題が検出されない。

修正: `eslint.config.js` で `@typescript-eslint/no-explicit-any: 'error'`, `react-hooks/exhaustive-deps: 'error'`, `react-hooks/rules-of-hooks: 'error'` を明示。CI で `npm run lint` を実行。

---

## Minor Issues (nice to fix)

### m1. `ResultScreen.calcLastScore` というデッド関数
`function calcLastScore(_s: GameState): number { return 0; }` を放置していると、後の自分が「これは何か？」で時間を溶かす。M2 を直すと同時に削除。

### m2. `useTimer.ts` は dispatch を依存配列に入れているが、`dispatch` は React が安定参照を保証するので、依存配列にあると毎回 effect が張り直されるわけではないが、本来 `[phase]` のみで十分。lint 的には dispatch も入れる方が無難なので現状の方が正しい。これは指摘ではなく確認。

### m3. README の遊び方が実装と不一致
`README.md:17`: 「制限時間 (デフォルト 60 秒) 内に」と書いてあるが、`gameReducer.initialState` は `timeRemaining: 90`。`App.tsx:66` でも「90秒間」と書いてある。README を 90 秒に修正。

### m4. `index.css` で Google Fonts を `@import url(...)` している
これは render-blocking。`index.html` の `<link rel="preconnect">` + `<link rel="stylesheet">` に移す方が初回表示が早い。spec で初回表示時間に縛りがあるなら必須、なければ minor。

### m5. `Tile.tsx` の `RED_TILES` に `'1s'` が含まれている
`const RED_TILES = new Set(['z7', '5m', '1s'])` — 通常麻雀牌で赤く描かれるのは「中 (z7)」と「赤五 (5m/5p/5s)」のみ。`1s` を赤で描く慣習はない。一旦 spec 要件か確認したいが、もし「単に色変化のリズム付け」だとすれば 1s だけ赤い理由がなくユーザを混乱させる。`'1s'` を削除し、必要なら `'5p', '5s'` を追加する。

### m6. `ScoreBoard.module.css` の `.label` に `text-transform: uppercase`
ラベル文字は「スコア / 正答 / ベスト」と日本語。`uppercase` は日本語に効かないので無害だが、英語混在になったとき意図せず大文字化されるので、英語ラベルに切り替える予定がないなら削除。

### m7. CSS 内に色のハードコード
`Tile.module.css:26 (#e6f0ea), :30 (#fce8e4)`, `App.module.css:68 (rgba(27,58,46,0.35))` などに直リテラルが点在。tokens 統一の哲学が崩れる。`--color-green-bg-light`, `--color-red-bg-light` をトークン化。

### m8. `Hand` 背景が `var(--color-green)` (深緑)
雀卓っぽくて良い演出だが、`box-shadow: inset 0 2px 8px rgba(0,0,0,0.3)` の影が深緑に乗ると視認性が落ち気味。`--color-green` の濃度を 1 段階明るくするか、内側影を `rgba(0,0,0,0.18)` 程度に弱める方がコントラスト OK。

---

## What Improved Since Last Iteration

(イテレーション 001 のため比較対象なし)

`generator-state.md` に拠ると、本イテレーションで以下が成立:
- `calcWaits` の通常形 / 七対子 / 国士判定が **15/15 テスト緑** で揃った。
- `classifyWait` の `penchan` / `ryanmen` / `shanpon` の取り違えを **修正済み** (テストでも担保)。
- ゲームループ (idle → playing → feedback → finished)、Timer、ComboBadge、ResultScreen、localStorage 永続化までひととおり実装。

ロジック面 (`src/domain/`) の完成度は高い。問題は **ビルドが通らないことと、ResultScreen / useGame まわりの React 規律**。

## What Regressed Since Last Iteration

なし (初回)。

---

## Specific Suggestions for Next Iteration

優先順 (上から潰す):

1. **C1 をまず直す。** `useGame` の unused import 削除、`ScoreBoard` の `streak` prop 削除 (または使う)、`vite.config.ts` を `vitest/config` 経由に。これで `npm run build` を緑にする。
2. **M2 を直す。** `gameReducer` に `prevHighScore: number` を追加し、`START_GAME` で `loadHighScore()` 結果を保存、ResultScreen で `state.score > state.prevHighScore` と比較。`calcLastScore` スタブを削除。
3. **C2/C3 を直す。** `useGame` の `saveHighScore` 副作用を `useEffect` 化、`setTimeout` を effect 内に閉じ込めて cleanup。
4. **M1 (🏆 絵文字) を SVG / 漢字スタンプに置き換える**。spec の和テイスト方針と整合させる。
5. **M3 (`FeedbackOverlay` の表示が生 ID)** を `tileLabel()` に統一。
6. **M5 (key=index)** を `tileToId` ベースに変更。
7. M4 / M6 / Minor 群を時間が許せば。

ロジックは堅いので、**React 周りの規律と「ビルドが通る」最低保証**を整えれば 7.0 ラインを越える見込み。

---

## Build / Test 出力 (証跡)

### `npm test` (15/15 passing)
```
 Test Files  1 passed (1)
      Tests  15 passed (15)
   Duration  1.21s
```

### `npm run build` (FAIL)
```
src/game/useGame.ts(2,42): error TS6133: 'GameAction' is declared but its value is never read.
src/ui/ScoreBoard.tsx(10,62): error TS6133: 'streak' is declared but its value is never read.
vite.config.ts(7,3): error TS2769: No overload matches this call.
  The last overload gave the following error.
    Object literal may only specify known properties, and 'test' does not exist in type 'UserConfigExport'.
```

## Notes on Methodology

- `gan-harness/spec.md` および `gan-harness/eval-rubric.md` が存在しなかったため、依頼内のチェック観点と `generator-state.md` を rubric 代替として使用した。
- ブラウザ実機テストは `code-only` モードのためスキップ。実機での「待ち牌候補が 34 個並んだ AnswerPad が 375px 幅でどう収まるか」「`Hand` が 13 枚並ぶときの折り返し挙動」「FeedbackOverlay の `position: absolute` がボタンに被って次手番ボタンを塞がないか」は未検証 — 次回 Playwright モードでの確認推奨。
