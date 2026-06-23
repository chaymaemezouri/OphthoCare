/** Villes couvertes par la plateforme OphthoCare (Maroc) — affichage marketing & recherche */
export const PLATFORM_CITIES = [
  'Agadir',
  'Béni Mellal',
  'Casablanca',
  'El Jadida',
  'Essaouira',
  'Fès',
  'Kenitra',
  'Khouribga',
  'Marrakech',
  'Meknès',
  'Mohammédia',
  'Nador',
  'Oujda',
  'Rabat',
  'Safi',
  'Salé',
  'Tanger',
  'Tétouan',
] as const;

export function mergePlatformCities(apiCities: string[]): string[] {
  const set = new Set<string>(PLATFORM_CITIES);
  for (const c of apiCities) {
    const t = c?.trim();
    if (t) set.add(t);
  }
  return [...set].sort((a, b) => a.localeCompare(b, 'fr'));
}
