'use client';

import Link from 'next/link';
import {
  ArrowRight,
  Building2,
  Calendar,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  FileText,
  HeartPulse,
  LayoutGrid,
  Mail,
  MessageSquare,
  Plus,
  Search,
  Shield,
  Star,
  Stethoscope,
  Users,
  Video,
} from 'lucide-react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { LandingSearchBar } from '@/components/marketing/landing-search-bar';
import { LandingHeader } from '@/components/marketing/landing-header';
import {
  HERO_VIDEO_FALLBACK,
  HERO_VIDEO_SRC,
} from '@/components/marketing/landing-header';
import { LandingFaq } from '@/components/marketing/landing-faq';
import { DoctorCard, DoctorCardSkeleton } from '@/components/common/doctor-card';
import { useCallback, useEffect, useState, type CSSProperties } from 'react';
import { doctorsApi, specialtiesApi } from '@/lib/api';
import { mergePlatformCities } from '@/lib/constants/platform-coverage';
import type { Doctor } from '@/types';
import type { User } from '@/types';
import { APP_CONFIG } from '@/lib/constants/app-config';
import { LANDING_SHELL } from '@/components/marketing/landing-layout';
import {
  fadeUp,
  blurReveal,
  LANDING_EASE,
  LANDING_VIEWPORT,
  pulseGlow,
  scaleIn,
  scaleInSpring,
  slideFromLeft,
  staggerContainer,
  staggerFast,
  useLandingMounted,
  wordReveal,
  wordStagger,
} from '@/components/marketing/landing-motion';
import {
  AnimatedStat,
  FloatingOrbs,
  GlassPanel,
  GradientText,
  SectionMesh,
  ShimmerLine,
} from '@/components/marketing/landing-visuals';
import { cn } from '@/lib/utils';

export type SiteLandingProps = {
  user?: User;
};

const PRO_MAIL = `mailto:${APP_CONFIG.PRO_CONTACT_EMAIL}?subject=${encodeURIComponent(`Demande inscription cabinet — ${APP_CONFIG.APP_NAME}`)}`;
const PRO_MAIL_PLAN = (plan: string) =>
  `mailto:${APP_CONFIG.PRO_CONTACT_EMAIL}?subject=${encodeURIComponent(`Offre ${plan} — ${APP_CONFIG.APP_NAME}`)}`;

/** Fondu MYDNA — gauche + bas adouci pour la carte glass */
const HERO_VIDEO_MASK: CSSProperties = {
  WebkitMaskImage: [
    'linear-gradient(to right, transparent 0%, rgba(0,0,0,0.1) 14%, rgba(0,0,0,0.45) 28%, rgba(0,0,0,0.78) 42%, black 58%, black 82%, rgba(0,0,0,0.4) 96%, transparent 100%)',
    'linear-gradient(to bottom, black 0%, black 68%, rgba(0,0,0,0.55) 82%, rgba(0,0,0,0.15) 94%, transparent 100%)',
  ].join(', '),
  maskImage: [
    'linear-gradient(to right, transparent 0%, rgba(0,0,0,0.1) 14%, rgba(0,0,0,0.45) 28%, rgba(0,0,0,0.78) 42%, black 58%, black 82%, rgba(0,0,0,0.4) 96%, transparent 100%)',
    'linear-gradient(to bottom, black 0%, black 68%, rgba(0,0,0,0.55) 82%, rgba(0,0,0,0.15) 94%, transparent 100%)',
  ].join(', '),
  WebkitMaskComposite: 'source-in',
  maskComposite: 'intersect',
};

const ADVANTAGES = [
  {
    num: '01',
    title: 'Parcours patient fluide',
    desc: 'Recherche, réservation et suivi dans un seul espace connecté.',
    href: '/search',
    tint: 'blue' as const,
    accent: '#7EADD0',
  },
  {
    num: '02',
    title: 'Précision clinique',
    desc: 'Consultations structurées par spécialité avec pré-consultation.',
    href: '/login?intent=pro',
    tint: 'purple' as const,
    accent: '#B7A7FF',
  },
  {
    num: '03',
    title: 'Pilotage cabinet',
    desc: 'Agenda, équipe, documents PDF et messagerie unifiés.',
    href: PRO_MAIL,
    tint: 'neutral' as const,
    accent: '#111111',
  },
] as const;

const TIMELINE_STEPS = [
  {
    title: 'Recherche',
    desc: 'Trouvez un praticien par spécialité, ville et disponibilités.',
  },
  {
    title: 'Réservation',
    desc: 'Choisissez présentiel ou téléconsultation en ligne.',
  },
  {
    title: 'Pré-consultation',
    desc: 'Préparez votre visite avec un questionnaire sécurisé.',
  },
  {
    title: 'Consultation',
    desc: 'Dossier structuré importé pour le praticien.',
  },
  {
    title: 'Suivi',
    desc: 'Documents, messagerie et rappels dans votre espace.',
  },
] as const;

const PLATFORM_PLUS = [
  {
    title: 'Parcours sans couture',
    desc: 'Du rendez-vous au suivi, une expérience unifiée pour patients et cabinets.',
  },
  {
    title: 'Couverture nationale',
    desc: 'Des praticiens dans plusieurs villes, accessibles en quelques clics.',
  },
  {
    title: 'Excellence clinique',
    desc: 'Formulaires par spécialité, dossiers sécurisés et documents vérifiables.',
  },
] as const;

const CABINET_SCOPES = [
  {
    name: 'Essentiel',
    pitch: 'Indépendant ou petit cabinet',
    features: ['Un titulaire', 'Agenda & rendez-vous', 'Dossier & pré-consultation', 'Support e-mail'],
  },
  {
    name: 'Cabinet',
    pitch: 'Équipe et plusieurs sites',
    features: ["Jusqu'à 5 comptes", 'Multi-sites & tarifs par acte', 'Notifications avancées', 'Support prioritaire'],
    highlight: true,
  },
  {
    name: 'Réseau',
    pitch: 'Structures étendues',
    features: ['Multi-cabinets', 'Exports & audit', 'Intégrations API', 'Accompagnement dédié'],
  },
] as const;

const PATIENT_STEPS = [
  { step: '1', title: 'Rechercher', desc: 'Spécialité, ville, avis et prochain créneau.', icon: Search, href: '/search' },
  { step: '2', title: 'Réserver', desc: 'Choisissez présentiel ou téléconsultation.', icon: Calendar, href: '/search' },
  { step: '3', title: 'Suivre', desc: 'RDV, documents, messagerie et pré-consultation.', icon: FileText, href: '/register' },
] as const;

const PRO_STEPS = [
  { step: '1', title: 'Espace cabinet', desc: 'Sites, horaires, tarifs et équipe.', icon: Building2, href: PRO_MAIL },
  { step: '2', title: 'Parcours clinique', desc: 'Consultations structurées par spécialité.', icon: Stethoscope, href: '/login?intent=pro' },
  { step: '3', title: 'Pilotage', desc: 'Agenda, documents PDF, messagerie patients.', icon: LayoutGrid, href: '/login?intent=pro' },
] as const;

const TESTIMONIALS = [
  {
    name: 'Sara M.',
    role: 'Patiente — Casablanca',
    text: 'J’ai réservé en ligne et rempli la pré-consultation avant mon RDV. Tout était déjà dans le dossier quand je suis arrivée.',
    rating: 5,
  },
  {
    name: 'Dr. Dupont',
    role: 'Ophtalmologiste',
    text: 'L’agenda, les formulaires ophtalmo et l’équipe (secrétaire + stagiaire) sur une seule plateforme — exactement ce qu’il nous fallait.',
    rating: 5,
  },
  {
    name: 'Karim I.',
    role: 'Patient — suivi chronique',
    text: 'Mes ordonnances et reçus sont dans mon espace. La messagerie avec le cabinet évite les appels pour les questions simples.',
    rating: 4,
  },
] as const;

export function SiteLanding({ user }: SiteLandingProps) {
  const [featuredDoctors, setFeaturedDoctors] = useState<Doctor[]>([]);
  const [catalogSpecialties, setCatalogSpecialties] = useState<{ code: string; name: string }[]>([]);
  const [stats, setStats] = useState<{ doctors: number; specialties: number; cities: number } | null>(null);
  const [doctorsLoading, setDoctorsLoading] = useState(true);
  const [doctorsError, setDoctorsError] = useState(false);

  const [heroVideoSrc, setHeroVideoSrc] = useState(HERO_VIDEO_SRC);
  const [timelineStep, setTimelineStep] = useState(0);
  const [testimonialIdx, setTestimonialIdx] = useState(0);
  const mounted = useLandingMounted();

  const { scrollY } = useScroll();
  const heroVideoY = useTransform(scrollY, [0, 600], [0, 120]);
  const heroContentY = useTransform(scrollY, [0, 600], [0, -40]);

  useEffect(() => {
    const id = setInterval(() => {
      setTimelineStep((s) => (s + 1) % TIMELINE_STEPS.length);
    }, 4200);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      setTestimonialIdx((i) => (i + 1) % TESTIMONIALS.length);
    }, 5500);
    return () => clearInterval(id);
  }, []);

  const loadDoctors = useCallback(() => {
    setDoctorsLoading(true);
    setDoctorsError(false);
    void doctorsApi
      .search({ take: 6, skip: 0 })
      .then((r) => setFeaturedDoctors(r.items))
      .catch(() => {
        setFeaturedDoctors([]);
        setDoctorsError(true);
      })
      .finally(() => setDoctorsLoading(false));
  }, []);

  useEffect(() => {
    loadDoctors();
    void Promise.all([
      doctorsApi.search({ take: 1, skip: 0 }),
      specialtiesApi.getAll(),
      doctorsApi.searchCities(),
    ])
      .then(([search, specs, apiCities]) => {
        const allSpecs = specs.map((s) => ({ code: s.code, name: s.name }));
        const cities = mergePlatformCities(apiCities);
        setCatalogSpecialties(allSpecs);
        setStats({
          doctors: search.total ?? search.items.length,
          specialties: allSpecs.length,
          cities: cities.length,
        });
      })
      .catch(() => {
        setCatalogSpecialties([]);
        setStats(null);
      });
  }, [loadDoctors]);

  return (
    <div className="scroll-smooth relative min-h-screen overflow-x-hidden bg-white text-[#111111] antialiased">
      <LandingHeader user={user} />

      {/* Hero + carte glass — vidéo partagée en arrière-plan (effet MYDNA) */}
      <div className="relative overflow-hidden bg-gradient-to-b from-white from-60% to-[#EBEBEB] to-100%">
        <FloatingOrbs />
        {/* Visuel prolongé sous le hero pour alimenter le blur de la carte */}
        <div
          className="pointer-events-none absolute inset-x-0 top-0 z-[1] h-[min(130vh,1000px)] overflow-visible"
          aria-hidden
        >
          <motion.div style={{ y: heroVideoY }} className="absolute inset-0 flex items-start justify-end overflow-visible pr-0 sm:pr-4 lg:pr-6 xl:pr-8">
            <div className="relative shrink-0">
              <video
                key={heroVideoSrc}
                src={heroVideoSrc}
                autoPlay
                loop
                muted
                playsInline
                preload="auto"
                onError={() => setHeroVideoSrc(HERO_VIDEO_FALLBACK)}
                style={HERO_VIDEO_MASK}
                className="h-[min(100svh,920px)] w-[min(92vw,880px)] max-w-none object-cover object-top saturate-[1.12] contrast-[1.03] sm:h-[min(105vh,960px)] sm:w-[min(86vw,900px)] lg:h-[min(112vh,1000px)] lg:w-[min(78vw,920px)]"
              />
              <div
                className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-br from-[#D8D0FF]/12 via-white/5 to-[#CFE7F3]/18 mix-blend-soft-light"
                aria-hidden
              />
              <div
                className="pointer-events-none absolute inset-y-0 left-0 z-[2] w-[min(54%,24rem)] bg-gradient-to-r from-white from-[0%] via-white/90 via-[30%] to-transparent to-[100%] sm:w-[min(50%,28rem)] lg:w-[min(46%,32rem)]"
                aria-hidden
              />
              {/* Fondu bas — léger, laisse passer les couleurs pour le glass */}
              <div
                className="pointer-events-none absolute inset-x-0 bottom-0 z-[3] h-[min(38vh,300px)] bg-gradient-to-b from-transparent via-white/25 to-[#EBEBEB]/90"
                aria-hidden
              />
            </div>
          </motion.div>
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 z-[2] h-40 bg-gradient-to-b from-transparent via-[#EBEBEB]/40 to-[#EBEBEB] sm:h-48"
            aria-hidden
          />
        </div>

        <section
          id="recherche"
          className="relative z-10 flex min-h-[min(100svh,920px)] scroll-mt-16 flex-col justify-center overflow-hidden pb-10 pt-20 sm:min-h-[88vh] sm:pb-16 sm:pt-24 lg:pb-20 lg:pt-28"
        >
          <div className={cn(LANDING_SHELL, 'relative')}>
            <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-[minmax(0,46%)_1fr] lg:gap-8 xl:grid-cols-[minmax(0,36rem)_1fr]">
              <motion.div
                style={{ y: heroContentY }}
                initial={false}
                animate={mounted ? { opacity: 1, y: 0 } : false}
                transition={{ duration: 0.85, ease: 'easeOut', delay: 0.08 }}
                className="relative z-10 mt-6 space-y-4 pl-4 sm:mt-10 sm:space-y-5 sm:pl-8 lg:mt-14 lg:pl-12 xl:pl-16"
              >
                <motion.p
                  initial={false}
                  animate={mounted ? { opacity: 1, x: 0 } : false}
                  transition={{ delay: 0.2, duration: 0.6 }}
                  className="text-[10px] font-bold uppercase tracking-[0.32em] text-[#77777D]"
                >
                  Mission {APP_CONFIG.APP_NAME}
                </motion.p>

                <motion.h1
                  variants={wordStagger}
                  initial={false}
                  animate={mounted ? 'visible' : false}
                  className="text-[1.05rem] leading-[1.15] tracking-[-0.02em] text-[#111111] sm:text-[clamp(1.35rem,3.2vw,2.75rem)]"
                >
                  {['Votre', 'parcours', 'de', 'soins,'].map((w) => (
                    <motion.span key={w} variants={wordReveal} className="mr-[0.22em] inline-block font-medium">
                      {w}
                    </motion.span>
                  ))}
                  <motion.span variants={wordReveal} className="inline-block font-normal">
                    <GradientText>simple et sûr</GradientText>
                  </motion.span>
                </motion.h1>

                <p className="text-[13px] leading-[1.7] text-[#77777D] sm:text-sm lg:text-[15px]">
                  Trouvez un praticien, prenez rendez-vous et préparez votre consultation en ligne — ou
                  équipez votre cabinet avec un outil clinique moderne.
                </p>

                <div className="inline-flex w-fit max-w-full flex-nowrap items-center gap-2 overflow-x-auto pt-1 [-ms-overflow-style:none] [scrollbar-width:none] sm:gap-3 [&::-webkit-scrollbar]:hidden">
                  <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.98 }}>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-10 flex-none rounded-full border-[#111111]/20 bg-white/60 px-3.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-[#111111] shadow-[0_8px_32px_rgba(183,167,255,0.2)] backdrop-blur-xl transition hover:border-[#B7A7FF]/40 hover:bg-white/80 sm:h-11 sm:px-6 sm:text-[11px] sm:tracking-[0.12em]"
                      asChild
                    >
                      <Link href="/search" className="inline-flex w-auto flex-none items-center justify-center gap-1.5 whitespace-nowrap">
                        Prendre rendez-vous
                        <ArrowRight className="h-3.5 w-3.5 shrink-0" />
                      </Link>
                    </Button>
                  </motion.div>
                  {!user && (
                    <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.98 }}>
                      <Link
                        href="/register"
                        className="inline-flex h-10 w-auto flex-none items-center justify-center whitespace-nowrap rounded-full border border-white/60 bg-white/40 px-3.5 text-[10px] font-semibold uppercase tracking-wider text-[#555555] shadow-[0_4px_24px_rgba(126,173,208,0.15)] backdrop-blur-xl transition hover:border-[#7EADD0]/50 hover:text-[#111111] sm:h-11 sm:px-5 sm:text-[11px]"
                      >
                        Créer un compte
                      </Link>
                    </motion.div>
                  )}
                </div>
              </motion.div>

              <div className="hidden min-h-[min(50vh,420px)] lg:block" aria-hidden />
            </div>

            <div className="mt-6 flex justify-start sm:mt-8 lg:-mt-2 lg:justify-end">
              <motion.button
                type="button"
                initial={false}
                animate={
                  mounted
                    ? {
                        opacity: 1,
                        y: [0, 4, 0],
                        boxShadow: [
                          '0 8px 32px rgba(15,23,42,0.35)',
                          '0 12px 40px rgba(183,167,255,0.3)',
                          '0 8px 32px rgba(15,23,42,0.35)',
                        ],
                      }
                    : false
                }
                transition={{
                  opacity: { duration: 0.6, delay: 0.4, ease: LANDING_EASE },
                  y: { duration: 2.5, repeat: Infinity, ease: 'easeInOut', delay: 0.4 },
                  boxShadow: { duration: 2.5, repeat: Infinity, delay: 0.4 },
                }}
                whileHover={{ scale: 1.04 }}
                onClick={() => document.getElementById('editorial-01')?.scrollIntoView({ behavior: 'smooth' })}
                className="inline-flex items-center gap-2.5 rounded-full border border-white/20 bg-[#111111]/90 px-5 py-3 text-xs font-semibold text-white backdrop-blur-md outline-none lg:mr-5 xl:mr-0"
              >
                <motion.span animate={mounted ? { y: [0, 3, 0] } : false} transition={{ duration: 1.2, repeat: Infinity }}>
                  <ChevronDown className="h-4 w-4" />
                </motion.span>
                Voir la suite
              </motion.button>
            </div>
          </div>
        </section>

        {/* Carte éditoriale glass — alignée sur la grille navbar / 01 */}
        <section className={cn(LANDING_SHELL, 'relative z-20 -mt-6 pb-16 sm:-mt-10 sm:pb-20 lg:-mt-14 lg:pb-24')}>
          <motion.div
            id="editorial-01"
            initial={false}
            whileInView={mounted ? 'visible' : undefined}
            viewport={{ once: true, margin: '-60px' }}
            variants={blurReveal}
          >
            <GlassPanel tint="purple" className="px-6 py-8 sm:px-10 sm:py-10 lg:py-12">
              <motion.div
                className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-[#B7A7FF]/30 blur-[60px]"
                animate={mounted ? { scale: [1, 1.2, 1], opacity: [0.4, 0.7, 0.4] } : false}
                transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
                aria-hidden
              />
              <div className="grid grid-cols-1 gap-8 sm:gap-10 lg:grid-cols-[auto_minmax(0,1fr)_minmax(0,1.15fr)] lg:items-start lg:gap-x-10 xl:gap-x-16">
                <div className="flex items-start gap-6 sm:gap-8 lg:contents">
                  <motion.span
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.7, ease: LANDING_EASE }}
                    className="shrink-0 bg-gradient-to-b from-[#B7A7FF] to-[#7EADD0] bg-clip-text text-4xl font-light leading-none tracking-[-0.04em] text-transparent sm:text-5xl lg:text-6xl"
                  >
                    01
                  </motion.span>

                  <div className="space-y-2 sm:space-y-3 lg:pt-1">
                    <h3 className="text-lg font-medium leading-snug tracking-[-0.01em] text-[#111111] sm:text-xl md:text-2xl lg:text-[1.65rem] xl:text-[1.75rem]">
                      Une plateforme médicale pour le patient et le cabinet
                    </h3>
                  </div>
                </div>

                <p className="text-sm leading-[1.75] text-[#555555] sm:text-[15px] lg:pt-1">
                  {APP_CONFIG.APP_NAME} centralise la recherche de praticiens, la prise de rendez-vous, la pré-consultation,
                  les documents médicaux et le suivi cabinet dans une expérience simple, sécurisée et moderne —
                  pensée pour les parcours de soins connectés au Maroc.
                </p>
              </div>
              <ShimmerLine className="mt-8" />
            </GlassPanel>
          </motion.div>
        </section>
      </div>

      {/* Recherche — 02 */}
      <motion.section
        id="recherche-stats"
        initial={false}
        whileInView={mounted ? 'visible' : undefined}
        viewport={LANDING_VIEWPORT}
        variants={staggerContainer}
        className={cn(LANDING_SHELL, 'relative scroll-mt-20 overflow-hidden py-16 sm:py-20 lg:py-24')}
      >
        <SectionMesh variant="mixed" />
        <motion.div
          variants={pulseGlow}
          animate={mounted ? 'animate' : false}
          className="pointer-events-none absolute right-[8%] top-[12%] h-56 w-56 rounded-full bg-[#B7A7FF]/20 blur-[80px]"
          aria-hidden
        />

        <div className="relative grid grid-cols-1 gap-10 lg:grid-cols-[auto_minmax(0,1fr)] lg:items-start lg:gap-x-12 xl:gap-x-16">
          <motion.span
            variants={fadeUp}
            className="bg-gradient-to-b from-[#7EADD0] via-[#B7A7FF] to-[#7EADD0] bg-clip-text text-4xl font-light leading-none tracking-[-0.04em] text-transparent sm:text-5xl lg:pt-1 lg:text-6xl"
          >
            02
          </motion.span>

          <motion.div variants={fadeUp} className="max-w-4xl">
            <GlassPanel tint="blue" className="p-6 sm:p-8 lg:p-10">
              <motion.div
                className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-[#7EADD0]/25 blur-[60px]"
                animate={mounted ? { scale: [1, 1.15, 1], opacity: [0.5, 0.8, 0.5] } : false}
                transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
                aria-hidden
              />

              <div className="space-y-3">
                <p className="text-[10px] font-bold uppercase tracking-[0.32em] text-[#7EADD0]">Recherche</p>
                <h2 className="text-xl font-medium leading-snug tracking-[-0.02em] text-[#111111] sm:text-2xl lg:text-[1.75rem]">
                  Trouvez un praticien près de chez vous
                </h2>
                <p className="max-w-xl text-sm leading-relaxed text-[#77777D] sm:text-[15px]">
                  Spécialité, ville et disponibilités — en quelques secondes.
                </p>
              </div>

              <div className="relative mt-8 overflow-hidden rounded-[20px] border border-white/60 bg-white/45 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] backdrop-blur-xl sm:rounded-[22px] sm:p-5">
                <div
                  className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#7EADD0]/8 via-transparent to-[#B7A7FF]/10"
                  aria-hidden
                />
                <div className="relative z-10">
                  <LandingSearchBar showCityShortcuts />
                </div>
              </div>

              {stats ? (
                <motion.div
                  variants={staggerFast}
                  className="mt-6 grid grid-cols-3 gap-3 sm:gap-4"
                >
                  {[
                    { value: stats.doctors, label: 'Praticiens', tint: 'from-[#7EADD0]/20 to-white/40' },
                    { value: stats.specialties, label: 'Spécialités', tint: 'from-[#B7A7FF]/20 to-white/40' },
                    { value: stats.cities, label: 'Villes', tint: 'from-white/50 to-[#7EADD0]/10' },
                  ].map((item) => (
                    <motion.div
                      key={item.label}
                      variants={scaleInSpring}
                      className={cn(
                        'rounded-[18px] border border-white/55 bg-gradient-to-br px-3 py-4 backdrop-blur-md sm:px-4 sm:py-5',
                        item.tint,
                      )}
                    >
                      <AnimatedStat value={item.value} label={item.label} />
                    </motion.div>
                  ))}
                </motion.div>
              ) : null}

              {catalogSpecialties.length > 0 ? (
                <div className="relative mt-6 overflow-hidden rounded-[20px] border border-[#B7A7FF]/20 bg-gradient-to-r from-[#B7A7FF]/10 via-white/35 to-[#7EADD0]/10 p-4 backdrop-blur-lg sm:p-5">
                  <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-[#77777D]">Spécialités</p>
                  <p className="mt-3 text-sm leading-[1.85] text-[#555555]">
                    {catalogSpecialties.slice(0, 8).map((s, i) => (
                      <span key={s.code}>
                        {i > 0 ? <span className="text-[#D8D0FF]"> · </span> : null}
                        <Link
                          href={`/search?specialtyCode=${encodeURIComponent(s.code)}`}
                          className="transition hover:text-[#7EADD0]"
                        >
                          {s.name}
                        </Link>
                      </span>
                    ))}
                    {catalogSpecialties.length > 8 ? (
                      <>
                        <span className="text-[#D8D0FF]"> · </span>
                        <Link href="/search" className="font-medium text-[#111111] transition hover:text-[#B7A7FF]">
                          +{catalogSpecialties.length - 8} autres
                        </Link>
                      </>
                    ) : null}
                  </p>
                </div>
              ) : null}

              <div className="mt-6 flex flex-col gap-4 border-t border-white/50 pt-6 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-[#77777D]">Parcourez l&apos;annuaire complet et réservez en ligne.</p>
                <Link
                  href="/search"
                  className="inline-flex w-fit items-center gap-2 rounded-full bg-[#111111]/90 px-5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-white shadow-[0_8px_28px_rgba(126,173,208,0.25)] backdrop-blur-sm transition hover:bg-[#111111] hover:gap-3 sm:text-[12px]"
                >
                  Ouvrir l&apos;annuaire
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>

              <ShimmerLine className="mt-6" />
            </GlassPanel>
          </motion.div>
        </div>
      </motion.section>

      {/* Annuaire — 03 */}
      <motion.section
        id="annuaire"
        initial={false}
        whileInView={mounted ? 'visible' : undefined}
        viewport={LANDING_VIEWPORT}
        variants={staggerContainer}
        className={cn(LANDING_SHELL, 'relative scroll-mt-20 overflow-hidden border-t border-[#E8EAED]/60 py-16 sm:py-20 lg:py-24')}
      >
        <SectionMesh variant="purple" />
        <div className="relative grid grid-cols-1 gap-10 lg:grid-cols-[auto_minmax(0,1fr)] lg:items-start lg:gap-x-12 xl:gap-x-16">
          <motion.span variants={fadeUp} className="bg-gradient-to-b from-[#B7A7FF] to-[#7EADD0] bg-clip-text text-4xl font-light leading-none tracking-[-0.04em] text-transparent sm:text-5xl lg:pt-1 lg:text-6xl">
            03
          </motion.span>

          <div className="space-y-10 sm:space-y-12">
            <motion.div variants={fadeUp} className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div className="max-w-2xl space-y-3">
                <p className="text-[10px] font-bold uppercase tracking-[0.32em] text-[#77777D]">Annuaire</p>
                <h2 className="text-xl font-medium leading-snug tracking-[-0.02em] text-[#111111] sm:text-2xl lg:text-[1.75rem]">
                  Praticiens disponibles
                </h2>
                <p className="text-sm leading-relaxed text-[#77777D] sm:text-[15px]">
                  Réservez directement depuis leur fiche.
                </p>
              </div>
              <Link
                href="/search"
                className="inline-flex shrink-0 items-center gap-2 text-[12px] font-medium text-[#111111] transition hover:gap-3 sm:text-[13px]"
              >
                Voir tout l&apos;annuaire
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </motion.div>

            {doctorsLoading ? (
              <motion.div variants={fadeUp} className="flex gap-5 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="w-[min(88vw,300px)] shrink-0 sm:w-[320px]">
                    <DoctorCardSkeleton />
                  </div>
                ))}
              </motion.div>
            ) : doctorsError ? (
              <motion.div variants={scaleIn} className="rounded-[20px] bg-[#F0F0F0] px-8 py-12 text-center">
                <p className="text-sm font-medium text-[#111111]">Impossible de charger les praticiens.</p>
                <p className="mt-2 text-xs text-[#77777D]">Vérifiez que l&apos;API backend tourne sur le port 3001.</p>
                <Button variant="outline" size="sm" className="mt-6 rounded-full border-0 bg-white" onClick={loadDoctors}>
                  Réessayer
                </Button>
              </motion.div>
            ) : featuredDoctors.length > 0 ? (
              <motion.div variants={fadeUp} className="flex gap-5 overflow-x-auto snap-x snap-mandatory pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {featuredDoctors.slice(0, 6).map((d) => (
                  <motion.div
                    key={d.id}
                    variants={scaleInSpring}
                    whileHover={{ y: -8, scale: 1.02 }}
                    className="w-[min(88vw,300px)] shrink-0 snap-start sm:w-[320px]"
                  >
                    <DoctorCard doctor={d} className="h-full" compact />
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <motion.div variants={scaleIn} className="rounded-[20px] bg-[#F0F0F0] px-8 py-16 text-center">
                <p className="text-sm text-[#77777D]">Aucun praticien pour le moment.</p>
                <Button className="mt-6 rounded-full bg-[#111111]" asChild>
                  <Link href="/search">Lancer une recherche</Link>
                </Button>
              </motion.div>
            )}
          </div>
        </div>
      </motion.section>

      {/* Avantages — 04 */}
      <motion.section
        id="avantages"
        initial={false}
        whileInView={mounted ? 'visible' : undefined}
        viewport={LANDING_VIEWPORT}
        variants={staggerContainer}
        className={cn(LANDING_SHELL, 'relative scroll-mt-20 overflow-hidden border-t border-[#E8EAED]/60 py-16 sm:py-20 lg:py-24')}
      >
        <SectionMesh variant="mixed" />
        <div className="relative grid grid-cols-1 gap-10 lg:grid-cols-[auto_minmax(0,1fr)] lg:items-start lg:gap-x-12 xl:gap-x-16">
          <motion.span variants={fadeUp} className="bg-gradient-to-b from-[#111111] via-[#B7A7FF] to-[#7EADD0] bg-clip-text text-4xl font-light leading-none tracking-[-0.04em] text-transparent sm:text-5xl lg:pt-1 lg:text-6xl">
            04
          </motion.span>

          <div className="space-y-10 sm:space-y-12">
            <motion.div variants={fadeUp} className="max-w-2xl space-y-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.32em] text-[#77777D]">Avantages</p>
              <h2 className="text-xl font-medium leading-snug tracking-[-0.02em] text-[#111111] sm:text-2xl lg:text-[1.75rem]">
                Pourquoi choisir {APP_CONFIG.APP_NAME}
              </h2>
            </motion.div>

            <motion.div variants={staggerContainer} className="grid gap-4 sm:grid-cols-3 sm:gap-5">
              {ADVANTAGES.map((item) => (
                <motion.div key={item.num} variants={scaleInSpring}>
                  <GlassPanel tint={item.tint} hover className="flex h-full flex-col p-6 sm:p-7">
                    <span
                      className="text-3xl font-light tracking-[-0.04em] sm:text-4xl"
                      style={{ color: item.accent }}
                    >
                      {item.num}
                    </span>
                    <h3 className="mt-6 text-base font-medium text-[#111111] sm:text-lg">{item.title}</h3>
                    <p className="mt-2 flex-1 text-sm leading-relaxed text-[#77777D]">{item.desc}</p>
                    <Link
                      href={item.href}
                      className="mt-6 inline-flex w-fit items-center gap-2 rounded-full border border-white/60 bg-white/50 px-4 py-2 text-[11px] font-medium uppercase tracking-wider text-[#111111] backdrop-blur-md transition hover:gap-3 hover:bg-white/80"
                    >
                      Explorer
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  </GlassPanel>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* Parcours — 05 */}
      <motion.section
        id="comment"
        initial={false}
        whileInView={mounted ? 'visible' : undefined}
        viewport={LANDING_VIEWPORT}
        variants={staggerContainer}
        className={cn(LANDING_SHELL, 'relative scroll-mt-24 overflow-hidden py-16 sm:py-20 lg:py-24')}
      >
        <SectionMesh variant="light" />
        <div className="relative grid grid-cols-1 gap-10 lg:grid-cols-[auto_minmax(0,1fr)] lg:items-start lg:gap-x-12 xl:gap-x-16">
          <motion.span variants={fadeUp} className="bg-gradient-to-b from-[#B7A7FF] to-[#7EADD0] bg-clip-text text-4xl font-light leading-none tracking-[-0.04em] text-transparent sm:text-5xl lg:pt-1 lg:text-6xl">
            05
          </motion.span>

          <div className="space-y-10 sm:space-y-12">
            <motion.div variants={fadeUp} className="max-w-2xl space-y-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.32em] text-[#77777D]">Parcours</p>
              <h2 className="text-xl font-medium leading-snug tracking-[-0.02em] text-[#111111] sm:text-2xl lg:text-[1.75rem]">
                Comment ça marche
              </h2>
              <p className="text-sm leading-relaxed text-[#77777D] sm:text-[15px]">
                Du premier clic au suivi post-consultation.
              </p>
            </motion.div>

            <motion.div variants={fadeUp} className="relative">
              <div className="relative mb-8 hidden h-1 overflow-hidden rounded-full bg-[#E8EAED]/80 sm:block">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-[#7EADD0] via-[#B7A7FF] to-[#7EADD0]"
                  animate={{ width: `${((timelineStep + 1) / TIMELINE_STEPS.length) * 100}%` }}
                  transition={{ duration: 0.6, ease: LANDING_EASE }}
                />
              </div>
              <div className="flex gap-3 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] sm:gap-0 sm:overflow-visible sm:pb-0 [&::-webkit-scrollbar]:hidden">
                {TIMELINE_STEPS.map((step, i) => {
                  const active = timelineStep === i;
                  return (
                    <button
                      key={step.title}
                      type="button"
                      onClick={() => setTimelineStep(i)}
                      className={cn(
                        'relative shrink-0 text-left transition sm:flex-1',
                        i > 0 && 'sm:pl-6',
                      )}
                    >
                      <motion.span
                        animate={mounted && active ? { scale: [1, 1.15, 1], boxShadow: ['0 0 0 rgba(183,167,255,0)', '0 0 20px rgba(183,167,255,0.5)', '0 0 0 rgba(183,167,255,0)'] } : false}
                        transition={{ duration: 2, repeat: active ? Infinity : 0 }}
                        className={cn(
                          'mb-3 inline-flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-medium transition',
                          active
                            ? 'bg-gradient-to-br from-[#B7A7FF] to-[#7EADD0] text-white'
                            : 'border border-[#E8EAED] bg-white/60 text-[#77777D] backdrop-blur-sm',
                        )}
                      >
                        {String(i + 1).padStart(2, '0')}
                      </motion.span>
                      <p className={cn('text-sm font-medium transition', active ? 'text-[#111111]' : 'text-[#77777D]')}>
                        {step.title}
                      </p>
                    </button>
                  );
                })}
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={timelineStep}
                  initial={{ opacity: 0, y: 24, filter: 'blur(8px)' }}
                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, y: -16, filter: 'blur(6px)' }}
                  transition={{ duration: 0.5, ease: LANDING_EASE }}
                  className="mt-8"
                >
                  <GlassPanel tint="blue" className="p-6 sm:p-8">
                    <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-[#7EADD0]">
                      Étape {String(timelineStep + 1).padStart(2, '0')}
                    </p>
                    <h3 className="mt-3 text-lg font-medium text-[#111111] sm:text-xl">
                      {TIMELINE_STEPS[timelineStep].title}
                    </h3>
                    <p className="mt-3 max-w-xl text-sm leading-relaxed text-[#77777D] sm:text-[15px]">
                      {TIMELINE_STEPS[timelineStep].desc}
                    </p>
                  </GlassPanel>
                </motion.div>
              </AnimatePresence>
            </motion.div>

            <motion.div variants={fadeUp} className="grid gap-4 sm:grid-cols-2">
              <GlassPanel tint="dark" className="p-6 sm:p-8">
                <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-[#B7A7FF]">Cabinets</p>
                <ul className="mt-6 space-y-4">
                  {PRO_STEPS.slice(0, 3).map((s) => (
                    <li key={s.step} className="flex gap-3 text-sm">
                      <span className="text-[#B7A7FF]">{s.step}</span>
                      <div>
                        <p className="font-medium">{s.title}</p>
                        <p className="mt-1 text-[#A7AAB0]">{s.desc}</p>
                      </div>
                    </li>
                  ))}
                </ul>
                <Link href={PRO_MAIL} className="mt-6 inline-flex items-center gap-2 text-[12px] font-medium text-[#B7A7FF] transition hover:gap-3">
                  Nous contacter
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </GlassPanel>
              <GlassPanel tint="purple" className="p-6 sm:p-8">
                <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-[#77777D]">Patients</p>
                <ul className="mt-6 space-y-4">
                  {PATIENT_STEPS.map((s) => (
                    <li key={s.step} className="flex gap-3 text-sm">
                      <span className="text-[#7EADD0]">{s.step}</span>
                      <div>
                        <p className="font-medium text-[#111111]">{s.title}</p>
                        <p className="mt-1 text-[#77777D]">{s.desc}</p>
                      </div>
                    </li>
                  ))}
                </ul>
                <Link href="/search" className="mt-6 inline-flex items-center gap-2 text-[12px] font-medium text-[#111111] transition hover:gap-3">
                  Commencer
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </GlassPanel>
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* Plateforme — 06 */}
      <motion.section
        id="plateforme"
        initial={false}
        whileInView={mounted ? 'visible' : undefined}
        viewport={LANDING_VIEWPORT}
        variants={staggerContainer}
        className={cn(LANDING_SHELL, 'relative scroll-mt-24 overflow-hidden border-t border-[#E8EAED]/60 py-16 sm:py-20 lg:py-24')}
      >
        <SectionMesh variant="mixed" />
        <div className="relative grid grid-cols-1 gap-10 lg:grid-cols-[auto_minmax(0,1fr)] lg:items-start lg:gap-x-12 xl:gap-x-16">
          <motion.span variants={fadeUp} className="bg-gradient-to-b from-[#7EADD0] to-[#B7A7FF] bg-clip-text text-4xl font-light leading-none tracking-[-0.04em] text-transparent sm:text-5xl lg:pt-1 lg:text-6xl">
            06
          </motion.span>

          <div className="space-y-10 sm:space-y-12">
            <motion.div variants={fadeUp} className="max-w-2xl space-y-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.32em] text-[#77777D]">Plateforme</p>
              <h2 className="text-xl font-medium leading-snug tracking-[-0.02em] text-[#111111] sm:text-2xl lg:text-[1.75rem]">
                Tout le parcours, une seule suite
              </h2>
              <p className="text-sm leading-relaxed text-[#77777D] sm:text-[15px]">
                Du rendez-vous au suivi clinique — multi-spécialités, documents PDF vérifiables et messagerie sécurisée.
              </p>
            </motion.div>

            <motion.div variants={staggerContainer} className="space-y-6">
              {PLATFORM_PLUS.map((item) => (
                <motion.div key={item.title} variants={slideFromLeft} className="flex gap-4 sm:gap-5">
                  <motion.span
                    whileHover={{ rotate: 90, scale: 1.1 }}
                    className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#B7A7FF] to-[#7EADD0] text-white shadow-[0_4px_16px_rgba(183,167,255,0.4)]"
                  >
                    <Plus className="h-3.5 w-3.5" strokeWidth={2} />
                  </motion.span>
                  <div>
                    <h3 className="text-base font-medium text-[#111111] sm:text-lg">{item.title}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-[#77777D]">{item.desc}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>

            <motion.div variants={staggerContainer} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {[
                { title: 'Agenda intelligent', desc: 'Créneaux, blocages, téléconsultation.', icon: Calendar, tint: 'blue' as const },
                { title: 'Consultation structurée', desc: 'Formulaires par spécialité.', icon: ClipboardList, tint: 'purple' as const },
                { title: 'Documents PDF', desc: 'Ordonnances et comptes rendus.', icon: FileText, tint: 'neutral' as const },
                { title: 'Messagerie', desc: 'Échanges patient ↔ cabinet.', icon: MessageSquare, tint: 'purple' as const },
                { title: 'Équipe & sites', desc: 'Multi-sites et rôles.', icon: Users, tint: 'blue' as const },
                { title: 'Conformité', desc: 'Isolation cabinet et audit.', icon: Shield, tint: 'neutral' as const },
              ].map((f) => (
                <motion.div key={f.title} variants={scaleInSpring}>
                  <GlassPanel tint={f.tint} hover className="flex items-start gap-3 p-4 sm:p-5">
                    <f.icon className="mt-0.5 h-4 w-4 shrink-0 text-[#7EADD0]" strokeWidth={1.75} />
                    <div>
                      <p className="text-sm font-medium text-[#111111]">{f.title}</p>
                      <p className="mt-1 text-xs leading-relaxed text-[#77777D]">{f.desc}</p>
                    </div>
                  </GlassPanel>
                </motion.div>
              ))}
            </motion.div>

            <motion.div variants={fadeUp}>
              <GlassPanel tint="neutral" className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 px-6 py-4 text-[12px] text-[#77777D] sm:text-[13px]">
              <span className="inline-flex items-center gap-2">
                <Video className="h-3.5 w-3.5 text-[#7EADD0]" /> Téléconsultation
              </span>
              <span className="text-[#E8EAED]">|</span>
              <span className="inline-flex items-center gap-2">
                <HeartPulse className="h-3.5 w-3.5 text-[#B7A7FF]" /> Pré-consultation
              </span>
              <span className="text-[#E8EAED]">|</span>
              <Link href="/pre-consultation/demo-pre-ahmed" className="font-medium text-[#111111] transition hover:text-[#7EADD0]">
                Démo pré-consultation
              </Link>
              </GlassPanel>
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* Témoignages — 07 */}
      <motion.section
        id="temoignages"
        initial={false}
        whileInView={mounted ? 'visible' : undefined}
        viewport={LANDING_VIEWPORT}
        variants={staggerContainer}
        className={cn(LANDING_SHELL, 'relative scroll-mt-24 overflow-hidden border-t border-[#E8EAED]/60 py-16 sm:py-20 lg:py-24')}
      >
        <SectionMesh variant="purple" />
        <div className="relative grid grid-cols-1 gap-10 lg:grid-cols-[auto_minmax(0,1fr)] lg:items-start lg:gap-x-12 xl:gap-x-16">
          <motion.span variants={fadeUp} className="bg-gradient-to-b from-[#B7A7FF] to-[#111111] bg-clip-text text-4xl font-light leading-none tracking-[-0.04em] text-transparent sm:text-5xl lg:pt-1 lg:text-6xl">
            07
          </motion.span>

          <div className="space-y-8 sm:space-y-10">
            <motion.div variants={fadeUp} className="flex items-end justify-between gap-4">
              <div className="max-w-2xl space-y-3">
                <p className="text-[10px] font-bold uppercase tracking-[0.32em] text-[#77777D]">Témoignages</p>
                <h2 className="text-xl font-medium leading-snug tracking-[-0.02em] text-[#111111] sm:text-2xl lg:text-[1.75rem]">
                  Ils utilisent {APP_CONFIG.APP_NAME}
                </h2>
              </div>
              <div className="flex shrink-0 gap-2">
                <button
                  type="button"
                  onClick={() => setTestimonialIdx((i) => (i - 1 + TESTIMONIALS.length) % TESTIMONIALS.length)}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-[#F0F0F0] transition hover:bg-[#EBEBEB]"
                  aria-label="Témoignage précédent"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setTestimonialIdx((i) => (i + 1) % TESTIMONIALS.length)}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-[#F0F0F0] transition hover:bg-[#EBEBEB]"
                  aria-label="Témoignage suivant"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </motion.div>

            <div className="flex gap-4 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] sm:gap-5 [&::-webkit-scrollbar]:hidden">
              {TESTIMONIALS.map((t, i) => {
                const active = i === testimonialIdx;
                return (
                  <motion.blockquote
                    key={t.name}
                    layout
                    animate={{
                      scale: active ? 1.04 : 0.96,
                      opacity: active ? 1 : 0.65,
                      y: active ? -6 : 0,
                    }}
                    transition={{ type: 'spring', stiffness: 200, damping: 22 }}
                    className="w-[min(88vw,320px)] shrink-0 sm:w-[340px]"
                  >
                    <GlassPanel
                      tint={active ? 'purple' : 'neutral'}
                      hover={!active}
                      className={cn('flex h-full flex-col p-6 sm:p-8', active && 'ring-2 ring-[#B7A7FF]/40')}
                    >
                      <div className="flex gap-0.5 text-[#B7A7FF]">
                        {Array.from({ length: t.rating }).map((_, j) => (
                          <Star key={j} className="h-3.5 w-3.5 fill-current" />
                        ))}
                      </div>
                      <p className="mt-5 flex-1 text-sm leading-relaxed text-[#111111] sm:text-[15px]">
                        &ldquo;{t.text}&rdquo;
                      </p>
                      <footer className="mt-6 border-t border-[#E8EAED]/60 pt-5">
                        <p className="text-sm font-medium text-[#111111]">{t.name}</p>
                        <p className="mt-0.5 text-xs text-[#77777D]">{t.role}</p>
                      </footer>
                    </GlassPanel>
                  </motion.blockquote>
                );
              })}
            </div>
          </div>
        </div>
      </motion.section>

      {/* Cabinet — 08 */}
      <motion.section
        id="cabinet"
        initial={false}
        whileInView={mounted ? 'visible' : undefined}
        viewport={LANDING_VIEWPORT}
        variants={staggerContainer}
        className={cn(LANDING_SHELL, 'scroll-mt-24 border-t border-[#E8EAED] bg-[#F8F8F6] py-16 sm:py-20 lg:py-24')}
      >
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[auto_minmax(0,1fr)] lg:items-start lg:gap-x-12 xl:gap-x-16">
          <motion.span variants={fadeUp} className="text-4xl font-light leading-none tracking-[-0.04em] text-[#111111] sm:text-5xl lg:pt-1 lg:text-6xl">
            08
          </motion.span>

          <div className="space-y-10 sm:space-y-12">
            <motion.div variants={fadeUp} className="max-w-2xl space-y-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.32em] text-[#77777D]">Cabinets</p>
              <h2 className="text-xl font-medium leading-snug tracking-[-0.02em] text-[#111111] sm:text-2xl lg:text-[1.75rem]">
                Une offre à votre échelle
              </h2>
              <p className="text-sm leading-relaxed text-[#77777D] sm:text-[15px]">
                Devis personnalisé — nous adaptons le périmètre à votre pratique.
              </p>
            </motion.div>

            <motion.div variants={staggerContainer} className="grid gap-4 lg:grid-cols-3 lg:gap-5">
              {CABINET_SCOPES.map((plan) => {
                const highlighted = 'highlight' in plan && plan.highlight;
                return (
                  <motion.div key={plan.name} variants={scaleInSpring}>
                    <GlassPanel
                      tint={highlighted ? 'dark' : 'neutral'}
                      hover
                      className="flex h-full flex-col p-6 sm:p-8"
                    >
                      <p className={cn('text-[10px] font-bold uppercase tracking-[0.28em]', highlighted ? 'text-[#B7A7FF]' : 'text-[#77777D]')}>
                        {plan.name}
                      </p>
                      <p className={cn('mt-4 text-sm leading-relaxed', highlighted ? 'text-[#A7AAB0]' : 'text-[#77777D]')}>
                        {plan.pitch}
                      </p>
                      <ul className="mt-6 flex-1 space-y-2.5">
                        {plan.features.map((line) => (
                          <li key={line} className="flex items-start gap-2.5 text-sm">
                            <Check className={cn('mt-0.5 h-3.5 w-3.5 shrink-0', highlighted ? 'text-[#B7A7FF]' : 'text-[#7EADD0]')} strokeWidth={2.5} />
                            <span className={highlighted ? 'text-[#E8EAED]' : 'text-[#555555]'}>{line}</span>
                          </li>
                        ))}
                      </ul>
                      <Button
                        className={cn(
                          'mt-8 w-full rounded-full text-[12px] font-medium uppercase tracking-wider',
                          highlighted ? 'bg-white text-[#111111] hover:bg-[#F0F0F0]' : 'bg-[#111111] text-white hover:bg-[#333333]',
                        )}
                        asChild
                      >
                        <a href={PRO_MAIL_PLAN(plan.name)}>Demander un devis</a>
                      </Button>
                    </GlassPanel>
                  </motion.div>
                );
              })}
            </motion.div>

            <motion.div variants={fadeUp} className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
              <Button className="h-11 rounded-full border-0 bg-white px-6 text-sm font-medium text-[#111111] shadow-none hover:bg-[#EBEBEB]" asChild>
                <a href={PRO_MAIL} className="inline-flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Contact commercial
                </a>
              </Button>
              <Button variant="ghost" className="h-11 rounded-full text-[#77777D] hover:bg-white hover:text-[#111111]" asChild>
                <Link href="/login?intent=pro">
                  Déjà client — connexion
                  <ArrowRight className="ml-1 inline h-3.5 w-3.5" />
                </Link>
              </Button>
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* FAQ — 09 */}
      <motion.section
        id="faq"
        initial={false}
        whileInView={mounted ? 'visible' : undefined}
        viewport={LANDING_VIEWPORT}
        variants={staggerContainer}
        className={cn(LANDING_SHELL, 'scroll-mt-24 border-t border-[#E8EAED] bg-white py-16 sm:py-20 lg:py-24')}
      >
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[auto_minmax(0,1fr)] lg:items-start lg:gap-x-12 xl:gap-x-16">
          <motion.span variants={fadeUp} className="text-4xl font-light leading-none tracking-[-0.04em] text-[#111111] sm:text-5xl lg:pt-1 lg:text-6xl">
            09
          </motion.span>

          <div className="space-y-8 sm:space-y-10">
            <motion.div variants={fadeUp} className="max-w-2xl space-y-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.32em] text-[#77777D]">FAQ</p>
              <h2 className="text-xl font-medium leading-snug tracking-[-0.02em] text-[#111111] sm:text-2xl lg:text-[1.75rem]">
                Questions fréquentes
              </h2>
            </motion.div>
            <motion.div variants={fadeUp}>
              <GlassPanel tint="blue" className="p-6 sm:p-8">
                <LandingFaq />
              </GlassPanel>
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* CTA final */}
      <motion.section
        initial={false}
        whileInView={mounted ? 'visible' : undefined}
        viewport={LANDING_VIEWPORT}
        variants={staggerContainer}
        className={cn(LANDING_SHELL, 'relative overflow-hidden border-t border-[#E8EAED]/60 py-16 sm:py-20')}
      >
        <SectionMesh variant="purple" />
        <motion.div variants={scaleInSpring} className="relative mx-auto max-w-3xl">
          <GlassPanel tint="purple" className="overflow-hidden p-8 text-center sm:p-12">
            <motion.div
              className="pointer-events-none absolute -left-20 -top-20 h-56 w-56 rounded-full bg-[#B7A7FF]/25 blur-[70px]"
              animate={mounted ? { scale: [1, 1.3, 1], opacity: [0.4, 0.7, 0.4] } : false}
              transition={{ duration: 4, repeat: Infinity }}
              aria-hidden
            />
            <motion.div
              className="pointer-events-none absolute -bottom-16 -right-16 h-48 w-48 rounded-full bg-[#7EADD0]/25 blur-[60px]"
              animate={mounted ? { scale: [1.2, 1, 1.2], opacity: [0.3, 0.6, 0.3] } : false}
              transition={{ duration: 5, repeat: Infinity }}
              aria-hidden
            />
            <h2 className="relative text-xl font-medium tracking-[-0.02em] text-[#111111] sm:text-2xl lg:text-[1.75rem]">
              Prêt à prendre soin de vous ?
            </h2>
            <p className="relative mt-4 text-sm leading-relaxed text-[#77777D] sm:text-[15px]">
              Recherche, réservation et suivi — en quelques clics.
            </p>
            <ShimmerLine className="relative mx-auto mt-6 max-w-xs" />
            <div className="relative mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center sm:justify-center">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}>
                <Button size="lg" className="h-11 rounded-full bg-gradient-to-r from-[#111111] to-[#2a2a3e] px-8 text-sm font-medium text-white shadow-[0_8px_32px_rgba(183,167,255,0.3)] hover:opacity-90 sm:h-12" asChild>
                  <Link href="/search" className="inline-flex items-center gap-2">
                    <Search className="h-4 w-4" />
                    Rechercher un praticien
                  </Link>
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}>
                <Button
                  size="lg"
                  variant="outline"
                  className="h-11 rounded-full border-[#B7A7FF]/40 bg-white/50 px-8 text-sm font-medium text-[#111111] backdrop-blur-md hover:bg-white/80 sm:h-12"
                  asChild
                >
                  <a href={PRO_MAIL}>Demander une démo cabinet</a>
                </Button>
              </motion.div>
            </div>
          </GlassPanel>
        </motion.div>
      </motion.section>

      {/* Footer */}
      <motion.footer
        initial={false}
        whileInView={mounted ? 'visible' : undefined}
        viewport={LANDING_VIEWPORT}
        variants={fadeUp}
        className={cn(LANDING_SHELL, 'border-t border-[#E8EAED] bg-white py-12 sm:py-16')}
      >
        <div className="flex flex-col gap-12 md:flex-row md:items-start md:justify-between">
          <div className="space-y-4 md:max-w-sm">
            <span className="text-lg font-medium tracking-tight text-[#111111]">{APP_CONFIG.APP_NAME}</span>
            <p className="text-sm leading-relaxed text-[#77777D]">
              {APP_CONFIG.APP_DESCRIPTION}
            </p>
            <a href={PRO_MAIL} className="inline-flex items-center gap-2 text-sm font-medium text-[#111111] transition hover:text-[#7EADD0]">
              <Mail className="h-4 w-4" />
              {APP_CONFIG.PRO_CONTACT_EMAIL}
            </a>
            <p className="text-xs text-[#77777D]">© {new Date().getFullYear()} {APP_CONFIG.APP_NAME}</p>
          </div>
          <div className="flex flex-wrap gap-x-16 gap-y-8 text-sm">
            <div>
              <h4 className="text-[10px] font-bold uppercase tracking-[0.28em] text-[#111111]">Patients</h4>
              <ul className="mt-4 space-y-3 text-[#77777D]">
                <li>
                  <Link href="/search" className="hover:text-[#111111]">
                    Rechercher un médecin
                  </Link>
                </li>
                <li>
                  <Link href="/register" className="hover:text-[#111111]">
                    Inscription
                  </Link>
                </li>
                <li>
                  <Link href="/login?intent=patient" className="hover:text-[#111111]">
                    Connexion
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-[10px] font-bold uppercase tracking-[0.28em] text-[#111111]">Professionnels</h4>
              <ul className="mt-4 space-y-3 text-[#77777D]">
                <li>
                  <a href={PRO_MAIL} className="hover:text-[#111111]">
                    Demande d'accès
                  </a>
                </li>
                <li>
                  <Link href="/login?intent=pro" className="hover:text-[#111111]">
                    Connexion cabinet
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-[10px] font-bold uppercase tracking-[0.28em] text-[#111111]">Légal</h4>
              <ul className="mt-4 space-y-3 text-[#77777D]">
                <li>
                  <Link href="/legal/confidentialite" className="hover:text-[#111111]">
                    Confidentialité
                  </Link>
                </li>
                <li>
                  <Link href="/legal/mentions-legales" className="hover:text-[#111111]">
                    Mentions légales
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </motion.footer>
    </div>
  );
}
