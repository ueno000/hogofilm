import { clamp, randRange, type Rng } from './random';
import { param } from '../../game/params';

/** 短くタップしたときに動く量（SVG 座標単位）（A-1） */
export const ALIGN_TAP_STEP = param('ALIGN_TAP_STEP');
/** 長押しで動き出すまでの待ち時間（ms） */
export const ALIGN_HOLD_DELAY_MS = param('ALIGN_HOLD_DELAY_MS');
/** 長押しで動き出したときの速さ（SVG 座標/秒） */
export const ALIGN_HOLD_SPEED_START = param('ALIGN_HOLD_SPEED_START');
/** 長押しの最高速度（SVG 座標/秒） */
export const ALIGN_HOLD_SPEED_MAX = param('ALIGN_HOLD_SPEED_MAX');
/** 動き出してから最高速度になるまでの時間（ms） */
export const ALIGN_HOLD_ACCEL_MS = param('ALIGN_HOLD_ACCEL_MS');
/** 開始時のずれの最大（縦横それぞれ、SVG 座標単位）（A-2） */
export const ALIGN_START_MAX = param('ALIGN_START_MAX');
/** 動かせる範囲（縦横それぞれ、SVG 座標単位） */
export const ALIGN_LIMIT = param('ALIGN_LIMIT');
/** このずれ量で品質 0（SVG 座標単位） */
export const ALIGN_TOLERANCE = param('ALIGN_TOLERANCE');

/** 開始時のずれの最小（SVG 座標単位）。最初から合っていると工程にならない */
const MIN_START_ERROR = 8;

export type Direction = 'up' | 'down' | 'left' | 'right';

/** フィルムの位置。正しい位置からのずれを座標で持つ。0,0 でぴったり。 */
export interface AlignState {
  x: number;
  y: number;
}

/**
 * タップ1回分の量の整数倍から、半端にずらした値にする（A-2）。
 * 端数はタップ量の 0.25〜0.75 倍にして、回数を数えるだけでは 0 にできないようにする。
 */
function offAxis(rng: Rng): number {
  const steps = Math.floor(randRange(rng, 0, ALIGN_START_MAX / ALIGN_TAP_STEP));
  const frac = randRange(rng, 0.25, 0.75);
  const v = Math.min((steps + frac) * ALIGN_TAP_STEP, ALIGN_START_MAX);
  return rng() < 0.5 ? -v : v;
}

export function createAlign(rng: Rng): AlignState {
  let s = { x: offAxis(rng), y: offAxis(rng) };
  for (let t = 0; t < 20 && alignError(s) < MIN_START_ERROR; t++) s = { x: offAxis(rng), y: offAxis(rng) };
  if (alignError(s) < MIN_START_ERROR) s = { x: s.x < 0 ? -MIN_START_ERROR - 0.5 : MIN_START_ERROR + 0.5, y: s.y };
  return s;
}

const DELTA: Record<Direction, [number, number]> = {
  up: [0, -1],
  down: [0, 1],
  left: [-1, 0],
  right: [1, 0],
};

/** 指定の方向へ distance だけ動かす。動かせる範囲で止まる */
export function moveFilm(s: AlignState, dir: Direction, distance: number): AlignState {
  const [dx, dy] = DELTA[dir];
  return {
    x: clamp(s.x + dx * distance, -ALIGN_LIMIT, ALIGN_LIMIT),
    y: clamp(s.y + dy * distance, -ALIGN_LIMIT, ALIGN_LIMIT),
  };
}

/**
 * 押し始めてから heldMs 押し続けたときに動く合計の距離（A-1）。
 * 押した瞬間にタップ1回分動き、待ち時間を過ぎると動き出して、最高速度まで一定の割合で速くなる。
 */
export function holdDistance(heldMs: number): number {
  const u = Math.max(0, heldMs - ALIGN_HOLD_DELAY_MS);
  const a = ALIGN_HOLD_ACCEL_MS;
  const v0 = ALIGN_HOLD_SPEED_START / 1000;
  const v1 = ALIGN_HOLD_SPEED_MAX / 1000;
  const accel = a > 0 ? (v1 - v0) / a : 0;
  const ramp = Math.min(u, a);
  const moved = v0 * ramp + (accel * ramp * ramp) / 2 + v1 * Math.max(0, u - a);
  return ALIGN_TAP_STEP + moved;
}

/** 本当の位置のずれ量（A-5） */
export function alignError(s: AlignState): number {
  return Math.hypot(s.x, s.y);
}

/** 品質（A-5）: 1 − ずれ ÷ 許容量 */
export function alignQuality(s: AlignState): number {
  return clamp(1 - alignError(s) / ALIGN_TOLERANCE, 0, 1);
}
