import type { FinishPicture, Incidents, RoundSpot } from './types';
import { seededRng, randRange } from '../stages/logic/random';

/**
 * 結果画面の絵で、フィルムをどこに描くか（R-1〜R-5）。
 * - on: スマホに貼ってある（位置のずれ・残った気泡をそのまま出す）
 * - beside: 貼る前に時間切れ。画面の横に置いたまま
 * - floor: 仮固定で落とした。床に落ちて埃まみれ
 */
export type FilmPlace = 'on' | 'beside' | 'floor';

export function filmPlace(picture: FinishPicture, incidents: Pick<Incidents, 'dropped'>): FilmPlace {
  if (incidents.dropped) return 'floor';
  return picture.film ? 'on' : 'beside';
}

/** フィルムがスマホの横（または床）に描かれるか。絵の横幅を広げるのに使う */
export function hasSideFilm(place: FilmPlace): boolean {
  return place !== 'on';
}

/** 床に落ちたフィルムに付いた埃の数 */
export const FLOOR_DUST_COUNT = 22;

/**
 * 床に落ちたフィルムに付いた埃（フィルムの座標系）。
 * 毎回同じ並びになるよう、決まった乱数で作る。
 */
export function floorDust(area: { x: number; y: number; w: number; h: number }, count = FLOOR_DUST_COUNT): RoundSpot[] {
  const rng = seededRng(2026);
  return Array.from({ length: count }, () => ({
    x: randRange(rng, area.x + 6, area.x + area.w - 6),
    y: randRange(rng, area.y + 6, area.y + area.h - 6),
    r: randRange(rng, 2, 5),
  }));
}
