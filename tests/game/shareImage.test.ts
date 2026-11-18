import { describe, expect, it } from 'vitest';
import {
  fitTitle,
  isShareCancel,
  shareCardContent,
  shareMode,
  SHARE_TITLE_MAX_LINES,
  SHARE_TITLE_SIZES,
  wrapText,
  type MeasureText,
} from '../../src/game/shareImage';
import type { GameOutcome } from '../../src/game/types';

/** 1文字の幅が文字サイズと同じ（全角の等幅）として測る */
const mono: MeasureText = (text, fontSize) => Array.from(text).length * fontSize;

const MAX = SHARE_TITLE_SIZES[0];
const MIN = SHARE_TITLE_SIZES[SHARE_TITLE_SIZES.length - 1];

const outcome = (incidents: Partial<GameOutcome['incidents']> = {}): GameOutcome => ({
  reason: 'completed',
  results: [],
  remainingMs: 20_000,
  picture: {},
  scores: { speed: 67, screen: 90, film: 85 },
  tiers: { speed: 'mid', screen: 'high', film: 'high' },
  bubbleTier: 'mid',
  dustCoated: false,
  incidents: { dropped: false, overPolished: false, tilted: false, ...incidents },
});

describe('シェアの動き方（R-11）', () => {
  it('画像を共有できる端末では、端末の共有画面を開く', () => {
    expect(shareMode({ canShareFiles: true })).toBe('native');
  });

  it('画像を共有できない端末では、画像を保存して X の投稿画面を開く', () => {
    expect(shareMode({ canShareFiles: false })).toBe('download');
  });

  it('共有画面を閉じた・やめたとき（AbortError）だけを、やめた扱いにする', () => {
    expect(isShareCancel(new DOMException('cancel', 'AbortError'))).toBe(true);
    expect(isShareCancel(new DOMException('denied', 'NotAllowedError'))).toBe(false);
    expect(isShareCancel(undefined)).toBe(false);
  });
});

describe('称号の折り返し（R-10）', () => {
  it('短い称号は、いちばん大きい文字で1行に出す', () => {
    const fit = fitTitle('ピカピカ貼り師', MAX * 10, mono);
    expect(fit).toEqual({ fontSize: MAX, lines: ['ピカピカ貼り師'] });
  });

  it('長い称号は、文字を小さくして2行までに折り返す', () => {
    const title = '早業！斜め貼りの申し子！基板さえも磨く砂粒コレクター';
    // いちばん大きい文字だと1行に10文字しか入らず、2行に収まらない幅
    const width = MAX * 10;
    const fit = fitTitle(title, width, mono);
    expect(fit.fontSize).toBeLessThan(MAX);
    expect(fit.lines.length).toBeLessThanOrEqual(SHARE_TITLE_MAX_LINES);
    expect(fit.lines.join('')).toBe(title);
  });

  it('最小の文字でも収まらない称号は、2行目の末尾を「…」で切る', () => {
    const title = 'あ'.repeat(100);
    const width = MIN * 10;
    const fit = fitTitle(title, width, mono);
    expect(fit.fontSize).toBe(MIN);
    expect(fit.lines).toHaveLength(2);
    expect(fit.lines[1].endsWith('…')).toBe(true);
    for (const line of fit.lines) expect(mono(line, MIN)).toBeLessThanOrEqual(width);
  });

  it('行の頭に句読点や「！」が来ないように、前の行に入れる', () => {
    expect(wrapText('あいう！えお', 30, 10, mono, Infinity)).toEqual(['あいう！', 'えお']);
  });
});

describe('シェア画像に入れる内容（R-10）', () => {
  it('点数の軸3つを、点数と段階つきで並べる', () => {
    const c = shareCardContent(outcome());
    expect(c.axes.map((a) => `${a.label} ${a.score}点 ${a.tierLabel}`)).toEqual([
      '手早さ 67点 中',
      '画面の綺麗さ 90点 高',
      'フィルムの貼り方 85点 高',
    ]);
    expect(c.title).not.toBe('');
    expect(c.comment).not.toBe('');
    expect(c.footer).toContain('#フィルム貼り職人');
  });

  it('やらかしがないときは、やらかしの行を出さない', () => {
    expect(shareCardContent(outcome()).incidents).toBeNull();
  });

  it('やらかしがあるときは「やらかし：…」の行を出す', () => {
    expect(shareCardContent(outcome({ overPolished: true, dropped: true })).incidents).toBe('やらかし：落下・研磨しすぎ');
  });
});
