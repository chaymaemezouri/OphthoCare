/**
 * Format date to French locale
 */
export const formatDate = (date: string | Date): string => {
  const d = new Date(date);
  return d.toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

/**
 * Format time (HH:mm)
 */
export const formatTime = (time: string): string => {
  const [hours, minutes] = time.split(':');
  return `${hours}:${minutes}`;
};

/**
 * Format datetime
 */
export const formatDateTime = (date: string | Date): string => {
  const d = new Date(date);
  return d.toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Format currency (EUR)
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount);
};

/**
 * Format full name
 */
export const formatFullName = (firstName?: string, lastName?: string): string => {
  if (!firstName && !lastName) return 'Sans nom';
  if (firstName && lastName) return `${firstName} ${lastName}`;
  return firstName || lastName || 'Sans nom';
};

/**
 * Get initials from name
 */
export const getInitials = (firstName?: string, lastName?: string): string => {
  const first = firstName?.[0]?.toUpperCase() || '';
  const last = lastName?.[0]?.toUpperCase() || '';
  return (first + last).substring(0, 2) || '?';
};

/**
 * Truncate text
 */
export const truncateText = (text: string, length: number = 50): string => {
  return text.length > length ? `${text.substring(0, length)}...` : text;
};

/**
 * Get distance text
 */
export const getDistanceText = (distance?: number): string => {
  if (!distance) return 'Distance inconnue';
  if (distance < 1) return '< 1 km';
  return `${distance.toFixed(1)} km`;
};
