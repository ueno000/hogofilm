import { describe, expect, it } from 'vitest';
import { buildTitle, getTitle, titleKey, type TitleInput } from '../src/game/ranks';
import { evaluate } from '../src/game/score';
import { COMMENT_KEYS, TITLE_WORDS, type WordKey } from '../src/game/titles';
import type { Incidents, ScoreAxis, Tier } from '../src/game/types';

const TIERS: Tier[] = ['high', 'mid', 'low'];
const NONE: Incidents = { dropped: false, overPolished: false, tilted: false };
const T: Record<string, Tier> = { 高: 'high', 中: 'mid', 低: 'low' };
const tiers = (speed: Tier, screen: Tier, film: Tier): Record<ScoreAxis, Tier> => ({ speed, screen, film });
const word = (k: WordKey) => TITLE_WORDS.get(k) ?? '';

/** 「高・低・中・中」（手早さ・画面の綺麗さ・フィルムの貼り方・気泡抜き）の書き方から評価を作る */
function input(levels: string, incidents: Partial<Incidents> = {}): TitleInput {
  const [s, sc, f, b] = levels.split('・').map((c) => T[c]);
  return { tiers: tiers(s, sc, f), bubbleTier: b, incidents: { ...NONE, ...incidents } };
}

/** 段階とやらかしの組み合わせを全部並べる（落下と斜め貼りは同時につかない） */
function allCombos() {
  const combos: Array<{ t: Record<ScoreAxis, Tier>; inc: Incidents }> = [];
  for (const speed of TIERS) for (const screen of TIERS) for (const film of TIERS) {
    for (const dropped of [false, true]) for (const overPolished of [false, true]) for (const tilted of [false, true]) {
      if (dropped && tilted) continue;
      combos.push({ t: tiers(speed, screen, film), inc: { dropped, overPolished, tilted } });
    }
  }
  return combos;
}

describe('称号のつなげ方（R-8, B-6）: 新称号案タブの組み合わせ例', () => {
  const cases: Array<[string, Partial<Incidents>, string]> = [
    ['高・低・中・中', { overPolished: true, tilted: true }, '早業！斜め貼りの申し子！基板さえも磨く砂粒コレクター'],
    ['高・高・高・高', {}, '保護フィルムに愛されし保護フィルム貼り師'],
    ['中・中・中・中', {}, '平凡な一般保護フィルム貼り師'],
    ['低・高・高・高', {}, 'ゆっくりで1ミリの狂いもない気泡の侵入を許さないピカピカ貼り師'],
    ['高・高・低・低', {}, '早業！大雑把な気泡と同居中のピカピカ貼り師'],
    ['中・高・中・中', { tilted: true }, '斜め貼りの申し子！ピカピカ貼り師'],
    ['低・低・低・低', {}, 'ゆっくりで大雑把な気泡と同居中の砂粒コレクター'],
    ['中・高・低・高', { dropped: true }, 'ピッカピカのフィルムデストロイヤー'],
    ['高・低・低・低', { dropped: true, overPolished: true }, '早業！基板さえも磨く砂粒まみれのフィルムデストロイヤー'],
    ['中・中・高・中', { overPolished: true }, '1ミリの狂いもない基板さえも磨く一般保護フィルム貼り師'],
    ['低・中・低・低', { tilted: true }, 'ゆっくりで斜め貼りの申し子！気泡と同居中の一般保護フィルム貼り師'],
    ['低・中・低・高', { tilted: true }, 'ゆっくりで斜め貼りの申し子！気泡の侵入を許さない一般保護フィルム貼り師'],
  ];
  for (const [levels, inc, expected] of cases) {
    const label = Object.keys(inc).length ? `${levels}（${Object.keys(inc).join('・')}）` : levels;
    it(`${label} → ${expected}`, () => {
      expect(buildTitle(input(levels, inc), word)).toBe(expected);
    });
  }
});

describe('称号のつなげ方の決まり', () => {
  it('例外の名前は、手早さ・画面・貼り方・気泡抜きがすべて高でやらかしがないときだけ', () => {
    expect(buildTitle(input('高・高・高・高'), word)).toBe('保護フィルムに愛されし保護フィルム貼り師');
    // 気泡抜きが中・低なら例外にせず、言葉をつなげる
    expect(buildTitle(input('高・高・高・中'), word)).toBe('早業！1ミリの狂いもないピカピカ貼り師');
    expect(buildTitle(input('高・高・高・低'), word)).toBe('早業！1ミリの狂いもない気泡と同居中のピカピカ貼り師');
    // やらかしがあれば例外にしない
    expect(buildTitle(input('高・高・高・高', { tilted: true }), word)).toBe('早業！斜め貼りの申し子！気泡の侵入を許さないピカピカ貼り師');
  });

  it('落下したときは、貼り方と気泡抜きの言葉を付けず、最後の名詞をフィルムデストロイヤーにする', () => {
    const t = buildTitle(input('低・中・高・高', { dropped: true }), word);
    expect(t).toBe('ゆっくりでそれなりのフィルムデストロイヤー');
    expect(t).not.toContain('1ミリの狂いもない');
    expect(t).not.toContain('気泡の侵入を許さない');
  });

  it('空欄の単語（手早さ・気泡抜きの中）は何も付けない', () => {
    expect(buildTitle(input('中・中・中・中'), word)).toBe('平凡な一般保護フィルム貼り師');
  });

  it('単語は渡した表から引く（CSV を差し替えれば称号が変わる）', () => {
    const custom = (k: WordKey) => `[${k}]`;
    expect(buildTitle(input('高・低・中・低'), custom)).toBe('[speed.high][film.mid][bubble.low][screen.low]');
  });
});

describe('気泡抜きの段階（B-6）', () => {
  const base = [
    { stage: 'wipe' as const, quality: 1 },
    { stage: 'dust' as const, quality: 1 },
    { stage: 'align' as const, quality: 1 },
    { stage: 'tack' as const, quality: 1, tiltDeg: 0 },
  ];

  it('気泡抜きの品質を100倍し、点数の軸と同じ境目で段階にする', () => {
    expect(evaluate([...base, { stage: 'bubbles', quality: 0.8 }], 'completed', 30_000, false).bubbleTier).toBe('high');
    expect(evaluate([...base, { stage: 'bubbles', quality: 0.79 }], 'completed', 30_000, false).bubbleTier).toBe('mid');
    expect(evaluate([...base, { stage: 'bubbles', quality: 0.4 }], 'completed', 30_000, false).bubbleTier).toBe('mid');
    expect(evaluate([...base, { stage: 'bubbles', quality: 0.39 }], 'completed', 30_000, false).bubbleTier).toBe('low');
  });

  it('気泡抜きの前に時間切れになったときは品質 0 として「気泡と同居中の」を付ける', () => {
    const e = evaluate(base, 'timeout', 0, false);
    expect(e.bubbleTier).toBe('low');
    expect(getTitle(e).title).toContain('気泡と同居中の');
  });
});

describe('ひとことの判定キー', () => {
  it('どの組み合わせでも判定キーが38種類のどれかになり、38種類すべてに到達できる', () => {
    const reached = new Set<string>();
    for (const { t, inc } of allCombos()) {
      const key = titleKey(t, inc);
      expect(COMMENT_KEYS).toContain(key);
      reached.add(key);
    }
    expect(reached.size).toBe(38);
  });

  it('やらかし2つ → やらかし1つ → やらかしなし の順に決める', () => {
    expect(titleKey(tiers('high', 'high', 'high'), { dropped: true, overPolished: true, tilted: false })).toBe('研磨+落下');
    expect(titleKey(tiers('high', 'high', 'high'), { dropped: false, overPolished: true, tilted: true })).toBe('研磨+斜め');
    expect(titleKey(tiers('low', 'high', 'low'), { ...NONE, dropped: true })).toBe('落下|高');
    expect(titleKey(tiers('low', 'low', 'high'), { ...NONE, overPolished: true })).toBe('研磨|高');
    expect(titleKey(tiers('low', 'mid', 'low'), { ...NONE, tilted: true })).toBe('斜め|中');
    expect(titleKey(tiers('high', 'mid', 'low'), NONE)).toBe('高中低');
  });

  it('ひとことは判定キーの表（src/titles.csv）から引く', () => {
    expect(getTitle({ tiers: tiers('high', 'low', 'low'), bubbleTier: 'low', incidents: NONE }).comment)
      .toBe('あっという間に通りすぎ、埃と気泡だけが残りました。');
    expect(getTitle({ tiers: tiers('mid', 'mid', 'mid'), bubbleTier: 'mid', incidents: { ...NONE, tilted: true } }).comment)
      .toBe('画面に新しい傾きを与える大胆な仕上がり。');
  });

  it('シートの判定チェック例（72・90・55点、やらかしなし）のひとこと', () => {
    const e = evaluate(
      [
        { stage: 'wipe', quality: 0.9 },
        { stage: 'dust', quality: 0.9 },
        { stage: 'align', quality: 0.55 },
        { stage: 'tack', quality: 0.55, tiltDeg: 0 },
        { stage: 'bubbles', quality: 0.55 },
      ],
      'completed',
      21_600, // 72点
      false,
    );
    expect(titleKey(e.tiers, NONE)).toBe('中高中');
    expect(getTitle(e)).toMatchObject({
      key: '中高中',
      title: '平凡なピカピカ貼り師',
      comment: '丁寧さが少しずつ仕上がりに出ています。',
    });
  });
});
