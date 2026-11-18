import { describe, expect, it } from 'vitest';
import {
  ALIGN_SE_HOLD_MS,
  BUBBLE_SE_MOVE_MS,
  BUBBLE_SE_STILL_SCALE,
  BUBBLE_SE_VOLUME,
  bubbleHumScale,
  holdTicks,
  judgmentSound,
  resultSound,
  squeakSteps,
  WIPE_SE_DISTANCE,
} from '../../src/audio/cues';
import { soundLength, SOUNDS, toneGain } from '../../src/audio/tones';
import type { Judgment } from '../../src/stages/logic/tack';

describe('拭く「キュッ」（S-4）', () => {
  it('指が WIPE_SE_DISTANCE 動くたびに1回。余りは次に持ち越す', () => {
    const step = 40;
    expect(squeakSteps(0, 30, step)).toEqual({ count: 0, carry: 30 });
    expect(squeakSteps(30, 15, step)).toEqual({ count: 1, carry: 5 });
    expect(squeakSteps(5, 100, step)).toEqual({ count: 2, carry: 25 });
  });

  it('速くこするほど続けて鳴る（同じ時間で動いた距離が長いほど回数が多い）', () => {
    const slow = squeakSteps(0, WIPE_SE_DISTANCE * 1.5).count;
    const fast = squeakSteps(0, WIPE_SE_DISTANCE * 4.5).count;
    expect(fast).toBeGreaterThan(slow);
  });

  it('止まっている（動いた距離 0）ときは鳴らない', () => {
    expect(squeakSteps(39, 0, 40)).toEqual({ count: 0, carry: 39 });
  });
});

describe('位置合わせ「ピコッ」（S-6）', () => {
  const DELAY = 250;
  it('動き出すまでは鳴らない（押した瞬間の1回はボタン側で鳴らす）', () => {
    expect(holdTicks(0, DELAY, 120)).toBe(0);
    expect(holdTicks(249, DELAY, 120)).toBe(0);
  });

  it('動き出すと1回、そのあと ALIGN_SE_HOLD_MS ごとに1回増える', () => {
    expect(holdTicks(250, DELAY, 120)).toBe(1);
    expect(holdTicks(369, DELAY, 120)).toBe(1);
    expect(holdTicks(370, DELAY, 120)).toBe(2);
    expect(holdTicks(250 + ALIGN_SE_HOLD_MS * 3, DELAY)).toBe(4);
  });
});

describe('仮固定の判定の音（S-7）', () => {
  it('PERFECT・GOOD・BAD・MISS でそれぞれ違う音を鳴らす', () => {
    const judgments: Judgment[] = ['perfect', 'good', 'bad', 'miss'];
    const sounds = judgments.map(judgmentSound);
    expect(new Set(sounds).size).toBe(4);
    for (const s of sounds) expect(SOUNDS[s].length).toBeGreaterThan(0);
  });

  it('PERFECT は和音で、いちばん長く伸びる', () => {
    const len = (j: Judgment) => soundLength(SOUNDS[judgmentSound(j)]);
    expect(SOUNDS[judgmentSound('perfect')].length).toBeGreaterThanOrEqual(3);
    for (const j of ['good', 'bad', 'miss'] as const) expect(len('perfect')).toBeGreaterThan(len(j));
  });
});

describe('結果画面の音（S-9）', () => {
  it('最後まで進んだら「ばばーん！」', () => {
    expect(resultSound('completed', false)).toBe('fanfare');
  });

  it('時間切れや落下のときは、間の抜けた「ばばーん…」', () => {
    expect(resultSound('timeout', false)).toBe('fanfareFlop');
    expect(resultSound('completed', true)).toBe('fanfareFlop');
    expect(resultSound('timeout', true)).toBe('fanfareFlop');
  });
});

describe('気泡抜きの泡の音（S-8）', () => {
  it('触っていなければ鳴らさない（指を離すと止める）', () => {
    expect(bubbleHumScale(false, 0)).toBe(0);
  });

  it('指を動かしている間は大きく、止めて触っているだけなら小さく。BUBBLE_SE_VOLUME を掛ける', () => {
    const moving = bubbleHumScale(true, 0);
    const still = bubbleHumScale(true, BUBBLE_SE_MOVE_MS + 1);
    expect(moving).toBeCloseTo(BUBBLE_SE_VOLUME);
    expect(still).toBeCloseTo(BUBBLE_SE_VOLUME * BUBBLE_SE_STILL_SCALE);
    expect(moving).toBeGreaterThan(still);
  });
});

describe('音がオフのとき', () => {
  it('工程の音も結果の音も、どの音も大きさ 0', () => {
    for (const name of Object.keys(SOUNDS) as Array<keyof typeof SOUNDS>) {
      for (const t of SOUNDS[name]) expect(toneGain(t, false, 1, 1)).toBe(0);
    }
  });
});
