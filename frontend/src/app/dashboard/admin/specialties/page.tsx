'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Loader2, Plus, Save } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { specialtiesApi, type SpecialtyAdminRow, type SpecialtyCatalogRow } from '@/lib/api';
import type { SpecialtyField } from '@/lib/medical/specialty-field.types';
import { useRequireAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

function parseFieldsJson(raw: string): SpecialtyField[] {
  const parsed = JSON.parse(raw) as unknown;
  if (!Array.isArray(parsed)) throw new Error('Tableau JSON attendu');
  return parsed as SpecialtyField[];
}

export default function AdminSpecialtiesPage() {
  useRequireAuth();
  const [rows, setRows] = useState<SpecialtyCatalogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [banner, setBanner] = useState<string | null>(null);

  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('stethoscope');
  const [examTypes, setExamTypes] = useState('Consultation, Suivi');
  const [fieldsJson, setFieldsJson] = useState('[]');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await specialtiesApi.getAll();
      setRows(list);
    } catch {
      setError('Impossible de charger les spécialités (droits admin requis).');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const selectRow = (r: SpecialtyAdminRow | null) => {
    if (!r) {
      setSelectedId(null);
      setCode('');
      setName('');
      setDescription('');
      setIcon('stethoscope');
      setExamTypes('Consultation, Suivi');
      setFieldsJson('[]');
      return;
    }
    setSelectedId(r.id);
    setCode(r.code);
    setName(r.name);
    setDescription(r.description ?? '');
    setIcon(r.icon ?? 'stethoscope');
    setExamTypes((r.examTypes ?? []).join(', '));
    setFieldsJson(JSON.stringify(r.specificFields ?? [], null, 2));
  };

  const handleCreate = async () => {
    setSaving(true);
    setBanner(null);
    try {
      const fields = parseFieldsJson(fieldsJson);
      await specialtiesApi.createAdmin({
        code: code.trim(),
        name: name.trim(),
        description: description.trim() || undefined,
        icon: icon.trim() || undefined,
        examTypes: examTypes.split(',').map((x) => x.trim()).filter(Boolean),
        specificFields: fields,
      });
      setBanner('Spécialité créée.');
      await load();
      selectRow(null);
    } catch {
      setBanner('Création échouée — vérifiez le code unique et le JSON des champs.');
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    if (!selectedId) return;
    setSaving(true);
    setBanner(null);
    try {
      const fields = parseFieldsJson(fieldsJson);
      await specialtiesApi.patchAdmin(selectedId, {
        name: name.trim(),
        description: description.trim() || undefined,
        icon: icon.trim() || undefined,
        examTypes: examTypes.split(',').map((x) => x.trim()).filter(Boolean),
        specificFields: fields,
      });
      setBanner('Spécialité mise à jour.');
      await load();
    } catch {
      setBanner('Enregistrement échoué.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout role="admin">
      <div className="mx-auto max-w-5xl space-y-6 pb-12">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">Spécialités (templates)</h1>
            <p className="text-sm text-slate-500">CRUD admin — champs dynamiques `SpecialtyField[]`</p>
          </div>
          <Button variant="outline" className="rounded-lg" asChild>
            <Link href="/dashboard/admin">Retour admin</Link>
          </Button>
        </div>

        {error ? <p className="text-sm text-red-800">{error}</p> : null}
        {banner ? <p className="text-sm text-emerald-800">{banner}</p> : null}

        <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Liste</CardTitle>
            </CardHeader>
            <CardContent className="max-h-[480px] space-y-1 overflow-y-auto">
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
              ) : (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mb-2 w-full justify-start gap-2"
                    onClick={() => selectRow(null)}
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Nouvelle
                  </Button>
                  {rows.map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      className={`w-full rounded-lg px-2 py-2 text-left text-sm ${
                        selectedId === r.id ? 'bg-slate-900 text-white' : 'hover:bg-slate-100'
                      }`}
                      onClick={() => selectRow(r)}
                    >
                      {r.name}
                      <span className="block text-xs opacity-70">{r.code}</span>
                    </button>
                  ))}
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">{selectedId ? 'Modifier' : 'Créer une spécialité'}</CardTitle>
              <CardDescription>JSON `specificFields` : tableau de {`{ key, label, type, ... }`}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label>Code {selectedId ? '(lecture seule)' : ''}</Label>
                  <Input value={code} onChange={(e) => setCode(e.target.value)} disabled={!!selectedId} />
                </div>
                <div className="space-y-1">
                  <Label>Nom</Label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <Label>Description</Label>
                  <Input value={description} onChange={(e) => setDescription(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label>Icône</Label>
                  <Input value={icon} onChange={(e) => setIcon(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label>Types d&apos;examen (virgules)</Label>
                  <Input value={examTypes} onChange={(e) => setExamTypes(e.target.value)} />
                </div>
              </div>
              <div className="space-y-1">
                <Label>specificFields (JSON)</Label>
                <textarea
                  className="min-h-[280px] w-full rounded-lg border border-input bg-white px-3 py-2 font-mono text-xs"
                  value={fieldsJson}
                  onChange={(e) => setFieldsJson(e.target.value)}
                />
              </div>
              <Button
                type="button"
                disabled={saving || !name.trim() || (!selectedId && !code.trim())}
                className="gap-2"
                onClick={() => void (selectedId ? handleSave() : handleCreate())}
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {selectedId ? 'Enregistrer' : 'Créer'}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
