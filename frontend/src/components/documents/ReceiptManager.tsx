'use client';

import { useCallback, useEffect, useState } from 'react';
import { Loader2, Plus } from 'lucide-react';
import { documentsApi, type PaymentReceiptDoc } from '@/lib/api/documents';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { formatShortDate } from '@/lib/utils/date';

const STATUSES = ['PENDING', 'PAID', 'PARTIAL', 'CANCELLED'] as const;
const METHODS = ['CASH', 'CARD', 'INSURANCE', 'WIRE'] as const;

export function ReceiptManager({
  patientId,
  patientName,
}: {
  patientId?: string;
  patientName?: string;
}) {
  const [rows, setRows] = useState<PaymentReceiptDoc[]>([]);
  const [totals, setTotals] = useState<{ billed: number; paid: number; pending: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [actLabel, setActLabel] = useState('Consultation');
  const [actType, setActType] = useState('consultation');
  const [amount, setAmount] = useState('300');
  const [currency, setCurrency] = useState('MAD');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [t, list] = await Promise.all([
        documentsApi.receiptDayTotals(),
        patientId ? documentsApi.listReceiptsPatient(patientId) : Promise.resolve([]),
      ]);
      setTotals(t);
      setRows(list);
    } catch {
      setTotals(null);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  useEffect(() => {
    void load();
  }, [load]);

  const createQuick = async () => {
    if (!patientId) return;
    setSaving(true);
    try {
      await documentsApi.createReceipt({
        patientId,
        actType,
        actLabel,
        amount: Number(amount) || 0,
        currency,
        status: 'PENDING',
      });
      await load();
    } finally {
      setSaving(false);
    }
  };

  const setStatus = async (id: string, status: string) => {
    await documentsApi.patchReceipt(id, { status });
    await load();
  };

  return (
    <div className="space-y-4">
      {totals ? (
        <div className="grid gap-3 sm:grid-cols-3">
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-slate-500">Facturé (jour)</p>
              <p className="text-lg font-bold">{totals.billed.toLocaleString('fr-FR')} MAD</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-slate-500">Payé</p>
              <p className="text-lg font-bold text-emerald-700">{totals.paid.toLocaleString('fr-FR')} MAD</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-slate-500">En attente</p>
              <p className="text-lg font-bold text-amber-700">{totals.pending.toLocaleString('fr-FR')} MAD</p>
            </CardContent>
          </Card>
        </div>
      ) : null}

      {patientId ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Reçu rapide</CardTitle>
            <CardDescription>{patientName ?? 'Patient sélectionné'}</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label>Libellé acte</Label>
              <Input value={actLabel} onChange={(e) => setActLabel(e.target.value)} className="rounded-lg" />
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <Input value={actType} onChange={(e) => setActType(e.target.value)} className="rounded-lg" />
            </div>
            <div className="space-y-2">
              <Label>Montant</Label>
              <Input value={amount} onChange={(e) => setAmount(e.target.value)} className="rounded-lg" />
            </div>
            <Button className="rounded-lg sm:col-span-2" disabled={saving} onClick={() => void createQuick()}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
              Créer reçu + PDF
            </Button>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Reçus récents</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-slate-500">Chargement…</p>
          ) : rows.length === 0 ? (
            <p className="text-sm text-slate-500">Aucun reçu.</p>
          ) : (
            <ul className="space-y-2">
              {rows.map((r) => (
                <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm">
                  <div>
                    <p className="font-medium">{r.sequentialNumber} — {r.actLabel}</p>
                    <p className="text-xs text-slate-500">
                      {formatShortDate(r.createdAt)} — {r.amount} {r.currency}
                    </p>
                  </div>
                  <Select value={r.status} onValueChange={(v) => v && void setStatus(r.id, v)}>
                    <SelectTrigger className="h-8 w-[130px] rounded-lg">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUSES.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {r.pdfUrl ? (
                    <a
                      href={r.pdfUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs font-semibold text-slate-700 underline"
                    >
                      PDF
                    </a>
                  ) : (
                    <Badge variant="secondary">{r.pdfStatus}</Badge>
                  )}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
