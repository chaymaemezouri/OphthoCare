'use client';

import Link from 'next/link';
import { Bell, CalendarClock, Video } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const shortcuts = [
  {
    href: '/dashboard/patient/notifications',
    icon: Bell,
    title: 'Notifications',
    description: 'RDV, reçus, messages cabinet',
  },
  {
    href: '/dashboard/patient/bookings',
    icon: CalendarClock,
    title: 'Reprogrammer',
    description: 'Déplacer un rendez-vous à venir',
  },
  {
    href: '/dashboard/patient/bookings',
    icon: Video,
    title: 'Téléconsultation',
    description: 'Rejoindre la visio depuis un RDV vidéo',
  },
] as const;

export function PatientCareShortcuts() {
  return (
    <section aria-labelledby="care-shortcuts-heading" className="space-y-3">
      <h2 id="care-shortcuts-heading" className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">
        Parcours rapide
      </h2>
      <div className="grid gap-3 sm:grid-cols-3">
        {shortcuts.map(({ href, icon: Icon, title, description }) => (
          <Link key={title} href={href} className="group block">
            <Card className="h-full border-zinc-200/80 transition hover:border-teal-200/80 hover:shadow-sm">
              <CardContent className="flex gap-3 p-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-800 ring-1 ring-teal-100 group-hover:bg-teal-100">
                  <Icon className="h-5 w-5" strokeWidth={1.75} aria-hidden />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-zinc-900">{title}</p>
                  <p className="mt-0.5 text-xs text-zinc-500 leading-snug">{description}</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  );
}
