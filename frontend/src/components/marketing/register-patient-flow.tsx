'use client';

import { useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Calendar, ChevronLeft, FileText, Loader2, Shield, UserPlus } from 'lucide-react';
import { authApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { RegisterPatientProfilePayload } from '@/types/patient';
import { APP_CONFIG } from '@/lib/constants/app-config';
import { safeReturnUrl } from '@/lib/auth-routes';
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
  'rounded-full border border-[#7EADD0]/40 bg-white/90 font-medium text-[#7EADD0] shadow-none hover:border-[#7EADD0] hover:bg-[#7EADD0]/10';
const btnOutline =
  'rounded-full border-[#E8EAED] bg-white/80 text-[#555555] shadow-none hover:border-[#7EADD0]/40 hover:bg-[#7EADD0]/5';
const inputClass =
  'h-11 rounded-[14px] border-[#E8EAED] bg-white/80 text-[#555555] shadow-none placeholder:text-[#999999] focus-visible:border-[#7EADD0]/50 focus-visible:ring-[#7EADD0]/20';
const textareaClass =
  'min-h-[72px] w-full rounded-[14px] border border-[#E8EAED] bg-white/80 px-3 py-2.5 text-sm text-[#555555] shadow-none placeholder:text-[#999999] focus-visible:border-[#7EADD0]/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7EADD0]/20';
const labelClass = 'text-[11px] font-medium uppercase tracking-wider text-[#77777D]';

const FEATURES = [
  { icon: UserPlus, text: 'Compte patient gratuit en 2 étapes' },
  { icon: Calendar, text: 'Réservation et suivi de vos rendez-vous' },
  { icon: Shield, text: 'Données médicales protégées' },
] as const;

function parseList(s: string): string[] {
  return s
    .split(/[,;\n]+/)
    .map((x) => x.trim())
    .filter(Boolean);
}

function StepPills({ step }: { step: 1 | 2 }) {
  return (
    <div className="mb-5 flex items-center justify-center gap-2">
      {[
        { n: 1, label: 'Compte' },
        { n: 2, label: 'Profil' },
      ].map((s) => {
        const active = step === s.n;
        const done = step > s.n;
        return (
          <div key={s.n} className="flex items-center gap-2">
            <span
              className={cn(
                'flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium transition',
                done && 'bg-[#7EADD0] text-white',
                active && !done && 'bg-[#B7A7FF]/90 text-white ring-4 ring-[#B7A7FF]/20',
                !active && !done && 'border border-[#E8EAED] bg-white/80 text-[#999999]',
              )}
            >
              {s.n}
            </span>
            <span className={cn('hidden text-[10px] font-bold uppercase tracking-[0.2em] sm:inline', active ? 'text-[#555555]' : 'text-[#999999]')}>
              {s.label}
            </span>
            {s.n === 1 ? <div className={cn('h-px w-8', done ? 'bg-[#7EADD0]/60' : 'bg-[#E8EAED]')} /> : null}
          </div>
        );
      })}
    </div>
  );
}

export function RegisterPatientFlow() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const mounted = useLandingMounted();
  const returnUrl = useMemo(() => safeReturnUrl(searchParams.get('returnUrl')), [searchParams]);

  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [gender, setGender] = useState('');
  const [nationalId, setNationalId] = useState('');
  const [insuranceProvider, setInsuranceProvider] = useState('');
  const [insuranceNumber, setInsuranceNumber] = useState('');
  const [cnssAffiliation, setCnssAffiliation] = useState('');
  const [amoRightsNumber, setAmoRightsNumber] = useState('');
  const [mutuelleName, setMutuelleName] = useState('');
  const [mutuelleContractNumber, setMutuelleContractNumber] = useState('');
  const [coverageNotes, setCoverageNotes] = useState('');
  const [insuranceCoverage, setInsuranceCoverage] = useState('');
  const [address, setAddress] = useState('');
  const [bloodType, setBloodType] = useState('');
  const [allergiesText, setAllergiesText] = useState('');
  const [antecedentsText, setAntecedentsText] = useState('');
  const [ecName, setEcName] = useState('');
  const [ecRelation, setEcRelation] = useState('');
  const [ecPhone, setEcPhone] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const loginHref = returnUrl
    ? `/login?returnUrl=${encodeURIComponent(returnUrl)}&intent=patient`
    : '/login?intent=patient';

  const buildPatientProfile = (): RegisterPatientProfilePayload | undefined => {
    const p: RegisterPatientProfilePayload = {};
    if (dateOfBirth) p.dateOfBirth = dateOfBirth;
    if (gender) p.gender = gender;
    if (nationalId.trim()) p.nationalId = nationalId.trim();
    if (phoneNumber.trim()) p.phone = phoneNumber.trim();
    if (insuranceProvider) p.insuranceProvider = insuranceProvider;
    if (insuranceNumber.trim()) p.insuranceNumber = insuranceNumber.trim();
    if (cnssAffiliation.trim()) p.cnssAffiliation = cnssAffiliation.trim();
    if (amoRightsNumber.trim()) p.amoRightsNumber = amoRightsNumber.trim();
    if (mutuelleName.trim()) p.mutuelleName = mutuelleName.trim();
    if (mutuelleContractNumber.trim()) p.mutuelleContractNumber = mutuelleContractNumber.trim();
    if (coverageNotes.trim()) p.coverageNotes = coverageNotes.trim();
    if (insuranceCoverage.trim()) p.insuranceCoverage = insuranceCoverage.trim();
    if (address.trim()) p.address = address.trim();
    if (bloodType.trim()) p.bloodType = bloodType.trim();
    const allergies = parseList(allergiesText);
    const antecedents = parseList(antecedentsText);
    if (allergies.length) p.allergies = allergies;
    if (antecedents.length) p.antecedents = antecedents;
    if (ecName.trim() && ecRelation.trim() && ecPhone.trim()) {
      p.emergencyContact = { name: ecName.trim(), relation: ecRelation.trim(), phone: ecPhone.trim() };
    }
    return Object.keys(p).length ? p : undefined;
  };

  const submitAll = async () => {
    setError('');
    setIsLoading(true);
    try {
      const patientProfile = buildPatientProfile();
      await authApi.register({
        email,
        password,
        role: 'patient',
        firstName: firstName || undefined,
        lastName: lastName || undefined,
        phoneNumber: phoneNumber.trim() || undefined,
        patientProfile,
      });
      const q = new URLSearchParams({ registered: '1', intent: 'patient' });
      if (returnUrl) q.set('returnUrl', returnUrl);
      router.push(`/login?${q.toString()}`);
    } catch {
      setError(
        'Impossible de créer le compte. Vérifiez les champs ou utilisez une autre adresse e-mail.',
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleStep1Next = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email.trim() || password.length < 8) {
      setError('E-mail et mot de passe (8 caractères minimum) sont requis.');
      return;
    }
    setStep(2);
  };

  return (
    <div className="relative min-h-[calc(100svh-3.5rem)] overflow-hidden sm:min-h-[calc(100svh-4rem)]">
      <SectionMesh variant="mixed" />
      <FloatingOrbs />

      <div className={cn(LANDING_SHELL, 'relative grid min-h-[calc(100svh-3.5rem)] items-start gap-10 py-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-16 lg:py-14 xl:gap-20 sm:min-h-[calc(100svh-4rem)]')}>
        {/* Panneau éditorial */}
        <motion.div
          variants={fadeUp}
          initial={false}
          animate={mounted ? 'visible' : false}
          className="hidden flex-col justify-center lg:sticky lg:top-24 lg:flex"
        >
          <span className="bg-gradient-to-b from-[#7EADD0] via-[#B7A7FF] to-[#7EADD0] bg-clip-text text-5xl font-light leading-none tracking-[-0.04em] text-transparent xl:text-6xl">
            02
          </span>
          <p className="mt-6 text-[10px] font-bold uppercase tracking-[0.32em] text-[#77777D]">Inscription</p>
          <h1 className="mt-3 max-w-md text-2xl font-medium leading-snug tracking-[-0.02em] text-[#555555] xl:text-[2rem]">
            Rejoignez <GradientText>{APP_CONFIG.APP_NAME}</GradientText>
          </h1>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-[#77777D] sm:text-[15px]">
            Créez votre espace patient pour réserver, préparer vos consultations et centraliser vos documents de santé.
          </p>

          <ul className="mt-10 space-y-3">
            {FEATURES.map((item) => (
              <li key={item.text}>
                <GlassPanel tint="purple" className="flex items-center gap-4 px-4 py-3.5">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#E8EAED]/80 bg-white/70 text-[#B7A7FF]">
                    <item.icon className="h-4 w-4" />
                  </span>
                  <span className="text-sm font-medium text-[#555555]">{item.text}</span>
                </GlassPanel>
              </li>
            ))}
          </ul>

          <GlassPanel tint="blue" className="mt-8 px-4 py-3.5">
            <p className="flex items-start gap-2 text-xs leading-relaxed text-[#77777D]">
              <FileText className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#7EADD0]" />
              <span>
                Vous êtes <strong className="font-medium text-[#555555]">professionnel de santé</strong> ?{' '}
                <a
                  href={`mailto:${APP_CONFIG.PRO_CONTACT_EMAIL}?subject=${encodeURIComponent(`Accès cabinet — ${APP_CONFIG.APP_NAME}`)}`}
                  className="font-medium text-[#7EADD0] transition hover:text-[#B7A7FF]"
                >
                  Demandez l&apos;accès cabinet
                </a>
                — l&apos;inscription en ligne est réservée aux patients.
              </span>
            </p>
          </GlassPanel>

          <ShimmerLine className="mt-10 max-w-xs" />
        </motion.div>

        {/* Formulaire */}
        <motion.div
          variants={fadeUp}
          initial={false}
          animate={mounted ? 'visible' : false}
          transition={{ delay: 0.08 }}
          className="mx-auto w-full max-w-xl lg:max-w-none"
        >
          <div className="mb-6 text-center lg:hidden">
            <p className="text-[10px] font-bold uppercase tracking-[0.32em] text-[#7EADD0]">Inscription patient</p>
            <h1 className="mt-2 text-xl font-medium tracking-[-0.02em] text-[#555555]">
              Rejoignez <GradientText>{APP_CONFIG.APP_NAME}</GradientText>
            </h1>
          </div>

          <StepPills step={step} />

          <GlassPanel tint="purple" className="overflow-hidden p-0">
            <div className="border-b border-[#E8EAED]/60 px-6 py-5 sm:px-8">
              <h2 className="text-lg font-medium tracking-[-0.02em] text-[#555555]">
                {step === 1 ? 'Votre compte' : 'Profil & couverture'}
              </h2>
              <p className="mt-1.5 text-sm text-[#77777D]">
                {step === 1
                  ? 'Identifiants de connexion — étape 1 sur 2.'
                  : 'Informations optionnelles pour personnaliser votre dossier.'}
              </p>
              {returnUrl ? (
                <p className="mt-3 rounded-[14px] border border-[#B7A7FF]/30 bg-[#B7A7FF]/10 px-3 py-2 text-sm text-[#555555]">
                  Après inscription, vous serez redirigé pour poursuivre votre parcours.
                </p>
              ) : null}
            </div>

            {step === 1 ? (
              <form onSubmit={handleStep1Next} className="px-6 py-6 sm:px-8">
                {error ? (
                  <div className="mb-4 rounded-[14px] border border-red-200/80 bg-red-50/80 px-4 py-3 text-sm text-red-900" role="alert">
                    {error}
                  </div>
                ) : null}
                <div className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="firstName" className={labelClass}>Prénom</Label>
                      <Input id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} autoComplete="given-name" className={inputClass} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName" className={labelClass}>Nom</Label>
                      <Input id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} autoComplete="family-name" className={inputClass} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className={labelClass}>E-mail</Label>
                    <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" className={inputClass} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password" className={labelClass}>Mot de passe (min. 8 caractères)</Label>
                    <Input id="password" type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" className={inputClass} />
                  </div>
                </div>
                <Button type="submit" className={cn('mt-6 h-11 w-full', btnPrimary)}>
                  Continuer
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <p className="mt-5 text-center text-sm text-[#77777D]">
                  Déjà inscrit ?{' '}
                  <Link href={loginHref} className="font-medium text-[#7EADD0] transition hover:text-[#B7A7FF]">
                    Se connecter
                  </Link>
                </p>
              </form>
            ) : (
              <div className="max-h-[min(70vh,640px)] overflow-y-auto px-6 py-6 sm:px-8">
                {error ? (
                  <div className="mb-4 rounded-[14px] border border-red-200/80 bg-red-50/80 px-4 py-3 text-sm text-red-900" role="alert">
                    {error}
                  </div>
                ) : null}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone" className={labelClass}>Téléphone (optionnel)</Label>
                    <Input id="phone" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} autoComplete="tel" placeholder="+212 …" className={inputClass} />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="dob" className={labelClass}>Date de naissance</Label>
                      <Input id="dob" type="date" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} className={inputClass} />
                    </div>
                    <div className="space-y-2">
                      <Label className={labelClass}>Genre</Label>
                      <Select value={gender} onValueChange={(v) => setGender(v ?? '')}>
                        <SelectTrigger className={inputClass}>
                          <SelectValue placeholder="Choisir" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="female">Féminin</SelectItem>
                          <SelectItem value="male">Masculin</SelectItem>
                          <SelectItem value="other">Autre</SelectItem>
                          <SelectItem value="unspecified">Non précisé</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nid" className={labelClass}>CIN / passeport (optionnel)</Label>
                    <Input id="nid" value={nationalId} onChange={(e) => setNationalId(e.target.value)} className={inputClass} />
                  </div>
                  <div className="space-y-2">
                    <Label className={labelClass}>Type de couverture</Label>
                    <Select value={insuranceProvider} onValueChange={(v) => setInsuranceProvider(v ?? '')}>
                      <SelectTrigger className={inputClass}>
                        <SelectValue placeholder="Sélectionner" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CNSS">CNSS</SelectItem>
                        <SelectItem value="AMO">AMO</SelectItem>
                        <SelectItem value="Mutuelle">Mutuelle</SelectItem>
                        <SelectItem value="Privé">Privé</SelectItem>
                        <SelectItem value="Autre">Autre</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="insNum" className={labelClass}>N° adhérent / police (optionnel)</Label>
                    <Input id="insNum" value={insuranceNumber} onChange={(e) => setInsuranceNumber(e.target.value)} className={inputClass} />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="cnss" className={labelClass}>N° CNSS / affiliation</Label>
                      <Input id="cnss" value={cnssAffiliation} onChange={(e) => setCnssAffiliation(e.target.value)} className={inputClass} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="amo" className={labelClass}>N° droits AMO</Label>
                      <Input id="amo" value={amoRightsNumber} onChange={(e) => setAmoRightsNumber(e.target.value)} className={inputClass} />
                    </div>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="mut" className={labelClass}>Mutuelle (organisme)</Label>
                      <Input id="mut" value={mutuelleName} onChange={(e) => setMutuelleName(e.target.value)} className={inputClass} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="mutn" className={labelClass}>N° contrat mutuelle</Label>
                      <Input id="mutn" value={mutuelleContractNumber} onChange={(e) => setMutuelleContractNumber(e.target.value)} className={inputClass} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="addr" className={labelClass}>Adresse (optionnel)</Label>
                    <textarea id="addr" className={textareaClass} value={address} onChange={(e) => setAddress(e.target.value)} rows={2} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="blood" className={labelClass}>Groupe sanguin (optionnel)</Label>
                    <Input id="blood" value={bloodType} onChange={(e) => setBloodType(e.target.value)} placeholder="Ex. A+" className={inputClass} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="allg" className={labelClass}>Allergies (virgules)</Label>
                    <textarea id="allg" className={textareaClass} value={allergiesText} onChange={(e) => setAllergiesText(e.target.value)} rows={2} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ante" className={labelClass}>Antécédents (virgules)</Label>
                    <textarea id="ante" className={textareaClass} value={antecedentsText} onChange={(e) => setAntecedentsText(e.target.value)} rows={2} />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="space-y-2 sm:col-span-1">
                      <Label htmlFor="ecn" className={labelClass}>Contact urgence — nom</Label>
                      <Input id="ecn" value={ecName} onChange={(e) => setEcName(e.target.value)} className={inputClass} />
                    </div>
                    <div className="space-y-2 sm:col-span-1">
                      <Label htmlFor="ecr" className={labelClass}>Lien</Label>
                      <Input id="ecr" value={ecRelation} onChange={(e) => setEcRelation(e.target.value)} className={inputClass} />
                    </div>
                    <div className="space-y-2 sm:col-span-1">
                      <Label htmlFor="ecp" className={labelClass}>Téléphone</Label>
                      <Input id="ecp" value={ecPhone} onChange={(e) => setEcPhone(e.target.value)} className={inputClass} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="covamt" className={labelClass}>Couverture (taux, régime…)</Label>
                    <textarea id="covamt" className={textareaClass} value={insuranceCoverage} onChange={(e) => setInsuranceCoverage(e.target.value)} rows={2} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cov" className={labelClass}>Précisions couverture (notes)</Label>
                    <textarea id="cov" className={textareaClass} value={coverageNotes} onChange={(e) => setCoverageNotes(e.target.value)} rows={2} />
                  </div>
                </div>
                <div className="mt-6 flex flex-col gap-3 border-t border-[#E8EAED]/60 pt-6 sm:flex-row sm:justify-between">
                  <Button type="button" variant="outline" className={cn('h-11', btnOutline)} onClick={() => setStep(1)} disabled={isLoading}>
                    <ChevronLeft className="mr-1.5 h-4 w-4" />
                    Retour
                  </Button>
                  <Button type="button" className={cn('h-11 sm:min-w-[180px]', btnPrimary)} disabled={isLoading} onClick={() => void submitAll()}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Création…
                      </>
                    ) : (
                      'Créer mon compte'
                    )}
                  </Button>
                </div>
              </div>
            )}
          </GlassPanel>

          <p className="mt-6 text-center text-xs text-[#999999] lg:hidden">
            Professionnel ?{' '}
            <a
              href={`mailto:${APP_CONFIG.PRO_CONTACT_EMAIL}?subject=${encodeURIComponent(`Accès cabinet — ${APP_CONFIG.APP_NAME}`)}`}
              className="text-[#7EADD0] transition hover:text-[#B7A7FF]"
            >
              Accès cabinet
            </a>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
