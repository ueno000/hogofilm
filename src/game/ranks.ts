import type { Scores } from './types';

export interface Rank {
  no: number;
  min: number;
  max: number;
  title: string;
  comment: string;
}

const TABLE: ReadonlyArray<[string, string]> = [
  ['フィルム遭難', '画面より先に、フィルムの心が折れました。'],
  ['気泡の温泉宿', '気泡たちが気持ちよさそうにくつろいでいます。'],
  ['砂粒コレクター', '小さな粒まで、しっかり保存できました。'],
  ['斜め貼り名人', '画面に新しい傾きを与える大胆な仕上がり。'],
  ['指紋アーティスト', '作品の主役は、あなたの指紋です。'],
  ['気泡の大家さん', '気泡に広めのお部屋を貸してあげました。'],
  ['端っこ惜しい賞', 'もう少しで端まで届くところでした。'],
  ['なんとか着地', '完璧ではないけれど、画面には乗りました。'],
  ['粘り腰の職人', '苦戦の跡も、味わいのひとつです。'],
  ['半分つるつる', 'きれいな場所が、ちゃんと増えてきました。'],
  ['まずまず保護', '画面を守る仕事は、ひとまず合格です。'],
  ['気泡お引っ越し係', '大きな気泡は、だいぶ退去してくれました。'],
  ['まじめな貼り手', '丁寧さが少しずつ仕上がりに出ています。'],
  ['端まであと一歩', '端っこも、もう少しで納得してくれそう。'],
  ['いい感じ職人', '画面を見るたび、ちょっと嬉しくなる仕上がり。'],
  ['気泡キラー', '気泡たちに、ほぼ勝利しました。'],
  ['つるピカ担当', '指が画面をすいすい滑りそうです。'],
  ['貼り付けの達人', '手際も仕上がりも、かなりのものです。'],
  ['ほぼ無の境地', 'フィルムの存在を忘れるほど自然です。'],
  ['保護フィルム仙人', '埃もズレも気泡も、悟りの彼方へ。'],
];

/** 20段階：0〜4, 5〜9, …, 90〜94, 95〜100 */
export const RANKS: readonly Rank[] = TABLE.map(([title, comment], i) => ({
  no: i + 1,
  min: i * 5,
  max: i === TABLE.length - 1 ? 100 : i * 5 + 4,
  title,
  comment,
}));

/** スコアに対応する称号。範囲外・非整数は 0〜100 の整数に丸めてから判定する。 */
/**
 * 暫定: 点数の軸3つの平均から旧20段階の称号を引く。
 * #23（評価軸の組み合わせで決まる34種類の称号）で置き換える。
 */
export function interimRank(scores: Scores): Rank {
  return getRank((scores.speed + scores.screen + scores.film) / 3);
}

export function getRank(score: number): Rank {
  const s = Number.isFinite(score) ? Math.min(100, Math.max(0, Math.floor(score))) : 0;
  return RANKS[Math.min(RANKS.length - 1, Math.floor(s / 5))];
}
