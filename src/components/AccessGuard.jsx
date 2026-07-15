import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.jsx';

export default function AccessGuard({
  module,
  action = 'view',
  children,
  fallback = '/dashboard',
}) {
  const { loading, can } = useAuth();

  if (loading) {
    return <div className="empty-state"><p>Checking access...</p></div>;
  }

  if (!can(module, action)) {
    return <Navigate to={fallback} replace />;
  }

  return children;
}
