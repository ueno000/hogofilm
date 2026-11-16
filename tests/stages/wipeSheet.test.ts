import { describe, expect, it } from 'vitest';
import { SHEET_MAX_TILT, sheetTilt, wetMarks } from '../../src/stages/logic/wipeSheet';

describe('ウェットシートの傾き', () => {
  it('右へ動かすと右（正）に、左へ動かすと左（負）に傾く', () => {
    expect(sheetTilt(0, 4)).toBeGreaterThan(0);
    expect(sheetTilt(0, -4)).toBeLessThan(0);
  });

  it('動かし続けても、最大の角度を超えない', () => {
    let t = 0;
    for (let i = 0; i < 50; i++) t = sheetTilt(t, 100);
    expect(t).toBeLessThanOrEqual(SHEET_MAX_TILT);
    expect(t).toBeCloseTo(SHEET_MAX_TILT, 3);
  });

  it('横に動かさなければ、だんだんまっすぐに戻る', () => {
    let t = SHEET_MAX_TILT;
    for (let i = 0; i < 30; i++) t = sheetTilt(t, 0);
    expect(Math.abs(t)).toBeLessThan(0.1);
  });
});

describe('拭いた跡の濡れた光りを置く点', () => {
  it('動いた線の上に、決まった間隔で置く', () => {
    const { points, carry } = wetMarks(0, 0, 10, 0, 4);
    expect(points).toEqual([{ x: 4, y: 0 }, { x: 8, y: 0 }]);
    expect(carry).toBeCloseTo(2);
  });

  it('前の動きで余った距離を持ち越して、間隔がそろう', () => {
    const first = wetMarks(0, 0, 3, 0, 4);
    expect(first.points).toEqual([]);
    const second = wetMarks(3, 0, 6, 0, 4, first.carry);
    expect(second.points).toEqual([{ x: 4, y: 0 }]);
    expect(second.carry).toBeCloseTo(2);
  });

  it('動いていなければ置かない', () => {
    expect(wetMarks(5, 5, 5, 5, 4).points).toEqual([]);
  });
});
