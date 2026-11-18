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

let noise: AudioBuffer | undefined;
/** 雑音の素（1秒分の白色雑音）。一度作って使い回す */
function noiseBuffer(ac: AudioContext): AudioBuffer {
  if (noise && noise.sampleRate === ac.sampleRate) return noise;
  noise = ac.createBuffer(1, ac.sampleRate, ac.sampleRate);
  const data = noise.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  return noise;
}

/** 1つの音を鳴らす。pitch は高さの倍率（泡の粒を少しずつ違う高さにするときに使う） */
function playTone(ac: AudioContext, tone: Tone, gain: number, pitch: number): void {
  const start = ac.currentTime + (tone.delay ?? 0);
  const end = start + tone.duration;
  const amp = ac.createGain();
  // 立ち上がり → なめらかに 0 へ（0 には指数で下げられないので、ごく小さい値まで下げる）
  amp.gain.setValueAtTime(0.0001, start);
  amp.gain.linearRampToValueAtTime(gain, start + tone.attack);
  amp.gain.exponentialRampToValueAtTime(0.0001, end);
  amp.connect(ac.destination);

  let src: AudioScheduledSourceNode;
  let freq: AudioParam;
  if (tone.wave === 'noise') {
    const buf = ac.createBufferSource();
    buf.buffer = noiseBuffer(ac);
    buf.loop = true;
    const filter = ac.createBiquadFilter();
    filter.type = tone.filter ?? 'bandpass';
    buf.connect(filter).connect(amp);
    src = buf;
    freq = filter.frequency;
  } else {
    const osc = ac.createOscillator();
    osc.type = tone.wave;
    osc.connect(amp);
    src = osc;
    freq = osc.frequency;
  }
  freq.setValueAtTime(tone.freq * pitch, start);
  if (tone.freqEnd !== undefined) freq.exponentialRampToValueAtTime(tone.freqEnd * pitch, end);
  src.start(start);
  src.stop(end + 0.02);
}

/**
 * 効果音を鳴らす。音がオフ・準備前・Web Audio がないときは鳴らさない。
 * scale は大きさの倍率（長押し中の小さい「ピコッ」、泡の音など）、pitch は高さの倍率
 */
export function playSound(name: SoundName, scale = 1, pitch = 1): void {
  // resume() の直後はまだ suspended のことがある。予約した音は再開したときに鳴る
  if (!on || !ctx || ctx.state === 'closed') return;
  try {
    for (const tone of SOUNDS[name]) {
      const gain = toneGain(tone, on, undefined, scale);
      if (gain > 0) playTone(ctx, tone, gain, pitch);
    }
  } catch {
    // 鳴らせなくてもゲームは止めない
  }
}

/** 繰り返し鳴らす音（気泡抜きの泡の音など）。stop で必ず止める */
export interface SoundLoop {
  stop(): void;
}

/**
 * 同じ音を intervalMs ごとに鳴らし続ける（S-8）。高さは少しずつばらつかせる。
 * 大きさは鳴らすたびに scale() で決め、0 の間は鳴らさない。工程の後片付けで stop() を呼ぶこと
 */
export function startSoundLoop(name: SoundName, intervalMs: number, scale: () => number, pitchSpread = 0.25): SoundLoop {
  const timer = window.setInterval(() => {
    const s = scale();
    if (s > 0) playSound(name, s, 1 + (Math.random() * 2 - 1) * pitchSpread);
  }, intervalMs);
  return { stop: () => window.clearInterval(timer) };
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
