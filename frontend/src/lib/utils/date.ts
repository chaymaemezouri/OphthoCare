/** Formate une date ISO en chaîne locale courte (UI). */
export function formatShortDate(iso: string, locale = 'fr-FR'): string {
  try {
    return new Intl.DateTimeFormat(locale, {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}
