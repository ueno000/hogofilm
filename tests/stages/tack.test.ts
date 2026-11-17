import { describe, expect, it } from 'vitest';
import {
  filmAngle,
  isRingExpired,
  isTilted,
  judgeTap,
  MAX_MISSES,
  RING_DURATION,
  RING_START,
  RING_TARGET,
  ringRadius,
  shouldDrop,
  TACK_TILT_BAD,
  TACK_TILT_GOOD,
  TACK_TILT_LIMIT,
  TACK_TILT_MISS,
  TACK_TILT_TOLERANCE,
  tackQuality,
  tapDirection,
  tiltFor,
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

});

describe('フィルムの傾き（T-2）', () => {
  it('リングが目標より大きいうちに押すと早い、小さくなってから押すと遅い', () => {
    expect(tapDirection(msForRadius(RING_TARGET + 5))).toBe(-1);
    expect(tapDirection(msForRadius(RING_TARGET - 5))).toBe(1);
    expect(tapDirection(PERFECT_MS)).toBe(0);
  });

  it('PERFECT は傾かない。早いと左回り（マイナス）、遅いと右回り（プラス）', () => {
    expect(tiltFor('perfect', -1)).toBe(0);
    expect(tiltFor('perfect', 1)).toBe(0);
    expect(tiltFor('good', -1)).toBe(-TACK_TILT_GOOD);
    expect(tiltFor('good', 1)).toBe(TACK_TILT_GOOD);
    expect(tiltFor('bad', 1)).toBe(TACK_TILT_BAD);
    expect(tiltFor('miss', -1)).toBe(-TACK_TILT_MISS);
  });

  it('4隅の合計がフィルムの角度。早い・遅いは打ち消し合う', () => {
    expect(filmAngle([tiltFor('good', -1), tiltFor('good', 1), 0, 0])).toBe(0);
    expect(filmAngle([tiltFor('bad', 1), tiltFor('good', 1), 0, tiltFor('good', -1)])).toBeCloseTo(TACK_TILT_BAD);
  });
});

describe('仮固定の品質（T-3）', () => {
  it('1 − 角度の大きさ ÷ 許容角度。まっすぐなら1', () => {
    expect(tackQuality(0)).toBe(1);
    expect(tackQuality(3, 6)).toBeCloseTo(0.5);
    expect(tackQuality(-3, 6)).toBeCloseTo(0.5);
  });

  it('許容角度以上は0で、0未満にはならない', () => {
    expect(tackQuality(TACK_TILT_TOLERANCE)).toBe(0);
    expect(tackQuality(TACK_TILT_TOLERANCE * 3)).toBe(0);
  });
});

describe('斜め貼り（T-4）', () => {
  it('角度の大きさが規定以上で斜め貼り。向きは関係ない', () => {
    expect(isTilted(TACK_TILT_LIMIT)).toBe(true);
    expect(isTilted(-TACK_TILT_LIMIT)).toBe(true);
    expect(isTilted(TACK_TILT_LIMIT - 0.01)).toBe(false);
    expect(isTilted(0)).toBe(false);
  });
});
