import type { Incidents, ScoreAxis, Tier } from './types';
import { TITLE_COMMENTS, TITLE_WORDS, type WordKey } from './titles';

/** 判定キーで使う段階の表記 */
const TIER_KEY: Record<Tier, string> = { high: '高', mid: '中', low: '低' };

/** 称号を決めるのに使う評価 */
export interface TitleInput {
  /** 点数の軸3つの段階 */
  tiers: Record<ScoreAxis, Tier>;
  /** 気泡抜きの段階（B-6） */
  bubbleTier: Tier;
  incidents: Incidents;
}

export interface Title {
  /** ひとことの判定キー（シートの称号タブと同じ表記）。例: `研磨+落下`, `落下|高`, `高中低` */
  key: string;
  /** あてはまる要素の言葉をつなげた称号（R-8） */
  title: string;
  /** ひとこと */
  comment: string;
}

/**
 * ひとことの判定キーを作る。優先順位:
 * 1. やらかしが2つ → `研磨+落下` / `研磨+斜め`（落下と斜め貼りは同時につかない）
 * 2. やらかしが1つ → `落下|<画面の綺麗さの段階>`、`研磨|<フィルムの貼り方の段階>`、`斜め|<画面の綺麗さの段階>`
 * 3. やらかしなし → 手早さ・画面の綺麗さ・フィルムの貼り方の段階を並べる（例: `高中低`）
 */
export function titleKey(tiers: Record<ScoreAxis, Tier>, incidents: Incidents): string {
  if (incidents.dropped && incidents.overPolished) return '研磨+落下';
  if (incidents.overPolished && incidents.tilted) return '研磨+斜め';
  if (incidents.dropped) return `落下|${TIER_KEY[tiers.screen]}`;
  if (incidents.overPolished) return `研磨|${TIER_KEY[tiers.film]}`;
  if (incidents.tilted) return `斜め|${TIER_KEY[tiers.screen]}`;
  return `${TIER_KEY[tiers.speed]}${TIER_KEY[tiers.screen]}${TIER_KEY[tiers.film]}`;
}

/**
 * あてはまる要素の言葉をつなげて称号を作る（R-8, B-6）。word は単語の key から単語を返す（空欄なら ''）。
 * - 並び: 手早さ → フィルムの貼り方（斜め貼りのときは「斜め貼り」）→ 気泡抜き → 研磨しすぎ → 画面の綺麗さ（最後の名詞）
 * - 落下したとき: 手早さ → 研磨しすぎ → 画面の綺麗さ（落下用）→ 「フィルムデストロイヤー」。貼り方・気泡抜きは付けない
 * - 手早さ・画面の綺麗さ・フィルムの貼り方・気泡抜きがすべて高で、やらかしがないときだけ例外の名前
 */
export function buildTitle(input: TitleInput, word: (key: WordKey) => string): string {
  const { tiers, bubbleTier, incidents } = input;
  const noIncident = !incidents.dropped && !incidents.overPolished && !incidents.tilted;
  const allHigh = tiers.speed === 'high' && tiers.screen === 'high' && tiers.film === 'high' && bubbleTier === 'high';
  if (noIncident && allHigh) return word('perfect');

  const parts: string[] = [word(`speed.${tiers.speed}`)];
  if (incidents.dropped) {
    if (incidents.overPolished) parts.push(word('overPolished'));
    parts.push(word(`dropScreen.${tiers.screen}`), word('drop'));
  } else {
    parts.push(incidents.tilted ? word('tilt') : word(`film.${tiers.film}`));
    parts.push(word(`bubble.${bubbleTier}`));
    if (incidents.overPolished) parts.push(word('overPolished'));
    parts.push(word(`screen.${tiers.screen}`));
  }
  return parts.join('');
}

/** src/titles.csv の単語を引く（空欄なら ''） */
function csvWord(key: WordKey): string {
  return TITLE_WORDS.get(key) ?? '';
}

/** 評価から称号とひとことを決める。称号は言葉をつなげて作り、ひとことは判定キーの表から引く */
export function getTitle(input: TitleInput): Title {
  const key = titleKey(input.tiers, input.incidents);
  return {
    key,
    title: buildTitle(input, csvWord),
    // 判定キーはすべて CSV にそろっていることを起動時に確かめている（TITLE_ERRORS）
    comment: TITLE_COMMENTS.get(key)?.text ?? '',
  };
}
