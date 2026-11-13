import { svgEl } from './svg';

/** スマホの画面部分（200×400 の座標系）。各工程はこの範囲で判定する。 */
export const SCREEN = { x: 14, y: 22, w: 172, h: 356 } as const;
export const NOTCH = { x: 78, y: 30, w: 44, h: 10 } as const;

export type Area = { x: number; y: number; w: number; h: number };

/** 工程画面の土台になるスマホのイラスト。 */
export function phoneSvg(): SVGSVGElement {
  const svg = svgEl('svg', { viewBox: '0 0 200 400', class: 'phone', 'aria-hidden': 'true' });
  svg.append(
    svgEl('rect', { x: 4, y: 4, width: 192, height: 392, rx: 30, class: 'phone__body' }),
    svgEl('rect', { x: SCREEN.x, y: SCREEN.y, width: SCREEN.w, height: SCREEN.h, rx: 20, class: 'phone__screen' }),
    svgEl('rect', { x: NOTCH.x, y: NOTCH.y, width: NOTCH.w, height: NOTCH.h, rx: 5, class: 'phone__notch' }),
  );
  return svg;
}
