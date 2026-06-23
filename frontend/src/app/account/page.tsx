'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import axios from 'axios';
import {
  ArrowLeft,
  KeyRound,
  LayoutDashboard,
  Loader2,
  LogOut,
  Mail,
  Phone,
  RefreshCw,
  Shield,
  Smartphone,
} from 'lucide-react';
import { useAuth, useRequireAuth } from '@/hooks/use-auth';
import { authApi, usersApi } from '@/lib/api';
import { APP_CONFIG } from '@/lib/constants/app-config';
import type { User } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

function parseApiError(e: unknown, fallback: string): string {
  if (axios.isAxiosError(e)) {
    const data = e.response?.data as { message?: string | string[] } | undefined;
    if (typeof data?.message === 'string') return data.message;
    if (Array.isArray(data?.message)) return data.message.join(', ');
  }
  return fallback;
}

function dashboardHref(role: string | undefined): string {
  const r = (role ?? '').toLowerCase();
  if (r === 'patient') return '/dashboard/patient';
  if (r === 'doctor') return '/dashboard/medecin';
  if (r === 'secretary') return '/dashboard/secretaire';
  if (r === 'trainee') return '/dashboard/stagiaire';
  if (r === 'admin') return '/dashboard/admin';
  return '/';
}

function roleLabelFr(role: string | undefined): string {
  const map: Record<string, string> = {
    patient: 'Patient',
    doctor: 'Médecin',
    secretary: 'Secrétaire',
    trainee: 'Stagiaire',
    admin: 'Administrateur',
  };
  return map[(role ?? '').toLowerCase()] ?? role ?? '—';
}

const CARD = 'rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6';
const INPUT = 'rounded-lg border-slate-300 bg-white';

export default function AccountPage() {
  useRequireAuth();
  const { user, isLoading, logout } = useAuth();
  const { update } = useSession();

  const [fullUser, setFullUser] = useState<User | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [draft, setDraft] = useState({ firstName: '', lastName: '', phoneNumber: '' });
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');

  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [twoFaCode, setTwoFaCode] = useState('');
  const [twoFaBusy, setTwoFaBusy] = useState(false);
  const [twoFaMsg, setTwoFaMsg] = useState<string | null>(null);
  const [disable2faOpen, setDisable2faOpen] = useState(false);

  const [forgotBusy, setForgotBusy] = useState(false);
  const [forgotMsg, setForgotMsg] = useState<string | null>(null);

  const userId = user?.id;

  const loadProfile = useCallback(async () => {
    setProfileLoading(true);
    setErr(null);
    try {
      const u = await authApi.getMe();
      setFullUser(u);
      setDraft({
        firstName: u.firstName ?? '',
        lastName: u.lastName ?? '',
        phoneNumber: u.phoneNumber ?? '',
      });
    } catch (e) {
      setErr(parseApiError(e, 'Impossible de charger votre profil.'));
      setFullUser(null);
    } finally {
      setProfileLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isLoading && userId) void loadProfile();
  }, [isLoading, userId, loadProfile]);

  const saveProfile = async () => {
    setMsg(null);
    setErr(null);
    if (password.trim() && password.length < 8) {
      setErr('Le mot de passe doit contenir au moins 8 caractères.');
      return;
    }
    if (password.trim() && password !== passwordConfirm) {
      setErr('Les mots de passe ne correspondent pas.');
      return;
    }
    setSaving(true);
    try {
      const payload: Parameters<typeof usersApi.patchMe>[0] = {
        firstName: draft.firstName.trim() || undefined,
        lastName: draft.lastName.trim() || undefined,
        phoneNumber: draft.phoneNumber.trim() || undefined,
      };
      if (password.trim()) payload.password = password;
      await usersApi.patchMe(payload);
      if (typeof update === 'function') {
        try {
          await update({
            firstName: draft.firstName.trim() || undefined,
            lastName: draft.lastName.trim() || undefined,
          });
        } catch {
          /* non bloquant */
        }
      }
      setPassword('');
      setPasswordConfirm('');
      setMsg(
        password.trim()
          ? 'Profil enregistré. Reconnectez-vous avec votre nouveau mot de passe.'
          : 'Profil enregistré.',
      );
      await loadProfile();
    } catch (e) {
      setErr(parseApiError(e, 'Enregistrement impossible.'));
    } finally {
      setSaving(false);
    }
  };

  const send2faSetup = async () => {
    setTwoFaMsg(null);
    setTwoFaBusy(true);
    try {
      const r = await authApi.sendSms2faSetup();
      setTwoFaMsg(r.message ?? 'Code envoyé par SMS (ou consultez les logs en développement).');
    } catch (e) {
      setTwoFaMsg(parseApiError(e, 'Envoi impossible.'));
    } finally {
      setTwoFaBusy(false);
    }
  };

  const enable2fa = async () => {
    setTwoFaMsg(null);
    setTwoFaBusy(true);
    try {
      await authApi.enableSms2fa(twoFaCode.trim());
      setTwoFaCode('');
      setTwoFaMsg('Authentification SMS activée.');
      await loadProfile();
    } catch (e) {
      setTwoFaMsg(parseApiError(e, 'Activation impossible.'));
    } finally {
      setTwoFaBusy(false);
    }
  };

  const disable2fa = async () => {
    setTwoFaBusy(true);
    try {
      await authApi.disableSms2fa();
      setDisable2faOpen(false);
      setTwoFaMsg('Authentification SMS désactivée.');
      await loadProfile();
    } catch (e) {
      setTwoFaMsg(parseApiError(e, 'Désactivation impossible.'));
    } finally {
      setTwoFaBusy(false);
    }
  };

  const sendForgotPassword = async () => {
    const email = user?.email?.trim();
    if (!email) return;
    setForgotMsg(null);
    setForgotBusy(true);
    try {
      const r = await authApi.forgotPassword(email);
      setForgotMsg(
        r.resetToken
          ? `${r.message} (mode dev : jeton dans la réponse API.)`
          : r.message ?? 'Si un compte existe, un e-mail a été envoyé.',
      );
    } catch (e) {
      setForgotMsg(parseApiError(e, 'Demande impossible.'));
    } finally {
      setForgotBusy(false);
    }
  };

  if (isLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" aria-hidden />
      </div>
    );
  }

  const sms2faOn = Boolean(fullUser?.twoFactorSmsEnabled);

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white shadow-sm">
        <div className="flex h-14 w-full items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
          <Link href="/" className="text-sm font-semibold text-slate-900">
            {APP_CONFIG.APP_NAME}
          </Link>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="rounded-lg border-slate-200" asChild>
              <Link href={dashboardHref(user.role)}>
                <LayoutDashboard className="mr-1.5 h-4 w-4" />
                <span className="hidden sm:inline">Mon espace</span>
              </Link>
            </Button>
            <Button type="button" variant="outline" size="sm" className="rounded-lg border-slate-200" onClick={() => void logout()}>
              <LogOut className="h-4 w-4 sm:mr-1" />
              <span className="hidden sm:inline">Déconnexion</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto w-full max-w-3xl space-y-6 px-4 py-8 sm:px-6">
        <div>
          <Link
            href={dashboardHref(user.role)}
            className="mb-3 inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-blue-700"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Retour à l&apos;espace
          </Link>
          <h1 className="text-2xl font-semibold text-slate-900">Compte & sécurité</h1>
          <p className="mt-1 text-sm text-slate-600">
            Identité, mot de passe et protection de votre compte.
          </p>
        </div>

        {msg ? (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">{msg}</div>
        ) : null}
        {err ? (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">{err}</div>
        ) : null}

        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid h-auto w-full grid-cols-2 gap-1 rounded-lg border border-slate-200 bg-slate-200/60 p-1 sm:grid-cols-4">
            <TabsTrigger value="profile" className="rounded-md py-2 text-xs font-semibold data-active:bg-white data-active:text-blue-700 sm:text-sm">
              <Mail className="mr-1 hidden h-3.5 w-3.5 sm:inline" />
              Profil
            </TabsTrigger>
            <TabsTrigger value="security" className="rounded-md py-2 text-xs font-semibold data-active:bg-white data-active:text-blue-700 sm:text-sm">
              <KeyRound className="mr-1 hidden h-3.5 w-3.5 sm:inline" />
              Mot de passe
            </TabsTrigger>
            <TabsTrigger value="twofa" className="rounded-md py-2 text-xs font-semibold data-active:bg-white data-active:text-blue-700 sm:text-sm">
              <Smartphone className="mr-1 hidden h-3.5 w-3.5 sm:inline" />
              2FA SMS
            </TabsTrigger>
            <TabsTrigger value="recover" className="rounded-md py-2 text-xs font-semibold data-active:bg-white data-active:text-blue-700 sm:text-sm">
              <Shield className="mr-1 hidden h-3.5 w-3.5 sm:inline" />
              Récupération
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="mt-6 space-y-4 outline-none">
            <div className={CARD}>
              <h2 className="text-base font-semibold text-slate-900">Identité</h2>
              <p className="mt-1 text-sm text-slate-600">Nom, prénom et téléphone affichés sur votre compte.</p>

              <div className="mt-5 space-y-4">
                <div className="space-y-2">
                  <Label>E-mail</Label>
                  <Input value={user.email} disabled className={cn(INPUT, 'bg-slate-50')} />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="fn">Prénom</Label>
                    <Input
                      id="fn"
                      value={draft.firstName}
                      onChange={(e) => setDraft((d) => ({ ...d, firstName: e.target.value }))}
                      className={INPUT}
                      autoComplete="given-name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ln">Nom</Label>
                    <Input
                      id="ln"
                      value={draft.lastName}
                      onChange={(e) => setDraft((d) => ({ ...d, lastName: e.target.value }))}
                      className={INPUT}
                      autoComplete="family-name"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ph" className="inline-flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5 text-slate-400" />
                    Téléphone
                  </Label>
                  <Input
                    id="ph"
                    value={draft.phoneNumber}
                    onChange={(e) => setDraft((d) => ({ ...d, phoneNumber: e.target.value }))}
                    className={INPUT}
                    placeholder="+212 …"
                    autoComplete="tel"
                  />
                  <p className="text-xs text-slate-500">Requis pour activer la vérification par SMS.</p>
                </div>
                <p className="text-xs text-slate-500">
                  Rôle : <strong className="text-slate-800">{roleLabelFr(user.role)}</strong>
                </p>
                {user.role === 'patient' ? (
                  <p className="text-sm text-slate-600">
                    Données médicales :{' '}
                    <Link href="/dashboard/patient/profile" className="font-medium text-blue-700 hover:underline">
                      Profil santé
                    </Link>
                  </p>
                ) : null}
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                className="rounded-lg border-slate-200"
                disabled={profileLoading}
                onClick={() => void loadProfile()}
              >
                <RefreshCw className={cn('mr-1.5 h-4 w-4', profileLoading && 'animate-spin')} />
                Actualiser
              </Button>
              <Button
                type="button"
                className="rounded-lg bg-blue-600 hover:bg-blue-700"
                disabled={saving || profileLoading}
                onClick={() => void saveProfile()}
              >
                {saving ? 'Enregistrement…' : 'Enregistrer'}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="security" className="mt-6 space-y-4 outline-none">
            <div className={CARD}>
              <h2 className="text-base font-semibold text-slate-900">Changer le mot de passe</h2>
              <p className="mt-1 text-sm text-slate-600">Laissez vide pour ne pas modifier. Minimum 8 caractères.</p>
              <div className="mt-5 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="pw">Nouveau mot de passe</Label>
                  <Input id="pw" type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} className={INPUT} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pwc">Confirmer</Label>
                  <Input id="pwc" type="password" autoComplete="new-password" value={passwordConfirm} onChange={(e) => setPasswordConfirm(e.target.value)} className={INPUT} />
                </div>
                <Button type="button" className="rounded-lg bg-blue-600 hover:bg-blue-700" disabled={saving} onClick={() => void saveProfile()}>
                  {saving ? 'Enregistrement…' : 'Mettre à jour le mot de passe'}
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="twofa" className="mt-6 space-y-4 outline-none">
            <div className={CARD}>
              <h2 className="text-base font-semibold text-slate-900">Vérification par SMS</h2>
              <p className="mt-1 text-sm text-slate-600">
                Un code SMS sera demandé à chaque connexion si cette option est activée.
              </p>

              <div
                className={cn(
                  'mt-4 rounded-lg border px-3 py-2 text-sm',
                  sms2faOn ? 'border-blue-200 bg-blue-50 text-blue-900' : 'border-slate-200 bg-slate-50 text-slate-700',
                )}
              >
                Statut : <strong>{sms2faOn ? 'Activée' : 'Désactivée'}</strong>
              </div>

              {twoFaMsg ? <p className="mt-3 text-sm text-slate-700">{twoFaMsg}</p> : null}

              {!sms2faOn ? (
                <div className="mt-4 space-y-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <ol className="list-decimal space-y-1 pl-4 text-xs text-slate-600">
                    <li>Enregistrez votre téléphone dans l&apos;onglet Profil</li>
                    <li>Demandez un code d&apos;activation</li>
                    <li>Saisissez le code reçu</li>
                  </ol>
                  <Button type="button" variant="outline" size="sm" className="rounded-lg" disabled={twoFaBusy} onClick={() => void send2faSetup()}>
                    {twoFaBusy ? 'Envoi…' : 'Envoyer un code'}
                  </Button>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                    <div className="min-w-0 flex-1 space-y-2">
                      <Label htmlFor="twocode">Code reçu</Label>
                      <Input
                        id="twocode"
                        value={twoFaCode}
                        onChange={(e) => setTwoFaCode(e.target.value)}
                        className={cn(INPUT, 'font-mono tracking-widest')}
                        placeholder="000000"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                      />
                    </div>
                    <Button
                      type="button"
                      className="rounded-lg bg-blue-600 hover:bg-blue-700 sm:shrink-0"
                      disabled={twoFaBusy || !twoFaCode.trim()}
                      onClick={() => void enable2fa()}
                    >
                      Activer
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  className="mt-4 rounded-lg border-rose-200 text-rose-800 hover:bg-rose-50"
                  disabled={twoFaBusy}
                  onClick={() => setDisable2faOpen(true)}
                >
                  Désactiver la 2FA
                </Button>
              )}
            </div>
          </TabsContent>

          <TabsContent value="recover" className="mt-6 space-y-4 outline-none">
            <div className={CARD}>
              <h2 className="text-base font-semibold text-slate-900">Mot de passe oublié</h2>
              <p className="mt-1 text-sm text-slate-600">
                Recevez un lien de réinitialisation par e-mail.
              </p>
              <div className="mt-5 space-y-4">
                <div className="space-y-2">
                  <Label>E-mail du compte</Label>
                  <Input value={user.email} disabled className={cn(INPUT, 'bg-slate-50')} />
                </div>
                {forgotMsg ? <p className="text-sm text-slate-700">{forgotMsg}</p> : null}
                <Button type="button" variant="outline" className="rounded-lg border-slate-200" disabled={forgotBusy} onClick={() => void sendForgotPassword()}>
                  {forgotBusy ? 'Envoi…' : 'Recevoir un lien'}
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <p className="border-t border-slate-200 pt-6 text-center text-xs text-slate-500">
          Besoin d&apos;aide ?{' '}
          <a href={`mailto:${APP_CONFIG.PRO_CONTACT_EMAIL}`} className="font-medium text-blue-700 hover:underline">
            {APP_CONFIG.PRO_CONTACT_EMAIL}
          </a>
        </p>
      </div>

      <Dialog open={disable2faOpen} onOpenChange={setDisable2faOpen}>
        <DialogContent className="max-w-md" showCloseButton>
          <DialogHeader>
            <DialogTitle>Désactiver la 2FA SMS ?</DialogTitle>
            <DialogDescription>Votre compte ne demandera plus de code à la connexion.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" className="rounded-lg" onClick={() => setDisable2faOpen(false)}>
              Annuler
            </Button>
            <Button type="button" variant="destructive" className="rounded-lg" disabled={twoFaBusy} onClick={() => void disable2fa()}>
              {twoFaBusy ? 'Traitement…' : 'Désactiver'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
