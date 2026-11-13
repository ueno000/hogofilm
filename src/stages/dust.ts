import { SCREEN } from './phone';
import { createDelays, createStageView, nextButton } from './shell';
import { svgEl, trackPointer } from './svg';
import type { Stage } from './stage';
import { createDust, dustQuality, hitDust } from './logic/dust';

export const dustStage: Stage = {
  id: 'dust',
  name: '埃を取る',
  hint: '残った埃をタップして取り除こう。',
  mount(container, ctx) {
    const view = createStageView(container, 'dust', this.hint);
    const dusts = createDust(SCREEN, Math.random);
    const delays = createDelays();
    let done = false;

    const nodes = new Map<number, SVGGElement>();
    for (const d of dusts) {
      const g = svgEl('g', { class: 'dust', transform: `translate(${d.x} ${d.y})` });
      g.append(svgEl('circle', { r: d.r, class: 'dust__speck' }));
      view.layer.append(g);
      nodes.set(d.id, g);
    }

    const update = () => {
      const left = dusts.filter((d) => !d.removed).length;
      view.status.textContent = `のこり ${left}個`;
      if (!done && left === 0) {
        done = true;
        view.playfield.classList.add('is-cleared');
        delays.later(() => ctx.complete(dustQuality(dusts)), 400);
      }
    };

    const untrack = trackPointer(view.playfield, view.svg, {
      start: (p) => {
        if (done) return;
        const hit = hitDust(dusts, p.x, p.y);
        if (!hit) return;
        hit.removed = true;
        nodes.get(hit.id)?.classList.add('is-removed');
        update();
      },
    });

    view.controls.append(nextButton('ここまでで次へ', () => {
      if (done) return;
      done = true;
      ctx.complete(dustQuality(dusts));
    }));
    update();

    return () => {
      untrack();
      delays.clear();
    };
  },
};
