/**
 * Format API error response
 */
export const formatError = (error: any): string => {
  if (typeof error === 'string') return error;

  if (error?.response?.data?.message) {
    return error.response.data.message;
  }

  if (error?.message) {
    return error.message;
  }

  return 'Une erreur est survenue. Veuillez réessayer.';
};

/**
 * Check if error is network error
 */
export const isNetworkError = (error: any): boolean => {
  return !error?.response || error?.code === 'ERR_NETWORK';
};

/**
 * Check if error is auth error
 */
export const isAuthError = (error: any): boolean => {
  return error?.response?.status === 401 || error?.response?.status === 403;
};

/**
 * Check if error is validation error
 */
export const isValidationError = (error: any): boolean => {
  return error?.response?.status === 400;
};

/**
 * Get validation error messages
 */
export const getValidationErrors = (error: any): Record<string, string> => {
  if (error?.response?.data?.errors) {
    return error.response.data.errors;
  }
  return {};
};
