import { type Tile, type Suit, sortTiles } from './tile';
import { calcWaits } from './wait-calculator';
import { calcDifficulty } from './scoring';

export interface QuizQuestion {
  hand: Tile[];
  correctWaits: Tile[];
  difficulty: number;
}

// seeded LCG PRNG
function makePrng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(1664525, s) + 1013904223) >>> 0;
    return s / 0xFFFFFFFF;
  };
}

function shuffle<T>(arr: T[], rand: () => number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildDeck(): Tile[] {
  const suits: Suit[] = ['m', 'p', 's'];
  const deck: Tile[] = [];
  for (const suit of suits) {
    for (let num = 1; num <= 9; num++) {
      for (let k = 0; k < 4; k++) deck.push({ suit, num });
    }
  }
  for (let num = 1; num <= 7; num++) {
    for (let k = 0; k < 4; k++) deck.push({ suit: 'z', num });
  }
  return deck;
}

export function generateQuiz(seed?: number): QuizQuestion {
  const actualSeed = (seed ?? Math.floor(Math.random() * 0xFFFFFFFF)) >>> 0;

  // ランダム13枚がテンパイになる確率は約1〜3%のため500回試行する
  let s = actualSeed;
  for (let attempt = 0; attempt < 500; attempt++) {
    s = (Math.imul(1664525, s) + 1013904223) >>> 0;
    const deck = shuffle(buildDeck(), makePrng(s));
    const hand = sortTiles(deck.slice(0, 13));
    const waits = calcWaits(hand);
    if (waits.length > 0) {
      return { hand, correctWaits: waits, difficulty: calcDifficulty(waits.length) };
    }
  }

  // フォールバック: 確実にテンパイな手牌
  const fallback: Tile[] = sortTiles([
    { suit: 'm', num: 2 }, { suit: 'm', num: 3 }, { suit: 'm', num: 4 },
    { suit: 'm', num: 5 }, { suit: 'm', num: 6 }, { suit: 'm', num: 7 },
    { suit: 'm', num: 8 }, { suit: 'm', num: 8 }, { suit: 'm', num: 8 },
    { suit: 'p', num: 2 }, { suit: 'p', num: 3 }, { suit: 'p', num: 4 },
    { suit: 's', num: 5 },
  ]);
  return { hand: fallback, correctWaits: calcWaits(fallback), difficulty: 2 };
}
