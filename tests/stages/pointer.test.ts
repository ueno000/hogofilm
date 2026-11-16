import { describe, expect, it } from 'vitest';
import { usesDrawnCursor } from '../../src/stages/logic/pointer';

describe('カーソルの代わりに絵を出すか', () => {
  it('マウスのときだけ出す', () => {
    expect(usesDrawnCursor('mouse')).toBe(true);
  });

  it('タッチ・ペンは画面を直接触るので出さない', () => {
    expect(usesDrawnCursor('touch')).toBe(false);
    expect(usesDrawnCursor('pen')).toBe(false);
    expect(usesDrawnCursor('')).toBe(false);
  });
});
