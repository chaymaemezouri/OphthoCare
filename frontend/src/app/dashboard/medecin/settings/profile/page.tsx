"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Link from "next/link";
import { useRequireAuth, useAuth } from "@/hooks/use-auth";
import { useDoctorProfile } from "@/hooks/use-doctor-profile";
import { doctorsApi, usersApi } from "@/lib/api";
import { dashboardPathForRole } from "@/lib/auth-routes";
import { DoctorTeamSection } from "@/components/settings/doctor-team-section";

const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

function photoFullUrl(path?: string) {
  if (!path) return undefined;
  if (path.startsWith("http")) return path;
  return `${apiBase}${path}`;
}

export default function DoctorSettingsProfilePage() {
  useRequireAuth();
  const { user, isLoading: authLoading } = useAuth();
  /** Sessions anciennes sans `role` : on tente quand même GET /doctors/me. */
  const mayBeDoctor = Boolean(user) && (!user?.role || user.role === "doctor");
  const { doctor, loading, error, save, reload } = useDoctorProfile(!authLoading && mayBeDoctor);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const [bio, setBio] = useState("");
  const [slotDuration, setSlotDuration] = useState(30);
  const [orderNumber, setOrderNumber] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [consultationPrice, setConsultationPrice] = useState(0);
  const [preferredCurrency, setPreferredCurrency] = useState("MAD");
  const [subSpecialties, setSubSpecialties] = useState("");
  const [lang, setLang] = useState<"fr" | "ar" | "en">("fr");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!doctor) return;
    setFirstName(doctor.user.firstName ?? "");
    setLastName(doctor.user.lastName ?? "");
    setPhoneNumber(doctor.user.phoneNumber ?? "");
    setBio(doctor.bio ?? "");
    setSlotDuration(doctor.slotDurationMinutes ?? 30);
    setOrderNumber(doctor.orderNumber ?? "");
    setLicenseNumber(doctor.licenseNumber ?? "");
    setConsultationPrice(Number(doctor.consultationPrice ?? 0));
    setPreferredCurrency(doctor.preferredCurrency ?? "MAD");
    const sub = doctor.subSpecialties;
    setSubSpecialties(Array.isArray(sub) ? sub.join(", ") : (sub ?? ""));
    const l = doctor.user.lang;
    if (l === "ar" || l === "en" || l === "fr") setLang(l);
    else setLang("fr");
  }, [doctor]);

  const onSave = async () => {
    if (!doctor) return;
    setSaving(true);
    try {
      await usersApi.patchMe({
        firstName: firstName.trim() || undefined,
        lastName: lastName.trim() || undefined,
        phoneNumber: phoneNumber.trim() || undefined,
        ...(newPassword.length >= 8 ? { password: newPassword } : {}),
      });
      await save({
        bio: bio || undefined,
        slotDurationMinutes: slotDuration,
        orderNumber: orderNumber || undefined,
        licenseNumber: licenseNumber || undefined,
        consultationPrice,
        preferredCurrency: preferredCurrency || undefined,
        subSpecialties: subSpecialties || undefined,
        lang,
      });
      setNewPassword("");
      toast.success("Profil enregistré");
    } catch {
      toast.error("Erreur à l'enregistrement");
    } finally {
      setSaving(false);
    }
  };

  const onPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    try {
      await doctorsApi.uploadProfilePhotoPatch(f);
      await reload();
      toast.success("Photo mise à jour");
    } catch {
      toast.error("Échec envoi photo");
    }
    e.target.value = "";
  };

  const onSignature = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    try {
      await doctorsApi.uploadSignature(f);
      await reload();
      toast.success("Signature mise à jour");
    } catch {
      toast.error("Échec envoi signature (PNG ≤ 200 Ko)");
    }
    e.target.value = "";
  };

  if (authLoading || !user) {
    return <div className="p-8 text-center text-sm text-slate-500">Chargement…</div>;
  }
  if (loading) {
    return <div className="p-8 text-center text-sm text-slate-500">Chargement du profil…</div>;
  }
  if (!authLoading && user.role && user.role !== "doctor" && !doctor) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-center text-sm text-amber-900">
        <p className="font-semibold">Accès réservé aux médecins</p>
        <p className="mt-2 text-amber-800/90">Vous êtes connecté avec un autre rôle ({user.role}).</p>
        <Button className="mt-4 rounded-lg" asChild>
          <Link href={dashboardPathForRole(user.role)}>Retour à mon tableau de bord</Link>
        </Button>
      </div>
    );
  }
  if (error || !doctor) {
    return (
      <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-center text-sm text-rose-800">
        <p className="font-semibold">Profil indisponible</p>
        <p className="mt-2">{error ?? "Impossible de charger les données."}</p>
        <Button variant="outline" className="mt-4 rounded-lg" onClick={() => void reload()}>
          Réessayer
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <Card className="border-slate-100 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Identité & connexion</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Prénom</Label>
            <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} className="rounded-lg" />
          </div>
          <div className="space-y-2">
            <Label>Nom</Label>
            <Input value={lastName} onChange={(e) => setLastName(e.target.value)} className="rounded-lg" />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>E-mail (connexion)</Label>
            <Input value={doctor.user.email} disabled className="rounded-lg bg-slate-50" />
          </div>
          <div className="space-y-2">
            <Label>Téléphone</Label>
            <Input value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} className="rounded-lg" />
          </div>
          <div className="space-y-2">
            <Label>Nouveau mot de passe</Label>
            <Input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Laisser vide pour ne pas changer"
              className="rounded-lg"
              autoComplete="new-password"
            />
            <p className="text-[11px] text-slate-400">8 caractères minimum</p>
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Spécialité</Label>
            <Input
              value={doctor.specialtyName ?? doctor.specialtyCode}
              disabled
              className="rounded-lg bg-slate-50"
            />
          </div>
        </CardContent>
      </Card>

      <Card className="border-slate-100 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Photo & signature</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-8 sm:flex-row">
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase text-slate-500">Photo</Label>
            <div className="flex items-center gap-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photoFullUrl(doctor.profilePhotoUrl) || "/placeholder-avatar.png"}
                alt=""
                className="h-20 w-20 rounded-2xl border border-slate-100 bg-slate-50 object-cover"
                onError={(ev) => {
                  (ev.target as HTMLImageElement).src =
                    "data:image/svg+xml," +
                    encodeURIComponent(
                      `<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80"><rect fill="#f1f5f9" width="80" height="80"/></svg>`,
                    );
                }}
              />
              <div>
                <Input type="file" accept="image/jpeg,image/png,image/webp" onChange={onPhoto} className="text-xs" />
                <p className="mt-1 text-[11px] text-slate-400">JPG, PNG ou WebP — max 2 Mo</p>
              </div>
            </div>
          </div>
          <div className="flex-1 space-y-2">
            <Label className="text-xs font-semibold uppercase text-slate-500">Signature (PNG privée)</Label>
            <Input type="file" accept="image/png" onChange={onSignature} className="max-w-xs text-xs" />
            {doctor.hasSignature ? (
              <p className="mt-2 text-xs font-medium text-emerald-600">Signature enregistrée</p>
            ) : (
              <p className="mt-2 text-xs text-slate-400">Aucune signature</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="border-slate-100 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Cabinet & honoraires</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="bio">Bio publique</Label>
            <textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={4}
              className="flex min-h-[100px] w-full resize-none rounded-md border border-slate-200 bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-200"
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="sub">Sous-spécialités</Label>
            <Input id="sub" value={subSpecialties} onChange={(e) => setSubSpecialties(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Honoraire consultation (defaut)</Label>
            <Input
              type="number"
              min={0}
              value={consultationPrice}
              onChange={(e) => setConsultationPrice(Number(e.target.value) || 0)}
            />
          </div>
          <div className="space-y-2">
            <Label>Devise</Label>
            <Input value={preferredCurrency} onChange={(e) => setPreferredCurrency(e.target.value)} maxLength={8} />
          </div>
          <div className="space-y-2">
            <Label>Durée créneau</Label>
            <Select value={String(slotDuration)} onValueChange={(v) => v && setSlotDuration(parseInt(String(v), 10))}>
              <SelectTrigger className="rounded-lg">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[15, 20, 30, 45, 60, 90, 120].map((m) => (
                  <SelectItem key={m} value={String(m)}>
                    {m} min
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>N° ordre / RPPS</Label>
            <Input value={orderNumber} onChange={(e) => setOrderNumber(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>N° licence</Label>
            <Input value={licenseNumber} onChange={(e) => setLicenseNumber(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Langue interface</Label>
            <Select value={lang} onValueChange={(v) => v && setLang(v as "fr" | "ar" | "en")}>
              <SelectTrigger className="rounded-lg">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fr">Français</SelectItem>
                <SelectItem value="ar">العربية</SelectItem>
                <SelectItem value="en">English</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {doctor.doctorSpace ? (
            <div className="space-y-2 sm:col-span-2">
              <Label>Espace cabinet</Label>
              <Input value={doctor.doctorSpace.name} disabled className="bg-slate-50" />
            </div>
          ) : null}
        </CardContent>
      </Card>

      <DoctorTeamSection />

      <div className="flex justify-end pb-4">
        <Button onClick={() => void onSave()} disabled={saving} className="min-w-[160px] rounded-lg">
          {saving ? "Enregistrement…" : "Enregistrer le profil"}
        </Button>
      </div>
    </div>
  );
}
