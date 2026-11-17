import { getTitle } from './ranks';
import { AXIS_LABEL, AXIS_ORDER, incidentNames, TIER_LABEL } from './share';
import type { GameOutcome, Tier } from './types';

/** シェア画像の大きさ（px）。X のタイムラインで切れずに出る 16:9（R-10） */
export const SHARE_IMAGE = { w: 1200, h: 675 } as const;

/** 画像の外側の余白（px） */
export const SHARE_PAD = 48;

/** 左の絵の領域（px）。結果画面のスマホの絵を、この中に縦横比を保って収める */
export const SHARE_PICTURE_AREA = { x: SHARE_PAD, y: SHARE_PAD, w: 420, h: SHARE_IMAGE.h - SHARE_PAD * 2 } as const;

/** 右の文字の領域（px） */
export const SHARE_TEXT_AREA = {
  x: SHARE_PICTURE_AREA.x + SHARE_PICTURE_AREA.w + 40,
  y: SHARE_PAD,
  w: SHARE_IMAGE.w - (SHARE_PICTURE_AREA.x + SHARE_PICTURE_AREA.w + 40) - SHARE_PAD,
  h: SHARE_IMAGE.h - SHARE_PAD * 2,
} as const;

/** 称号の文字サイズの候補（px）。大きい順に試し、2行に収まる最大のものを使う */
export const SHARE_TITLE_SIZES: readonly number[] = [60, 52, 46, 40, 34];

/** 称号の最大行数（R-10） */
export const SHARE_TITLE_MAX_LINES = 2;

/** ひとことの文字サイズ（px）と最大行数 */
export const SHARE_COMMENT_SIZE = 28;
export const SHARE_COMMENT_MAX_LINES = 2;

/** 文字の幅を測る関数。描画側（Canvas の measureText）を渡す */
export type MeasureText = (text: string, fontSize: number) => number;

/** 行の頭に来てはいけない文字（句読点・閉じかっこ・長音など） */
const NO_LINE_START = '、。，．！？!?」』）)ー…・';

/** 収まらないときに末尾に付ける記号 */
const ELLIPSIS = '…';

export interface WrappedText {
  fontSize: number;
  lines: string[];
}

/**
 * 1文字ずつ詰めて折り返す（日本語は単語の区切りがないため）。
 * 行頭に句読点が来るときは、その文字を前の行に入れる（はみ出しは少しなら許す）。
 * maxLines を超える分は切り、最後の行の末尾を「…」にする。
 */
export function wrapText(text: string, maxWidth: number, fontSize: number, measure: MeasureText, maxLines: number): string[] {
  const chars = Array.from(text);
  const lines: string[] = [];
  let line = '';
  for (const ch of chars) {
    const next = line + ch;
    if (line && measure(next, fontSize) > maxWidth && !NO_LINE_START.includes(ch)) {
      lines.push(line);
      line = ch;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  if (lines.length <= maxLines) return lines;

  const kept = lines.slice(0, maxLines);
  let last = kept[maxLines - 1];
  while (last && measure(last + ELLIPSIS, fontSize) > maxWidth) last = Array.from(last).slice(0, -1).join('');
  kept[maxLines - 1] = last + ELLIPSIS;
  return kept;
}

/**
 * 称号を、2行以内に収まる最大の文字サイズで折り返す（R-10）。
 * 最小のサイズでも収まらないときは、2行目の末尾を「…」で切る。
 */
export function fitTitle(text: string, maxWidth: number, measure: MeasureText): WrappedText {
  for (const fontSize of SHARE_TITLE_SIZES) {
    const lines = wrapText(text, maxWidth, fontSize, measure, Infinity);
    if (lines.length <= SHARE_TITLE_MAX_LINES) return { fontSize, lines };
  }
  const fontSize = SHARE_TITLE_SIZES[SHARE_TITLE_SIZES.length - 1];
  return { fontSize, lines: wrapText(text, maxWidth, fontSize, measure, SHARE_TITLE_MAX_LINES) };
}

export interface ShareCardAxis {
  label: string;
  score: number;
  tier: Tier;
  tierLabel: string;
}

/** シェア画像の右側に並べる内容 */
export interface ShareCardContent {
  title: string;
  comment: string;
  axes: ShareCardAxis[];
  /** 「やらかし：落下」のような1行。ないときは null */
  incidents: string | null;
  /** ゲーム名とハッシュタグ */
  footer: string;
}

/** 画像に入れるゲーム名（タイトル画面のロゴと同じ） */
export const SHARE_GAME_NAME = 'フィルム貼り職人';
export const SHARE_HASHTAG = '#フィルム貼り職人';

export function shareCardContent(outcome: GameOutcome): ShareCardContent {
  const rank = getTitle(outcome);
  const incidents = incidentNames(outcome.incidents);
  return {
    title: rank.title,
    comment: rank.comment,
    axes: AXIS_ORDER.map((axis) => ({
      label: AXIS_LABEL[axis],
      score: outcome.scores[axis],
      tier: outcome.tiers[axis],
      tierLabel: TIER_LABEL[outcome.tiers[axis]],
    })),
    incidents: incidents.length ? `やらかし：${incidents.join('・')}` : null,
    footer: `${SHARE_GAME_NAME}　${SHARE_HASHTAG}`,
  };
}

/**
 * 「シェア」ボタンの動き方（R-11）。
 * - native: 端末の共有画面を開き、画像とシェア文を渡す
 * - download: 画像を保存してから、X の投稿画面を開く
 */
export type ShareMode = 'native' | 'download';

export function shareMode(env: { canShareFiles: boolean }): ShareMode {
  return env.canShareFiles ? 'native' : 'download';
}

/** 共有画面を閉じた・やめたときのエラーか。このときは何も出さない（R-11） */
export function isShareCancel(err: unknown): boolean {
  return typeof err === 'object' && err !== null && (err as { name?: unknown }).name === 'AbortError';
}
