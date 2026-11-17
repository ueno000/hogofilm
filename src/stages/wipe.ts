import { SCREEN } from './phone';
import { createStageView, nextButton } from './shell';
import { svgEl, trackPointer } from './svg';
import type { Stage } from './stage';
import {
  beginStroke,
  cellCenter,
  createWipe,
  endStroke,
  isScratched,
  rubAt,
  rubLine,
  scratchedRatio,
  WIPE_MAX_DIRT,
  WIPE_RADIUS,
  wipeQuality,
} from './logic/wipe';
import { sheetTilt, wetMarks, WIPE_SHEET_DRY_MS } from './logic/wipeSheet';

/** 汚れ1段あたりの不透明度 */
export const DIRT_OPACITY_PER_LEVEL = 0.2;
/** 汚れのぼかし（SVG 座標単位） */
export const DIRT_BLUR = 5;
/** マスの大きさに対する汚れの楕円の半径。隣と重ねて境目をなくす */
export const DIRT_SPREAD = 0.8;
/** 基板の模様1枚の大きさ（SVG 座標単位） */
const CIRCUIT_TILE = 24;
/** 指を離している間、ウェットシートを置いておく場所（画面の右下の横。SVG 座標） */
const SHEET_REST = { x: 214, y: 320, tilt: -14 };
/** 濡れた光りを置く間隔（指の半径に対する割合） */
const WET_SPACING_RATIO = 0.6;

/**
 * 折りたたんだウェットシートの絵（W-8）。原点が指の位置で、大きさは指の半径 WIPE_RADIUS に合わせる。
 */
function sheetArt(): SVGGElement {
  const r = WIPE_RADIUS;
  const g = svgEl('g', { class: 'wet-sheet', 'aria-hidden': 'true' });
  const inner = svgEl('g', { class: 'wet-sheet__body' });
  inner.append(
    svgEl('rect', { x: -r * 1.05, y: -r * 0.8, width: r * 2.1, height: r * 1.6, rx: 4, class: 'wet-sheet__back' }),
    svgEl('rect', { x: -r, y: -r * 0.75, width: r * 2, height: r * 1.5, rx: 4, class: 'wet-sheet__cloth' }),
    // 折り目と、布の凹凸
    svgEl('path', { d: `M${-r} ${-r * 0.1} H${r}`, class: 'wet-sheet__fold' }),
    svgEl('path', { d: `M${-r * 0.6} ${r * 0.35} q ${r * 0.3} -${r * 0.15} ${r * 0.6} 0 t ${r * 0.6} 0`, class: 'wet-sheet__crease' }),
    svgEl('circle', { cx: r * 0.55, cy: -r * 0.45, r: 1.6, class: 'wet-sheet__drop' }),
  );
  g.append(inner);
  return g;
}

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
    // 拭いた跡の濡れた光り（見た目だけ。判定には使わない）
    const wet = svgEl('g', { class: 'wet-trail' });
    clipped.append(wet);
    view.layer.append(defs, clipped);

    // 指の位置に出すウェットシート。離している間は画面の横に置いておく（W-8）
    const sheet = sheetArt();
    view.layer.append(sheet);
    let tilt = 0;
    const placeSheet = (x: number, y: number, deg: number) => {
      sheet.setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${deg.toFixed(1)})`);
    };
    const restSheet = () => {
      tilt = 0;
      sheet.classList.remove('is-wiping');
      placeSheet(SHEET_REST.x, SHEET_REST.y, SHEET_REST.tilt);
    };
    restSheet();

    const wetTimers = new Set<number>();
    let wetCarry = 0;
    const addWet = (x: number, y: number) => {
      const mark = svgEl('circle', {
        cx: x.toFixed(1),
        cy: y.toFixed(1),
        r: WIPE_RADIUS.toFixed(1),
        class: 'wet-trail__mark',
        style: `animation-duration: ${WIPE_SHEET_DRY_MS}ms`,
      });
      wet.append(mark);
      const id = window.setTimeout(() => {
        mark.remove();
        wetTimers.delete(id);
      }, WIPE_SHEET_DRY_MS);
      wetTimers.add(id);
    };

    // きれいさの割合は表示しない。拭き残しは目で見て判断する（W-9）
    const render = () => {
      state.dirt.forEach((level, i) => {
        cells[i].setAttribute('opacity', (Math.min(level, WIPE_MAX_DIRT) * DIRT_OPACITY_PER_LEVEL).toFixed(2));
        boardCells[i].classList.toggle('is-exposed', isScratched(state, i));
      });
    };

    const untrack = trackPointer(view.playfield, view.svg, {
      start: (p) => {
        if (done) return;
        beginStroke(state);
        sheet.classList.add('is-wiping');
        placeSheet(p.x, p.y, tilt);
        wetCarry = 0;
        addWet(p.x, p.y);
        if (rubAt(state, p.x, p.y)) render();
      },
      move: (p, prev) => {
        if (done) return;
        tilt = sheetTilt(tilt, p.x - prev.x);
        placeSheet(p.x, p.y, tilt);
        const marks = wetMarks(prev.x, prev.y, p.x, p.y, WIPE_RADIUS * WET_SPACING_RATIO, wetCarry);
        wetCarry = marks.carry;
        marks.points.forEach((m) => addWet(m.x, m.y));
        if (rubLine(state, prev.x, prev.y, p.x, p.y)) render();
      },
      end: () => {
        endStroke(state);
        restSheet();
      },
    });

    view.controls.append(nextButton('次へ', () => {
      if (done) return;
      done = true;
      ctx.complete(wipeQuality(state), { scratchedRatio: scratchedRatio(state) });
    }, true));
    render();

    return () => {
      untrack();
      wetTimers.forEach((id) => clearTimeout(id));
      wetTimers.clear();
    };
  },
};
