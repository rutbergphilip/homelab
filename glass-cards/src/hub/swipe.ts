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
