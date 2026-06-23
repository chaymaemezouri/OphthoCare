'use client';

import Link from 'next/link';
import { APP_CONFIG } from '@/lib/constants/app-config';

export function SiteHeader() {
  return (
    <header className="border-b bg-white">
      <div className="mx-auto flex h-14 max-w-7xl items-center px-4">
        <Link href="/" className="font-semibold text-slate-900">
          {APP_CONFIG.APP_NAME}
        </Link>
      </div>
    </header>
  );
}
