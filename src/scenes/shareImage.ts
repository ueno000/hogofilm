import {
  fitTitle,
  shareCardContent,
  SHARE_COMMENT_MAX_LINES,
  SHARE_COMMENT_SIZE,
  SHARE_IMAGE,
  SHARE_PICTURE_AREA,
  SHARE_TEXT_AREA,
  wrapText,
  type MeasureText,
} from '../game/shareImage';
import type { GameOutcome, Tier } from '../game/types';

/** 画像の色。画面のテーマ（ダーク）に関係なく、明るいポップ調で固定する（src/style.css の :root と同じ値） */
const COLOR = {
  bg: '#fff6d6',
  dot: '#ffe58f',
  ink: '#2b2140',
  inkSoft: '#6b5f80',
  primary: '#ff5c8a',
  card: '#ffffff',
  danger: '#ff6b3d',
} as const;

/** 段階の札の色（結果画面の .axis__tier と同じ） */
const TIER_COLOR: Record<Tier, string> = { high: '#3fc8ff', mid: '#ffd84d', low: '#ffffff' };

/** 文字のフォント（src/style.css の body と同じ並び） */
const FONT_FAMILY = "'Hiragino Maru Gothic ProN', 'M PLUS Rounded 1c', 'Yu Gothic UI', system-ui, sans-serif";

/** 絵の SVG を画像にするとき、CSS から属性に写すプロパティ */
const INLINE_PROPS = ['fill', 'fill-opacity', 'stroke', 'stroke-width', 'stroke-opacity', 'opacity'] as const;

/** 背景の水玉の間隔と半径（px） */
const DOT_GAP = 48;
const DOT_R = 6;

/** 点数の札の高さと間隔（px） */
const AXIS_CARD_H = 118;
const AXIS_GAP = 14;

/** やらかしの文字サイズと、下に置くゲーム名の行の高さ（px） */
const INCIDENT_SIZE = 28;
const FOOTER_H = 50;

const font = (size: number, weight = 800) => `${weight} ${size}px ${FONT_FAMILY}`;

/**
 * 画面に出ている結果の絵（SVG）を、CSS の色を属性に写した単体の SVG 文字列にする。
 * Image に読み込むと外の CSS は効かないため。
 */
function standaloneSvg(live: SVGSVGElement, width: number, height: number): string {
  const clone = live.cloneNode(true) as SVGSVGElement;
  const src = live.querySelectorAll('*');
  const dst = clone.querySelectorAll('*');
  src.forEach((el, i) => {
    const cs = getComputedStyle(el);
    const target = dst[i];
    for (const prop of INLINE_PROPS) {
      const v = cs.getPropertyValue(prop);
      if (v) target.setAttribute(prop, v);
    }
    target.removeAttribute('class');
  });
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  clone.setAttribute('width', String(width));
  clone.setAttribute('height', String(height));
  clone.removeAttribute('class');
  return new XMLSerializer().serializeToString(clone);
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('結果の絵を画像にできませんでした'));
    img.src = url;
  });
}

/** 結果の絵を、左の領域に縦横比を保って収める大きさと位置 */
function pictureBox(live: SVGSVGElement) {
  const vb = live.viewBox.baseVal;
  const ratio = vb && vb.width > 0 ? vb.width / vb.height : 0.5;
  const area = SHARE_PICTURE_AREA;
  const w = Math.min(area.w, area.h * ratio);
  const h = w / ratio;
  return { x: area.x + (area.w - w) / 2, y: area.y + (area.h - h) / 2, w, h };
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

/** 黒い縁と下の影のついた、ポップ調の箱 */
function popBox(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number, fill: string) {
  ctx.fillStyle = COLOR.ink;
  roundRect(ctx, x, y + 5, w, h, r);
  ctx.fill();
  ctx.fillStyle = fill;
  ctx.strokeStyle = COLOR.ink;
  ctx.lineWidth = 4;
  roundRect(ctx, x, y, w, h, r);
  ctx.fill();
  ctx.stroke();
}

function drawBackground(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = COLOR.bg;
  ctx.fillRect(0, 0, SHARE_IMAGE.w, SHARE_IMAGE.h);
  ctx.fillStyle = COLOR.dot;
  for (let y = DOT_GAP / 2; y < SHARE_IMAGE.h; y += DOT_GAP) {
    for (let x = DOT_GAP / 2; x < SHARE_IMAGE.w; x += DOT_GAP) {
      ctx.beginPath();
      ctx.arc(x, y, DOT_R, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

/** 右側: 称号・ひとこと・点数の軸3つ・やらかし・ゲーム名（R-10） */
function drawText(ctx: CanvasRenderingContext2D, outcome: GameOutcome) {
  const c = shareCardContent(outcome);
  const area = SHARE_TEXT_AREA;
  const measure: MeasureText = (text, size) => {
    ctx.font = font(size, 900);
    return ctx.measureText(text).width;
  };
  ctx.textBaseline = 'top';
  ctx.textAlign = 'left';

  // 文字の下に白い板を敷いて、水玉の上でも読みやすくする
  popBox(ctx, area.x - 20, area.y - 8, area.w + 40, area.h + 16 - 5, 28, COLOR.card);

  const innerX = area.x + 8;
  const innerW = area.w - 16;

  const title = fitTitle(c.title, innerW, measure);
  const commentMeasure: MeasureText = (text, size) => {
    ctx.font = font(size, 700);
    return ctx.measureText(text).width;
  };
  const comment = wrapText(c.comment, innerW, SHARE_COMMENT_SIZE, commentMeasure, SHARE_COMMENT_MAX_LINES);
  // 中身の高さを先に出し、ゲーム名の行を除いた板の中で上下中央に置く
  const blockH =
    title.lines.length * title.fontSize * 1.25 +
    10 + comment.length * SHARE_COMMENT_SIZE * 1.4 +
    22 + AXIS_CARD_H +
    (c.incidents ? 22 + INCIDENT_SIZE : 0);
  let y = area.y + Math.max(18, (area.h - FOOTER_H - blockH) / 2);

  ctx.fillStyle = COLOR.ink;
  ctx.font = font(title.fontSize, 900);
  for (const line of title.lines) {
    ctx.fillText(line, innerX, y);
    y += title.fontSize * 1.25;
  }

  y += 10;
  ctx.fillStyle = COLOR.inkSoft;
  ctx.font = font(SHARE_COMMENT_SIZE, 700);
  for (const line of comment) {
    ctx.fillText(line, innerX, y);
    y += SHARE_COMMENT_SIZE * 1.4;
  }

  // 点数の軸3つを横に並べる
  y += 22;
  const cardW = (innerW - AXIS_GAP * 2) / 3;
  c.axes.forEach((axis, i) => {
    const x = innerX + i * (cardW + AXIS_GAP);
    popBox(ctx, x, y, cardW, AXIS_CARD_H, 18, COLOR.bg);
    ctx.textAlign = 'center';
    const cx = x + cardW / 2;
    ctx.fillStyle = COLOR.ink;
    ctx.font = font(axis.label.length > 6 ? 18 : 22, 800);
    ctx.fillText(axis.label, cx, y + 12);
    // 点数（大きく）と「点」
    ctx.font = font(48, 900);
    const scoreText = String(axis.score);
    const scoreW = ctx.measureText(scoreText).width;
    ctx.font = font(22, 800);
    const unitW = ctx.measureText('点').width;
    const badgeW = 46;
    const rowW = scoreW + 4 + unitW + 10 + badgeW;
    let rx = cx - rowW / 2;
    ctx.textAlign = 'left';
    ctx.fillStyle = COLOR.primary;
    ctx.font = font(48, 900);
    ctx.fillText(scoreText, rx, y + 48);
    rx += scoreW + 4;
    ctx.fillStyle = COLOR.ink;
    ctx.font = font(22, 800);
    ctx.fillText('点', rx, y + 70);
    rx += unitW + 10;
    // 段階の札
    ctx.fillStyle = TIER_COLOR[axis.tier];
    ctx.strokeStyle = COLOR.ink;
    ctx.lineWidth = 3;
    roundRect(ctx, rx, y + 56, badgeW, 34, 17);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = COLOR.ink;
    ctx.textAlign = 'center';
    ctx.font = font(22, 900);
    ctx.fillText(axis.tierLabel, rx + badgeW / 2, y + 62);
  });
  ctx.textAlign = 'left';
  y += AXIS_CARD_H + 22;

  if (c.incidents) {
    ctx.fillStyle = COLOR.danger;
    ctx.font = font(INCIDENT_SIZE, 900);
    ctx.fillText(c.incidents, innerX, y);
  }

  // ゲーム名とハッシュタグは右下に固定
  ctx.fillStyle = COLOR.ink;
  ctx.font = font(24, 800);
  ctx.textAlign = 'right';
  ctx.textBaseline = 'bottom';
  ctx.fillText(c.footer, area.x + area.w, area.y + area.h - 18);
}

/**
 * 結果画面の内容を1枚の PNG（1200×675）にする（R-10）。
 * live には画面に出ている結果の絵（DOM に入っている SVG）を渡す。色を CSS から読むため。
 */
export async function createShareImage(outcome: GameOutcome, live: SVGSVGElement): Promise<File> {
  const canvas = document.createElement('canvas');
  canvas.width = SHARE_IMAGE.w;
  canvas.height = SHARE_IMAGE.h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas が使えません');

  drawBackground(ctx);

  const box = pictureBox(live);
  const svgText = standaloneSvg(live, box.w, box.h);
  const url = URL.createObjectURL(new Blob([svgText], { type: 'image/svg+xml' }));
  try {
    const img = await loadImage(url);
    ctx.drawImage(img, box.x, box.y, box.w, box.h);
  } finally {
    URL.revokeObjectURL(url);
  }

  drawText(ctx, outcome);

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
  if (!blob) throw new Error('シェア画像を作れませんでした');
  return new File([blob], 'hogofilm-result.png', { type: 'image/png' });
}
