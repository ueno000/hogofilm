import { describe, expect, it } from 'vitest';
import {
  ALIGN_LIMIT_STEPS,
  ALIGN_STEP,
  ALIGN_TOLERANCE,
  alignLabel,
  alignQuality,
  createAlign,
  moveFilm,
} from '../../src/stages/logic/align';
import { seededRng } from '../../src/stages/logic/random';

describe('align', () => {
  it('開始時は必ずずれている', () => {
    for (let seed = 1; seed < 200; seed++) {
      const s = createAlign(seededRng(seed));
      expect(Math.abs(s.sx) + Math.abs(s.sy)).toBeGreaterThanOrEqual(2);
    }
    expect(alignLabel(createAlign(() => 0.5))).not.toBe('ぴったり');
  });

  it('方向ボタンで1段ずつ動き、ぴったりに戻せる', () => {
    let s = { sx: 1, sy: -2 };
    s = moveFilm(s, 'left');
    s = moveFilm(s, 'down');
    s = moveFilm(s, 'down');
    expect(s).toEqual({ sx: 0, sy: 0 });
    expect(alignQuality(s)).toBe(1);
    expect(alignLabel(s)).toBe('ぴったり');
  });

  it('動かせる範囲で止まる', () => {
    let s = { sx: ALIGN_LIMIT_STEPS, sy: 0 };
    s = moveFilm(s, 'right');
    expect(s.sx).toBe(ALIGN_LIMIT_STEPS);
  });

  it('ずれ量に応じて品質が下がり、許容量で0', () => {
    expect(alignQuality({ sx: 1, sy: 0 })).toBeCloseTo(1 - ALIGN_STEP / ALIGN_TOLERANCE);
    expect(alignQuality({ sx: ALIGN_TOLERANCE / ALIGN_STEP, sy: 0 })).toBe(0);
    expect(alignQuality({ sx: 10, sy: 10 })).toBe(0);
  });
});
