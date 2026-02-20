export function getGreeting(name: string): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 10) return `God morgon, ${name}`;
  if (hour >= 10 && hour < 17) return `Hej, ${name}`;
  if (hour >= 17 && hour < 22) return `God kvall, ${name}`;
  return `God natt, ${name}`;
}

export function formatSwedishDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    return date.toLocaleString('sv-SE', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateStr;
  }
}
