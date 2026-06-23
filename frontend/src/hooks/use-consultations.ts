'use client';

import { useCallback, useState } from 'react';

export function useConsultations() {
  const [loading, setLoading] = useState(false);
  const fetchConsultations = useCallback(async () => [], []);
  return { loading, fetchConsultations };
}
