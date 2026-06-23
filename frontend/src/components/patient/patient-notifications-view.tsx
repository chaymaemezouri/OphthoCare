'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Bell, CheckCheck, Loader2, RefreshCw } from 'lucide-react';
import { patientsApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { PatientPageHeader } from '@/components/patient/patient-page-header';
import { PatientStatCard } from '@/components/patient/patient-stat-card';
import { patientPageClass, PATIENT_CARD } from '@/components/patient/patient-dashboard-shell';
import { cn } from '@/lib/utils';
import { formatShortDate } from '@/lib/utils/date';

export type NotifItem = {
  id: string;
  createdAt: string;
  readAt: string | null;
  kind: string;
  title: string;
  body?: string;
  linkPath?: string;
};

type Filter = 'all' | 'unread';

function kindLabel(kind: string) {
  switch (kind) {
    case 'appointment':
      return 'RDV';
    case 'receipt':
      return 'Reçu';
    case 'document':
      return 'Document';
    case 'cabinet_message':
      return 'Message';
    default:
      return 'Info';
  }
}

function timeLabel(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 60) return mins < 1 ? "À l'instant" : `${mins} min`;
  const h = Math.floor(mins / 60);
  if (h < 24) return `${h} h`;
  const d = Math.floor(h / 24);
  if (d === 1) return 'Hier';
  if (d < 7) return `${d} j`;
  return formatShortDate(iso);
}

export function PatientNotificationsView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const filter: Filter = searchParams.get('filter') === 'unread' ? 'unread' : 'all';

  const [loading, setLoading] = useState(true);
  const [unread, setUnread] = useState(0);
  const [items, setItems] = useState<NotifItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await patientsApi.getMyNotifications();
      setUnread(data.unreadCount);
      setItems(data.items);
    } catch {
      setError('Impossible de charger vos notifications.');
      setItems([]);
      setUnread(0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const setFilter = (f: Filter) => {
    const p = new URLSearchParams(searchParams.toString());
    if (f === 'unread') p.set('filter', 'unread');
    else p.delete('filter');
    router.replace(`/dashboard/patient/notifications?${p.toString()}`, { scroll: false });
  };

  const visible = useMemo(() => {
    const list = filter === 'unread' ? items.filter((n) => !n.readAt) : items;
    return [...list].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
  }, [items, filter]);

  const open = async (n: NotifItem) => {
    if (!n.readAt) {
      try {
        await patientsApi.markNotificationRead(n.id);
        setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, readAt: new Date().toISOString() } : x)));
        setUnread((c) => Math.max(0, c - 1));
      } catch {
        /* continue navigation */
      }
    }
    if (n.linkPath) router.push(n.linkPath);
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
    <div className={patientPageClass('space-y-6')}>
      <PatientPageHeader
        title="Notifications"
        description={
          unread > 0
            ? `${unread} alerte${unread > 1 ? 's' : ''} non lue${unread > 1 ? 's' : ''} — rappels RDV, documents et messages cabinet.`
            : 'Tout est à jour. Les nouvelles alertes apparaîtront ici.'
        }
        actions={
          <>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-lg border-slate-200"
              onClick={() => void load()}
              disabled={loading}
            >
              <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} aria-hidden />
            </Button>
            {unread > 0 ? (
              <Button type="button" size="sm" className="rounded-lg bg-blue-600 hover:bg-blue-700" onClick={() => void markAll()}>
                <CheckCheck className="mr-1.5 h-4 w-4" aria-hidden />
                Tout marquer lu
              </Button>
            ) : null}
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <PatientStatCard
          label="Non lues"
          value={unread}
          hint={unread > 0 ? 'À consulter' : 'Rien en attente'}
          icon={Bell}
          accent={unread > 0 ? 'amber' : 'slate'}
        />
        <PatientStatCard label="Total" value={items.length} hint="Historique des alertes" icon={Bell} accent="blue" />
      </div>

      <div className="flex gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1">
        {(
          [
            { id: 'all' as const, label: 'Toutes' },
            { id: 'unread' as const, label: 'Non lues' },
          ] as const
        ).map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setFilter(t.id)}
            className={cn(
              'flex-1 rounded-lg py-2 text-sm font-medium transition',
              filter === t.id ? 'bg-white text-blue-700 shadow-sm ring-1 ring-blue-100' : 'text-slate-600 hover:text-slate-900',
            )}
          >
            {t.label}
            {t.id === 'unread' && unread > 0 ? (
              <span className="ml-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-blue-600 px-1 text-[10px] font-bold text-white">
                {unread}
              </span>
            ) : null}
          </button>
        ))}
      </div>

      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900">
          {error}{' '}
          <button type="button" className="font-medium underline" onClick={() => void load()}>
            Réessayer
          </button>
        </p>
      ) : null}

      <div>
        {loading && items.length === 0 ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-7 w-7 animate-spin text-blue-600" aria-hidden />
          </div>
        ) : visible.length === 0 ? (
          <div className={cn(PATIENT_CARD, 'border-dashed px-6 py-12 text-center')}>
            <Bell className="mx-auto h-8 w-8 text-slate-300" strokeWidth={1.5} aria-hidden />
            <p className="mt-3 text-sm font-medium text-slate-900">
              {filter === 'unread' ? 'Aucune alerte non lue' : 'Aucune notification'}
            </p>
            <p className="mt-1 text-xs text-slate-500">Les rappels RDV et messages cabinet apparaîtront ici.</p>
            {filter === 'all' ? (
              <Button asChild variant="outline" size="sm" className="mt-5 rounded-lg border-slate-200">
                <Link href="/dashboard/patient/bookings">Mes rendez-vous</Link>
              </Button>
            ) : (
              <Button type="button" variant="ghost" size="sm" className="mt-5 text-blue-700" onClick={() => setFilter('all')}>
                Voir toutes
              </Button>
            )}
          </div>
        ) : (
          <ul className={cn(PATIENT_CARD, 'divide-y divide-slate-100 overflow-hidden p-0')}>
            {visible.map((n) => {
              const isUnread = !n.readAt;
              return (
                <li key={n.id}>
                  <button
                    type="button"
                    onClick={() => void open(n)}
                    className={cn(
                      'flex w-full gap-3 px-4 py-3.5 text-left transition hover:bg-slate-50',
                      isUnread && 'bg-blue-50/50',
                    )}
                  >
                    <span
                      className={cn(
                        'mt-1.5 h-2 w-2 shrink-0 rounded-full',
                        isUnread ? 'bg-blue-600' : 'bg-transparent',
                      )}
                      aria-hidden
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                          {kindLabel(n.kind)}
                        </span>
                        <span className="shrink-0 text-[11px] text-slate-400">{timeLabel(n.createdAt)}</span>
                      </div>
                      <p className={cn('mt-0.5 text-sm leading-snug', isUnread ? 'font-semibold text-slate-900' : 'text-slate-700')}>
                        {n.title}
                      </p>
                      {n.body ? (
                        <p className="mt-0.5 line-clamp-2 text-xs text-slate-500">{n.body}</p>
                      ) : null}
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

export function PatientNotificationsLoading() {
  return (
    <div className={patientPageClass('flex justify-center py-16')}>
      <Loader2 className="h-7 w-7 animate-spin text-blue-600" aria-hidden />
    </div>
  );
}
