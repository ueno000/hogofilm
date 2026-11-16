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
  isScratched,
  rubAt,
  rubLine,
  scratchedRatio,
  WIPE_DONE,
  WIPE_MAX_DIRT,
  wipeQuality,
} from './logic/wipe';

/** 汚れ1段あたりの不透明度 */
export const DIRT_OPACITY_PER_LEVEL = 0.2;
/** 汚れのぼかし（SVG 座標単位） */
export const DIRT_BLUR = 5;
/** マスの大きさに対する汚れの楕円の半径。隣と重ねて境目をなくす */
export const DIRT_SPREAD = 0.8;
/** 基板の模様1枚の大きさ（SVG 座標単位） */
const CIRCUIT_TILE = 24;

/** 削れた場所に見せる基板の模様（緑の地に回路の線）。結果画面の絵でも使う */
export function circuitPattern(id = 'wipe-circuit'): SVGPatternElement {
  const t = CIRCUIT_TILE;
  const p = svgEl('pattern', { id, patternUnits: 'userSpaceOnUse', width: t, height: t });
  p.append(
    svgEl('rect', { width: t, height: t, class: 'board__base' }),
    svgEl('path', {
      d: `M0 ${t * 0.3} H${t * 0.45} V${t * 0.75} H${t} M${t * 0.7} 0 V${t * 0.3} H${t} M${t * 0.2} ${t} V${t * 0.6}`,
      class: 'board__trace',
    }),
    svgEl('circle', { cx: t * 0.45, cy: t * 0.3, r: 1.6, class: 'board__pad' }),
    svgEl('circle', { cx: t * 0.7, cy: t * 0.3, r: 1.6, class: 'board__pad' }),
    svgEl('circle', { cx: t * 0.2, cy: t * 0.6, r: 1.6, class: 'board__pad' }),
  );
  return p;
}

export const wipeStage: Stage = {
  id: 'wipe',
  name: 'ウェットシートで拭く',
  hint: '画面をドラッグして拭こう。しつこい汚れは何度かこすって。止めどきは自分で決めよう。',
  mount(container, ctx) {
    const view = createStageView(container, 'wipe', this.hint);
    const state = createWipe(SCREEN, Math.random);
    ctx.picture(() => ({
      wipe: {
        cols: state.cols,
        rows: state.rows,
        dirt: [...state.dirt],
        scratched: state.dirt.map((_, i) => isScratched(state, i)),
      },
    }));
    let done = false;

    // 汚れレイヤー：マスごとの四角をぼかして、画面の形で切り抜く
    const defs = svgEl('defs');
    const clip = svgEl('clipPath', { id: 'wipe-clip' });
    clip.append(svgEl('rect', { x: SCREEN.x, y: SCREEN.y, width: SCREEN.w, height: SCREEN.h, rx: 20 }));
    const blur = svgEl('filter', { id: 'wipe-blur', x: '-10%', y: '-10%', width: '120%', height: '120%' });
    blur.append(svgEl('feGaussianBlur', { stdDeviation: DIRT_BLUR }));
    defs.append(clip, blur, circuitPattern());

    const cellW = state.area.w / state.cols;
    const cellH = state.area.h / state.rows;
    const clipped = svgEl('g', { 'clip-path': 'url(#wipe-clip)' });

    // 基板レイヤー：削れたマスだけ見せる（隣どうしがつながるよう少し重ねる）
    const board = svgEl('g', { class: 'board' });
    const boardCells = state.scrub.map((_, i) => {
      const c = cellCenter(state, i);
      const rect = svgEl('rect', {
        x: (c.x - cellW / 2 - 0.3).toFixed(2),
        y: (c.y - cellH / 2 - 0.3).toFixed(2),
        width: (cellW + 0.6).toFixed(2),
        height: (cellH + 0.6).toFixed(2),
        fill: 'url(#wipe-circuit)',
        class: 'board__cell',
      });
      board.append(rect);
      return rect;
    });
    clipped.append(board);

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
        boardCells[i].classList.toggle('is-exposed', isScratched(state, i));
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
      ctx.complete(wipeQuality(state), { scratchedRatio: scratchedRatio(state) });
    }, true));
    render();

    return () => untrack();
  },
};
