import { SCREEN } from './phone';
import { createStageView, nextButton, pct } from './shell';
import { svgEl, trackPointer } from './svg';
import type { Stage } from './stage';
import {
  beginStroke,
  cellCenter,
  cleanRatio,
  createWipe,
  endStroke,
  rubAt,
  rubLine,
  WIPE_DONE,
  WIPE_MAX_DIRT,
  wipeQuality,
} from './logic/wipe';

/** 汚れ1段あたりの不透明度 */
const DIRT_OPACITY_PER_LEVEL = 0.2;
/** 汚れのぼかし（SVG 座標単位） */
const DIRT_BLUR = 5;
/** マスの大きさに対する汚れの楕円の半径。隣と重ねて境目をなくす */
const DIRT_SPREAD = 0.8;

export const wipeStage: Stage = {
  id: 'wipe',
  name: 'ウェットシートで拭く',
  hint: '画面をドラッグして拭こう。しつこい汚れは何度かこすって。止めどきは自分で決めよう。',
  mount(container, ctx) {
    const view = createStageView(container, 'wipe', this.hint);
    const state = createWipe(SCREEN, Math.random);
    let done = false;

    // 汚れレイヤー：マスごとの四角をぼかして、画面の形で切り抜く
    const defs = svgEl('defs');
    const clip = svgEl('clipPath', { id: 'wipe-clip' });
    clip.append(svgEl('rect', { x: SCREEN.x, y: SCREEN.y, width: SCREEN.w, height: SCREEN.h, rx: 20 }));
    const blur = svgEl('filter', { id: 'wipe-blur', x: '-10%', y: '-10%', width: '120%', height: '120%' });
    blur.append(svgEl('feGaussianBlur', { stdDeviation: DIRT_BLUR }));
    defs.append(clip, blur);

    const cellW = state.area.w / state.cols;
    const cellH = state.area.h / state.rows;
    const clipped = svgEl('g', { 'clip-path': 'url(#wipe-clip)' });
    const smudge = svgEl('g', { class: 'smudge', filter: 'url(#wipe-blur)' });
    const cells = state.dirt.map((_, i) => {
      const c = cellCenter(state, i);
      const rect = svgEl('ellipse', {
        cx: c.x.toFixed(2),
        cy: c.y.toFixed(2),
        rx: (cellW * DIRT_SPREAD).toFixed(2),
        ry: (cellH * DIRT_SPREAD).toFixed(2),
        class: 'smudge__cell',
      });
      smudge.append(rect);
      return rect;
    });
    clipped.append(smudge);
    view.layer.append(defs, clipped);

    const render = () => {
      state.dirt.forEach((level, i) => {
        cells[i].setAttribute('opacity', (Math.min(level, WIPE_MAX_DIRT) * DIRT_OPACITY_PER_LEVEL).toFixed(2));
      });
      view.status.textContent = `きれいさ ${pct(Math.min(1, cleanRatio(state) / WIPE_DONE))}`;
    };

    const untrack = trackPointer(view.playfield, view.svg, {
      start: (p) => {
        if (done) return;
        beginStroke(state);
        if (rubAt(state, p.x, p.y)) render();
      },
      move: (p, prev) => {
        if (done) return;
        if (rubLine(state, prev.x, prev.y, p.x, p.y)) render();
      },
      end: () => endStroke(state),
    });

    view.controls.append(nextButton('次へ', () => {
      if (done) return;
      done = true;
      ctx.complete(wipeQuality(state));
    }, true));
    render();

    return () => untrack();
  },
};
