const PREFIX = 'ophthoccare:';

export function storageGet(key: string): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(PREFIX + key);
}

export function storageSet(key: string, value: string): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(PREFIX + key, value);
}

export function storageRemove(key: string): void {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(PREFIX + key);
}
