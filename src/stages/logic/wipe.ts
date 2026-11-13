import type { Area } from '../phone';

export const WIPE_COLS = 10;
export const WIPE_ROWS = 20;
/** 指（ウェットシート）の半径。SVG 座標単位。 */
export const WIPE_RADIUS = 16;
/** この割合まで拭けたら工程完了 */
export const WIPE_DONE = 0.95;

export interface WipeState {
  area: Area;
  cols: number;
  rows: number;
  /** true = まだ汚れている */
  dirty: boolean[];
}

export function createWipe(area: Area, cols = WIPE_COLS, rows = WIPE_ROWS): WipeState {
  return { area, cols, rows, dirty: new Array(cols * rows).fill(true) };
}

function cellCenter(s: WipeState, i: number) {
  const cw = s.area.w / s.cols;
  const ch = s.area.h / s.rows;
  return { x: s.area.x + ((i % s.cols) + 0.5) * cw, y: s.area.y + (Math.floor(i / s.cols) + 0.5) * ch };
}

/** (x, y) を中心に半径内のマスを拭く。新しく拭けたマスの数を返す。 */
export function wipeAt(s: WipeState, x: number, y: number, radius = WIPE_RADIUS): number {
  let cleaned = 0;
  const r2 = radius * radius;
  for (let i = 0; i < s.dirty.length; i++) {
    if (!s.dirty[i]) continue;
    const c = cellCenter(s, i);
    if ((c.x - x) ** 2 + (c.y - y) ** 2 <= r2) {
      s.dirty[i] = false;
      cleaned++;
    }
  }
  return cleaned;
}

/** 素早いドラッグでも隙間ができないよう、線分上を細かく拭く。 */
export function wipeLine(s: WipeState, x0: number, y0: number, x1: number, y1: number, radius = WIPE_RADIUS): number {
  const dist = Math.hypot(x1 - x0, y1 - y0);
  const steps = Math.max(1, Math.ceil(dist / (radius / 2)));
  let cleaned = 0;
  for (let k = 0; k <= steps; k++) {
    const t = k / steps;
    cleaned += wipeAt(s, x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, radius);
  }
  return cleaned;
}

export function cleanRatio(s: WipeState): number {
  return s.dirty.filter((d) => !d).length / s.dirty.length;
}

/** 完了ラインに届いたら品質 1。それ未満は届いた割合。 */
export function wipeQuality(s: WipeState): number {
  return Math.min(1, cleanRatio(s) / WIPE_DONE);
}
