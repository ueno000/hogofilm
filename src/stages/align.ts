import { h } from '../dom';
import { filmGroup } from './film';
import { createStageView } from './shell';
import type { Stage } from './stage';
import { ALIGN_STEP, alignLabel, alignQuality, createAlign, moveFilm, type Direction } from './logic/align';

const KEY_DIR: Record<string, Direction> = {
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
};

export const alignStage: Stage = {
  id: 'align',
  name: '位置を合わせる',
  hint: '方向ボタンで、フィルムの端とカメラ穴を合わせよう。',
  mount(container, ctx) {
    const view = createStageView(container, 'align', this.hint);
    let state = createAlign(Math.random);
    let done = false;

    const film = filmGroup();
    view.layer.append(film);

    const render = () => {
      film.setAttribute('transform', `translate(${state.sx * ALIGN_STEP} ${state.sy * ALIGN_STEP})`);
      const label = alignLabel(state);
      view.status.textContent = `ずれ：${label}`;
      view.playfield.classList.toggle('is-cleared', label === 'ぴったり');
    };

    const move = (dir: Direction) => {
      if (done) return;
      state = moveFilm(state, dir);
      render();
    };
    const confirm = () => {
      if (done) return;
      done = true;
      ctx.complete(alignQuality(state));
    };

    const dirBtn = (dir: Direction, label: string, aria: string) =>
      h('button', { class: `btn btn--pad pad-${dir}`, 'aria-label': aria, onclick: () => move(dir) }, label);

    view.controls.append(
      h('div', { class: 'align-controls' },
        h('div', { class: 'dpad' },
          dirBtn('up', '▲', '上へ'),
          dirBtn('left', '◀', '左へ'),
          dirBtn('right', '▶', '右へ'),
          dirBtn('down', '▼', '下へ'),
        ),
        h('button', { class: 'btn btn--primary', onclick: confirm }, '決定'),
      ),
    );

    const onKey = (e: KeyboardEvent) => {
      const dir = KEY_DIR[e.key];
      if (dir) {
        e.preventDefault();
        move(dir);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        confirm();
      }
    };
    window.addEventListener('keydown', onKey);
    render();

    return () => window.removeEventListener('keydown', onKey);
  },
};
