const memory = new Map<string, { value: unknown; expires: number }>();

export function cacheGet<T>(key: string): T | undefined {
  const row = memory.get(key);
  if (!row) return undefined;
  if (Date.now() > row.expires) {
    memory.delete(key);
    return undefined;
  }
  return row.value as T;
}

export function cacheSet(key: string, value: unknown, ttlMs: number): void {
  memory.set(key, { value, expires: Date.now() + ttlMs });
}
