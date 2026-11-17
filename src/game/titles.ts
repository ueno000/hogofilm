/**
 * 称号の単語とひとこと（企画管理シートの「称号CSV」タブから出力した src/titles.csv）を読み込む（R-9）。
 * 調整値の CSV（src/params.csv）と同じく、ビルド時に取り込み、開発中は書き換えると読み直される。
 */
import csvText from '../titles.csv?raw';
import { parseCsvRows } from './params';

/** 称号に使う単語の key（20個）。text が空欄なら単語なし。dustCoat は単独で出す称号（R-13） */
export const WORD_KEYS = [
  'speed.high', 'speed.mid', 'speed.low',
  'film.high', 'film.mid', 'film.low',
  'tilt',
  'overPolished',
  'screen.high', 'screen.mid', 'screen.low',
  'drop',
  'dropScreen.high', 'dropScreen.mid', 'dropScreen.low',
  'perfect',
  'bubble.high', 'bubble.mid', 'bubble.low',
  'dustCoat',
] as const;

export type WordKey = (typeof WORD_KEYS)[number];

/** ひとことの判定キー（39個）。シートの称号タブ No.1〜38 の順と、単独の称号（R-13）の「砂粒」 */
export const COMMENT_KEYS = [
  '研磨+落下', '落下|高', '落下|中', '落下|低', '研磨|高', '研磨|中', '研磨|低',
  '高高高', '高高中', '高高低', '高中高', '高中中', '高中低', '高低高', '高低中', '高低低',
  '中高高', '中高中', '中高低', '中中高', '中中中', '中中低', '中低高', '中低中', '中低低',
  '低高高', '低高中', '低高低', '低中高', '低中中', '低中低', '低低高', '低低中', '低低低',
  '研磨+斜め', '斜め|高', '斜め|中', '斜め|低',
  '砂粒',
] as const;

export interface TitleComment {
  /** ひとこと */
  text: string;
  /** 完成イメージの説明。今は使わない（#55） */
  image: string;
}

export interface ParsedTitles {
  words: Map<string, string>;
  comments: Map<string, TitleComment>;
  errors: string[];
}

/** 称号の CSV を読む。ヘッダー名で type / key / text / image の列を探し、空行は無視する */
export function parseTitlesCsv(text: string): ParsedTitles {
  const words = new Map<string, string>();
  const comments = new Map<string, TitleComment>();
  const errors: string[] = [];
  const [header, ...rows] = parseCsvRows(text);
  const cols = (header ?? []).map((h) => h.trim().toLowerCase());
  const col = (name: string) => cols.indexOf(name);
  const [typeCol, keyCol, textCol, imageCol] = ['type', 'key', 'text', 'image'].map(col);
  if (typeCol < 0 || keyCol < 0 || textCol < 0) {
    errors.push('CSV の1行目に type・key・text の列がありません');
    return { words, comments, errors };
  }
  for (const row of rows) {
    const type = (row[typeCol] ?? '').trim();
    const key = (row[keyCol] ?? '').trim();
    if (!type && !key) continue;
    const value = (row[textCol] ?? '').trim();
    if (type === 'word') words.set(key, value);
    else if (type === 'comment') comments.set(key, { text: value, image: imageCol < 0 ? '' : (row[imageCol] ?? '').trim() });
    else errors.push(`${key} の type「${type}」が word でも comment でもありません`);
  }
  return { words, comments, errors };
}

/** 必要な key がそろっているか確かめる。単語は空欄でもよいが、ひとことは空欄だとエラー */
export function checkTitles(
  parsed: ParsedTitles,
  wordKeys: readonly string[] = WORD_KEYS,
  commentKeys: readonly string[] = COMMENT_KEYS,
): string[] {
  const errors = [...parsed.errors];
  for (const k of wordKeys) if (!parsed.words.has(k)) errors.push(`単語 ${k} が CSV にありません`);
  for (const k of commentKeys) {
    const c = parsed.comments.get(k);
    if (!c) errors.push(`ひとこと ${k} が CSV にありません`);
    else if (!c.text) errors.push(`ひとこと ${k} の text が空です`);
  }
  return errors;
}

const parsed = parseTitlesCsv(csvText);

/** src/titles.csv の問題。1つでもあればゲームは起動せず、画面にエラーを出す */
export const TITLE_ERRORS: readonly string[] = checkTitles(parsed);

/** 単語の表（key → 単語。空欄は単語なし） */
export const TITLE_WORDS: ReadonlyMap<string, string> = parsed.words;

/** ひとことの表（判定キー → ひとこと） */
export const TITLE_COMMENTS: ReadonlyMap<string, TitleComment> = parsed.comments;
