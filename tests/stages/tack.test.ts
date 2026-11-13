import { describe, expect, it } from 'vitest';
import {
  isRingExpired,
  judgeTap,
  MAX_MISSES,
  RING_DURATION,
  RING_START,
  RING_TARGET,
  ringRadius,
  shouldDrop,
  tackQuality,
} from '../../src/stages/logic/tack';

/** リングが目標半径にちょうど重なる時刻 */
const PERFECT_MS = ((RING_START - RING_TARGET) / RING_START) * RING_DURATION;
const msForRadius = (r: number) => ((RING_START - r) / RING_START) * RING_DURATION;

describe('tack timing', () => {
  it('リングは開始半径から0まで縮む', () => {
    expect(ringRadius(0)).toBe(RING_START);
    expect(ringRadius(RING_DURATION)).toBe(0);
    expect(ringRadius(RING_DURATION * 2)).toBe(0);
  });

  it('重なった瞬間はパーフェクト、離れるほど判定が下がる', () => {
    expect(judgeTap(PERFECT_MS)).toBe('perfect');
    expect(judgeTap(msForRadius(RING_TARGET + 5))).toBe('good');
    expect(judgeTap(msForRadius(RING_TARGET - 10))).toBe('bad');
  });

  it('早すぎるタップはミス', () => {
    expect(judgeTap(0)).toBe('miss');
    expect(judgeTap(msForRadius(RING_TARGET + 13))).toBe('miss');
  });

  it('縮みきったら時間切れ', () => {
    expect(isRingExpired(RING_DURATION - 1)).toBe(false);
    expect(isRingExpired(RING_DURATION)).toBe(true);
  });
});

describe('tack result', () => {
  it(`ミス${MAX_MISSES}回で落下`, () => {
    expect(shouldDrop(['miss', 'perfect'])).toBe(false);
    expect(shouldDrop(['miss', 'good', 'miss'])).toBe(true);
  });

  it('品質は判定の平均', () => {
    expect(tackQuality(['perfect', 'perfect', 'perfect', 'perfect'])).toBe(1);
    expect(tackQuality(['perfect', 'good', 'bad', 'miss'])).toBeCloseTo((1 + 0.75 + 0.4 + 0) / 4);
    expect(tackQuality([])).toBe(0);
  });
});
