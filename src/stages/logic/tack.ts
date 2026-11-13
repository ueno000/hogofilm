/** リングの開始半径 */
export const RING_START = 44;
/** リングが 0 まで縮む時間（ms） */
export const RING_DURATION = 1000;
/** 隅の目標マーカーの半径。リングがここに重なった瞬間が最高 */
export const RING_TARGET = 12;
/** 判定幅（リング半径と目標半径の差） */
export const JUDGE_PERFECT = 3;
export const JUDGE_GOOD = 7;
export const JUDGE_BAD = 12;
/** この回数ミスするとフィルムを落とす */
export const MAX_MISSES = 2;

export type Judgment = 'perfect' | 'good' | 'bad' | 'miss';

export const JUDGMENT_SCORE: Record<Judgment, number> = {
  perfect: 1,
  good: 0.75,
  bad: 0.4,
  miss: 0,
};

export const JUDGMENT_LABEL: Record<Judgment, string> = {
  perfect: 'ピッタリ！',
  good: 'いいね',
  bad: 'おしい',
  miss: 'ミス',
};

export function ringRadius(elapsedMs: number): number {
  return Math.max(0, RING_START * (1 - elapsedMs / RING_DURATION));
}

/** タップした瞬間の経過時間から判定する。早すぎるタップはミス。 */
export function judgeTap(elapsedMs: number): Judgment {
  const diff = Math.abs(ringRadius(elapsedMs) - RING_TARGET);
  if (diff <= JUDGE_PERFECT) return 'perfect';
  if (diff <= JUDGE_GOOD) return 'good';
  if (diff <= JUDGE_BAD) return 'bad';
  return 'miss';
}

/** リングが縮みきるまでタップしなかった */
export function isRingExpired(elapsedMs: number): boolean {
  return elapsedMs >= RING_DURATION;
}

export function shouldDrop(judgments: readonly Judgment[]): boolean {
  return judgments.filter((j) => j === 'miss').length >= MAX_MISSES;
}

export function tackQuality(judgments: readonly Judgment[]): number {
  if (judgments.length === 0) return 0;
  return judgments.reduce((sum, j) => sum + JUDGMENT_SCORE[j], 0) / judgments.length;
}
