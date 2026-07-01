// ── Kg <-> Meter <-> Yard converter ──────────────────────────
// Based on user's confirmed Python formula:
// M (meters) = (100000 / 2.54 * weight_kg) / (GSM * width_cm)
// K (kg)     = (2.54 / 100000) * length_m * GSM * width_cm
// Y (yards)  = M * 1.1

export function calcKgToMeter({ weightKg, gsm, widthCm }) {
  if (!gsm || !widthCm) return 0;
  const factor = 100000 / 2.54;
  const meters = (factor * weightKg) / (gsm * widthCm);
  return +meters.toFixed(3);
}

export function calcMeterToKg({ lengthM, gsm, widthCm }) {
  if (!gsm || !widthCm) return 0;
  const factor = 2.54 / 100000;
  const kg = factor * lengthM * gsm * widthCm;
  return +kg.toFixed(3);
}

export function metersToYards(meters) {
  return +(meters * 1.1).toFixed(3);
}

export function inchToCm(inch) {
  return +(inch * 2.54).toFixed(3);
}
