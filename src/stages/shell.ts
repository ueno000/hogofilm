import { h } from '../dom';
import { phoneSvg } from './phone';
import { svgEl } from './svg';

export interface StageView {
  svg: SVGSVGElement;
  /** スマホ画面の上に重ねる描画レイヤー */
  layer: SVGGElement;
  playfield: HTMLDivElement;
  controls: HTMLDivElement;
  status: HTMLParagraphElement;
}

/** 工程共通の画面（ヒント・スマホ・状態表示・操作ボタン欄）を組み立てる。 */
export function createStageView(container: HTMLElement, id: string, hint: string): StageView {
  const svg = phoneSvg();
  const layer = svgEl('g', { class: 'layer' });
  svg.append(layer);
  const playfield = h('div', { class: 'playfield', 'data-stage': id }, svg);
  const status = h('p', { class: 'stage-status' });
  const controls = h('div', { class: 'stage-controls' });
  container.append(h('p', { class: 'stage-hint' }, hint), playfield, status, controls);
  return { svg, layer, playfield, controls, status };
}

export function nextButton(label: string, onClick: () => void, primary = false): HTMLButtonElement {
  return h('button', { class: `btn ${primary ? 'btn--primary' : ''}`, onclick: onClick }, label);
}

/** 完了時に一瞬だけ余韻を置いてから次へ進むためのタイマー管理。 */
export function createDelays() {
  const ids: number[] = [];
  return {
    later(fn: () => void, ms: number) {
      ids.push(window.setTimeout(fn, ms));
    },
    clear() {
      ids.forEach((id) => clearTimeout(id));
      ids.length = 0;
    },
  };
}

export function pct(ratio: number): string {
  return `${Math.round(ratio * 100)}%`;
}
