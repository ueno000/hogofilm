import type { EndReason, Incidents, ScoreAxis, Scores, StageId, StageResult, Tier } from './types';
import { param } from './params';
import { isTilted } from '../stages/logic/tack';

/** 残り時間がこれ以上なら手早さ 100点（ms） */
export const SPEED_FULL_REMAIN_MS = param('SPEED_FULL_REMAIN_MS');
/** 画面の綺麗さの配点（合計100） */
export const SCREEN_WEIGHTS: Partial<Record<StageId, number>> = { wipe: 50, dust: 50 };
/** フィルムの貼り方の配点（合計100） */
export const FILM_WEIGHTS: Partial<Record<StageId, number>> = { align: 35, tack: 25, bubbles: 40 };
/** 段階「高」の下限（点） */
export const RANK_HIGH_MIN = param('RANK_HIGH_MIN');
/** 段階「中」の下限（点） */
export const RANK_MID_MIN = param('RANK_MID_MIN');
/** 削れた割合がこれを超えるとやらかし「研磨しすぎ」 */
export const WIPE_EXPOSE_LIMIT = param('WIPE_EXPOSE_LIMIT');

function clamp01(v: number): number {
  return Number.isFinite(v) ? Math.min(1, Math.max(0, v)) : 0;
}

function toPoints(v: number): number {
  return Math.min(100, Math.max(0, Math.round(v)));
}

/** 配点つきの合計。結果のない工程（時間切れで未完了）は 0 点 */
function weighted(results: readonly StageResult[], weights: Partial<Record<StageId, number>>): number {
  let total = 0;
  for (const r of results) total += (weights[r.stage] ?? 0) * clamp01(r.quality);
  return toPoints(total);
}

/** 手早さ: 100 × min(1, 残り時間 ÷ 満点になる残り時間)。時間切れ・落下のときは 0 */
export function speedScore(remainingMs: number, reason: EndReason, dropped: boolean): number {
  if (reason === 'timeout' || dropped) return 0;
  return toPoints(100 * clamp01(remainingMs / SPEED_FULL_REMAIN_MS));
}

/** 画面の綺麗さ: 拭く × 50 ＋ 埃取り × 50（削れの減点は拭く品質に含まれる） */
export function screenScore(results: readonly StageResult[]): number {
  return weighted(results, SCREEN_WEIGHTS);
}

/** フィルムの貼り方: 位置合わせ × 35 ＋ 仮固定 × 25 ＋ 気泡抜き × 40。落下があれば 0 */
export function filmScore(results: readonly StageResult[], dropped: boolean): number {
  return dropped ? 0 : weighted(results, FILM_WEIGHTS);
}

export function scoreTier(score: number): Tier {
  if (score >= RANK_HIGH_MIN) return 'high';
  if (score >= RANK_MID_MIN) return 'mid';
  return 'low';
}

/** 拭く工程で削れた割合が規定を超えたら「研磨しすぎ」 */
export function isOverPolished(results: readonly StageResult[]): boolean {
  const wipe = results.find((r) => r.stage === 'wipe');
  return (wipe?.scratchedRatio ?? 0) > WIPE_EXPOSE_LIMIT;
}

export interface Evaluation {
  scores: Scores;
  tiers: Record<ScoreAxis, Tier>;
  /** 気泡抜きの段階（B-6） */
  bubbleTier: Tier;
  incidents: Incidents;
}

/**
 * 気泡抜きの段階（B-6）: 気泡抜きの品質を100倍し、点数の軸と同じ境目で段階にする。
 * 気泡抜きの前に時間切れになったときは品質 0（低）。落下したときは称号に使わない
 */
export function bubbleTier(results: readonly StageResult[]): Tier {
  const bubbles = results.find((r) => r.stage === 'bubbles');
  return scoreTier(toPoints(100 * clamp01(bubbles?.quality ?? 0)));
}

/** 仮固定でフィルムが大きく傾いたら「斜め貼り」。落下したときはフィルムを貼らないのでつけない（T-4） */
export function isTiltedFilm(results: readonly StageResult[], dropped: boolean): boolean {
  if (dropped) return false;
  const tack = results.find((r) => r.stage === 'tack');
  return tack?.tiltDeg !== undefined && isTilted(tack.tiltDeg);
}

/** 工程結果から、点数の軸3つ・段階・やらかしの軸3つを求める。 */
export function evaluate(
  results: readonly StageResult[],
  reason: EndReason,
  remainingMs: number,
  dropped: boolean,
): Evaluation {
  const scores: Scores = {
    speed: speedScore(remainingMs, reason, dropped),
    screen: screenScore(results),
    film: filmScore(results, dropped),
  };
  return {
    scores,
    tiers: { speed: scoreTier(scores.speed), screen: scoreTier(scores.screen), film: scoreTier(scores.film) },
    bubbleTier: bubbleTier(results),
    incidents: { dropped, overPolished: isOverPolished(results), tilted: isTiltedFilm(results, dropped) },
  };
}
