'use client';

import { useMemo, useState } from 'react';

export function usePagination(total: number, pageSize: number) {
  const [page, setPage] = useState(0);
  const pageCount = useMemo(() => Math.max(1, Math.ceil(total / pageSize)), [total, pageSize]);
  return { page, setPage, pageCount, pageSize };
}
