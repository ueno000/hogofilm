import { describe, expect, it } from 'vitest';
import { filmPlace, FLOOR_DUST_COUNT, floorDust, hasSideFilm } from '../../src/game/picture';
import { GameState } from '../../src/game/state';

describe('絵のフィルムの置き場所', () => {
  it('位置合わせまで進んでいれば、スマホに貼ってある', () => {
    expect(filmPlace({ film: { x: 1, y: -2 } }, { dropped: false })).toBe('on');
  });

  it('位置合わせの前に時間切れなら、画面の横に置いたまま（R-5）', () => {
    expect(filmPlace({ wipe: { cols: 1, rows: 1, dirt: [0], scratched: [false] } }, { dropped: false })).toBe('beside');
  });

  it('落としたら、位置合わせを終えていても床（R-3, R-4）', () => {
    expect(filmPlace({ film: { x: 0, y: 0 } }, { dropped: true })).toBe('floor');
  });

  it('横に置く・床に落ちたときだけ、絵の横幅を広げる', () => {
    expect(hasSideFilm('on')).toBe(false);
    expect(hasSideFilm('beside')).toBe(true);
    expect(hasSideFilm('floor')).toBe(true);
  });
});

describe('床のフィルムの埃', () => {
  it('決まった数を、フィルムの範囲の中に、毎回同じ並びで置く', () => {
    const area = { x: 10, y: 20, w: 100, h: 200 };
    const a = floorDust(area);
    expect(a).toHaveLength(FLOOR_DUST_COUNT);
    expect(a).toEqual(floorDust(area));
    for (const d of a) {
      expect(d.x).toBeGreaterThan(area.x);
      expect(d.x).toBeLessThan(area.x + area.w);
      expect(d.y).toBeGreaterThan(area.y);
      expect(d.y).toBeLessThan(area.y + area.h);
    }
  });
});

describe('終わりの状態の受け渡し', () => {
  it('工程ごとに残した状態をまとめて、結果に入れる', () => {
    const s = new GameState();
    s.recordPicture({ wipe: { cols: 2, rows: 1, dirt: [0, 2], scratched: [true, false] } });
    s.completeStage(1);
    s.recordPicture({ dust: [{ x: 50, y: 60, r: 2 }] });
    s.completeStage(1);
    s.recordPicture({ film: { x: 3, y: -4 } });
    const outcome = s.finish('timeout', 0);
    expect(outcome.picture).toEqual({
      wipe: { cols: 2, rows: 1, dirt: [0, 2], scratched: [true, false] },
      dust: [{ x: 50, y: 60, r: 2 }],
      film: { x: 3, y: -4 },
    });
  });

  it('何も残していなければ、空の状態になる', () => {
    expect(new GameState().finish('timeout', 0).picture).toEqual({});
  });

  it('結果に入れた状態は、あとから残した状態で書き換わらない', () => {
    const s = new GameState();
    s.recordPicture({ film: { x: 1, y: 1 } });
    const outcome = s.finish('completed', 1000);
    s.recordPicture({ film: { x: 9, y: 9 } });
    expect(outcome.picture.film).toEqual({ x: 1, y: 1 });
  });
});
