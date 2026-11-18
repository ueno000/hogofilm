/**
 * いつ・どの効果音を鳴らすかの判定（S-4〜S-9）。DOM 非依存。
 * 音の中身は tones.ts、鳴らすのは sound.ts。
 */
import { param } from '../game/params';
import type { EndReason } from '../game/types';
import type { Judgment } from '../stages/logic/tack';
import type { SoundName } from './tones';

/** 拭く: 指がこの距離（SVG 座標）動くたびに「キュッ」を鳴らす（S-4） */
export const WIPE_SE_DISTANCE = param('WIPE_SE_DISTANCE');
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
 * 拭く: 指が動いた距離を足していき、WIPE_SE_DISTANCE を超えるたびに「キュッ」を1回鳴らす（S-4）。
 * 速くこするほど続けて鳴り、止まると鳴らない。汚れが落ちたかどうかは見ない（W-9）。
 * carry は前回までの余り（ストロークの最初は 0）。
 */
export function squeakSteps(carry: number, distance: number, step = WIPE_SE_DISTANCE): { count: number; carry: number } {
  if (!(step > 0) || !Number.isFinite(distance) || distance <= 0) return { count: 0, carry };
  const total = carry + distance;
  const count = Math.floor(total / step);
  return { count, carry: total - count * step };
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
