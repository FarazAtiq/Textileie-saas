// ── Efficiency ───────────────────────────────────────────────
export function calcEfficiency({ shiftMinutes, operators, unitsProduced, smv }) {
  const availableMinutes = shiftMinutes * operators;
  const earnedMinutes    = unitsProduced * smv;
  const efficiency       = availableMinutes > 0 ? (earnedMinutes / availableMinutes) * 100 : 0;
  return {
    efficiency:          +efficiency.toFixed(2),
    availableMinutes,
    earnedMinutes:       +earnedMinutes.toFixed(2),
    lostMinutes:         +(availableMinutes - earnedMinutes).toFixed(2),
    outputPerOperator:   operators > 0 ? +(unitsProduced / operators).toFixed(1) : 0,
    targetOutput:        smv > 0 ? Math.floor(availableMinutes / smv) : 0,
  };
}

// ── Capacity ─────────────────────────────────────────────────
export function calcCapacity({ machines, shiftsPerDay, shiftMinutes, smv, efficiencyPct, workingDaysPerMonth }) {
  const totalDailyMinutes  = machines * shiftsPerDay * shiftMinutes;
  const effectiveMinutes   = totalDailyMinutes * (efficiencyPct / 100);
  const dailyCapacity      = smv > 0 ? Math.floor(effectiveMinutes / smv) : 0;
  return {
    totalDailyMinutes,
    effectiveMinutes:   +effectiveMinutes.toFixed(0),
    dailyCapacity,
    weeklyCapacity:     dailyCapacity * 6,
    monthlyCapacity:    dailyCapacity * workingDaysPerMonth,
    minutesPerPiece:    smv > 0 ? +(smv / (efficiencyPct / 100)).toFixed(2) : 0,
  };
}

// ── SMV ──────────────────────────────────────────────────────
export function calcSMV(operations) {
  let totalBasic = 0, totalAllowance = 0;
  const breakdown = operations.map(op => {
    const basic    = parseFloat(op.basicTime)    || 0;
    const allowPct = parseFloat(op.allowancePct) || 0;
    const allowMin = basic * (allowPct / 100);
    const smv      = basic + allowMin;
    totalBasic     += basic;
    totalAllowance += allowMin;
    return { ...op, basicTime: basic, allowancePct: allowPct, allowanceMinutes: +allowMin.toFixed(3), smv: +smv.toFixed(3) };
  });
  const totalSMV = totalBasic + totalAllowance;
  return {
    breakdown,
    totalBasicTime:         +totalBasic.toFixed(3),
    totalAllowanceTime:     +totalAllowance.toFixed(3),
    totalSMV:               +totalSMV.toFixed(3),
    dailyOutputPerOperator: totalSMV > 0 ? Math.floor((480 * 0.80) / totalSMV) : 0,
    operatorsFor500pcs:     totalSMV > 0 ? Math.ceil((500 * totalSMV) / (480 * 0.80)) : 0,
  };
}

// ── Fabric (Yards) ───────────────────────────────────────────
export function calcFabricYards({ widthInches, garmentLengthCm, wastePct, orderQty, pricePerYard }) {
  const netYards   = (garmentLengthCm / 2.54) / 36;
  const grossYards = netYards * (1 + wastePct / 100);
  const totalYards = grossYards * orderQty;
  const costPerUnit = grossYards * pricePerYard;
  return {
    netYards:         +netYards.toFixed(4),
    grossYards:       +grossYards.toFixed(4),
    wasteYardsPerUnit:+(grossYards - netYards).toFixed(4),
    totalYards:       +totalYards.toFixed(2),
    wasteYards:       +((grossYards - netYards) * orderQty).toFixed(2),
    costPerUnit:      +costPerUnit.toFixed(2),
    totalCost:        +(costPerUnit * orderQty).toFixed(2),
  };
}

// ── Fabric (GSM) ─────────────────────────────────────────────
export function calcFabricGSM({ lengthCm, widthCm, gsm, patternPieces, wastePct, orderQty }) {
  const totalArea    = (lengthCm / 100) * (widthCm / 100) * patternPieces;
  const netWeightKg  = (totalArea * gsm) / 1000;
  const grossWeightKg = netWeightKg * (1 + wastePct / 100);
  return {
    totalNetArea:    +totalArea.toFixed(4),
    netWeightKg:     +netWeightKg.toFixed(4),
    grossWeightKg:   +grossWeightKg.toFixed(4),
    wasteKgPerUnit:  +(grossWeightKg - netWeightKg).toFixed(4),
    totalWeightKg:   +(grossWeightKg * orderQty).toFixed(2),
  };
}

// ── Thread ───────────────────────────────────────────────────
const STITCH_RATIOS = {
  lockstitch: 2.5, chainstitch: 6.6, overlock3: 12.0,
  overlock4: 14.0, flatseam: 18.0, coverstitch: 10.0,
};
export function calcThread({ seamLength, stitchType, spi }) {
  const ratio        = STITCH_RATIOS[stitchType] || 2.5;
  const threadPerCm  = (spi / 2.54) * ratio;
  const netMeters    = (seamLength * threadPerCm) / 100;
  const wasteMeters  = netMeters * 0.10;
  return {
    threadPerCm:  +threadPerCm.toFixed(3),
    netMeters:    +netMeters.toFixed(2),
    wasteMeters:  +wasteMeters.toFixed(2),
    grossMeters:  +(netMeters + wasteMeters).toFixed(2),
  };
}

// ── Costing ──────────────────────────────────────────────────
export function calcCosting({ fabricCostPerUnit, cmt, overhead, profit, agentCommPct, bankChargePct, freightPerUnit, dutyPct }) {
  const totalCost      = fabricCostPerUnit + cmt + overhead + freightPerUnit;
  const agentComm      = totalCost * (agentCommPct  / 100);
  const bankCharge     = totalCost * (bankChargePct / 100);
  const duty           = totalCost * (dutyPct       / 100);
  const totalWithExtras = totalCost + agentComm + bankCharge + duty;
  const profitAmount   = totalWithExtras * (profit   / 100);
  return {
    totalProductionCost: +totalCost.toFixed(2),
    agentCommission:     +agentComm.toFixed(2),
    bankCharge:          +bankCharge.toFixed(2),
    duty:                +duty.toFixed(2),
    profitAmount:        +profitAmount.toFixed(2),
    fobPrice:            +(totalWithExtras + profitAmount).toFixed(2),
    profitMargin:        profit,
  };
}

// ── Yarn Count (Tex / Ne / Nm) ───────────────────────────────
export function calcYarnCount({ weightGrams, lengthMeters, system }) {
  const ne = (lengthMeters / 1000 * 1.6936) / (weightGrams / 453.6);
  const tex = (weightGrams / lengthMeters) * 1000;
  const nm  = lengthMeters / weightGrams;
  return {
    ne:  +ne.toFixed(2),
    tex: +tex.toFixed(2),
    nm:  +nm.toFixed(2),
    primaryValue: system === 'ne' ? ne : system === 'tex' ? tex : nm,
  };
}

// ── Helpers ───────────────────────────────────────────────────
export function formatNum(n, decimals = 2) {
  if (n === undefined || n === null || isNaN(n)) return '—';
  return Number(n).toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

export function efficiencyColor(pct) {
  if (pct >= 75) return 'var(--green)';
  if (pct >= 55) return 'var(--amber)';
  return 'var(--red)';
}
