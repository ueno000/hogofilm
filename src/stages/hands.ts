import { SCREEN } from './phone';
import { svgEl } from './svg';

/**
 * 手のひらの形（指を立てた手。512×512 の座標）。ユーザー提供の「手アイコン.svg」のパス。
 * 指先が上（y ≈ 0）、手首が下（y = 512）、親指が左。
 */
const HAND_PATH =
  'M423.658,63.034c0-12.55-10.198-22.733-22.724-22.733c-12.542,0-22.708,10.183-22.708,22.733V175.26' +
  'c-4.59-1.123-9.488-2.182-14.644-3.241V30.895c0-12.55-10.215-22.7-22.724-22.7c-12.542,0-22.725,10.15-22.725,22.7v131.677' +
  'c-4.897-1.075-9.778-2.093-14.627-3.038V22.701C303.505,10.207,293.323,0,280.813,0c-12.591,0-22.724,10.207-22.724,22.701v131.297' +
  'c-5.156,0-9.956,0.444-14.628,1.188V63.487c0-12.518-10.215-22.676-22.725-22.676c-12.558,0-22.708,10.158-22.708,22.676' +
  'c0,0-0.162,157.86-0.098,161.351c-2.618,21.958-42.168-22.466-76.837-31.889c-36.722-10.021-46.016,24.874-10.005,53.402' +
  'C171.925,294.637,224.47,398.959,224.47,439.01V512H381.7l-2.352-62.646c0-37.238,44.31-78.615,44.31-177.918V63.034z';

/** 手の形の中で、フィルムの角に当てる点（指先のあたり）。手の形の座標 */
const GRIP = { x: 310, y: 100 };
/** 手の大きさ（手の形 512 を何倍で描くか） */
const HAND_SCALE = 0.22;
/** フィルムの角から、指先を内側へどれだけ入れるか（SVG 座標単位） */
const CORNER_INSET = 12;

/** 汗のしずく（原点が中心、上がとがった形。SVG 座標単位） */
const SWEAT_PATH = 'M0 -8 C 3.2 -2.6 5.2 0 5.2 2.6 A5.2 5.2 0 0 1 -5.2 2.6 C -5.2 0 -3.2 -2.6 0 -8 Z';

/** 片手。震え用の内側の g に CSS アニメーションを付ける（transform 属性とぶつからないように分ける） */
function hand(transform: string, side: 'a' | 'b'): SVGGElement {
  const g = svgEl('g', { class: `hand hand--${side}`, transform });
  const tremble = svgEl('g', { class: 'hand__tremble' });
  tremble.append(
    // 袖
    svgEl('rect', { x: 200, y: 470, width: 205, height: 260, rx: 24, class: 'hand__sleeve' }),
    svgEl('rect', { x: 190, y: 455, width: 225, height: 50, rx: 18, class: 'hand__cuff' }),
    svgEl('path', { d: HAND_PATH, class: 'hand__skin' }),
    // 指先の脇の「ぷるぷる線」
    svgEl('path', { d: 'M150 40 q -22 30 0 60', class: 'hand__quiver' }),
    svgEl('path', { d: 'M115 25 q -30 45 0 90', class: 'hand__quiver hand__quiver--outer' }),
    svgEl('path', { d: 'M470 50 q 22 30 0 60', class: 'hand__quiver' }),
    svgEl('path', { d: 'M505 35 q 30 45 0 90', class: 'hand__quiver hand__quiver--outer' }),
  );
  g.append(tremble);
  return g;
}

/** 汗のしずく。位置は外側の g、垂れる動きは内側の path の CSS アニメーションで付ける */
function sweat(x: number, y: number, delay: number): SVGGElement {
  const g = svgEl('g', { transform: `translate(${x} ${y})` });
  g.append(svgEl('path', { d: SWEAT_PATH, class: 'hand__sweat', style: `animation-delay: ${delay}s` }));
  return g;
}

/**
 * フィルムの対角の2つの角（左上・右下）を持つ手と、緊張の汗。
 * フィルムの g に入れて、フィルムと一緒に動かし一緒に揺らす（手ブレの見た目。判定には使わない）
 */
export function handsGroup(): SVGGElement {
  const place = (x: number, y: number, deg: number, mirror: boolean) =>
    `translate(${x} ${y}) rotate(${deg}) scale(${mirror ? -HAND_SCALE : HAND_SCALE} ${HAND_SCALE}) translate(${-GRIP.x} ${-GRIP.y})`;
  const tl = { x: SCREEN.x + CORNER_INSET, y: SCREEN.y + CORNER_INSET };
  const br = { x: SCREEN.x + SCREEN.w - CORNER_INSET, y: SCREEN.y + SCREEN.h - CORNER_INSET };

  const g = svgEl('g', { class: 'hands', 'aria-hidden': 'true' });
  g.append(
    // 左上: 手首は左上の外、指先は右下へ
    hand(place(tl.x, tl.y, 135, false), 'a'),
    // 右下: 手首は右下の外、指先は左上へ（左右反転して反対の手に見せる）
    hand(place(br.x, br.y, -45, true), 'b'),
    sweat(tl.x + 34, tl.y - 4, 0),
    sweat(tl.x - 2, tl.y + 38, 0.8),
    sweat(br.x - 34, br.y + 4, 0.4),
    sweat(br.x + 4, br.y - 38, 1.2),
  );
  return g;
}
