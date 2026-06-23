'use client';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface SpecialtyPickerProps {
  value?: string;
  onChange: (code: string) => void;
  specialties: { code: string; name: string }[];
  triggerClassName?: string;
}

export function SpecialtyPicker({ value, onChange, specialties, triggerClassName }: SpecialtyPickerProps) {
  return (
    <Select
      value={value}
      onValueChange={(v) => {
        if (v != null) onChange(v);
      }}
    >
      <SelectTrigger className={triggerClassName ?? 'w-full'}>
        <SelectValue placeholder="Spécialité">
          {specialties.find((s) => s.code === value)?.name ?? 'Spécialité'}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {specialties.map((s) => (
          <SelectItem key={s.code} value={s.code}>
            {s.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
