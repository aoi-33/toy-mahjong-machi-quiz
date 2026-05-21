import { describe, it, expect } from 'vitest';
import {
  calcWaits,
  isWinningHand,
  classifyWait,
} from '../domain/wait-calculator';
import { idToTile, tileToId, sortTiles, type Tile } from '../domain/tile';

function hand(ids: string[]): Tile[] {
  return ids.map(idToTile);
}

function waitIds(tiles: Tile[]): string[] {
  return sortTiles(tiles).map(tileToId);
}

describe('calcWaits — spec の代表的待ち形', () => {
  it('単騎待ち: 5s', () => {
    // 4 メンツ + 5s 単騎 (合計 13 枚)
    const h = hand([
      '2m', '3m', '4m',
      '5m', '6m', '7m',
      '8m', '8m', '8m',
      '2p', '3p', '4p',
      '5s',
    ]);
    expect(h).toHaveLength(13);
    expect(waitIds(calcWaits(h))).toEqual(['5s']);
    expect(classifyWait(h, calcWaits(h))).toBe('tanki');
  });

  it('嵌張待ち: 5s (4s 6s)', () => {
    // 3 メンツ + 2p 雀頭 + 4s_6s 嵌張 (合計 13 枚)
    const h = hand([
      '2m', '3m', '4m',
      '5m', '6m', '7m',
      '8m', '8m', '8m',
      '2p', '2p',
      '4s', '6s',
    ]);
    expect(h).toHaveLength(13);
    expect(waitIds(calcWaits(h))).toEqual(['5s']);
    expect(classifyWait(h, calcWaits(h))).toBe('kanchan');
  });

  it('辺張待ち: 3s (1s 2s)', () => {
    const h = hand([
      '2m', '3m', '4m',
      '5m', '6m', '7m',
      '8m', '8m', '8m',
      '2p', '2p',
      '1s', '2s',
    ]);
    expect(h).toHaveLength(13);
    expect(waitIds(calcWaits(h))).toEqual(['3s']);
    expect(classifyWait(h, calcWaits(h))).toBe('penchan');
  });

  it('両面待ち: 3s / 6s (4s 5s)', () => {
    const h = hand([
      '2m', '3m', '4m',
      '5m', '6m', '7m',
      '8m', '8m', '8m',
      '2p', '2p',
      '4s', '5s',
    ]);
    expect(h).toHaveLength(13);
    expect(waitIds(calcWaits(h))).toEqual(['3s', '6s']);
    expect(classifyWait(h, calcWaits(h))).toBe('ryanmen');
  });

  it('双碰待ち: 2p / 3p', () => {
    // 3 メンツ + 2p2p + 3p3p (合計 13 枚)
    const h = hand([
      '2m', '3m', '4m',
      '5m', '6m', '7m',
      '8m', '8m', '8m',
      '2p', '2p',
      '3p', '3p',
    ]);
    expect(h).toHaveLength(13);
    expect(waitIds(calcWaits(h))).toEqual(['2p', '3p']);
    expect(classifyWait(h, calcWaits(h))).toBe('shanpon');
  });

  it('七対子: 9s', () => {
    const h = hand([
      '2m', '2m',
      '3m', '3m',
      '5p', '5p',
      '6p', '6p',
      '7p', '7p',
      '8s', '8s',
      '9s',
    ]);
    expect(h).toHaveLength(13);
    expect(waitIds(calcWaits(h))).toEqual(['9s']);
    expect(classifyWait(h, calcWaits(h))).toBe('chiitoitsu');
  });

  it('国士無双 13 面待ち: 全么九牌', () => {
    const h = hand([
      '1m', '9m',
      '1p', '9p',
      '1s', '9s',
      '1z', '2z', '3z', '4z', '5z', '6z', '7z',
    ]);
    expect(h).toHaveLength(13);
    const waits = calcWaits(h);
    expect(waitIds(waits)).toEqual([
      '1m', '9m',
      '1p', '9p',
      '1s', '9s',
      '1z', '2z', '3z', '4z', '5z', '6z', '7z',
    ]);
    expect(classifyWait(h, waits)).toBe('tamen');
  });
});

describe('isWinningHand — 正常系・異常系', () => {
  it('完成形 (4 メンツ + 雀頭) は和了', () => {
    const h = hand([
      '2m', '3m', '4m',
      '5m', '6m', '7m',
      '8m', '8m', '8m',
      '2p', '3p', '4p',
      '5s', '5s',
    ]);
    expect(h).toHaveLength(14);
    expect(isWinningHand(h)).toBe(true);
  });

  it('七対子は和了', () => {
    const h = hand([
      '2m', '2m',
      '3m', '3m',
      '5p', '5p',
      '6p', '6p',
      '7p', '7p',
      '8s', '8s',
      '9s', '9s',
    ]);
    expect(isWinningHand(h)).toBe(true);
  });

  it('国士無双 (1m 雀頭) は和了', () => {
    const h = hand([
      '1m', '1m', '9m',
      '1p', '9p',
      '1s', '9s',
      '1z', '2z', '3z', '4z', '5z', '6z', '7z',
    ]);
    expect(isWinningHand(h)).toBe(true);
  });

  it('14 枚未満は和了でない', () => {
    const h = hand(['1m', '2m', '3m']);
    expect(isWinningHand(h)).toBe(false);
  });

  it('14 枚でも構成が崩れていれば和了でない', () => {
    // メンツが揃わない 14 枚
    const h = hand([
      '1m', '3m', '5m',
      '7m', '9m',
      '1p', '3p', '5p',
      '7p', '9p',
      '1s', '3s',
      '5s', '7s',
    ]);
    expect(isWinningHand(h)).toBe(false);
  });
});

describe('calcWaits — エッジケース', () => {
  it('同牌 5 枚を含む不正手牌は待ちなしとして除外される', () => {
    // 5m を 4 枚保有 → 5m は新たに引けない (5 枚目になる)
    const h = hand([
      '5m', '5m', '5m', '5m',
      '1p', '2p', '3p',
      '4p', '5p', '6p',
      '7s', '8s', '9s',
    ]);
    const waits = calcWaits(h);
    // 待ちがあったとしても 5m は含まれない
    expect(waits.find(t => t.suit === 'm' && t.num === 5)).toBeUndefined();
  });

  it('テンパイしていない手牌は待ちが空', () => {
    // バラバラのシャンテン崩れた手牌
    const h = hand([
      '1m', '4m', '7m',
      '2p', '5p', '8p',
      '3s', '6s', '9s',
      '1z', '2z', '3z', '4z',
    ]);
    expect(calcWaits(h)).toEqual([]);
  });

  it('待ち牌を加えると和了形になる', () => {
    const h = hand([
      '2m', '3m', '4m',
      '5m', '6m', '7m',
      '8m', '8m', '8m',
      '2p', '3p', '4p',
      '5s',
    ]);
    const waits = calcWaits(h);
    expect(waits).toHaveLength(1);
    expect(isWinningHand([...h, waits[0]])).toBe(true);
  });
});
