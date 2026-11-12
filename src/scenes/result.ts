import { h } from '../dom';
import { getRank } from '../game/ranks';
import { buildShareText, buildXIntentUrl, formatSeconds } from '../game/share';
import type { GameOutcome } from '../game/types';
import type { Scene } from './scene';

const REASON_LABEL: Record<GameOutcome['reason'], string> = {
  completed: '貼り付け完了！',
  timeout: '時間切れ！',
  dropped: 'フィルムを床に落とした…',
};

export const resultScene = (outcome: GameOutcome): Scene => (root, nav) => {
  const rank = getRank(outcome.score);
  const share = () => {
    const url = location.protocol.startsWith('http') ? location.href.split('#')[0] : undefined;
    window.open(buildXIntentUrl(buildShareText(outcome, url)), '_blank', 'noopener');
  };

  root.append(
    h('main', { class: `screen screen--result is-${outcome.reason}` },
      h('p', { class: 'eyebrow' }, REASON_LABEL[outcome.reason]),
      h('div', { class: 'score' },
        h('span', { class: 'score__label' }, '品質スコア'),
        h('span', { class: 'score__value' }, String(outcome.score)),
        h('span', { class: 'score__unit' }, '点'),
      ),
      h('p', { class: 'remain' }, `残り時間 ${formatSeconds(outcome.remainingMs)}秒`),
      h('div', { class: 'rank' },
        h('p', { class: 'rank__no' }, `No.${rank.no}`),
        h('h2', { class: 'rank__title' }, rank.title),
        h('p', { class: 'rank__comment' }, rank.comment),
      ),
      h('div', { class: 'actions' },
        h('button', { class: 'btn btn--x', onclick: share }, 'Xでシェア'),
        h('button', { class: 'btn btn--primary', onclick: () => nav.toPlay() }, 'もう一度'),
        h('button', { class: 'btn', onclick: () => nav.toTitle() }, 'タイトルへ'),
      ),
    ),
  );
};
