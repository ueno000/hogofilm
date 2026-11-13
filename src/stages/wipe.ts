import { SCREEN } from './phone';
import { createDelays, createStageView, nextButton, pct } from './shell';
import { svgEl, trackPointer } from './svg';
import type { Stage } from './stage';
import { cleanRatio, createWipe, WIPE_DONE, WIPE_RADIUS, wipeAt, wipeLine, wipeQuality } from './logic/wipe';
import { randRange } from './logic/random';

export const wipeStage: Stage = {
  id: 'wipe',
  name: 'ウェットシートで拭く',
  hint: '画面をドラッグして、汚れを拭き取ろう。',
  mount(container, ctx) {
    const view = createStageView(container, 'wipe', this.hint);
    const state = createWipe(SCREEN);
    const delays = createDelays();
    let done = false;

    // 汚れレイヤー：拭いた軌跡をマスクで抜く
    const mask = svgEl('mask', { id: 'wipe-mask', maskUnits: 'userSpaceOnUse' });
    mask.append(svgEl('rect', { x: 0, y: 0, width: 200, height: 400, fill: 'white' }));
    const trail = svgEl('path', {
      d: '',
      fill: 'none',
      stroke: 'black',
      'stroke-width': WIPE_RADIUS * 2,
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round',
    });
    mask.append(trail);
    const defs = svgEl('defs');
    defs.append(mask);

    const smudge = svgEl('g', { mask: 'url(#wipe-mask)', class: 'smudge' });
    smudge.append(svgEl('rect', {
      x: SCREEN.x, y: SCREEN.y, width: SCREEN.w, height: SCREEN.h, rx: 20, class: 'smudge__base',
    }));
    for (let i = 0; i < 14; i++) {
      smudge.append(svgEl('ellipse', {
        cx: randRange(Math.random, SCREEN.x + 10, SCREEN.x + SCREEN.w - 10),
        cy: randRange(Math.random, SCREEN.y + 10, SCREEN.y + SCREEN.h - 10),
        rx: randRange(Math.random, 8, 22),
        ry: randRange(Math.random, 6, 16),
        class: 'smudge__spot',
      }));
    }
    view.layer.append(defs, smudge);

    let d = '';
    const update = () => {
      trail.setAttribute('d', d);
      const ratio = cleanRatio(state);
      view.status.textContent = `きれいさ ${pct(Math.min(1, ratio / WIPE_DONE))}`;
      if (!done && ratio >= WIPE_DONE) {
        done = true;
        view.playfield.classList.add('is-cleared');
        delays.later(() => ctx.complete(wipeQuality(state)), 400);
      }
    };

    const untrack = trackPointer(view.playfield, view.svg, {
      start: (p) => {
        if (done) return;
        d += `M${p.x.toFixed(1)} ${p.y.toFixed(1)} l0.01 0 `;
        wipeAt(state, p.x, p.y);
        update();
      },
      move: (p, prev) => {
        if (done) return;
        d += `L${p.x.toFixed(1)} ${p.y.toFixed(1)} `;
        wipeLine(state, prev.x, prev.y, p.x, p.y);
        update();
      },
    });

    view.controls.append(nextButton('ここまでで次へ', () => {
      if (done) return;
      done = true;
      ctx.complete(wipeQuality(state));
    }));
    update();

    return () => {
      untrack();
      delays.clear();
    };
  },
};
