import { describe, expect, it } from 'vitest';
import {
  BUBBLE_COUNT,
  BUBBLE_RETURN_DIST,
  BUBBLE_RETURN_MS,
  BUBBLE_SPLIT_MIN_R,
  BUBBLE_SPLIT_SPEED,
  bubbleQuality,
  createBubbles,
  fingerSpeed,
  pushBubbles,
  releaseBubbles,
  returnPosition,
  type Bubble,
} from '../../src/stages/logic/bubbles';
import { seededRng } from '../../src/stages/logic/random';
import { SCREEN } from '../../src/stages/phone';

const AREA = { x: 0, y: 0, w: 100, h: 200 };
const bubble = (id: number, x: number, y: number, r: number): Bubble => ({ id, x, y, r, out: false });
const area = (bs: readonly Bubble[]) => bs.reduce((s, b) => s + b.r * b.r, 0);
/** 割れない、ゆっくりした動きにかける時間（5 動かすのに、割れる速さの半分になる時間） */
const SLOW_MS = (5 / (BUBBLE_SPLIT_SPEED / 2)) * 1000;
/** 割れる、速い動きにかける時間（5 動かすのに、割れる速さの2倍になる時間。最短の時間より長くする） */
const FAST_MS = Math.max(10, (5 / (BUBBLE_SPLIT_SPEED * 2)) * 1000);

describe('気泡の配置', () => {
  it('指定数の気泡を画面内に置く', () => {
    const bs = createBubbles(SCREEN, seededRng(7));
    expect(bs).toHaveLength(BUBBLE_COUNT);
    for (const b of bs) {
      expect(b.x - b.r).toBeGreaterThan(SCREEN.x);
      expect(b.x + b.r).toBeLessThan(SCREEN.x + SCREEN.w);
    }
  });
});

describe('押す', () => {
  it('ゆっくり押すと、指に触れている気泡だけ指と同じだけ動く', () => {
    const bs = [bubble(0, 50, 50, 8), bubble(1, 50, 150, 8)];
    const { pushed, split } = pushBubbles(bs, AREA, 40, 50, 45, 50, SLOW_MS, 10);
    expect(pushed.map((b) => b.id)).toEqual([0]);
    expect(split).toEqual([]);
    expect(bs[0].x).toBe(55);
    expect(bs[1].x).toBe(50);
  });

  it('中心が画面外に出たら抜けた扱い。抜けた気泡はもう動かない', () => {
    const bs = [bubble(0, 95, 100, 8)];
    pushBubbles(bs, AREA, 90, 100, 95, 100, SLOW_MS, 10);
    pushBubbles(bs, AREA, 95, 100, 100, 100, SLOW_MS, 10);
    expect(bs[0].out).toBe(true);
    const x = bs[0].x;
    pushBubbles(bs, AREA, 100, 100, 105, 100, SLOW_MS, 10);
    expect(bs[0].x).toBe(x);
  });

  it('指の速さは 動いた距離 ÷ 時間（秒）。時間が0でも無限大にならない', () => {
    expect(fingerSpeed(3, 4, 100)).toBeCloseTo(50);
    expect(Number.isFinite(fingerSpeed(3, 4, 0))).toBe(true);
  });
});

describe('割れる（B-1）', () => {
  it('速すぎると、触れている気泡は押されずに2つに割れる。面積は半分ずつ', () => {
    const bs = [bubble(0, 50, 50, 10)];
    const { pushed, split } = pushBubbles(bs, AREA, 40, 50, 45, 50, FAST_MS, 10);
    expect(pushed).toEqual([]);
    expect(bs).toHaveLength(2);
    expect(split.map((b) => b.id).sort()).toEqual([0, 1]);
    for (const b of bs) expect(b.r * b.r).toBeCloseTo(50);
    expect(area(bs)).toBeCloseTo(100);
  });

  it('割れた気泡は指の進む向きの左右（右へ動かしたら上下）に分かれる', () => {
    const bs = [bubble(0, 50, 50, 10)];
    pushBubbles(bs, AREA, 40, 50, 45, 50, FAST_MS, 10);
    const [a, b] = bs;
    expect(a.x).toBeCloseTo(50);
    expect(b.x).toBeCloseTo(50);
    expect(Math.sign(a.y - 50)).toBe(-Math.sign(b.y - 50));
    // 割れた直後に、同じ指でそのまま押されない位置に出る
    for (const x of bs) expect(Math.hypot(x.x - 45, x.y - 50)).toBeGreaterThan(x.r + 10);
  });

  it('小さすぎる気泡は割れずに押される', () => {
    const r = BUBBLE_SPLIT_MIN_R - 0.5;
    const bs = [bubble(0, 50, 50, r)];
    const { pushed, split } = pushBubbles(bs, AREA, 44, 50, 49, 50, FAST_MS, 10);
    expect(split).toEqual([]);
    expect(pushed.map((b) => b.id)).toEqual([0]);
    expect(bs).toHaveLength(1);
  });

  it('割れて小さくなった気泡も、割れる大きさならさらに割れる。面積の合計は変わらない', () => {
    const bs = [bubble(0, 50, 100, 12)];
    pushBubbles(bs, AREA, 40, 100, 45, 100, FAST_MS, 10);
    const half = bs[0];
    pushBubbles(bs, AREA, half.x - 10, half.y, half.x - 5, half.y, FAST_MS, 10);
    expect(bs).toHaveLength(3);
    expect(area(bs)).toBeCloseTo(144);
  });
});

describe('離すと戻る（B-2）', () => {
  it('押していて指に触れている気泡は、押していた向きと逆へ戻る', () => {
    const bs = [bubble(0, 50, 50, 8), bubble(1, 50, 150, 8)];
    const dirs = new Map([[0, { x: 5, y: 0 }], [1, { x: 5, y: 0 }]]);
    const rets = releaseBubbles(bs, AREA, 44, 50, dirs, 10);
    // 指から離れている気泡 1 は戻らない
    expect(rets.map((r) => r.id)).toEqual([0]);
    expect(rets[0].toX).toBeCloseTo(50 - BUBBLE_RETURN_DIST);
    expect(rets[0].toY).toBeCloseTo(50);
  });

  it('押していない気泡と、画面の外に出た気泡は戻らない', () => {
    const bs = [bubble(0, 50, 50, 8), bubble(1, 52, 50, 8)];
    bs[1].out = true;
    const rets = releaseBubbles(bs, AREA, 50, 50, new Map([[1, { x: 5, y: 0 }]]), 10);
    expect(rets).toEqual([]);
  });

  it('戻り先は画面の中に収める', () => {
    const bs = [bubble(0, 12, 50, 8)];
    const rets = releaseBubbles(bs, AREA, 10, 50, new Map([[0, { x: 5, y: 0 }]]), 10);
    expect(rets[0].toX).toBe(8);
  });

  it('戻る動きは決まった時間で戻りきり、それより先へは行かない', () => {
    const ret = { id: 0, fromX: 50, fromY: 50, toX: 38, toY: 50 };
    expect(returnPosition(ret, 0)).toEqual({ x: 50, y: 50 });
    const mid = returnPosition(ret, BUBBLE_RETURN_MS / 2).x;
    expect(mid).toBeLessThan(50);
    expect(mid).toBeGreaterThan(38);
    expect(returnPosition(ret, BUBBLE_RETURN_MS)).toEqual({ x: 38, y: 50 });
    expect(returnPosition(ret, BUBBLE_RETURN_MS * 3)).toEqual({ x: 38, y: 50 });
  });
});

describe('品質（B-4）', () => {
  it('抜けた気泡の面積割合', () => {
    const bs = [bubble(0, 0, 0, 10), bubble(1, 0, 0, 10)];
    expect(bubbleQuality(bs)).toBe(0);
    bs[0].out = true;
    expect(bubbleQuality(bs)).toBe(0.5);
    bs[1].out = true;
    expect(bubbleQuality(bs)).toBe(1);
  });

  it('割れた気泡も面積で数える。割れたこと自体では減点しない', () => {
    const bs = [bubble(0, 50, 100, 10), bubble(1, 20, 20, 10)];
    pushBubbles(bs, AREA, 40, 100, 45, 100, FAST_MS, 10);
    expect(bubbleQuality(bs)).toBe(0);
    // 割れた片方だけ抜けたら、元の気泡の半分（全体の1/4）
    bs.find((b) => b.id === 2)!.out = true;
    expect(bubbleQuality(bs)).toBeCloseTo(0.25);
  });
});
