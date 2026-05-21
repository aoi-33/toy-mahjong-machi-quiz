import { writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { calcWaits } from '../src/domain/wait-calculator.ts';
import { sortTiles, type Tile, type Suit } from '../src/domain/tile.ts';
import { calcDifficulty } from '../src/domain/scoring.ts';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, '../public/questions');
const CHUNK_SIZE = 10;

// ---- PRNG ----

function makePrng(seed: number) {
  let s = seed >>> 0;
  return () => { s = (Math.imul(1664525, s) + 1013904223) >>> 0; return s / 0xffffffff; };
}

function shuffle<T>(arr: T[], rand: () => number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ---- 構造的に 14 枚の上がり手牌を組み立てる ----
// 4 メンツ + 1 雀頭 を確実に生成し，1 枚抜いてテンパイにする

function buildWinningHand(rand: () => number, singleSuit?: Suit): Tile[] | null {
  const used = new Map<string, number>();
  const hand: Tile[] = [];

  const key = (suit: Suit, num: number) => `${num}${suit}`;
  const canAdd = (suit: Suit, num: number, n: number) => (used.get(key(suit, num)) ?? 0) + n <= 4;
  const add = (suit: Suit, num: number) => {
    const k = key(suit, num);
    used.set(k, (used.get(k) ?? 0) + 1);
    hand.push({ suit, num });
    return true;
  };
  const rollback = (before: number) => {
    while (hand.length > before) {
      const t = hand.pop()!;
      const k = key(t.suit, t.num);
      used.set(k, used.get(k)! - 1);
    }
  };

  const numSuits: Suit[] = singleSuit ? [singleSuit] : ['m', 'p', 's'];

  // 4 メンツを生成
  for (let m = 0; m < 4; m++) {
    let ok = false;
    for (let t = 0; t < 60 && !ok; t++) {
      const useShuntsu = !singleSuit ? rand() < 0.65 : rand() < 0.75;
      if (useShuntsu) {
        const suit = numSuits[Math.floor(rand() * numSuits.length)];
        const start = Math.floor(rand() * 7) + 1;
        const before = hand.length;
        if (canAdd(suit, start, 1) && canAdd(suit, start + 1, 1) && canAdd(suit, start + 2, 1)) {
          add(suit, start); add(suit, start + 1); add(suit, start + 2);
          ok = true;
        } else rollback(before);
      } else {
        const suit = singleSuit ?? (rand() < 0.2 ? 'z' : numSuits[Math.floor(rand() * 3)]);
        const max = suit === 'z' ? 7 : 9;
        const num = Math.floor(rand() * max) + 1;
        if (canAdd(suit, num, 3)) { add(suit, num); add(suit, num); add(suit, num); ok = true; }
      }
    }
    if (!ok) return null;
  }

  // 雀頭を生成
  let pairOk = false;
  for (let t = 0; t < 60 && !pairOk; t++) {
    const suit = singleSuit ?? (rand() < 0.12 ? 'z' : numSuits[Math.floor(rand() * 3)]);
    const max = suit === 'z' ? 7 : 9;
    const num = Math.floor(rand() * max) + 1;
    if (canAdd(suit, num, 2)) { add(suit, num); add(suit, num); pairOk = true; }
  }

  return hand.length === 14 ? hand : null;
}

// ---- 問題生成 ----

interface Question { hand: Tile[]; correctWaits: Tile[]; difficulty: number; }

function generateOne(rand: () => number, singleSuit?: Suit, minWaits = 1): Question | null {
  for (let attempt = 0; attempt < 30; attempt++) {
    const winning = buildWinningHand(rand, singleSuit);
    if (!winning) continue;
    // ランダムに 1 枚抜いてテンパイ手牌を作る
    const idx = Math.floor(rand() * winning.length);
    const hand = sortTiles([...winning.slice(0, idx), ...winning.slice(idx + 1)]);
    const waits = calcWaits(hand);
    if (waits.length >= minWaits) return { hand, correctWaits: waits, difficulty: calcDifficulty(waits.length) };
  }
  return null;
}

// ---- メイン ----

mkdirSync(OUT_DIR, { recursive: true });

const questions: Question[] = [];
let seed = 0x1234_5678;
const nextSeed = () => { seed = (Math.imul(1664525, seed) + 1013904223) >>> 0; return seed; };

const targets: { label: string; count: number; suit?: Suit; minWaits: number }[] = [
  { label: '通常',     count: 7000, minWaits: 1 },
  { label: '清一色M',  count:  700, suit: 'm', minWaits: 1 },
  { label: '清一色P',  count:  700, suit: 'p', minWaits: 1 },
  { label: '清一色S',  count:  600, suit: 's', minWaits: 1 },
  { label: '多面待ち', count: 1000, minWaits: 3 },
];

for (const t of targets) {
  let generated = 0;
  while (generated < t.count) {
    const rand = makePrng(nextSeed());
    const q = generateOne(rand, t.suit, t.minWaits);
    if (q) { questions.push(q); generated++; }
    if (generated % 500 === 0 && generated > 0) process.stdout.write(`\r${t.label}: ${generated}/${t.count}`);
  }
  console.log(`\r${t.label}: ${generated}/${t.count} 完了`);
}

// シャッフルして分割
const shuffled = shuffle(questions, makePrng(0xdeadbeef));
const chunks = Math.ceil(shuffled.length / CHUNK_SIZE);
for (let i = 0; i < chunks; i++) {
  const chunk = shuffled.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
  writeFileSync(join(OUT_DIR, `chunk-${String(i).padStart(4, '0')}.json`), JSON.stringify(chunk));
}
const kb = Math.round(chunks * CHUNK_SIZE * 350 / 1024);
console.log(`\n計 ${shuffled.length} 問 / ${chunks} チャンク (推定 ${kb} KB) → ${OUT_DIR}`);
