import { clamp } from './random';
import { param } from '../../game/params';

/** 拭いた跡の濡れた光りが乾いて消えるまでの時間（ms）。見た目のみ（W-8） */
export const WIPE_SHEET_DRY_MS = param('WIPE_SHEET_DRY_MS');

/** ウェットシートの絵が傾く最大の角度（度） */
export const SHEET_MAX_TILT = 18;
/** 横に1動かしたときに目指す傾き（度 / SVG 座標単位） */
const SHEET_TILT_PER_UNIT = 2.5;
/** 目指す傾きへ1回の動きで近づく割合。急に向きが変わってもがたつかないようにする */
const SHEET_TILT_EASE = 0.35;

/**
 * ウェットシートの絵の傾き（度）。動かす向きに合わせて少し傾ける（W-8）。
 * 右へ動かすと右に、左へ動かすと左に傾き、止めるとまっすぐに戻っていく。
 */
export function sheetTilt(prevDeg: number, dx: number): number {
  const target = clamp(dx * SHEET_TILT_PER_UNIT, -SHEET_MAX_TILT, SHEET_MAX_TILT);
  return prevDeg + (target - prevDeg) * SHEET_TILT_EASE;
}

/**
 * 指が (x0,y0)→(x1,y1) に動いたとき、拭いた跡の濡れた光りを置く点。
 * 前に置いた点から spacing ごとに置く。carry は前回の動きで余った距離。
 * 置いた点と、次に持ち越す距離を返す。
 */
export function wetMarks(
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  spacing: number,
  carry = 0,
): { points: { x: number; y: number }[]; carry: number } {
  const dist = Math.hypot(x1 - x0, y1 - y0);
  const points: { x: number; y: number }[] = [];
  if (spacing <= 0 || dist === 0) return { points, carry: carry + dist };
  let d = spacing - carry;
  while (d <= dist) {
    const t = d / dist;
    points.push({ x: x0 + (x1 - x0) * t, y: y0 + (y1 - y0) * t });
    d += spacing;
  }
  return { points, carry: dist - (d - spacing) };
}
