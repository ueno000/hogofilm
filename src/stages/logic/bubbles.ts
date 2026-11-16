import type { Area } from '../phone';
import { clamp, randRange, type Rng } from './random';
import { param } from '../../game/params';

export const BUBBLE_COUNT = param('BUBBLE_COUNT');
/** 指の半径。気泡の縁にこの距離まで近づくと押せる */
export const FINGER_RADIUS = param('FINGER_RADIUS');
/** 気泡を押す指がこの速さ（SVG 座標/秒）を超えると、気泡が2つに割れる（B-1） */
export const BUBBLE_SPLIT_SPEED = param('BUBBLE_SPLIT_SPEED');
/** これより小さい半径の気泡は割れない（SVG 座標単位） */
export const BUBBLE_SPLIT_MIN_R = param('BUBBLE_SPLIT_MIN_R');
/** 押している途中で指を離したときに気泡が戻る距離（SVG 座標単位）（B-2） */
export const BUBBLE_RETURN_DIST = param('BUBBLE_RETURN_DIST');
/** 気泡が戻りきるまでの時間（ms） */
export const BUBBLE_RETURN_MS = param('BUBBLE_RETURN_MS');
const EDGE_MARGIN = 24;
const MIN_GAP = 34;
/** 速さを求めるときの最短の時間（ms）。同じ時刻に届いた動きで速さが無限大にならないように */
const MIN_MOVE_MS = 8;

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

/** 指の速さ（SVG 座標/秒） */
export function fingerSpeed(dx: number, dy: number, dtMs: number): number {
  return (Math.hypot(dx, dy) / Math.max(dtMs, MIN_MOVE_MS)) * 1000;
}

/**
 * 気泡を2つに割る（B-1）。面積を半分ずつにし（半径 r/√2）、指の進む向きの左右に少しずらして置く。
 * もとの気泡を片方にして、もう片方を新しく足して返す。割れない大きさなら undefined。
 */
export function splitBubble(
  bubbles: Bubble[],
  b: Bubble,
  area: Area,
  dirX: number,
  dirY: number,
  finger = FINGER_RADIUS,
): Bubble | undefined {
  if (b.out || b.r < BUBBLE_SPLIT_MIN_R) return undefined;
  const len = Math.hypot(dirX, dirY) || 1;
  // 進む向きに直交する向き（指の左右）
  const px = -dirY / len;
  const py = dirX / len;
  const r = b.r / Math.SQRT2;
  // 指のすぐ外に出して、割れた直後にそのまま押されないようにする
  const off = r + finger + 1;
  const twin: Bubble = { id: bubbles.length, x: b.x - px * off, y: b.y - py * off, r, out: false };
  b.x += px * off;
  b.y += py * off;
  b.r = r;
  if (isOutside(b, area)) b.out = true;
  if (isOutside(twin, area)) twin.out = true;
  bubbles.push(twin);
  return twin;
}

export interface PushResult {
  /** 指と同じだけ押し進めた気泡 */
  pushed: Bubble[];
  /** 割れてできた気泡（もとの気泡だった片方と、新しく足した片方の両方） */
  split: Bubble[];
}

/**
 * 指が (x0,y0)→(x1,y1) に dtMs かけて動いたとき、指先に触れている気泡を同じだけ押し進める。
 * 指が速すぎると、触れている気泡は押されずに2つに割れる（小さすぎる気泡は割れずに押される）。
 * 中心が画面の外に出た気泡は抜けたことにする。
 */
export function pushBubbles(
  bubbles: Bubble[],
  area: Area,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  dtMs: number,
  finger = FINGER_RADIUS,
): PushResult {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const tooFast = fingerSpeed(dx, dy, dtMs) > BUBBLE_SPLIT_SPEED;
  const result: PushResult = { pushed: [], split: [] };
  // 割れて増えた気泡は、この動きでは扱わない
  for (const b of bubbles.slice()) {
    if (b.out) continue;
    if (Math.hypot(b.x - x1, b.y - y1) > b.r + finger) continue;
    if (tooFast) {
      const twin = splitBubble(bubbles, b, area, dx, dy, finger);
      if (twin) {
        result.split.push(b, twin);
        continue;
      }
    }
    b.x += dx;
    b.y += dy;
    if (isOutside(b, area)) b.out = true;
    result.pushed.push(b);
  }
  return result;
}

/** 指を離したときに戻る気泡の動き（B-2） */
export interface BubbleReturn {
  id: number;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
}

/**
 * 指を離した点 (x,y) にまだ触れていて、この押し込みで押していた気泡を、押していた向きと逆へ戻す。
 * pushDir は気泡ごとの最後に押した向き。画面の外に出た気泡は戻さない。戻り先は画面の中に収める。
 */
export function releaseBubbles(
  bubbles: readonly Bubble[],
  area: Area,
  x: number,
  y: number,
  pushDir: ReadonlyMap<number, { x: number; y: number }>,
  finger = FINGER_RADIUS,
  dist = BUBBLE_RETURN_DIST,
): BubbleReturn[] {
  const returns: BubbleReturn[] = [];
  for (const b of bubbles) {
    if (b.out) continue;
    const dir = pushDir.get(b.id);
    if (!dir) continue;
    if (Math.hypot(b.x - x, b.y - y) > b.r + finger) continue;
    const len = Math.hypot(dir.x, dir.y);
    if (len === 0) continue;
    returns.push({
      id: b.id,
      fromX: b.x,
      fromY: b.y,
      toX: clamp(b.x - (dir.x / len) * dist, area.x + b.r, area.x + area.w - b.r),
      toY: clamp(b.y - (dir.y / len) * dist, area.y + b.r, area.y + area.h - b.r),
    });
  }
  return returns;
}

/** 戻り始めてから elapsedMs 後の位置。だんだんゆっくりになって止まる */
export function returnPosition(ret: BubbleReturn, elapsedMs: number, durationMs = BUBBLE_RETURN_MS): { x: number; y: number } {
  const t = durationMs > 0 ? clamp(elapsedMs / durationMs, 0, 1) : 1;
  const e = 1 - (1 - t) * (1 - t);
  return { x: ret.fromX + (ret.toX - ret.fromX) * e, y: ret.fromY + (ret.toY - ret.fromY) * e };
}

/** 抜けた気泡の面積の割合（大きい気泡ほど重い）。割れた気泡も面積で数える（B-4） */
export function bubbleQuality(bubbles: readonly Bubble[]): number {
  const total = bubbles.reduce((s, b) => s + b.r * b.r, 0);
  if (total === 0) return 1;
  return bubbles.filter((b) => b.out).reduce((s, b) => s + b.r * b.r, 0) / total;
}
