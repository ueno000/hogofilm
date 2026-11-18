/**
 * 音のオンオフの設定（S-2）。DOM 非依存。
 * 保存先は localStorage を想定するが、読み書きできない環境（プライベートモードなど）でも音はオンで動く。
 */

/** 保存に使うキー */
export const SOUND_STORAGE_KEY = 'hogofilm.sound';

/** 初期値（はじめて遊ぶとき・保存を読めないとき）はオン */
export const SOUND_DEFAULT_ON = true;

/** 保存先として使う最小限の形（localStorage と同じ） */
export interface SoundStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

/** 保存した文字列をオンオフにする。'off' のときだけオフ、それ以外（未保存・壊れた値）は初期値 */
export function parseSoundSetting(raw: string | null | undefined): boolean {
  if (raw === 'off') return false;
  if (raw === 'on') return true;
  return SOUND_DEFAULT_ON;
}

/** オンオフを保存する文字列にする */
export function serializeSoundSetting(on: boolean): string {
  return on ? 'on' : 'off';
}

/** 保存先からオンオフを読む。保存先がない・読むと例外になるときは初期値 */
export function loadSoundOn(storage: SoundStorage | undefined): boolean {
  try {
    return parseSoundSetting(storage?.getItem(SOUND_STORAGE_KEY));
  } catch {
    return SOUND_DEFAULT_ON;
  }
}

/** オンオフを保存する。保存できなくてもゲームは止めない（その回だけ有効） */
export function saveSoundOn(storage: SoundStorage | undefined, on: boolean): void {
  try {
    storage?.setItem(SOUND_STORAGE_KEY, serializeSoundSetting(on));
  } catch {
    // 保存できない環境では、遊んでいる間だけ設定が効く
  }
}
