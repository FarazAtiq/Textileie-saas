import { useState } from 'react';
import { Crown, Lock, Download, FileText, X, Check } from 'lucide-react';

const PREMIUM_FORMATS = {
  efficiency: [
    { id: 'eff_detailed',   name: 'Detailed Efficiency Report',        desc: 'Multi-line, benchmarks, efficiency gauge, IE analysis', price: 5 },
    { id: 'eff_daily',      name: 'Daily Production Summary',          desc: 'All lines, date-wise, comparison chart', price: 5 },
    { id: 'eff_operator',   name: 'Operator-wise Efficiency Report',   desc: 'Per operator breakdown with rankings', price: 5 },
  ],
  capacity: [
    { id: 'cap_detailed',   name: 'Full Capacity Planning Report',     desc: 'All lines, periods, factory total, charts', price: 5 },
    { id: 'cap_monthly',    name: 'Monthly Capacity Plan',             desc: 'Month-wise breakdown with working days', price: 5 },
  ],
  smv: [
    { id: 'smv_breakdown',  name: 'Operation Breakdown Sheet',        desc: 'Full IE format with machine allocation', price: 5 },
    { id: 'smv_comparison', name: 'Article SMV Comparison',           desc: 'Multiple articles side by side', price: 5 },
  ],
  fabric: [
    { id: 'fab_order',      name: 'Fabric Order Sheet',               desc: 'Full order with wastage, cost breakdown', price: 5 },
    { id: 'fab_consumption','name': 'Consumption Summary (All sizes)', desc: 'Size-wise fabric breakdown', price: 5 },
  ],
  thread: [
    { id: 'thr_coats',      name: 'Coats-format Thread Sheet',        desc: 'Full operation-wise like your template', price: 5 },
    { id: 'thr_order',      name: 'Thread Order Summary',             desc: 'Total thread needed for order quantity', price: 5 },
  ],
  costing: [
    { id: 'cost_fob',       name: 'FOB Costing Sheet',                desc: 'Full costing with buyer breakdown', price: 5 },
    { id: 'cost_buyer',     name: 'Buyer-wise Costing Report',        desc: 'Multiple buyers comparison', price: 5 },
  ],
};

export function PremiumDownload({ type, data, onClose }) {
  const [selected, setSelected] = useState(null);
  const [loading, setLoading]   = useState(false);
  const [paid, setPaid]         = useState(false);

  const formats = PREMIUM_FORMATS[type] || [];

  const handlePayment = async () => {
    if (!selected) return;
    setLoading(true);
    // TODO: Connect Stripe or LemonSqueezy
    // For now show coming soon
    setTimeout(() => {
      setLoading(false);
      alert('Payment integration coming soon!\n\nWe will connect Stripe/LemonSqueezy shortly.\nYou will be charged $5 per premium report download.\n\nContact: support@textileie.com');
    }, 1000);
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ background: 'white', borderRadius: 16, width: '100%', maxWidth: 560, maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 24px 64px rgba(0,0,0,0.3)' }}>

        {/* Header */}
        <div style={{ padding: '16px 20px', background: 'linear-gradient(135deg, #0F2942, #7C3AED)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Crown size={20} color="#FBBF24" />
            <div>
              <div style={{ color: 'white', fontWeight: 700, fontSize: 15 }}>Premium Report Download</div>
              <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11 }}>Professional format · $5 per report</div>
            </div>
          </div>
          {onClose && <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 8, color: 'white', cursor: 'pointer', padding: 8 }}><X size={16} /></button>}
        </div>

        <div style={{ overflowY: 'auto', flex: 1, padding: 20 }}>

          {/* What's included */}
          <div style={{ padding: '12px 16px', background: '#FEF3C7', borderRadius: 10, marginBottom: 16, border: '1px solid #FCD34D' }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: '#92400E', marginBottom: 6 }}>What premium includes:</div>
            {['Professional format matching industry standard', 'Charts and visual analysis built in', 'AI recommendations included', 'Company branding on report', 'Unlimited download after purchase'].map((f, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, fontSize: 12, color: '#78350F', marginBottom: 4 }}>
                <Check size={13} color="#92400E" style={{ flexShrink: 0, marginTop: 1 }} /> {f}
              </div>
            ))}
          </div>

          {/* Format selection */}
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Select report format
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
            {formats.map(f => (
              <div key={f.id} onClick={() => setSelected(f)}
                style={{
                  padding: '14px 16px', borderRadius: 10, cursor: 'pointer',
                  border: selected?.id === f.id ? '2px solid var(--teal)' : '1px solid var(--border-light)',
                  background: selected?.id === f.id ? 'var(--teal-light)' : 'var(--bg)',
                  transition: 'all 0.15s'
                }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{f.name}</div>
                  <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--teal)', fontFamily: 'JetBrains Mono' }}>${f.price}</div>
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{f.desc}</div>
              </div>
            ))}
          </div>

          {/* Payment button */}
          <button onClick={handlePayment} disabled={!selected || loading}
            style={{
              width: '100%', padding: '14px', border: 'none', borderRadius: 10, cursor: selected ? 'pointer' : 'not-allowed',
              background: selected ? 'linear-gradient(135deg, #0F2942, #7C3AED)' : 'var(--border)',
              color: 'white', fontSize: 15, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, fontFamily: 'inherit'
            }}>
            {loading ? 'Processing...' : (<><Lock size={16} /> Pay $5 & Download {selected?.name || 'Report'}</>)}
          </button>

          <p style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center', marginTop: 12 }}>
            Secure payment via Stripe · Instant download after payment · No subscription
          </p>
        </div>
      </div>
    </div>
  );
}
