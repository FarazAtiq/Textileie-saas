export default function StatusBadge({ status = 'Active' }) {
  const color = {
    Active: '#16a34a',
    Inactive: '#64748b',
    Development: '#f59e0b',
    Approved: '#2563eb',
    Production: '#16a34a',
    Closed: '#111827',
    Obsolete: '#991b1b',
  }[status] || '#64748b';

  return (
    <span style={{
      background: color,
      color: 'white',
      padding: '4px 10px',
      borderRadius: 20,
      fontSize: 11,
      fontWeight: 700,
      height: 24
    }}>
      {status}
    </span>
  );
}
