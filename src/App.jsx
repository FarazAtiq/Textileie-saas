import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth.jsx';
import { Layout } from './components/Layout.jsx';
import AuthPage     from './pages/AuthPage.jsx';
import Dashboard    from './pages/Dashboard.jsx';
import StyleLibraryPage from './pages/StyleLibraryPage.jsx';
import SMVPage      from './pages/SMVPage.jsx';
import ReportsPage  from './pages/ReportsPage.jsx';
import SettingsPage from './pages/SettingsPage.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';
import {
  EfficiencyPage,
  CapacityPage,
} from './pages/EffCapPages.jsx';
import FabricPage from './pages/FabricPage.jsx';
import CostingPage from './pages/CostingPage.jsx';
import ThreadPage from './pages/ThreadPage.jsx';
import FabricMasterPage from './pages/FabricMasterPage';
import './styles/global.css';

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      height: '100vh', flexDirection: 'column', gap: 12, color: 'var(--text-muted)'
    }}>
      <div style={{ fontSize: 32 }}>🧵</div>
      <p style={{ fontSize: 14 }}>Loading TextileIE...</p>
    </div>
  );
  if (!user) return <Navigate to="/login" replace />;
  return <Layout>{children}</Layout>;
}

function RedirectIfAuthed({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/dashboard" replace />;
  return children;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<RedirectIfAuthed><AuthPage /></RedirectIfAuthed>} />

      {/* Protected */}
      <Route path="/dashboard"  element={<PrivateRoute><Dashboard /></PrivateRoute>} />
      <Route path="/styles" element={<StyleLibraryPage />} />
      <Route path="/efficiency" element={<PrivateRoute><EfficiencyPage /></PrivateRoute>} />
      <Route path="/capacity"   element={<PrivateRoute><CapacityPage /></PrivateRoute>} />
      <Route path="/smv"        element={<PrivateRoute><SMVPage /></PrivateRoute>} />
      <Route path="/fabric"     element={<PrivateRoute><FabricPage /></PrivateRoute>} />
      <Route path="/fabric-master" element={<FabricMasterPage />} /></PrivateRoute>} />
      <Route path="/thread"     element={<PrivateRoute><ThreadPage /></PrivateRoute>} />
      <Route path="/costing"    element={<PrivateRoute><CostingPage /></PrivateRoute>} />
      <Route path="/reports"    element={<PrivateRoute><ReportsPage /></PrivateRoute>} />
      <Route path="/settings"   element={<PrivateRoute><SettingsPage /></PrivateRoute>} />

      {/* Redirects */}
      <Route path="/"   element={<Navigate to="/dashboard" replace />} />
      <Route path="*"   element={<PrivateRoute><NotFoundPage /></PrivateRoute>} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
