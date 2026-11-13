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
    expect(calcScore(all(1))).toBe(100);
    expect(calcScore(all(0))).toBe(0);
  });

  it('品質値が範囲外でも0〜100に収まる', () => {
    expect(calcScore(all(5))).toBe(100);
    expect(calcScore(all(-1))).toBe(0);
  });

  it('時間切れは未完了の工程を0点として扱う', () => {
    expect(calcScore([{ stage: 'wipe', quality: 1 }, { stage: 'dust', quality: 1 }])).toBe(40);
  });

  it('フィルムを落としたら、フィルムを扱う工程だけ0点になり、拭く・埃取りは残る', () => {
    expect(calcScore(all(1), true)).toBe(STAGE_WEIGHTS.wipe + STAGE_WEIGHTS.dust);
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
    expect(outcome).toMatchObject({ reason: 'completed', score: 100, remainingMs: 12_345, dropped: false });
  });

  it('仮固定でフィルムを落としても終わらず、次の工程へ進む', () => {
    const g = new GameState();
    g.completeStage(1); // 拭く
    g.completeStage(1); // 埃取り
    g.completeStage(1); // 位置合わせ
    expect(g.currentStage).toBe('tack');
    g.dropFilm();
    expect(g.dropped).toBe(true);
    expect(g.currentStage).toBe('bubbles');
    expect(g.results.at(-1)).toEqual({ stage: 'tack', quality: 0 });
  });

  it('落下したまま最後まで進むと、終了理由は完了で「落下あり」になる', () => {
    const g = new GameState();
    g.completeStage(1);
    g.completeStage(1);
    g.completeStage(1);
    g.dropFilm();
    g.completeStage(0); // 気泡抜き（自動）
    const outcome = g.finish('completed', 40_000);
    expect(outcome).toMatchObject({ reason: 'completed', dropped: true, score: 40 });
  });

  it('落下と時間切れは同時に起こりうる', () => {
    const g = new GameState();
    g.completeStage(1);
    g.completeStage(1);
    g.completeStage(1);
    g.dropFilm();
    expect(g.finish('timeout', 0)).toMatchObject({ reason: 'timeout', dropped: true });
  });

  it('2回落としても1回分として扱う', () => {
    const g = new GameState();
    g.completeStage(1);
    g.completeStage(1);
    g.completeStage(1);
    g.dropFilm();
    g.dropFilm();
    expect(g.currentStage).toBe('bubbles');
  });
});

describe('share', () => {
  const base = { reason: 'completed' as const, results: [], remainingMs: 20_000, dropped: false };

  it('スコアと称号を含む投稿文とXの投稿URLを作る', () => {
    const text = buildShareText({ ...base, score: 87 });
    expect(text).toContain('87点');
    expect(text).toContain('貼り付けの達人');
    expect(text).toContain('残り時間 20.0秒');
    expect(buildXIntentUrl(text)).toBe(`https://x.com/intent/post?text=${encodeURIComponent(text)}`);
  });

  it('落下したときは投稿文にそれを書く', () => {
    const text = buildShareText({ ...base, dropped: true, score: 40 });
    expect(text).toContain('フィルムを床に落としました');
    expect(text).not.toContain('残り時間');
  });
});
