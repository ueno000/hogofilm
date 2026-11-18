/**
 * 効果音の設計図（S-1）。音は Web Audio でその場で合成するので、音の高さ・長さ・形を数値で持つ。DOM 非依存。
 * 工程ごとの音（#81）は SOUNDS に名前と音の並びを足せば鳴らせる。
 */
import { param } from '../game/params';

/** 効果音全体の音量（0〜1） */
export const SE_VOLUME = param('SE_VOLUME');

/** 1つの音（発振器1つ分。noise はざらざらした雑音） */
export interface Tone {
  /** 波の形。noise は雑音（ガラスが割れる音・シールを貼る音など） */
  wave: 'sine' | 'square' | 'sawtooth' | 'triangle' | 'noise';
  /** 鳴り始めの高さ（Hz）。noise のときは、雑音を通すフィルターの高さ */
  freq: number;
  /** 鳴り終わりの高さ（Hz）。省略時は freq のまま。高さを滑らせて「ポッ」「ピコッ」などの形を作る */
  freqEnd?: number;
  /** 鳴らす長さ（秒）。この間に音量を 0 まで下げる */
  duration: number;
  /** 立ち上がりの長さ（秒）。短いほど歯切れがよい */
  attack: number;
  /** この音の大きさ（0〜1）。全体の音量 SE_VOLUME を掛けて使う */
  gain: number;
  /** 鳴らし始めるまでの遅れ（秒）。和音や「ばばーん」のように重ねるときに使う */
  delay?: number;
  /** noise のときのフィルター。highpass は高い音だけ、lowpass は低い音だけ、bandpass はその辺りだけ残す */
  filter?: 'highpass' | 'lowpass' | 'bandpass';
}

/** 効果音の名前と、その音の並び */
export const SOUNDS = {
  /** ボタンを押したときの短い「ポッ」（S-3） */
  pop: [{ wave: 'sine', freq: 520, freqEnd: 880, duration: 0.09, attack: 0.004, gain: 0.5 }],
  /** 拭く: こすっているときの「キュッ」（S-4）。何度も鳴るので小さめ */
  squeak: [
    { wave: 'triangle', freq: 1500, freqEnd: 2300, duration: 0.06, attack: 0.008, gain: 0.22 },
    { wave: 'sine', freq: 2900, freqEnd: 3400, duration: 0.04, attack: 0.006, gain: 0.08 },
  ],
  /** 埃取り: シールを押し当てる「ペタッ」（S-5） */
  stick: [
    { wave: 'noise', filter: 'lowpass', freq: 1200, duration: 0.07, attack: 0.002, gain: 0.5 },
    { wave: 'sine', freq: 260, freqEnd: 120, duration: 0.09, attack: 0.002, gain: 0.45 },
  ],
  /** 位置合わせ: 移動のボタンの高い「ピコッ」（S-6）。長押し中は小さく鳴らす */
  pico: [{ wave: 'square', freq: 1568, freqEnd: 1760, duration: 0.05, attack: 0.003, gain: 0.16 }],
  /** 仮固定 PERFECT: 高く澄んだ和音がキラッと伸びる（S-7。いちばん気持ちいい音） */
  perfect: [
    { wave: 'triangle', freq: 1047, duration: 0.7, attack: 0.005, gain: 0.26 },
    { wave: 'triangle', freq: 1319, duration: 0.7, attack: 0.005, gain: 0.22, delay: 0.03 },
    { wave: 'triangle', freq: 1568, duration: 0.75, attack: 0.005, gain: 0.22, delay: 0.06 },
    { wave: 'sine', freq: 2093, duration: 0.9, attack: 0.01, gain: 0.16, delay: 0.09 },
    { wave: 'sine', freq: 3136, freqEnd: 3520, duration: 0.25, attack: 0.004, gain: 0.08, delay: 0.09 },
  ],
  /** 仮固定 GOOD: 明るい短い音（S-7） */
  good: [
    { wave: 'triangle', freq: 880, duration: 0.1, attack: 0.004, gain: 0.3 },
    { wave: 'triangle', freq: 1175, duration: 0.14, attack: 0.004, gain: 0.3, delay: 0.07 },
  ],
  /** 仮固定 BAD: 鈍い音（S-7） */
  bad: [{ wave: 'square', freq: 220, freqEnd: 170, duration: 0.18, attack: 0.006, gain: 0.18 }],
  /** 仮固定 MISS: 「ブッ」（S-7） */
  miss: [{ wave: 'sawtooth', freq: 110, freqEnd: 75, duration: 0.22, attack: 0.004, gain: 0.3 }],
  /** 仮固定で落下: ガラスが割れるような「ガシャーン！」（S-7。笑えるよう大げさに） */
  crash: [
    { wave: 'sine', freq: 160, freqEnd: 45, duration: 0.35, attack: 0.002, gain: 0.55 },
    { wave: 'noise', filter: 'highpass', freq: 2200, duration: 1.0, attack: 0.002, gain: 0.55 },
    { wave: 'noise', filter: 'bandpass', freq: 5000, duration: 0.5, attack: 0.002, gain: 0.35, delay: 0.04 },
    { wave: 'square', freq: 3200, duration: 0.12, attack: 0.002, gain: 0.1, delay: 0.06 },
    { wave: 'square', freq: 4100, duration: 0.1, attack: 0.002, gain: 0.09, delay: 0.15 },
    { wave: 'square', freq: 2700, duration: 0.14, attack: 0.002, gain: 0.08, delay: 0.26 },
    { wave: 'square', freq: 4700, duration: 0.08, attack: 0.002, gain: 0.07, delay: 0.38 },
    { wave: 'square', freq: 3600, duration: 0.1, attack: 0.002, gain: 0.06, delay: 0.52 },
  ],
  /** 気泡抜き: 触っている間に繰り返す、ぷくぷくした泡の音の1粒（S-8） */
  bubble: [{ wave: 'sine', freq: 320, freqEnd: 680, duration: 0.07, attack: 0.008, gain: 0.4 }],
  /** 気泡抜き: 気泡が割れたときの「プチッ」（S-8） */
  burst: [
    { wave: 'sine', freq: 1900, freqEnd: 600, duration: 0.04, attack: 0.002, gain: 0.4 },
    { wave: 'noise', filter: 'bandpass', freq: 3000, duration: 0.03, attack: 0.001, gain: 0.25 },
  ],
  /** 結果画面: 「ばばーん！」（S-9） */
  fanfare: [
    { wave: 'sawtooth', freq: 523, duration: 0.12, attack: 0.006, gain: 0.16 },
    { wave: 'sawtooth', freq: 523, duration: 0.12, attack: 0.006, gain: 0.16, delay: 0.16 },
    { wave: 'triangle', freq: 659, duration: 1.0, attack: 0.01, gain: 0.26, delay: 0.34 },
    { wave: 'triangle', freq: 784, duration: 1.0, attack: 0.01, gain: 0.24, delay: 0.34 },
    { wave: 'triangle', freq: 1047, duration: 1.1, attack: 0.01, gain: 0.24, delay: 0.34 },
    { wave: 'sawtooth', freq: 523, duration: 0.9, attack: 0.01, gain: 0.08, delay: 0.34 },
  ],
  /** 結果画面（時間切れ・落下）: 少し間の抜けた「ばばーん…」（S-9）。低めで、最後が下がっていく */
  fanfareFlop: [
    { wave: 'sawtooth', freq: 392, duration: 0.14, attack: 0.008, gain: 0.15 },
    { wave: 'sawtooth', freq: 392, duration: 0.14, attack: 0.008, gain: 0.15, delay: 0.22 },
    { wave: 'triangle', freq: 330, freqEnd: 262, duration: 1.2, attack: 0.02, gain: 0.26, delay: 0.46 },
    { wave: 'triangle', freq: 415, freqEnd: 330, duration: 1.2, attack: 0.02, gain: 0.2, delay: 0.46 },
  ],
} as const satisfies Record<string, readonly Tone[]>;

export type SoundName = keyof typeof SOUNDS;

/**
 * 実際に鳴らす大きさ。音がオフなら 0。
 * tone.gain × 全体の音量 × 音ごとの倍率（泡の音 BUBBLE_SE_VOLUME など）を 0〜1 に収める
 */
export function toneGain(tone: Pick<Tone, 'gain'>, on: boolean, volume = SE_VOLUME, scale = 1): number {
  if (!on) return 0;
  const v = tone.gain * volume * scale;
  return Number.isFinite(v) ? Math.min(1, Math.max(0, v)) : 0;
}

/** 音の並びが鳴り終わるまでの長さ（秒） */
export function soundLength(tones: readonly Tone[]): number {
  return tones.reduce((max, t) => Math.max(max, (t.delay ?? 0) + t.duration), 0);
}
