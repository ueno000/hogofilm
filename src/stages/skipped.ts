import { DROP_AUTO_STAGE_MS } from '../game/state';
import { createDelays, createStageView } from './shell';

/**
 * フィルムを落としたあとの工程。フィルムのないスマホを見せ、操作なしで少し待ってから次へ進む。
 * 後片付け関数を返す。
 */
export function mountSkippedStage(container: HTMLElement, id: string, onDone: () => void): () => void {
  const view = createStageView(container, id, 'フィルムを落としたので、この工程は自動で進みます。');
  view.playfield.classList.add('is-skipped');
  view.status.textContent = 'フィルムなし';
  const delays = createDelays();
  delays.later(onDone, DROP_AUTO_STAGE_MS);
  return () => delays.clear();
}
