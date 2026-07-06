export default function MasterStats({ stats = [] }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 16 }}>
      {stats.map(item => (
        <div key={item.label} className="card" style={{ padding: 14 }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700 }}>{item.label}</div>
          <div style={{ fontSize: 26, fontWeight: 900, color: item.color || 'var(--navy)' }}>
            {item.value}
          </div>
        </div>
      ))}
    </div>
  );
}
