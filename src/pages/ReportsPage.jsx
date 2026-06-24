import { useState, useEffect } from 'react';
import { Trash2, Download, FileText, Search, Star, Calendar, BarChart2, X, TrendingUp, AlertTriangle, CheckCircle, Target, Lightbulb } from 'lucide-react';
import { getReports, deleteReport, toggleStar } from '../lib/db.js';
import { useAuth } from '../hooks/useAuth.jsx';
import { useToast } from '../hooks/useToast.jsx';
import { exportReportPDF } from '../utils/pdfExport.js';
import { PageHeader } from '../components/ResultCard.jsx';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, RadialBarChart, RadialBar, Legend } from 'recharts';

const TYPE_BADGE  = { efficiency:'teal', capacity:'navy', smv:'amber', fabric:'green', thread:'purple', costing:'orange', yarn:'red' };
const TYPE_LABEL  = { efficiency:'Efficiency', capacity:'Capacity', smv:'SMV', fabric:'Fabric', thread:'Thread', costing:'Costing', yarn:'Yarn' };
const FILTER_TABS = ['all','efficiency','capacity','smv','fabric','thread','costing','yarn'];
const TYPE_COLOR  = { efficiency:'#0D7A6B', capacity:'#0F2942', smv:'#D97706', fabric:'#059669', thread:'#7C3AED', costing:'#EA580C', yarn:'#DC2626' };

const DATE_FILTERS = [
  { label: 'All dates',  value: 'all' },
  { label: 'Today',      value: 'today' },
  { label: 'Yesterday',  value: 'yesterday' },
  { label: 'This week',  value: 'week' },
  { label: 'This month', value: 'month' },
  { label: 'Last month', value: 'lastmonth' },
];

function filterByDate(reports, dateFilter) {
  if (dateFilter === 'all') return reports;
  const now   = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return reports.filter(r => {
    const d  = new Date(r.created_at);
    const rd = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    if (dateFilter === 'today')     return rd.getTime() === today.getTime();
    if (dateFilter === 'yesterday') return rd.getTime() === today.getTime() - 86400000;
    if (dateFilter === 'week')      return d >= new Date(today.getTime() - 6 * 86400000);
    if (dateFilter === 'month')     return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    if (dateFilter === 'lastmonth') {
      const lm = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      return d.getMonth() === lm.getMonth() && d.getFullYear() === lm.getFullYear();
    }
    return true;
  });
}

function getKeyResult(r) {
  const res = r.results || {};
  switch (r.type) {
    case 'efficiency': return res.efficiency != null ? Number(res.efficiency) : null;
    case 'capacity':   return res.dailyCapacity != null ? Number(res.dailyCapacity) : null;
    case 'smv':        return res.totalSMV != null ? Number(res.totalSMV) : null;
    case 'fabric':     return res.grossYards != null ? Number(res.grossYards) : res.grossWeightKg != null ? Number(res.grossWeightKg) : null;
    case 'costing':    return res.fobPrice != null ? Number(res.fobPrice) : null;
    default:           return null;
  }
}

function getKeyResultStr(r) {
  const v = getKeyResult(r);
  if (v === null) return '—';
  switch (r.type) {
    case 'efficiency': return v + '% eff';
    case 'capacity':   return v.toLocaleString() + ' pcs/day';
    case 'smv':        return 'SMV ' + v + ' min';
    case 'fabric':     return v + (r.results?.grossYards ? ' yds' : ' kg');
    case 'costing':    return '$' + v + ' FOB';
    default:           return String(v);
  }
}

function exportReportExcel(r) {
  const inputs  = r.inputs  || {};
  const results = r.results || {};
  const inputRows  = Object.entries(inputs).map(([k, v])  => [k.replace(/([A-Z])/g,' $1').replace(/^./,s=>s.toUpperCase()), String(v)]);
  const resultRows = Object.entries(results).map(([k, v]) => [k.replace(/([A-Z])/g,' $1').replace(/^./,s=>s.toUpperCase()), String(v)]);
  const now = new Date().toLocaleString('en-PK');
  const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
<head><meta charset="UTF-8"><style>
body{font-family:Arial;font-size:11pt}.header{background:#0F2942;color:white;font-weight:bold;font-size:14pt;padding:8px}
.subheader{background:#0D7A6B;color:white;font-size:10pt;padding:4px 8px}
.section-title{background:#E4F4F1;color:#0F2942;font-weight:bold;padding:6px 8px}
.col-header{background:#0F2942;color:white;font-weight:bold;padding:5px 8px}
.result-header{background:#0D7A6B;color:white;font-weight:bold;padding:5px 8px}
.even{background:#F4F7FA}.odd{background:white}.value{font-weight:bold;color:#0D7A6B}
.meta{color:#4A6080;font-size:9pt}td,th{padding:5px 8px;border:1px solid #D8E4EE}
</style></head><body><table>
<tr><td colspan="2" class="header">TextileIE — Industrial Engineering Suite</td></tr>
<tr><td colspan="2" class="subheader">Report: ${r.title}</td></tr>
<tr><td colspan="2" class="meta">Generated: ${now} | Type: ${r.type.toUpperCase()}</td></tr>
<tr><td colspan="2"></td></tr>
<tr><td colspan="2" class="section-title">INPUTS</td></tr>
<tr><th class="col-header">Parameter</th><th class="col-header">Value</th></tr>
${inputRows.map((row,i)=>`<tr class="${i%2===0?'even':'odd'}"><td>${row[0]}</td><td class="value">${row[1]}</td></tr>`).join('')}
<tr><td colspan="2"></td></tr>
<tr><td colspan="2" class="section-title">RESULTS</td></tr>
<tr><th class="result-header">Metric</th><th class="result-header">Value</th></tr>
${resultRows.map((row,i)=>`<tr class="${i%2===0?'even':'odd'}"><td>${row[0]}</td><td class="value">${row[1]}</td></tr>`).join('')}
<tr><td colspan="2"></td></tr>
<tr><td colspan="2" class="meta">TextileIE © ${new Date().getFullYear()}</td></tr>
</table></body></html>`;
  const blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = 'TextileIE-' + r.type + '-' + Date.now() + '.xls';
  document.body.appendChild(a); a.click();
  document.body.removeChild(a); URL.revokeObjectURL(url);
}

function exportAllReportsExcel(reports, companyName) {
  const now  = new Date().toLocaleString('en-PK');
  const rows = reports.map((r,i) => `<tr class="${i%2===0?'even':'odd'}"><td>${i+1}</td><td>${r.title}</td><td>${TYPE_LABEL[r.type]||r.type}</td><td class="value">${getKeyResultStr(r)}</td><td>${new Date(r.created_at).toLocaleDateString('en-PK')}</td><td>${r.is_starred?'★':''}</td></tr>`).join('');
  const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
<head><meta charset="UTF-8"><style>
body{font-family:Arial;font-size:11pt}.header{background:#0F2942;color:white;font-weight:bold;font-size:14pt;padding:8px}
.subheader{background:#0D7A6B;color:white;font-size:10pt;padding:4px 8px}
.col-header{background:#0F2942;color:white;font-weight:bold;padding:6px 8px}
.even{background:#F4F7FA}.odd{background:white}.value{font-weight:bold;color:#0D7A6B}
.meta{color:#4A6080;font-size:9pt}td,th{padding:5px 8px;border:1px solid #D8E4EE}
</style></head><body><table>
<tr><td colspan="6" class="header">TextileIE — All Reports Export</td></tr>
<tr><td colspan="6" class="subheader">${companyName||'Factory'} | Generated: ${now}</td></tr>
<tr><td colspan="6"></td></tr>
<tr><th class="col-header">#</th><th class="col-header">Report Title</th><th class="col-header">Type</th><th class="col-header">Key Result</th><th class="col-header">Date</th><th class="col-header">Starred</th></tr>
${rows}
<tr><td colspan="6"></td></tr>
<tr><td colspan="6" class="meta">Total: ${reports.length} reports | TextileIE © ${new Date().getFullYear()}</td></tr>
</table></body></html>`;
  const blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = 'TextileIE-All-Reports-' + Date.now() + '.xls';
  document.body.appendChild(a); a.click();
  document.body.removeChild(a); URL.revokeObjectURL(url);
}

// ── IE Analysis engine ────────────────────────────────────────
function analyzeReport(r) {
  const inp = r.inputs  || {};
  const res = r.results || {};

  if (r.type === 'efficiency') {
    const eff  = Number(res.efficiency || 0);
    const lost = Number(res.lostMinutes || 0);
    const gap  = Number(res.targetOutput || 0) - Number(inp.unitsProduced || 0);
    const status = eff >= 75 ? 'excellent' : eff >= 55 ? 'acceptable' : eff >= 40 ? 'below_target' : 'critical';
    const problems = [];
    const recs     = [];

    if (eff < 75) problems.push({ issue: 'Efficiency ' + eff + '% below 75% target', impact: lost.toFixed(0) + ' minutes lost per shift. ' + gap + ' pieces short of target.' });
    if (eff < 55) problems.push({ issue: 'Critically low performance', impact: 'Immediate supervisor intervention required. Check absenteeism, machine breakdowns, material supply.' });

    if (eff < 60) recs.push({ action: 'Conduct immediate time study — identify top 3 bottleneck operations and resolve', improvement: '8-12%', priority: 'high', timeline: 'This week' });
    recs.push({ action: 'Set hourly targets on whiteboard — supervisor to monitor every 2 hours', improvement: '5-8%', priority: 'high', timeline: 'Immediate' });
    recs.push({ action: 'Balance line — redistribute work from overloaded to idle operators', improvement: '6-10%', priority: 'high', timeline: '2-3 days' });
    recs.push({ action: 'Check rework rate — retrain operators with >5% rejection', improvement: '4-7%', priority: 'medium', timeline: 'This week' });
    recs.push({ action: 'Ensure material reaches line 30 min before shift start', improvement: '3-5%', priority: 'medium', timeline: 'Immediate' });

    const steps = eff < 50
      ? ['Week 1: Fix attendance and material issues → 50%', 'Week 2-3: Line balance and bottleneck removal → 60%', 'Week 4-6: Quality control and skill development → 70%', 'Month 2-3: Monitoring and incentives → 75%+']
      : eff < 65
      ? ['Week 1-2: Hourly monitoring and supervision → 65%', 'Week 3-4: Line balancing and rework reduction → 70%', 'Month 2: Skills and incentives → 75%+']
      : ['Week 1: Identify remaining bottlenecks → 75%', 'Week 2-3: Fine-tune line balance → 78%', 'Month 2: Incentive system → 80%+'];

    const quickWins = [
      'Post daily target and actual on whiteboard — visible to all',
      'Walk the line every 30 minutes — remove idle operators',
      'No machine idle >5 min without supervisor action',
      'Check WIP between operations — large WIP = line imbalance',
      'Brief operators on daily target at shift start'
    ];

    // Chart data
    const gaugeData = [{ name: 'Efficiency', value: eff, fill: eff >= 75 ? '#059669' : eff >= 55 ? '#D97706' : '#DC2626' }];
    const compData  = [
      { name: 'Earned', value: Number(res.earnedMinutes || 0), fill: '#0D7A6B' },
      { name: 'Lost',   value: Number(res.lostMinutes   || 0), fill: '#DC2626' }
    ];
    const targetData = [
      { name: 'Produced',    value: Number(inp.unitsProduced || 0) },
      { name: 'Target (100%)', value: Number(res.targetOutput  || 0) }
    ];

    return { status, summary: `Line efficiency is ${eff}% — ${eff >= 75 ? 'World class!' : eff >= 55 ? 'Acceptable, push to 75%.' : 'Below target, urgent action needed.'}`, problems, recs, steps, quickWins, gaugeData, compData, targetData, mainValue: eff + '%', mainLabel: 'Efficiency' };
  }

  if (r.type === 'capacity') {
    const daily   = Number(res.dailyCapacity  || 0);
    const monthly = Number(res.monthlyCapacity || 0);
    const eff     = Number(inp.efficiencyPct  || 75);
    const maxDaily = inp.smv > 0 ? Math.floor((inp.machines * inp.shiftsPerDay * inp.shiftMinutes) / inp.smv) : 0;
    const unused  = maxDaily - daily;
    const status  = eff >= 80 ? 'excellent' : eff >= 65 ? 'acceptable' : eff >= 50 ? 'below_target' : 'critical';

    const problems = [];
    if (unused > 0) problems.push({ issue: unused.toLocaleString() + ' pcs/day of capacity wasted', impact: 'Monthly loss: ' + (unused * 26).toLocaleString() + ' pieces due to efficiency gap.' });
    if (inp.shiftsPerDay === 1) problems.push({ issue: 'Single shift only', impact: 'Adding second shift doubles capacity to ' + (daily * 2).toLocaleString() + ' pcs/day with same machines.' });

    const recs = [
      { action: 'Improve efficiency from ' + eff + '% to 75% — adds ' + Math.floor(maxDaily * 0.10).toLocaleString() + ' pcs/day without new machines', improvement: Math.floor(unused * 0.5).toLocaleString() + ' pcs/day', priority: 'high', timeline: '2-4 weeks' },
      { action: 'Implement preventive maintenance — machine breakdowns cause 5-10% capacity loss', improvement: '5-8% capacity', priority: 'medium', timeline: '2 weeks' },
      { action: 'Reduce style changeover time to <2 hours — pre-plan next style', improvement: '3-5% capacity', priority: 'medium', timeline: '2 weeks' },
    ];
    if (inp.shiftsPerDay === 1) recs.unshift({ action: 'Add second shift — immediately doubles capacity', improvement: daily.toLocaleString() + ' pcs/day extra', priority: 'high', timeline: '1 week' });

    const steps = ['Month 1: Improve efficiency to 75% → ' + Math.floor(maxDaily * 0.75).toLocaleString() + ' pcs/day', 'Month 2: Reduce changeover and maintenance issues → +5-8% capacity', 'Month 3: Target 80% efficiency → ' + Math.floor(maxDaily * 0.80).toLocaleString() + ' pcs/day', 'Quarter 2: Review if additional lines/shifts needed'];
    const quickWins = ['Track machine downtime daily — idle >15 min must be reported', 'Pre-position all materials 30 min before shift', 'Calculate daily utilization: (Actual ÷ Max possible) × 100', 'Review shift output at day end — plan corrections for next day'];

    const compData  = [{ name: 'Actual', value: daily, fill: '#0D7A6B' }, { name: 'Potential', value: maxDaily, fill: '#0F2942' }];
    const periodData = [{ name: 'Daily', value: daily }, { name: 'Weekly', value: Number(res.weeklyCapacity || daily * 6) }, { name: 'Monthly', value: monthly }];

    return { status, summary: `Daily capacity is ${daily.toLocaleString()} pcs. ${unused > 0 ? `${unused.toLocaleString()} pcs/day unused capacity due to efficiency gap.` : 'Running at full potential!'}`, problems, recs, steps, quickWins, compData, periodData, mainValue: daily.toLocaleString() + ' pcs', mainLabel: 'Daily capacity' };
  }

  return null;
}

// ── Report Detail Modal ───────────────────────────────────────
const STATUS_COLOR = { critical: 'var(--red)', below_target: 'var(--amber)', acceptable: 'var(--blue)', excellent: 'var(--green)' };
const STATUS_BG    = { critical: 'var(--red-light)', below_target: 'var(--amber-light)', acceptable: 'var(--blue-light)', excellent: 'var(--green-light)' };
const STATUS_LABEL = { critical: 'Critical', below_target: 'Below target', acceptable: 'Acceptable', excellent: 'World class' };
const PRI_COLOR    = { high: 'var(--red)', medium: 'var(--amber)', low: 'var(--green)' };
const COLORS       = ['#0D7A6B','#0F2942','#D97706','#059669','#7C3AED','#EA580C'];

function ReportDetailModal({ report, onClose, onExportPDF, onExportExcel }) {
  const analysis = analyzeReport(report);
  const inp      = report.inputs  || {};
  const res      = report.results || {};

  const inputRows  = Object.entries(inp).map(([k, v]) => [k.replace(/([A-Z])/g,' $1').replace(/^./,s=>s.toUpperCase()), String(v)]);
  const resultRows = Object.entries(res).map(([k, v]) => [k.replace(/([A-Z])/g,' $1').replace(/^./,s=>s.toUpperCase()), String(v)]);

  // Build chart data for non-efficiency/capacity types
  const genericChartData = resultRows
    .filter(([, v]) => !isNaN(parseFloat(v)) && parseFloat(v) > 0)
    .slice(0, 6)
    .map(([k, v]) => ({ name: k.split(' ').slice(0, 2).join(' '), value: parseFloat(v) }));

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ background: 'white', borderRadius: 16, width: '100%', maxWidth: 780, maxHeight: '94vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 24px 64px rgba(0,0,0,0.3)' }}>

        {/* Header */}
        <div style={{ padding: '16px 20px', background: 'var(--navy)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div style={{ flex: 1, paddingRight: 12 }}>
            <div style={{ color: 'white', fontWeight: 700, fontSize: 15, lineHeight: 1.3 }}>{report.title}</div>
            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, marginTop: 3 }}>
              {new Date(report.created_at).toLocaleDateString('en-PK', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button onClick={onExportPDF} className="btn btn-sm" style={{ background: 'rgba(255,255,255,0.15)', color: 'white', border: 'none' }}><Download size={13} /> PDF</button>
            <button onClick={onExportExcel} className="btn btn-sm" style={{ background: '#217346', color: 'white', border: 'none' }}><FileText size={13} /> Excel</button>
            <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 8, color: 'white', cursor: 'pointer', padding: 8 }}><X size={16} /></button>
          </div>
        </div>

        {/* Body */}
        <div style={{ overflowY: 'auto', flex: 1, padding: 20 }}>

          {/* IE Analysis for efficiency and capacity */}
          {analysis && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 20 }}>

              {/* Status */}
              <div style={{ padding: '14px 16px', borderRadius: 10, background: STATUS_BG[analysis.status], border: '1px solid ' + STATUS_COLOR[analysis.status] + '40', display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <TrendingUp size={15} color={STATUS_COLOR[analysis.status]} />
                    <span style={{ fontWeight: 700, fontSize: 13, color: STATUS_COLOR[analysis.status] }}>{STATUS_LABEL[analysis.status]}</span>
                  </div>
                  <p style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.6 }}>{analysis.summary}</p>
                </div>
                <div style={{ textAlign: 'center', flexShrink: 0 }}>
                  <div style={{ fontSize: 26, fontWeight: 700, color: STATUS_COLOR[analysis.status], fontFamily: 'JetBrains Mono' }}>{analysis.mainValue}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{analysis.mainLabel}</div>
                </div>
              </div>

              {/* Charts */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                {/* Chart 1 — Efficiency gauge or capacity actual vs potential */}
                {analysis.compData && (
                  <div className="card" style={{ padding: 14 }}>
                    <h3 style={{ marginBottom: 12, fontSize: 13 }}>
                      {report.type === 'efficiency' ? 'Minutes breakdown' : 'Actual vs potential'}
                    </h3>
                    <ResponsiveContainer width="100%" height={160}>
                      <BarChart data={analysis.compData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                        <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 10 }} />
                        <Tooltip />
                        <Bar dataKey="value" radius={[4,4,0,0]}>
                          {analysis.compData.map((d, i) => <Cell key={i} fill={d.fill} />)}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {/* Chart 2 — Target vs produced OR period capacity */}
                {(analysis.targetData || analysis.periodData) && (
                  <div className="card" style={{ padding: 14 }}>
                    <h3 style={{ marginBottom: 12, fontSize: 13 }}>
                      {analysis.targetData ? 'Produced vs target' : 'Capacity by period'}
                    </h3>
                    <ResponsiveContainer width="100%" height={160}>
                      <BarChart data={analysis.targetData || analysis.periodData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                        <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 10 }} tickFormatter={v => v > 999 ? (v/1000).toFixed(0)+'k' : v} />
                        <Tooltip formatter={v => [v.toLocaleString(), '']} />
                        <Bar dataKey="value" fill="var(--teal)" radius={[4,4,0,0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

              {/* Efficiency radial gauge */}
              {report.type === 'efficiency' && (
                <div className="card" style={{ padding: 14 }}>
                  <h3 style={{ marginBottom: 12, fontSize: 13 }}>Efficiency gauge</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                    {[
                      { label: 'Efficiency', value: Number(res.efficiency || 0), max: 100, unit: '%', color: Number(res.efficiency) >= 75 ? '#059669' : Number(res.efficiency) >= 55 ? '#D97706' : '#DC2626' },
                      { label: 'Earned min', value: Number(res.earnedMinutes || 0), max: Number(res.availableMinutes || 1), unit: ' min', color: '#0D7A6B' },
                      { label: 'Output/op', value: Number(res.outputPerOperator || 0), max: Number(res.targetOutput || 1) / Number(inp.operators || 1), unit: ' pcs', color: '#0F2942' }
                    ].map((g, i) => {
                      const pct = Math.min(100, (g.value / g.max) * 100);
                      return (
                        <div key={i} style={{ textAlign: 'center', padding: 12, background: 'var(--bg)', borderRadius: 10 }}>
                          <div style={{ position: 'relative', width: 80, height: 80, margin: '0 auto 8px' }}>
                            <svg viewBox="0 0 80 80" width="80" height="80">
                              <circle cx="40" cy="40" r="32" fill="none" stroke="var(--border-light)" strokeWidth="8" />
                              <circle cx="40" cy="40" r="32" fill="none" stroke={g.color} strokeWidth="8"
                                strokeDasharray={`${pct * 2.01} 201`}
                                strokeLinecap="round" transform="rotate(-90 40 40)" />
                            </svg>
                            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: g.color, fontFamily: 'JetBrains Mono' }}>
                              {g.value.toFixed(0)}{g.unit === '%' ? '%' : ''}
                            </div>
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{g.label}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Problems */}
              {analysis.problems?.length > 0 && (
                <div className="card" style={{ padding: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                    <AlertTriangle size={14} color="var(--amber)" />
                    <h3 style={{ color: 'var(--amber)', fontSize: 13 }}>Problems identified</h3>
                  </div>
                  {analysis.problems.map((p, i) => (
                    <div key={i} style={{ padding: '9px 12px', marginBottom: 6, borderRadius: 8, background: 'var(--amber-light)' }}>
                      <div style={{ fontWeight: 600, fontSize: 12, color: 'var(--amber)', marginBottom: 3 }}>{p.issue}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{p.impact}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* Recommendations */}
              {analysis.recs?.length > 0 && (
                <div className="card" style={{ padding: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                    <CheckCircle size={14} color="var(--green)" />
                    <h3 style={{ color: 'var(--green)', fontSize: 13 }}>Recommendations</h3>
                  </div>
                  {analysis.recs.map((rec, i) => (
                    <div key={i} style={{ padding: '9px 12px', marginBottom: 6, borderRadius: 8, background: 'var(--bg)', border: '1px solid var(--border-light)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                        <div style={{ fontWeight: 600, fontSize: 12, flex: 1, paddingRight: 8, lineHeight: 1.5 }}>{i+1}. {rec.action}</div>
                        <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 20, background: (PRI_COLOR[rec.priority]||'var(--teal)') + '20', color: PRI_COLOR[rec.priority]||'var(--teal)', flexShrink: 0, textTransform: 'uppercase' }}>{rec.priority}</span>
                      </div>
                      <div style={{ display: 'flex', gap: 12 }}>
                        <span style={{ fontSize: 11, color: 'var(--green)', fontWeight: 600 }}>+{rec.improvement}</span>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>⏱ {rec.timeline}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Target plan */}
              {analysis.steps?.length > 0 && (
                <div className="card" style={{ padding: 14, background: 'var(--navy)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                    <Target size={14} color="var(--teal)" />
                    <h3 style={{ color: 'white', fontSize: 13 }}>Roadmap to target</h3>
                  </div>
                  {analysis.steps.map((step, i) => (
                    <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 8 }}>
                      <span style={{ width: 22, height: 22, borderRadius: '50%', background: 'var(--teal)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, flexShrink: 0, color: 'white' }}>{i+1}</span>
                      <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.85)', lineHeight: 1.6 }}>{step}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Quick wins */}
              {analysis.quickWins?.length > 0 && (
                <div className="card" style={{ padding: 14, background: 'var(--green-light)', border: '1px solid #6EE7B740' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                    <Lightbulb size={14} color="var(--green)" />
                    <h3 style={{ color: 'var(--green)', fontSize: 13 }}>Quick wins — do today!</h3>
                  </div>
                  {analysis.quickWins.map((win, i) => (
                    <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 6, fontSize: 12, lineHeight: 1.5 }}>
                      <span style={{ color: 'var(--green)', fontWeight: 700, flexShrink: 0 }}>✓</span> {win}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Generic chart for other types */}
          {!analysis && genericChartData.length > 0 && (
            <div className="card" style={{ padding: 14, marginBottom: 20 }}>
              <h3 style={{ marginBottom: 14, fontSize: 13 }}>Results overview</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={genericChartData} margin={{ top: 5, right: 5, left: -10, bottom: 5 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Bar dataKey="value" radius={[4,4,0,0]}>
                    {genericChartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Raw data tables */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div className="card" style={{ padding: 14 }}>
              <h3 style={{ marginBottom: 12, fontSize: 13, color: 'var(--text-secondary)' }}>📥 Inputs</h3>
              {inputRows.map(([k, v], i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid var(--border-light)', fontSize: 12 }}>
                  <span style={{ color: 'var(--text-muted)' }}>{k}</span>
                  <span style={{ fontWeight: 500, fontFamily: 'JetBrains Mono' }}>{v}</span>
                </div>
              ))}
            </div>
            <div className="card" style={{ padding: 14 }}>
              <h3 style={{ marginBottom: 12, fontSize: 13, color: 'var(--teal)' }}>📊 Results</h3>
              {resultRows.map(([k, v], i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid var(--border-light)', fontSize: 12 }}>
                  <span style={{ color: 'var(--text-muted)' }}>{k}</span>
                  <span style={{ fontWeight: 600, color: 'var(--teal)', fontFamily: 'JetBrains Mono' }}>{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// MAIN REPORTS PAGE
// ════════════════════════════════════════════════════════════
export default function ReportsPage() {
  const [reports, setReports]       = useState([]);
  const [loading, setLoading]       = useState(true);
  const [typeFilter, setTypeFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [search, setSearch]         = useState('');
  const [starOnly, setStarOnly]     = useState(false);
  const [selected, setSelected]     = useState(null);
  const { profile } = useAuth();
  const { toast, ToastContainer } = useToast();

  const load = async () => {
    setLoading(true);
    try {
      const data = await getReports({ type: typeFilter !== 'all' ? typeFilter : undefined, starred: starOnly || undefined });
      setReports(data);
    } catch { toast('Failed to load reports', 'error'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [typeFilter, starOnly]);

  const del = async (id) => {
    if (!confirm('Delete this report?')) return;
    try { await deleteReport(id); setReports(r => r.filter(x => x.id !== id)); toast('Report deleted'); }
    catch { toast('Failed to delete', 'error'); }
  };

  const star = async (id, current) => {
    try {
      const updated = await toggleStar(id, current);
      setReports(r => r.map(x => x.id === id ? { ...x, is_starred: updated.is_starred } : x));
    } catch { toast('Failed to update', 'error'); }
  };

  const filtered = filterByDate(
    reports.filter(r =>
      r.title.toLowerCase().includes(search.toLowerCase()) ||
      (TYPE_LABEL[r.type] || '').toLowerCase().includes(search.toLowerCase())
    ),
    dateFilter
  );

  // Grouped by date
  const grouped = filtered.reduce((acc, r) => {
    const dk = new Date(r.created_at).toLocaleDateString('en-PK', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    if (!acc[dk]) acc[dk] = [];
    acc[dk].push(r);
    return acc;
  }, {});

  // Dashboard stats
  const byType = reports.reduce((acc, r) => { acc[r.type] = (acc[r.type] || 0) + 1; return acc; }, {});
  const typeChartData = Object.entries(byType).map(([t, c]) => ({ name: TYPE_LABEL[t] || t, value: c, fill: TYPE_COLOR[t] || '#0D7A6B' }));
  const effReports  = reports.filter(r => r.type === 'efficiency' && r.results?.efficiency);
  const effTrend    = effReports.slice(-8).map((r, i) => ({ name: 'Rep ' + (i+1), eff: Number(r.results.efficiency) }));

  return (
    <div>
      <ToastContainer />
      {selected && (
        <ReportDetailModal
          report={selected}
          onClose={() => setSelected(null)}
          onExportPDF={() => { exportReportPDF({ type: selected.type, title: selected.title, inputs: selected.inputs, results: selected.results, companyName: profile?.company_name, userName: profile?.full_name }); }}
          onExportExcel={() => exportReportExcel(selected)}
        />
      )}

      <PageHeader title="Reports" subtitle="All saved calculation reports with visual analytics" />

      {/* Dashboard charts */}
      {reports.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: effTrend.length > 1 ? '1fr 1fr' : '1fr', gap: 16, marginBottom: 24 }}>
          {typeChartData.length > 0 && (
            <div className="card" style={{ padding: 16 }}>
              <h3 style={{ marginBottom: 14, fontSize: 13 }}>Reports by type</h3>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={typeChartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Bar dataKey="value" radius={[4,4,0,0]}>
                    {typeChartData.map((d, i) => <Cell key={i} fill={d.fill} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
          {effTrend.length > 1 && (
            <div className="card" style={{ padding: 16 }}>
              <h3 style={{ marginBottom: 14, fontSize: 13 }}>Efficiency trend</h3>
              <ResponsiveContainer width="100%" height={160}>
                <LineChart data={effTrend} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                  <Tooltip formatter={v => [v + '%', 'Efficiency']} />
                  <Line type="monotone" dataKey="eff" stroke="var(--teal)" strokeWidth={2} dot={{ fill: 'var(--teal)', r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}

      {/* Search + actions */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 180 }}>
          <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search reports..." style={{ paddingLeft: 30, width: '100%' }} />
        </div>
        <button className={`btn btn-sm ${starOnly ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setStarOnly(s => !s)}>
          <Star size={13} /> Starred
        </button>
        {filtered.length > 0 && (
          <button className="btn btn-sm" onClick={() => exportAllReportsExcel(filtered, profile?.company_name)} style={{ background: '#217346', color: 'white', border: 'none' }}>
            <FileText size={13} /> Export all Excel
          </button>
        )}
      </div>

      {/* Date filter */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 10, overflowX: 'auto', WebkitOverflowScrolling: 'touch', paddingBottom: 2 }}>
        <Calendar size={13} style={{ color: 'var(--text-muted)', flexShrink: 0, marginTop: 7 }} />
        {DATE_FILTERS.map(f => (
          <button key={f.value} onClick={() => setDateFilter(f.value)}
            className={`btn btn-sm ${dateFilter === f.value ? 'btn-primary' : 'btn-secondary'}`} style={{ flexShrink: 0 }}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Type filter */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16, overflowX: 'auto', WebkitOverflowScrolling: 'touch', paddingBottom: 4 }}>
        {FILTER_TABS.map(t => (
          <button key={t} onClick={() => setTypeFilter(t)}
            className={`btn btn-sm ${typeFilter === t ? 'btn-primary' : 'btn-secondary'}`} style={{ textTransform: 'capitalize', flexShrink: 0 }}>
            {t === 'all' ? 'All types' : TYPE_LABEL[t] || t}
          </button>
        ))}
      </div>

      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 14 }}>
        {filtered.length} report{filtered.length !== 1 ? 's' : ''}
        {dateFilter !== 'all' && <span style={{ marginLeft: 6, color: 'var(--teal)', fontWeight: 500 }}>({DATE_FILTERS.find(f=>f.value===dateFilter)?.label})</span>}
      </div>

      {/* Reports list */}
      {loading ? (
        <div className="empty-state"><p>Loading reports...</p></div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <FileText size={32} color="var(--border)" />
          <p>{reports.length === 0 ? 'No reports yet. Run any calculator and save.' : 'No reports match your filters.'}</p>
        </div>
      ) : (
        <div>
          {Object.entries(grouped).map(([date, items]) => (
            <div key={date} style={{ marginBottom: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, paddingBottom: 8, borderBottom: '2px solid var(--border-light)' }}>
                <Calendar size={13} color="var(--teal)" />
                <span style={{ fontSize: 13, fontWeight: 600 }}>{date}</span>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{items.length} report{items.length !== 1 ? 's' : ''}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {items.map(r => (
                  <div key={r.id} className="card" style={{ padding: '14px 16px', cursor: 'pointer', transition: 'box-shadow 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.boxShadow = 'var(--shadow-md)'}
                    onMouseLeave={e => e.currentTarget.style.boxShadow = ''}>

                    {/* Top row */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }} onClick={() => setSelected(r)}>
                      <div style={{ flex: 1, paddingRight: 12 }}>
                        <div style={{ fontWeight: 600, fontSize: 14, lineHeight: 1.4 }}>{r.title}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                          {new Date(r.created_at).toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' })}
                          <span style={{ marginLeft: 8, color: 'var(--teal)', fontSize: 11 }}>Tap to view analysis →</span>
                        </div>
                      </div>
                      <button onClick={e => { e.stopPropagation(); star(r.id, r.is_starred); }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, flexShrink: 0 }}>
                        <Star size={16} color={r.is_starred ? 'var(--amber)' : 'var(--border)'} fill={r.is_starred ? 'var(--amber)' : 'none'} />
                      </button>
                    </div>

                    {/* Badge + result */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }} onClick={() => setSelected(r)}>
                      <span className={`badge badge-${TYPE_BADGE[r.type] || 'teal'}`}>{TYPE_LABEL[r.type] || r.type}</span>
                      <span style={{ fontSize: 13, fontFamily: 'JetBrains Mono', color: 'var(--teal)', fontWeight: 600 }}>{getKeyResultStr(r)}</span>
                      {(r.type === 'efficiency' || r.type === 'capacity') && (
                        <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <BarChart2 size={12} /> View charts & analysis
                        </span>
                      )}
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                      <button className="btn btn-secondary btn-sm" onClick={() => exportReportPDF({ type: r.type, title: r.title, inputs: r.inputs, results: r.results, companyName: profile?.company_name, userName: profile?.full_name })} style={{ justifyContent: 'center' }}>
                        <Download size={12} /> PDF
                      </button>
                      <button className="btn btn-sm" onClick={() => exportReportExcel(r)} style={{ justifyContent: 'center', background: '#217346', color: 'white', border: 'none' }}>
                        <FileText size={12} /> Excel
                      </button>
                      <button className="btn btn-danger btn-sm" onClick={() => del(r.id)} style={{ justifyContent: 'center' }}>
                        <Trash2 size={12} /> Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
