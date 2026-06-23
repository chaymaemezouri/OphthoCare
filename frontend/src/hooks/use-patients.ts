'use client';

import { useCallback, useState } from 'react';

export function usePatients() {
  const [loading, setLoading] = useState(false);
  const fetchPatients = useCallback(async () => [], []);
  return { loading, fetchPatients };
}
