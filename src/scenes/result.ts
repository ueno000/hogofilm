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
import { isShareCancel, shareMode } from '../game/shareImage';
import type { GameOutcome, ScoreAxis } from '../game/types';
import { resultPicture } from './resultPicture';
import { createShareImage } from './shareImage';
import type { Scene } from './scene';
import { playSound } from '../audio/sound';
import { resultSound } from '../audio/cues';

export const resultScene = (outcome: GameOutcome): Scene => (root, nav) => {
  // 手早さには、点数の根拠として残り時間を小さく添える
  const axisNote = (axis: ScoreAxis) =>
    axis === 'speed' ? h('span', { class: 'axis__note' }, `残り ${formatSeconds(outcome.remainingMs)}秒`) : null;
  const rank = getTitle(outcome);
  const incidents = incidentNames(outcome.incidents);
  const url = gameUrl(location.href, location.protocol);
  const openX = (text: string) => {
    window.open(buildXIntentUrl(text), '_blank', 'noopener');
  };

  // シェア画像（R-10）。結果画面を開いたときに作っておき、ボタンを押してから待たせない
  let imageFile: File | null = null;
  let imageUrl = '';
  let imageReady: Promise<File | null> = Promise.resolve(null);
  /** 画像を保存する（画像を共有できない端末向け） */
  const saveImage = (file: File) => {
    imageUrl ||= URL.createObjectURL(file);
    const a = h('a', { href: imageUrl, download: file.name });
    a.click();
  };
  // 「シェア」（R-11）: 画像を共有できる端末は共有画面、できない端末は画像を保存して X の投稿画面
  const share = async () => {
    const text = buildShareText(outcome, url);
    // 画像ができていれば await せずに進め、クリックの中で X の画面を開けるようにする
    const file = imageFile ?? (await imageReady);
    if (!file) {
      openX(text);
      return;
    }
    const canShareFiles = !!navigator.canShare?.({ files: [file] });
    if (shareMode({ canShareFiles }) === 'native') {
      try {
        await navigator.share({ files: [file], text });
      } catch (err) {
        // 閉じた・やめたときは何も出さない
        if (!isShareCancel(err)) {
          saveImage(file);
          openX(text);
        }
      }
      return;
    }
    saveImage(file);
    openX(text);
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
  const picture = resultPicture(outcome);

  root.append(
    h('main', { class: `screen screen--result is-${outcome.reason}${dropped ? ' is-dropped' : ''}` },
      h('p', { class: 'eyebrow' }, resultHeading(outcome)),
      // 仕上がったスマホの絵を最初に大きく出す（R-1〜R-5）
      h('div', { class: 'result-picture' }, picture),
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
          h('button', { class: 'btn btn--share', onclick: share }, 'シェア'),
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

  // 結果が出たときに一度「ばばーん！」。時間切れ・落下は間の抜けた「ばばーん…」（S-9）
  playSound(resultSound(outcome.reason, dropped));

  // 画面に出た絵から色を読むので、DOM に入れてから作る
  imageReady = createShareImage(outcome, picture)
    .then((file) => (imageFile = file))
    .catch(() => null);

  return () => {
    clearTimeout(copiedTimer);
    if (imageUrl) URL.revokeObjectURL(imageUrl);
  };
};
