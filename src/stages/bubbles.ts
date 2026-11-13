import { filmGroup } from './film';
import { SCREEN } from './phone';
import { createDelays, createStageView, nextButton, pct } from './shell';
import { svgEl, trackPointer } from './svg';
import type { Stage } from './stage';
import { bubbleQuality, createBubbles, pushBubbles } from './logic/bubbles';

export const bubblesStage: Stage = {
  id: 'bubbles',
  name: '気泡を抜く',
  hint: '気泡を指で押して、画面の外まで追い出そう。',
  mount(container, ctx) {
    const view = createStageView(container, 'bubbles', this.hint);
    const bubbles = createBubbles(SCREEN, Math.random);
    const delays = createDelays();
    let done = false;

    view.layer.append(filmGroup());
    // 画面の外に出た気泡が本体の上にはみ出さないよう、画面の形で切り抜く
    const clip = svgEl('clipPath', { id: 'bubble-clip' });
    clip.append(svgEl('rect', { x: SCREEN.x, y: SCREEN.y, width: SCREEN.w, height: SCREEN.h, rx: 20 }));
    const defs = svgEl('defs');
    defs.append(clip);
    const group = svgEl('g', { 'clip-path': 'url(#bubble-clip)' });
    view.layer.append(defs, group);

    const nodes = new Map<number, SVGGElement>();
    for (const b of bubbles) {
      const g = svgEl('g', { class: 'bubble' });
      g.append(
        svgEl('circle', { r: b.r, class: 'bubble__body' }),
        svgEl('circle', { r: b.r * 0.28, cx: -b.r * 0.35, cy: -b.r * 0.35, class: 'bubble__shine' }),
      );
      group.append(g);
      nodes.set(b.id, g);
    }

    const render = () => {
      for (const b of bubbles) {
        const g = nodes.get(b.id)!;
        g.setAttribute('transform', `translate(${b.x.toFixed(1)} ${b.y.toFixed(1)})`);
        g.classList.toggle('is-out', b.out);
      }
      const q = bubbleQuality(bubbles);
      view.status.textContent = `気泡ぬき ${pct(q)}`;
      if (!done && bubbles.every((b) => b.out)) {
        done = true;
        view.playfield.classList.add('is-cleared');
        delays.later(() => ctx.complete(bubbleQuality(bubbles)), 500);
      }
    };

    const untrack = trackPointer(view.playfield, view.svg, {
      move: (p, prev) => {
        if (done) return;
        if (pushBubbles(bubbles, SCREEN, prev.x, prev.y, p.x, p.y).length) render();
      },
    });

    view.controls.append(nextButton('ここまでで仕上げ', () => {
      if (done) return;
      done = true;
      ctx.complete(bubbleQuality(bubbles));
    }));
    render();

    return () => {
      untrack();
      delays.clear();
    };
  },
};
