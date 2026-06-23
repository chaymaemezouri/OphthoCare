'use client';

import { SiteLanding } from '@/components/marketing/site-landing';
import { useAuth } from '@/hooks/use-auth';

export default function LandingPage() {
  const { user } = useAuth();
  return <SiteLanding user={user} />;
}
