import { param } from '../../game/params';

/** リングの開始半径 */
export const RING_START = param('RING_START');
/** リングが 0 まで縮む時間（ms） */
export const RING_DURATION = param('RING_DURATION');
/** 隅の目標マーカーの半径。リングがここに重なった瞬間が最高 */
export const RING_TARGET = param('RING_TARGET');
/** 判定幅（リング半径と目標半径の差） */
export const JUDGE_PERFECT = param('JUDGE_PERFECT');
export const JUDGE_GOOD = param('JUDGE_GOOD');
export const JUDGE_BAD = param('JUDGE_BAD');
/** この回数ミスするとフィルムを落とす */
export const MAX_MISSES = param('MAX_MISSES');
/** 判定ごとのフィルムの傾き（度）（T-2）。PERFECT は 0 */
export const TACK_TILT_GOOD = param('TACK_TILT_GOOD');
export const TACK_TILT_BAD = param('TACK_TILT_BAD');
export const TACK_TILT_MISS = param('TACK_TILT_MISS');
/** この角度（度）で仮固定の品質が 0（T-3） */
export const TACK_TILT_TOLERANCE = param('TACK_TILT_TOLERANCE');
/** 角度の大きさ（度）がこれ以上で、やらかし「斜め貼り」（T-4） */
export const TACK_TILT_LIMIT = param('TACK_TILT_LIMIT');

export type Judgment = 'perfect' | 'good' | 'bad' | 'miss';

/** タップが早かったか遅かったか。-1: 早い（左回り）、1: 遅い（右回り）、0: ちょうど */
export type TapDirection = -1 | 0 | 1;

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

/**
 * タップが早すぎたか遅すぎたか。リングがまだ目標より大きいうちに押せば早い、小さくなってから押せば遅い。
 */
export function tapDirection(elapsedMs: number): TapDirection {
  const d = ringRadius(elapsedMs) - RING_TARGET;
  return d > 0 ? -1 : d < 0 ? 1 : 0;
}

/**
 * 1隅のタップでフィルムが傾く角度（度）（T-2）。PERFECT は傾かない。
 * 早いと左回り（マイナス）、遅いと右回り（プラス）。タップせずにリングが消えた MISS は遅い扱い。
 */
export function tiltFor(judgment: Judgment, direction: TapDirection): number {
  const size: Record<Judgment, number> = { perfect: 0, good: TACK_TILT_GOOD, bad: TACK_TILT_BAD, miss: TACK_TILT_MISS };
  const tilt = size[judgment] * direction;
  // -0 を 0 にそろえる
  return tilt === 0 ? 0 : tilt;
}

/** 4隅の傾きの合計が、フィルムの角度（度）。早い・遅いは打ち消し合う */
export function filmAngle(tilts: readonly number[]): number {
  return tilts.reduce((sum, t) => sum + t, 0);
}

/** 角度の大きさが規定以上なら「斜め貼り」（T-4） */
export function isTilted(angleDeg: number, limit = TACK_TILT_LIMIT): boolean {
  return Math.abs(angleDeg) >= limit;
}

/** リングが縮みきるまでタップしなかった */
export function isRingExpired(elapsedMs: number): boolean {
  return elapsedMs >= RING_DURATION;
}

export function shouldDrop(judgments: readonly Judgment[]): boolean {
  return judgments.filter((j) => j === 'miss').length >= MAX_MISSES;
}

/** 仮固定の品質（T-3）: 1 − 角度の大きさ ÷ 許容角度（0未満にはしない） */
export function tackQuality(angleDeg: number, tolerance = TACK_TILT_TOLERANCE): number {
  return Math.max(0, 1 - Math.abs(angleDeg) / tolerance);
}
