// A pointer gesture only becomes a drag (and grabs pointer capture) once it
// moves past this slop. Below it, the gesture is a tap/long-press and child
// elements keep their own pointer + click events.
export const DRAG_THRESHOLD_PX = 8;

export function isDrag(dxPx: number, threshold = DRAG_THRESHOLD_PX): boolean {
  return Math.abs(dxPx) > threshold;
}

export function settlePage(
  offsetPx: number, viewportW: number, velocityPxMs: number,
  current: number, pageCount: number
): number {
  const threshold = viewportW * 0.2;
  const flick = Math.abs(velocityPxMs) > 0.5;
  let target = current;
  if (offsetPx < -threshold || (flick && velocityPxMs < -0.5)) target = current + 1;
  else if (offsetPx > threshold || (flick && velocityPxMs > 0.5)) target = current - 1;
  return Math.max(0, Math.min(pageCount - 1, target));
}
