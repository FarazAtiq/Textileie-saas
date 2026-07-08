import { cmToInch, metersToYards } from './kgMeterCalc.js';

export function getWidthInches(width, unit = 'inch') {
  const w = Number(width || 0);
  return unit === 'cm' ? cmToInch(w) : w;
}

export function kgToMeterRate({ pricePerKg, gsm, width, widthUnit }) {
  const widthInches = getWidthInches(width, widthUnit);
  const price = Number(pricePerKg || 0);
  const g = Number(gsm || 0);

  if (!price || !g || !widthInches) return 0;

  const kgPerMeter = 0.00000254 * g * widthInches;
  return price * kgPerMeter;
}

export function getFabricRates({ price, priceUnit, gsm, width, widthUnit }) {
  const p = Number(price || 0);

  if (priceUnit === 'KG') {
    const meter = kgToMeterRate({
      pricePerKg: p,
      gsm,
      width,
      widthUnit,
    });

    return {
      kg: p,
      meter,
      yard: meter * 0.9144,
    };
  }

  if (priceUnit === 'METER') {
    return {
      kg: 0,
      meter: p,
      yard: p * 0.9144,
    };
  }

  if (priceUnit === 'YARD') {
    return {
      kg: 0,
      meter: p / 0.9144,
      yard: p,
    };
  }

  return { kg: 0, meter: 0, yard: 0 };
}

export function fabricCostPerPiece({ consumption, uom, rates }) {
  const qty = Number(consumption || 0);
  const unit = String(uom || 'METER').toUpperCase();

  if (unit === 'KG') return qty * rates.kg;
  if (unit === 'YARD') return qty * rates.yard;
  return qty * rates.meter;
}
