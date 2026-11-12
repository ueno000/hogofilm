const NS = 'http://www.w3.org/2000/svg';

function svgEl<K extends keyof SVGElementTagNameMap>(
  tag: K,
  attrs: Record<string, string | number>,
): SVGElementTagNameMap[K] {
  const el = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, String(v));
  return el;
}

/** 工程画面の土台になるスマホのイラスト（200×400 の座標系）。 */
export function phoneSvg(): SVGSVGElement {
  const svg = svgEl('svg', { viewBox: '0 0 200 400', class: 'phone', 'aria-hidden': 'true' });
  svg.append(
    svgEl('rect', { x: 4, y: 4, width: 192, height: 392, rx: 30, class: 'phone__body' }),
    svgEl('rect', { x: 14, y: 22, width: 172, height: 356, rx: 20, class: 'phone__screen' }),
    svgEl('rect', { x: 78, y: 30, width: 44, height: 10, rx: 5, class: 'phone__notch' }),
  );
  return svg;
}
