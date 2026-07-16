export function inDepartureWindow(now: Date, start = '06:30', end = '09:30'): boolean {
  const day = now.getDay();
  if (day === 0 || day === 6) return false;
  const mins = now.getHours() * 60 + now.getMinutes();
  const toM = (s: string) => { const [h, m] = s.split(':').map(Number); return h * 60 + m; };
  return mins >= toM(start) && mins <= toM(end);
}
