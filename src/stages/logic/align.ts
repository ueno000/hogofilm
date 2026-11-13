import { clamp, type Rng } from './random';

/** 方向ボタン1回で動く量（SVG 座標単位） */
export const ALIGN_STEP = 3;
/** 開始時のずれの最大段数 */
export const ALIGN_MAX_START_STEPS = 6;
/** 動かせる範囲（段数） */
export const ALIGN_LIMIT_STEPS = 10;
/** このずれ量で品質 0 */
export const ALIGN_TOLERANCE = 18;

export type Direction = 'up' | 'down' | 'left' | 'right';

/** ずれは段数（整数）で持つ。0,0 でぴったり。 */
export interface AlignState {
  sx: number;
  sy: number;
}

export function createAlign(rng: Rng): AlignState {
  const pick = () => Math.round((rng() * 2 - 1) * ALIGN_MAX_START_STEPS);
  let s = { sx: pick(), sy: pick() };
  // 最初から合っていると工程にならないので、最低2段はずらす
  if (Math.abs(s.sx) + Math.abs(s.sy) < 2) s = { sx: s.sx >= 0 ? 2 : -2, sy: s.sy };
  return s;
}

const DELTA: Record<Direction, [number, number]> = {
  up: [0, -1],
  down: [0, 1],
  left: [-1, 0],
  right: [1, 0],
};

export function moveFilm(s: AlignState, dir: Direction): AlignState {
  const [dx, dy] = DELTA[dir];
  return {
    sx: clamp(s.sx + dx, -ALIGN_LIMIT_STEPS, ALIGN_LIMIT_STEPS),
    sy: clamp(s.sy + dy, -ALIGN_LIMIT_STEPS, ALIGN_LIMIT_STEPS),
  };
}

export function alignError(s: AlignState): number {
  return Math.hypot(s.sx, s.sy) * ALIGN_STEP;
}

export function alignQuality(s: AlignState): number {
  return clamp(1 - alignError(s) / ALIGN_TOLERANCE, 0, 1);
}

export type AlignLabel = 'ぴったり' | 'ほぼOK' | '少しずれ' | '大きくずれ';

export function alignLabel(s: AlignState): AlignLabel {
  const e = alignError(s);
  if (e === 0) return 'ぴったり';
  if (e <= ALIGN_STEP) return 'ほぼOK';
  if (e <= ALIGN_STEP * 3) return '少しずれ';
  return '大きくずれ';
}
