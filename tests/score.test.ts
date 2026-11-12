import { describe, expect, it } from 'vitest';
import { calcScore, STAGE_WEIGHTS } from '../src/game/score';
import { GameState } from '../src/game/state';
import { buildShareText, buildXIntentUrl } from '../src/game/share';
import { STAGE_ORDER, type StageResult } from '../src/game/types';

const all = (q: number): StageResult[] => STAGE_ORDER.map((stage) => ({ stage, quality: q }));

describe('calcScore', () => {
  it('配点の合計は100', () => {
    expect(Object.values(STAGE_WEIGHTS).reduce((a, b) => a + b, 0)).toBe(100);
  });

  it('全工程完璧で100、全工程0で0', () => {
    expect(calcScore(all(1), 'completed')).toBe(100);
    expect(calcScore(all(0), 'completed')).toBe(0);
  });

  it('品質値が範囲外でも0〜100に収まる', () => {
    expect(calcScore(all(5), 'completed')).toBe(100);
    expect(calcScore(all(-1), 'completed')).toBe(0);
  });

  it('時間切れは未完了の工程を0点として扱う', () => {
    expect(calcScore([{ stage: 'wipe', quality: 1 }, { stage: 'dust', quality: 1 }], 'timeout')).toBe(40);
  });

  it('フィルムを落としたら0点', () => {
    expect(calcScore(all(1), 'dropped')).toBe(0);
  });
});

describe('GameState', () => {
  it('5工程を順に進めて完了できる', () => {
    const g = new GameState();
    for (const id of STAGE_ORDER) {
      expect(g.currentStage).toBe(id);
      g.completeStage(1);
    }
    expect(g.isLastStageDone).toBe(true);
    const outcome = g.finish('completed', 12_345);
    expect(outcome).toMatchObject({ reason: 'completed', score: 100, remainingMs: 12_345 });
  });
});

describe('share', () => {
  it('スコアと称号を含む投稿文とXの投稿URLを作る', () => {
    const text = buildShareText({ reason: 'completed', results: [], remainingMs: 20_000, score: 87 });
    expect(text).toContain('87点');
    expect(text).toContain('貼り付けの達人');
    expect(text).toContain('残り時間 20.0秒');
    expect(buildXIntentUrl(text)).toBe(`https://x.com/intent/post?text=${encodeURIComponent(text)}`);
  });
});
