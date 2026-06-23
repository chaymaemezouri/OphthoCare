'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import type { SpecialtyField } from '@/lib/medical/specialty-field.types';
import { buildSpecialtyZodSchema } from '@/lib/medical/build-specialty-zod';

export type SpecialtyFormRendererProps = {
  fields: SpecialtyField[];
  defaultValues?: Record<string, unknown>;
  /** Données questionnaire pré-consultation (réponses par clé). */
  preConsultationForm?: { responses?: Record<string, unknown> } | null;
  onSubmit: (data: Record<string, unknown>) => void | Promise<void>;
  submitLabel?: string;
  className?: string;
  /** Affichage seul (ex. RDV passé) : pas de soumission. */
  readOnly?: boolean;
};

function mergeDefaults(
  fields: SpecialtyField[],
  defaultValues?: Record<string, unknown>,
  pre?: Record<string, unknown> | undefined,
): Record<string, unknown> {
  const base: Record<string, unknown> = {};
  for (const f of fields) {
    if (defaultValues && f.key in defaultValues) {
      base[f.key] = defaultValues[f.key] as unknown;
    } else if (pre && f.key in pre) {
      base[f.key] = pre[f.key] as unknown;
    } else if (f.type === 'boolean') {
      base[f.key] = false;
    } else if (f.type === 'multiselect') {
      base[f.key] = [];
    } else if (f.type === 'range') {
      base[f.key] = { min: f.min ?? 0, max: f.max ?? 0 };
    } else {
      base[f.key] = '';
    }
  }
  return base;
}

export function SpecialtyFormRenderer({
  fields,
  defaultValues,
  preConsultationForm,
  onSubmit,
  submitLabel = 'Enregistrer',
  className,
  readOnly = false,
}: SpecialtyFormRendererProps) {
  const initial = useMemo(
    () =>
      mergeDefaults(
        fields,
        defaultValues,
        preConsultationForm?.responses as Record<string, unknown> | undefined,
      ),
    [fields, defaultValues, preConsultationForm],
  );

  const [values, setValues] = useState<Record<string, unknown>>(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, setPending] = useState(false);

  useEffect(() => {
    setValues(mergeDefaults(fields, defaultValues, preConsultationForm?.responses as Record<string, unknown> | undefined));
  }, [fields, defaultValues, preConsultationForm]);

  const schema = useMemo(() => buildSpecialtyZodSchema(fields), [fields]);

  const hasImc = fields.some((f) => f.key === 'imc');
  useEffect(() => {
    if (!hasImc) return;
    const p = Number(values.poids);
    const t = Number(values.taille);
    if (!Number.isFinite(p) || !Number.isFinite(t) || t <= 0) return;
    const imc = Math.round((p / (t / 100) ** 2) * 10) / 10;
    setValues((prev) => (prev.imc === imc ? prev : { ...prev, imc }));
  }, [hasImc, values.poids, values.taille]);

  const setField = useCallback((key: string, v: unknown) => {
    setValues((prev) => ({ ...prev, [key]: v }));
    setErrors((e) => {
      const n = { ...e };
      delete n[key];
      return n;
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (readOnly) return;
    const parsed = schema.safeParse(values);
    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const path = issue.path[0];
        if (typeof path === 'string' && !next[path]) next[path] = issue.message;
      }
      setErrors(next);
      return;
    }
    setPending(true);
    try {
      await onSubmit(parsed.data as Record<string, unknown>);
    } finally {
      setPending(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={cn('space-y-4', className)}>
      {fields.map((f) => (
        <div key={f.key} className="space-y-1.5">
          <Label className="flex items-center gap-1">
            {f.label}
            {f.required ? <span className="text-destructive">*</span> : null}
          </Label>
          {f.type === 'text' && (
            <Input
              value={String(values[f.key] ?? '')}
              onChange={(e) => setField(f.key, e.target.value)}
              aria-invalid={!!errors[f.key]}
              disabled={readOnly}
            />
          )}
          {f.type === 'number' && (
            <div className="flex items-center gap-2">
              <Input
                type="number"
                value={values[f.key] === '' || values[f.key] == null ? '' : String(values[f.key])}
                onChange={(e) => {
                  const raw = e.target.value;
                  setField(f.key, raw === '' ? '' : Number(raw));
                }}
                min={f.min}
                max={f.max}
                className="max-w-[12rem]"
                aria-invalid={!!errors[f.key]}
                disabled={readOnly}
              />
              {f.unit ? (
                <span className="text-muted-foreground text-sm tabular-nums">{f.unit}</span>
              ) : null}
            </div>
          )}
          {f.type === 'boolean' && (
            <input
              type="checkbox"
              className="size-4 accent-primary"
              checked={Boolean(values[f.key])}
              onChange={(e) => setField(f.key, e.target.checked)}
              disabled={readOnly}
            />
          )}
          {f.type === 'date' && (
            <Input
              type="date"
              value={String(values[f.key] ?? '').slice(0, 10)}
              onChange={(e) => setField(f.key, e.target.value)}
              disabled={readOnly}
            />
          )}
          {f.type === 'select' && f.options && (
            <Select
              value={String(values[f.key] ?? '')}
              onValueChange={(v) => setField(f.key, v)}
              disabled={readOnly}
            >
              <SelectTrigger className="max-w-md" disabled={readOnly}>
                <SelectValue placeholder="Choisir…" />
              </SelectTrigger>
              <SelectContent>
                {f.options.map((opt) => (
                  <SelectItem key={opt} value={opt}>
                    {opt}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {f.type === 'multiselect' && f.options && (
            <div className="flex flex-wrap gap-2">
              {f.options.map((opt) => {
                const arr = (values[f.key] as string[]) ?? [];
                const on = arr.includes(opt);
                return (
                  <Button
                    key={opt}
                    type="button"
                    size="sm"
                    variant={on ? 'default' : 'outline'}
                    disabled={readOnly}
                    onClick={() =>
                      setField(
                        f.key,
                        on ? arr.filter((x) => x !== opt) : [...arr, opt],
                      )
                    }
                  >
                    {opt}
                  </Button>
                );
              })}
            </div>
          )}
          {f.type === 'range' && (
            <div className="flex max-w-md items-center gap-2">
              <Input
                type="number"
                placeholder="Min"
                value={String((values[f.key] as { min?: number })?.min ?? '')}
                onChange={(e) =>
                  setField(f.key, {
                    ...((values[f.key] as object) ?? {}),
                    min: e.target.value === '' ? undefined : Number(e.target.value),
                  })
                }
                disabled={readOnly}
              />
              <span className="text-muted-foreground">—</span>
              <Input
                type="number"
                placeholder="Max"
                value={String((values[f.key] as { max?: number })?.max ?? '')}
                onChange={(e) =>
                  setField(f.key, {
                    ...((values[f.key] as object) ?? {}),
                    max: e.target.value === '' ? undefined : Number(e.target.value),
                  })
                }
                disabled={readOnly}
              />
            </div>
          )}
          {errors[f.key] ? (
            <p className="text-destructive text-sm">{errors[f.key]}</p>
          ) : null}
        </div>
      ))}
      {readOnly ? null : (
        <Button type="submit" disabled={pending}>
          {pending ? '…' : submitLabel}
        </Button>
      )}
    </form>
  );
}
