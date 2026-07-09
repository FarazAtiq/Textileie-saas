import { PageHeader } from '../components/ResultCard.jsx';

export default function StitchMasterPage() {
  return (
    <div>
      <PageHeader
        title="Stitch Master"
        subtitle="Reusable stitch library for ratios, thread consumption and costing"
        badge={{ text: 'Master Data' }}
      />

      <div className="card" style={{ padding: 18 }}>
        <h3>Stitch Master</h3>
        <p style={{ color: 'var(--text-muted)' }}>
          Stitch form and stitch cards will be added next.
        </p>
      </div>
    </div>
  );
}
