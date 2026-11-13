import { STAGE_ORDER, type EndReason, type GameOutcome, type StageId, type StageResult } from './types';
import { calcScore } from './score';

export const TIME_LIMIT_MS = 90_000;
/** フィルムを落としたあと、残りの工程を自動で進める間隔（1工程あたり、ms） */
export const DROP_AUTO_STAGE_MS = 1000;

/** 1プレイ分の進行状態。描画は持たず、シーン側から操作する。 */
export class GameState {
  readonly results: StageResult[] = [];
  private index = 0;
  private filmDropped = false;

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

  completeStage(quality: number): void {
    const stage = this.currentStage;
    if (!stage) return;
    this.results.push({ stage, quality: Math.min(1, Math.max(0, quality)) });
    this.index += 1;
  }

  /** 今の工程でフィルムを落とした。その工程は仕上がり 0 で終える */
  dropFilm(): void {
    if (this.filmDropped) return;
    this.filmDropped = true;
    this.completeStage(0);
  }

  finish(reason: EndReason, remainingMs: number): GameOutcome {
    return {
      reason,
      results: [...this.results],
      remainingMs: Math.max(0, remainingMs),
      dropped: this.filmDropped,
      score: calcScore(this.results, this.filmDropped),
    };
  }
}
