let _counter = 0;

export function generateId(prefix: string): string {
  _counter += 1;
  const rand = Math.random().toString(36).slice(2, 8);
  return `${prefix}_${rand}${_counter}`;
}

export function resetIdCounter(): void {
  _counter = 0;
}