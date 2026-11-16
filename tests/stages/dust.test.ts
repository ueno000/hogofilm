import { describe, expect, it } from 'vitest';
import {
  createDust,
  DUST_COUNT,
  DUST_PENALTY,
  DUST_SPAWN_MIN,
  DUST_SPAWN_RAMP_MS,
  DUST_SPAWN_START,
  DUST_STICKER_RADIUS,
  dustQuality,
  remainingDust,
  spawnDust,
  spawnInterval,
  stickDust,
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

describe('埃取りシール（D-6）', () => {
  it('押した点を中心に、円の中にある埃をまとめて取る', () => {
    const ds = [dust(0, 50, 50), dust(1, 60, 55), dust(2, 50, 50 + 20), dust(3, 50, 50 + 21)];
    const picked = stickDust(ds, 50, 50, 20);
    expect(picked.map((d) => d.id)).toEqual([0, 1, 2]);
    expect(ds.map((d) => d.removed)).toEqual([true, true, true, false]);
  });

  it('円の中に埃がなければ何も取らない', () => {
    const ds = [dust(0, 10, 10)];
    expect(stickDust(ds, 100, 100, 20)).toEqual([]);
    expect(ds[0].removed).toBe(false);
  });

  it('取った埃は、もう一度押しても取れない（残りの数に入らない）', () => {
    const ds = [dust(0, 50, 50), dust(1, 150, 150)];
    stickDust(ds, 50, 50, 20);
    expect(stickDust(ds, 50, 50, 20)).toEqual([]);
    expect(remainingDust(ds)).toBe(1);
  });

  it('半径は調整値 DUST_STICKER_RADIUS を使う', () => {
    const ds = [dust(0, 50 + DUST_STICKER_RADIUS, 50), dust(1, 50 + DUST_STICKER_RADIUS + 1, 50)];
    expect(stickDust(ds, 50, 50).map((d) => d.id)).toEqual([0]);
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
