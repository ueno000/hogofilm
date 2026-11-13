import { describe, expect, it } from 'vitest';
import { getTitle, titleKey, TITLES } from '../src/game/ranks';
import { evaluate } from '../src/game/score';
import type { Incidents, ScoreAxis, Tier } from '../src/game/types';

const TIERS: Tier[] = ['high', 'mid', 'low'];
const NONE: Incidents = { dropped: false, overPolished: false };
const tiers = (speed: Tier, screen: Tier, film: Tier): Record<ScoreAxis, Tier> => ({ speed, screen, film });

/** 段階と事件の組み合わせを全部並べる */
function allCombos() {
  const combos: Array<{ t: Record<ScoreAxis, Tier>; inc: Incidents }> = [];
  for (const speed of TIERS) for (const screen of TIERS) for (const film of TIERS) {
    for (const dropped of [false, true]) for (const overPolished of [false, true]) {
      combos.push({ t: tiers(speed, screen, film), inc: { dropped, overPolished } });
    }
  }
  return combos;
}

describe('称号表', () => {
  it('全34種類で、判定キーと称号に重複がない', () => {
    expect(TITLES).toHaveLength(34);
    expect(new Set(TITLES.map((t) => t.key)).size).toBe(34);
    expect(new Set(TITLES.map((t) => t.title)).size).toBe(34);
    expect(TITLES.every((t) => t.title && t.comment)).toBe(true);
  });

  it('どの組み合わせでも称号が決まり、34種類すべてに到達できる', () => {
    const reached = new Set<number>();
    for (const { t, inc } of allCombos()) reached.add(getTitle(t, inc).no);
    expect(reached.size).toBe(34);
  });
});

describe('判定の優先順位', () => {
  it('事件が2つともなら、段階に関係なく「素の画面派」', () => {
    for (const s of TIERS) {
      expect(getTitle(tiers(s, s, s), { dropped: true, overPolished: true }).title).toBe('素の画面派');
    }
  });

  it('落下だけなら、画面の綺麗さの段階で決まる', () => {
    const inc = { dropped: true, overPolished: false };
    expect(titleKey(tiers('low', 'high', 'low'), inc)).toBe('落下|高');
    expect(getTitle(tiers('low', 'high', 'low'), inc).title).toBe('画面だけピカピカ');
    expect(getTitle(tiers('high', 'mid', 'high'), inc).title).toBe('床に貼った人');
    expect(getTitle(tiers('high', 'low', 'high'), inc).title).toBe('フィルム遭難');
  });

  it('研磨しすぎだけなら、フィルムの貼り方の段階で決まる', () => {
    const inc = { dropped: false, overPolished: true };
    expect(titleKey(tiers('low', 'low', 'high'), inc)).toBe('研磨|高');
    expect(getTitle(tiers('low', 'low', 'high'), inc).title).toBe('基板むき出し職人');
    expect(getTitle(tiers('high', 'high', 'mid'), inc).title).toBe('スケルトン化');
    expect(getTitle(tiers('high', 'high', 'low'), inc).title).toBe('削り師');
  });

  it('事件なしなら、手早さ・画面の綺麗さ・フィルムの貼り方の順に段階を並べる', () => {
    expect(titleKey(tiers('high', 'mid', 'low'), NONE)).toBe('高中低');
    expect(getTitle(tiers('high', 'high', 'high'), NONE).title).toBe('保護フィルム仙人');
    expect(getTitle(tiers('high', 'mid', 'low'), NONE).title).toBe('せっかち職人');
    expect(getTitle(tiers('low', 'high', 'high'), NONE).title).toBe('時間を忘れた匠');
    expect(getTitle(tiers('low', 'low', 'low'), NONE).title).toBe('全部これから');
  });
});

describe('点数からの判定', () => {
  it('シートの判定チェック例（72・90・55点、事件なし）は「まじめな貼り手」', () => {
    const { tiers: t } = evaluate(
      [
        { stage: 'wipe', quality: 0.9 },
        { stage: 'dust', quality: 0.9 },
        { stage: 'align', quality: 0.55 },
        { stage: 'tack', quality: 0.55 },
        { stage: 'bubbles', quality: 0.55 },
      ],
      'completed',
      21_600, // 72点
      false,
    );
    expect(titleKey(t, NONE)).toBe('中高中');
    expect(getTitle(t, NONE)).toMatchObject({ title: 'まじめな貼り手', comment: '丁寧さが少しずつ仕上がりに出ています。' });
  });
});
