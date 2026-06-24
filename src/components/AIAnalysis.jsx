import { useState } from 'react';
import { Sparkles, X, TrendingUp, AlertTriangle, CheckCircle, Target } from 'lucide-react';
import { calcEfficiency, calcCapacity } from '../utils/calculations.js';

export function AIAnalysis({ type, data, results, lines }) {
  const [open, setOpen]       = useState(false);
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [error, setError]     = useState('');

  const getAnalysis = async () => {
    setLoading(true);
    setError('');
    setAnalysis(null);

    try {
      let prompt = '';
      const allLines = lines || [data];

      if (type === 'efficiency') {
        const linesText = allLines.map((l, i) => {
          const eff = l.operators > 0 && l.smv > 0
            ? ((l.unitsProduced * l.smv) / (l.shiftMinutes * l.operators) * 100).toFixed(1)
            : 0;
          return `Line ${l.lineNumber || i+1}${l.articleNumber ? ' Art#'+l.articleNumber : ''}: ${l.operators} operators, ${l.unitsProduced} units, SMV ${l.smv} min, Efficiency ${eff}%`;
        }).join('\n');

        prompt = `You are a textile factory Industrial Engineering consultant in Pakistan. Analyze this efficiency data and respond ONLY with valid JSON, no other text:

Lines data:
${linesText}
Target: 75% efficiency

Respond with this exact JSON structure:
{"overall_status":"below_target","average_efficiency":"30.0%","summary":"Brief 2 sentence assessment","problems":[{"issue":"problem name","impact":"what happens","lines_affected":"which lines"}],"recommendations":[{"action":"what to do","expected_improvement":"X% gain","priority":"high","timeline":"immediate"}],"target_plan":{"current_avg":"30%","target":"75%","gap":"45%","steps":["step1","step2","step3"]},"quick_wins":["win1","win2","win3"]}`;

      } else {
        const linesText = allLines.map((l, i) => {
          const daily = l.smv > 0 ? Math.floor((l.machines * l.shiftsPerDay * l.shiftMinutes * (l.efficiencyPct/100)) / l.smv) : 0;
          return `Line ${l.lineNumber || i+1}${l.articleNumber ? ' Art#'+l.articleNumber : ''}: ${l.machines} machines, ${l.shiftsPerDay} shifts, ${l.efficiencyPct}% eff, SMV ${l.smv} min, Daily: ${daily} pcs`;
        }).join('\n');

        const totalDaily = allLines.reduce((sum, l) => sum + (l.smv > 0 ? Math.floor((l.machines * l.shiftsPerDay * l.shiftMinutes * (l.efficiencyPct/100)) / l.smv) : 0), 0);

        prompt = `You are a textile factory Industrial Engineering consultant in Pakistan. Analyze this capacity data and respond ONLY with valid JSON, no other text:

Lines data:
${linesText}
Total daily: ${totalDaily} pcs

Respond with this exact JSON structure:
{"overall_status":"acceptable","total_daily_capacity":"${totalDaily} pcs","summary":"Brief 2 sentence assessment","problems":[{"issue":"bottleneck name","impact":"capacity lost","lines_affected":"which lines"}],"recommendations":[{"action":"what to do","expected_improvement":"X pcs/day","priority":"high","timeline":"immediate"}],"target_plan":{"current":"${totalDaily} pcs/day","potential":"estimated with improvements","steps":["step1","step2","step3"]},"quick_wins":["win1","win2","win3"]}`;
      }

      // Call Anthropic API
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': import.meta.env.VITE_ANTHROPIC_KEY || '',
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true'
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5',
          max_tokens: 1000,
          messages: [{ role: 'user', content: prompt }]
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error?.message || 'API error ' + response.status);
      }

      const result = await response.json();
      const text = result.content?.[0]?.text || '';

      // Parse JSON
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('Invalid response format');
      const parsed = JSON.parse(jsonMatch[0]);
      setAnalysis(parsed);

    } catch (err) {
      console.error('AI error:', err);
      setError('AI analysis failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const STATUS_COLOR = { critical: 'var(--red)', below_target: 'var(--amber)', acceptable: 'var(--blue)', excellent: 'var(--green)' };
  const STATUS_BG    = { critical: 'var(--red-light)', below_target: 'var(--amber-light)', acceptable: 'var(--blue-light)', excellent: 'var(--green-light)' };
  const PRI_COLOR    = { high: 'var(--red)', medium: 'var(--amber)', low: 'var(--green)' };

  return (
    <>
      <button onClick={() => { setOpen(true); getAnalysis(); }} style={{
        width: '100%', padding: '10px 16px',
        background: 'linear-gradient(135deg, #0F2942, #0D7A6B)',
        color: 'white', border: 'none', borderRadius: 8,
        fontSize: 13, fontWeight: 600, cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        gap: 8, fontFamily: 'inherit'
      }}>
        <Sparkles size={15} /> Get AI Analysis & Improvement Plan
      </button>

      {open && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ background: 'white', borderRadius: 16, width: '100%', maxWidth: 660, maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 24px 64px rgba(0,0,0,0.3)' }}>

            {/* Header */}
            <div style={{ padding: '16px 20px', background: 'linear-gradient(135deg, #0F2942, #0D7A6B)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Sparkles size={18} color="white" />
                <div>
                  <div style={{ color: 'white', fontWeight: 700, fontSize: 15 }}>AI Analysis & Improvement Plan</div>
                  <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11 }}>Powered by Claude AI</div>
                </div>
              </div>
              <button onClick={() => setOpen(false)} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 8, color: 'white', cursor: 'pointer', padding: 8 }}>
                <X size={16} />
              </button>
            </div>

            {/* Body */}
            <div style={{ overflowY: 'auto', flex: 1, padding: 20 }}>

              {/* Loading */}
              {loading && (
                <div style={{ textAlign: 'center', padding: '48px 24px' }}>
                  <div style={{ fontSize: 40, marginBottom: 16 }}>🤖</div>
                  <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 8 }}>Analyzing your factory data...</div>
                  <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Claude AI is reviewing your {type} data</div>
                  <div style={{ marginTop: 20, display: 'flex', justifyContent: 'center', gap: 6 }}>
                    {[0,1,2].map(i => (
                      <div key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--teal)', animation: `pulse 1.2s ease ${i*0.2}s infinite` }} />
                    ))}
                  </div>
                  <style>{`@keyframes pulse{0%,100%{opacity:0.3;transform:scale(0.8)}50%{opacity:1;transform:scale(1)}}`}</style>
                </div>
              )}

              {/* Error */}
              {error && !loading && (
                <div style={{ textAlign: 'center', padding: '32px 24px' }}>
                  <div style={{ fontSize: 32, marginBottom: 12 }}>⚠️</div>
                  <div style={{ fontSize: 13, color: 'var(--red)', marginBottom: 8, fontWeight: 500 }}>API Key Required</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 20, lineHeight: 1.6 }}>
                    To use AI analysis, add your Anthropic API key to Vercel environment variables.<br/>
                    Go to: Vercel → Settings → Environment Variables<br/>
                    Add: <code style={{ background: 'var(--bg)', padding: '2px 6px', borderRadius: 4 }}>VITE_ANTHROPIC_KEY</code> = your key<br/>
                    Get key at: <a href="https://console.anthropic.com" target="_blank" rel="noreferrer" style={{ color: 'var(--teal)' }}>console.anthropic.com</a>
                  </div>
                  <button className="btn btn-primary" onClick={getAnalysis}>Try again</button>
                </div>
              )}

              {/* Analysis */}
              {analysis && !loading && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

                  {/* Status */}
                  <div style={{ padding: '14px 16px', borderRadius: 10, background: STATUS_BG[analysis.overall_status] || 'var(--teal-light)', border: '1px solid ' + (STATUS_COLOR[analysis.overall_status] || 'var(--teal)') + '40' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                      <TrendingUp size={16} color={STATUS_COLOR[analysis.overall_status] || 'var(--teal)'} />
                      <span style={{ fontWeight: 700, fontSize: 14, color: STATUS_COLOR[analysis.overall_status] || 'var(--teal)', textTransform: 'capitalize' }}>
                        {(analysis.overall_status || '').replace('_', ' ')} — {analysis.average_efficiency || analysis.total_daily_capacity}
                      </span>
                    </div>
                    <p style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.6 }}>{analysis.summary}</p>
                  </div>

                  {/* Problems */}
                  {analysis.problems?.length > 0 && (
                    <div className="card" style={{ padding: 14 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                        <AlertTriangle size={15} color="var(--amber)" />
                        <h3 style={{ color: 'var(--amber)' }}>Problems identified</h3>
                      </div>
                      {analysis.problems.map((p, i) => (
                        <div key={i} style={{ padding: '10px 12px', marginBottom: 8, borderRadius: 8, background: 'var(--amber-light)', border: '1px solid #FCD34D40' }}>
                          <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--amber)', marginBottom: 3 }}>{p.issue}</div>
                          <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Impact: {p.impact}</div>
                          {p.lines_affected && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>Lines: {p.lines_affected}</div>}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Recommendations */}
                  {analysis.recommendations?.length > 0 && (
                    <div className="card" style={{ padding: 14 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                        <CheckCircle size={15} color="var(--green)" />
                        <h3 style={{ color: 'var(--green)' }}>Recommendations</h3>
                      </div>
                      {analysis.recommendations.map((rec, i) => (
                        <div key={i} style={{ padding: '10px 12px', marginBottom: 8, borderRadius: 8, background: 'var(--bg)', border: '1px solid var(--border-light)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                            <div style={{ fontWeight: 600, fontSize: 13, flex: 1, paddingRight: 8 }}>{i+1}. {rec.action}</div>
                            <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 20, background: (PRI_COLOR[rec.priority] || 'var(--teal)') + '20', color: PRI_COLOR[rec.priority] || 'var(--teal)', flexShrink: 0, textTransform: 'uppercase' }}>
                              {rec.priority}
                            </span>
                          </div>
                          <div style={{ display: 'flex', gap: 14, marginTop: 4 }}>
                            <span style={{ fontSize: 12, color: 'var(--green)', fontWeight: 500 }}>+{rec.expected_improvement}</span>
                            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{rec.timeline}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Target plan */}
                  {analysis.target_plan && (
                    <div className="card" style={{ padding: 14, background: 'var(--navy)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                        <Target size={15} color="var(--teal)" />
                        <h3 style={{ color: 'white' }}>Plan to reach target</h3>
                      </div>
                      <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
                        {[['Current', analysis.target_plan.current_avg || analysis.target_plan.current, 'var(--red)'], ['Target', analysis.target_plan.target || '75%', 'var(--green)'], ['Gap / Potential', analysis.target_plan.gap || analysis.target_plan.potential, 'var(--amber)']].map(([l, v, c]) => (
                          <div key={l} style={{ flex: 1, textAlign: 'center', padding: '8px 4px', background: 'rgba(255,255,255,0.08)', borderRadius: 8 }}>
                            <div style={{ fontSize: 15, fontWeight: 700, color: c, fontFamily: 'JetBrains Mono' }}>{v}</div>
                            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>{l}</div>
                          </div>
                        ))}
                      </div>
                      {(analysis.target_plan.steps || []).map((step, i) => (
                        <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 8, color: 'rgba(255,255,255,0.85)', fontSize: 13 }}>
                          <span style={{ width: 22, height: 22, borderRadius: '50%', background: 'var(--teal)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0, color: 'white' }}>{i+1}</span>
                          {step}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Quick wins */}
                  {analysis.quick_wins?.length > 0 && (
                    <div className="card" style={{ padding: 14, background: 'var(--green-light)', border: '1px solid #6EE7B740' }}>
                      <h3 style={{ color: 'var(--green)', marginBottom: 10 }}>Quick wins — do today!</h3>
                      {analysis.quick_wins.map((win, i) => (
                        <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8, fontSize: 13 }}>
                          <span style={{ color: 'var(--green)', fontWeight: 700 }}>✓</span> {win}
                        </div>
                      ))}
                    </div>
                  )}

                  <button onClick={getAnalysis} className="btn btn-secondary btn-full">
                    <Sparkles size={13} /> Regenerate analysis
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
