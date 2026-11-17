import { filmCorners, filmGroup } from './film';
import { createDelays, createStageView } from './shell';
import { svgEl, trackPointer } from './svg';
import type { Stage } from './stage';
import {
  filmAngle,
  isRingExpired,
  judgeTap,
  JUDGMENT_LABEL,
  MAX_MISSES,
  RING_TARGET,
  ringRadius,
  shouldDrop,
  tackQuality,
  tapDirection,
  tiltFor,
  type Judgment,
  type TapDirection,
} from './logic/tack';
import { param } from '../game/params';

/** 隅のタップ受付範囲（SVG 座標単位） */
const TAP_RANGE = param('TAP_RANGE');
const FIRST_DELAY = param('FIRST_DELAY');
const BETWEEN_DELAY = param('BETWEEN_DELAY');

export const tackStage: Stage = {
  id: 'tack',
  name: '仮固定する',
  hint: 'リングが丸に重なった瞬間に、光っている隅をタップ（PCはスペースキー）。',
  mount(container, ctx) {
    const view = createStageView(container, 'tack', this.hint);
    const delays = createDelays();
    const corners = filmCorners();
    const judgments: Judgment[] = [];
    /** 隅ごとの傾き（度）。合計がフィルムの角度になる（T-2） */
    const tilts: number[] = [];
    ctx.picture(() => ({ tilt: filmAngle(tilts) }));

    const film = filmGroup();
    view.layer.append(film);
    // 判定に応じてフィルムを傾ける。角度の数字は出さない（T-4: 工程の中では表示しない）
    const showTilt = () => {
      film.style.transform = `rotate(${filmAngle(tilts)}deg)`;
    };

    const markers = corners.map((c) => {
      const g = svgEl('g', { class: 'corner', transform: `translate(${c.x} ${c.y})` });
      g.append(svgEl('circle', { r: RING_TARGET, class: 'corner__target' }));
      view.layer.append(g);
      return g;
    });
    const ring = svgEl('circle', { r: 0, class: 'ring' });
    const label = svgEl('text', { class: 'judge', 'text-anchor': 'middle' });
    view.layer.append(ring, label);

    let index = 0;
    let ringStart = 0;
    let active = false;
    let finished = false;
    let rafId = 0;

    const renderStatus = () => {
      const misses = judgments.filter((j) => j === 'miss').length;
      view.status.textContent = `${Math.min(index + 1, 4)}/4隅　ミス ${misses}/${MAX_MISSES}`;
    };

    const startRing = () => {
      if (finished) return;
      const c = corners[index];
      markers.forEach((m, i) => m.classList.toggle('is-active', i === index));
      ring.setAttribute('cx', String(c.x));
      ring.setAttribute('cy', String(c.y));
      ring.classList.add('is-visible');
      ringStart = performance.now();
      active = true;
      renderStatus();
      const loop = () => {
        if (!active) return;
        const elapsed = performance.now() - ringStart;
        ring.setAttribute('r', ringRadius(elapsed).toFixed(2));
        // タップせずにリングが消えたら、遅すぎた MISS として右回りに傾ける
        if (isRingExpired(elapsed)) return resolve('miss', 1);
        rafId = requestAnimationFrame(loop);
      };
      rafId = requestAnimationFrame(loop);
    };

    const resolve = (j: Judgment, direction: TapDirection) => {
      if (!active) return;
      active = false;
      cancelAnimationFrame(rafId);
      ring.classList.remove('is-visible');
      judgments.push(j);

      const c = corners[index];
      markers[index].classList.remove('is-active');
      markers[index].classList.add(`is-${j}`);
      label.textContent = JUDGMENT_LABEL[j];
      label.setAttribute('x', String(Math.min(150, Math.max(50, c.x))));
      label.setAttribute('y', String(c.y < 200 ? c.y + 34 : c.y - 24));
      label.setAttribute('class', `judge is-${j}`);
      renderStatus();

      // 落としたときは傾けない（そのまま落ちる）
      if (shouldDrop(judgments)) {
        finished = true;
        film.classList.add('is-falling');
        markers.forEach((m) => m.classList.add('is-falling'));
        view.status.textContent = 'フィルムが落ちた！';
        delays.later(() => ctx.drop(), 900);
        return;
      }
      tilts.push(tiltFor(j, direction));
      showTilt();
      index += 1;
      if (index >= corners.length) {
        finished = true;
        view.playfield.classList.add('is-cleared');
        const angle = filmAngle(tilts);
        delays.later(() => ctx.complete(tackQuality(angle), { tiltDeg: angle }), 500);
        return;
      }
      delays.later(startRing, BETWEEN_DELAY);
    };

    const tap = () => {
      if (!active) return;
      const elapsed = performance.now() - ringStart;
      resolve(judgeTap(elapsed), tapDirection(elapsed));
    };

    const untrack = trackPointer(view.playfield, view.svg, {
      start: (p) => {
        if (!active) return;
        const c = corners[index];
        if (Math.hypot(p.x - c.x, p.y - c.y) <= TAP_RANGE) tap();
      },
    });
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        tap();
      }
    };
    window.addEventListener('keydown', onKey);

    renderStatus();
    delays.later(startRing, FIRST_DELAY);

    return () => {
      active = false;
      finished = true;
      cancelAnimationFrame(rafId);
      delays.clear();
      untrack();
      window.removeEventListener('keydown', onKey);
    };
  },
};
