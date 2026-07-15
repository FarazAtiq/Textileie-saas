import { AlertCircle, CheckCircle2 } from 'lucide-react';

export default function DuplicateStatus({ checking, duplicate, error, availableText = 'Available', duplicateTitle = 'Already exists', details }) {
  if (checking) {
    return <div style={{ marginTop: 5, fontSize: 11, color: 'var(--text-muted)' }}>Checking...</div>;
  }
  if (error) {
    return <div style={{ marginTop: 6, display: 'flex', gap: 6, alignItems: 'center', fontSize: 11, color: 'var(--amber)' }}><AlertCircle size={12}/>{error}</div>;
  }
  if (duplicate) {
    return (
      <div style={{ marginTop: 6, padding: '8px 10px', borderRadius: 8, background: 'var(--red-light)', color: 'var(--red)', fontSize: 11, lineHeight: 1.5 }}>
        <strong>{duplicateTitle}</strong>
        {details ? <><br />{details}</> : null}
      </div>
    );
  }
  return <div style={{ marginTop: 5, display: 'flex', gap: 5, alignItems: 'center', fontSize: 11, color: 'var(--green)' }}><CheckCircle2 size={12}/>{availableText}</div>;
}
