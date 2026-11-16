import { SCREEN } from './phone';
import { createDelays, createStageView, nextButton } from './shell';
import { svgEl, trackPointer } from './svg';
import type { Stage } from './stage';
import { createDust, dustQuality, hitDust, remainingDust, spawnDust, spawnInterval, type Dust } from './logic/dust';

export const dustStage: Stage = {
  id: 'dust',
  name: '埃を取る',
  hint: '埃は降り続ける！ 画面が空になった瞬間に「貼り始める」を押そう。',
  mount(container, ctx) {
    const view = createStageView(container, 'dust', this.hint);
    const dusts = createDust(SCREEN, Math.random);
    ctx.picture(() => ({ dust: dusts.filter((d) => !d.removed).map(({ x, y, r }) => ({ x, y, r })) }));
    const delays = createDelays();
    const startedAt = performance.now();
    let done = false;

    const nodes = new Map<number, SVGGElement>();
    const draw = (d: Dust, falling: boolean) => {
      const g = svgEl('g', { class: `dust${falling ? ' is-falling' : ''}`, transform: `translate(${d.x} ${d.y})` });
      g.append(svgEl('circle', { r: d.r, class: 'dust__speck' }));
      view.layer.append(g);
      nodes.set(d.id, g);
    };
    dusts.forEach((d) => draw(d, false));

    const update = () => {
      const left = remainingDust(dusts);
      view.status.textContent = left === 0 ? '今だ！' : `のこり ${left}個`;
      view.status.classList.toggle('is-now', left === 0);
    };

    // 埃は1個ずつ降り続け、間隔はだんだん短くなる（D-1, D-2）。
    // 落下中の扱い（D-3）は提案のままなので、降ってきた埃はすぐ着地したものとして扱う
    const scheduleNext = () => {
      delays.later(() => {
        if (done) return;
        draw(spawnDust(dusts, SCREEN, Math.random), true);
        update();
        scheduleNext();
      }, spawnInterval(performance.now() - startedAt));
    };
    scheduleNext();

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

    // 自動では進まない。止めどきはプレイヤーが決める（D-4）
    view.controls.append(nextButton('貼り始める', () => {
      if (done) return;
      done = true;
      delays.clear();
      ctx.complete(dustQuality(dusts));
    }, true));
    update();

    return () => {
      done = true;
      untrack();
      delays.clear();
    };
  },
};
