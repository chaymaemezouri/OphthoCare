'use client';

import { useAuth } from '@/hooks/use-auth';
import { LandingHeader } from '@/components/marketing/landing-header';

export function PublicLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-white to-[#F8F8F6] text-[#111111] antialiased">
      <LandingHeader user={user} variant="solid" />
      <main className="pt-14 sm:pt-16">{children}</main>
    </div>
  );
}
