'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { format, addDays, startOfDay } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  BadgeCheck,
  Calendar,
  ChevronLeft,
  Clock,
  ExternalLink,
  MapPin,
  Phone,
  Share2,
  Star,
  Stethoscope,
  Video,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/common/alerts';
import { doctorsApi } from '@/lib/api';
import type { DoctorPublicProfile } from '@/types/doctor';
import { getInitials } from '@/lib/utils/format';
import { LANDING_SHELL } from '@/components/marketing/landing-layout';
import { GlassPanel, SectionMesh } from '@/components/marketing/landing-visuals';
import { cn } from '@/lib/utils';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const DOW_LABEL = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
const DAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const;
const DAY_LABEL_LEGACY: Record<(typeof DAY_KEYS)[number], string> = {
  sun: 'Dimanche',
  mon: 'Lundi',
  tue: 'Mardi',
  wed: 'Mercredi',
  thu: 'Jeudi',
  fri: 'Vendredi',
  sat: 'Samedi',
};

function photoFullUrl(path?: string) {
  if (!path) return undefined;
  if (path.startsWith('http')) return path;
  return `${API_BASE}${path}`;
}

function formatMad(amount: number, currency = 'MAD'): string {
  const code = currency === 'MAD' ? 'MAD' : currency;
  try {
    return new Intl.NumberFormat('fr-MA', {
      style: 'currency',
      currency: code,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${amount} ${code}`;
  }
}

function formatTariffAmount(amount: number, currency: string): string {
  if (currency === 'MAD') return formatMad(amount);
  return `${amount} ${currency}`;
}

function buildHoursRows(profile: DoctorPublicProfile) {
  const primary = profile.sites?.find((s) => s.isPrimary) ?? profile.sites?.[0];
  if (primary?.workingHours?.length) {
    const byDay = new Map<number, string[]>();
    for (const w of primary.workingHours.filter((h) => h.isActive !== false)) {
      const slot = `${w.startTime} – ${w.endTime}`;
      const list = byDay.get(w.dayOfWeek) ?? [];
      list.push(slot);
      byDay.set(w.dayOfWeek, list);
    }
    return [...byDay.entries()]
      .sort(([a], [b]) => {
        const order = (d: number) => (d === 0 ? 7 : d);
        return order(a) - order(b);
      })
      .map(([dow, slots]) => ({
        key: `site-${dow}`,
        label: DOW_LABEL[dow] ?? `Jour ${dow}`,
        slots: slots.join(' · '),
      }));
  }

  if (!profile.workingHours || typeof profile.workingHours !== 'object') return [];
  const wh = profile.workingHours as Record<string, unknown>;
  const legacy: { key: string; label: string; slots: string }[] = [];
  for (const key of DAY_KEYS) {
    const v = wh[key];
    if (!v) continue;
    const slots = Array.isArray(v)
      ? (v as string[]).map((s) => s.replace('-', ' – ')).join(' · ')
      : String(v);
    if (slots) legacy.push({ key, label: DAY_LABEL_LEGACY[key], slots });
  }
  return legacy;
}

function fullAddress(profile: DoctorPublicProfile): string {
  return [profile.street, profile.postalCode, profile.city, profile.country === 'MA' ? 'Maroc' : profile.country]
    .filter(Boolean)
    .join(', ');
}

function mapsUrl(profile: DoctorPublicProfile): string {
  if (profile.latitude != null && profile.longitude != null) {
    return `https://www.google.com/maps/search/?api=1&query=${profile.latitude},${profile.longitude}`;
  }
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress(profile))}`;
}

type SlotPreview = { startTime: string; endTime: string; dateLabel: string };

function SectionTitle({ children, icon: Icon }: { children: React.ReactNode; icon?: React.ComponentType<{ className?: string }> }) {
  return (
    <h2 className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.28em] text-[#77777D]">
      {Icon ? <Icon className="h-4 w-4 text-[#7EADD0]" /> : null}
      {children}
    </h2>
  );
}

export function DoctorPublicProfileView({ doctorId }: { doctorId: string }) {
  const [profile, setProfile] = useState<DoctorPublicProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [photoFailed, setPhotoFailed] = useState(false);
  const [slotPreviews, setSlotPreviews] = useState<SlotPreview[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [shareDone, setShareDone] = useState(false);

  const loadProfile = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setPhotoFailed(false);
    try {
      const p = await doctorsApi.getPublicProfile(doctorId);
      setProfile(p);
    } catch {
      setProfile(null);
      setError('Impossible de charger ce profil.');
    } finally {
      setIsLoading(false);
    }
  }, [doctorId]);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  const loadUpcomingSlots = useCallback(async () => {
    if (!doctorId) return;
    setSlotsLoading(true);
    const found: SlotPreview[] = [];
    try {
      for (let i = 0; i < 14 && found.length < 4; i++) {
        const d = addDays(startOfDay(new Date()), i);
        const ymd = format(d, 'yyyy-MM-dd');
        const res = (await doctorsApi.getAvailability(doctorId, ymd)) as {
          slots?: { startTime: string; endTime: string; available: boolean }[];
        };
        const available = (res.slots ?? []).filter((s) => s.available);
        for (const s of available) {
          if (found.length >= 4) break;
          found.push({
            startTime: s.startTime,
            endTime: s.endTime,
            dateLabel: format(new Date(s.startTime), 'EEE d MMM · HH:mm', { locale: fr }),
          });
        }
      }
      setSlotPreviews(found);
    } catch {
      setSlotPreviews([]);
    } finally {
      setSlotsLoading(false);
    }
  }, [doctorId]);

  useEffect(() => {
    if (profile) void loadUpcomingSlots();
  }, [profile, loadUpcomingSlots]);

  const hoursRows = useMemo(() => (profile ? buildHoursRows(profile) : []), [profile]);

  const handleShare = async () => {
    const url = typeof window !== 'undefined' ? window.location.href : '';
    try {
      if (navigator.share) {
        await navigator.share({ title: document.title, url });
      } else {
        await navigator.clipboard.writeText(url);
        setShareDone(true);
        window.setTimeout(() => setShareDone(false), 2000);
      }
    } catch {
      /* ignore */
    }
  };

  if (isLoading) {
    return (
      <div className="relative flex min-h-[70vh] items-center justify-center bg-gradient-to-b from-white via-white to-[#F8F8F6]">
        <LoadingSpinner />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="relative flex min-h-[70vh] items-center justify-center bg-gradient-to-b from-white via-white to-[#F8F8F6] px-4">
        <GlassPanel tint="neutral" className="max-w-md p-10 text-center">
          <h1 className="text-xl font-medium tracking-[-0.02em] text-[#555555]">Médecin introuvable</h1>
          <p className="mt-2 text-sm text-[#77777D]">{error || "Ce profil n'est plus disponible."}</p>
          <Button
            className="mt-6 rounded-full border border-[#7EADD0]/40 bg-white/90 text-[#7EADD0] shadow-none hover:bg-[#7EADD0]/10"
            asChild
          >
            <Link href="/search">Retour à l&apos;annuaire</Link>
          </Button>
        </GlassPanel>
      </div>
    );
  }

  const doctor = profile;
  const photoSrc = photoFailed ? undefined : photoFullUrl(doctor.profilePhotoUrl);
  const specialtyDisplay = doctor.specialtyName ?? doctor.specialtyCode;
  const publishedReviews = doctor.approvedReviews ?? [];
  const reviewCountLabel =
    publishedReviews.length > 0
      ? `${publishedReviews.length} avis publié${publishedReviews.length > 1 ? 's' : ''}`
      : 'Premiers avis bientôt disponibles';
  const primarySite = doctor.sites?.find((s) => s.isPrimary) ?? doctor.sites?.[0];
  const phone = primarySite?.phone ?? doctor.user.phoneNumber;
  const fullName = `Dr. ${doctor.user.firstName} ${doctor.user.lastName}`;

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-white via-white to-[#F8F8F6] pb-20">
      <SectionMesh variant="mixed" className="opacity-80" />

      <div className={cn(LANDING_SHELL, 'relative pt-6 sm:pt-8')}>
        <nav className="mb-8 flex flex-wrap items-center gap-2 text-[11px] font-medium uppercase tracking-[0.12em] text-[#999999]">
          <Link href="/" className="transition hover:text-[#7EADD0]">
            Accueil
          </Link>
          <span className="text-[#E8EAED]">/</span>
          <Link href="/search" className="transition hover:text-[#7EADD0]">
            Annuaire
          </Link>
          <span className="text-[#E8EAED]">/</span>
          <span className="text-[#555555]">Dr. {doctor.user.lastName}</span>
        </nav>

        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start lg:gap-12">
          <div className="min-w-0 space-y-8">
            {/* Hero bannière */}
            <GlassPanel tint="neutral" className="overflow-hidden p-0">
              <div className="relative h-44 sm:h-52">
                {photoSrc ? (
                  <img
                    src={photoSrc}
                    alt=""
                    className="h-full w-full object-cover"
                    onError={() => setPhotoFailed(true)}
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#F8F8F6] via-white to-[#F0F7FC]">
                    <span className="text-5xl font-light tracking-[0.2em] text-[#111111]/15">
                      {getInitials(doctor.user.firstName, doctor.user.lastName)}
                    </span>
                  </div>
                )}
                <div
                  className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#555555]/55 via-[#555555]/15 to-transparent"
                  aria-hidden
                />
                <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6">
                  <p className="text-[9px] font-bold uppercase tracking-[0.28em] text-white/75">{specialtyDisplay}</p>
                  <h1 className="mt-1 text-2xl font-medium leading-tight tracking-[-0.02em] text-white sm:text-3xl">
                    {fullName}
                  </h1>
                  {doctor.doctorSpace?.name ? (
                    <p className="mt-1.5 text-sm text-white/80">{doctor.doctorSpace.name}</p>
                  ) : null}
                </div>
                <div className="absolute right-4 top-4 flex items-center gap-2 sm:right-5 sm:top-5">
                  <div className="rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-medium tabular-nums text-[#555555] backdrop-blur-sm">
                    ★ {doctor.rating.toFixed(1)}
                  </div>
                  {doctor.isVerified ? (
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/95 text-[#7EADD0] shadow-sm backdrop-blur-sm">
                      <BadgeCheck className="h-4 w-4" />
                    </span>
                  ) : null}
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#E8EAED]/60 px-5 py-4 sm:px-6">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 text-xs text-[#77777D]">
                    <Star className="h-3.5 w-3.5 fill-[#B7A7FF] text-[#B7A7FF]" />
                    {reviewCountLabel}
                  </span>
                  {doctor.isCertified ? (
                    <span className="rounded-full border border-[#B7A7FF]/30 bg-[#B7A7FF]/10 px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-[0.14em] text-[#77777D]">
                      Certifié
                    </span>
                  ) : null}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-9 rounded-full text-[#77777D] hover:bg-[#7EADD0]/10 hover:text-[#555555]"
                    onClick={() => void handleShare()}
                  >
                    <Share2 className="mr-1.5 h-3.5 w-3.5" />
                    Partager
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9 rounded-full border-[#E8EAED] bg-white/80 text-[#555555] shadow-none hover:border-[#7EADD0]/40 hover:bg-[#7EADD0]/5 lg:hidden"
                    asChild
                  >
                    <Link href={`/book/${doctor.id}`}>
                      <Calendar className="mr-1.5 h-3.5 w-3.5" />
                      Réserver
                    </Link>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9 rounded-full border-[#E8EAED] bg-white/80 text-[#555555] shadow-none hover:border-[#7EADD0]/40"
                    asChild
                  >
                    <a href={mapsUrl(doctor)} target="_blank" rel="noopener noreferrer">
                      <MapPin className="mr-1.5 h-3.5 w-3.5" />
                      Itinéraire
                    </a>
                  </Button>
                </div>
              </div>
              {shareDone ? (
                <p className="border-t border-[#E8EAED]/60 px-5 py-2 text-center text-[11px] text-[#7EADD0] sm:px-6">
                  Lien copié dans le presse-papiers.
                </p>
              ) : null}
            </GlassPanel>

            {/* À propos */}
            <GlassPanel tint="blue" className="p-6 sm:p-8">
              <SectionTitle>À propos</SectionTitle>
              <p className="mt-4 text-sm leading-relaxed text-[#555555] sm:text-[15px]">
                {doctor.bio ||
                  `${specialtyDisplay} — consultation sur rendez-vous à ${doctor.city}. Réservez en ligne en quelques clics.`}
              </p>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div className="rounded-[20px] border border-[#E8EAED]/80 bg-white/60 p-4 backdrop-blur-sm">
                  <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#999999]">Adresse</p>
                  <p className="mt-2 flex gap-2 text-sm leading-relaxed text-[#555555]">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#7EADD0]" />
                    {fullAddress(doctor)}
                  </p>
                  <a
                    href={mapsUrl(doctor)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-[#7EADD0] transition hover:text-[#B7A7FF]"
                  >
                    Ouvrir dans Maps
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
                {phone ? (
                  <div className="rounded-[20px] border border-[#E8EAED]/80 bg-white/60 p-4 backdrop-blur-sm">
                    <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#999999]">Contact</p>
                    <p className="mt-2 flex items-center gap-2 text-sm font-medium text-[#555555]">
                      <Phone className="h-4 w-4 text-[#7EADD0]" />
                      <a href={`tel:${phone.replace(/\s/g, '')}`} className="transition hover:text-[#7EADD0]">
                        {phone}
                      </a>
                    </p>
                  </div>
                ) : null}
              </div>

              {doctor.sites && doctor.sites.length > 0 ? (
                <div className="mt-6">
                  <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#999999]">
                    Sites d&apos;exercice
                  </p>
                  <ul className="mt-3 space-y-2">
                    {doctor.sites.map((s) => (
                      <li
                        key={s.id}
                        className="flex flex-wrap items-center justify-between gap-2 rounded-[16px] border border-[#E8EAED]/80 bg-white/50 px-4 py-3 text-sm backdrop-blur-sm"
                      >
                        <span className="font-medium text-[#555555]">
                          {s.name}
                          {s.isPrimary ? (
                            <span className="ml-2 rounded-full border border-[#7EADD0]/30 bg-[#7EADD0]/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.12em] text-[#77777D]">
                              Principal
                            </span>
                          ) : null}
                        </span>
                        <span className="text-[#77777D]">
                          {s.city}
                          {s.country ? ` (${s.country})` : ''}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </GlassPanel>

            <div className="grid gap-6 md:grid-cols-2">
              <GlassPanel tint="neutral" className="p-6">
                <SectionTitle icon={Clock}>Horaires</SectionTitle>
                {hoursRows.length > 0 ? (
                  <ul className="mt-4 divide-y divide-[#E8EAED]/80">
                    {hoursRows.map((row) => (
                      <li key={row.key} className="flex justify-between gap-4 py-3 text-sm first:pt-0">
                        <span className="font-medium text-[#555555]">{row.label}</span>
                        <span className="max-w-[55%] text-right text-[#77777D]">{row.slots}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-4 text-sm text-[#77777D]">Horaires sur demande — contactez le cabinet.</p>
                )}
              </GlassPanel>

              <GlassPanel tint="neutral" className="p-6">
                <SectionTitle icon={Stethoscope}>Modalités</SectionTitle>
                <ul className="mt-4 space-y-3 text-sm text-[#555555]">
                  <li className="flex gap-3 rounded-[16px] border border-[#E8EAED]/60 bg-white/50 p-3 backdrop-blur-sm">
                    <Calendar className="h-5 w-5 shrink-0 text-[#7EADD0]" />
                    <span>
                      Créneaux de <strong className="font-medium text-[#555555]">{doctor.slotDurationMinutes ?? 30} min</strong> — présentiel au cabinet.
                    </span>
                  </li>
                  <li className="flex gap-3 rounded-[16px] border border-[#E8EAED]/60 bg-white/50 p-3 backdrop-blur-sm">
                    <Video className="h-5 w-5 shrink-0 text-[#B7A7FF]" />
                    <span>Téléconsultation disponible selon les créneaux proposés à la réservation.</span>
                  </li>
                </ul>
              </GlassPanel>
            </div>

            {doctor.tariffs && doctor.tariffs.length > 0 ? (
              <GlassPanel tint="blue" className="p-6 sm:p-8">
                <SectionTitle>Tarifs indicatifs</SectionTitle>
                <div className="mt-4 overflow-hidden rounded-[20px] border border-[#E8EAED]/80 bg-white/60 backdrop-blur-sm">
                  <table className="w-full text-left text-sm">
                    <thead className="border-b border-[#E8EAED]/80 bg-white/40 text-[10px] font-bold uppercase tracking-[0.2em] text-[#999999]">
                      <tr>
                        <th className="px-4 py-3">Acte</th>
                        <th className="px-4 py-3">Lieu</th>
                        <th className="px-4 py-3 text-right">Tarif</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E8EAED]/60">
                      {doctor.tariffs.map((t) => (
                        <tr key={t.id}>
                          <td className="px-4 py-3 font-medium text-[#555555]">{t.label}</td>
                          <td className="px-4 py-3 text-[#77777D]">{t.siteName}</td>
                          <td className="px-4 py-3 text-right font-medium tabular-nums text-[#7EADD0]">
                            {formatTariffAmount(t.amount, t.currency)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </GlassPanel>
            ) : null}

            <GlassPanel tint="purple" className="p-6 sm:p-8">
              <SectionTitle>Avis patients</SectionTitle>
              {publishedReviews.length > 0 ? (
                <ul className="mt-6 space-y-4">
                  {publishedReviews.map((r) => (
                    <li
                      key={r.id}
                      className="rounded-[20px] border border-[#E8EAED]/80 bg-white/50 p-5 backdrop-blur-sm"
                    >
                      <div className="flex items-center gap-2">
                        <div className="flex text-[#B7A7FF]">
                          {Array.from({ length: r.rating }).map((_, i) => (
                            <Star key={i} className="h-3.5 w-3.5 fill-current" />
                          ))}
                        </div>
                        <span className="text-xs text-[#999999]">
                          {new Date(r.createdAt).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                          })}
                        </span>
                      </div>
                      <p className="mt-2 text-sm leading-relaxed text-[#555555]">{r.comment}</p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-4 text-sm leading-relaxed text-[#77777D]">
                  Les avis modérés apparaîtront ici. La note affichée ({doctor.rating.toFixed(1)}/5) reflète la
                  réputation du praticien sur la plateforme.
                </p>
              )}
            </GlassPanel>
          </div>

          {/* Sidebar réservation */}
          <aside className="lg:sticky lg:top-24">
            <GlassPanel tint="purple" className="p-6">
              <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-[#77777D]">Consultation</p>
              <p className="mt-2 text-3xl font-medium tabular-nums tracking-tight text-[#555555]">
                {formatMad(doctor.consultationPrice, doctor.preferredCurrency ?? 'MAD')}
              </p>

              {doctor.nextAvailableSlot ? (
                <div className="mt-5 rounded-[20px] border border-[#7EADD0]/30 bg-[#7EADD0]/10 p-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#7EADD0]">Prochain créneau</p>
                  <p className="mt-1.5 text-sm font-medium text-[#555555]">
                    {format(new Date(doctor.nextAvailableSlot.startTime), "EEEE d MMMM 'à' HH:mm", {
                      locale: fr,
                    })}
                  </p>
                </div>
              ) : null}

              <div className="mt-5">
                <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.24em] text-[#999999]">
                  Créneaux à venir
                </p>
                {slotsLoading ? (
                  <p className="text-xs text-[#77777D]">Chargement des disponibilités…</p>
                ) : slotPreviews.length > 0 ? (
                  <ul className="space-y-2">
                    {slotPreviews.map((s) => (
                      <li
                        key={s.startTime}
                        className="rounded-[14px] border border-[#E8EAED]/80 bg-white/60 px-3 py-2 text-xs font-medium text-[#555555] backdrop-blur-sm"
                      >
                        {s.dateLabel}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-[#77777D]">Consultez le calendrier pour voir les disponibilités.</p>
                )}
              </div>

              <div className="mt-6 space-y-2.5">
                <Button
                  className="h-11 w-full rounded-full border border-[#7EADD0]/40 bg-white/90 text-sm font-medium text-[#7EADD0] shadow-none hover:border-[#7EADD0] hover:bg-[#7EADD0]/10"
                  asChild
                >
                  <Link href={`/book/${doctor.id}`}>
                    <Calendar className="mr-2 h-4 w-4" />
                    Réserver maintenant
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  className="h-10 w-full rounded-full border-[#E8EAED] bg-white/60 text-sm font-medium text-[#555555] shadow-none hover:border-[#B7A7FF]/40 hover:bg-[#B7A7FF]/5"
                  asChild
                >
                  <Link href={`/book/${doctor.id}?type=video`}>
                    <Video className="mr-2 h-4 w-4" />
                    Téléconsultation
                  </Link>
                </Button>
              </div>
              <p className="mt-4 text-center text-[11px] leading-relaxed text-[#999999]">
                Connexion patient requise pour confirmer le RDV.
              </p>
            </GlassPanel>

            <Link
              href="/search"
              className="mt-5 flex items-center justify-center gap-1 text-sm font-medium text-[#77777D] transition hover:text-[#7EADD0]"
            >
              <ChevronLeft className="h-4 w-4" />
              Retour à l&apos;annuaire
            </Link>
          </aside>
        </div>
      </div>
    </div>
  );
}
