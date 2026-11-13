import { describe, expect, it } from 'vitest';
import { BUBBLE_COUNT, bubbleQuality, createBubbles, pushBubbles, type Bubble } from '../../src/stages/logic/bubbles';
import { seededRng } from '../../src/stages/logic/random';
import { SCREEN } from '../../src/stages/phone';

const AREA = { x: 0, y: 0, w: 100, h: 200 };
const bubble = (id: number, x: number, y: number, r: number): Bubble => ({ id, x, y, r, out: false });

describe('bubbles', () => {
  it('指定数の気泡を画面内に置く', () => {
    const bs = createBubbles(SCREEN, seededRng(7));
    expect(bs).toHaveLength(BUBBLE_COUNT);
    for (const b of bs) {
      expect(b.x - b.r).toBeGreaterThan(SCREEN.x);
      expect(b.x + b.r).toBeLessThan(SCREEN.x + SCREEN.w);
    }
  });

  it('指に触れている気泡だけ、指と同じだけ動く', () => {
    const bs = [bubble(0, 50, 50, 8), bubble(1, 50, 150, 8)];
    const pushed = pushBubbles(bs, AREA, 40, 50, 45, 50, 10);
    expect(pushed.map((b) => b.id)).toEqual([0]);
    expect(bs[0].x).toBe(55);
    expect(bs[1].x).toBe(50);
  });

  it('中心が画面外に出たら抜けた扱い。抜けた気泡はもう動かない', () => {
    const bs = [bubble(0, 95, 100, 8)];
    pushBubbles(bs, AREA, 90, 100, 100, 100, 10);
    expect(bs[0].out).toBe(true);
    const x = bs[0].x;
    pushBubbles(bs, AREA, 100, 100, 110, 100, 10);
    expect(bs[0].x).toBe(x);
  });

  it('品質は抜けた気泡の面積割合', () => {
    const bs = [bubble(0, 0, 0, 10), bubble(1, 0, 0, 10)];
    expect(bubbleQuality(bs)).toBe(0);
    bs[0].out = true;
    expect(bubbleQuality(bs)).toBe(0.5);
    bs[1].out = true;
    expect(bubbleQuality(bs)).toBe(1);
  });
});
