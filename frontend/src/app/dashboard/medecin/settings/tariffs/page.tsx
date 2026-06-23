"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
import { useAuth, useRequireAuth } from "@/hooks/use-auth";
import { doctorsApi } from "@/lib/api";
import type { DoctorSiteDetail, DoctorTariffListRow } from "@/types/doctor";

export default function DoctorSettingsTariffsPage() {
  useRequireAuth();
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const isDoctor = user?.role === "doctor";

  const [sites, setSites] = useState<DoctorSiteDetail[]>([]);
  const [siteId, setSiteId] = useState<string>("");
  const [tariffs, setTariffs] = useState<DoctorTariffListRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [actType, setActType] = useState("consultation");
  const [label, setLabel] = useState("Consultation");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("MAD");
  const [duration, setDuration] = useState("");

  const loadSites = useCallback(async () => {
    try {
      const s = await doctorsApi.getMySites();
      setSites(s);
      setSiteId((prev) => prev || s[0]?.id || "");
    } catch {
      setErr("Impossible de charger les sites.");
    }
  }, []);

  const loadTariffs = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const t = await doctorsApi.getMyTariffs(siteId || undefined);
      setTariffs(t);
    } catch {
      setErr("Impossible de charger les tarifs.");
    } finally {
      setLoading(false);
    }
  }, [siteId]);

  useEffect(() => {
    if (!authLoading && user && !isDoctor) {
      router.replace("/unauthorized");
    }
  }, [authLoading, user, isDoctor, router]);

  useEffect(() => {
    if (isDoctor) void loadSites();
  }, [isDoctor, loadSites]);

  useEffect(() => {
    if (isDoctor) void loadTariffs();
  }, [isDoctor, siteId, loadTariffs]);

  const addTariff = async () => {
    const sid = siteId || sites[0]?.id;
    if (!sid || !label.trim() || amount === "") return;
    try {
      await doctorsApi.createMyTariff({
        doctorSiteId: sid,
        actType: actType.trim() || "other",
        label: label.trim(),
        amount: parseFloat(amount.replace(",", ".")),
        currency: currency || "MAD",
        durationMinutes: duration ? parseInt(duration, 10) : undefined,
      });
      setAmount("");
      await loadTariffs();
    } catch {
      setErr("Création du tarif impossible.");
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

      <div className="flex flex-col sm:flex-row gap-4 sm:items-end">
        <div className="space-y-2 flex-1 max-w-xs">
          <Label>Site</Label>
          <Select value={siteId} onValueChange={(v) => v && setSiteId(v)}>
            <SelectTrigger>
              <SelectValue placeholder="Choisir un site" />
            </SelectTrigger>
            <SelectContent>
              {sites.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card className="border-slate-100 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Nouveau tarif</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-1">
            <Label>Type d&apos;acte (code)</Label>
            <Input value={actType} onChange={(e) => setActType(e.target.value)} />
          </div>
          <div className="space-y-1 sm:col-span-2">
            <Label>Libellé</Label>
            <Input value={label} onChange={(e) => setLabel(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>Montant</Label>
            <Input value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="decimal" />
          </div>
          <div className="space-y-1">
            <Label>Devise</Label>
            <Input value={currency} onChange={(e) => setCurrency(e.target.value)} maxLength={8} />
          </div>
          <div className="space-y-1">
            <Label>Durée (min, optionnel)</Label>
            <Input value={duration} onChange={(e) => setDuration(e.target.value)} inputMode="numeric" />
          </div>
          <div className="sm:col-span-2 lg:col-span-3">
            <Button type="button" onClick={() => void addTariff()}>
              Ajouter le tarif
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-slate-100 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Liste des tarifs</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-slate-500">Chargement…</p>
          ) : tariffs.length === 0 ? (
            <p className="text-sm text-slate-500">Aucun tarif.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-500 border-b">
                    <th className="py-2 pr-4">Site</th>
                    <th className="py-2 pr-4">Acte</th>
                    <th className="py-2 pr-4">Libellé</th>
                    <th className="py-2 pr-4">Montant</th>
                    <th className="py-2">Durée</th>
                  </tr>
                </thead>
                <tbody>
                  {tariffs.map((t) => (
                    <tr key={t.id} className="border-b border-slate-50">
                      <td className="py-2 pr-4">{t.siteName}</td>
                      <td className="py-2 pr-4">{t.actType}</td>
                      <td className="py-2 pr-4">{t.label}</td>
                      <td className="py-2 pr-4">
                        {t.amount} {t.currency}
                      </td>
                      <td className="py-2">{t.durationMinutes ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
