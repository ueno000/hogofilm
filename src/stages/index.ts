import { STAGE_ORDER, type StageId } from '../game/types';
import type { Stage } from './stage';
import { wipeStage } from './wipe';
import { dustStage } from './dust';
import { alignStage } from './align';
import { tackStage } from './tack';
import { bubblesStage } from './bubbles';

const BY_ID: Record<StageId, Stage> = {
  wipe: wipeStage,
  dust: dustStage,
  align: alignStage,
  tack: tackStage,
  bubbles: bubblesStage,
};

export const STAGES: readonly Stage[] = STAGE_ORDER.map((id) => BY_ID[id]);

export function getStage(id: StageId): Stage {
  return BY_ID[id];
}
