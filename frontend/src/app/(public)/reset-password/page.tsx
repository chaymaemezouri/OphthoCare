'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { authApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

function ResetPasswordInner() {
  const searchParams = useSearchParams();
  const tokenFromUrl = searchParams.get('token') ?? '';

  const [token, setToken] = useState(tokenFromUrl);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [ok, setOk] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password.length < 8) {
      setError('Au moins 8 caractères.');
      return;
    }
    if (password !== confirm) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }
    setLoading(true);
    try {
      const res = await authApi.resetPassword(token.trim(), password);
      setSuccessMessage(res.message);
      setOk(true);
    } catch {
      setError('Lien invalide, expiré ou mot de passe refusé.');
    } finally {
      setLoading(false);
    }
  };

  if (ok) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F4F6F8] p-4">
        <Card className="w-full max-w-md border-slate-200/90 shadow-sm">
          <CardHeader>
            <CardTitle>Mot de passe mis à jour</CardTitle>
            <CardDescription>{successMessage}</CardDescription>
          </CardHeader>
          <CardFooter>
            <Button asChild className="w-full rounded-xl font-semibold">
              <Link href="/login">Se connecter</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F4F6F8] p-4">
      <Card className="w-full max-w-md border-slate-200/90 shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl font-semibold">Nouveau mot de passe</CardTitle>
          <CardDescription>Collez le jeton reçu (logs serveur ou e-mail) puis choisissez un mot de passe.</CardDescription>
        </CardHeader>
        <form onSubmit={submit}>
          <CardContent className="space-y-4">
            {error ? (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900">{error}</div>
            ) : null}
            <div className="space-y-2">
              <Label htmlFor="token">Jeton</Label>
              <Input
                id="token"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                className="rounded-xl font-mono text-xs"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pw">Nouveau mot de passe</Label>
              <Input
                id="pw"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="rounded-xl"
                required
                minLength={8}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pw2">Confirmation</Label>
              <Input
                id="pw2"
                type="password"
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="rounded-xl"
                required
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-3 border-t border-slate-100 bg-slate-50/50">
            <Button type="submit" className="w-full rounded-xl font-semibold" disabled={loading}>
              {loading ? 'Enregistrement…' : 'Enregistrer'}
            </Button>
            <Button variant="ghost" asChild className="w-full">
              <Link href="/login">Annuler</Link>
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#F4F6F8] text-sm text-slate-500">Chargement…</div>
      }
    >
      <ResetPasswordInner />
    </Suspense>
  );
}
