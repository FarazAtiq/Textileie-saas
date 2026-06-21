import { useNavigate } from 'react-router-dom';

export default function NotFoundPage() {
  const navigate = useNavigate();
  return (
    <div style={{ textAlign: 'center', padding: '80px 24px' }}>
      <div style={{ fontSize: 64, marginBottom: 16 }}>🧵</div>
      <h1 style={{ fontSize: 28, marginBottom: 8 }}>Page not found</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: 28 }}>
        The page you're looking for doesn't exist.
      </p>
      <button className="btn btn-primary" onClick={() => navigate('/dashboard')}>
        Go to Dashboard
      </button>
    </div>
  );
}
