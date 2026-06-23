/** Notifications navigateur / toasts centralisés — brancher sur sonner si besoin. */
export function notifyInfo(message: string): void {
  if (typeof window !== 'undefined') {
    // eslint-disable-next-line no-console
    console.info('[notify]', message);
  }
}
