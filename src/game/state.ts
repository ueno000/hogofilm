import { STAGE_ORDER, type EndReason, type GameOutcome, type StageId, type StageResult } from './types';
import { calcScore } from './score';

export const TIME_LIMIT_MS = 90_000;

/** 1プレイ分の進行状態。描画は持たず、シーン側から操作する。 */
export class GameState {
  readonly results: StageResult[] = [];
  private index = 0;

  get currentStage(): StageId | undefined {
    return STAGE_ORDER[this.index];
  }

  get stageNumber(): number {
    return this.index + 1;
  }

  get isLastStageDone(): boolean {
    return this.index >= STAGE_ORDER.length;
  }

  completeStage(quality: number): void {
    const stage = this.currentStage;
    if (!stage) return;
    this.results.push({ stage, quality: Math.min(1, Math.max(0, quality)) });
    this.index += 1;
  }

  finish(reason: EndReason, remainingMs: number): GameOutcome {
    return {
      reason,
      results: [...this.results],
      remainingMs: Math.max(0, remainingMs),
      score: calcScore(this.results, reason),
    };
  }
}
