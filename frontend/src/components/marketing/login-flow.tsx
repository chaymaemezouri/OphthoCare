'use client';

import { useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn, getSession } from 'next-auth/react';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowRight,
  Eye,
  EyeOff,
  ImageIcon,
  Loader2,
  Lock,
  Mail,
} from 'lucide-react';
import { authApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { APP_CONFIG } from '@/lib/constants/app-config';
import { dashboardPathForRole, safeReturnUrl } from '@/lib/auth-routes';
import { cn } from '@/lib/utils';

const DEMO_ACCOUNTS = [
  { label: 'Patient démo', email: 'patient.demo@ophthocare.local', intent: 'patient' as const },
  { label: 'Médecin démo', email: 'dr.demo@ophthocare.local', intent: 'pro' as const },
  { label: 'Secrétaire', email: 'secretaire.demo@ophthocare.local', intent: 'pro' as const },
] as const;

const DEMO_PASSWORD = 'OphthoDemo2024!';

/** Visuels latéraux — déposez vos images dans /public puis renseignez le chemin */
export const LOGIN_SIDE_IMAGES = {
  patient: '', // ex. '/images/login-patient.jpg'
  pro: '', // ex. '/images/login-pro.jpg'
} as const;

const inputClass =
  'h-11 rounded-lg border-slate-300 bg-white pl-10 text-slate-900 shadow-sm placeholder:text-slate-400 focus-visible:border-blue-500 focus-visible:ring-blue-500/20';

function persistTokensFromSession() {
  void getSession().then((session) => {
    if (!session) return;
    if (session.accessToken) sessionStorage.setItem('access_token', session.accessToken);
    if (session.refreshToken) sessionStorage.setItem('refresh_token', session.refreshToken);
  });
}

function buildLoginHref(intent: 'patient' | 'pro', returnUrl: string | null) {
  const q = new URLSearchParams();
  q.set('intent', intent);
  if (returnUrl) q.set('returnUrl', returnUrl);
  return `/login?${q.toString()}`;
}

function returnUrlContext(path: string | null): string | null {
  if (!path) return null;
  if (path.startsWith('/book/')) return 'Connectez-vous pour finaliser votre réservation.';
  if (path.includes('pre-consultation')) return 'Accédez au questionnaire pré-consultation.';
  if (path.startsWith('/dashboard')) return 'Accédez à votre espace personnel.';
  return 'Vous serez redirigé vers la page demandée après connexion.';
}

function LoginSideVisual({ isPro }: { isPro: boolean }) {
  const src = isPro ? LOGIN_SIDE_IMAGES.pro : LOGIN_SIDE_IMAGES.patient;

  return (
    <div className="hidden flex-col justify-center md:flex">
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
        {isPro ? 'Espace professionnel' : 'Espace patient'}
      </p>
      <h1 className="mt-3 max-w-md text-2xl font-semibold leading-snug tracking-tight text-slate-900 lg:text-[1.75rem]">
        {isPro ? 'Connectez-vous à votre cabinet' : 'Bienvenue sur votre espace santé'}
      </h1>
      <p className="mt-3 max-w-sm text-sm leading-relaxed text-slate-600">
        {isPro
          ? 'Agenda, dossiers et coordination d’équipe — un accès sécurisé pour votre pratique.'
          : 'Rendez-vous, documents et suivi médical au même endroit.'}
      </p>

      <div className="relative mt-8 w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 shadow-sm">
        <div className="relative aspect-[4/5] min-h-[280px] w-full">
          {src ? (
            <Image src={src} alt="" fill className="object-cover" sizes="(max-width: 768px) 100vw, 28rem" priority />
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center text-slate-400">
              <ImageIcon className="h-10 w-10 stroke-[1.25]" aria-hidden />
              <p className="text-sm font-medium text-slate-500">Visuel à ajouter</p>
              <p className="text-xs text-slate-400">
                {isPro ? '/public/images/login-pro.jpg' : '/public/images/login-patient.jpg'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function LoginFlow() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const registered = searchParams.get('registered') === '1';
  const intentParam = searchParams.get('intent');
  const isProIntent = intentParam === 'pro' || intentParam === 'cabinet' || intentParam === 'doctor';
  const returnUrl = useMemo(() => safeReturnUrl(searchParams.get('returnUrl')), [searchParams]);

  const [step, setStep] = useState<'password' | '2fa'>('password');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [pendingToken, setPendingToken] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const redirectAfterAuth = (role?: string | null) => {
    const r = role ?? undefined;
    if (returnUrl) {
      if (returnUrl.startsWith('/book/') && r && r !== 'patient') {
        setError('Un compte patient est requis pour réserver ce rendez-vous.');
        return;
      }
      router.push(returnUrl);
      return;
    }
    router.push(dashboardPathForRole(r));
  };

  const finalizeSession = async (
    accessToken: string,
    refreshToken: string,
    userEmail: string,
    role?: string,
  ) => {
    sessionStorage.setItem('access_token', accessToken);
    sessionStorage.setItem('refresh_token', refreshToken);
    const result = await signIn('credentials', {
      redirect: false,
      email: userEmail,
      password: '__token__',
      accessToken,
      refreshToken,
    });
    if (result?.error) {
      setError('Impossible d’ouvrir la session. Réessayez.');
      return;
    }
    persistTokensFromSession();
    const session = await getSession();
    redirectAfterAuth(role ?? session?.user?.role);
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const res = await authApi.login(email.trim(), password);
      if ('twoFactorRequired' in res && res.twoFactorRequired) {
        setPendingToken(res.pendingToken);
        setStep('2fa');
        return;
      }
      if ('access_token' in res && res.user) {
        await finalizeSession(res.access_token, res.refresh_token, res.user.email, res.user.role);
      }
    } catch {
      setError('Identifiants incorrects ou compte indisponible.');
    } finally {
      setIsLoading(false);
    }
  };

  const handle2faSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const res = await authApi.loginTwoFactor(pendingToken, otp.replace(/\D/g, '').slice(0, 6));
      await finalizeSession(res.access_token, res.refresh_token, res.user.email, res.user.role);
    } catch {
      setError('Code incorrect ou expiré.');
    } finally {
      setIsLoading(false);
    }
  };

  const fillDemo = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword(DEMO_PASSWORD);
    setError('');
  };

  const registerHref = returnUrl
    ? `/register?returnUrl=${encodeURIComponent(returnUrl)}`
    : '/register';

  const contextMsg = returnUrlContext(returnUrl);

  return (
    <div className="min-h-[calc(100svh-3.5rem)] bg-slate-50 sm:min-h-[calc(100svh-4rem)]">
      <div className="mx-auto grid min-h-[inherit] max-w-6xl items-center gap-10 px-4 py-10 sm:px-6 lg:grid-cols-2 lg:gap-14 lg:py-14 xl:max-w-7xl">
        <LoginSideVisual isPro={isProIntent} />

        <div className="w-full max-w-md justify-self-center lg:max-w-none lg:justify-self-end">
          <div className="mb-6 md:hidden">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
              {isProIntent ? 'Professionnel' : 'Patient'}
            </p>
            <h1 className="mt-2 text-xl font-semibold text-slate-900">Connexion</h1>
          </div>

          <div className="mb-6 grid grid-cols-2 gap-1 rounded-lg border border-slate-200 bg-slate-200/60 p-1">
            <Link
              href={buildLoginHref('patient', returnUrl)}
              className={cn(
                'rounded-md py-2.5 text-center text-xs font-semibold uppercase tracking-wide transition',
                !isProIntent
                  ? 'bg-white text-blue-700 shadow-sm ring-1 ring-slate-200'
                  : 'text-slate-600 hover:text-slate-900',
              )}
            >
              Patient
            </Link>
            <Link
              href={buildLoginHref('pro', returnUrl)}
              className={cn(
                'rounded-md py-2.5 text-center text-xs font-semibold uppercase tracking-wide transition',
                isProIntent
                  ? 'bg-white text-blue-700 shadow-sm ring-1 ring-slate-200'
                  : 'text-slate-600 hover:text-slate-900',
              )}
            >
              Professionnel
            </Link>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white shadow-[0_8px_30px_rgba(15,23,42,0.06)]">
            <div className="border-b border-slate-100 px-6 py-5 sm:px-7">
              <h2 className="text-lg font-semibold text-slate-900">
                {step === '2fa' ? 'Vérification SMS' : 'Connexion'}
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                {step === '2fa'
                  ? 'Saisissez le code à 6 chiffres reçu par SMS.'
                  : isProIntent
                    ? 'Médecins, secrétaires et stagiaires de cabinet.'
                    : 'E-mail et mot de passe de votre compte patient.'}
              </p>
              {registered && step === 'password' ? (
                <p className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-900">
                  Inscription réussie — connectez-vous pour continuer.
                </p>
              ) : null}
              {contextMsg && step === 'password' ? (
                <p className="mt-3 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-900">
                  {contextMsg}
                </p>
              ) : null}
            </div>

            {step === 'password' ? (
              <form onSubmit={handlePasswordSubmit} className="px-6 pb-6 sm:px-7 sm:pb-7">
                {error ? (
                  <div
                    className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900"
                    role="alert"
                  >
                    {error}
                  </div>
                ) : null}

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                      Adresse e-mail
                    </Label>
                    <div className="relative">
                      <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="vous@exemple.com"
                        className={inputClass}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password" className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                        Mot de passe
                      </Label>
                      <Link
                        href="/forgot-password"
                        className="text-xs font-medium text-blue-700 transition hover:text-blue-800"
                      >
                        Mot de passe oublié
                      </Link>
                    </div>
                    <div className="relative">
                      <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <Input
                        id="password"
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        autoComplete="current-password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className={cn(inputClass, 'pr-10')}
                      />
                      <button
                        type="button"
                        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                        onClick={() => setShowPassword((v) => !v)}
                        aria-label={showPassword ? 'Masquer' : 'Afficher'}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="mt-5 rounded-lg border border-dashed border-slate-200 bg-slate-50 p-3.5">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Comptes démo</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {DEMO_ACCOUNTS.filter((d) => (isProIntent ? d.intent === 'pro' : d.intent === 'patient')).map(
                      (d) => (
                        <button
                          key={d.email}
                          type="button"
                          onClick={() => fillDemo(d.email)}
                          className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-medium text-slate-700 shadow-sm transition hover:border-blue-300 hover:text-blue-800"
                        >
                          {d.label}
                        </button>
                      ),
                    )}
                  </div>
                  <p className="mt-2 text-[10px] text-slate-500">Mot de passe : {DEMO_PASSWORD}</p>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="mt-6 h-11 w-full rounded-lg bg-blue-600 font-semibold text-white shadow-sm hover:bg-blue-700"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Connexion…
                    </>
                  ) : (
                    <>
                      Se connecter
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>

                <p className="mt-6 text-center text-sm text-slate-600">
                  {!isProIntent ? (
                    <>
                      Pas encore de compte ?{' '}
                      <Link href={registerHref} className="font-semibold text-blue-700 hover:text-blue-800">
                        Créer un compte patient
                      </Link>
                    </>
                  ) : (
                    <>
                      Nouveau cabinet ?{' '}
                      <a
                        href={`mailto:${APP_CONFIG.PRO_CONTACT_EMAIL}?subject=${encodeURIComponent('Demande accès cabinet')}`}
                        className="font-semibold text-blue-700 hover:text-blue-800"
                      >
                        Demander un accès
                      </a>
                    </>
                  )}
                </p>
              </form>
            ) : (
              <form onSubmit={handle2faSubmit} className="px-6 pb-6 sm:px-7 sm:pb-7">
                {error ? (
                  <div
                    className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900"
                    role="alert"
                  >
                    {error}
                  </div>
                ) : null}
                <div className="space-y-2">
                  <Label htmlFor="otp" className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                    Code à 6 chiffres
                  </Label>
                  <Input
                    id="otp"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    required
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    className="h-14 rounded-lg border-slate-300 bg-white text-center text-2xl tracking-[0.5em] text-slate-900 shadow-sm focus-visible:border-blue-500 focus-visible:ring-blue-500/20"
                    placeholder="••••••"
                  />
                </div>
                <Button
                  type="submit"
                  className="mt-6 h-11 w-full rounded-lg bg-blue-600 font-semibold text-white hover:bg-blue-700"
                  disabled={isLoading || otp.length !== 6}
                >
                  {isLoading ? 'Vérification…' : 'Valider'}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="mt-2 w-full rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  onClick={() => {
                    setStep('password');
                    setOtp('');
                    setError('');
                    setPendingToken('');
                  }}
                >
                  Retour
                </Button>
              </form>
            )}
          </div>

          <p className="mt-6 text-center text-xs text-slate-500">
            <Link href="/legal/confidentialite" className="transition hover:text-blue-700">
              Confidentialité
            </Link>
            {' · '}
            <Link href="/legal/mentions-legales" className="transition hover:text-blue-700">
              Mentions légales
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
