import { describe, expect, it } from 'vitest';
import {
  createDust,
  DUST_COUNT,
  DUST_PENALTY,
  DUST_SPAWN_MIN,
  DUST_SPAWN_RAMP_MS,
  DUST_SPAWN_START,
  dustQuality,
  hitDust,
  remainingDust,
  spawnDust,
  spawnInterval,
  type Dust,
} from '../../src/stages/logic/dust';
import { seededRng } from '../../src/stages/logic/random';
import { SCREEN } from '../../src/stages/phone';

const dust = (id: number, x: number, y: number, r = 2): Dust => ({ id, x, y, r, removed: false });
const inScreen = (d: Dust) =>
  d.x > SCREEN.x && d.x < SCREEN.x + SCREEN.w && d.y > SCREEN.y && d.y < SCREEN.y + SCREEN.h;

describe('埃の配置', () => {
  it('最初は指定数の埃を画面内に置く', () => {
    const ds = createDust(SCREEN, seededRng(42));
    expect(ds).toHaveLength(DUST_COUNT);
    expect(ds.every(inScreen)).toBe(true);
  });

  it('降ってくる埃を1個ずつ足せる。番号は重ならない', () => {
    const rng = seededRng(3);
    const ds = createDust(SCREEN, rng);
    for (let i = 0; i < 50; i++) spawnDust(ds, SCREEN, rng);
    expect(ds).toHaveLength(DUST_COUNT + 50);
    expect(new Set(ds.map((d) => d.id)).size).toBe(ds.length);
    expect(ds.every(inScreen)).toBe(true);
  });
});

describe('降ってくる間隔', () => {
  it('開始時の間隔から、だんだん短くなって最短で止まる', () => {
    expect(spawnInterval(0)).toBe(DUST_SPAWN_START);
    expect(spawnInterval(DUST_SPAWN_RAMP_MS / 2)).toBeCloseTo((DUST_SPAWN_START + DUST_SPAWN_MIN) / 2);
    expect(spawnInterval(DUST_SPAWN_RAMP_MS)).toBe(DUST_SPAWN_MIN);
    expect(spawnInterval(DUST_SPAWN_RAMP_MS * 3)).toBe(DUST_SPAWN_MIN);
  });
});

describe('タップ', () => {
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
});

describe('品質', () => {
  it('残りが0個なら1', () => {
    const ds = [dust(0, 0, 0), dust(1, 0, 0)];
    ds.forEach((d) => (d.removed = true));
    expect(remainingDust(ds)).toBe(0);
    expect(dustQuality(ds)).toBe(1);
  });

  it('1 − 残りの数 × 減点。取った数は関係ない', () => {
    const ds = [dust(0, 0, 0), dust(1, 0, 0), dust(2, 0, 0)];
    ds[0].removed = true;
    expect(dustQuality(ds)).toBeCloseTo(1 - 2 * DUST_PENALTY);
  });

  it('残りが多くても0未満にならない', () => {
    const ds = Array.from({ length: 30 }, (_, i) => dust(i, 0, 0));
    expect(dustQuality(ds)).toBe(0);
  });
});
