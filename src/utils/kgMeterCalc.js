// ── Kg <-> Meter <-> Yard converter ─────────────────────────
// Confirmed formulas from user's handwritten note:
//
// Kg -> Meter:
//   meters = 39370.08 × weightKg / (GSM × widthInches)
//   constant 39370.08 = 1,000,000 / 25.4
//
// Meter -> Kg:
//   kg = 0.00000254 × lengthM × GSM × widthInches
//   constant 0.00000254 = 25.4 / 1,000,000
//
// 1 meter = 1.09361 yards (exact conversion)
// Width: if user enters cm, divide by 2.54 to get inches first.

export function calcKgToMeter({ weightKg, gsm, widthInches }) {
  if (!gsm || !widthInches || !weightKg) return 0;
  const meters = (39370.08 * weightKg) / (gsm * widthInches);
  return +meters.toFixed(4);
}

export function calcMeterToKg({ lengthM, gsm, widthInches }) {
  if (!gsm || !widthInches || !lengthM) return 0;
  const kg = 0.0000254 * lengthM * gsm * widthInches;
  return +kg.toFixed(4);
}

export function metersToYards(meters) {
  return +(meters * 1.09361).toFixed(4);
}

export function yardsToMeters(yards) {
  return +(yards / 1.09361).toFixed(4);
}

export function cmToInch(cm) {
  return +(cm / 2.54).toFixed(4);
}

export function inchToCm(inch) {
  return +(inch * 2.54).toFixed(4);
}
