import type { Area } from '../phone';
import { randRange, type Rng } from './random';

export const BUBBLE_COUNT = 6;
/** 指の半径。気泡の縁にこの距離まで近づくと押せる */
export const FINGER_RADIUS = 10;
const EDGE_MARGIN = 24;
const MIN_GAP = 34;

export interface Bubble {
  id: number;
  x: number;
  y: number;
  r: number;
  out: boolean;
}

export function createBubbles(area: Area, rng: Rng, count = BUBBLE_COUNT): Bubble[] {
  const bubbles: Bubble[] = [];
  let tries = 0;
  while (bubbles.length < count && tries < 500) {
    tries++;
    const r = randRange(rng, 6, 14);
    const x = randRange(rng, area.x + EDGE_MARGIN + r, area.x + area.w - EDGE_MARGIN - r);
    const y = randRange(rng, area.y + EDGE_MARGIN + r + 20, area.y + area.h - EDGE_MARGIN - r);
    if (bubbles.some((b) => Math.hypot(b.x - x, b.y - y) < MIN_GAP + b.r + r)) continue;
    bubbles.push({ id: bubbles.length, x, y, r, out: false });
  }
  return bubbles;
}

function isOutside(b: Bubble, area: Area): boolean {
  return b.x < area.x || b.x > area.x + area.w || b.y < area.y || b.y > area.y + area.h;
}

/**
 * 指が (x0,y0)→(x1,y1) に動いたとき、指先に触れている気泡を同じだけ押し進める。
 * 中心が画面の外に出た気泡は抜けたことにする。押した気泡を返す。
 */
export function pushBubbles(
  bubbles: Bubble[],
  area: Area,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  finger = FINGER_RADIUS,
): Bubble[] {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const pushed: Bubble[] = [];
  for (const b of bubbles) {
    if (b.out) continue;
    if (Math.hypot(b.x - x1, b.y - y1) > b.r + finger) continue;
    b.x += dx;
    b.y += dy;
    if (isOutside(b, area)) b.out = true;
    pushed.push(b);
  }
  return pushed;
}

/** 抜けた気泡の面積の割合（大きい気泡ほど重い） */
export function bubbleQuality(bubbles: readonly Bubble[]): number {
  const total = bubbles.reduce((s, b) => s + b.r * b.r, 0);
  if (total === 0) return 1;
  return bubbles.filter((b) => b.out).reduce((s, b) => s + b.r * b.r, 0) / total;
}
