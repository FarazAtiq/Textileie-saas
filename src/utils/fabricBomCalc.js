// ── Fabric BOM calculation helpers ──────────────────────────

// Core consumption formula:
// Consumption (BOM) = (LayLength / NoOfPcs / KgsPerMtr) * (1 + Allowance%/100)
export function calcBomConsumption({ layLength, noOfPcs, kgsPerMtr, allowancePct }) {
  if (!noOfPcs || !kgsPerMtr) return 0;
  const base = (layLength / noOfPcs) / kgsPerMtr;
  const withAllowance = base * (1 + (allowancePct || 0) / 100);
  return +withAllowance.toFixed(3);
}

// Auto-scale: given a base size's values and a ratio for target size,
// scale Lay Length proportionally. No of Pcs and Efficiency typically
// stay the same across sizes (cutting marker layout), but ratio can
// adjust Lay Length to reflect garment size grading.
export function scaleSizeValue(baseValue, ratio) {
  return +(baseValue * (ratio || 1)).toFixed(3);
}

// Default grading ratio suggestions (user-editable)
export const DEFAULT_GRADING = {
  XS: 0.90, S: 0.95, M: 1.00, L: 1.05, XL: 1.10, '2XL': 1.15, '3XL': 1.20,
};

export function defaultRatioForSize(sizeLabel) {
  const key = (sizeLabel || '').toUpperCase().replace(/\s/g, '');
  return DEFAULT_GRADING[key] ?? 1.00;
}
