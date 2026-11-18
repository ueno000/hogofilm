/**
 * 効果音の設計図（S-1）。音は Web Audio でその場で合成するので、音の高さ・長さ・形を数値で持つ。DOM 非依存。
 * 工程ごとの音（#81）は SOUNDS に名前と音の並びを足せば鳴らせる。
 */
import { param } from '../game/params';

/** 効果音全体の音量（0〜1） */
export const SE_VOLUME = param('SE_VOLUME');

/** 1つの音（発振器1つ分） */
export interface Tone {
  /** 波の形 */
  wave: 'sine' | 'square' | 'sawtooth' | 'triangle';
  /** 鳴り始めの高さ（Hz） */
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
}

/** 効果音の名前と、その音の並び */
export const SOUNDS = {
  /** ボタンを押したときの短い「ポッ」（S-3） */
  pop: [{ wave: 'sine', freq: 520, freqEnd: 880, duration: 0.09, attack: 0.004, gain: 0.5 }],
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
