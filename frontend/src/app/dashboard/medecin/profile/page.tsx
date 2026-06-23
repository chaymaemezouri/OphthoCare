"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Building2,
  CalendarClock,
  Camera,
  CheckCircle2,
  ChevronRight,
  Download,
  ExternalLink,
  Loader2,
  MapPin,
  PenLine,
  RefreshCw,
  Shield,
  Sparkles,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { DoctorPageShell } from "@/components/doctor/doctor-page-shell";
import { DoctorPageHeader } from "@/components/doctor/doctor-page-header";
import { DOCTOR_CARD, DOCTOR_OUTLINE_BTN, DOCTOR_PRIMARY_BTN } from "@/components/doctor/doctor-dashboard-shell";
import { useAuth, useRequireAuth } from "@/hooks/use-auth";
import { useDoctorProfile } from "@/hooks/use-doctor-profile";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { getInitials } from "@/lib/utils/format";
import { specialtiesApi, doctorsApi, usersApi } from "@/lib/api";
import type { PracticeSite, Specialty } from "@/types";

const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

const cardClass = DOCTOR_CARD;

const WEEKDAY_KEYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;
type WeekdayKey = (typeof WEEKDAY_KEYS)[number];

const WEEKDAY_LABELS: Record<WeekdayKey, string> = {
  mon: "Lundi",
  tue: "Mardi",
  wed: "Mercredi",
  thu: "Jeudi",
  fri: "Vendredi",
  sat: "Samedi",
  sun: "Dimanche",
};

function photoFullUrl(path?: string) {
  if (!path) return undefined;
  if (path.startsWith("http")) return path;
  return `${apiBase}${path}`;
}

function normalizeWorkingHours(raw: unknown): Record<WeekdayKey, string[]> {
  const out: Record<WeekdayKey, string[]> = {
    mon: [],
    tue: [],
    wed: [],
    thu: [],
    fri: [],
    sat: [],
    sun: [],
  };
  if (!raw || typeof raw !== "object") return out;
  const obj = raw as Record<string, unknown>;
  for (const k of WEEKDAY_KEYS) {
    const v = obj[k];
    if (Array.isArray(v)) {
      out[k] = v.filter((x): x is string => typeof x === "string" && x.trim().length > 0).map((x) => x.trim());
    }
  }
  return out;
}

function compactWorkingHours(wh: Record<WeekdayKey, string[]>): Record<string, string[]> {
  const o: Record<string, string[]> = {};
  for (const k of WEEKDAY_KEYS) {
    if (wh[k]?.length) o[k] = [...wh[k]];
  }
  return o;
}

type Banner = { variant: "success" | "warning" | "error"; text: string };

export default function MedecinProfilePage() {
  const router = useRouter();
  useRequireAuth();
  const { user, isLoading: authLoading } = useAuth();
  const isDoctor = user?.role === "doctor";
  const { doctor, loading, error, reload, save } = useDoctorProfile(Boolean(user) && isDoctor);

  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [specialtyCode, setSpecialtyCode] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [orderNumber, setOrderNumber] = useState("");
  const [bio, setBio] = useState("");
  const [subSpec, setSubSpec] = useState("");
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [price, setPrice] = useState("");
  const [slotDur, setSlotDur] = useState("30");
  const [preferredCurrency, setPreferredCurrency] = useState("MAD");
  const [lang, setLang] = useState<"fr" | "ar" | "en">("fr");
  const [weeklyHours, setWeeklyHours] = useState<Record<WeekdayKey, string[]>>(() =>
    normalizeWorkingHours({}),
  );
  const [advancedJson, setAdvancedJson] = useState("");
  const [sites, setSites] = useState<PracticeSite[]>([]);
  const [icsText, setIcsText] = useState("");
  const [icsMsg, setIcsMsg] = useState<string | null>(null);
  const [banner, setBanner] = useState<Banner | null>(null);
  const [saving, setSaving] = useState(false);
  const [calendarProbe, setCalendarProbe] = useState<string | null>(null);
  const [icsBusy, setIcsBusy] = useState(false);
  const [exportBusy, setExportBusy] = useState(false);

  useEffect(() => {
    if (!isDoctor && user && !authLoading) {
      router.replace("/unauthorized");
    }
  }, [isDoctor, user, authLoading, router]);

  useEffect(() => {
    specialtiesApi
      .getAll()
      .then((rows) =>
        setSpecialties(
          rows.map((r) => ({
            id: r.id,
            code: r.code,
            name: r.name,
            description: r.description ?? undefined,
            icon: r.icon ?? undefined,
            doctorCount: 0,
            createdAt: r.createdAt,
            updatedAt: r.updatedAt,
          })),
        ),
      )
      .catch(() => setSpecialties([]));
  }, []);

  useEffect(() => {
    if (!doctor) return;
    setFirstName(doctor.user.firstName ?? "");
    setLastName(doctor.user.lastName ?? "");
    setPhone(doctor.user.phoneNumber ?? "");
    setSpecialtyCode(doctor.specialtyCode);
    setLicenseNumber(doctor.licenseNumber ?? "");
    setOrderNumber(doctor.orderNumber ?? "");
    setBio(doctor.bio ?? "");
    setSubSpec((doctor.subSpecialties ?? []).join(", "));
    setStreet(doctor.street);
    setCity(doctor.city);
    setPostalCode(doctor.postalCode);
    setPrice(String(doctor.consultationPrice ?? 0));
    setSlotDur(String(doctor.slotDurationMinutes ?? 30));
    setPreferredCurrency(doctor.preferredCurrency ?? "MAD");
    const l = doctor.user.lang;
    if (l === "ar" || l === "en" || l === "fr") setLang(l);
    else setLang("fr");
    const wh = normalizeWorkingHours(doctor.workingHours);
    setWeeklyHours(wh);
    setAdvancedJson(JSON.stringify(compactWorkingHours(wh), null, 2));
    setSites((doctor.practiceSites as PracticeSite[] | undefined) ?? []);
  }, [doctor]);

  const profilePhotoSrc = useMemo(() => photoFullUrl(doctor?.profilePhotoUrl), [doctor?.profilePhotoUrl]);

  const syncJsonFromWeekly = useCallback(() => {
    setAdvancedJson(JSON.stringify(compactWorkingHours(weeklyHours), null, 2));
  }, [weeklyHours]);

  const applyAdvancedJson = useCallback(() => {
    try {
      const parsed = JSON.parse(advancedJson) as unknown;
      setWeeklyHours(normalizeWorkingHours(parsed));
      setBanner({ variant: "success", text: "JSON horaires appliqué à l’éditeur." });
    } catch {
      setBanner({ variant: "error", text: "JSON horaires invalide." });
    }
  }, [advancedJson]);

  const handleSave = useCallback(async () => {
    setBanner(null);
    const workingHours = compactWorkingHours(weeklyHours);
    setSaving(true);
    try {
      await usersApi.patchMe({
        firstName: firstName || undefined,
        lastName: lastName || undefined,
        phoneNumber: phone || undefined,
      });
      await save({
        specialtyCode: specialtyCode || undefined,
        licenseNumber: licenseNumber || undefined,
        orderNumber: orderNumber || undefined,
        bio: bio || undefined,
        subSpecialties: subSpec || undefined,
        street,
        city,
        postalCode,
        consultationPrice: price ? Number(price) : undefined,
        slotDurationMinutes: slotDur ? Number(slotDur) : undefined,
        preferredCurrency: preferredCurrency || undefined,
        lang,
        workingHours: Object.keys(workingHours).length ? workingHours : {},
        practiceSites: sites.length ? sites : [],
      });
      setBanner({ variant: "success", text: "Profil enregistré." });
      await reload();
    } catch {
      setBanner({
        variant: "error",
        text: "Enregistrement impossible. Vérifiez les champs et votre session.",
      });
    } finally {
      setSaving(false);
    }
  }, [
    bio,
    city,
    firstName,
    lastName,
    licenseNumber,
    orderNumber,
    phone,
    postalCode,
    preferredCurrency,
    lang,
    price,
    slotDur,
    reload,
    save,
    sites,
    specialtyCode,
    street,
    subSpec,
    weeklyHours,
  ]);

  const handlePhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBanner(null);
    try {
      await doctorsApi.uploadProfilePhotoPatch(file);
      setBanner({ variant: "success", text: "Photo mise à jour." });
      await reload();
    } catch {
      setBanner({ variant: "error", text: "Échec du téléversement de la photo (JPG, PNG ou WebP, max 2 Mo)." });
    }
    e.target.value = "";
  };

  const handleSignature = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBanner(null);
    try {
      await doctorsApi.uploadSignature(file);
      setBanner({ variant: "success", text: "Signature enregistrée." });
      await reload();
    } catch {
      setBanner({ variant: "error", text: "Signature refusée : PNG uniquement, 200 Ko max." });
    }
    e.target.value = "";
  };

  const handleIcs = async () => {
    setIcsMsg(null);
    setIcsBusy(true);
    try {
      const res = (await doctorsApi.importIcsWorkingHours(icsText)) as {
        workingHours?: Record<string, string[]>;
        warnings?: string[];
        applied?: boolean;
      };
      if (res.workingHours) {
        const next: Record<WeekdayKey, string[]> = { ...weeklyHours };
        for (const k of WEEKDAY_KEYS) {
          const fromIcs = res.workingHours[k];
          if (fromIcs?.length) {
            next[k] = [...new Set([...(next[k] ?? []), ...fromIcs])].sort();
          }
        }
        setWeeklyHours(next);
        setAdvancedJson(JSON.stringify(compactWorkingHours(next), null, 2));
      }
      setIcsMsg(
        [res.applied ? "Horaires fusionnés depuis le fichier ICS." : "", ...(res.warnings ?? [])]
          .filter(Boolean)
          .join(" "),
      );
      if (res.applied) await reload();
    } catch {
      setIcsMsg("Import ICS impossible (fichier invalide ou session expirée).");
    } finally {
      setIcsBusy(false);
    }
  };

  const addSite = () => {
    setSites((prev) => {
      const next = [
        ...prev,
        {
          id: crypto.randomUUID(),
          name: `Cabinet ${prev.length + 1}`,
          street,
          city,
          postalCode,
          consultationPrice: price ? Number(price) : 0,
          isPrimary: prev.length === 0,
        },
      ];
      return next;
    });
  };

  const updateSite = (i: number, patch: Partial<PracticeSite>) => {
    setSites((prev) => {
      const next = [...prev];
      next[i] = { ...next[i], ...patch };
      return next;
    });
  };

  const removeSite = (i: number) => {
    setSites((prev) => prev.filter((_, j) => j !== i));
  };

  const addSlot = (day: WeekdayKey) => {
    setWeeklyHours((prev) => ({
      ...prev,
      [day]: [...(prev[day] ?? []), "09:00-12:00"],
    }));
  };

  const updateSlot = (day: WeekdayKey, index: number, value: string) => {
    setWeeklyHours((prev) => {
      const slots = [...(prev[day] ?? [])];
      slots[index] = value;
      return { ...prev, [day]: slots };
    });
  };

  const removeSlot = (day: WeekdayKey, index: number) => {
    setWeeklyHours((prev) => {
      const slots = [...(prev[day] ?? [])].filter((_, j) => j !== index);
      return { ...prev, [day]: slots };
    });
  };

  const downloadMyAppointmentsIcs = async () => {
    setExportBusy(true);
    setBanner(null);
    try {
      const txt = await doctorsApi.fetchMyAppointmentsIcsText();
      const blob = new Blob([txt], { type: "text/calendar;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "ophthocare-mes-rendez-vous.ics";
      a.click();
      URL.revokeObjectURL(url);
      setBanner({ variant: "success", text: "Fichier .ics téléchargé." });
    } catch {
      setBanner({ variant: "error", text: "Impossible de télécharger le calendrier." });
    } finally {
      setExportBusy(false);
    }
  };

  const probeCalendarSync = async () => {
    setCalendarProbe(null);
    try {
      const res = (await doctorsApi.postCalendarSyncStub("google")) as { message?: string; connected?: boolean };
      setCalendarProbe(res.message ?? (res.connected ? "Connecté." : "Réponse reçue."));
    } catch {
      setCalendarProbe("Synchronisation cloud indisponible pour le moment.");
    }
  };

  if (authLoading || (isDoctor && loading)) {
    return (
      <DashboardLayout role="medecin">
        <div className="flex min-h-[40vh] items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-cyan-700" aria-hidden />
        </div>
      </DashboardLayout>
    );
  }

  if (!isDoctor) return null;

  const initials = getInitials(doctor?.user.firstName ?? undefined, doctor?.user.lastName ?? undefined);

  return (
    <DashboardLayout role="medecin">
      <DoctorPageShell className="space-y-6">
        <DoctorPageHeader
          title="Profil professionnel"
          description="Identité, cabinet, horaires et lieux — tarifs détaillés dans les paramètres."
          actions={
            <>
              {doctor?.id ? (
                <Button variant="outline" size="sm" className={DOCTOR_OUTLINE_BTN} asChild>
                  <Link href={`/doctor/${doctor.id}`} target="_blank" rel="noreferrer">
                    <ExternalLink className="mr-1.5 h-4 w-4" aria-hidden />
                    Page publique
                  </Link>
                </Button>
              ) : null}
              <Button type="button" variant="outline" size="sm" className={DOCTOR_OUTLINE_BTN} onClick={() => void reload()}>
                <RefreshCw className="mr-1.5 h-4 w-4" aria-hidden />
                Recharger
              </Button>
              <Button type="button" size="sm" className={DOCTOR_PRIMARY_BTN} disabled={saving} onClick={() => void handleSave()}>
                {saving ? (
                  <>
                    <Loader2 className="mr-1.5 h-4 w-4 animate-spin" aria-hidden />
                    Enregistrement…
                  </>
                ) : (
                  "Enregistrer"
                )}
              </Button>
            </>
          }
        />

          <div className="flex flex-wrap items-center gap-2">
            {doctor?.isVerified ? (
              <Badge className="rounded-full bg-cyan-50 px-2.5 py-0.5 text-xs font-medium text-cyan-950 ring-1 ring-cyan-200/80">
                <CheckCircle2 className="mr-1 inline h-3.5 w-3.5" aria-hidden />
                Profil vérifié
              </Badge>
            ) : (
              <Badge variant="outline" className="rounded-full border-amber-200 bg-amber-50 text-xs text-amber-950">
                Vérification en attente
              </Badge>
            )}
            {doctor?.isCertified ? (
              <Badge variant="outline" className="rounded-full border-cyan-200 bg-cyan-50 text-xs text-cyan-950">
                <Shield className="mr-1 inline h-3.5 w-3.5 opacity-70" aria-hidden />
                Certifié
              </Badge>
            ) : null}
          </div>

          {error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">{error}</div>
          ) : null}
          {banner ? (
            <div
              className={cn(
                "rounded-xl border px-4 py-3 text-sm",
                banner.variant === "success" && "border-emerald-200 bg-emerald-50 text-emerald-950",
                banner.variant === "warning" && "border-amber-200 bg-amber-50 text-amber-950",
                banner.variant === "error" && "border-red-200 bg-red-50 text-red-950",
              )}
            >
              {banner.text}
            </div>
          ) : null}

          <Tabs defaultValue="identity" className="w-full">
            <TabsList className="flex h-auto w-full flex-wrap gap-1 rounded-2xl border border-zinc-200/80 bg-zinc-100/90 p-1">
              <TabsTrigger
                value="identity"
                className="flex-1 gap-1.5 rounded-xl py-2.5 text-xs font-medium data-active:bg-white data-active:text-cyan-900 data-active:shadow-sm sm:flex-none sm:px-4 sm:text-sm"
              >
                Identité & présentation
              </TabsTrigger>
              <TabsTrigger
                value="cabinet"
                className="flex-1 gap-1.5 rounded-xl py-2.5 text-xs font-medium data-active:bg-white data-active:text-cyan-900 data-active:shadow-sm sm:flex-none sm:px-4 sm:text-sm"
              >
                Cabinet & tarif
              </TabsTrigger>
              <TabsTrigger
                value="hours"
                className="flex-1 gap-1.5 rounded-xl py-2.5 text-xs font-medium data-active:bg-white data-active:text-cyan-900 data-active:shadow-sm sm:flex-none sm:px-4 sm:text-sm"
              >
                Horaires
              </TabsTrigger>
              <TabsTrigger
                value="sites"
                className="flex-1 gap-1.5 rounded-xl py-2.5 text-xs font-medium data-active:bg-white data-active:text-cyan-900 data-active:shadow-sm sm:flex-none sm:px-4 sm:text-sm"
              >
                Lieux
              </TabsTrigger>
              <TabsTrigger
                value="calendar"
                className="flex-1 gap-1.5 rounded-xl py-2.5 text-xs font-medium data-active:bg-white data-active:text-cyan-900 data-active:shadow-sm sm:flex-none sm:px-4 sm:text-sm"
              >
                Calendrier
              </TabsTrigger>
            </TabsList>

            <TabsContent value="identity" className="mt-6 space-y-6 outline-none sm:mt-8">
              <Card className={cardClass}>
                <CardHeader className="border-b border-zinc-100 bg-zinc-50/60 pb-4">
                  <CardTitle className="text-base font-semibold text-zinc-900">Photo, signature & compte</CardTitle>
                  <CardDescription className="text-xs text-zinc-600">
                    Email de connexion :{" "}
                    <span className="font-medium text-zinc-900">{user?.email ?? "—"}</span> — mot de passe et 2FA dans{" "}
                    <Link href="/account" className="font-medium text-cyan-800 underline-offset-4 hover:underline">
                      Compte & sécurité
                    </Link>
                    .
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-8 pt-6 lg:grid-cols-[auto,1fr]">
                  <div className="flex flex-col items-center gap-3">
                    <Avatar className="h-28 w-28 border-2 border-white shadow-md ring-2 ring-zinc-100">
                      {profilePhotoSrc ? <AvatarImage src={profilePhotoSrc} alt="" /> : null}
                      <AvatarFallback className="bg-cyan-600 text-lg font-semibold text-white">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <label className="inline-flex cursor-pointer">
                      <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => void handlePhoto(e)} />
                      <span className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-800 shadow-sm hover:bg-zinc-50">
                        <Camera className="h-3.5 w-3.5" aria-hidden />
                        Changer la photo
                      </span>
                    </label>
                    <p className="text-center text-[0.6875rem] text-zinc-500">JPG, PNG ou WebP — max 2 Mo.</p>
                  </div>
                  <div className="space-y-6">
                    <div className="rounded-xl border border-zinc-100 bg-zinc-50/40 p-4">
                      <div className="flex items-start gap-3">
                        <PenLine className="mt-0.5 h-5 w-5 shrink-0 text-zinc-500" aria-hidden />
                        <div className="min-w-0 flex-1 space-y-2">
                          <Label className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                            Signature ordonnances (PNG privé)
                          </Label>
                          <Input type="file" accept="image/png" className="max-w-xs cursor-pointer text-xs" onChange={(e) => void handleSignature(e)} />
                          {doctor?.hasSignature ? (
                            <p className="text-xs font-medium text-emerald-700">Signature enregistrée.</p>
                          ) : (
                            <p className="text-xs text-zinc-500">Aucune signature — PNG, 200 Ko max.</p>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="fn">Prénom</Label>
                        <Input id="fn" value={firstName} onChange={(e) => setFirstName(e.target.value)} className="rounded-lg border-zinc-200" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="ln">Nom</Label>
                        <Input id="ln" value={lastName} onChange={(e) => setLastName(e.target.value)} className="rounded-lg border-zinc-200" />
                      </div>
                      <div className="space-y-2 sm:col-span-2">
                        <Label htmlFor="phone">Téléphone</Label>
                        <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} className="rounded-lg border-zinc-200" placeholder="+212 …" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className={cardClass}>
                <CardHeader className="border-b border-zinc-100 bg-zinc-50/60 pb-4">
                  <CardTitle className="text-base font-semibold text-zinc-900">Spécialité & affichage public</CardTitle>
                  <CardDescription className="text-xs text-zinc-600">Langue de l’interface et textes visibles par les patients.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 pt-6 sm:grid-cols-2">
                  <div className="space-y-2 sm:col-span-2">
                    <Label>Spécialité principale</Label>
                    <Select value={specialtyCode} onValueChange={(v) => setSpecialtyCode(v ?? "")}>
                      <SelectTrigger className="rounded-lg border-zinc-200">
                        <SelectValue placeholder="Choisir" />
                      </SelectTrigger>
                      <SelectContent>
                        {specialties.map((s) => (
                          <SelectItem key={s.code} value={s.code}>
                            {s.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label>Sous-spécialités (séparées par des virgules)</Label>
                    <Input value={subSpec} onChange={(e) => setSubSpec(e.target.value)} placeholder="Rétine, glaucome…" className="rounded-lg border-zinc-200" />
                  </div>
                  <div className="space-y-2">
                    <Label>N° licence / autorisation d’exercice</Label>
                    <Input value={licenseNumber} onChange={(e) => setLicenseNumber(e.target.value)} className="rounded-lg border-zinc-200" />
                  </div>
                  <div className="space-y-2">
                    <Label>N° ordre (RPPS, INP…)</Label>
                    <Input value={orderNumber} onChange={(e) => setOrderNumber(e.target.value)} className="rounded-lg border-zinc-200" />
                  </div>
                  <div className="space-y-2">
                    <Label>Langue</Label>
                    <Select value={lang} onValueChange={(v) => setLang(v as "fr" | "ar" | "en")}>
                      <SelectTrigger className="rounded-lg border-zinc-200">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fr">Français</SelectItem>
                        <SelectItem value="ar">العربية</SelectItem>
                        <SelectItem value="en">English</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Devise affichée (tarifs, exports)</Label>
                    <Select value={preferredCurrency} onValueChange={(v) => setPreferredCurrency(v ?? "MAD")}>
                      <SelectTrigger className="rounded-lg border-zinc-200">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {["MAD", "EUR", "USD"].map((c) => (
                          <SelectItem key={c} value={c}>
                            {c}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label>Biographie (page publique)</Label>
                    <textarea
                      className="min-h-[120px] w-full resize-y rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none transition focus-visible:border-cyan-600/50 focus-visible:ring-2 focus-visible:ring-cyan-600/15"
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="cabinet" className="mt-6 space-y-6 outline-none sm:mt-8">
              <Card className={cardClass}>
                <CardHeader className="border-b border-zinc-100 bg-zinc-50/60 pb-4">
                  <CardTitle className="flex items-center gap-2 text-base font-semibold text-zinc-900">
                    <MapPin className="h-4 w-4 text-cyan-700" aria-hidden />
                    Adresse principale & grille de réservation
                  </CardTitle>
                  <CardDescription className="text-xs text-zinc-600">
                    Utilisée pour la recherche patient. Un lieu marqué « principal » dans l’onglet Lieux met à jour ces champs à
                    l’enregistrement.
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 pt-6 sm:grid-cols-2">
                  <div className="space-y-2 sm:col-span-2">
                    <Label>Rue</Label>
                    <Input value={street} onChange={(e) => setStreet(e.target.value)} className="rounded-lg border-zinc-200" />
                  </div>
                  <div className="space-y-2">
                    <Label>Ville</Label>
                    <Input value={city} onChange={(e) => setCity(e.target.value)} className="rounded-lg border-zinc-200" />
                  </div>
                  <div className="space-y-2">
                    <Label>Code postal</Label>
                    <Input value={postalCode} onChange={(e) => setPostalCode(e.target.value)} className="rounded-lg border-zinc-200" />
                  </div>
                  <div className="space-y-2">
                    <Label>Tarif consultation ({preferredCurrency})</Label>
                    <Input type="number" min={0} step={1} value={price} onChange={(e) => setPrice(e.target.value)} className="rounded-lg border-zinc-200" />
                  </div>
                  <div className="space-y-2">
                    <Label>Durée d’un créneau (minutes)</Label>
                    <Select value={String(slotDur)} onValueChange={(v) => setSlotDur(v ?? "30")}>
                      <SelectTrigger className="rounded-lg border-zinc-200">
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
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="hours" className="mt-6 space-y-6 outline-none sm:mt-8">
              <Card className={cardClass}>
                <CardHeader className="border-b border-zinc-100 bg-zinc-50/60 pb-4">
                  <CardTitle className="text-base font-semibold text-zinc-900">Horaires d’ouverture</CardTitle>
                  <CardDescription className="text-xs text-zinc-600">
                    Format interne : plages <code className="rounded bg-zinc-200/80 px-1">HH:mm-HH:mm</code> par jour (ex.{" "}
                    <code className="rounded bg-zinc-200/80 px-1">09:00-12:00</code>), clés{" "}
                    <code className="rounded bg-zinc-200/80 px-1">mon</code> … <code className="rounded bg-zinc-200/80 px-1">sun</code>.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 pt-6">
                  <div className="space-y-4">
                    {WEEKDAY_KEYS.map((day) => (
                      <div key={day} className="rounded-xl border border-zinc-100 bg-zinc-50/30 p-4">
                        <div className="mb-3 flex items-center justify-between gap-2">
                          <span className="text-sm font-semibold text-zinc-900">{WEEKDAY_LABELS[day]}</span>
                          <Button type="button" variant="outline" size="sm" className="h-8 rounded-lg text-xs" onClick={() => addSlot(day)}>
                            + Plage
                          </Button>
                        </div>
                        {(weeklyHours[day] ?? []).length === 0 ? (
                          <p className="text-xs text-zinc-500">Fermé ou non renseigné.</p>
                        ) : (
                          <ul className="space-y-2">
                            {(weeklyHours[day] ?? []).map((slot, idx) => (
                              <li key={`${day}-${idx}`} className="flex gap-2">
                                <Input
                                  value={slot}
                                  onChange={(e) => updateSlot(day, idx, e.target.value)}
                                  placeholder="09:00-18:00"
                                  className="font-mono text-sm rounded-lg border-zinc-200"
                                />
                                <Button type="button" variant="ghost" size="sm" className="shrink-0 text-rose-600" onClick={() => removeSlot(day, idx)}>
                                  Retirer
                                </Button>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button type="button" variant="outline" size="sm" className="rounded-lg" onClick={syncJsonFromWeekly}>
                      Mettre à jour le JSON
                    </Button>
                    <Button type="button" variant="secondary" size="sm" className="rounded-lg" onClick={applyAdvancedJson}>
                      Appliquer le JSON ci-dessous
                    </Button>
                  </div>

                  <details className="rounded-xl border border-zinc-200 bg-white p-4">
                    <summary className="cursor-pointer text-sm font-medium text-zinc-800">Mode avancé — JSON brut</summary>
                    <textarea
                      className="mt-3 min-h-[140px] w-full rounded-lg border border-zinc-200 bg-zinc-50/50 px-3 py-2 font-mono text-xs outline-none focus-visible:ring-2 focus-visible:ring-cyan-600/20"
                      value={advancedJson}
                      onChange={(e) => setAdvancedJson(e.target.value)}
                    />
                  </details>
                </CardContent>
              </Card>

              <Card className={cardClass}>
                <CardHeader className="border-b border-zinc-100 bg-zinc-50/60 pb-4">
                  <CardTitle className="text-base font-semibold text-zinc-900">Import Google Calendar (.ics)</CardTitle>
                  <CardDescription className="text-xs text-zinc-600">
                    Collez un export ou choisissez un fichier. Événements récurrents <strong>WEEKLY</strong> avec{" "}
                    <strong>BYDAY</strong> (MO,TU,…) uniquement.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 pt-6">
                  <textarea
                    className="min-h-[100px] w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs outline-none focus-visible:ring-2 focus-visible:ring-cyan-600/20"
                    placeholder="Collez le contenu d’un fichier .ics…"
                    value={icsText}
                    onChange={(e) => setIcsText(e.target.value)}
                  />
                  <div className="flex flex-wrap items-center gap-3">
                    <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-zinc-700">
                      <input
                        type="file"
                        accept=".ics,text/calendar"
                        className="text-xs file:mr-2 file:rounded-md file:border-0 file:bg-zinc-900 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-white"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (!f) return;
                          void f.text().then(setIcsText);
                          e.target.value = "";
                        }}
                      />
                    </label>
                    <Button type="button" size="sm" className="rounded-lg bg-zinc-900 text-white" disabled={icsBusy} onClick={() => void handleIcs()}>
                      {icsBusy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                      Analyser & fusionner
                    </Button>
                  </div>
                  {icsMsg ? <p className="text-sm text-zinc-600">{icsMsg}</p> : null}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="sites" className="mt-6 space-y-6 outline-none sm:mt-8">
              <Card className={cardClass}>
                <CardHeader className="flex flex-col gap-4 border-b border-zinc-100 bg-zinc-50/60 pb-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-base font-semibold text-zinc-900">
                      <Building2 className="h-4 w-4 text-cyan-700" aria-hidden />
                      Lieux d’exercice (JSON cabinet)
                    </CardTitle>
                    <CardDescription className="text-xs text-zinc-600">
                      Cabinets additionnels. Pour horaires par site et tarification fine, utilisez aussi{" "}
                      <Link href="/dashboard/medecin/settings/sites" className="font-medium text-cyan-800 underline-offset-2 hover:underline">
                        Sites détaillés
                      </Link>
                      .
                    </CardDescription>
                  </div>
                  <Button type="button" variant="outline" size="sm" className="rounded-lg shrink-0" onClick={addSite}>
                    Ajouter un lieu
                  </Button>
                </CardHeader>
                <CardContent className="space-y-6 pt-6">
                  {sites.length === 0 ? (
                    <p className="text-sm text-zinc-500">Aucun lieu secondaire — l’adresse principale suffit.</p>
                  ) : (
                    sites.map((s, i) => (
                      <div key={s.id} className="space-y-4 rounded-xl border border-zinc-100 bg-zinc-50/20 p-4">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <Label className="text-base font-semibold text-zinc-900">Lieu {i + 1}</Label>
                          <div className="flex items-center gap-3">
                            <label className="flex cursor-pointer items-center gap-2 text-sm text-zinc-700">
                              <input
                                type="checkbox"
                                className="rounded border-zinc-300"
                                checked={Boolean(s.isPrimary)}
                                onChange={(e) => {
                                  const checked = e.target.checked;
                                  setSites((prev) =>
                                    prev.map((x, j) => ({
                                      ...x,
                                      isPrimary: j === i ? checked : checked ? false : x.isPrimary,
                                    })),
                                  );
                                }}
                              />
                              Principal
                            </label>
                            <Button type="button" variant="ghost" size="sm" className="text-rose-600" onClick={() => removeSite(i)}>
                              Retirer
                            </Button>
                          </div>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2">
                          <div className="space-y-1 sm:col-span-2">
                            <Label className="text-xs text-zinc-500">Nom du cabinet</Label>
                            <Input value={s.name} onChange={(e) => updateSite(i, { name: e.target.value })} className="rounded-lg border-zinc-200" />
                          </div>
                          <div className="space-y-1 sm:col-span-2">
                            <Label className="text-xs text-zinc-500">Rue</Label>
                            <Input value={s.street} onChange={(e) => updateSite(i, { street: e.target.value })} className="rounded-lg border-zinc-200" />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs text-zinc-500">Ville</Label>
                            <Input value={s.city} onChange={(e) => updateSite(i, { city: e.target.value })} className="rounded-lg border-zinc-200" />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs text-zinc-500">Code postal</Label>
                            <Input
                              value={s.postalCode}
                              onChange={(e) => updateSite(i, { postalCode: e.target.value })}
                              className="rounded-lg border-zinc-200"
                            />
                          </div>
                          <div className="space-y-1 sm:col-span-2">
                            <Label className="text-xs text-zinc-500">Tarif sur ce site ({preferredCurrency})</Label>
                            <Input
                              type="number"
                              value={s.consultationPrice ?? ""}
                              onChange={(e) => updateSite(i, { consultationPrice: e.target.value ? Number(e.target.value) : 0 })}
                              className="rounded-lg border-zinc-200"
                            />
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="calendar" className="mt-6 space-y-6 outline-none sm:mt-8">
              <Card className={cardClass}>
                <CardHeader className="border-b border-zinc-100 bg-zinc-50/60 pb-4">
                  <CardTitle className="flex items-center gap-2 text-base font-semibold text-zinc-900">
                    <CalendarClock className="h-4 w-4 text-cyan-700" aria-hidden />
                    Export & synchronisation
                  </CardTitle>
                  <CardDescription className="text-xs text-zinc-600">
                    Téléchargez vos rendez-vous OphthoCare au format standard pour Outlook, Google Agenda ou Apple Calendrier.
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-4 pt-6 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-zinc-600">Fichier <code className="rounded bg-zinc-100 px-1">.ics</code> généré côté serveur avec votre session.</p>
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-lg border-zinc-200"
                    disabled={exportBusy}
                    onClick={() => void downloadMyAppointmentsIcs()}
                  >
                    {exportBusy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" aria-hidden />}
                    Télécharger mes RDV
                  </Button>
                </CardContent>
              </Card>

              <Card className={cn(cardClass, "border-cyan-200/60 bg-gradient-to-b from-cyan-50/40 to-white ring-1 ring-cyan-100/50")}>
                <CardHeader className="border-b border-cyan-100/80 pb-4">
                  <CardTitle className="flex items-center gap-2 text-base font-semibold text-cyan-950">
                    <Sparkles className="h-4 w-4 text-cyan-700" aria-hidden />
                    Synchronisation cloud (Google / Microsoft)
                  </CardTitle>
                  <CardDescription className="text-xs text-cyan-900/80">
                    État réel du connecteur : tant que OAuth n’est pas configuré sur le serveur, l’API renvoie un message explicite.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 pt-6">
                  <Button type="button" variant="outline" size="sm" className="rounded-lg border-cyan-200 bg-white" onClick={() => void probeCalendarSync()}>
                    Vérifier la configuration
                  </Button>
                  {calendarProbe ? <p className="text-sm text-cyan-950/90">{calendarProbe}</p> : null}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end border-t border-slate-100 pt-6">
            <Button type="button" className={DOCTOR_PRIMARY_BTN} disabled={saving} onClick={() => void handleSave()}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
                  Enregistrement…
                </>
              ) : (
                "Enregistrer"
              )}
            </Button>
          </div>
      </DoctorPageShell>
    </DashboardLayout>
  );
}
