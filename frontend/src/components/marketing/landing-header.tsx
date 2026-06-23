'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Search, MapPin, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SpecialtyPicker } from '@/components/search/specialty-picker';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { specialtiesApi, doctorsApi } from '@/lib/api';
import { useRouter, usePathname } from 'next/navigation';
import { useId } from 'react';
import type { Specialty } from '@/types';
import { dashboardPathForRole } from '@/lib/auth-routes';
import type { User } from '@/types';
import { cn } from '@/lib/utils';
import { LANDING_SHELL } from '@/components/marketing/landing-layout';
import { APP_CONFIG } from '@/lib/constants/app-config';

import { PLATFORM_CITIES, mergePlatformCities } from '@/lib/constants/platform-coverage';

/** Vidéo hero style MYDNA — hero-care-visual.mp4 une fois ajoutée dans /public */
export const HERO_VIDEO_PRIMARY = '/hero-care-visual.mp4';
export const HERO_VIDEO_FALLBACK = '/futuristic-eye.mp4';
/** Source affichée par défaut (fichier présent dans /public) */
export const HERO_VIDEO_SRC = HERO_VIDEO_FALLBACK;

function MenuLinesIcon({ className }: { className?: string }) {
  return (
    <span className={cn('flex w-5 flex-col gap-[5px]', className)} aria-hidden>
      <span className="h-[1.5px] w-full rounded-full bg-[#111111]" />
      <span className="h-[1.5px] w-[72%] rounded-full bg-[#111111]" />
    </span>
  );
}

export function LandingHeader({
  user,
  variant = 'hero',
}: {
  user?: User;
  /** `hero` = landing vidéo · `solid` = pages internes */
  variant?: 'hero' | 'solid';
}) {
  const router = useRouter();
  const pathname = usePathname();
  const isHome = pathname === '/';
  const cityListId = useId();
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [cities, setCities] = useState<string[]>([...PLATFORM_CITIES]);
  const [specialtyCode, setSpecialtyCode] = useState('');
  const [city, setCity] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    void specialtiesApi
      .getAll()
      .then((rows) =>
        setSpecialties(
          rows.map((r) => ({
            id: r.id,
            code: r.code,
            name: r.name,
            doctorCount: 0,
            createdAt: r.createdAt,
            updatedAt: r.updatedAt,
          })),
        ),
      )
      .catch(() => setSpecialties([]));

    void doctorsApi
      .searchCities()
      .then((list) => {
        if (list.length > 0) setCities(mergePlatformCities(list));
      })
      .catch(() => setCities([...PLATFORM_CITIES]));
  }, []);

  const list = specialties.map((s) => ({ code: s.code, name: s.name }));

  const submit = (overrideCity?: string) => {
    const params = new URLSearchParams();
    if (specialtyCode) params.set('specialtyCode', specialtyCode);
    const c = (overrideCity ?? city).trim();
    if (c) params.set('city', c);
    const q = params.toString();
    router.push(q ? `/search?${q}` : '/search');
    setSearchOpen(false);
  };

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) element.scrollIntoView({ behavior: 'smooth' });
  };

  const navItems = [
    { id: 'recherche', label: 'Recherche', href: '/search' },
    { id: 'annuaire', label: 'Annuaire', href: '/#annuaire' },
    { id: 'comment', label: 'Parcours', href: '/#comment' },
    { id: 'plateforme', label: 'Plateforme', href: '/#plateforme' },
    { id: 'temoignages', label: 'Témoignages', href: '/#temoignages' },
    { id: 'cabinet', label: 'Cabinet', href: '/#cabinet' },
    { id: 'faq', label: 'FAQ', href: '/#faq' },
  ];

  const handleNav = (item: (typeof navItems)[number]) => {
    if (item.href === '/search' || !isHome) {
      router.push(item.href);
      return;
    }
    scrollToSection(item.id);
  };

  const isHero = variant === 'hero';

  return (
    <header
      className={cn(
        'fixed top-0 z-50 w-full',
        isHero ? 'bg-transparent' : 'border-b border-[#E8EAED]/80 bg-white/90 backdrop-blur-xl',
      )}
    >
      {isHero ? (
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-14 bg-gradient-to-r from-white from-0% via-white via-[38%] to-transparent to-[68%] sm:h-16"
          aria-hidden
        />
      ) : null}
      <div className={cn(LANDING_SHELL, 'relative flex h-14 items-center justify-between sm:h-16')}>
        <div className="flex min-w-0 items-center gap-4 sm:gap-6 md:gap-8">
          <Link href="/" className="text-sm font-bold tracking-[0.12em] text-[#111111] transition-opacity hover:opacity-70">
            {APP_CONFIG.APP_NAME}
          </Link>

          <DropdownMenu>
            <DropdownMenuTrigger className="inline-flex items-center gap-2.5 text-xs font-medium text-[#111111] outline-none transition-opacity hover:opacity-70">
              <MenuLinesIcon />
              <span>Menu</span>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="start"
              sideOffset={14}
              className="min-w-[11rem] rounded-xl border border-[#E8EAED] bg-white/95 p-1 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur-xl"
            >
              {navItems.map((item) => (
                <DropdownMenuItem
                  key={item.id}
                  className="cursor-pointer rounded-lg px-3 py-2 text-xs font-medium text-[#77777D] focus:bg-[#F8F8F6] focus:text-[#111111]"
                  onClick={() => handleNav(item)}
                >
                  {item.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3 md:gap-4">
          <button
            type="button"
            onClick={() => setSearchOpen((v) => !v)}
            className="flex h-9 w-9 items-center justify-center text-[#111111] transition-opacity hover:opacity-60"
            aria-label="Rechercher"
          >
            <Search className="h-[18px] w-[18px] stroke-[1.5]" />
          </button>

          {user ? (
            <Button
              size="xs"
              variant="ghost"
              className="h-8 rounded-full border-0 px-2.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-[#111111] shadow-none hover:bg-[#111111]/5 sm:px-3"
              asChild
            >
              <Link href={dashboardPathForRole(user.role)}>Mon espace</Link>
            </Button>
          ) : (
            <>
              <Button
                size="xs"
                variant="ghost"
                className="h-8 rounded-full border-0 px-2.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-[#111111] shadow-none hover:bg-[#111111]/5 sm:px-3"
                asChild
              >
                <Link href="/login?intent=patient">Patient</Link>
              </Button>
              <Button
                size="xs"
                className="h-8 rounded-full border-0 bg-[#111111] px-2.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-white shadow-none hover:bg-[#333333] sm:px-3"
                asChild
              >
                <Link href="/login?intent=pro">Cabinet</Link>
              </Button>
            </>
          )}
        </div>
      </div>

      {searchOpen ? (
        <div className={cn(LANDING_SHELL, 'relative py-2 sm:py-2.5')}>
          <div className="mx-auto flex w-full max-w-4xl items-center gap-1.5 border-b border-[#111111]/15 pb-2 sm:max-w-5xl sm:gap-2">
            <div className="min-w-0 w-[36%] shrink-0 border-r border-[#E8EAED]/90 pr-2 sm:w-[32%] sm:pr-3">
              <SpecialtyPicker
                value={specialtyCode || '__all__'}
                onChange={(c) => setSpecialtyCode(c === '__all__' ? '' : c)}
                specialties={[{ code: '__all__', name: 'Spécialité' }, ...list]}
                triggerClassName="h-7 w-full border-0 bg-transparent px-0 text-[10px] font-medium uppercase tracking-[0.14em] text-[#111111] shadow-none focus:ring-0 sm:h-8 sm:text-[11px]"
              />
            </div>
            <div className="relative min-w-0 flex-1">
              <MapPin className="pointer-events-none absolute left-0 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#77777D]" />
              <Input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Ville"
                list={cityListId}
                className="h-7 border-0 bg-transparent pl-5 text-[11px] font-normal text-[#111111] placeholder:text-[#77777D] shadow-none focus-visible:ring-0 sm:h-8 sm:pl-6 sm:text-xs"
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), submit())}
              />
              <datalist id={cityListId}>
                {cities.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </div>
            <Button
              type="button"
              onClick={() => submit()}
              className="h-7 w-7 shrink-0 rounded-full bg-[#111111] p-0 text-white shadow-none hover:bg-[#333333] sm:h-8 sm:w-8"
            >
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      ) : null}
    </header>
  );
}
