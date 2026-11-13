import { describe, expect, it } from 'vitest';
import { cleanRatio, createWipe, WIPE_DONE, wipeAt, wipeLine, wipeQuality } from '../../src/stages/logic/wipe';

const AREA = { x: 0, y: 0, w: 100, h: 200 };

describe('wipe', () => {
  it('最初は全部汚れている', () => {
    const s = createWipe(AREA, 10, 20);
    expect(cleanRatio(s)).toBe(0);
    expect(wipeQuality(s)).toBe(0);
  });

  it('指の半径内のマスだけ拭ける', () => {
    const s = createWipe(AREA, 10, 20); // 1マス 10×10
    expect(wipeAt(s, 5, 5, 4)).toBe(1);
    expect(wipeAt(s, 5, 5, 4)).toBe(0); // 同じ場所は二度数えない
    expect(cleanRatio(s)).toBeCloseTo(1 / 200);
  });

  it('素早いドラッグでも線上に隙間ができない', () => {
    const s = createWipe(AREA, 10, 20);
    wipeLine(s, 5, 5, 95, 5, 6);
    expect(s.dirty.slice(0, 10).every((d) => !d)).toBe(true);
  });

  it('画面全体を拭けば品質1、完了ライン到達でも品質1', () => {
    const s = createWipe(AREA, 10, 20);
    for (let y = 5; y < 200; y += 10) wipeLine(s, 0, y, 100, y, 6);
    expect(cleanRatio(s)).toBe(1);
    expect(wipeQuality(s)).toBe(1);

    const s2 = createWipe(AREA, 10, 20);
    s2.dirty.fill(false);
    for (let i = 0; i < Math.floor(200 * (1 - WIPE_DONE)); i++) s2.dirty[i] = true;
    expect(wipeQuality(s2)).toBe(1);
  });
});
