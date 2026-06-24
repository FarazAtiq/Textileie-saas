import { useState } from 'react';
import { Sparkles, X, TrendingUp, AlertTriangle, CheckCircle, Target, Lightbulb } from 'lucide-react';

// ── Real-world textile IE analysis engine ─────────────────────
function analyzeEfficiency(lines) {
  const results = lines.map(l => {
    const avail   = l.shiftMinutes * l.operators;
    const earned  = l.unitsProduced * l.smv;
    const eff     = avail > 0 ? (earned / avail * 100) : 0;
    const lost    = avail - earned;
    const perOp   = l.operators > 0 ? l.unitsProduced / l.operators : 0;
    const target  = l.smv > 0 ? Math.floor(avail / l.smv) : 0;
    const gap     = target - l.unitsProduced;
    return { ...l, eff, avail, earned, lost, perOp, target, gap };
  });

  const avgEff   = results.reduce((s, r) => s + r.eff, 0) / results.length;
  const worstLine = results.reduce((a, b) => a.eff < b.eff ? a : b);
  const bestLine  = results.reduce((a, b) => a.eff > b.eff ? a : b);
  const totalLost = results.reduce((s, r) => s + r.lost, 0);
  const totalGap  = results.reduce((s, r) => s + r.gap, 0);

  // Status
  let status = 'excellent';
  if (avgEff < 40)      status = 'critical';
  else if (avgEff < 55) status = 'below_target';
  else if (avgEff < 75) status = 'acceptable';

  // Problems
  const problems = [];

  if (avgEff < 75) {
    const lostHrs = (totalLost / 60).toFixed(1);
    problems.push({
      issue: 'Low line efficiency — ' + avgEff.toFixed(1) + '%',
      impact: totalLost.toFixed(0) + ' minutes (' + lostHrs + ' hours) lost per shift. At ' + avgEff.toFixed(1) + '% efficiency, factory is producing ' + totalGap + ' less pieces than possible.',
      lines_affected: 'All lines'
    });
  }

  results.forEach(r => {
    if (r.eff < 50) {
      problems.push({
        issue: 'Line ' + r.lineNumber + ' critically low at ' + r.eff.toFixed(1) + '%',
        impact: 'Only ' + r.unitsProduced + ' pcs produced vs ' + r.target + ' possible. ' + r.gap + ' pieces lost per shift.',
        lines_affected: 'Line ' + r.lineNumber + (r.articleNumber ? ' (Art#' + r.articleNumber + ')' : '')
      });
    }
  });

  if (results.length > 1) {
    const effSpread = bestLine.eff - worstLine.eff;
    if (effSpread > 15) {
      problems.push({
        issue: 'Large efficiency gap between lines — ' + effSpread.toFixed(1) + '%',
        impact: 'Line ' + bestLine.lineNumber + ' at ' + bestLine.eff.toFixed(1) + '% vs Line ' + worstLine.lineNumber + ' at ' + worstLine.eff.toFixed(1) + '%. Unbalanced production causing overall loss.',
        lines_affected: 'Line ' + worstLine.lineNumber + ' vs Line ' + bestLine.lineNumber
      });
    }
  }

  results.forEach(r => {
    if (r.smv > 0 && r.smv < 5) {
      problems.push({
        issue: 'Very low SMV — possible mis-measurement',
        impact: 'SMV of ' + r.smv + ' min seems very low for a garment. Verify time study is correct.',
        lines_affected: 'Line ' + r.lineNumber
      });
    }
  });

  // Recommendations
  const recs = [];

  if (avgEff < 60) {
    recs.push({
      action: 'Conduct immediate time study and identify top 3 bottleneck operations on each line',
      expected_improvement: '8-12% efficiency gain',
      priority: 'high',
      timeline: 'This week'
    });
    recs.push({
      action: 'Check absenteeism — replace absent operators with helpers or multi-skilled workers to maintain headcount',
      expected_improvement: '5-8% efficiency gain',
      priority: 'high',
      timeline: 'Immediate'
    });
  }

  if (avgEff < 75) {
    recs.push({
      action: 'Implement 2-hour production targets on whiteboard. Supervisor to check every 2 hours and take corrective action immediately',
      expected_improvement: '5-10% efficiency gain',
      priority: 'high',
      timeline: 'Immediate'
    });
    recs.push({
      action: 'Balance the line — identify operations where operators are waiting and redistribute work. Use operation breakdown sheet to re-balance.',
      expected_improvement: '6-10% efficiency gain',
      priority: 'high',
      timeline: '2-3 days'
    });
    recs.push({
      action: 'Check quality rejection rate — reworks kill efficiency. Any operator doing >5% rework should be retrained immediately',
      expected_improvement: '4-7% efficiency gain',
      priority: 'medium',
      timeline: 'This week'
    });
  }

  recs.push({
    action: 'Ensure thread, trims, and raw material reach the line 30 minutes before shift start — material delays cause major efficiency loss',
    expected_improvement: '3-5% efficiency gain',
    priority: 'medium',
    timeline: 'Immediate'
  });

  recs.push({
    action: 'Brief operators on daily target at shift start. Share efficiency results with line supervisors daily.',
    expected_improvement: '3-5% efficiency gain',
    priority: 'medium',
    timeline: 'Immediate'
  });

  if (results.some(r => r.operators > 30)) {
    recs.push({
      action: 'For lines with 30+ operators, break into mini-lines of 15-20. Smaller lines are easier to balance and monitor.',
      expected_improvement: '8-15% efficiency gain',
      priority: 'medium',
      timeline: '2-4 weeks'
    });
  }

  recs.push({
    action: 'Implement skill matrix — identify multi-skilled operators who can cover 2-3 operations. Reduces production stoppages.',
    expected_improvement: '5-8% efficiency gain',
    priority: 'low',
    timeline: '1 month'
  });

  // Target plan
  const gap = Math.max(0, 75 - avgEff).toFixed(1);
  const steps = [];

  if (avgEff < 50) {
    steps.push('Week 1: Stabilize lines — fix absenteeism, material supply, machine breakdowns. Target: reach 50%');
    steps.push('Week 2-3: Line balancing and bottleneck removal. Target: reach 60%');
    steps.push('Week 4-6: Operator skill development and quality control. Target: reach 70%');
    steps.push('Month 2-3: Fine-tuning, incentive system, target monitoring. Target: reach 75%+');
  } else if (avgEff < 65) {
    steps.push('Week 1-2: Implement hourly target boards and supervisor monitoring. Target: reach 65%');
    steps.push('Week 3-4: Line balancing and rework reduction. Target: reach 70%');
    steps.push('Month 2: Skill upgradation and incentive system. Target: reach 75%+');
  } else {
    steps.push('Week 1: Identify remaining bottleneck operations and resolve. Target: reach 75%');
    steps.push('Week 2-3: Fine-tune line balance and operator placement. Target: reach 78%');
    steps.push('Month 2: Implement incentive system for operators above 80%. Target: sustain 80%+');
  }

  // Quick wins
  const quickWins = [
    'Post daily target and actual production on whiteboard at line — visible to all operators',
    'Walk the line every 30 minutes — identify and remove idle operators immediately',
    'Ensure no machine is idle for >5 minutes without supervisor action',
    'Check WIP (Work In Progress) between operations — large WIP means line imbalance',
    'Verify operators are doing their assigned operation only — no multi-tasking without supervision'
  ];

  if (worstLine.eff < 50) {
    quickWins.unshift('Move your best supervisor to Line ' + worstLine.lineNumber + ' immediately — it needs urgent attention');
  }

  return {
    status,
    avgEff: avgEff.toFixed(1) + '%',
    summary: `Factory average efficiency is ${avgEff.toFixed(1)}% against world-class target of 75%. ${avgEff < 60 ? 'This is significantly below target and requires immediate corrective action.' : avgEff < 75 ? 'Performance is improving but still below target. Focus on line balancing and monitoring.' : 'Good performance! Focus on sustaining and pushing towards 80%+.'}`,
    problems,
    recommendations: recs,
    targetPlan: {
      current: avgEff.toFixed(1) + '%',
      target: '75%',
      gap: gap + '%',
      steps
    },
    quickWins,
    lineResults: results
  };
}

function analyzeCapacity(lines) {
  const results = lines.map(l => {
    const totalMin   = l.machines * l.shiftsPerDay * l.shiftMinutes;
    const effMin     = totalMin * (l.efficiencyPct / 100);
    const daily      = l.smv > 0 ? Math.floor(effMin / l.smv) : 0;
    const weekly     = daily * 6;
    const monthly    = daily * l.workingDaysPerMonth;
    const maxDaily   = l.smv > 0 ? Math.floor(totalMin / l.smv) : 0;
    const unutilized = maxDaily - daily;
    return { ...l, totalMin, effMin, daily, weekly, monthly, maxDaily, unutilized };
  });

  const totalDaily   = results.reduce((s, r) => s + r.daily, 0);
  const totalMonthly = results.reduce((s, r) => s + r.monthly, 0);
  const totalMax     = results.reduce((s, r) => s + r.maxDaily, 0);
  const totalUnutil  = totalMax - totalDaily;
  const avgEff       = results.reduce((s, r) => s + r.efficiencyPct, 0) / results.length;

  let status = 'excellent';
  if (avgEff < 55)      status = 'critical';
  else if (avgEff < 65) status = 'below_target';
  else if (avgEff < 80) status = 'acceptable';

  const problems = [];

  if (totalUnutil > 0) {
    problems.push({
      issue: totalUnutil.toLocaleString() + ' pieces per day of capacity being wasted',
      impact: 'At current efficiency, factory is leaving ' + totalUnutil.toLocaleString() + ' pcs/day on the table. Monthly loss: ' + (totalUnutil * 26).toLocaleString() + ' pieces.',
      lines_affected: 'All lines'
    });
  }

  results.forEach(r => {
    if (r.efficiencyPct < 65) {
      problems.push({
        issue: 'Line ' + r.lineNumber + ' running at only ' + r.efficiencyPct + '% efficiency',
        impact: 'Producing ' + r.daily.toLocaleString() + ' pcs/day vs possible ' + r.maxDaily.toLocaleString() + '. Gap of ' + r.unutilized.toLocaleString() + ' pcs/day.',
        lines_affected: 'Line ' + r.lineNumber + (r.articleNumber ? ' Art#' + r.articleNumber : '')
      });
    }
  });

  results.forEach(r => {
    if (r.shiftsPerDay === 1) {
      problems.push({
        issue: 'Line ' + r.lineNumber + ' running single shift only',
        impact: 'Adding a second shift would double capacity to ' + (r.daily * 2).toLocaleString() + ' pcs/day with same machines.',
        lines_affected: 'Line ' + r.lineNumber
      });
    }
  });

  const recs = [];

  if (avgEff < 75) {
    recs.push({
      action: 'Improve line efficiency from ' + avgEff.toFixed(0) + '% to 75% — this alone adds ' + Math.floor(totalMax * 0.10).toLocaleString() + ' pcs/day without any new machines',
      expected_improvement: Math.floor(totalUnutil * 0.5).toLocaleString() + ' pcs/day',
      priority: 'high',
      timeline: '2-4 weeks'
    });
  }

  if (results.some(r => r.shiftsPerDay === 1)) {
    const singleShiftLines = results.filter(r => r.shiftsPerDay === 1);
    const extraCapacity = singleShiftLines.reduce((s, r) => s + r.daily, 0);
    recs.push({
      action: 'Add second shift on single-shift lines — immediately doubles capacity without capital investment',
      expected_improvement: extraCapacity.toLocaleString() + ' additional pcs/day',
      priority: 'high',
      timeline: '1 week'
    });
  }

  recs.push({
    action: 'Reduce changeover time between styles — target less than 2 hours for style change. Pre-plan next style while current is running.',
    expected_improvement: '3-5% capacity increase',
    priority: 'medium',
    timeline: '2 weeks'
  });

  recs.push({
    action: 'Implement preventive maintenance schedule — machine breakdowns cause 5-10% capacity loss. Service machines every 2 weeks.',
    expected_improvement: '5-8% capacity gain',
    priority: 'medium',
    timeline: '2 weeks'
  });

  recs.push({
    action: 'Review SMV accuracy — if SMV is higher than actual operation time, capacity calculation will be understated. Re-do time study.',
    expected_improvement: '3-7% capacity accuracy',
    priority: 'low',
    timeline: '1 month'
  });

  const steps = [
    'Month 1: Improve efficiency to 75% on all lines. Expected gain: ' + Math.floor(totalUnutil * 0.4).toLocaleString() + ' pcs/day',
    'Month 2: Reduce changeover time and implement preventive maintenance. Expected gain: 5-8% more capacity',
    'Month 3: Review and optimize SMV, line balance, operator skills. Target 80% efficiency.',
    'Quarter 2: Consider adding lines or shifts based on order book requirements'
  ];

  const quickWins = [
    'Calculate your actual capacity utilization daily: (Actual output / Max possible) x 100',
    'Track machine downtime — any machine idle > 15 min must be reported to supervisor immediately',
    'Ensure 100% attendance on high-capacity lines — one absent operator = ' + Math.round(results[0]?.daily / (results[0]?.machines || 40)) + ' pcs lost',
    'Pre-position all materials, thread, and accessories 30 min before shift start',
    'Review daily output at end of shift — compare actual vs planned and take next-day corrective action'
  ];

  return {
    status,
    totalDaily: totalDaily.toLocaleString() + ' pcs/day',
    summary: `Total factory capacity is ${totalDaily.toLocaleString()} pieces per day across ${lines.length} line${lines.length > 1 ? 's' : ''}. ${totalUnutil > 0 ? `${totalUnutil.toLocaleString()} pieces per day of potential capacity is currently unutilized due to efficiency gap.` : 'Factory is running at optimal capacity.'}`,
    problems,
    recommendations: recs,
    targetPlan: {
      current: totalDaily.toLocaleString() + ' pcs/day',
      potential: Math.floor(totalMax * 0.80).toLocaleString() + ' pcs/day (at 80% eff)',
      steps
    },
    quickWins,
    lineResults: results
  };
}

// ── Status colors ─────────────────────────────────────────────
const STATUS_COLOR = { critical: 'var(--red)', below_target: 'var(--amber)', acceptable: 'var(--blue)', excellent: 'var(--green)' };
const STATUS_BG    = { critical: 'var(--red-light)', below_target: 'var(--amber-light)', acceptable: 'var(--blue-light)', excellent: 'var(--green-light)' };
const STATUS_LABEL = { critical: 'Critical — Urgent action needed', below_target: 'Below target — Improvement required', acceptable: 'Acceptable — Push to world class', excellent: 'World class performance!' };
const PRI_COLOR    = { high: 'var(--red)', medium: 'var(--amber)', low: 'var(--green)' };

// ── Main component ────────────────────────────────────────────
export function AIAnalysis({ type, data, results, lines }) {
  const [open, setOpen]         = useState(false);
  const [analysis, setAnalysis] = useState(null);

  const runAnalysis = () => {
    const allLines = (lines && lines.length > 0) ? lines : [data];
    if (type === 'efficiency') {
      setAnalysis(analyzeEfficiency(allLines));
    } else {
      setAnalysis(analyzeCapacity(allLines));
    }
    setOpen(true);
  };

  return (
    <>
      <button onClick={runAnalysis} style={{
        width: '100%', padding: '10px 16px',
        background: 'linear-gradient(135deg, #0F2942, #0D7A6B)',
        color: 'white', border: 'none', borderRadius: 8,
        fontSize: 13, fontWeight: 600, cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        gap: 8, fontFamily: 'inherit'
      }}>
        <Sparkles size={15} /> Get IE Analysis & Improvement Plan
      </button>

      {open && analysis && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ background: 'white', borderRadius: 16, width: '100%', maxWidth: 680, maxHeight: '92vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 24px 64px rgba(0,0,0,0.3)' }}>

            {/* Header */}
            <div style={{ padding: '16px 20px', background: 'linear-gradient(135deg, #0F2942, #0D7A6B)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Sparkles size={18} color="white" />
                <div>
                  <div style={{ color: 'white', fontWeight: 700, fontSize: 15 }}>IE Analysis & Improvement Plan</div>
                  <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11 }}>Textile Industrial Engineering Suite</div>
                </div>
              </div>
              <button onClick={() => setOpen(false)} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 8, color: 'white', cursor: 'pointer', padding: 8 }}>
                <X size={16} />
              </button>
            </div>

            {/* Body */}
            <div style={{ overflowY: 'auto', flex: 1, padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>

              {/* Status banner */}
              <div style={{ padding: '14px 16px', borderRadius: 10, background: STATUS_BG[analysis.status], border: '1px solid ' + STATUS_COLOR[analysis.status] + '40' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <TrendingUp size={16} color={STATUS_COLOR[analysis.status]} />
                  <span style={{ fontWeight: 700, fontSize: 14, color: STATUS_COLOR[analysis.status] }}>
                    {STATUS_LABEL[analysis.status]}
                  </span>
                  <span style={{ marginLeft: 'auto', fontWeight: 700, fontSize: 16, fontFamily: 'JetBrains Mono', color: STATUS_COLOR[analysis.status] }}>
                    {analysis.avgEff || analysis.totalDaily}
                  </span>
                </div>
                <p style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.7 }}>{analysis.summary}</p>
              </div>

              {/* Line by line summary (if multiple lines) */}
              {analysis.lineResults?.length > 1 && (
                <div className="card" style={{ padding: 14 }}>
                  <h3 style={{ marginBottom: 12 }}>Line breakdown</h3>
                  {analysis.lineResults.map((l, i) => {
                    const val  = type === 'efficiency' ? l.eff : l.efficiencyPct;
                    const disp = type === 'efficiency' ? l.eff.toFixed(1) + '%' : l.daily.toLocaleString() + ' pcs/day';
                    const col  = val >= 75 ? 'var(--green)' : val >= 55 ? 'var(--amber)' : 'var(--red)';
                    return (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', marginBottom: 6, borderRadius: 8, background: 'var(--bg)' }}>
                        <div>
                          <span style={{ fontWeight: 600, fontSize: 13 }}>Line {l.lineNumber}</span>
                          {l.articleNumber && <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 6 }}>Art#{l.articleNumber}</span>}
                          {type === 'efficiency' && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{l.operators} ops · {l.unitsProduced} pcs produced · Target {l.target} pcs</div>}
                          {type === 'capacity'   && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{l.machines} machines · {l.shiftsPerDay} shifts · {l.efficiencyPct}% eff</div>}
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontWeight: 700, fontSize: 15, fontFamily: 'JetBrains Mono', color: col }}>{disp}</div>
                          {type === 'efficiency' && l.gap > 0 && <div style={{ fontSize: 10, color: 'var(--red)' }}>{l.gap} pcs short</div>}
                          {type === 'capacity'   && l.unutilized > 0 && <div style={{ fontSize: 10, color: 'var(--amber)' }}>{l.unutilized} pcs unused</div>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Problems */}
              {analysis.problems?.length > 0 && (
                <div className="card" style={{ padding: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                    <AlertTriangle size={15} color="var(--amber)" />
                    <h3 style={{ color: 'var(--amber)' }}>Problems identified ({analysis.problems.length})</h3>
                  </div>
                  {analysis.problems.map((p, i) => (
                    <div key={i} style={{ padding: '10px 12px', marginBottom: 8, borderRadius: 8, background: 'var(--amber-light)', border: '1px solid #FCD34D40' }}>
                      <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--amber)', marginBottom: 4 }}>{p.issue}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{p.impact}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>Affects: {p.lines_affected}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* Recommendations */}
              {analysis.recommendations?.length > 0 && (
                <div className="card" style={{ padding: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                    <CheckCircle size={15} color="var(--green)" />
                    <h3 style={{ color: 'var(--green)' }}>Recommendations ({analysis.recommendations.length})</h3>
                  </div>
                  {analysis.recommendations.map((rec, i) => (
                    <div key={i} style={{ padding: '12px 14px', marginBottom: 8, borderRadius: 8, background: 'var(--bg)', border: '1px solid var(--border-light)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                        <div style={{ fontWeight: 600, fontSize: 13, flex: 1, paddingRight: 8, lineHeight: 1.5 }}>{i+1}. {rec.action}</div>
                        <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 20, background: PRI_COLOR[rec.priority] + '20', color: PRI_COLOR[rec.priority], flexShrink: 0, textTransform: 'uppercase' }}>
                          {rec.priority}
                        </span>
                      </div>
                      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 12, color: 'var(--green)', fontWeight: 600 }}>+{rec.expected_improvement}</span>
                        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>⏱ {rec.timeline}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Target plan */}
              {analysis.targetPlan && (
                <div className="card" style={{ padding: 14, background: 'var(--navy)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                    <Target size={15} color="var(--teal)" />
                    <h3 style={{ color: 'white' }}>Roadmap to target</h3>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 16 }}>
                    {[
                      ['Current', analysis.targetPlan.current, 'var(--red)'],
                      ['Target', analysis.targetPlan.target || '75%', 'var(--green)'],
                      ['Gap / Potential', analysis.targetPlan.gap || analysis.targetPlan.potential, 'var(--amber)']
                    ].map(([l, v, c]) => (
                      <div key={l} style={{ textAlign: 'center', padding: '10px 6px', background: 'rgba(255,255,255,0.08)', borderRadius: 10 }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: c, fontFamily: 'JetBrains Mono', marginBottom: 4 }}>{v}</div>
                        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)' }}>{l}</div>
                      </div>
                    ))}
                  </div>
                  {(analysis.targetPlan.steps || []).map((step, i) => (
                    <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 10 }}>
                      <span style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--teal)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0, color: 'white' }}>{i+1}</span>
                      <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)', lineHeight: 1.6 }}>{step}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Quick wins */}
              {analysis.quickWins?.length > 0 && (
                <div className="card" style={{ padding: 14, background: 'var(--green-light)', border: '1px solid #6EE7B740' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                    <Lightbulb size={15} color="var(--green)" />
                    <h3 style={{ color: 'var(--green)' }}>Do these TODAY — quick wins!</h3>
                  </div>
                  {analysis.quickWins.map((win, i) => (
                    <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 8, fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.5 }}>
                      <span style={{ color: 'var(--green)', fontWeight: 700, flexShrink: 0 }}>✓</span>
                      {win}
                    </div>
                  ))}
                </div>
              )}

              {/* Re-analyze button */}
              <button onClick={runAnalysis} className="btn btn-secondary btn-full">
                <Sparkles size={13} /> Re-analyze
              </button>

            </div>
          </div>
        </div>
      )}
    </>
  );
}
