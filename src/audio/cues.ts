/**
 * いつ・どの効果音を鳴らすかの判定（S-4〜S-9）。DOM 非依存。
 * 音の中身は tones.ts、鳴らすのは sound.ts。
 */
import { param } from '../game/params';
import type { EndReason } from '../game/types';
import type { Judgment } from '../stages/logic/tack';
import type { SoundName } from './tones';

/** 拭く: 「キュッ」を続けて鳴らすときの最短の間隔（ms）（S-10） */
export const WIPE_SE_MIN_MS = param('WIPE_SE_MIN_MS');
/** 位置合わせ: 長押しで動いている間に「ピコッ」を鳴らす間隔（ms）（S-6） */
export const ALIGN_SE_HOLD_MS = param('ALIGN_SE_HOLD_MS');
/** 気泡抜き: 泡の音の大きさ。SE_VOLUME に掛ける（S-8） */
export const BUBBLE_SE_VOLUME = param('BUBBLE_SE_VOLUME');

/** 位置合わせ: 長押し中の「ピコッ」の大きさ（ボタンを押したときの音に対する倍率）。小さく鳴らし続ける */
export const ALIGN_HOLD_SE_SCALE = 0.45;
/** 気泡抜き: 泡の粒を鳴らす間隔（ms） */
export const BUBBLE_SE_INTERVAL_MS = 90;
/** 気泡抜き: 指を止めて触っているだけのときの泡の音の大きさ（動かしているときに対する倍率） */
export const BUBBLE_SE_STILL_SCALE = 0.5;
/** 気泡抜き: 最後に指を動かしてからこの時間（ms）は「動かしている」とみなす */
export const BUBBLE_SE_MOVE_MS = 120;

/**
 * 拭く: 「キュッ」を鳴らすか（S-10）。その1回の動きで汚れが1段以上落ちたときだけ鳴らす。
 * 一度に複数のマスが落ちても1回。前に鳴らしてから minMs 未満なら鳴らさない（ビープ音のように聞こえないように）。
 * 汚れが落ちたあとの場所をこすっているときは鳴らない。lastAt は前に鳴らした時刻（まだなら -Infinity）
 */
export function shouldSqueak(cleaned: number, now: number, lastAt: number, minMs = WIPE_SE_MIN_MS): boolean {
  return cleaned > 0 && now - lastAt >= minMs;
}

/**
 * 位置合わせ: 長押ししてからの時間までに鳴らす「ピコッ」の回数（S-6）。
 * 押した瞬間の1回は数えない。動き出す（holdDelayMs）と1回鳴り、そのあと intervalMs ごとに1回。
 * 前のフレームの回数との差だけ鳴らす。ぴったりかどうかでは変えない（A-4）。
 */
export function holdTicks(heldMs: number, holdDelayMs: number, intervalMs = ALIGN_SE_HOLD_MS): number {
  if (!(intervalMs > 0) || heldMs < holdDelayMs) return 0;
  return Math.floor((heldMs - holdDelayMs) / intervalMs) + 1;
}

/** 仮固定: 判定ごとの音（S-7） */
export function judgmentSound(j: Judgment): SoundName {
  return j;
}

/** 結果画面の音（S-9）。時間切れや落下のときは、少し間の抜けた音 */
export function resultSound(reason: EndReason, dropped: boolean): SoundName {
  return reason === 'timeout' || dropped ? 'fanfareFlop' : 'fanfare';
}

/**
 * 気泡抜き: 泡の音の大きさの倍率（S-8）。触っていなければ 0（止める）。
 * 指を動かしている間は大きく、止めて触っているだけなら小さく。BUBBLE_SE_VOLUME を掛ける
 */
export function bubbleHumScale(touching: boolean, msSinceMove: number, volume = BUBBLE_SE_VOLUME): number {
  if (!touching) return 0;
  return volume * (msSinceMove <= BUBBLE_SE_MOVE_MS ? 1 : BUBBLE_SE_STILL_SCALE);
}
