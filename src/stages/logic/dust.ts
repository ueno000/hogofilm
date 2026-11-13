import type { Area } from '../phone';
import { clamp, randRange, type Rng } from './random';
import { param } from '../../game/params';

/** 最初に置く埃の数。そのあとは1個ずつ降り続ける（D-1） */
export const DUST_COUNT = param('DUST_COUNT');
/** 埃の当たり判定に足す余裕（小さい埃もタップしやすく）。SVG 座標単位。 */
export const DUST_HIT_MARGIN = param('DUST_HIT_MARGIN');
/** 埃が降ってくる間隔。開始時（ms） */
export const DUST_SPAWN_START = param('DUST_SPAWN_START');
/** 埃が降ってくる間隔の最短（ms） */
export const DUST_SPAWN_MIN = param('DUST_SPAWN_MIN');
/** 開始から最短の間隔になるまでの時間（ms）（D-2） */
export const DUST_SPAWN_RAMP_MS = param('DUST_SPAWN_RAMP_MS');
/** 「貼り始める」を押したときに残っている埃1個あたりの減点（D-5） */
export const DUST_PENALTY = param('DUST_PENALTY');
const EDGE_MARGIN = 14;
const MIN_GAP = 26;
/** 他の埃と離れた場所を探す回数。見つからなければ重なりを許して置く */
const PLACE_TRIES = 30;

export interface Dust {
  id: number;
  x: number;
  y: number;
  r: number;
  removed: boolean;
}

function randomSpot(dusts: readonly Dust[], area: Area, rng: Rng): { x: number; y: number } {
  let spot = { x: 0, y: 0 };
  for (let t = 0; t < PLACE_TRIES; t++) {
    spot = {
      x: randRange(rng, area.x + EDGE_MARGIN, area.x + area.w - EDGE_MARGIN),
      y: randRange(rng, area.y + EDGE_MARGIN + 20, area.y + area.h - EDGE_MARGIN),
    };
    if (!dusts.some((d) => !d.removed && Math.hypot(d.x - spot.x, d.y - spot.y) < MIN_GAP)) break;
  }
  return spot;
}

/** 埃を1個増やして返す。他の残っている埃となるべく重ならない場所に置く */
export function spawnDust(dusts: Dust[], area: Area, rng: Rng): Dust {
  const { x, y } = randomSpot(dusts, area, rng);
  const d: Dust = { id: dusts.length, x, y, r: randRange(rng, 1.5, 4), removed: false };
  dusts.push(d);
  return d;
}

/** 工程の開始時に置く埃 */
export function createDust(area: Area, rng: Rng, count = DUST_COUNT): Dust[] {
  const dusts: Dust[] = [];
  for (let i = 0; i < count; i++) spawnDust(dusts, area, rng);
  return dusts;
}

/** 工程の開始からの経過時間に応じた、次の埃が降ってくるまでの間隔（だんだん短くなる） */
export function spawnInterval(elapsedMs: number): number {
  const t = clamp(elapsedMs / DUST_SPAWN_RAMP_MS, 0, 1);
  return DUST_SPAWN_START + (DUST_SPAWN_MIN - DUST_SPAWN_START) * t;
}

/** タップ位置に一番近い、まだ残っている埃（判定内のもの）を返す。 */
export function hitDust(dusts: readonly Dust[], x: number, y: number, margin = DUST_HIT_MARGIN): Dust | undefined {
  let best: Dust | undefined;
  let bestDist = Infinity;
  for (const d of dusts) {
    if (d.removed) continue;
    const dist = Math.hypot(d.x - x, d.y - y);
    if (dist <= d.r + margin && dist < bestDist) {
      best = d;
      bestDist = dist;
    }
  }
  return best;
}

export function remainingDust(dusts: readonly Dust[]): number {
  return dusts.filter((d) => !d.removed).length;
}

/**
 * 品質（D-5）: 「貼り始める」を押した瞬間に残っている埃の数で決める。
 * 1 − 残りの数 × 減点（0未満にはしない）
 */
export function dustQuality(dusts: readonly Dust[]): number {
  return Math.max(0, 1 - remainingDust(dusts) * DUST_PENALTY);
}
