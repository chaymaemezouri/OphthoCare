"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useAuth, useRequireAuth } from "@/hooks/use-auth";
import { doctorsApi } from "@/lib/api";
import type { DoctorSiteDetail, SiteWorkingHourRow } from "@/types/doctor";
import { Badge } from "@/components/ui/badge";
import { Trash2, Pencil, Plus } from "lucide-react";

const DAY_FR = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];

export default function DoctorSettingsSitesPage() {
  useRequireAuth();
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const isDoctor = user?.role === "doctor";

  const [sites, setSites] = useState<DoctorSiteDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newCity, setNewCity] = useState("");
  const [newStreet, setNewStreet] = useState("");

  const [hoursSite, setHoursSite] = useState<DoctorSiteDetail | null>(null);
  const [hoursDraft, setHoursDraft] = useState<SiteWorkingHourRow[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const data = await doctorsApi.getMySites();
      setSites(data);
    } catch {
      setErr("Impossible de charger les sites.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && user && !isDoctor) {
      router.replace("/unauthorized");
    }
  }, [authLoading, user, isDoctor, router]);

  useEffect(() => {
    if (isDoctor) void load();
  }, [isDoctor, load]);

  const openHours = (s: DoctorSiteDetail) => {
    setHoursSite(s);
    setHoursDraft([...s.workingHours]);
  };

  const addHourRow = () => {
    setHoursDraft((prev) => [
      ...prev,
      {
        id: `tmp-${Date.now()}`,
        dayOfWeek: 1,
        startTime: "09:00",
        endTime: "12:00",
        isActive: true,
      },
    ]);
  };

  const updateHourRow = (idx: number, patch: Partial<SiteWorkingHourRow>) => {
    setHoursDraft((prev) => {
      const n = [...prev];
      n[idx] = { ...n[idx], ...patch };
      return n;
    });
  };

  const removeHourRow = (idx: number) => {
    setHoursDraft((prev) => prev.filter((_, i) => i !== idx));
  };

  const saveHours = async () => {
    if (!hoursSite) return;
    try {
      const payload = hoursDraft.map(({ dayOfWeek, startTime, endTime, isActive }) => ({
        dayOfWeek,
        startTime,
        endTime,
        isActive,
      }));
      await doctorsApi.patchMySiteWorkingHours(hoursSite.id, payload);
      setHoursSite(null);
      await load();
    } catch {
      setErr("Enregistrement des horaires impossible.");
    }
  };

  const createSite = async () => {
    if (!newName.trim() || !newCity.trim()) return;
    try {
      await doctorsApi.createMySite({
        name: newName.trim(),
        city: newCity.trim(),
        street: newStreet.trim() || newCity.trim(),
      });
      setAddOpen(false);
      setNewName("");
      setNewCity("");
      setNewStreet("");
      await load();
    } catch {
      setErr("Création du site impossible.");
    }
  };

  const delSite = async (id: string) => {
    if (!confirm("Supprimer ce site ?")) return;
    try {
      await doctorsApi.deleteMySite(id);
      await load();
    } catch (e: unknown) {
      const m = e && typeof e === "object" && "response" in e ? (e as { response?: { data?: { message?: string } } }).response?.data?.message : null;
      setErr(typeof m === "string" ? m : "Suppression impossible.");
    }
  };

  if (authLoading || !user) {
    return <div className="p-8 text-center text-slate-500 text-sm">Chargement…</div>;
  }
  if (!isDoctor) return null;

  return (
    <div className="space-y-6">
      {err && (
        <p className="text-sm text-rose-600 bg-rose-50 border border-rose-100 rounded-lg px-3 py-2">{err}</p>
      )}
      <div className="flex justify-between items-center">
        <p className="text-sm text-slate-500">Lieux d&apos;exercice et horaires par site (réservation).</p>
        <Button size="sm" onClick={() => setAddOpen(true)} className="gap-1">
          <Plus className="h-4 w-4" />
          Ajouter un site
        </Button>
      </div>

      {loading ? (
        <p className="text-sm text-slate-500">Chargement…</p>
      ) : (
        <div className="space-y-4">
          {sites.map((s) => (
            <Card key={s.id} className="border-slate-100 shadow-sm">
              <CardHeader className="flex flex-row items-start justify-between gap-4 pb-2">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    {s.name}
                    {s.isPrimary && (
                      <Badge variant="secondary" className="text-[10px]">
                        Principal
                      </Badge>
                    )}
                  </CardTitle>
                  <p className="text-xs text-slate-500 mt-1">
                    {s.street}, {s.city} {s.postalCode ?? ""}
                  </p>
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button variant="outline" size="icon" onClick={() => openHours(s)} title="Horaires">
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="text-rose-600" onClick={() => void delSite(s.id)} title="Supprimer">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="text-xs text-slate-600">
                {s.workingHours.length === 0 ? (
                  <span>Aucun horaire défini — repli sur le JSON profil ou défaut.</span>
                ) : (
                  <ul className="space-y-1">
                    {s.workingHours.map((h) => (
                      <li key={h.id}>
                        {DAY_FR[h.dayOfWeek] ?? h.dayOfWeek}: {h.startTime}–{h.endTime}
                        {!h.isActive ? " (inactif)" : ""}
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nouveau site</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1">
              <Label>Nom du cabinet / site</Label>
              <Input value={newName} onChange={(e) => setNewName(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Ville</Label>
              <Input value={newCity} onChange={(e) => setNewCity(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Adresse (rue)</Label>
              <Input value={newStreet} onChange={(e) => setNewStreet(e.target.value)} placeholder="Optionnel" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>
              Annuler
            </Button>
            <Button onClick={() => void createSite()}>Créer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(hoursSite)} onOpenChange={(o) => !o && setHoursSite(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Horaires — {hoursSite?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            {hoursDraft.map((row, idx) => (
              <div key={row.id} className="flex flex-wrap items-end gap-2 border-b border-slate-50 pb-2">
                <div className="w-24">
                  <Label className="text-xs">Jour</Label>
                  <select
                    className="w-full h-9 rounded-md border border-slate-200 text-sm px-2"
                    value={row.dayOfWeek}
                    onChange={(e) => updateHourRow(idx, { dayOfWeek: parseInt(e.target.value, 10) })}
                  >
                    {DAY_FR.map((label, d) => (
                      <option key={d} value={d}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="w-24">
                  <Label className="text-xs">Début</Label>
                  <Input value={row.startTime} onChange={(e) => updateHourRow(idx, { startTime: e.target.value })} />
                </div>
                <div className="w-24">
                  <Label className="text-xs">Fin</Label>
                  <Input value={row.endTime} onChange={(e) => updateHourRow(idx, { endTime: e.target.value })} />
                </div>
                <Button type="button" variant="ghost" size="sm" onClick={() => removeHourRow(idx)}>
                  Retirer
                </Button>
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={addHourRow}>
              + Plage
            </Button>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setHoursSite(null)}>
              Fermer
            </Button>
            <Button onClick={() => void saveHours()}>Enregistrer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
