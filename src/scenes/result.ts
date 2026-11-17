import { h } from '../dom';
import { getTitle } from '../game/ranks';
import {
  AXIS_LABEL,
  AXIS_ORDER,
  buildCopyText,
  buildShareText,
  buildXIntentUrl,
  formatSeconds,
  gameUrl,
  incidentNames,
  resultHeading,
  SHARE_COPIED_MS,
  TIER_LABEL,
} from '../game/share';
import type { GameOutcome, ScoreAxis } from '../game/types';
import { resultPicture } from './resultPicture';
import type { Scene } from './scene';

export const resultScene = (outcome: GameOutcome): Scene => (root, nav) => {
  // 手早さには、点数の根拠として残り時間を小さく添える
  const axisNote = (axis: ScoreAxis) =>
    axis === 'speed' ? h('span', { class: 'axis__note' }, `残り ${formatSeconds(outcome.remainingMs)}秒`) : null;
  const rank = getTitle(outcome);
  const incidents = incidentNames(outcome.incidents);
  const url = gameUrl(location.href, location.protocol);
  const share = () => {
    window.open(buildXIntentUrl(buildShareText(outcome, url)), '_blank', 'noopener');
  };

  // 「コピー」: シェア文とURLをクリップボードにコピーする（R-7）
  const copied = h('p', { class: 'copied', role: 'status', 'aria-live': 'polite' }, 'コピーしました');
  let copiedTimer = 0;
  const showCopied = () => {
    copied.classList.add('is-shown');
    clearTimeout(copiedTimer);
    copiedTimer = window.setTimeout(() => copied.classList.remove('is-shown'), SHARE_COPIED_MS);
  };
  // コピーできない端末では、シェア文を選択できる形で出す
  const fallbackText = h('textarea', { class: 'copy-fallback__text', readonly: true, rows: 6 });
  const fallback = h('div', { class: 'copy-fallback', role: 'dialog', 'aria-label': 'シェア文', hidden: true },
    h('p', { class: 'copy-fallback__note' }, 'コピーできませんでした。下の文を長押しして選んでください。'),
    fallbackText,
    h('button', { class: 'btn', onclick: () => (fallback.hidden = true) }, '閉じる'),
  );
  const showFallback = (text: string) => {
    fallbackText.value = text;
    fallback.hidden = false;
    fallbackText.focus();
    fallbackText.select();
  };
  const copy = async () => {
    const text = buildCopyText(outcome, url);
    try {
      if (!navigator.clipboard?.writeText) throw new Error('clipboard unavailable');
      await navigator.clipboard.writeText(text);
      showCopied();
    } catch {
      showFallback(text);
    }
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
        // つなげた称号は長くなるので、長いときは文字を小さくする
        h('h2', { class: `rank__title${rank.title.length > 16 ? ' is-long' : ''}` }, rank.title),
        h('p', { class: 'rank__comment' }, rank.comment),
      ),
      h('div', { class: 'actions' },
        h('div', { class: 'actions actions--row share-row' },
          h('button', { class: 'btn btn--x', onclick: share }, 'Xでシェア'),
          h('button', { class: 'btn btn--copy', onclick: copy }, 'コピー'),
          copied,
        ),
        h('div', { class: 'actions actions--row' },
          h('button', { class: 'btn btn--primary', onclick: () => nav.toPlay() }, 'もう一度'),
          h('button', { class: 'btn', onclick: () => nav.toTitle() }, 'タイトルへ'),
        ),
      ),
      fallback,
    ),
  );

  return () => clearTimeout(copiedTimer);
};
