import type { Area } from '../phone';
import { randRange, type Rng } from './random';

export const WIPE_COLS = 10;
export const WIPE_ROWS = 20;
/** 指（ウェットシート）の半径。SVG 座標単位。 */
export const WIPE_RADIUS = 16;
/** 拭けた割合がここに届くと品質 1 */
export const WIPE_DONE = 0.95;
/** 汚れの最大段数。しつこい汚れほど何度もこする必要がある */
export const WIPE_MAX_DIRT = 3;
/** しつこい汚れの塊の数 */
export const WIPE_BLOB_COUNT = 5;
/** 塊の半径の範囲（SVG 座標単位） */
const BLOB_RADIUS_MIN = 30;
const BLOB_RADIUS_MAX = 55;
/** 塊の中心からこの割合の距離までは最大段数 */
const BLOB_CORE = 0.45;
/**
 * 指が離れたとみなす半径の倍率。
 * 半径の縁で細かく出入りしても、こする回数が増えないようにする。
 */
const RELEASE_SCALE = 1.25;

export interface WipeState {
  area: Area;
  cols: number;
  rows: number;
  /** マスごとの汚れの残り段数（0 = きれい） */
  dirt: number[];
  /** いま指が触れているマス。新しく触れた瞬間を「1回こすった」と数える */
  touching: Set<number>;
}

/** 全体を1段の汚れにし、ところどころにしつこい汚れ（2〜3段）の塊を置く。 */
export function createWipe(area: Area, rng: Rng, cols = WIPE_COLS, rows = WIPE_ROWS): WipeState {
  const s: WipeState = { area, cols, rows, dirt: new Array(cols * rows).fill(1), touching: new Set() };
  for (let b = 0; b < WIPE_BLOB_COUNT; b++) {
    const bx = randRange(rng, area.x, area.x + area.w);
    const by = randRange(rng, area.y, area.y + area.h);
    const br = randRange(rng, BLOB_RADIUS_MIN, BLOB_RADIUS_MAX);
    for (let i = 0; i < s.dirt.length; i++) {
      const c = cellCenter(s, i);
      const d = Math.hypot(c.x - bx, c.y - by) / br;
      const level = d <= BLOB_CORE ? WIPE_MAX_DIRT : d <= 1 ? WIPE_MAX_DIRT - 1 : 1;
      s.dirt[i] = Math.max(s.dirt[i], level);
    }
  }
  return s;
}

export function cellCenter(s: WipeState, i: number): { x: number; y: number } {
  const cw = s.area.w / s.cols;
  const ch = s.area.h / s.rows;
  return { x: s.area.x + ((i % s.cols) + 0.5) * cw, y: s.area.y + (Math.floor(i / s.cols) + 0.5) * ch };
}

/** 指を置いたとき・離したときに呼ぶ。触れているマスの記録を消す。 */
export function beginStroke(s: WipeState): void {
  s.touching.clear();
}

export function endStroke(s: WipeState): void {
  s.touching.clear();
}

/**
 * 指が (x, y) にあるときの処理。半径内に新しく入ったマスを1回こすり、汚れを1段減らす。
 * 汚れが減ったマスの数を返す。
 */
export function rubAt(s: WipeState, x: number, y: number, radius = WIPE_RADIUS): number {
  let reduced = 0;
  const release = radius * RELEASE_SCALE;
  for (let i = 0; i < s.dirt.length; i++) {
    const c = cellCenter(s, i);
    const dist = Math.hypot(c.x - x, c.y - y);
    if (s.touching.has(i)) {
      if (dist > release) s.touching.delete(i);
      continue;
    }
    if (dist > radius) continue;
    s.touching.add(i);
    if (s.dirt[i] > 0) {
      s.dirt[i] -= 1;
      reduced++;
    }
  }
  return reduced;
}

/** 素早いドラッグでも隙間ができないよう、線分上を細かく調べる。 */
export function rubLine(s: WipeState, x0: number, y0: number, x1: number, y1: number, radius = WIPE_RADIUS): number {
  const dist = Math.hypot(x1 - x0, y1 - y0);
  const steps = Math.max(1, Math.ceil(dist / (radius / 2)));
  let reduced = 0;
  for (let k = 1; k <= steps; k++) {
    const t = k / steps;
    reduced += rubAt(s, x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, radius);
  }
  return reduced;
}

/** 汚れが完全に落ちたマスの割合 */
export function cleanRatio(s: WipeState): number {
  return s.dirt.filter((d) => d === 0).length / s.dirt.length;
}

/** 完了ラインに届いたら品質 1。それ未満は届いた割合。 */
export function wipeQuality(s: WipeState): number {
  return Math.min(1, cleanRatio(s) / WIPE_DONE);
}
