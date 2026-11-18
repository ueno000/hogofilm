/**
 * 画面のボタンの音（S-3）と、音のオンオフのボタン（S-2）。
 */
import { h } from '../dom';
import { isSoundOn, onSoundChange, playSound, setSoundOn, unlockSound } from './sound';

/** この属性があるボタンは「ポッ」を鳴らさない（自分で音を鳴らすボタン） */
export const NO_BUTTON_SOUND = 'data-no-pop';

/**
 * 画面のどのボタンを押しても「ポッ」を鳴らす。最初の操作で音の準備もする（iPhone 対策）。
 * 場面ごとに付け直さなくてよいように、root で一度だけ受ける。戻り値で解除する
 */
export function installButtonSound(root: HTMLElement): () => void {
  const onPointerDown = () => unlockSound();
  const onClick = (e: Event) => {
    unlockSound();
    const btn = (e.target as Element | null)?.closest?.('button');
    if (!btn || btn.disabled || btn.hasAttribute(NO_BUTTON_SOUND)) return;
    playSound('pop');
  };
  root.addEventListener('pointerdown', onPointerDown, { capture: true });
  root.addEventListener('click', onClick, { capture: true });
  return () => {
    root.removeEventListener('pointerdown', onPointerDown, { capture: true });
    root.removeEventListener('click', onClick, { capture: true });
  };
}

const SVG_NS = 'http://www.w3.org/2000/svg';

/** スピーカーの絵。オフのときは音の波の代わりに × を描く */
function speakerIcon(): SVGSVGElement {
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('aria-hidden', 'true');
  svg.innerHTML =
    '<path class="speaker__body" d="M4 9h4l5-4v14l-5-4H4z"/>' +
    '<path class="speaker__wave" d="M16 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12"/>' +
    '<path class="speaker__mute" d="M16 9l6 6M22 9l-6 6"/>';
  return svg;
}

/**
 * 音のオンオフを切り替えるスピーカーのボタン（S-2）。押すたびに切り替え、設定は保存する。
 * 戻り値の destroy で、オンオフの変化の受け取りを解除する
 */
export function speakerButton(extraClass = ''): { el: HTMLButtonElement; destroy: () => void } {
  const el = h('button', { class: `speaker ${extraClass}`.trim(), type: 'button', [NO_BUTTON_SOUND]: true });
  el.append(speakerIcon());
  const render = (on: boolean) => {
    el.classList.toggle('is-off', !on);
    el.setAttribute('aria-pressed', String(on));
    el.setAttribute('aria-label', on ? '音：オン（押すとオフ）' : '音：オフ（押すとオン）');
  };
  render(isSoundOn());
  el.addEventListener('click', () => {
    const next = !isSoundOn();
    setSoundOn(next);
    // オンにしたことが分かるように鳴らす。オフにしたときは鳴らさない
    if (next) playSound('pop');
  });
  const destroy = onSoundChange(render);
  return { el, destroy };
}
