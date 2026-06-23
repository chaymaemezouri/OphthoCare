import { z } from 'zod';
import type { SpecialtyField } from './specialty-field.types';

function fieldSchema(f: SpecialtyField): z.ZodTypeAny {
  let inner: z.ZodTypeAny;
  switch (f.type) {
    case 'text':
      inner = z.string();
      break;
    case 'number': {
      let n = z.coerce.number();
      if (f.min != null) n = n.min(f.min);
      if (f.max != null) n = n.max(f.max);
      inner = n;
      break;
    }
    case 'boolean':
      inner = z.boolean();
      break;
    case 'date':
      inner = z.string().min(1);
      break;
    case 'select':
      inner = z.string().min(1);
      break;
    case 'multiselect':
      inner = z.array(z.string());
      break;
    case 'range':
      inner = z.object({ min: z.coerce.number(), max: z.coerce.number() });
      break;
    default:
      inner = z.unknown();
  }
  if (!f.required) {
    return inner.optional();
  }
  return inner;
}

export function buildSpecialtyZodSchema(fields: SpecialtyField[]) {
  const shape: Record<string, z.ZodTypeAny> = {};
  for (const f of fields) {
    shape[f.key] = fieldSchema(f);
  }
  return z.object(shape).passthrough();
}
