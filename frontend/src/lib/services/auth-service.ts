/** Couche service auth côté client — à étendre (refresh, logout global). */
export function clearClientSessionTokens(): void {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem('access_token');
  sessionStorage.removeItem('refresh_token');
}
