/** 0以上1未満を返す乱数関数。テストでは固定値を渡す。 */
export type Rng = () => number;

export function randRange(rng: Rng, min: number, max: number): number {
  return min + (max - min) * rng();
}

export function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}

/** 決まった乱数列を返す（テスト用）。 */
export function seededRng(seed: number): Rng {
  let s = seed >>> 0 || 1;
  return () => {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    return (s >>> 0) / 4294967296;
  };
}
