import { describe, expect, it } from 'vitest';
import { RANKS, getRank } from '../src/game/ranks';

describe('RANKS', () => {
  it('20段階あり、0〜100を隙間なく覆う', () => {
    expect(RANKS).toHaveLength(20);
    expect(RANKS[0].min).toBe(0);
    expect(RANKS[19].max).toBe(100);
    for (let i = 1; i < RANKS.length; i++) {
      expect(RANKS[i].min).toBe(RANKS[i - 1].max + 1);
    }
  });
});

describe('getRank', () => {
  it('0点はNo.1、100点はNo.20', () => {
    expect(getRank(0)).toMatchObject({ no: 1, title: 'フィルム遭難' });
    expect(getRank(100)).toMatchObject({ no: 20, title: '保護フィルム仙人' });
  });

  it('各スコア帯の境界で正しく切り替わる', () => {
    for (let i = 0; i < 19; i++) {
      const upper = i * 5 + 4;
      expect(getRank(upper).no, `score ${upper}`).toBe(i + 1);
      expect(getRank(upper + 1).no, `score ${upper + 1}`).toBe(i + 2);
    }
    expect(getRank(95).no).toBe(20);
  });

  it('0〜100の全整数が自分の帯に入る', () => {
    for (let s = 0; s <= 100; s++) {
      const r = getRank(s);
      expect(s).toBeGreaterThanOrEqual(r.min);
      expect(s).toBeLessThanOrEqual(r.max);
    }
  });

  it('範囲外・不正値は端に丸める', () => {
    expect(getRank(-5).no).toBe(1);
    expect(getRank(150).no).toBe(20);
    expect(getRank(Number.NaN).no).toBe(1);
  });

  it('企画書の称号とひとことを持つ', () => {
    expect(getRank(52)).toMatchObject({ title: 'まずまず保護', comment: '画面を守る仕事は、ひとまず合格です。' });
  });
});
