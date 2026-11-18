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
  shouldSqueak,
  WIPE_SE_MIN_MS,
} from '../../src/audio/cues';
import { soundLength, SOUNDS, toneGain } from '../../src/audio/tones';
import type { Judgment } from '../../src/stages/logic/tack';
import { SCREEN } from '../../src/stages/phone';
import { beginStroke, cellCenter, createWipe, dirtLeft, endStroke, rubAt } from '../../src/stages/logic/wipe';

describe('拭く「キュッ」（S-10）', () => {
  it('その動きで汚れが落ちたときだけ鳴る。綺麗な場所をこすっても鳴らない', () => {
    expect(shouldSqueak(1, 1000, -Infinity)).toBe(true);
    expect(shouldSqueak(0, 1000, -Infinity)).toBe(false);
  });

  it('一度に複数のマスが落ちても、鳴らすかどうかの答えは1つ（1回だけ鳴る）', () => {
    expect(shouldSqueak(5, 1000, -Infinity)).toBe(true);
  });

  it('前に鳴らしてから WIPE_SE_MIN_MS 未満なら鳴らさない', () => {
    expect(WIPE_SE_MIN_MS).toBe(90);
    expect(shouldSqueak(1, 1089, 1000)).toBe(false);
    expect(shouldSqueak(1, 1090, 1000)).toBe(true);
  });
});

describe('拭く「キュッ」を拭く工程の判定とつなげる（S-10）', () => {
  it('汚れのマスを拭くと汚れの合計が減り、鳴る。拭き終えたマスをもう一度こすっても減らず、鳴らない', () => {
    const s = createWipe(SCREEN, () => 0.5);
    s.dirt.fill(0);
    s.dirt[0] = 1;
    s.dirt[1] = 1;
    const c = cellCenter(s, 0);
    let before = dirtLeft(s);
    beginStroke(s);
    rubAt(s, c.x, c.y);
    endStroke(s);
    const cleaned = before - dirtLeft(s);
    expect(cleaned).toBeGreaterThanOrEqual(1);
    expect(shouldSqueak(cleaned, 1000, -Infinity)).toBe(true);

    // 汚れが落ちたあとの場所をこする（削れは溜まるが、汚れは減らない）
    s.dirt.fill(0);
    before = dirtLeft(s);
    beginStroke(s);
    rubAt(s, c.x, c.y);
    endStroke(s);
    expect(shouldSqueak(before - dirtLeft(s), 2000, 1000)).toBe(false);
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
