/**
 * 効果音を鳴らす（S-1〜S-3）。ブラウザ標準の Web Audio で、その場で音を合成する。
 * iPhone では画面を触るまで音を出せないので、最初の操作（「スタート」など）で unlock() を呼んで準備する。
 * Web Audio が使えない環境では何も鳴らさず、ゲームはそのまま動く。
 */
import { loadSoundOn, saveSoundOn, type SoundStorage } from './settings';
import { SOUNDS, toneGain, type SoundName, type Tone } from './tones';

type Listener = (on: boolean) => void;

/** localStorage を取り出す。触るだけで例外になる環境もあるので守る */
function storage(): SoundStorage | undefined {
  try {
    return window.localStorage;
  } catch {
    return undefined;
  }
}

let ctx: AudioContext | undefined;
let on = loadSoundOn(storage());
const listeners = new Set<Listener>();

/** 音の準備をする（AudioContext を作り、止まっていれば再開する）。ユーザーの操作の中で呼ぶ */
export function unlockSound(): void {
  try {
    if (!ctx) {
      const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return;
      ctx = new Ctor();
    }
    if (ctx.state === 'suspended') void ctx.resume();
  } catch {
    ctx = undefined;
  }
}

/** 1つの音を鳴らす */
function playTone(ac: AudioContext, tone: Tone, gain: number): void {
  const start = ac.currentTime + (tone.delay ?? 0);
  const end = start + tone.duration;
  const osc = ac.createOscillator();
  const amp = ac.createGain();
  osc.type = tone.wave;
  osc.frequency.setValueAtTime(tone.freq, start);
  if (tone.freqEnd !== undefined) osc.frequency.exponentialRampToValueAtTime(tone.freqEnd, end);
  // 立ち上がり → なめらかに 0 へ（0 には指数で下げられないので、ごく小さい値まで下げる）
  amp.gain.setValueAtTime(0.0001, start);
  amp.gain.linearRampToValueAtTime(gain, start + tone.attack);
  amp.gain.exponentialRampToValueAtTime(0.0001, end);
  osc.connect(amp).connect(ac.destination);
  osc.start(start);
  osc.stop(end + 0.02);
}

/** 効果音を鳴らす。音がオフ・準備前・Web Audio がないときは鳴らさない */
export function playSound(name: SoundName, scale = 1): void {
  // resume() の直後はまだ suspended のことがある。予約した音は再開したときに鳴る
  if (!on || !ctx || ctx.state === 'closed') return;
  try {
    for (const tone of SOUNDS[name]) {
      const gain = toneGain(tone, on, undefined, scale);
      if (gain > 0) playTone(ctx, tone, gain);
    }
  } catch {
    // 鳴らせなくてもゲームは止めない
  }
}

export function isSoundOn(): boolean {
  return on;
}

/** 音のオンオフを切り替えて保存する。オンにしたときは準備もする */
export function setSoundOn(next: boolean): void {
  on = next;
  saveSoundOn(storage(), on);
  if (on) unlockSound();
  for (const fn of listeners) fn(on);
}

/** オンオフが変わったときに呼ぶ関数を登録する。戻り値で解除する */
export function onSoundChange(fn: Listener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
