export type StageId = 'wipe' | 'dust' | 'align' | 'tack' | 'bubbles';

export const STAGE_ORDER: readonly StageId[] = ['wipe', 'dust', 'align', 'tack', 'bubbles'];

/** フィルムを扱う工程。フィルムを落とすと、この工程の仕上がりは 0 になる */
export const FILM_STAGES: readonly StageId[] = ['align', 'tack', 'bubbles'];

/** 各工程の仕上がり。quality は 0（最悪）〜 1（完璧）。 */
export interface StageResult {
  stage: StageId;
  quality: number;
}

/** ゲームが終わった理由。フィルムの落下は終了理由ではなく、事件として `dropped` で持つ */
export type EndReason = 'completed' | 'timeout';

export interface GameOutcome {
  reason: EndReason;
  results: StageResult[];
  remainingMs: number;
  /** 仮固定でフィルムを床に落とした（事件「落下」） */
  dropped: boolean;
  score: number;
}
