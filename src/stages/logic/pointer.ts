/**
 * カーソルの代わりに絵（指・シールなど）を出す入力か。
 * マウスだけ。タッチやペンは画面を直接触るので、絵は出さない。
 */
export function usesDrawnCursor(pointerType: string): boolean {
  return pointerType === 'mouse';
}
