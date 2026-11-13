export const SVG_NS = 'http://www.w3.org/2000/svg';

export interface Point {
  x: number;
  y: number;
}

export function svgEl<K extends keyof SVGElementTagNameMap>(
  tag: K,
  attrs: Record<string, string | number> = {},
): SVGElementTagNameMap[K] {
  const el = document.createElementNS(SVG_NS, tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, String(v));
  return el;
}

/** 画面上のポインター座標を SVG の座標系（viewBox）に変換する。 */
export function toSvgPoint(svg: SVGSVGElement, clientX: number, clientY: number): Point {
  const ctm = svg.getScreenCTM();
  if (!ctm) return { x: 0, y: 0 };
  const p = new DOMPoint(clientX, clientY).matrixTransform(ctm.inverse());
  return { x: p.x, y: p.y };
}

export interface DragHandlers {
  start?(p: Point): void;
  move?(p: Point, prev: Point): void;
  end?(p: Point): void;
}

/**
 * el 上のドラッグ／タップを SVG 座標で受け取る。1本指のみ扱う。
 * 戻り値は後片付け関数。
 */
export function trackPointer(el: Element, svg: SVGSVGElement, handlers: DragHandlers): () => void {
  let activeId: number | null = null;
  let prev: Point = { x: 0, y: 0 };

  const down = (e: Event) => {
    const pe = e as PointerEvent;
    if (activeId !== null || (pe.pointerType === 'mouse' && pe.button !== 0)) return;
    activeId = pe.pointerId;
    (el as HTMLElement).setPointerCapture?.(pe.pointerId);
    prev = toSvgPoint(svg, pe.clientX, pe.clientY);
    handlers.start?.(prev);
    pe.preventDefault();
  };
  const move = (e: Event) => {
    const pe = e as PointerEvent;
    if (pe.pointerId !== activeId) return;
    const p = toSvgPoint(svg, pe.clientX, pe.clientY);
    handlers.move?.(p, prev);
    prev = p;
  };
  const up = (e: Event) => {
    const pe = e as PointerEvent;
    if (pe.pointerId !== activeId) return;
    activeId = null;
    handlers.end?.(toSvgPoint(svg, pe.clientX, pe.clientY));
  };

  el.addEventListener('pointerdown', down);
  el.addEventListener('pointermove', move);
  el.addEventListener('pointerup', up);
  el.addEventListener('pointercancel', up);
  return () => {
    el.removeEventListener('pointerdown', down);
    el.removeEventListener('pointermove', move);
    el.removeEventListener('pointerup', up);
    el.removeEventListener('pointercancel', up);
  };
}
