import type { Area } from '../phone';
import { randRange, type Rng } from './random';

export const DUST_COUNT = 7;
/** 埃の当たり判定に足す余裕（小さい埃もタップしやすく）。SVG 座標単位。 */
export const DUST_HIT_MARGIN = 14;
const EDGE_MARGIN = 14;
const MIN_GAP = 26;

export interface Dust {
  id: number;
  x: number;
  y: number;
  r: number;
  removed: boolean;
}

export function createDust(area: Area, rng: Rng, count = DUST_COUNT): Dust[] {
  const dusts: Dust[] = [];
  let tries = 0;
  while (dusts.length < count && tries < 500) {
    tries++;
    const x = randRange(rng, area.x + EDGE_MARGIN, area.x + area.w - EDGE_MARGIN);
    const y = randRange(rng, area.y + EDGE_MARGIN + 20, area.y + area.h - EDGE_MARGIN);
    if (dusts.some((d) => Math.hypot(d.x - x, d.y - y) < MIN_GAP)) continue;
    dusts.push({ id: dusts.length, x, y, r: randRange(rng, 1.5, 4), removed: false });
  }
  return dusts;
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

export function dustQuality(dusts: readonly Dust[]): number {
  if (dusts.length === 0) return 1;
  return dusts.filter((d) => d.removed).length / dusts.length;
}
