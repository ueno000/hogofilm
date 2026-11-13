export type StageId = 'wipe' | 'dust' | 'align' | 'tack' | 'bubbles';

export const STAGE_ORDER: readonly StageId[] = ['wipe', 'dust', 'align', 'tack', 'bubbles'];

/** 工程から評価へ渡す、仕上がり以外の情報 */
export interface StageDetail {
  /** 拭く工程で、削れて基板が見えている割合（事件「研磨しすぎ」の判定に使う） */
  scratchedRatio?: number;
}

/** 各工程の仕上がり。quality は 0（最悪）〜 1（完璧）。 */
export interface StageResult extends StageDetail {
  stage: StageId;
  quality: number;
}

/** ゲームが終わった理由。フィルムの落下は終了理由ではなく、事件として持つ */
export type EndReason = 'completed' | 'timeout';

/** 点数の軸（各 0〜100点） */
export type ScoreAxis = 'speed' | 'screen' | 'film';
export type Scores = Record<ScoreAxis, number>;

/** 点数の段階。称号の判定に使う */
export type Tier = 'high' | 'mid' | 'low';

/** 事件の軸（あり／なし） */
export interface Incidents {
  /** 仮固定でフィルムを床に落とした */
  dropped: boolean;
  /** 拭く工程で画面を削りすぎた */
  overPolished: boolean;
}

export interface GameOutcome {
  reason: EndReason;
  results: StageResult[];
  remainingMs: number;
  scores: Scores;
  tiers: Record<ScoreAxis, Tier>;
  incidents: Incidents;
}
