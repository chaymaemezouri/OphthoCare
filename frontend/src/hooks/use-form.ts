'use client';

import { useCallback, useState } from 'react';

export function useForm<T extends Record<string, unknown>>(initial: T) {
  const [values, setValues] = useState<T>(initial);
  const setField = useCallback((key: keyof T, v: T[keyof T]) => {
    setValues((prev) => ({ ...prev, [key]: v }));
  }, []);
  const reset = useCallback(() => setValues(initial), [initial]);
  return { values, setValues, setField, reset };
}
