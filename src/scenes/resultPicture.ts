import { filmPlace, floorDust, hasSideFilm } from '../game/picture';
import type { GameOutcome } from '../game/types';
import { filmGroup } from '../stages/film';
import { phoneSvg, SCREEN } from '../stages/phone';
import { svgEl } from '../stages/svg';
import { circuitPattern, DIRT_BLUR, DIRT_OPACITY_PER_LEVEL, DIRT_SPREAD } from '../stages/wipe';

/** 絵の余白（SVG 座標単位） */
const PAD = 8;
/** スマホの大きさ（phoneSvg の座標系） */
const PHONE = { w: 200, h: 400 };
/** 横にフィルムを置くときに広げる幅 */
const SIDE_W = 140;
/** 横に置いたフィルムの縮尺 */
const SIDE_FILM_SCALE = 0.6;
/** 汚れの最大段数として扱う値（不透明度が 1 を超えないようにする） */
const MAX_DIRT_DRAWN = 5;

/** 拭き残し（くもり）と、削れて見えている基板を、スマホの画面の形で切り抜いて描く */
function screenLayer(outcome: GameOutcome, defs: SVGDefsElement): SVGGElement {
  const clip = svgEl('clipPath', { id: 'result-clip' });
  clip.append(svgEl('rect', { x: SCREEN.x, y: SCREEN.y, width: SCREEN.w, height: SCREEN.h, rx: 20 }));
  const blur = svgEl('filter', { id: 'result-blur', x: '-10%', y: '-10%', width: '120%', height: '120%' });
  blur.append(svgEl('feGaussianBlur', { stdDeviation: DIRT_BLUR }));
  defs.append(clip, blur, circuitPattern('result-circuit'));

  const g = svgEl('g', { 'clip-path': 'url(#result-clip)' });
  const wipe = outcome.picture.wipe;
  if (wipe) {
    const cw = SCREEN.w / wipe.cols;
    const ch = SCREEN.h / wipe.rows;
    const center = (i: number) => ({
      x: SCREEN.x + ((i % wipe.cols) + 0.5) * cw,
      y: SCREEN.y + (Math.floor(i / wipe.cols) + 0.5) * ch,
    });
    // 削れた場所の基板（R-2）
    wipe.scratched.forEach((s, i) => {
      if (!s) return;
      const c = center(i);
      g.append(svgEl('rect', {
        x: (c.x - cw / 2 - 0.3).toFixed(2),
        y: (c.y - ch / 2 - 0.3).toFixed(2),
        width: (cw + 0.6).toFixed(2),
        height: (ch + 0.6).toFixed(2),
        fill: 'url(#result-circuit)',
      }));
    });
    // 拭き残しのくもり
    const smudge = svgEl('g', { filter: 'url(#result-blur)' });
    wipe.dirt.forEach((level, i) => {
      if (level <= 0) return;
      const c = center(i);
      smudge.append(svgEl('ellipse', {
        cx: c.x.toFixed(2),
        cy: c.y.toFixed(2),
        rx: (cw * DIRT_SPREAD).toFixed(2),
        ry: (ch * DIRT_SPREAD).toFixed(2),
        opacity: (Math.min(level, MAX_DIRT_DRAWN) * DIRT_OPACITY_PER_LEVEL).toFixed(2),
        class: 'smudge__cell',
      }));
    });
    g.append(smudge);
  }
  // 残った埃
  for (const d of outcome.picture.dust ?? []) {
    g.append(svgEl('circle', { cx: d.x.toFixed(1), cy: d.y.toFixed(1), r: d.r.toFixed(1), class: 'dust__speck' }));
  }
  return g;
}

/** 貼ってあるフィルム。位置のずれと、残った気泡の丸い影をそのまま出す（R-1） */
function filmOnPhone(outcome: GameOutcome): SVGGElement {
  const film = filmGroup();
  const off = outcome.picture.film ?? { x: 0, y: 0 };
  // 仮固定で傾いたフィルムは傾けて描く（T-2）。回す中心は画面の中心
  const tilt = outcome.picture.tilt ?? 0;
  const cx = SCREEN.x + SCREEN.w / 2;
  const cy = SCREEN.y + SCREEN.h / 2;
  film.setAttribute(
    'transform',
    `translate(${off.x.toFixed(1)} ${off.y.toFixed(1)}) rotate(${tilt.toFixed(2)} ${cx} ${cy})`,
  );
  for (const b of outcome.picture.bubbles ?? []) {
    const g = svgEl('g', { class: 'result-bubble', transform: `translate(${b.x.toFixed(1)} ${b.y.toFixed(1)})` });
    g.append(
      svgEl('circle', { r: b.r.toFixed(2), class: 'result-bubble__body' }),
      svgEl('circle', { r: (b.r * 0.28).toFixed(2), cx: (-b.r * 0.35).toFixed(2), cy: (-b.r * 0.35).toFixed(2), class: 'bubble__shine' }),
    );
    film.append(g);
  }
  return film;
}

/** 貼る前に時間切れになったとき、画面の横に置いたままのフィルム（R-5） */
function filmBeside(): SVGGElement {
  const g = svgEl('g', {
    class: 'result-film is-beside',
    transform: `translate(${PHONE.w + 24} 70) rotate(6) scale(${SIDE_FILM_SCALE}) translate(${-SCREEN.x} ${-SCREEN.y})`,
  });
  g.append(filmGroup());
  return g;
}

/** 床に落ちて埃まみれになったフィルム（R-3, R-4） */
function filmOnFloor(): SVGGElement {
  const g = svgEl('g', { class: 'result-floor' });
  const floorY = PHONE.h - 18;
  g.append(svgEl('ellipse', { cx: PHONE.w + SIDE_W / 2, cy: floorY + 6, rx: SIDE_W / 2 + 4, ry: 12, class: 'result-floor__shadow' }));
  // 横に倒れて床に寝ているように、縦につぶして少し傾ける
  const lying = svgEl('g', {
    class: 'result-film is-floor',
    transform: `translate(${PHONE.w + 8} ${floorY - 34}) skewX(-24) scale(${SIDE_FILM_SCALE + 0.12} 0.16) translate(${-SCREEN.x} ${-SCREEN.y})`,
  });
  lying.append(filmGroup());
  for (const d of floorDust(SCREEN)) {
    lying.append(svgEl('circle', { cx: d.x.toFixed(1), cy: d.y.toFixed(1), r: (d.r * 2.2).toFixed(1), class: 'dust__speck result-floor__dust' }));
  }
  g.append(lying);
  return g;
}

/**
 * 結果画面の最初に出す、仕上がったスマホの絵（R-1〜R-5）。
 * 拭き残し・残った埃・削れた基板・フィルムのずれ・残った気泡を、その回の状態のまま描く。
 * フィルムを落としたときは床のフィルム、貼る前に時間切れなら横に置いたフィルムを並べる。
 */
export function resultPicture(outcome: GameOutcome): SVGSVGElement {
  const place = filmPlace(outcome.picture, outcome.incidents);
  const width = PHONE.w + (hasSideFilm(place) ? SIDE_W : 0);
  const svg = phoneSvg();
  svg.setAttribute('viewBox', `${-PAD} ${-PAD} ${width + PAD * 2} ${PHONE.h + PAD * 2}`);
  svg.setAttribute('class', 'result-picture__svg');
  svg.setAttribute('role', 'img');
  svg.setAttribute('aria-label', '仕上がったスマホの絵');
  svg.removeAttribute('aria-hidden');

  const defs = svgEl('defs');
  svg.prepend(defs);
  svg.append(screenLayer(outcome, defs));
  // カメラ穴はくもりや埃より手前に出す
  const notch = svg.querySelector('.phone__notch');
  if (notch) svg.append(notch);
  if (place === 'on') svg.append(filmOnPhone(outcome));
  else if (place === 'beside') svg.append(filmBeside());
  else svg.append(filmOnFloor());
  return svg;
}
