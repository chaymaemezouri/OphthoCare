"use client";

import { useCallback, useEffect, useState } from "react";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { Copy, Loader2, Plus, Trash2, UserCog, Users } from "lucide-react";
import { toast } from "sonner";
import { doctorsApi } from "@/lib/api";
import { APP_CONFIG } from "@/lib/constants/app-config";
import type { CreateDoctorStaffResponse, DoctorStaffMember, DoctorStaffRole } from "@/types/doctor-staff";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

function randomPassword(len = 12) {
  const chars = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789!@#";
  let s = "";
  for (let i = 0; i < len; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

function roleLabel(role: DoctorStaffRole) {
  return role === "secretary" ? "Secrétaire" : "Stagiaire";
}

function displayName(m: DoctorStaffMember) {
  const n = [m.firstName, m.lastName].filter(Boolean).join(" ").trim();
  return n || m.email;
}

export function DoctorTeamSection() {
  const [staff, setStaff] = useState<DoctorStaffMember[]>([]);
  const [spaceName, setSpaceName] = useState("");
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [createdCreds, setCreatedCreds] = useState<CreateDoctorStaffResponse["credentials"] | null>(null);
  const [saving, setSaving] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<DoctorStaffRole>("secretary");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await doctorsApi.listMyStaff();
      setStaff(res.staff);
      setSpaceName(res.doctorSpaceName);
    } catch {
      toast.error("Impossible de charger l'équipe");
      setStaff([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const openCreate = (r: DoctorStaffRole) => {
    setRole(r);
    setEmail("");
    setPassword(randomPassword());
    setFirstName("");
    setLastName("");
    setPhone("");
    setCreatedCreds(null);
    setCreateOpen(true);
  };

  const handleCreate = async () => {
    if (!email.trim() || password.length < 8) {
      toast.error("E-mail et mot de passe (8 car. min.) requis");
      return;
    }
    setSaving(true);
    try {
      const res = await doctorsApi.createStaffMember({
        email: email.trim(),
        password,
        firstName: firstName.trim() || undefined,
        lastName: lastName.trim() || undefined,
        phoneNumber: phone.trim() || undefined,
        role,
      });
      setCreatedCreds(res.credentials);
      toast.success("Compte créé");
      await load();
    } catch (e: unknown) {
      const msg =
        e && typeof e === "object" && "response" in e
          ? (e as { response?: { data?: { message?: string } } }).response?.data?.message
          : null;
      toast.error(typeof msg === "string" ? msg : "Création impossible");
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (m: DoctorStaffMember) => {
    try {
      await doctorsApi.updateStaffMember(m.userId, { isActive: !m.isActive });
      toast.success(m.isActive ? "Accès désactivé" : "Accès réactivé");
      await load();
    } catch {
      toast.error("Échec de la mise à jour");
    }
  };

  const resetPassword = async (m: DoctorStaffMember) => {
    const pwd = randomPassword();
    try {
      await doctorsApi.updateStaffMember(m.userId, { password: pwd });
      toast.success("Mot de passe réinitialisé", {
        description: `Nouveau mot de passe : ${pwd}`,
        duration: 15000,
      });
    } catch {
      toast.error("Échec réinitialisation");
    }
  };

  const removeMember = async (m: DoctorStaffMember) => {
    if (!window.confirm(`Retirer ${displayName(m)} de votre cabinet ?`)) return;
    try {
      await doctorsApi.removeStaffMember(m.userId);
      toast.success("Collaborateur retiré");
      await load();
    } catch {
      toast.error("Suppression impossible");
    }
  };

  const copyCreds = () => {
    if (!createdCreds) return;
    const text = `Connexion ${APP_CONFIG.APP_NAME}\nE-mail : ${createdCreds.email}\nMot de passe : ${createdCreds.temporaryPassword}\nURL : ${typeof window !== "undefined" ? window.location.origin : ""}/login`;
    void navigator.clipboard.writeText(text);
    toast.success("Identifiants copiés");
  };

  return (
    <Card id="equipe" className="border-slate-100 shadow-sm scroll-mt-24">
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="h-4 w-4 text-slate-500" />
            Équipe du cabinet
          </CardTitle>
          <p className="mt-1 text-sm text-slate-500">
            Créez les comptes de votre secrétaire et de vos stagiaires pour accéder à leur tableau de bord (
            {spaceName || "cabinet"}).
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" className="rounded-lg" onClick={() => openCreate("secretary")}>
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Secrétaire
          </Button>
          <Button type="button" size="sm" className="rounded-lg bg-slate-900 text-white" onClick={() => openCreate("trainee")}>
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Stagiaire
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
          </div>
        ) : staff.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-500">Aucun collaborateur pour l&apos;instant.</p>
        ) : (
          <ul className="divide-y divide-slate-100 rounded-lg border border-slate-100">
            {staff.map((m) => (
              <li key={m.userId} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-900">{displayName(m)}</p>
                  <p className="text-xs text-slate-500">{m.email}</p>
                  <p className="mt-1 text-[10px] text-slate-400">
                    {roleLabel(m.role)} · depuis {format(parseISO(m.createdAt), "d MMM yyyy", { locale: fr })}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge
                    className={cn(
                      "border-none text-[10px] font-bold uppercase",
                      m.isActive ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500",
                    )}
                  >
                    {m.isActive ? "Actif" : "Désactivé"}
                  </Badge>
                  <a
                    href={m.dashboardPath}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex h-8 items-center rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Voir le dashboard
                  </a>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    title={m.isActive ? "Désactiver" : "Réactiver"}
                    onClick={() => void toggleActive(m)}
                  >
                    <UserCog className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 text-xs"
                    onClick={() => void resetPassword(m)}
                  >
                    MDP
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-rose-600"
                    onClick={() => void removeMember(m)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto rounded-xl sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Créer un compte {roleLabel(role)}</DialogTitle>
          </DialogHeader>

          {createdCreds ? (
            <div className="space-y-3 rounded-lg border border-emerald-200 bg-emerald-50/50 p-4 text-sm">
              <p className="font-semibold text-emerald-900">Compte créé — communiquez ces identifiants :</p>
              <p>
                <span className="text-slate-500">E-mail :</span> {createdCreds.email}
              </p>
              <p>
                <span className="text-slate-500">Mot de passe :</span>{" "}
                <code className="rounded bg-white px-1">{createdCreds.temporaryPassword}</code>
              </p>
              <p className="text-xs text-slate-600">{createdCreds.message}</p>
              <Button type="button" variant="outline" size="sm" className="rounded-lg" onClick={copyCreds}>
                <Copy className="mr-2 h-3.5 w-3.5" />
                Copier les identifiants
              </Button>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label>Rôle</Label>
                <Select value={role} onValueChange={(v) => v && setRole(v as DoctorStaffRole)}>
                  <SelectTrigger className="rounded-lg">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="secretary">Secrétaire</SelectItem>
                    <SelectItem value="trainee">Stagiaire</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>E-mail de connexion</Label>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="rounded-lg" />
              </div>
              <div className="space-y-2">
                <Label>Prénom</Label>
                <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} className="rounded-lg" />
              </div>
              <div className="space-y-2">
                <Label>Nom</Label>
                <Input value={lastName} onChange={(e) => setLastName(e.target.value)} className="rounded-lg" />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Téléphone</Label>
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} className="rounded-lg" />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Mot de passe provisoire</Label>
                <div className="flex gap-2">
                  <Input
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="rounded-lg font-mono text-sm"
                  />
                  <Button type="button" variant="outline" className="shrink-0 rounded-lg" onClick={() => setPassword(randomPassword())}>
                    Générer
                  </Button>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            {createdCreds ? (
              <Button type="button" onClick={() => setCreateOpen(false)}>
                Fermer
              </Button>
            ) : (
              <>
                <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
                  Annuler
                </Button>
                <Button type="button" disabled={saving} onClick={() => void handleCreate()}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Créer le compte"}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
