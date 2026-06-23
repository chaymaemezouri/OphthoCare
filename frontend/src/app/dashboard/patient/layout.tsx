'use client';

import type { ReactNode } from 'react';
import { useAuth, useRequireAuth } from '@/hooks/use-auth';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import {
  Bell,
  Calendar,
  FileText,
  FolderOpen,
  Home,
  LogOut,
  MessageSquare,
  Receipt,
  Search,
  Settings,
  Stethoscope,
  UserCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { APP_CONFIG } from '@/lib/constants/app-config';
import { PatientNotificationBell } from '@/components/patient/patient-notification-bell';
import { MessagingUnreadBadge } from '@/components/common/MessagingUnreadBadge';

const sidebarNav = [
  { href: '/dashboard/patient', label: "Vue d'ensemble", short: 'Accueil', icon: Home, exact: true },
  { href: '/dashboard/patient/bookings', label: 'Rendez-vous', short: 'RDV', icon: Calendar },
  { href: '/dashboard/patient/notifications', label: 'Notifications', short: 'Alertes', icon: Bell },
  { href: '/dashboard/patient/messages', label: 'Messages', short: 'Messages', icon: MessageSquare },
  { href: '/dashboard/patient/consultations', label: 'Consultations', short: 'Consult.', icon: Stethoscope },
  { href: '/dashboard/patient/documents', label: 'Documents', short: 'Docs', icon: FolderOpen },
  { href: '/dashboard/patient/receipts', label: 'Reçus', short: 'Reçus', icon: Receipt },
  { href: '/dashboard/patient/medical-records', label: 'Dossier médical', short: 'Dossier', icon: FileText },
  { href: '/dashboard/patient/profile', label: 'Profil santé', short: 'Profil', icon: UserCircle },
] as const;

function initials(first?: string | null, last?: string | null, email?: string | null) {
  const a = (first?.[0] || '').toUpperCase();
  const b = (last?.[0] || '').toUpperCase();
  if (a && b) return `${a}${b}`;
  if (a) return `${a}`;
  if (email?.[0]) return email[0].toUpperCase();
  return '?';
}

function isActive(pathname: string, href: string, exact?: boolean) {
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function PatientSectionLayout({ children }: { children: ReactNode }) {
  useRequireAuth();
  const { user, isLoading } = useAuth();
  const pathname = usePathname();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-pulse rounded-lg bg-slate-200" />
          <p className="text-sm text-slate-600">Chargement de votre espace…</p>
        </div>
      </div>
    );
  }

  if (user?.role !== 'patient') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 p-6">
        <p className="text-sm font-medium text-red-700">Accès réservé aux patients.</p>
      </div>
    );
  }

  const display =
    [user?.firstName, user?.lastName].filter(Boolean).join(' ').trim() || user?.email || 'Patient';

  const linkClass = (href: string, exact?: boolean) => {
    const active = isActive(pathname, href, exact);
    return cn(
      'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
      active
        ? 'bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-100'
        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900',
    );
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-100 pb-20 md:pb-0">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white shadow-sm">
        <div className="flex h-14 w-full items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <Link href="/dashboard/patient" className="flex shrink-0 items-center gap-2.5">
              <div className="leading-tight">
                <p className="text-sm font-semibold text-slate-900">{APP_CONFIG.APP_NAME}</p>
                <p className="text-[10px] font-medium uppercase tracking-wider text-slate-500">Portail patient</p>
              </div>
            </Link>
          </div>

          <div className="flex min-w-0 items-center gap-1 sm:gap-2">
            <Button variant="ghost" size="icon" className="rounded-lg text-slate-600 md:hidden" asChild>
              <Link href="/search" aria-label="Rechercher un praticien">
                <Search className="h-5 w-5" />
              </Link>
            </Button>
            <PatientNotificationBell />
            <MessagingUnreadBadge href="/dashboard/patient/messages" />
            <Button variant="ghost" size="icon" className="rounded-lg text-slate-600" asChild>
              <Link href="/account" aria-label="Compte et sécurité">
                <Settings className="h-5 w-5" />
              </Link>
            </Button>
            <div className="hidden items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 lg:flex">
              <span className="flex h-8 w-8 items-center justify-center rounded-md bg-white text-xs font-semibold text-blue-700 shadow-sm">
                {initials(user?.firstName, user?.lastName, user?.email)}
              </span>
              <span className="max-w-[12rem] truncate text-xs font-medium text-slate-700 xl:max-w-[16rem]">
                {display}
              </span>
            </div>
            <Button size="sm" className="hidden rounded-lg bg-blue-600 px-3 text-xs font-semibold hover:bg-blue-700 sm:inline-flex" asChild>
              <Link href="/search">Prendre RDV</Link>
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-lg border-slate-200 px-2.5 text-slate-700"
              onClick={() => signOut({ callbackUrl: '/' })}
            >
              <LogOut className="h-4 w-4 sm:mr-1.5" />
              <span className="hidden sm:inline">Déconnexion</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="flex w-full flex-1">
        <aside className="sticky top-14 hidden h-[calc(100vh-3.5rem)] w-56 shrink-0 overflow-y-auto border-r border-slate-200 bg-white p-3 md:block lg:w-64 lg:p-4 xl:w-72">
          <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">Navigation</p>
          <nav className="flex flex-col gap-0.5">
            {sidebarNav.map((item) => {
              const { href, label, icon: Icon } = item;
              const exact = 'exact' in item ? item.exact : false;
              return (
                <Link key={href} href={href} className={linkClass(href, exact)}>
                  <Icon
                    className={cn(
                      'h-4 w-4 shrink-0',
                      isActive(pathname, href, exact) ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600',
                    )}
                    strokeWidth={2}
                  />
                  {label}
                </Link>
              );
            })}
          </nav>
        </aside>

        <main className="min-h-[calc(100vh-3.5rem)] min-w-0 flex-1">{children}</main>
      </div>

      <nav className="fixed bottom-0 left-0 right-0 z-40 flex h-16 items-stretch overflow-x-auto border-t border-slate-200 bg-white shadow-[0_-4px_24px_rgba(15,23,42,0.06)] md:hidden">
        {sidebarNav.slice(0, 6).map((item) => {
          const { href, short, icon: Icon } = item;
          const exact = 'exact' in item ? item.exact : false;
          const active = isActive(pathname, href, exact);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex min-w-[4.25rem] flex-1 flex-col items-center justify-center gap-0.5 px-1 text-[10px] font-medium',
                active ? 'text-blue-700' : 'text-slate-500',
              )}
            >
              <Icon className={cn('h-5 w-5', active && 'text-blue-600')} strokeWidth={active ? 2.25 : 2} />
              <span className="max-w-full truncate">{short}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
