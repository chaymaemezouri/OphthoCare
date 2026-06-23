'use client';

import type { Doctor } from '@/types';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { formatCurrency, getInitials } from '@/lib/utils/formatters';
import { ArrowRight, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';

const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

function photoFullUrl(path?: string) {
  if (!path) return undefined;
  if (path.startsWith('http')) return path;
  return `${apiBase}${path}`;
}

function formatNextSlot(slot: { date: string; startTime: string }) {
  try {
    const d = new Date(slot.startTime);
    if (Number.isNaN(d.getTime())) return slot.date;
    return new Intl.DateTimeFormat('fr-FR', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d);
  } catch {
    return slot.date;
  }
}

interface DoctorCardProps {
  doctor: Doctor;
  className?: string;
  compact?: boolean;
}

export function DoctorCard({ doctor, className, compact = false }: DoctorCardProps) {
  const photoSrc = photoFullUrl(doctor.profilePhotoUrl);
  const fullName = `Dr. ${doctor.user.firstName} ${doctor.user.lastName}`;
  const specialty = doctor.specialtyName ?? doctor.specialtyCode;
  const trustLabels = [
    doctor.isCertified ? 'Certifié' : null,
    doctor.isVerified ? 'Vérifié' : null,
  ].filter(Boolean) as string[];

  return (
    <motion.article
      whileHover={{ y: -6 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        'group flex h-full flex-col overflow-hidden rounded-[24px] border border-[#E8EAED]/70 bg-white',
        'shadow-[0_4px_24px_rgba(15,23,42,0.05)] transition-shadow duration-300',
        'hover:shadow-[0_20px_56px_rgba(15,23,42,0.1)]',
        className,
      )}
    >
      <Link href={`/doctor/${doctor.id}`} className="relative block shrink-0 overflow-hidden">
        <div className={cn('relative w-full', compact ? 'h-28' : 'h-36 sm:h-40')}>
          {photoSrc ? (
            <img
              src={photoSrc}
              alt=""
              className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#F8F8F6] via-white to-[#F0F0F0]">
              <span className="text-3xl font-light tracking-[0.2em] text-[#111111]/25 sm:text-4xl">
                {getInitials(doctor.user.firstName, doctor.user.lastName)}
              </span>
            </div>
          )}
          <div
            className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#555555]/45 via-[#555555]/10 to-transparent"
            aria-hidden
          />
          <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5">
            <p className="text-[9px] font-bold uppercase tracking-[0.28em] text-white/75">{specialty}</p>
            <h3 className="mt-1 text-base font-medium leading-tight tracking-[-0.01em] text-white sm:text-lg">
              {fullName}
            </h3>
          </div>
          <div className="absolute right-3 top-3 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-medium tabular-nums text-[#111111] backdrop-blur-sm sm:right-4 sm:top-4">
            ★ {doctor.rating.toFixed(1)}
          </div>
        </div>
      </Link>

      <div className="flex flex-1 flex-col px-4 pb-4 pt-4 sm:px-5 sm:pb-5">
        <div className="flex items-center justify-between gap-3 text-[11px] text-[#77777D]">
          <span className="inline-flex min-w-0 items-center gap-1 truncate">
            <MapPin className="h-3 w-3 shrink-0" />
            <span className="truncate">
              {doctor.city}
              {doctor.country && doctor.country !== 'MA' ? ` · ${doctor.country}` : ''}
            </span>
          </span>
          <span className="shrink-0 tabular-nums">{doctor.reviewCount} avis</span>
        </div>

        {doctor.nextAvailableSlot ? (
          <p className="mt-3 text-[11px] font-medium uppercase tracking-[0.12em] text-[#7EADD0]">
            Prochain créneau · {formatNextSlot(doctor.nextAvailableSlot)}
          </p>
        ) : (
          <p className="mt-3 text-[11px] uppercase tracking-[0.12em] text-[#C4C4C4]">Créneaux à consulter</p>
        )}

        {trustLabels.length > 0 ? (
          <p className="mt-2 text-[10px] font-medium uppercase tracking-[0.2em] text-[#999999]">
            {trustLabels.join(' · ')}
          </p>
        ) : null}

        <div className="mt-auto flex items-end justify-between gap-4 pt-5">
          <div>
            <p className="text-[9px] font-bold uppercase tracking-[0.24em] text-[#999999]">Consultation</p>
            <p className="mt-0.5 text-lg font-medium tabular-nums tracking-tight text-[#111111] sm:text-xl">
              {formatCurrency(doctor.consultationPrice)}
            </p>
          </div>
          <Link
            href={`/book/${doctor.id}`}
            className={cn(
              'inline-flex shrink-0 items-center gap-2 rounded-full border border-[#7EADD0]/35 bg-white px-4 py-2.5',
              'text-[10px] font-semibold uppercase tracking-[0.14em] text-[#7EADD0] transition-all duration-300',
              'hover:border-[#7EADD0] hover:bg-[#7EADD0]/10 group-hover:gap-2.5',
            )}
          >
            Réserver
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </motion.article>
  );
}

export function DoctorCardSkeleton({ compact = false }: { compact?: boolean }) {
  return (
    <div className="overflow-hidden rounded-[24px] border border-[#E8EAED]/70 bg-white shadow-[0_4px_24px_rgba(15,23,42,0.04)]">
      <div className={cn('animate-pulse bg-[#F0F0F0]', compact ? 'h-28' : 'h-36 sm:h-40')} />
      <div className="space-y-3 p-4 sm:p-5">
        <div className="h-3 w-24 animate-pulse rounded bg-[#F0F0F0]" />
        <div className="h-3 w-40 animate-pulse rounded bg-[#F0F0F0]" />
        <div className="flex items-end justify-between pt-4">
          <div className="h-8 w-20 animate-pulse rounded bg-[#F0F0F0]" />
          <div className="h-9 w-24 animate-pulse rounded-full bg-[#F0F0F0]" />
        </div>
      </div>
    </div>
  );
}
