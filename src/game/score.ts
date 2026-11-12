import type { EndReason, StageId, StageResult } from './types';

/** 品質スコアへの各工程の配点（合計100）。暫定値。 */
export const STAGE_WEIGHTS: Record<StageId, number> = {
  wipe: 20,
  dust: 20,
  align: 20,
  tack: 15,
  bubbles: 25,
};

/**
 * 工程結果から品質スコア（0〜100の整数）を求める。
 * - 未完了の工程は 0 点扱い（時間切れ時）
 * - フィルムを落とした場合は 0 点
 */
export function calcScore(results: readonly StageResult[], reason: EndReason): number {
  if (reason === 'dropped') return 0;
  let total = 0;
  for (const r of results) {
    const q = Number.isFinite(r.quality) ? Math.min(1, Math.max(0, r.quality)) : 0;
    total += STAGE_WEIGHTS[r.stage] * q;
  }
  return Math.min(100, Math.max(0, Math.round(total)));
}
