import { h } from '../dom';
import { getTitle } from '../game/ranks';
import {
  AXIS_LABEL,
  AXIS_ORDER,
  buildShareText,
  buildXIntentUrl,
  formatSeconds,
  incidentNames,
  TIER_LABEL,
} from '../game/share';
import type { GameOutcome } from '../game/types';
import type { Scene } from './scene';

const REASON_LABEL: Record<GameOutcome['reason'], string> = {
  completed: '貼り付け完了！',
  timeout: '時間切れ！',
};
/** フィルムを落としたときの見出し（結果画面の作り直しは #24） */
const DROPPED_LABEL = 'フィルムを床に落とした…';

export const resultScene = (outcome: GameOutcome): Scene => (root, nav) => {
  const rank = getTitle(outcome.tiers, outcome.incidents);
  const incidents = incidentNames(outcome.incidents);
  const share = () => {
    const url = location.protocol.startsWith('http') ? location.href.split('#')[0] : undefined;
    window.open(buildXIntentUrl(buildShareText(outcome, url)), '_blank', 'noopener');
  };
  const dropped = outcome.incidents.dropped;

  root.append(
    h('main', { class: `screen screen--result is-${outcome.reason}${dropped ? ' is-dropped' : ''}` },
      h('p', { class: 'eyebrow' }, dropped ? DROPPED_LABEL : REASON_LABEL[outcome.reason]),
      h('dl', { class: 'axes' },
        ...AXIS_ORDER.map((axis) =>
          h('div', { class: `axis is-${outcome.tiers[axis]}` },
            h('dt', { class: 'axis__label' }, AXIS_LABEL[axis]),
            h('dd', { class: 'axis__value' },
              h('span', { class: 'axis__score' }, String(outcome.scores[axis])),
              h('span', { class: 'axis__unit' }, '点'),
              h('span', { class: 'axis__tier' }, TIER_LABEL[outcome.tiers[axis]]),
            ),
          ),
        ),
      ),
      incidents.length ? h('p', { class: 'incidents' }, `事件：${incidents.join('・')}`) : null,
      h('p', { class: 'remain' }, `残り時間 ${formatSeconds(outcome.remainingMs)}秒`),
      h('div', { class: 'rank' },
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
