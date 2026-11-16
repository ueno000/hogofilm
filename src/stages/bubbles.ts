import { filmGroup } from './film';
import { SCREEN } from './phone';
import { createDelays, createStageView, nextButton } from './shell';
import { svgEl, trackPointer } from './svg';
import type { Stage } from './stage';
import {
  BUBBLE_RETURN_MS,
  bubbleQuality,
  createBubbles,
  pushBubbles,
  releaseBubbles,
  returnPosition,
  type Bubble,
  type BubbleReturn,
} from './logic/bubbles';

export const bubblesStage: Stage = {
  id: 'bubbles',
  name: '気泡を抜く',
  hint: '気泡を指で押して、画面の外まで追い出そう。速すぎると割れる！',
  mount(container, ctx) {
    const view = createStageView(container, 'bubbles', this.hint);
    const bubbles = createBubbles(SCREEN, Math.random);
    ctx.picture(() => ({ bubbles: bubbles.filter((b) => !b.out).map(({ x, y, r }) => ({ x, y, r })) }));
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

    const nodes = new Map<number, { g: SVGGElement; body: SVGCircleElement; shine: SVGCircleElement }>();
    const node = (b: Bubble) => {
      let n = nodes.get(b.id);
      if (!n) {
        const g = svgEl('g', { class: 'bubble' });
        const body = svgEl('circle', { class: 'bubble__body' });
        const shine = svgEl('circle', { class: 'bubble__shine' });
        g.append(body, shine);
        group.append(g);
        n = { g, body, shine };
        nodes.set(b.id, n);
      }
      return n;
    };

    // 割合の表示は出さない。どれだけ抜けたかは結果画面で分かる（B-3）
    const render = () => {
      for (const b of bubbles) {
        const { g, body, shine } = node(b);
        g.setAttribute('transform', `translate(${b.x.toFixed(1)} ${b.y.toFixed(1)})`);
        body.setAttribute('r', b.r.toFixed(2));
        shine.setAttribute('r', (b.r * 0.28).toFixed(2));
        shine.setAttribute('cx', (-b.r * 0.35).toFixed(2));
        shine.setAttribute('cy', (-b.r * 0.35).toFixed(2));
        g.classList.toggle('is-out', b.out);
      }
      if (!done && bubbles.every((b) => b.out)) {
        done = true;
        view.playfield.classList.add('is-cleared');
        delays.later(() => ctx.complete(bubbleQuality(bubbles)), 500);
      }
    };

    // 割れた気泡は、はじけたように見せる
    const popSplit = (list: Bubble[]) => {
      for (const b of list) {
        const { g } = node(b);
        g.classList.remove('is-split');
        void g.getBoundingClientRect();
        g.classList.add('is-split');
      }
    };

    // 指を離したあとの戻り（B-2）
    let returns: { ret: BubbleReturn; startedAt: number }[] = [];
    let raf = 0;
    const stepReturns = () => {
      const now = performance.now();
      returns = returns.filter(({ ret, startedAt }) => {
        const b = bubbles.find((x) => x.id === ret.id);
        if (!b || b.out) return false;
        const p = returnPosition(ret, now - startedAt);
        b.x = p.x;
        b.y = p.y;
        return now - startedAt < BUBBLE_RETURN_MS;
      });
      render();
      raf = returns.length && !done ? requestAnimationFrame(stepReturns) : 0;
    };
    const stopReturns = () => {
      returns = [];
      cancelAnimationFrame(raf);
      raf = 0;
    };

    /** この押し込みで押した気泡と、最後に押した向き */
    let pushDir = new Map<number, { x: number; y: number }>();
    let lastMoveAt = 0;

    const untrack = trackPointer(view.playfield, view.svg, {
      start: () => {
        // 戻っている途中で触ったら、その場で止める
        stopReturns();
        pushDir = new Map();
        lastMoveAt = performance.now();
      },
      move: (p, prev) => {
        if (done) return;
        const now = performance.now();
        const dt = now - lastMoveAt;
        lastMoveAt = now;
        const { pushed, split } = pushBubbles(bubbles, SCREEN, prev.x, prev.y, p.x, p.y, dt);
        for (const b of pushed) pushDir.set(b.id, { x: p.x - prev.x, y: p.y - prev.y });
        // 割れた気泡は指から離れたので、指を離しても戻さない
        for (const b of split) pushDir.delete(b.id);
        if (pushed.length || split.length) render();
        if (split.length) popSplit(split);
      },
      end: (p) => {
        if (done) return;
        const list = releaseBubbles(bubbles, SCREEN, p.x, p.y, pushDir);
        pushDir = new Map();
        if (!list.length) return;
        const startedAt = performance.now();
        returns = list.map((ret) => ({ ret, startedAt }));
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(stepReturns);
      },
    });

    view.controls.append(nextButton('ここまでで仕上げ', () => {
      if (done) return;
      done = true;
      stopReturns();
      ctx.complete(bubbleQuality(bubbles));
    }));
    render();

    return () => {
      done = true;
      untrack();
      stopReturns();
      delays.clear();
    };
  },
};
