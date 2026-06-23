'use client';

import { useCallback, useEffect, useState } from 'react';
import { Download, ExternalLink, RefreshCw } from 'lucide-react';
import { documentsApi, type DocumentListItem } from '@/lib/api/documents';
import apiClient from '@/lib/api/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { formatShortDate } from '@/lib/utils/date';

export function DocumentsList({ patientId }: { patientId?: string }) {
  const [items, setItems] = useState<DocumentListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<string>('all');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const type = tab === 'all' ? undefined : tab;
      const data = await documentsApi.listDocuments({
        patientId,
        type,
        from: from || undefined,
        to: to || undefined,
      });
      setItems(data.items);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [patientId, tab, from, to]);

  useEffect(() => {
    void load();
  }, [load]);

  const downloadZip = async () => {
    const res = await apiClient.get('/documents/export-zip', {
      params: patientId ? { patientId } : {},
      responseType: 'blob',
    });
    const url = URL.createObjectURL(res.data as Blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `documents-${Date.now()}.zip`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filtered = items.filter((i) => {
    if (tab === 'all') return true;
    if (tab === 'prescription') return i.kind === 'prescription';
    if (tab === 'reports') return i.kind === 'report';
    if (tab === 'receipts') return i.kind === 'receipt';
    return true;
  });

  return (
    <Card className="border-slate-200/90">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Documents</CardTitle>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="rounded-lg" onClick={() => void load()}>
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" className="rounded-lg" onClick={() => void downloadZip()}>
            <Download className="mr-1 h-4 w-4" />
            ZIP
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="all">Tous</TabsTrigger>
            <TabsTrigger value="prescription">Ordonnances</TabsTrigger>
            <TabsTrigger value="report">Comptes rendus</TabsTrigger>
            <TabsTrigger value="receipt">Reçus</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="grid gap-2 sm:grid-cols-2">
          <div className="space-y-1">
            <Label className="text-xs">Du</Label>
            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="rounded-lg h-9" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Au</Label>
            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="rounded-lg h-9" />
          </div>
        </div>
        {loading ? (
          <p className="text-sm text-slate-500">Chargement…</p>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-slate-500">Aucun document.</p>
        ) : (
          <ul className="space-y-2">
            {filtered.map((row) => (
              <li
                key={`${row.kind}-${row.id}`}
                className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50/60 px-3 py-2 text-sm"
              >
                <div>
                  <p className="font-medium text-slate-900">{row.title}</p>
                  <p className="text-xs text-slate-500">{formatShortDate(row.createdAt)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{row.pdfStatus}</Badge>
                  {row.pdfUrl ? (
                    <Button size="sm" variant="ghost" asChild>
                      <a href={row.pdfUrl} target="_blank" rel="noreferrer">
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </Button>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
