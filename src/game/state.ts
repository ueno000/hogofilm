import {
  STAGE_ORDER,
  type EndReason,
  type FinishPicture,
  type GameOutcome,
  type StageDetail,
  type StageId,
  type StageResult,
} from './types';
import { evaluate } from './score';
import { param } from './params';

export const TIME_LIMIT_MS = param('TIME_LIMIT_MS');
/** フィルムを落としたあと、残りの工程を自動で進める間隔（1工程あたり、ms） */
export const DROP_AUTO_STAGE_MS = param('DROP_AUTO_STAGE_MS');

/** 1プレイ分の進行状態。描画は持たず、シーン側から操作する。 */
export class GameState {
  readonly results: StageResult[] = [];
  private index = 0;
  private filmDropped = false;
  private picture: FinishPicture = {};

  get currentStage(): StageId | undefined {
    return STAGE_ORDER[this.index];
  }

  get stageNumber(): number {
    return this.index + 1;
  }

  get isLastStageDone(): boolean {
    return this.index >= STAGE_ORDER.length;
  }

  /** フィルムを床に落としたか。落としたあとの工程は操作なしで進む */
  get dropped(): boolean {
    return this.filmDropped;
  }

  /** それまでの工程が残した状態 */
  get pictureSoFar(): FinishPicture {
    return { ...this.picture };
  }

  /** 工程の終わりの状態を、結果画面の絵のために残す（あとから来た項目で上書きする） */
  recordPicture(part: FinishPicture): void {
    this.picture = { ...this.picture, ...part };
  }

  completeStage(quality: number, detail: StageDetail = {}): void {
    const stage = this.currentStage;
    if (!stage) return;
    this.results.push({ ...detail, stage, quality: Math.min(1, Math.max(0, quality)) });
    this.index += 1;
  }

  /** 今の工程でフィルムを落とした。その工程は仕上がり 0 で終える */
  dropFilm(): void {
    if (this.filmDropped) return;
    this.filmDropped = true;
    this.completeStage(0);
  }

  finish(reason: EndReason, remainingMs: number): GameOutcome {
    const remaining = Math.max(0, remainingMs);
    return {
      reason,
      results: [...this.results],
      remainingMs: remaining,
      ...evaluate(this.results, reason, remaining, this.filmDropped),
      picture: { ...this.picture },
    };
  }
}
