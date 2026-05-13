export const VALIDATION_RULES = {
  EMAIL: {
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    message: 'Email invalide',
  },
  PASSWORD: {
    minLength: 8,
    pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
    message: 'Au moins 8 caractères, 1 majuscule, 1 minuscule et 1 chiffre',
  },
  PHONE: {
    pattern: /^[0-9]{10,}$/,
    message: 'Numéro de téléphone invalide',
  },
  POSTAL_CODE: {
    pattern: /^[0-9]{5}$/,
    message: 'Code postal invalide (5 chiffres)',
  },
};

export const validateEmail = (email: string): boolean => {
  return VALIDATION_RULES.EMAIL.pattern.test(email);
};

export const validatePassword = (password: string): boolean => {
  return (
    password.length >= VALIDATION_RULES.PASSWORD.minLength &&
    VALIDATION_RULES.PASSWORD.pattern.test(password)
  );
};

export const validatePhone = (phone: string): boolean => {
  return VALIDATION_RULES.PHONE.pattern.test(phone);
};

export const validatePostalCode = (code: string): boolean => {
  return VALIDATION_RULES.POSTAL_CODE.pattern.test(code);
};
