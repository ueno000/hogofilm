import type { GameOutcome } from '../game/types';

export interface SceneNav {
  toTitle(): void;
  toHowTo(): void;
  toPlay(): void;
  toResult(outcome: GameOutcome): void;
}

/** シーンは root に描画し、後片付け関数を返す。 */
export type Scene = (root: HTMLElement, nav: SceneNav) => (() => void) | void;
