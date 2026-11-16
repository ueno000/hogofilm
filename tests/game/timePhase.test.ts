import { describe, expect, it } from 'vitest';
import {
  dangerNoticeText,
  phaseNotice,
  secondMark,
  TIME_DANGER_MS,
  TIME_WARN_RATIO,
  timePhase,
} from '../../src/game/timePhase';

describe('残り時間の段階', () => {
  it('半分より前は通常、半分を過ぎたら半分経過、残り時間が規定を切ったら残りわずか', () => {
    const limit = 90_000;
    expect(timePhase(limit, limit)).toBe('normal');
    expect(timePhase(limit * TIME_WARN_RATIO, limit)).toBe('normal');
    expect(timePhase(limit * TIME_WARN_RATIO - 1, limit)).toBe('warn');
    expect(timePhase(TIME_DANGER_MS, limit)).toBe('warn');
    expect(timePhase(TIME_DANGER_MS - 1, limit)).toBe('danger');
    expect(timePhase(0, limit)).toBe('danger');
  });

  it('制限時間を変えても、割合と残り秒数で切り替わる（60秒の例）', () => {
    expect(timePhase(31_000, 60_000, 0.5, 10_000)).toBe('normal');
    expect(timePhase(29_000, 60_000, 0.5, 10_000)).toBe('warn');
    expect(timePhase(9_000, 60_000, 0.5, 10_000)).toBe('danger');
  });

  it('割合と残り秒数の両方に当てはまるときは残りわずかを優先する', () => {
    // 制限時間 15 秒なら、半分（7.5 秒）より前に残り 10 秒を切る
    expect(timePhase(9_000, 15_000, 0.5, 10_000)).toBe('danger');
  });
});

describe('段階が進んだときの合図', () => {
  it('通常→半分経過で「半分経過！」、半分経過→残りわずかで「残り○秒！」', () => {
    expect(phaseNotice('normal', 'warn')).toBe('半分経過！');
    expect(phaseNotice('warn', 'danger', 10_000)).toBe('残り10秒！');
  });

  it('同じ段階のままでは出さない（それぞれ一度だけ）', () => {
    expect(phaseNotice('normal', 'normal')).toBeUndefined();
    expect(phaseNotice('warn', 'warn')).toBeUndefined();
    expect(phaseNotice('danger', 'danger')).toBeUndefined();
  });

  it('半分経過を飛ばして残りわずかになったら、残りわずかの合図だけ出す', () => {
    expect(phaseNotice('normal', 'danger', 10_000)).toBe('残り10秒！');
  });

  it('残りわずかの文言の秒数は調整値から作る', () => {
    expect(dangerNoticeText(10_000)).toBe('残り10秒！');
    expect(dangerNoticeText(5_000)).toBe('残り5秒！');
    expect(dangerNoticeText()).toBe(`残り${TIME_DANGER_MS / 1000}秒！`);
  });
});

describe('1秒ごとの区切り', () => {
  it('表示の秒数が変わるときに値が変わる', () => {
    expect(secondMark(10_000)).toBe(10);
    expect(secondMark(9_999)).toBe(10);
    expect(secondMark(9_000)).toBe(9);
    expect(secondMark(8_999)).toBe(9);
    expect(secondMark(0)).toBe(0);
  });
});
