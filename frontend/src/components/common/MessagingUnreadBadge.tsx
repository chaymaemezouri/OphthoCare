'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { MessageSquare } from 'lucide-react';
import { messagingApi } from '@/lib/api/messaging';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export function MessagingUnreadBadge({ href }: { href: string }) {
  const { user } = useAuth();
  const [total, setTotal] = useState(0);

  useEffect(() => {
    if (!user?.id || user.role === 'trainee' || user.role === 'admin') return;
    const load = () => {
      void messagingApi.unreadTotal().then((r) => setTotal(r.total)).catch(() => setTotal(0));
    };
    load();
    const t = window.setInterval(load, 30000);
    return () => window.clearInterval(t);
  }, [user?.id, user?.role]);

  if (!user || user.role === 'trainee' || user.role === 'admin') return null;

  return (
    <Button variant="ghost" size="icon" className="relative h-9 w-9 text-slate-400" asChild>
      <Link href={href} aria-label="Messages">
        <MessageSquare className="h-4 w-4" />
        {total > 0 ? (
          <Badge className="absolute -right-0.5 -top-0.5 h-4 min-w-4 px-1 text-[10px]">
            {total > 99 ? '99+' : total}
          </Badge>
        ) : null}
      </Link>
    </Button>
  );
}
