import { h } from '../dom';
import { getTitle } from '../game/ranks';
import {
  AXIS_LABEL,
  AXIS_ORDER,
  buildShareText,
  buildXIntentUrl,
  formatSeconds,
  incidentNames,
  resultHeading,
  TIER_LABEL,
} from '../game/share';
import type { GameOutcome, ScoreAxis } from '../game/types';
import { resultPicture } from './resultPicture';
import type { Scene } from './scene';

export const resultScene = (outcome: GameOutcome): Scene => (root, nav) => {
  // 手早さには、点数の根拠として残り時間を小さく添える
  const axisNote = (axis: ScoreAxis) =>
    axis === 'speed' ? h('span', { class: 'axis__note' }, `残り ${formatSeconds(outcome.remainingMs)}秒`) : null;
  const rank = getTitle(outcome.tiers, outcome.incidents);
  const incidents = incidentNames(outcome.incidents);
  const share = () => {
    const url = location.protocol.startsWith('http') ? location.href.split('#')[0] : undefined;
    window.open(buildXIntentUrl(buildShareText(outcome, url)), '_blank', 'noopener');
  };
  const dropped = outcome.incidents.dropped;

  root.append(
    h('main', { class: `screen screen--result is-${outcome.reason}${dropped ? ' is-dropped' : ''}` },
      h('p', { class: 'eyebrow' }, resultHeading(outcome)),
      // 仕上がったスマホの絵を最初に大きく出す（R-1〜R-5）
      h('div', { class: 'result-picture' }, resultPicture(outcome)),
      h('dl', { class: 'axes' },
        ...AXIS_ORDER.map((axis) =>
          h('div', { class: `axis is-${outcome.tiers[axis]}` },
            h('dt', { class: 'axis__label' }, AXIS_LABEL[axis], axisNote(axis)),
            h('dd', { class: 'axis__value' },
              h('span', { class: 'axis__score' }, String(outcome.scores[axis])),
              h('span', { class: 'axis__unit' }, '点'),
              h('span', { class: 'axis__tier' }, TIER_LABEL[outcome.tiers[axis]]),
            ),
          ),
        ),
      ),
      incidents.length ? h('p', { class: 'incidents' }, `やらかし：${incidents.join('・')}`) : null,
      h('div', { class: 'rank' },
        h('h2', { class: 'rank__title' }, rank.title),
        h('p', { class: 'rank__comment' }, rank.comment),
      ),
      h('div', { class: 'actions' },
        h('button', { class: 'btn btn--x', onclick: share }, 'Xでシェア'),
        h('div', { class: 'actions actions--row' },
          h('button', { class: 'btn btn--primary', onclick: () => nav.toPlay() }, 'もう一度'),
          h('button', { class: 'btn', onclick: () => nav.toTitle() }, 'タイトルへ'),
        ),
      ),
    ),
  );
};
