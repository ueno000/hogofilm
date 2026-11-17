import { describe, expect, it } from 'vitest';
import {
  ALIGN_HOLD_ACCEL_MS,
  ALIGN_HOLD_DELAY_MS,
  ALIGN_HOLD_SPEED_MAX,
  ALIGN_HOLD_SPEED_START,
  ALIGN_LIMIT,
  ALIGN_SHAKE_VISUAL,
  ALIGN_START_MAX,
  ALIGN_TAP_STEP,
  ALIGN_TOLERANCE,
  alignError,
  alignQuality,
  createAlign,
  holdDistance,
  moveFilm,
  shakeOffset,
} from '../../src/stages/logic/align';
import { seededRng } from '../../src/stages/logic/random';

/** タップ量の整数倍からどれだけ離れているか（0〜0.5 倍） */
const offGrid = (v: number) => {
  const r = Math.abs(v) / ALIGN_TAP_STEP;
  return Math.abs(r - Math.round(r));
};

describe('開始時のずれ', () => {
  it('必ずずれていて、範囲内に収まる', () => {
    for (let seed = 1; seed < 300; seed++) {
      const s = createAlign(seededRng(seed));
      expect(alignError(s)).toBeGreaterThan(0);
      expect(alignQuality(s)).toBeLessThan(1);
      expect(Math.abs(s.x)).toBeLessThanOrEqual(ALIGN_START_MAX);
      expect(Math.abs(s.y)).toBeLessThanOrEqual(ALIGN_START_MAX);
    }
  });

  it('タップ量の整数倍にならない半端な値なので、回数を数えるだけでは0にできない', () => {
    for (let seed = 1; seed < 300; seed++) {
      const s = createAlign(seededRng(seed));
      expect(offGrid(s.x)).toBeGreaterThan(0.2);
      expect(offGrid(s.y)).toBeGreaterThan(0.2);
    }
  });
});

describe('動かし方', () => {
  it('短く押すとタップ1回分だけ動く', () => {
    expect(holdDistance(0)).toBe(ALIGN_TAP_STEP);
    expect(holdDistance(ALIGN_HOLD_DELAY_MS)).toBe(ALIGN_TAP_STEP);
  });

  it('長押しは待ち時間のあとで動き出し、だんだん速くなって最高速度で一定になる', () => {
    const d = (ms: number) => holdDistance(ALIGN_HOLD_DELAY_MS + ms);
    // 動き出した直後は開始時の速さ
    expect((d(0.01) - d(0)) / 0.01).toBeCloseTo(ALIGN_HOLD_SPEED_START / 1000, 4);
    // 加速の途中はだんだん速くなる
    expect(d(400) - d(300)).toBeGreaterThan(d(200) - d(100));
    // 最高速度に達したあとは一定
    const after = ALIGN_HOLD_ACCEL_MS + 100;
    expect((d(after + 100) - d(after)) / 100).toBeCloseTo(ALIGN_HOLD_SPEED_MAX / 1000, 6);
  });

  it('方向に応じて動き、動かせる範囲で止まる', () => {
    expect(moveFilm({ x: 0, y: 0 }, 'right', 2)).toEqual({ x: 2, y: 0 });
    expect(moveFilm({ x: 0, y: 0 }, 'up', 2)).toEqual({ x: 0, y: -2 });
    expect(moveFilm({ x: ALIGN_LIMIT - 1, y: 0 }, 'right', 5).x).toBe(ALIGN_LIMIT);
    expect(moveFilm({ x: 0, y: -ALIGN_LIMIT + 1 }, 'up', 5).y).toBe(-ALIGN_LIMIT);
  });
});

describe('品質', () => {
  it('1 − ずれ ÷ 許容量。ぴったりなら1、許容量以上は0', () => {
    expect(alignQuality({ x: 0, y: 0 })).toBe(1);
    expect(alignQuality({ x: 3, y: 4 })).toBeCloseTo(1 - 5 / ALIGN_TOLERANCE);
    expect(alignQuality({ x: ALIGN_TOLERANCE, y: 0 })).toBe(0);
    expect(alignQuality({ x: 30, y: 30 })).toBe(0);
  });
});

describe('手ブレ', () => {
  it('揺れは縦横それぞれ揺れ幅を超えず、時間とともに変わる', () => {
    const seen = new Set<string>();
    for (let t = 0; t < 10_000; t += 7) {
      const s = shakeOffset(t);
      expect(Math.abs(s.x)).toBeLessThanOrEqual(ALIGN_SHAKE_VISUAL + 1e-9);
      expect(Math.abs(s.y)).toBeLessThanOrEqual(ALIGN_SHAKE_VISUAL + 1e-9);
      seen.add(`${s.x.toFixed(2)},${s.y.toFixed(2)}`);
    }
    expect(seen.size).toBeGreaterThan(100);
  });

  it('揺れ幅が0なら揺れない', () => {
    expect(shakeOffset(1234, 0)).toEqual({ x: 0, y: 0 });
  });

  it('品質は揺れを含まない本当の位置で決まる', () => {
    const s = { x: 3, y: 4 };
    const before = alignQuality(s);
    for (let t = 0; t < 2000; t += 50) shakeOffset(t);
    expect(alignQuality(s)).toBe(before);
    expect(before).toBeCloseTo(1 - 5 / ALIGN_TOLERANCE);
  });
});
