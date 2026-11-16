import { param } from './params';

/** 残り時間がこの割合を切ると、ゲージが黄色になり「半分経過！」を出す（U-1, U-2） */
export const TIME_WARN_RATIO = param('TIME_WARN_RATIO');
/** 残り時間がこれ（ms）を切ると、ゲージが赤になり残り時間の演出を始める（U-1, U-3, U-4） */
export const TIME_DANGER_MS = param('TIME_DANGER_MS');
/** 「半分経過！」「残り10秒！」を出しておく時間（ms） */
export const TIME_NOTICE_MS = param('TIME_NOTICE_MS');

/** 残り時間の段階: 通常 → 半分経過 → 残りわずか */
export type TimePhase = 'normal' | 'warn' | 'danger';

const PHASE_RANK: Record<TimePhase, number> = { normal: 0, warn: 1, danger: 2 };

/**
 * 残り時間の段階。制限時間に対する割合と残り秒数で決めるので、制限時間を変えても動く。
 * 両方に当てはまるときは「残りわずか」を優先する。
 */
export function timePhase(
  remainingMs: number,
  limitMs: number,
  warnRatio = TIME_WARN_RATIO,
  dangerMs = TIME_DANGER_MS,
): TimePhase {
  if (remainingMs < dangerMs) return 'danger';
  if (remainingMs < limitMs * warnRatio) return 'warn';
  return 'normal';
}

/** 「残り10秒！」の文言。秒数は TIME_DANGER_MS から作る */
export function dangerNoticeText(dangerMs = TIME_DANGER_MS): string {
  return `残り${Math.round(dangerMs / 1000)}秒！`;
}

/**
 * 段階が進んだときに一度だけ出す合図の文言。進んでいなければ undefined。
 * 半分経過を飛ばして残りわずかになったときは、残りわずかの合図だけを出す。
 */
export function phaseNotice(prev: TimePhase, next: TimePhase, dangerMs = TIME_DANGER_MS): string | undefined {
  if (PHASE_RANK[next] <= PHASE_RANK[prev]) return undefined;
  return next === 'danger' ? dangerNoticeText(dangerMs) : '半分経過！';
}

/** 1秒ごとの脈打ちに使う、残り時間の秒の区切り（表示の秒数が変わると値が変わる） */
export function secondMark(remainingMs: number): number {
  return Math.ceil(remainingMs / 1000);
}
