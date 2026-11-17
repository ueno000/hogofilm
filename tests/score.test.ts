import { describe, expect, it } from 'vitest';
import {
  evaluate,
  FILM_WEIGHTS,
  filmScore,
  isOverPolished,
  RANK_HIGH_MIN,
  RANK_MID_MIN,
  SCREEN_WEIGHTS,
  screenScore,
  scoreTier,
  SPEED_FULL_REMAIN_MS,
  speedScore,
  WIPE_EXPOSE_LIMIT,
} from '../src/game/score';
import { GameState } from '../src/game/state';
import { TACK_TILT_LIMIT } from '../src/stages/logic/tack';
import { buildShareText, buildXIntentUrl, resultHeading } from '../src/game/share';
import { STAGE_ORDER, type GameOutcome, type StageResult } from '../src/game/types';

const all = (q: number): StageResult[] => STAGE_ORDER.map((stage) => ({ stage, quality: q }));
const sum = (w: Partial<Record<string, number>>) => Object.values(w).reduce((a = 0, b = 0) => a + b, 0);

describe('配点', () => {
  it('画面の綺麗さ・フィルムの貼り方とも配点の合計は100', () => {
    expect(sum(SCREEN_WEIGHTS)).toBe(100);
    expect(sum(FILM_WEIGHTS)).toBe(100);
  });
});

describe('手早さ', () => {
  it('残り時間が満点ライン以上なら100点、半分なら50点', () => {
    expect(speedScore(SPEED_FULL_REMAIN_MS, 'completed', false)).toBe(100);
    expect(speedScore(SPEED_FULL_REMAIN_MS * 2, 'completed', false)).toBe(100);
    expect(speedScore(SPEED_FULL_REMAIN_MS / 2, 'completed', false)).toBe(50);
    expect(speedScore(0, 'completed', false)).toBe(0);
  });

  it('時間切れ・落下のときは0点', () => {
    expect(speedScore(SPEED_FULL_REMAIN_MS, 'timeout', false)).toBe(0);
    expect(speedScore(SPEED_FULL_REMAIN_MS, 'completed', true)).toBe(0);
  });
});

describe('画面の綺麗さ・フィルムの貼り方', () => {
  it('画面の綺麗さは拭く×50＋埃取り×50', () => {
    expect(screenScore(all(1))).toBe(100);
    expect(screenScore([{ stage: 'wipe', quality: 1 }, { stage: 'dust', quality: 0.5 }])).toBe(75);
  });

  it('フィルムの貼り方は位置合わせ×35＋仮固定×25＋気泡抜き×40', () => {
    expect(filmScore(all(1), false)).toBe(100);
    expect(filmScore([{ stage: 'align', quality: 1 }, { stage: 'tack', quality: 1 }, { stage: 'bubbles', quality: 0 }], false)).toBe(60);
  });

  it('落下があればフィルムの貼り方は0点。画面の綺麗さは残る', () => {
    expect(filmScore(all(1), true)).toBe(0);
    expect(screenScore(all(1))).toBe(100);
  });

  it('時間切れで終わっていない工程は0点として数える', () => {
    expect(screenScore([{ stage: 'wipe', quality: 1 }])).toBe(50);
  });

  it('品質値が範囲外でも0〜100に収まる', () => {
    expect(screenScore(all(5))).toBe(100);
    expect(filmScore(all(-1), false)).toBe(0);
  });
});

describe('段階（高・中・低）', () => {
  it(`境目は${RANK_MID_MIN}点と${RANK_HIGH_MIN}点`, () => {
    expect(scoreTier(0)).toBe('low');
    expect(scoreTier(RANK_MID_MIN - 1)).toBe('low');
    expect(scoreTier(RANK_MID_MIN)).toBe('mid');
    expect(scoreTier(RANK_HIGH_MIN - 1)).toBe('mid');
    expect(scoreTier(RANK_HIGH_MIN)).toBe('high');
    expect(scoreTier(100)).toBe('high');
  });
});

describe('やらかし', () => {
  const wipe = (scratchedRatio: number): StageResult[] => [{ stage: 'wipe', quality: 1, scratchedRatio }];

  it(`研磨しすぎは削れた割合が${WIPE_EXPOSE_LIMIT * 100}%を超えたときだけ`, () => {
    expect(isOverPolished(wipe(0))).toBe(false);
    expect(isOverPolished(wipe(WIPE_EXPOSE_LIMIT))).toBe(false);
    expect(isOverPolished(wipe(WIPE_EXPOSE_LIMIT + 0.005))).toBe(true);
    expect(isOverPolished([])).toBe(false);
  });

  it('evaluate は点数・段階・やらかしをまとめて返す', () => {
    const results: StageResult[] = [
      { stage: 'wipe', quality: 0.8, scratchedRatio: 0.2 },
      { stage: 'dust', quality: 1 },
      ...all(1).slice(2),
    ];
    expect(evaluate(results, 'completed', 15_000, false)).toEqual({
      scores: { speed: 50, screen: 90, film: 100 },
      tiers: { speed: 'mid', screen: 'high', film: 'high' },
      bubbleTier: 'high',
      dustCoated: false,
      incidents: { dropped: false, overPolished: true, tilted: false },
    });
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
    const outcome = g.finish('completed', SPEED_FULL_REMAIN_MS);
    expect(outcome).toMatchObject({
      reason: 'completed',
      remainingMs: SPEED_FULL_REMAIN_MS,
      scores: { speed: 100, screen: 100, film: 100 },
      incidents: { dropped: false, overPolished: false },
    });
  });

  it('拭く工程の削れた割合が結果に渡り、研磨しすぎの判定に使われる', () => {
    const g = new GameState();
    g.completeStage(1, { scratchedRatio: 0.3 });
    expect(g.results[0]).toEqual({ stage: 'wipe', quality: 1, scratchedRatio: 0.3 });
    expect(g.finish('timeout', 0).incidents.overPolished).toBe(true);
  });

  it('仮固定でフィルムを落としても終わらず、次の工程へ進む', () => {
    const g = new GameState();
    g.completeStage(1);
    g.completeStage(1);
    g.completeStage(1);
    expect(g.currentStage).toBe('tack');
    g.dropFilm();
    expect(g.dropped).toBe(true);
    expect(g.currentStage).toBe('bubbles');
    expect(g.results.at(-1)).toEqual({ stage: 'tack', quality: 0 });
  });

  it('落下したまま最後まで進むと、終了理由は完了で、貼り方・手早さは0点', () => {
    const g = new GameState();
    g.completeStage(1);
    g.completeStage(1);
    g.completeStage(1);
    g.dropFilm();
    g.completeStage(0);
    const outcome = g.finish('completed', 40_000);
    expect(outcome).toMatchObject({
      reason: 'completed',
      scores: { speed: 0, screen: 100, film: 0 },
      incidents: { dropped: true },
    });
  });

  it('落下と時間切れは同時に起こりうる', () => {
    const g = new GameState();
    g.completeStage(1);
    g.completeStage(1);
    g.completeStage(1);
    g.dropFilm();
    expect(g.finish('timeout', 0)).toMatchObject({ reason: 'timeout', incidents: { dropped: true } });
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
  const outcome = (over: Partial<GameOutcome> = {}): GameOutcome => ({
    reason: 'completed',
    results: [],
    remainingMs: 20_000,
    picture: {},
    scores: { speed: 67, screen: 90, film: 85 },
    tiers: { speed: 'mid', screen: 'high', film: 'high' },
    bubbleTier: 'mid',
    dustCoated: false,
    incidents: { dropped: false, overPolished: false, tilted: false },
    ...over,
  });

  it('埃が規定の数以上残ったときは、投稿文の称号も単独の称号になる（R-13）', () => {
    const text = buildShareText(outcome({ dustCoated: true, incidents: { dropped: true, overPolished: true, tilted: false } }));
    expect(text).toContain('称号「フィルム代わりの砂粒コーティング、自然由来のフィルム貼り師」');
  });

  it('点数の軸3つと称号を含む投稿文とXの投稿URLを作る', () => {
    const text = buildShareText(outcome());
    expect(text).toContain('手早さ 67点');
    expect(text).toContain('画面の綺麗さ 90点');
    expect(text).toContain('フィルムの貼り方 85点');
    expect(text).toContain('称号「');
    expect(text).not.toContain('やらかし');
    expect(buildXIntentUrl(text)).toBe(`https://x.com/intent/post?text=${encodeURIComponent(text)}`);
  });

  it('やらかしがついたときは投稿文に書く', () => {
    const text = buildShareText(outcome({ incidents: { dropped: true, overPolished: true, tilted: false } }));
    expect(text).toContain('やらかし：落下・研磨しすぎ');
  });

  it('投稿文に総合の品質スコアは出さない', () => {
    expect(buildShareText(outcome())).not.toContain('品質');
  });
});

describe('結果画面の見出し', () => {
  const heading = (reason: 'completed' | 'timeout', dropped: boolean) =>
    resultHeading({ reason, incidents: { dropped, overPolished: false, tilted: false } });

  it('最後まで進んだら「貼り付け完了！」', () => {
    expect(heading('completed', false)).toBe('貼り付け完了！');
  });

  it('フィルムを落としたまま最後まで進んだら「フィルムなしで完走…」', () => {
    expect(heading('completed', true)).toBe('フィルムなしで完走…');
  });

  it('時間切れは落下より優先する', () => {
    expect(heading('timeout', false)).toBe('時間切れ！');
    expect(heading('timeout', true)).toBe('時間切れ！');
  });
});

describe('やらかし「斜め貼り」（T-4）', () => {
  const base = [
    { stage: 'wipe' as const, quality: 1 },
    { stage: 'dust' as const, quality: 1 },
    { stage: 'align' as const, quality: 1 },
  ];
  it('仮固定の角度の大きさが規定以上なら斜め貼り', () => {
    const results = [...base, { stage: 'tack' as const, quality: 0, tiltDeg: -TACK_TILT_LIMIT }];
    expect(evaluate(results, 'completed', 30_000, false).incidents.tilted).toBe(true);
  });

  it('規定未満なら斜め貼りではない', () => {
    const results = [...base, { stage: 'tack' as const, quality: 0.5, tiltDeg: TACK_TILT_LIMIT - 1 }];
    expect(evaluate(results, 'completed', 30_000, false).incidents.tilted).toBe(false);
  });

  it('落下したときはフィルムを貼らないので、斜め貼りはつかない', () => {
    const results = [...base, { stage: 'tack' as const, quality: 0, tiltDeg: 20 }];
    expect(evaluate(results, 'completed', 30_000, true).incidents.tilted).toBe(false);
  });

  it('仮固定まで進まずに時間切れなら、斜め貼りはつかない', () => {
    expect(evaluate(base, 'timeout', 0, false).incidents.tilted).toBe(false);
  });

  it('シェア文の「やらかし：」に斜め貼りを出す', () => {
    const outcome: GameOutcome = {
      reason: 'completed',
      results: [],
      remainingMs: 20_000,
      picture: {},
      scores: { speed: 67, screen: 90, film: 30 },
      tiers: { speed: 'mid', screen: 'high', film: 'low' },
      bubbleTier: 'low',
      dustCoated: false,
      incidents: { dropped: false, overPolished: true, tilted: true },
    };
    expect(buildShareText(outcome)).toContain('やらかし：研磨しすぎ・斜め貼り');
    expect(buildShareText(outcome)).toContain('称号「斜め貼りの申し子！気泡と同居中の基板さえも磨くピカピカ貼り師」');
  });
});
