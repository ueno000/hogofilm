import { placeholderStage } from './placeholder';

export const tackStage = placeholderStage({
  id: 'tack',
  name: '仮固定する',
  hint: 'タイミングよく4隅を順にタップ。大失敗すると床に落とす！',
  canDrop: true,
});
