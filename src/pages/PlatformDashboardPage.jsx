import { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Building2,
  CheckCircle2,
  Clock3,
  Grid3X3,
  Plus,
  RefreshCw,
  ShieldCheck,
  UserPlus,
  Users,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.jsx';
import { useToast } from '../hooks/useToast.jsx';
import { PageHeader } from '../components/ResultCard.jsx';
import { getPlatformDashboardSummary } from '../lib/platformAdmin.js';

const EMPTY_DATA = {
  kpis: {
    totalCompanies: 0,
    activeCompanies: 0,
    trialCompanies: 0,
    suspendedCompanies: 0,
    expiredCompanies: 0,
    licensedSeats: 0,
    activeUsers: 0,
    availableSeats: 0,
    pendingInvitations: 0,
    enabledModuleLicenses: 0,
    expiringSoon: 0,
  },
  planDistribution: [],
  countryDistribution: [],
  recentCompanies: [],
  recentActivity: [],
};

function KpiCard({ icon: Icon, label, value, helper, tone = 'neutral' }) {
  const tones = {
    neutral: { background: '#f5f8fb', color: '#34506b' },
    success: { background: '#eaf8f3', color: '#087b65' },
    warning: { background: '#fff7e8', color: '#a76600' },
    danger: { background: '#fff0f0', color: '#b63a3a' },
    info: { background: '#eef5ff', color: '#2f67b1' },
  };

  const selectedTone = tones[tone] || tones.neutral;

  return (
    <div className="card" style={{ padding: 18, minHeight: 126 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
        <div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>
            {label}
          </div>
          <div style={{ fontSize: 28, fontWeight: 750, lineHeight: 1 }}>{value}</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 10 }}>
            {helper}
          </div>
        </div>
        <div
          style={{
            width: 42,
            height: 42,
            borderRadius: 12,
            display: 'grid',
            placeItems: 'center',
            background: selectedTone.background,
            color: selectedTone.color,
            flexShrink: 0,
          }}
        >
          <Icon size={20} />
        </div>
      </div>
    </div>
  );
}

function DistributionPanel({ title, rows, emptyText }) {
  const maxValue = Math.max(...rows.map(row => Number(row.value || 0)), 1);

  return (
    <div className="card" style={{ padding: 18 }}>
      <h3 style={{ margin: 0, fontSize: 15 }}>{title}</h3>
      <div style={{ marginTop: 16, display: 'grid', gap: 13 }}>
        {!rows.length && (
          <div className="empty-state" style={{ minHeight: 130 }}>
            <p>{emptyText}</p>
          </div>
        )}
        {rows.slice(0, 7).map(row => {
          const width = `${Math.max((Number(row.value || 0) / maxValue) * 100, 5)}%`;
          return (
            <div key={row.label}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                <span style={{ fontWeight: 650 }}>{row.label}</span>
                <span style={{ color: 'var(--text-muted)' }}>{row.value}</span>
              </div>
              <div
                style={{
                  height: 7,
                  borderRadius: 999,
                  background: 'var(--surface-soft, #eef3f7)',
                  marginTop: 6,
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    width,
                    height: '100%',
                    borderRadius: 999,
                    background: 'var(--teal, #0f8a78)',
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const normalized = String(status || 'Active').toLowerCase();
  const map = {
    active: { background: '#eaf8f3', color: '#087b65' },
    trial: { background: '#eef5ff', color: '#2f67b1' },
    suspended: { background: '#fff0f0', color: '#b63a3a' },
    expired: { background: '#fff7e8', color: '#a76600' },
    cancelled: { background: '#f1f3f5', color: '#5d6873' },
  };
  const style = map[normalized] || map.active;

  return (
    <span
      style={{
        display: 'inline-flex',
        padding: '4px 8px',
        borderRadius: 999,
        fontSize: 10,
        fontWeight: 700,
        background: style.background,
        color: style.color,
      }}
    >
      {status || 'Active'}
    </span>
  );
}

export default function PlatformDashboardPage() {
  const navigate = useNavigate();
  const { access } = useAuth();
  const { toast, ToastContainer } = useToast();
  const [data, setData] = useState(EMPTY_DATA);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const result = await getPlatformDashboardSummary();
      setData(result || EMPTY_DATA);
    } catch (error) {
      toast(error.message || 'Unable to load platform dashboard', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (access?.isPlatformAdmin) load();
  }, [access?.isPlatformAdmin]);

  const seatUsage = useMemo(() => {
    const licensed = Number(data.kpis.licensedSeats || 0);
    const active = Number(data.kpis.activeUsers || 0);
    return licensed > 0 ? Math.min(Math.round((active / licensed) * 100), 100) : 0;
  }, [data.kpis.activeUsers, data.kpis.licensedSeats]);

  if (!access?.isPlatformAdmin) {
    return (
      <div className="empty-state">
        <p>TextileIE Platform Administrator access is required.</p>
      </div>
    );
  }

  return (
    <div>
      <ToastContainer />
      <PageHeader
        title="TextileIE Control Center"
        subtitle="Monitor customers, subscriptions, seats, modules and platform activity"
        badge={{ text: 'Platform' }}
      />

      <div
        className="card"
        style={{
          padding: 14,
          marginBottom: 16,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 12,
          flexWrap: 'wrap',
        }}
      >
        <div>
          <div style={{ fontWeight: 750 }}>Platform Operations</div>
          <div style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 3 }}>
            Create customers and manage their commercial access from one workspace.
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button className="btn" onClick={load} disabled={loading}>
            <RefreshCw size={14} /> {loading ? 'Refreshing...' : 'Refresh'}
          </button>
          <button className="btn" onClick={() => navigate('/platform-admin')}>
            <ShieldCheck size={14} /> Manage Companies
          </button>
          <button className="btn btn-primary" onClick={() => navigate('/platform/onboarding')}>
            <Plus size={14} /> New Customer
          </button>
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
          gap: 14,
        }}
      >
        <KpiCard icon={Building2} label="Total Companies" value={data.kpis.totalCompanies} helper={`${data.kpis.activeCompanies} active customers`} tone="info" />
        <KpiCard icon={CheckCircle2} label="Active Companies" value={data.kpis.activeCompanies} helper={`${data.kpis.trialCompanies} currently on trial`} tone="success" />
        <KpiCard icon={AlertTriangle} label="Suspended / Expired" value={data.kpis.suspendedCompanies + data.kpis.expiredCompanies} helper={`${data.kpis.expiringSoon} expiring within 30 days`} tone="warning" />
        <KpiCard icon={Users} label="Active Users" value={data.kpis.activeUsers} helper={`${data.kpis.licensedSeats} total licensed seats`} tone="neutral" />
        <KpiCard icon={UserPlus} label="Pending Invitations" value={data.kpis.pendingInvitations} helper={`${data.kpis.availableSeats} seats currently available`} tone="info" />
        <KpiCard icon={Grid3X3} label="Enabled Module Licenses" value={data.kpis.enabledModuleLicenses} helper="Across all customer companies" tone="success" />
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.35fr) minmax(280px, .65fr)',
          gap: 16,
          marginTop: 16,
        }}
      >
        <div className="card" style={{ padding: 18 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 15 }}>Seat Utilization</h3>
              <div style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 4 }}>
                Active customer users against licensed capacity
              </div>
            </div>
            <strong>{seatUsage}%</strong>
          </div>
          <div style={{ height: 12, borderRadius: 999, background: '#eef3f7', marginTop: 18, overflow: 'hidden' }}>
            <div style={{ width: `${seatUsage}%`, height: '100%', borderRadius: 999, background: 'var(--teal, #0f8a78)' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, fontSize: 11, color: 'var(--text-muted)' }}>
            <span>{data.kpis.activeUsers} active</span>
            <span>{data.kpis.availableSeats} available</span>
            <span>{data.kpis.licensedSeats} licensed</span>
          </div>
        </div>

        <div className="card" style={{ padding: 18 }}>
          <h3 style={{ margin: 0, fontSize: 15 }}>Quick Actions</h3>
          <div style={{ display: 'grid', gap: 9, marginTop: 14 }}>
            <button className="btn btn-primary" style={{ justifyContent: 'space-between' }} onClick={() => navigate('/platform/onboarding')}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 7 }}><Plus size={14} /> Onboard Customer</span>
              <ArrowRight size={14} />
            </button>
            <button className="btn" style={{ justifyContent: 'space-between' }} onClick={() => navigate('/platform-admin')}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 7 }}><Building2 size={14} /> Company Licensing</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: 16,
          marginTop: 16,
        }}
      >
        <DistributionPanel title="Subscription Distribution" rows={data.planDistribution} emptyText="No subscription data available." />
        <DistributionPanel title="Customer Countries" rows={data.countryDistribution} emptyText="No country data available." />
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.3fr) minmax(300px, .7fr)',
          gap: 16,
          marginTop: 16,
        }}
      >
        <div className="card" style={{ padding: 18, overflowX: 'auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: 15 }}>Recent Companies</h3>
            <button className="btn" onClick={() => navigate('/platform-admin')}>View all</button>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 12, minWidth: 720 }}>
            <thead>
              <tr style={{ textAlign: 'left', color: 'var(--text-muted)', fontSize: 11 }}>
                <th style={{ padding: '10px 8px' }}>Company</th>
                <th style={{ padding: '10px 8px' }}>Plan</th>
                <th style={{ padding: '10px 8px' }}>Users</th>
                <th style={{ padding: '10px 8px' }}>Modules</th>
                <th style={{ padding: '10px 8px' }}>Country</th>
                <th style={{ padding: '10px 8px' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {data.recentCompanies.map(company => (
                <tr key={company.id} style={{ borderTop: '1px solid var(--border-light)' }}>
                  <td style={{ padding: '12px 8px' }}>
                    <strong style={{ fontSize: 12 }}>{company.name}</strong>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 3 }}>{company.code || 'No code'}</div>
                  </td>
                  <td style={{ padding: '12px 8px', fontSize: 12 }}>{company.subscription_plan || '-'}</td>
                  <td style={{ padding: '12px 8px', fontSize: 12 }}>{company.active_user_count}/{company.licensed_users || 0}</td>
                  <td style={{ padding: '12px 8px', fontSize: 12 }}>{company.enabled_module_count}</td>
                  <td style={{ padding: '12px 8px', fontSize: 12 }}>{company.country || '-'}</td>
                  <td style={{ padding: '12px 8px' }}><StatusBadge status={company.subscription_status} /></td>
                </tr>
              ))}
              {!data.recentCompanies.length && (
                <tr>
                  <td colSpan="6" style={{ padding: 30, textAlign: 'center', color: 'var(--text-muted)' }}>
                    No companies are available yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="card" style={{ padding: 18 }}>
          <h3 style={{ margin: 0, fontSize: 15, display: 'flex', alignItems: 'center', gap: 7 }}>
            <Activity size={16} /> Recent Activity
          </h3>
          <div style={{ display: 'grid', gap: 12, marginTop: 16 }}>
            {data.recentActivity.map(item => (
              <div key={item.id} style={{ display: 'grid', gridTemplateColumns: '28px 1fr', gap: 9 }}>
                <div style={{ width: 28, height: 28, borderRadius: 9, background: '#eef5ff', color: '#2f67b1', display: 'grid', placeItems: 'center' }}>
                  <Clock3 size={13} />
                </div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 650 }}>
                    {item.action_key || 'Activity'} {item.entity_type ? `路 ${item.entity_type}` : ''}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 3 }}>
                    {item.created_at ? new Date(item.created_at).toLocaleString() : 'Date unavailable'}
                  </div>
                </div>
              </div>
            ))}
            {!data.recentActivity.length && (
              <div className="empty-state" style={{ minHeight: 170 }}>
                <p>No platform activity is available yet.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
        }
