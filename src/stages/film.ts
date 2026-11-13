import { NOTCH, SCREEN } from './phone';
import { svgEl } from './svg';

const INSET = 2;
const HOLE_PAD = 3;

/** カメラ穴つきの保護フィルム（位置合わせ・仮固定・気泡抜きで共通）。 */
export function filmGroup(): SVGGElement {
  const g = svgEl('g', { class: 'film' });
  const x = SCREEN.x + INSET;
  const y = SCREEN.y + INSET;
  const w = SCREEN.w - INSET * 2;
  const hh = SCREEN.h - INSET * 2;
  const r = 18;
  const hx = NOTCH.x - HOLE_PAD;
  const hy = NOTCH.y - HOLE_PAD;
  const hw = NOTCH.w + HOLE_PAD * 2;
  const hh2 = NOTCH.h + HOLE_PAD * 2;
  const hr = hh2 / 2;
  const outer = `M${x + r} ${y} H${x + w - r} A${r} ${r} 0 0 1 ${x + w} ${y + r} V${y + hh - r} A${r} ${r} 0 0 1 ${x + w - r} ${y + hh} H${x + r} A${r} ${r} 0 0 1 ${x} ${y + hh - r} V${y + r} A${r} ${r} 0 0 1 ${x + r} ${y} Z`;
  const hole = `M${hx + hr} ${hy} H${hx + hw - hr} A${hr} ${hr} 0 0 1 ${hx + hw - hr} ${hy + hh2} H${hx + hr} A${hr} ${hr} 0 0 1 ${hx + hr} ${hy} Z`;
  g.append(svgEl('path', { d: `${outer} ${hole}`, 'fill-rule': 'evenodd', class: 'film__sheet' }));
  return g;
}

/** フィルムの4隅（左上→右上→右下→左下） */
export function filmCorners(): Array<{ x: number; y: number }> {
  const m = 16;
  return [
    { x: SCREEN.x + m, y: SCREEN.y + m },
    { x: SCREEN.x + SCREEN.w - m, y: SCREEN.y + m },
    { x: SCREEN.x + SCREEN.w - m, y: SCREEN.y + SCREEN.h - m },
    { x: SCREEN.x + m, y: SCREEN.y + SCREEN.h - m },
  ];
}
