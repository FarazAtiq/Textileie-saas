import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, Factory, Clock, Layers, FileText, ChevronRight, Scissors, DollarSign, Hash, Star } from 'lucide-react';
import { getReportStats } from '../lib/db.js';
import { useAuth } from '../hooks/useAuth';
import { PageHeader } from '../components/ResultCard';

const CALC_CARDS = [
  { to: '/efficiency', icon: TrendingUp, label: 'Efficiency',       desc: 'Line & operator %',        color: '#E4F4F1', ic: 'var(--teal)' },
  { to: '/capacity',   icon: Factory,    label: 'Capacity',          desc: 'Daily / monthly output',   color: '#EFF6FF', ic: 'var(--blue)' },
  { to: '/smv',        icon: Clock,      label: 'SMV / SAM',         desc: 'Operation breakdown',      color: '#FEF3C7', ic: 'var(--amber)' },
  { to: '/fabric',     icon: Layers,     label: 'Fabric',            desc: 'Yards & GSM method',       color: '#F0FDF4', ic: 'var(--green)' },
  { to: '/thread',     icon: Scissors,   label: 'Thread',            desc: 'By stitch class',          color: '#F5F3FF', ic: 'var(--purple)' },
  { to: '/costing',    icon: DollarSign, label: 'Costing',           desc: 'FOB price & margin',       color: '#FFF7ED', ic: 'var(--orange)' },
  { to: '/yarn',       icon: Hash,       label: 'Yarn Count',        desc: 'Ne / Tex / Nm convert',    color: '#FFF0F0', ic: 'var(--red)' },
];

const TYPE_BADGE = {
  efficiency: 'teal', capacity: 'navy', smv: 'amber',
  fabric: 'green', thread: 'purple', costing: 'orange', yarn: 'red'
};
const TYPE_LABEL = {
  efficiency: 'Efficiency', capacity: 'Capacity', smv: 'SMV',
  fabric: 'Fabric', thread: 'Thread', costing: 'Costing', yarn: 'Yarn'
};

export default function Dashboard() {
  const { user, profile } = useAuth();
  const [stats, setStats] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    getReportStats().then(setStats).catch(() => {});
  }, []);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div>
      <PageHeader
        title={`${greeting}, ${profile?.full_name?.split(' ')[0] || 'there'} 👋`}
        subtitle={`${profile?.company_name || ''} · Industrial Engineering Suite`}
      />

      {/* KPI metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 }}>
        {[
          { label: 'Total reports',    value: stats?.total ?? '—',             color: 'var(--teal)' },
          { label: 'Recent (last 5)',  value: stats?.recent?.length ?? '—',    color: 'var(--amber)' },
          { label: 'Calculators',      value: 7,                               color: 'var(--blue)' },
          { label: 'PDF export',       value: '✓',                             color: 'var(--green)' },
        ].map((s, i) => (
          <div key={i} className="card" style={{ padding: '16px 20px' }}>
            <div style={{ fontSize: 26, fontWeight: 600, color: s.color, fontFamily: 'JetBrains Mono, monospace' }}>{s.value}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 24 }}>
        {/* Calculator grid */}
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 12 }}>Calculators</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {CALC_CARDS.map(c => {
              const Icon = c.icon;
              return (
                <div key={c.to} className="card" onClick={() => navigate(c.to)} style={{ cursor: 'pointer', padding: 16 }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}>
                  <div style={{ width: 36, height: 36, background: c.color, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
                    <Icon size={17} color={c.ic} />
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{c.label}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 3 }}>{c.desc}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent reports */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Recent reports</div>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/reports')} style={{ color: 'var(--teal)', fontSize: 12 }}>
              View all <ChevronRight size={12} />
            </button>
          </div>
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            {!stats?.recent?.length ? (
              <div className="empty-state" style={{ padding: 36 }}>
                <FileText size={28} color="var(--border)" />
                <p>No reports yet — run any calculator and save.</p>
              </div>
            ) : (
              stats.recent.map((r, i) => (
                <div key={r.id} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '11px 16px', borderBottom: i < stats.recent.length - 1 ? '1px solid var(--border-light)' : 'none'
                }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.title}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                      {new Date(r.created_at).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0, marginLeft: 12 }}>
                    {r.is_starred && <Star size={12} color="var(--amber)" fill="var(--amber)" />}
                    <span className={`badge badge-${TYPE_BADGE[r.type] || 'teal'}`}>{TYPE_LABEL[r.type] || r.type}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
