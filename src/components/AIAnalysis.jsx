import { useState } from 'react';
import { Sparkles, X, TrendingUp, AlertTriangle, CheckCircle, Target } from 'lucide-react';

export function AIAnalysis({ type, data, results, lines }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [error, setError] = useState('');

  const getAnalysis = async () => {
    setLoading(true);
    setError('');
    setAnalysis(null);

    try {
      // Build context for AI
      let prompt = '';

      if (type === 'efficiency') {
        const allLines = lines || [data];
        const linesText = allLines.map((l, i) => {
          const eff = l.operators > 0 && l.smv > 0
            ? ((l.unitsProduced * l.smv) / (l.shiftMinutes * l.operators) * 100).toFixed(1)
            : 0;
          return `Line ${l.lineNumber || i + 1}${l.articleNumber ? ' (Art#' + l.articleNumber + ')' : ''}: ${l.operators} operators, ${l.unitsProduced} units produced, SMV ${l.smv} min, Efficiency ${eff}%`;
        }).join('\n');

        prompt = `You are an expert Industrial Engineering consultant for a textile factory in Pakistan.

Analyze this factory efficiency data and provide specific actionable recommendations:

FACTORY: ${data.companyName || 'Textile Factory'}
SHIFT DURATION: ${data.shiftMinutes || 480} minutes

PRODUCTION LINES DATA:
${linesText}

TARGET EFFICIENCY: 75% (world class standard)

Please provide your analysis in this EXACT JSON format (no extra text):
{
  "overall_status": "critical|below_target|acceptable|excellent",
  "average_efficiency": "XX.X%",
  "summary": "2-3 sentence overall assessment",
  "problems": [
    {"issue": "specific problem", "impact": "what it causes", "lines_affected": "which lines"}
  ],
  "recommendations": [
    {"action": "specific action to take", "expected_improvement": "X% efficiency gain", "priority": "high|medium|low", "timeline": "immediate|1 week|1 month"}
  ],
  "target_plan": {
    "current_avg": "XX%",
    "target": "75%",
    "gap": "XX%",
    "steps": ["step 1", "step 2", "step 3"]
  },
  "quick_wins": ["quick win 1", "quick win 2", "quick win 3"]
}`;

      } else if (type === 'capacity') {
        const allLines = lines || [data];
        const linesText = allLines.map((l, i) => {
          const daily = l.smv > 0
            ? Math.floor((l.machines * l.shiftsPerDay * l.shiftMinutes * (l.efficiencyPct / 100)) / l.smv)
            : 0;
          return `Line ${l.lineNumber || i + 1}${l.articleNumber ? ' (Art#' + l.articleNumber + ')' : ''}: ${l.machines} machines, ${l.shiftsPerDay} shifts, ${l.efficiencyPct}% efficiency, Daily capacity: ${daily} pcs, SMV: ${l.smv} min`;
        }).join('\n');

        const totalDaily = allLines.reduce((sum, l) => {
          return sum + (l.smv > 0 ? Math.floor((l.machines * l.shiftsPerDay * l.shiftMinutes * (l.efficiencyPct / 100)) / l.smv) : 0);
        }, 0);

        prompt = `You are an expert Industrial Engineering consultant for a textile factory in Pakistan.

Analyze this factory capacity data and provide specific recommendations:

PRODUCTION LINES:
${linesText}

TOTAL DAILY CAPACITY: ${totalDaily} pieces

Please provide analysis in this EXACT JSON format (no extra text):
{
  "overall_status": "critical|below_target|acceptable|excellent",
  "total_daily_capacity": "${totalDaily} pcs",
  "summary": "2-3 sentence overall assessment",
  "problems": [
    {"issue": "specific bottleneck or problem", "impact": "capacity lost", "lines_affected": "which lines"}
  ],
  "recommendations": [
    {"action": "specific action", "expected_improvement": "X pcs/day increase", "priority": "high|medium|low", "timeline": "immediate|1 week|1 month"}
  ],
  "target_plan": {
    "current": "${totalDaily} pcs/day",
    "potential": "estimated potential with improvements",
    "steps": ["step 1", "step 2", "step 3"]
  },
  "quick_wins": ["quick win 1", "quick win 2", "quick win 3"]
}`;
      }

      // Call Anthropic API
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
          max_tokens: 1000,
          messages: [{ role: 'user', content: prompt }]
        })
      });

      const result = await response.json();
      const text = result.content?.[0]?.text || '';

      // Parse JSON from response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        setAnalysis(parsed);
      } else {
        throw new Error('Could not parse AI response');
      }

    } catch (err) {
      console.error('AI analysis error:', err);
      setError('Failed to get AI analysis. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const statusColor = {
    critical: 'var(--red)',
    below_target: 'var(--amber)',
    acceptable: 'var(--blue)',
    excellent: 'var(--green)'
  };

  const statusBg = {
    critical: 'var(--red-light)',
    below_target: 'var(--amber-light)',
    acceptable: 'var(--blue-light)',
    excellent: 'var(--green-light)'
  };

  const priorityColor = {
    high: 'var(--red)',
    medium: 'var(--amber)',
    low: 'var(--green)'
  };

  return (
    <>
      {/* AI Button */}
      <button
        onClick={() => { setOpen(true); getAnalysis(); }}
        style={{
          width: '100%', marginTop: 12, padding: '10px 16px',
          background: 'linear-gradient(135deg, #0F2942, #0D7A6B)',
          color: 'white', border: 'none', borderRadius: 8,
          fontSize: 13, fontWeight: 600, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          fontFamily: 'inherit'
        }}
      >
        <Sparkles size={15} />
        Get AI Analysis & Improvement Plan
      </button>

      {/* Modal overlay */}
      {open && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: 'rgba(0,0,0,0.6)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', padding: 16
        }}>
          <div style={{
            background: 'white', borderRadius: 16, width: '100%',
            maxWidth: 680, maxHeight: '90vh', display: 'flex',
            flexDirection: 'column', overflow: 'hidden',
            boxShadow: '0 24px 64px rgba(0,0,0,0.3)'
          }}>
            {/* Modal header */}
            <div style={{
              padding: '16px 20px', background: 'linear-gradient(135deg, #0F2942, #0D7A6B)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Sparkles size={18} color="white" />
                <div>
                  <div style={{ color: 'white', fontWeight: 700, fontSize: 15 }}>AI Analysis & Improvement Plan</div>
                  <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11 }}>Powered by Claude AI</div>
                </div>
              </div>
              <button onClick={() => setOpen(false)} style={{
                background: 'rgba(255,255,255,0.15)', border: 'none',
                borderRadius: 8, color: 'white', cursor: 'pointer', padding: 8
              }}>
                <X size={16} />
              </button>
            </div>

            {/* Modal body */}
            <div style={{ overflowY: 'auto', flex: 1, padding: 20 }}>

              {/* Loading state */}
              {loading && (
                <div style={{ textAlign: 'center', padding: '48px 24px' }}>
                  <div style={{ fontSize: 32, marginBottom: 16 }}>🤖</div>
                  <div style={{ fontSize: 15, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 8 }}>
                    Analyzing your factory data...
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                    Claude AI is reviewing your {type} data and generating recommendations
                  </div>
                  <div style={{ marginTop: 20, display: 'flex', justifyContent: 'center', gap: 6 }}>
                    {[0, 1, 2].map(i => (
                      <div key={i} style={{
                        width: 8, height: 8, borderRadius: '50%', background: 'var(--teal)',
                        animation: 'pulse 1.2s ease infinite',
                        animationDelay: i * 0.2 + 's'
                      }} />
                    ))}
                  </div>
                  <style>{`@keyframes pulse { 0%,100%{opacity:0.3;transform:scale(0.8)} 50%{opacity:1;transform:scale(1)} }`}</style>
                </div>
              )}

              {/* Error state */}
              {error && !loading && (
                <div style={{ textAlign: 'center', padding: '32px 24px' }}>
                  <div style={{ fontSize: 13, color: 'var(--red)', marginBottom: 16 }}>{error}</div>
                  <button className="btn btn-primary" onClick={getAnalysis}>Try again</button>
                </div>
              )}

              {/* Analysis result */}
              {analysis && !loading && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                  {/* Status banner */}
                  <div style={{
                    padding: '14px 18px', borderRadius: 10,
                    background: statusBg[analysis.overall_status] || 'var(--teal-light)',
                    border: '1px solid ' + (statusColor[analysis.overall_status] || 'var(--teal)') + '40'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                      <TrendingUp size={16} color={statusColor[analysis.overall_status] || 'var(--teal)'} />
                      <span style={{ fontWeight: 700, fontSize: 14, color: statusColor[analysis.overall_status] || 'var(--teal)', textTransform: 'capitalize' }}>
                        {(analysis.overall_status || '').replace('_', ' ')} — {analysis.average_efficiency || analysis.total_daily_capacity}
                      </span>
                    </div>
                    <p style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.6 }}>{analysis.summary}</p>
                  </div>

                  {/* Problems */}
                  {analysis.problems?.length > 0 && (
                    <div className="card" style={{ padding: 16 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                        <AlertTriangle size={16} color="var(--amber)" />
                        <h3 style={{ color: 'var(--amber)' }}>Problems identified</h3>
                      </div>
                      {analysis.problems.map((p, i) => (
                        <div key={i} style={{
                          padding: '10px 12px', marginBottom: 8, borderRadius: 8,
                          background: 'var(--amber-light)', border: '1px solid #FCD34D40'
                        }}>
                          <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--amber)', marginBottom: 3 }}>{p.issue}</div>
                          <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Impact: {p.impact}</div>
                          {p.lines_affected && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>Affects: {p.lines_affected}</div>}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Recommendations */}
                  {analysis.recommendations?.length > 0 && (
                    <div className="card" style={{ padding: 16 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                        <CheckCircle size={16} color="var(--green)" />
                        <h3 style={{ color: 'var(--green)' }}>Recommendations</h3>
                      </div>
                      {analysis.recommendations.map((rec, i) => (
                        <div key={i} style={{
                          padding: '12px 14px', marginBottom: 8, borderRadius: 8,
                          background: 'var(--bg)', border: '1px solid var(--border-light)'
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                            <div style={{ fontWeight: 600, fontSize: 13, flex: 1, paddingRight: 8 }}>{i + 1}. {rec.action}</div>
                            <span style={{
                              fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 20,
                              background: priorityColor[rec.priority] + '20',
                              color: priorityColor[rec.priority], flexShrink: 0,
                              textTransform: 'uppercase'
                            }}>
                              {rec.priority}
                            </span>
                          </div>
                          <div style={{ display: 'flex', gap: 16, marginTop: 6 }}>
                            <span style={{ fontSize: 12, color: 'var(--green)', fontWeight: 500 }}>
                              +{rec.expected_improvement}
                            </span>
                            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                              Timeline: {rec.timeline}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Target plan */}
                  {analysis.target_plan && (
                    <div className="card" style={{ padding: 16, background: 'var(--navy)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                        <Target size={16} color="var(--teal)" />
                        <h3 style={{ color: 'white' }}>Plan to reach target</h3>
                      </div>
                      <div style={{ display: 'flex', gap: 12, marginBottom: 14 }}>
                        {[
                          ['Current', analysis.target_plan.current_avg || analysis.target_plan.current, 'var(--red)'],
                          ['Target', analysis.target_plan.target || '75%', 'var(--green)'],
                          ['Gap', analysis.target_plan.gap || analysis.target_plan.potential, 'var(--amber)']
                        ].map(([l, v, c]) => (
                          <div key={l} style={{ flex: 1, textAlign: 'center', padding: '8px 4px', background: 'rgba(255,255,255,0.08)', borderRadius: 8 }}>
                            <div style={{ fontSize: 16, fontWeight: 700, color: c, fontFamily: 'JetBrains Mono' }}>{v}</div>
                            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>{l}</div>
                          </div>
                        ))}
                      </div>
                      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginBottom: 8 }}>Steps to achieve target:</div>
                      {(analysis.target_plan.steps || []).map((step, i) => (
                        <div key={i} style={{
                          display: 'flex', gap: 10, alignItems: 'flex-start',
                          marginBottom: 8, color: 'rgba(255,255,255,0.85)', fontSize: 13
                        }}>
                          <span style={{
                            width: 22, height: 22, borderRadius: '50%', background: 'var(--teal)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 11, fontWeight: 700, flexShrink: 0, color: 'white'
                          }}>{i + 1}</span>
                          {step}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Quick wins */}
                  {analysis.quick_wins?.length > 0 && (
                    <div className="card" style={{ padding: 16, background: 'var(--green-light)', border: '1px solid #6EE7B740' }}>
                      <h3 style={{ color: 'var(--green)', marginBottom: 10 }}>⚡ Quick wins (do today!)</h3>
                      {analysis.quick_wins.map((win, i) => (
                        <div key={i} style={{
                          display: 'flex', gap: 8, alignItems: 'flex-start',
                          marginBottom: 8, fontSize: 13, color: 'var(--text-primary)'
                        }}>
                          <span style={{ color: 'var(--green)', fontWeight: 700, flexShrink: 0 }}>✓</span>
                          {win}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Refresh button */}
                  <button
                    onClick={getAnalysis}
                    className="btn btn-secondary btn-full"
                    style={{ marginTop: 4 }}
                  >
                    <Sparkles size={14} /> Regenerate analysis
                  </button>

                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
