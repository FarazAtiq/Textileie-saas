import { Save, Download } from 'lucide-react';

export function ResultRow({ label, value, highlight }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--border-light)' }}>
      <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 500, fontFamily: 'JetBrains Mono, monospace', color: highlight ? 'var(--teal)' : 'var(--text-primary)' }}>{value}</span>
    </div>
  );
}

export function ResultCard({ title, mainValue, mainLabel, rows, onSave, onExport, saving }) {
  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
      <h3 style={{ marginBottom: 16 }}>{title}</h3>
      {mainValue && (
        <div style={{ textAlign: 'center', padding: '12px 0 16px', borderBottom: '1px solid var(--border-light)', marginBottom: 16 }}>
          <div className="result-value">{mainValue}</div>
          {mainLabel && <div className="result-label" style={{ marginTop: 4 }}>{mainLabel}</div>}
        </div>
      )}
      <div style={{ flex: 1 }}>
        {rows.map((r, i) => <ResultRow key={i} {...r} />)}
      </div>
      {(onSave || onExport) && (
        <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
          {onSave && <button className="btn btn-primary btn-full" onClick={onSave} disabled={saving}><Save size={14} />{saving ? 'Saving...' : 'Save report'}</button>}
          {onExport && <button className="btn btn-secondary" onClick={onExport} title="Export PDF"><Download size={14} /></button>}
        </div>
      )}
    </div>
  );
}

export function PageHeader({ title, subtitle, badge }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <h1>{title}</h1>
        {badge && <span className={`badge badge-${badge.color || 'teal'}`}>{badge.text}</span>}
      </div>
      {subtitle && <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>{subtitle}</p>}
    </div>
  );
}

export function CalcGrid({ children }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, alignItems: 'start' }}>
      {children}
    </div>
  );
}

export function FormulaNote({ children }) {
  return (
    <div style={{ marginTop: 16, padding: '10px 14px', background: 'var(--teal-light)', borderRadius: 8, fontSize: 12, color: 'var(--teal)', lineHeight: 1.6 }}>
      <strong>Formula:</strong> {children}
    </div>
  );
}
