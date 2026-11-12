export type StageId = 'wipe' | 'dust' | 'align' | 'tack' | 'bubbles';

export const STAGE_ORDER: readonly StageId[] = ['wipe', 'dust', 'align', 'tack', 'bubbles'];

/** 各工程の仕上がり。quality は 0（最悪）〜 1（完璧）。 */
export interface StageResult {
  stage: StageId;
  quality: number;
}

export type EndReason = 'completed' | 'timeout' | 'dropped';

export interface GameOutcome {
  reason: EndReason;
  results: StageResult[];
  remainingMs: number;
  score: number;
}
