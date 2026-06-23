'use client';

import { useMemo, useState } from 'react';
import { format, parseISO } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export type ConsultationSide = {
  id: string;
  createdAt: string;
  closedAt?: string | null;
  structuredData: Record<string, unknown>;
  observations?: string | null;
  diagnosis?: string | null;
  plan?: string | null;
};

export type ConsultationComparisonProps = {
  left: ConsultationSide;
  right: ConsultationSide;
  /** Clés à afficher (ex. champs template). */
  fieldKeys: string[];
  className?: string;
};

function fmt(d?: string | null) {
  if (!d) return '—';
  try {
    return format(parseISO(d), 'dd/MM/yyyy HH:mm');
  } catch {
    return d;
  }
}

function displayValue(v: unknown): string {
  if (v == null || v === '') return '—';
  if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') return String(v);
  if (Array.isArray(v)) return v.join(', ');
  if (typeof v === 'object') return JSON.stringify(v, null, 0);
  return String(v);
}

export function ConsultationComparison({
  left,
  right,
  fieldKeys,
  className,
}: ConsultationComparisonProps) {
  const [diffOnly, setDiffOnly] = useState(true);

  const rows = useMemo(() => {
    const keys = [
      ...new Set([
        ...fieldKeys,
        'observations',
        'diagnosis',
        'plan',
      ]),
    ];
    return keys.map((key) => {
      const lv =
        key === 'observations' || key === 'diagnosis' || key === 'plan'
          ? (left as Record<string, unknown>)[key]
          : left.structuredData[key];
      const rv =
        key === 'observations' || key === 'diagnosis' || key === 'plan'
          ? (right as Record<string, unknown>)[key]
          : right.structuredData[key];
      const changed = JSON.stringify(lv) !== JSON.stringify(rv);
      return { key, lv, rv, changed };
    });
  }, [left, right, fieldKeys]);

  const visible = useMemo(
    () => (diffOnly ? rows.filter((r) => r.changed) : rows),
    [rows, diffOnly],
  );

  return (
    <Card className={cn(className)}>
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
        <CardTitle className="text-lg">Comparaison consultations</CardTitle>
        <div className="flex items-center gap-2">
          <input
            id="diffonly"
            type="checkbox"
            className="size-4 accent-primary"
            checked={diffOnly}
            onChange={(e) => setDiffOnly(e.target.checked)}
          />
          <Label htmlFor="diffonly" className="text-sm font-normal">
            Voir différences uniquement
          </Label>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3 border-b pb-2 text-sm font-medium">
          <div className="flex flex-col gap-1">
            <Badge variant="secondary">Avant</Badge>
            <span className="text-muted-foreground text-xs">{fmt(left.closedAt ?? left.createdAt)}</span>
          </div>
          <div className="flex flex-col gap-1">
            <Badge variant="secondary">Après</Badge>
            <span className="text-muted-foreground text-xs">{fmt(right.closedAt ?? right.createdAt)}</span>
          </div>
        </div>
        <div className="mt-3 max-h-[480px] space-y-2 overflow-y-auto">
          {visible.length === 0 ? (
            <p className="text-muted-foreground text-sm">Aucune différence sur ces champs.</p>
          ) : (
            visible.map((r) => (
              <div key={r.key} className="grid grid-cols-2 gap-2 text-sm">
                <div
                  className={cn(
                    'rounded-md border p-2',
                    r.changed && 'bg-yellow-500/15 border-yellow-600/40',
                  )}
                >
                  <div className="text-muted-foreground text-xs">{r.key}</div>
                  <div className="whitespace-pre-wrap break-words">
                    {displayValue(r.lv)}
                  </div>
                </div>
                <div
                  className={cn(
                    'rounded-md border p-2',
                    r.changed && 'bg-yellow-500/15 border-yellow-600/40',
                  )}
                >
                  <div className="text-muted-foreground text-xs">{r.key}</div>
                  <div className="whitespace-pre-wrap break-words">
                    {displayValue(r.rv)}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
