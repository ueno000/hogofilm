import { describe, expect, it } from 'vitest';
import {
  loadSoundOn,
  parseSoundSetting,
  saveSoundOn,
  serializeSoundSetting,
  SOUND_STORAGE_KEY,
  type SoundStorage,
} from '../../src/audio/settings';

/** 読み書きを覚えておくだけの保存先 */
function memoryStorage(initial: Record<string, string> = {}): SoundStorage & { data: Record<string, string> } {
  const data = { ...initial };
  return {
    data,
    getItem: (k) => (k in data ? data[k] : null),
    setItem: (k, v) => {
      data[k] = v;
    },
  };
}

/** 触ると例外になる保存先（プライベートモードなど） */
const brokenStorage: SoundStorage = {
  getItem: () => {
    throw new Error('blocked');
  },
  setItem: () => {
    throw new Error('blocked');
  },
};

describe('音のオンオフの設定（S-2）', () => {
  it('はじめて遊ぶとき（保存がない）はオン', () => {
    expect(parseSoundSetting(null)).toBe(true);
    expect(loadSoundOn(memoryStorage())).toBe(true);
  });

  it('保存した値でオン・オフを決める。壊れた値はオン', () => {
    expect(parseSoundSetting('off')).toBe(false);
    expect(parseSoundSetting('on')).toBe(true);
    expect(parseSoundSetting('???')).toBe(true);
  });

  it('保存して読み直すと、選んだ設定が残る', () => {
    const s = memoryStorage();
    saveSoundOn(s, false);
    expect(s.data[SOUND_STORAGE_KEY]).toBe(serializeSoundSetting(false));
    expect(loadSoundOn(s)).toBe(false);
    saveSoundOn(s, true);
    expect(loadSoundOn(s)).toBe(true);
  });

  it('保存先がない・読み書きで例外になる環境でも、オンで動き、止まらない', () => {
    expect(loadSoundOn(undefined)).toBe(true);
    expect(loadSoundOn(brokenStorage)).toBe(true);
    expect(() => saveSoundOn(brokenStorage, false)).not.toThrow();
    expect(() => saveSoundOn(undefined, false)).not.toThrow();
  });
});
