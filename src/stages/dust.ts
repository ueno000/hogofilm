import { SCREEN } from './phone';
import { createDelays, createStageView, nextButton } from './shell';
import { svgEl, toSvgPoint, trackPointer } from './svg';
import type { Stage } from './stage';
import {
  createDust,
  DUST_LEVEL_LABEL,
  DUST_STICKER_RADIUS,
  dustLevel,
  dustQuality,
  remainingDust,
  spawnDust,
  spawnInterval,
  stickDust,
  type Dust,
} from './logic/dust';

/** シールを押し当ててから、はがして消し始めるまでの時間（ms） */
const STAMP_HOLD_MS = 450;
/** はがして消えきるまでの時間（ms）。CSS の sticker-lift と合わせる */
const STAMP_LIFT_MS = 300;

/** 丸くて白い埃取りシールの絵（D-6）。原点が中心で、半径は DUST_STICKER_RADIUS */
function stickerArt(cls: string): SVGGElement {
  const r = DUST_STICKER_RADIUS;
  const g = svgEl('g', { class: cls, 'aria-hidden': 'true' });
  const body = svgEl('g', { class: 'sticker__body' });
  body.append(
    svgEl('circle', { r, class: 'sticker__sheet' }),
    svgEl('circle', { r: r * 0.78, class: 'sticker__glue' }),
    svgEl('path', { d: `M${-r * 0.5} ${-r * 0.45} a ${r * 0.7} ${r * 0.7} 0 0 1 ${r * 0.55} ${-r * 0.25}`, class: 'sticker__shine' }),
  );
  g.append(body);
  return g;
}

export const dustStage: Stage = {
  id: 'dust',
  name: '埃を取る',
  hint: '埃は降り続ける！ シールでまとめて取って、画面が空になった瞬間に「貼り始める」を押そう。',
  mount(container, ctx) {
    const view = createStageView(container, 'dust', this.hint);
    const dusts = createDust(SCREEN, Math.random);
    ctx.picture(() => ({ dust: dusts.filter((d) => !d.removed).map(({ x, y, r }) => ({ x, y, r })) }));
    const delays = createDelays();
    const startedAt = performance.now();
    let done = false;

    const nodes = new Map<number, SVGGElement>();
    const dustLayer = svgEl('g', { class: 'dust-layer' });
    const stampLayer = svgEl('g', { class: 'sticker-layer' });
    view.layer.append(dustLayer, stampLayer);
    const draw = (d: Dust, falling: boolean) => {
      const g = svgEl('g', { class: `dust${falling ? ' is-falling' : ''}`, transform: `translate(${d.x} ${d.y})` });
      g.append(svgEl('circle', { r: d.r, class: 'dust__speck' }));
      dustLayer.append(g);
      nodes.set(d.id, g);
    };
    dusts.forEach((d) => draw(d, false));

    // 残りの埃は数字で出さず、段階の文字で見せる（D-7）。段階が変わったときだけ書き換える
    view.status.classList.add('dust-level');
    let shownLevel = '';
    const update = () => {
      const level = dustLevel(remainingDust(dusts));
      if (level === shownLevel) return;
      if (shownLevel) view.status.classList.remove(`is-${shownLevel}`);
      shownLevel = level;
      view.status.classList.add(`is-${level}`);
      view.status.textContent = DUST_LEVEL_LABEL[level];
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

    // PC ではカーソルの位置にシールの絵を出す（タッチのときは押した場所にだけ出す）
    const cursor = stickerArt('sticker sticker--cursor');
    cursor.classList.add('is-hidden');
    view.layer.append(cursor);
    const onHover = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse' || done) return;
      const p = toSvgPoint(view.svg, e.clientX, e.clientY);
      cursor.setAttribute('transform', `translate(${p.x.toFixed(1)} ${p.y.toFixed(1)})`);
      cursor.classList.remove('is-hidden');
      view.playfield.classList.add('has-sticker-cursor');
    };
    const onLeave = () => {
      cursor.classList.add('is-hidden');
      view.playfield.classList.remove('has-sticker-cursor');
    };
    view.playfield.addEventListener('pointermove', onHover);
    view.playfield.addEventListener('pointerleave', onLeave);

    // 押した場所にシールをペタッと押し当て、取った埃をシールに付けて見せる（見た目だけ）
    const stamp = (x: number, y: number, picked: Dust[]) => {
      const g = stickerArt('sticker sticker--stamp is-pressed');
      g.setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)})`);
      const body = g.querySelector('.sticker__body')!;
      for (const d of picked) {
        body.append(svgEl('circle', { cx: (d.x - x).toFixed(1), cy: (d.y - y).toFixed(1), r: d.r, class: 'dust__speck sticker__dust' }));
      }
      stampLayer.append(g);
      cursor.classList.add('is-stamping');
      delays.later(() => {
        g.classList.add('is-lifting');
        cursor.classList.remove('is-stamping');
      }, STAMP_HOLD_MS);
      delays.later(() => g.remove(), STAMP_HOLD_MS + STAMP_LIFT_MS);
    };

    const untrack = trackPointer(view.playfield, view.svg, {
      start: (p) => {
        if (done) return;
        const picked = stickDust(dusts, p.x, p.y);
        for (const d of picked) nodes.get(d.id)?.classList.add('is-removed');
        stamp(p.x, p.y, picked);
        if (picked.length) update();
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
      view.playfield.removeEventListener('pointermove', onHover);
      view.playfield.removeEventListener('pointerleave', onLeave);
    };
  },
};
