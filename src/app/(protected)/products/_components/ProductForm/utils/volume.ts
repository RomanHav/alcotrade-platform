export type UnitKey = 'ml' | 'l' | 'cl';

export const UNITS: Record<UnitKey, { label: string; factor: number }> = {
  ml: { label: 'мл', factor: 1 },
  cl: { label: 'cl', factor: 10 },
  l: { label: 'л', factor: 1000 },
};

export const fmtLabel = (value: number, unit: UnitKey) => `${value} ${UNITS[unit].label}`;
export const toMl = (value: number, unit: UnitKey) => value * UNITS[unit].factor;

type VariantLike = { label?: string | null; volumeMl?: number | null };

export function detectUnit(v: VariantLike): UnitKey {
  const label = (v.label || '').toLowerCase().trim();
  if (label.includes('мл') || /\bml\b/.test(label)) return 'ml';
  if (/\bcl\b/.test(label)) return 'cl';
  if (/літр/.test(label) || /литр/.test(label) || /\bл\b/.test(label) || /\bl\b/.test(label)) {
    return 'l';
  }
  const ml = v.volumeMl ?? 0;
  if (ml >= 1000 && ml % 1000 === 0) return 'l';
  return 'ml';
}
