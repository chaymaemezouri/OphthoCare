'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, KeyRound, Loader2, Mail, Shield } from 'lucide-react';
import { authApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LANDING_SHELL } from '@/components/marketing/landing-layout';
import { fadeUp, useLandingMounted } from '@/components/marketing/landing-motion';
import {
  FloatingOrbs,
  GlassPanel,
  GradientText,
  SectionMesh,
  ShimmerLine,
} from '@/components/marketing/landing-visuals';
import { cn } from '@/lib/utils';

const btnPrimary =
  'h-11 w-full rounded-full border border-[#7EADD0]/40 bg-white/90 font-medium text-[#7EADD0] shadow-none hover:border-[#7EADD0] hover:bg-[#7EADD0]/10';
const btnGhost =
  'h-11 w-full rounded-full text-[#77777D] hover:bg-[#7EADD0]/5 hover:text-[#555555]';
const inputClass =
  'h-11 rounded-[14px] border-[#E8EAED] bg-white/80 pl-10 text-[#555555] shadow-none placeholder:text-[#999999] focus-visible:border-[#7EADD0]/50 focus-visible:ring-[#7EADD0]/20';
const labelClass = 'text-[11px] font-medium uppercase tracking-wider text-[#77777D]';

const FEATURES = [
  { icon: KeyRound, text: 'Réinitialisation sécurisée de votre accès' },
  { icon: Mail, text: 'Lien ou jeton envoyé selon la configuration' },
  { icon: Shield, text: 'Vos données restent protégées' },
] as const;

export function ForgotPasswordFlow() {
  const mounted = useLandingMounted();
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [devToken, setDevToken] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage(null);
    setDevToken(null);
    setLoading(true);
    try {
      const res = await authApi.forgotPassword(email.trim());
      setMessage(res.message);
      if (res.resetToken) setDevToken(res.resetToken);
    } catch {
      setError('Impossible d’envoyer la demande pour le moment.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-[calc(100svh-3.5rem)] overflow-hidden sm:min-h-[calc(100svh-4rem)]">
      <SectionMesh variant="mixed" />
      <FloatingOrbs />

      <div className={cn(LANDING_SHELL, 'relative grid min-h-[calc(100svh-3.5rem)] items-center gap-10 py-10 lg:grid-cols-2 lg:gap-16 lg:py-14 xl:gap-20 sm:min-h-[calc(100svh-4rem)]')}>
        {/* Panneau éditorial */}
        <motion.div
          variants={fadeUp}
          initial={false}
          animate={mounted ? 'visible' : false}
          className="hidden flex-col justify-center lg:flex"
        >
          <span className="bg-gradient-to-b from-[#7EADD0] via-[#B7A7FF] to-[#7EADD0] bg-clip-text text-5xl font-light leading-none tracking-[-0.04em] text-transparent xl:text-6xl">
            —
          </span>
          <p className="mt-6 text-[10px] font-bold uppercase tracking-[0.32em] text-[#77777D]">Accès sécurisé</p>
          <h1 className="mt-3 max-w-md text-2xl font-medium leading-snug tracking-[-0.02em] text-[#555555] xl:text-[2rem]">
            Retrouvez votre <GradientText>mot de passe</GradientText>
          </h1>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-[#77777D] sm:text-[15px]">
            Indiquez l&apos;e-mail associé à votre compte patient. Nous vous guiderons pour définir un nouveau mot de passe.
          </p>

          <ul className="mt-10 space-y-3">
            {FEATURES.map((item) => (
              <li key={item.text}>
                <GlassPanel tint="blue" className="flex items-center gap-4 px-4 py-3.5">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#E8EAED]/80 bg-white/70 text-[#7EADD0]">
                    <item.icon className="h-4 w-4" />
                  </span>
                  <span className="text-sm font-medium text-[#555555]">{item.text}</span>
                </GlassPanel>
              </li>
            ))}
          </ul>

          <ShimmerLine className="mt-10 max-w-xs" />
        </motion.div>

        {/* Formulaire */}
        <motion.div
          variants={fadeUp}
          initial={false}
          animate={mounted ? 'visible' : false}
          transition={{ delay: 0.08 }}
          className="mx-auto w-full max-w-md lg:max-w-lg"
        >
          <div className="mb-6 text-center lg:hidden">
            <p className="text-[10px] font-bold uppercase tracking-[0.32em] text-[#7EADD0]">Mot de passe oublié</p>
            <h1 className="mt-2 text-xl font-medium tracking-[-0.02em] text-[#555555]">
              Retrouvez votre <GradientText>accès</GradientText>
            </h1>
          </div>

          <GlassPanel tint="blue" className="overflow-hidden p-0">
            <div className="border-b border-[#E8EAED]/60 px-6 py-6 sm:px-8">
              <h2 className="text-lg font-medium tracking-[-0.02em] text-[#555555]">Réinitialisation</h2>
              <p className="mt-1.5 text-sm leading-relaxed text-[#77777D]">
                Un jeton de réinitialisation est généré côté serveur (voir les logs en développement). Avec{' '}
                <code className="rounded bg-white/60 px-1 text-[11px] text-[#555555]">PASSWORD_RESET_RETURN_TOKEN=true</code>
                , le jeton peut apparaître ci-dessous.
              </p>
            </div>

            <form onSubmit={submit} className="px-6 py-6 sm:px-8">
              {error ? (
                <div className="mb-4 rounded-[14px] border border-red-200/80 bg-red-50/80 px-4 py-3 text-sm text-red-900" role="alert">
                  {error}
                </div>
              ) : null}
              {message ? (
                <div className="mb-4 rounded-[14px] border border-[#7EADD0]/30 bg-[#7EADD0]/10 px-4 py-3 text-sm text-[#555555]">
                  {message}
                </div>
              ) : null}
              {devToken ? (
                <div className="mb-4 rounded-[14px] border border-[#B7A7FF]/30 bg-[#B7A7FF]/10 p-3 text-xs break-all text-[#555555]">
                  <p className="mb-1 font-semibold uppercase tracking-wider text-[#77777D]">Jeton (dev uniquement)</p>
                  <p className="font-mono">{devToken}</p>
                  <Link
                    href={`/reset-password?token=${encodeURIComponent(devToken)}`}
                    className="mt-2 inline-flex items-center gap-1 font-medium text-[#7EADD0] transition hover:text-[#B7A7FF]"
                  >
                    Ouvrir la page de réinitialisation
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              ) : null}

              <div className="space-y-2">
                <Label htmlFor="email" className={labelClass}>
                  E-mail du compte
                </Label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7EADD0]" />
                  <Input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="vous@exemple.com"
                    className={inputClass}
                  />
                </div>
              </div>

              <Button type="submit" className={cn('mt-6', btnPrimary)} disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Envoi…
                  </>
                ) : (
                  <>
                    Demander la réinitialisation
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>

              <Button variant="ghost" asChild className={cn('mt-2', btnGhost)}>
                <Link href="/login?intent=patient">Retour à la connexion</Link>
              </Button>
            </form>
          </GlassPanel>
        </motion.div>
      </div>
    </div>
  );
}
