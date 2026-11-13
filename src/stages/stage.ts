import type { StageDetail, StageId } from '../game/types';

export interface StageContext {
  /** 工程完了。quality は 0〜1。detail は評価に使う追加情報（拭く工程の削れた割合など） */
  complete(quality: number, detail?: StageDetail): void;
  /** フィルムを床に落とした。ゲームは続き、残りの工程は操作なしで進む。仮固定工程で使う。 */
  drop(): void;
}

export interface Stage {
  id: StageId;
  name: string;
  hint: string;
  /** container に工程UIを描画し、後片付け関数を返す。 */
  mount(container: HTMLElement, ctx: StageContext): () => void;
}
