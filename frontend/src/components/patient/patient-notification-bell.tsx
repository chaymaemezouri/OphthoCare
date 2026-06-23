'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Bell, CheckCheck, Loader2 } from 'lucide-react';
import { patientsApi } from '@/lib/api';
import { Button, buttonVariants } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { formatShortDate } from '@/lib/utils/date';

type NotifItem = {
  id: string;
  createdAt: string;
  readAt: string | null;
  kind: string;
  title: string;
  body?: string;
  linkPath?: string;
};

export function PatientNotificationBell() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [unread, setUnread] = useState(0);
  const [items, setItems] = useState<NotifItem[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await patientsApi.getMyNotifications();
      setUnread(data.unreadCount);
      setItems(data.items);
    } catch {
      setUnread(0);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (open) void load();
  }, [open, load]);

  const markOne = async (id: string) => {
    try {
      await patientsApi.markNotificationRead(id);
      setItems((prev) => prev.map((x) => (x.id === id ? { ...x, readAt: new Date().toISOString() } : x)));
      setUnread((n) => Math.max(0, n - 1));
    } catch {
      /* ignore */
    }
  };

  const markAll = async () => {
    try {
      await patientsApi.markAllNotificationsRead();
      setItems((prev) => prev.map((x) => ({ ...x, readAt: x.readAt ?? new Date().toISOString() })));
      setUnread(0);
    } catch {
      /* ignore */
    }
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger
        className={cn(
          buttonVariants({ variant: 'ghost', size: 'icon' }),
          'relative shrink-0 rounded-full text-zinc-600',
        )}
        aria-label="Notifications"
      >
        {loading && !items.length ? <Loader2 className="h-[1.125rem] w-[1.125rem] animate-spin" /> : <Bell className="h-[1.125rem] w-[1.125rem]" />}
        {unread > 0 ? (
          <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-blue-600 px-0.5 text-[0.5625rem] font-bold text-white ring-2 ring-white">
            {unread > 9 ? '9+' : unread}
          </span>
        ) : null}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[min(22rem,calc(100vw-1.5rem))] max-h-[min(70vh,24rem)] overflow-y-auto rounded-xl border-zinc-200 p-0">
        <DropdownMenuLabel className="flex items-center justify-between gap-2 px-3 py-2 text-sm font-semibold text-zinc-900">
          <Link href="/dashboard/patient/notifications" className="hover:underline" onClick={() => setOpen(false)}>
            Notifications
          </Link>
          {unread > 0 ? (
            <Button type="button" variant="ghost" size="sm" className="h-7 gap-1 text-xs text-blue-700" onClick={() => void markAll()}>
              <CheckCheck className="h-3.5 w-3.5" />
              Tout lu
            </Button>
          ) : null}
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="my-0" />
        {items.length === 0 ? (
          <p className="px-3 py-6 text-center text-sm text-zinc-500">Aucune notification pour l’instant.</p>
        ) : (
          items.map((n) => (
            <DropdownMenuItem
              key={n.id}
              className="cursor-pointer flex-col items-start gap-0.5 px-3 py-2"
              onClick={() => {
                if (!n.readAt) void markOne(n.id);
                if (n.linkPath) {
                  setOpen(false);
                  router.push(n.linkPath);
                }
              }}
            >
              <span className={cn('text-sm font-medium', !n.readAt && 'text-zinc-900')}>{n.title}</span>
              {n.body ? <span className="text-xs leading-snug text-zinc-600">{n.body}</span> : null}
              <span className="text-[0.625rem] text-zinc-400">{formatShortDate(n.createdAt)}</span>
            </DropdownMenuItem>
          ))
        )}
        <DropdownMenuSeparator className="my-0" />
        <div className="p-2">
          <Button variant="ghost" size="sm" className="w-full rounded-lg text-blue-700" asChild>
            <Link href="/dashboard/patient/notifications" onClick={() => setOpen(false)}>
              Voir toutes les notifications
            </Link>
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
