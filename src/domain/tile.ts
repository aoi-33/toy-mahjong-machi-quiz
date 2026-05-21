export type Suit = 'm' | 'p' | 's' | 'z';

export interface Tile {
  suit: Suit;
  num: number;
}

export type TileId = string; // "1m", "9p", "z7"

export function tileToId(t: Tile): TileId {
  return `${t.num}${t.suit}`;
}

export function idToTile(id: TileId): Tile {
  const suit = id.slice(-1) as Suit;
  const num = parseInt(id.slice(0, -1), 10);
  return { suit, num };
}

export function tilesEqual(a: Tile, b: Tile): boolean {
  return a.suit === b.suit && a.num === b.num;
}

export function tileLabel(t: Tile): string {
  if (t.suit === 'z') {
    return ['東', '南', '西', '北', '白', '發', '中'][t.num - 1] ?? '?';
  }
  const suitLabel = { m: '萬', p: '筒', s: '索' }[t.suit];
  return `${t.num}${suitLabel}`;
}

export const ALL_TILES: Tile[] = [
  ...Array.from({ length: 9 }, (_, i) => ({ suit: 'm' as Suit, num: i + 1 })),
  ...Array.from({ length: 9 }, (_, i) => ({ suit: 'p' as Suit, num: i + 1 })),
  ...Array.from({ length: 9 }, (_, i) => ({ suit: 's' as Suit, num: i + 1 })),
  ...Array.from({ length: 7 }, (_, i) => ({ suit: 'z' as Suit, num: i + 1 })),
];

export function compareTiles(a: Tile, b: Tile): number {
  const suitOrder: Record<Suit, number> = { m: 0, p: 1, s: 2, z: 3 };
  if (suitOrder[a.suit] !== suitOrder[b.suit]) {
    return suitOrder[a.suit] - suitOrder[b.suit];
  }
  return a.num - b.num;
}

export function sortTiles(tiles: Tile[]): Tile[] {
  return [...tiles].sort(compareTiles);
}
