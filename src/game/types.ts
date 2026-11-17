export type StageId = 'wipe' | 'dust' | 'align' | 'tack' | 'bubbles';

export const STAGE_ORDER: readonly StageId[] = ['wipe', 'dust', 'align', 'tack', 'bubbles'];

/** 工程から評価へ渡す、仕上がり以外の情報 */
export interface StageDetail {
  /** 拭く工程で、削れて基板が見えている割合（やらかし「研磨しすぎ」の判定に使う） */
  scratchedRatio?: number;
  /** 仮固定の工程で、4隅の判定から決まったフィルムの角度（度）。やらかし「斜め貼り」の判定に使う */
  tiltDeg?: number;
}

/** 各工程の仕上がり。quality は 0（最悪）〜 1（完璧）。 */
export interface StageResult extends StageDetail {
  stage: StageId;
  quality: number;
}

/** ゲームが終わった理由。フィルムの落下は終了理由ではなく、やらかしとして持つ */
export type EndReason = 'completed' | 'timeout';

/** 点数の軸（各 0〜100点） */
export type ScoreAxis = 'speed' | 'screen' | 'film';
export type Scores = Record<ScoreAxis, number>;

/** 点数の段階。称号の判定に使う */
export type Tier = 'high' | 'mid' | 'low';

/** やらかしの軸（あり／なし） */
export interface Incidents {
  /** 仮固定でフィルムを床に落とした */
  dropped: boolean;
  /** 拭く工程で画面を削りすぎた */
  overPolished: boolean;
  /** 仮固定でフィルムが大きく傾いた（落下したときはつかない） */
  tilted: boolean;
}

/** 位置（SVG 座標、200×400 のスマホの座標系） */
export interface Spot {
  x: number;
  y: number;
}

/** 位置と半径（残った埃・気泡） */
export interface RoundSpot extends Spot {
  r: number;
}

/**
 * 結果画面の絵に使う、各工程の終わりの状態（R-1〜R-5）。
 * 工程を終えたとき・フィルムを落としたとき・時間切れの瞬間に、その工程の状態を残す。
 * まだ入っていない工程の項目は undefined。
 */
export interface FinishPicture {
  /** 拭く工程: マスごとの汚れの残り段数と、削れて基板が見えているか */
  wipe?: { cols: number; rows: number; dirt: number[]; scratched: boolean[] };
  /** 埃取り工程: 残った埃 */
  dust?: RoundSpot[];
  /** 位置合わせ工程: フィルムのずれ。undefined ならフィルムは貼る前（画面の横に置いたまま） */
  film?: Spot;
  /** 仮固定工程: フィルムの角度（度）。右回りがプラス */
  tilt?: number;
  /** 気泡抜き工程: 残った気泡（フィルムの上の座標） */
  bubbles?: RoundSpot[];
}

export interface GameOutcome {
  reason: EndReason;
  results: StageResult[];
  remainingMs: number;
  scores: Scores;
  tiers: Record<ScoreAxis, Tier>;
  /** 気泡抜きの段階（称号の単語に使う。B-6） */
  bubbleTier: Tier;
  incidents: Incidents;
  /** 結果画面の絵に使う終わりの状態 */
  picture: FinishPicture;
}
