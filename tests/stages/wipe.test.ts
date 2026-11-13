import { describe, expect, it } from 'vitest';
import {
  beginStroke,
  cleanRatio,
  createWipe,
  endStroke,
  rubAt,
  rubLine,
  WIPE_DONE,
  WIPE_MAX_DIRT,
  wipeQuality,
  type WipeState,
} from '../../src/stages/logic/wipe';
import { seededRng } from '../../src/stages/logic/random';

const AREA = { x: 0, y: 0, w: 100, h: 200 };

/** 全マスを同じ段数にした状態（1マス 10×10） */
function uniform(level: number): WipeState {
  const s = createWipe(AREA, seededRng(1), 10, 20);
  s.dirt.fill(level);
  return s;
}

/** 1回のストロークで (x0,y0)→(x1,y1) をなでる */
function stroke(s: WipeState, x0: number, y0: number, x1: number, y1: number, r = 6) {
  beginStroke(s);
  rubAt(s, x0, y0, r);
  rubLine(s, x0, y0, x1, y1, r);
  endStroke(s);
}

describe('wipe: 汚れの初期配置', () => {
  it('どのマスも1〜最大段数で、しつこい汚れ（2段以上）が混ざる', () => {
    for (let seed = 1; seed <= 20; seed++) {
      const s = createWipe(AREA, seededRng(seed), 10, 20);
      expect(s.dirt.every((d) => d >= 1 && d <= WIPE_MAX_DIRT)).toBe(true);
      expect(s.dirt.some((d) => d >= 2)).toBe(true);
    }
  });

  it('最初は拭けた割合も品質も0', () => {
    const s = createWipe(AREA, seededRng(3), 10, 20);
    expect(cleanRatio(s)).toBe(0);
    expect(wipeQuality(s)).toBe(0);
  });
});

describe('wipe: こする', () => {
  it('1回なでると、触れたマスの汚れが1段減る', () => {
    const s = uniform(2);
    beginStroke(s);
    expect(rubAt(s, 5, 5, 4)).toBe(1);
    expect(s.dirt[0]).toBe(1);
  });

  it('指を置いたまま動かさなければ、同じマスは減らない', () => {
    const s = uniform(3);
    beginStroke(s);
    rubAt(s, 5, 5, 4);
    rubAt(s, 5, 5, 4);
    rubAt(s, 6, 5, 4);
    expect(s.dirt[0]).toBe(2);
  });

  it('同じストロークでも、離れてから戻ると2回目として数える', () => {
    const s = uniform(3);
    beginStroke(s);
    rubLine(s, 5, 5, 95, 5, 4);
    rubLine(s, 95, 5, 5, 5, 4);
    expect(s.dirt[0]).toBe(1);
  });

  it('半径の縁で少し出入りしても、回数は増えない', () => {
    const s = uniform(3);
    beginStroke(s);
    rubAt(s, 5, 5, 4); // マス0の中心(5,5)に触れる
    rubAt(s, 9.5, 5, 4); // 半径4を少し超えるが、離れた判定(4×1.25)の内側
    rubAt(s, 5, 5, 4);
    expect(s.dirt[0]).toBe(2);
  });

  it('3段の汚れは3往復で落ちる', () => {
    const s = uniform(3);
    stroke(s, 5, 5, 95, 5);
    stroke(s, 5, 5, 95, 5);
    expect(s.dirt.slice(0, 10).every((d) => d === 1)).toBe(true);
    stroke(s, 5, 5, 95, 5);
    expect(s.dirt.slice(0, 10).every((d) => d === 0)).toBe(true);
  });

  it('素早いドラッグでも線上に隙間ができない', () => {
    const s = uniform(1);
    beginStroke(s);
    rubAt(s, 5, 5, 6);
    rubLine(s, 5, 5, 95, 5, 6);
    expect(s.dirt.slice(0, 10).every((d) => d === 0)).toBe(true);
  });

  it('きれいになったマスをこすっても0未満にならない', () => {
    const s = uniform(1);
    stroke(s, 5, 5, 95, 5);
    stroke(s, 5, 5, 95, 5);
    expect(s.dirt.slice(0, 10).every((d) => d === 0)).toBe(true);
  });
});

describe('wipe: 品質', () => {
  it('品質は拭けた割合 ÷ 完了ライン（上限1）', () => {
    const s = uniform(1);
    s.dirt.fill(0, 0, 100); // 半分きれい
    expect(cleanRatio(s)).toBe(0.5);
    expect(wipeQuality(s)).toBeCloseTo(0.5 / WIPE_DONE);
  });

  it('完了ラインに届けば品質1', () => {
    const s = uniform(0);
    for (let i = 0; i < Math.floor(200 * (1 - WIPE_DONE)); i++) s.dirt[i] = 2;
    expect(wipeQuality(s)).toBe(1);
  });
});
