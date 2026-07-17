import { useEffect, useState } from 'react';
import { CreditCard, RefreshCw, Users } from 'lucide-react';
import { getCompanySubscriptionSummary } from '../lib/db.js';
import { useToast } from '../hooks/useToast.jsx';

function Metric({ label, value, icon: Icon }) {
  return (
    <div style={{ padding: 16, border: '1px solid var(--border-light)', borderRadius: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{label}</div>
        {Icon && <Icon size={15} color="var(--teal)" />}
      </div>
      <div style={{ fontSize: 22, fontWeight: 800, marginTop: 6 }}>{value}</div>
    </div>
  );
}

export default function SubscriptionPanel() {
  const { toast, ToastContainer } = useToast();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      setSummary(await getCompanySubscriptionSummary());
    } catch (error) {
      toast('Failed to load subscription: ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  if (loading) return <div className="empty-state"><p>Loading subscription...</p></div>;
   
  console.log('Subscription summary:', summary); 
  if (!summary) return <div className="empty-state"><p>Company subscription is not configured.</p></div>;

  const { subscription, seats } = summary;

  return (
    <div>
      <ToastContainer />
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 16 }}>
        <div>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <CreditCard size={16} /> Subscription & Licensing
          </h3>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>
            Licensing is controlled by TextileIE. Factory owners can view usage but cannot change purchased limits.
          </p>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={load}><RefreshCw size={13} /> Refresh</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 12 }}>
        <Metric label="Plan" value={subscription?.plan || 'Starter'} icon={CreditCard} />
        <Metric label="Status" value={subscription?.status || 'Active'} />
        <Metric label="Licensed Users" value={seats?.licensed_users ?? 0} icon={Users} />
        <Metric label="Active Users" value={seats?.active_users ?? 0} />
        <Metric label="Pending Invites" value={seats?.pending_invitations ?? 0} />
        <Metric label="Available Seats" value={seats?.available_seats ?? 0} />
      </div>

      <div style={{ marginTop: 14, padding: 14, borderRadius: 10, background: 'var(--bg)' }}>
        <strong style={{ fontSize: 12 }}>Subscription dates</strong>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>
          Starts: {subscription?.startsAt ? new Date(subscription.startsAt).toLocaleDateString() : 'Not set'}
          {' · '}
          Expires: {subscription?.expiresAt ? new Date(subscription.expiresAt).toLocaleDateString() : 'Not set'}
          {' · '}
          Trial ends: {subscription?.trialEndsAt ? new Date(subscription.trialEndsAt).toLocaleDateString() : 'Not set'}
        </div>
      </div>
    </div>
  );
}
