'use client';

import { useState } from 'react';
import type { Doctor } from '@/types';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { formatCurrency, getInitials } from '@/lib/utils/formatters';
import {
  ArrowRight,
  BadgeCheck,
  CalendarClock,
  MapPin,
  ShieldCheck,
  Star,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const SPECIALTY_ACCENTS = ['#7EADD0', '#B7A7FF', '#94C5E8', '#C4B5FD', '#6BA3C7'] as const;

function accentForSpecialty(code?: string) {
  if (!code) return SPECIALTY_ACCENTS[0];
  let h = 0;
  for (let i = 0; i < code.length; i++) h = (h + code.charCodeAt(i) * (i + 1)) % SPECIALTY_ACCENTS.length;
  return SPECIALTY_ACCENTS[h];
}

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
  const [photoError, setPhotoError] = useState(false);
  const photoSrc = photoFullUrl(doctor.profilePhotoUrl);
  const showPhoto = Boolean(photoSrc) && !photoError;
  const fullName = `Dr. ${doctor.user.firstName} ${doctor.user.lastName}`;
  const specialty = doctor.specialtyName ?? doctor.specialtyCode;
  const accent = accentForSpecialty(doctor.specialtyCode);
  const showCertified = doctor.isCertified === true;
  const showVerified = doctor.isVerified === true && !showCertified;

  return (
    <motion.article
      whileHover={{ y: -8 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        'group relative flex h-full flex-col overflow-hidden rounded-[26px] border border-[#E8EAED]/80 bg-white',
        'shadow-[0_8px_32px_rgba(15,23,42,0.06)] transition-[box-shadow,border-color] duration-500',
        'hover:border-[#7EADD0]/25 hover:shadow-[0_24px_64px_rgba(126,173,208,0.18)]',
        className,
      )}
    >
      <div
        className="pointer-events-none absolute inset-x-0 top-0 z-10 h-[3px]"
        style={{ background: `linear-gradient(90deg, ${accent}, ${accent}88, transparent)` }}
        aria-hidden
      />

      <Link href={`/doctor/${doctor.id}`} className="relative block shrink-0 overflow-hidden">
        <div className={cn('relative w-full', compact ? 'h-32 sm:h-36' : 'h-40 sm:h-44')}>
          {showPhoto ? (
            <img
              src={photoSrc}
              alt=""
              className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.05]"
              onError={() => setPhotoError(true)}
            />
          ) : (
            <div
              className="relative flex h-full w-full items-center justify-center overflow-hidden"
              style={{
                background: `linear-gradient(135deg, ${accent}22 0%, #F8F8F6 42%, ${accent}14 100%)`,
              }}
            >
              <div
                className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full blur-2xl"
                style={{ backgroundColor: `${accent}40` }}
                aria-hidden
              />
              <div
                className="pointer-events-none absolute -bottom-10 -left-6 h-28 w-28 rounded-full blur-2xl"
                style={{ backgroundColor: `${accent}25` }}
                aria-hidden
              />
              <span
                className="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-white/80 bg-white/70 text-xl font-semibold tracking-wide text-[#111111]/70 shadow-lg backdrop-blur-sm sm:h-[4.5rem] sm:w-[4.5rem] sm:text-2xl"
                style={{ color: accent }}
              >
                {getInitials(doctor.user.firstName, doctor.user.lastName)}
              </span>
            </div>
          )}

          <div
            className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#111111]/70 via-[#111111]/20 to-transparent"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100"
            aria-hidden
          />

          <div className="absolute left-3 top-3 sm:left-4 sm:top-4">
            <span
              className="inline-flex items-center rounded-full border border-white/30 bg-white/15 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.22em] text-white backdrop-blur-md"
            >
              {specialty}
            </span>
          </div>

          <div className="absolute right-3 top-3 flex items-center gap-1 rounded-full border border-white/40 bg-white/95 px-2.5 py-1 shadow-sm backdrop-blur-sm sm:right-4 sm:top-4">
            <Star className="h-3 w-3 fill-amber-400 text-amber-400" aria-hidden />
            <span className="text-[11px] font-semibold tabular-nums text-[#111111]">
              {doctor.rating.toFixed(1)}
            </span>
          </div>

          <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5">
            <h3 className="text-base font-semibold leading-tight tracking-[-0.02em] text-white sm:text-lg">
              {fullName}
            </h3>
            {doctor.bio ? (
              <p className="mt-1 line-clamp-1 text-[11px] leading-relaxed text-white/75 sm:text-xs">
                {doctor.bio}
              </p>
            ) : null}
          </div>
        </div>
      </Link>

      <div className="flex flex-1 flex-col gap-3 px-4 pb-4 pt-4 sm:gap-3.5 sm:px-5 sm:pb-5">
        <div className="flex items-center justify-between gap-2 text-[11px] text-[#77777D]">
          <span className="inline-flex min-w-0 items-center gap-1.5 truncate rounded-full bg-[#F8F8F6] px-2.5 py-1">
            <MapPin className="h-3 w-3 shrink-0 text-[#7EADD0]" />
            <span className="truncate font-medium">
              {doctor.city}
              {doctor.country && doctor.country !== 'MA' ? ` · ${doctor.country}` : ''}
            </span>
          </span>
          <span className="shrink-0 tabular-nums text-[#999999]">{doctor.reviewCount} avis</span>
        </div>

        {doctor.nextAvailableSlot ? (
          <div
            className="flex items-center gap-2.5 rounded-2xl border px-3 py-2.5"
            style={{
              borderColor: `${accent}30`,
              background: `linear-gradient(135deg, ${accent}12, white)`,
            }}
          >
            <span
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm"
              style={{ color: accent }}
            >
              <CalendarClock className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#999999]">Prochain créneau</p>
              <p className="truncate text-[12px] font-semibold text-[#111111]">
                {formatNextSlot(doctor.nextAvailableSlot)}
              </p>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-[#E8EAED] bg-[#FAFAFA] px-3 py-2.5 text-center text-[11px] text-[#AAAAAA]">
            Créneaux à consulter sur la fiche
          </div>
        )}

        {!compact && (showCertified || showVerified) ? (
          <div className="flex flex-wrap gap-1.5">
            {showCertified ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-[#7EADD0]/10 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.14em] text-[#4A7F9D]">
                <BadgeCheck className="h-3 w-3" />
                Cabinet certifié
              </span>
            ) : null}
            {showVerified ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.14em] text-slate-600">
                <ShieldCheck className="h-3 w-3" />
                Profil vérifié
              </span>
            ) : null}
          </div>
        ) : null}

        <div className="mt-auto flex items-end justify-between gap-3 border-t border-[#F0F0F0] pt-4">
          <div>
            <p className="text-[9px] font-bold uppercase tracking-[0.22em] text-[#AAAAAA]">Consultation</p>
            <p className="mt-0.5 text-xl font-semibold tabular-nums tracking-tight text-[#111111]">
              {formatCurrency(doctor.consultationPrice)}
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Link
              href={`/book/${doctor.id}`}
              className={cn(
                'inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-2.5 text-[10px] font-bold uppercase tracking-[0.12em] text-white shadow-md transition-all duration-300',
                'hover:gap-2.5 hover:shadow-lg',
              )}
              style={{
                background: `linear-gradient(135deg, #111111 0%, #2a2a2a 100%)`,
                boxShadow: `0 8px 24px ${accent}35`,
              }}
            >
              Réserver
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            <Link
              href={`/doctor/${doctor.id}`}
              className="text-[10px] font-medium text-[#999999] transition hover:text-[#7EADD0]"
            >
              Voir la fiche
            </Link>
          </div>
        </div>
      </div>
    </motion.article>
  );
}

export function DoctorCardSkeleton({ compact = false }: { compact?: boolean }) {
  return (
    <div className="overflow-hidden rounded-[26px] border border-[#E8EAED]/80 bg-white shadow-[0_8px_32px_rgba(15,23,42,0.04)]">
      <div className={cn('animate-pulse bg-gradient-to-br from-[#F0F0F0] to-[#E8EAED]/50', compact ? 'h-32 sm:h-36' : 'h-40 sm:h-44')} />
      <div className="space-y-3 p-4 sm:p-5">
        <div className="flex justify-between">
          <div className="h-7 w-28 animate-pulse rounded-full bg-[#F0F0F0]" />
          <div className="h-3 w-12 animate-pulse rounded bg-[#F0F0F0]" />
        </div>
        <div className="h-14 animate-pulse rounded-2xl bg-[#F5F5F5]" />
        <div className="flex gap-2">
          <div className="h-5 w-16 animate-pulse rounded-full bg-[#F0F0F0]" />
          <div className="h-5 w-14 animate-pulse rounded-full bg-[#F0F0F0]" />
        </div>
        <div className="flex items-end justify-between border-t border-[#F0F0F0] pt-4">
          <div className="space-y-2">
            <div className="h-2 w-16 animate-pulse rounded bg-[#F0F0F0]" />
            <div className="h-7 w-24 animate-pulse rounded bg-[#F0F0F0]" />
          </div>
          <div className="h-10 w-28 animate-pulse rounded-full bg-[#F0F0F0]" />
        </div>
      </div>
    </div>
  );
}
