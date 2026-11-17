import type { StageView } from './shell';
import { svgEl, toSvgPoint } from './svg';
import { usesDrawnCursor } from './logic/pointer';

/**
 * 指の絵。原点が指先の中心で、指は下から伸びる。指先の丸みの半径は radius（気泡を押せる指の半径）。
 */
function fingerArt(radius: number): SVGGElement {
  const r = radius;
  const len = r * 4.2;
  const g = svgEl('g', { class: 'finger-cursor is-hidden', 'aria-hidden': 'true' });
  // 押している間に、指先がフィルムに触れているところに出る影
  g.append(svgEl('ellipse', { cx: 0, cy: r * 0.15, rx: r * 0.95, ry: r * 0.55, class: 'finger-cursor__contact' }));
  const body = svgEl('g', { class: 'finger-cursor__body' });
  body.append(
    svgEl('path', { d: `M${-r} ${len} V0 A${r} ${r} 0 0 1 ${r} 0 V${len} Z`, class: 'finger-cursor__skin' }),
    svgEl('rect', { x: -r * 0.55, y: -r * 0.6, width: r * 1.1, height: r * 1.15, rx: r * 0.45, class: 'finger-cursor__nail' }),
    svgEl('path', { d: `M${-r * 0.5} ${r * 1.7} q ${r * 0.5} ${r * 0.25} ${r} 0`, class: 'finger-cursor__crease' }),
    svgEl('path', { d: `M${-r * 0.5} ${r * 2.2} q ${r * 0.5} ${r * 0.25} ${r} 0`, class: 'finger-cursor__crease' }),
  );
  g.append(body);
  return g;
}

/**
 * プレイ領域の上で、マウスのカーソルを指の絵にする（気泡抜き B-5）。
 * 押している間は指先が少し沈んだ絵に変える。タッチのときは出さない。
 * 後片付け関数を返す（元のカーソルに戻す）。
 */
export function mountFingerCursor(view: StageView, radius: number): () => void {
  const finger = fingerArt(radius);
  view.layer.append(finger);
  const { playfield, svg } = view;

  const move = (e: PointerEvent) => {
    if (!usesDrawnCursor(e.pointerType)) return;
    const p = toSvgPoint(svg, e.clientX, e.clientY);
    finger.setAttribute('transform', `translate(${p.x.toFixed(1)} ${p.y.toFixed(1)})`);
    finger.classList.remove('is-hidden');
    playfield.classList.add('has-finger-cursor');
  };
  const down = (e: PointerEvent) => {
    if (!usesDrawnCursor(e.pointerType)) return;
    move(e);
    finger.classList.add('is-pressed');
  };
  const up = () => finger.classList.remove('is-pressed');
  const leave = () => {
    finger.classList.add('is-hidden');
    finger.classList.remove('is-pressed');
    playfield.classList.remove('has-finger-cursor');
  };

  playfield.addEventListener('pointermove', move);
  playfield.addEventListener('pointerdown', down);
  playfield.addEventListener('pointerup', up);
  playfield.addEventListener('pointercancel', up);
  playfield.addEventListener('pointerleave', leave);
  return () => {
    playfield.removeEventListener('pointermove', move);
    playfield.removeEventListener('pointerdown', down);
    playfield.removeEventListener('pointerup', up);
    playfield.removeEventListener('pointercancel', up);
    playfield.removeEventListener('pointerleave', leave);
    playfield.classList.remove('has-finger-cursor');
    finger.remove();
  };
}
