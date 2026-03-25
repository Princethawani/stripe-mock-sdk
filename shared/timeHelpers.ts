export function now(): number {
  return Math.floor(Date.now() / 1000);
}

export function addDays(base: number, days: number): number {
  return base + days * 86_400;
}

export function addMonths(base: number, months: number): number {
  const d = new Date(base * 1000);
  d.setMonth(d.getMonth() + months);
  return Math.floor(d.getTime() / 1000);
}