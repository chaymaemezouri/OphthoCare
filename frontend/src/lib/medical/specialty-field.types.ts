export type SpecialtyFieldType =
  | 'text'
  | 'number'
  | 'select'
  | 'date'
  | 'boolean'
  | 'range'
  | 'multiselect';

export type SpecialtyField = {
  key: string;
  label: string;
  type: SpecialtyFieldType;
  options?: string[];
  unit?: string;
  required?: boolean;
  min?: number;
  max?: number;
};
