import { type Tile, type Suit, ALL_TILES, sortTiles, tilesEqual } from './tile';

export function isWinningHand(tiles: Tile[]): boolean {
  if (tiles.length !== 14) return false;
  const sorted = sortTiles(tiles);
  return isKokushi(sorted) || isChiitoitsu(sorted) || isRegular(sorted);
}

function isKokushi(sorted: Tile[]): boolean {
  const yaochu: Tile[] = [
    { suit: 'm', num: 1 }, { suit: 'm', num: 9 },
    { suit: 'p', num: 1 }, { suit: 'p', num: 9 },
    { suit: 's', num: 1 }, { suit: 's', num: 9 },
    { suit: 'z', num: 1 }, { suit: 'z', num: 2 }, { suit: 'z', num: 3 },
    { suit: 'z', num: 4 }, { suit: 'z', num: 5 }, { suit: 'z', num: 6 }, { suit: 'z', num: 7 },
  ];
  const counts = buildCounts(sorted);
  let hasJantai = false;
  for (const y of yaochu) {
    const c = counts.get(tileKey(y)) ?? 0;
    if (c === 0) return false;
    if (c >= 2) hasJantai = true;
  }
  return hasJantai;
}

function isChiitoitsu(sorted: Tile[]): boolean {
  const counts = buildCounts(sorted);
  let pairs = 0;
  for (const c of counts.values()) {
    if (c === 2) pairs++;
    else return false;
  }
  return pairs === 7;
}

function isRegular(sorted: Tile[]): boolean {
  const counts = buildCounts(sorted);
  const keys = [...counts.keys()];
  for (const k of keys) {
    const c = counts.get(k)!;
    if (c >= 2) {
      counts.set(k, c - 2);
      if (canDecompose(counts)) return true;
      counts.set(k, c);
    }
  }
  return false;
}

function canDecompose(counts: Map<string, number>): boolean {
  let firstKey: string | undefined;
  for (const [k, v] of counts) {
    if (v > 0) { firstKey = k; break; }
  }
  if (firstKey === undefined) return true;

  const t = parseKey(firstKey);
  const c = counts.get(firstKey)!;

  if (c >= 3) {
    counts.set(firstKey, c - 3);
    if (canDecompose(counts)) return true;
    counts.set(firstKey, c);
  }

  if (t.suit !== 'z' && t.num <= 7) {
    const k2 = tileKey({ suit: t.suit, num: t.num + 1 });
    const k3 = tileKey({ suit: t.suit, num: t.num + 2 });
    const c2 = counts.get(k2) ?? 0;
    const c3 = counts.get(k3) ?? 0;
    if (c2 >= 1 && c3 >= 1) {
      counts.set(firstKey, c - 1);
      counts.set(k2, c2 - 1);
      counts.set(k3, c3 - 1);
      if (canDecompose(counts)) return true;
      counts.set(firstKey, c);
      counts.set(k2, c2);
      counts.set(k3, c3);
    }
  }

  return false;
}

export function calcWaits(hand13: Tile[]): Tile[] {
  return ALL_TILES.filter(candidate => {
    const counts: Record<string, number> = {};
    for (const t of [...hand13, candidate]) {
      const k = tileKey(t);
      counts[k] = (counts[k] ?? 0) + 1;
    }
    if (Object.values(counts).some(n => n > 4)) return false;
    return isWinningHand([...hand13, candidate]);
  });
}

export type WaitType = 'tanki' | 'penchan' | 'kanchan' | 'ryanmen' | 'shanpon' | 'chiitoitsu' | 'kokushi' | 'tamen';

export function classifyWait(hand13: Tile[], waits: Tile[]): WaitType {
  if (waits.length >= 3) return 'tamen';
  if (waits.length === 0) return 'tanki';
  const withFirst = [...hand13, waits[0]];
  if (isChiitoitsu(sortTiles(withFirst))) return 'chiitoitsu';
  if (isKokushi(sortTiles([...hand13, waits[0]]))) return 'kokushi';
  if (waits.length === 2) {
    const [a, b] = waits;
    // 同色で差 3 の 2 牌は両面待ち (例: 3s/6s)
    if (a.suit === b.suit && a.suit !== 'z' && Math.abs(a.num - b.num) === 3) {
      return 'ryanmen';
    }
    return 'shanpon';
  }
  const w = waits[0];
  if (w.suit !== 'z') {
    const hasLower = hand13.some(t => tilesEqual(t, { suit: w.suit, num: w.num - 1 }));
    const hasUpper = hand13.some(t => tilesEqual(t, { suit: w.suit, num: w.num + 1 }));
    const hasLower2 = hand13.some(t => tilesEqual(t, { suit: w.suit, num: w.num - 2 }));
    const hasUpper2 = hand13.some(t => tilesEqual(t, { suit: w.suit, num: w.num + 2 }));
    // 嵌張: 待ち牌の両側 (n-1, n+1) が手牌にある
    if (hasLower && hasUpper) return 'kanchan';
    // 辺張: 3 待ち (1,2 を持つ) または 7 待ち (8,9 を持つ)
    if (w.num === 3 && hasLower && hasLower2) return 'penchan';
    if (w.num === 7 && hasUpper && hasUpper2) return 'penchan';
    // 両面: 隣接 2 枚 (n-2,n-1) または (n+1,n+2) を持つ
    if ((hasLower && hasLower2) || (hasUpper && hasUpper2)) return 'ryanmen';
  }
  return 'tanki';
}

export const WAIT_LABELS: Record<WaitType, string> = {
  tanki: '単騎待ち',
  penchan: '辺張待ち',
  kanchan: '嵌張待ち',
  ryanmen: '両面待ち',
  shanpon: '双碰待ち',
  chiitoitsu: '七対子単騎',
  kokushi: '国士無双',
  tamen: '多面待ち',
};

function buildCounts(tiles: Tile[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const t of tiles) {
    const k = tileKey(t);
    map.set(k, (map.get(k) ?? 0) + 1);
  }
  return map;
}

function tileKey(t: Tile): string { return `${t.num}${t.suit}`; }

function parseKey(k: string): Tile {
  return { suit: k.slice(-1) as Suit, num: parseInt(k.slice(0, -1), 10) };
}
