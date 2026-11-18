import { describe, expect, it } from 'vitest';
import { SE_VOLUME, SOUNDS, soundLength, toneGain, type Tone } from '../../src/audio/tones';

describe('効果音の大きさ（S-1, S-2）', () => {
  it('全体の音量は調整値 SE_VOLUME（0〜1）', () => {
    expect(SE_VOLUME).toBeGreaterThanOrEqual(0);
    expect(SE_VOLUME).toBeLessThanOrEqual(1);
  });

  it('音の大きさ × 全体の音量 × 音ごとの倍率で鳴らす', () => {
    expect(toneGain({ gain: 0.5 }, true, 0.6)).toBeCloseTo(0.3);
    expect(toneGain({ gain: 0.5 }, true, 0.6, 0.4)).toBeCloseTo(0.12);
  });

  it('音がオフのときは、どの音も大きさ 0', () => {
    for (const tones of Object.values(SOUNDS)) {
      for (const t of tones) expect(toneGain(t, false)).toBe(0);
    }
  });

  it('大きさは 0〜1 に収める', () => {
    expect(toneGain({ gain: 3 }, true, 1)).toBe(1);
    expect(toneGain({ gain: -1 }, true, 1)).toBe(0);
    expect(toneGain({ gain: Number.NaN }, true, 1)).toBe(0);
  });
});

describe('効果音の設計図', () => {
  it('ボタンの「ポッ」は短く（0.2秒以内）、高さが上がる', () => {
    const [pop] = SOUNDS.pop;
    expect(soundLength(SOUNDS.pop)).toBeLessThanOrEqual(0.2);
    expect(pop.freqEnd).toBeGreaterThan(pop.freq);
  });

  it('鳴り終わるまでの長さは、遅れて鳴る音も含めていちばん遅い終わり', () => {
    const tones: Tone[] = [
      { wave: 'sine', freq: 440, duration: 0.1, attack: 0.01, gain: 1 },
      { wave: 'sine', freq: 660, duration: 0.2, attack: 0.01, gain: 1, delay: 0.15 },
    ];
    expect(soundLength(tones)).toBeCloseTo(0.35);
  });
});
