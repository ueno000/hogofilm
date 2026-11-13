import { describe, expect, it } from 'vitest';
import { createDust, DUST_COUNT, dustQuality, hitDust, type Dust } from '../../src/stages/logic/dust';
import { seededRng } from '../../src/stages/logic/random';
import { SCREEN } from '../../src/stages/phone';

const dust = (id: number, x: number, y: number, r = 2): Dust => ({ id, x, y, r, removed: false });

describe('dust', () => {
  it('指定数の埃を画面内に、重ならないように置く', () => {
    const ds = createDust(SCREEN, seededRng(42));
    expect(ds).toHaveLength(DUST_COUNT);
    for (const d of ds) {
      expect(d.x).toBeGreaterThan(SCREEN.x);
      expect(d.x).toBeLessThan(SCREEN.x + SCREEN.w);
      expect(d.y).toBeGreaterThan(SCREEN.y);
      expect(d.y).toBeLessThan(SCREEN.y + SCREEN.h);
    }
  });

  it('当たり判定は埃の半径＋余裕まで。外れは undefined', () => {
    const ds = [dust(0, 50, 50, 2)];
    expect(hitDust(ds, 50 + 2 + 10, 50, 10)?.id).toBe(0);
    expect(hitDust(ds, 50 + 2 + 11, 50, 10)).toBeUndefined();
  });

  it('重なり判定では一番近い埃を取る。取った埃は再ヒットしない', () => {
    const ds = [dust(0, 50, 50), dust(1, 60, 50)];
    const hit = hitDust(ds, 58, 50, 14)!;
    expect(hit.id).toBe(1);
    hit.removed = true;
    expect(hitDust(ds, 58, 50, 14)?.id).toBe(0);
  });

  it('品質は取れた割合', () => {
    const ds = [dust(0, 0, 0), dust(1, 0, 0), dust(2, 0, 0), dust(3, 0, 0)];
    expect(dustQuality(ds)).toBe(0);
    ds[0].removed = ds[1].removed = ds[2].removed = true;
    expect(dustQuality(ds)).toBe(0.75);
  });
});
