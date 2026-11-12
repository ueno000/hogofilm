import { h } from '../dom';
import type { StageId } from '../game/types';
import { phoneSvg } from './phone';
import type { Stage } from './stage';

interface PlaceholderOptions {
  id: StageId;
  name: string;
  hint: string;
  /** 「落とす」ボタンを出す（仮固定用） */
  canDrop?: boolean;
}

/**
 * 実際の操作を実装するまでの仮工程。
 * スマホ画像の上にゲーム操作領域（touch-action: none）を置き、
 * 仮の仕上がりをスライダーで選んで「完了」で次へ進む。
 */
export function placeholderStage(opts: PlaceholderOptions): Stage {
  return {
    ...opts,
    mount(container, ctx) {
      const slider = h('input', { type: 'range', min: 0, max: 100, value: 80, 'aria-label': '仮の仕上がり' });
      const sliderValue = h('output', {}, '80%');
      slider.addEventListener('input', () => (sliderValue.textContent = `${slider.value}%`));

      const playfield = h('div', { class: 'playfield', 'data-stage': opts.id }, phoneSvg());
      const pointerLog = h('p', { class: 'playfield__log' }, 'ここが操作エリア');
      playfield.append(pointerLog);

      // Pointer Events の動作確認用（本実装で置き換える）
      const onPointer = (e: PointerEvent) => {
        if (e.type === 'pointerdown') playfield.setPointerCapture(e.pointerId);
        const r = playfield.getBoundingClientRect();
        pointerLog.textContent = `${e.type.replace('pointer', '')} ${Math.round(e.clientX - r.left)}, ${Math.round(e.clientY - r.top)}`;
      };
      for (const t of ['pointerdown', 'pointermove', 'pointerup'] as const) {
        playfield.addEventListener(t, onPointer);
      }

      container.append(
        h('p', { class: 'stage-hint' }, opts.hint),
        playfield,
        h('div', { class: 'stage-controls' },
          h('label', { class: 'dev-slider' }, '仮の仕上がり ', slider, sliderValue),
          h('div', { class: 'actions actions--row' },
            opts.canDrop
              ? h('button', { class: 'btn btn--danger', onclick: () => ctx.drop() }, '落とす')
              : null,
            h('button', {
              class: 'btn btn--primary',
              onclick: () => ctx.complete(Number(slider.value) / 100),
            }, '完了'),
          ),
        ),
      );

      return () => {
        for (const t of ['pointerdown', 'pointermove', 'pointerup'] as const) {
          playfield.removeEventListener(t, onPointer);
        }
      };
    },
  };
}
