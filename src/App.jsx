import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth.jsx';
import { Layout } from './components/Layout.jsx';
import AccessGuard from './components/AccessGuard.jsx';
import AuthPage from './pages/AuthPage.jsx';
import Dashboard from './pages/Dashboard.jsx';
import StyleLibraryPage from './pages/StyleLibraryPage.jsx';
import SMVPage from './pages/SMVPage.jsx';
import ReportsPage from './pages/ReportsPage.jsx';
import SettingsPage from './pages/SettingsPage.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';
import ExportOrdersPage from './pages/ExportOrdersPage.jsx';
import FabricRequirementsPage from './pages/FabricRequirementsPage.jsx';
import ThreadRequirementsPage from './pages/ThreadRequirementsPage.jsx';
import { EfficiencyPage, CapacityPage } from './pages/EffCapPages.jsx';
import FabricPage from './pages/FabricPage.jsx';
import CostingPage from './pages/CostingPage.jsx';
import ThreadPage from './pages/ThreadPage.jsx';
import FabricMasterPage from './pages/FabricMasterPage.jsx';
import ThreadMasterPage from './pages/ThreadMasterPage.jsx';
import StitchMasterPage from './pages/StitchMasterPage.jsx';
import './styles/global.css';

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        flexDirection: 'column',
        gap: 12,
        color: 'var(--text-muted)',
      }}>
        <p style={{ fontSize: 14 }}>Loading TextileIE...</p>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  return <Layout>{children}</Layout>;
}

function ProtectedModule({ module, children }) {
  return (
    <PrivateRoute>
      <AccessGuard module={module}>{children}</AccessGuard>
    </PrivateRoute>
  );
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
      <Route path="/login" element={<RedirectIfAuthed><AuthPage /></RedirectIfAuthed>} />

      <Route path="/dashboard" element={<ProtectedModule module="dashboard"><Dashboard /></ProtectedModule>} />
      <Route path="/styles" element={<ProtectedModule module="styles"><StyleLibraryPage /></ProtectedModule>} />
      <Route path="/fabric-master" element={<ProtectedModule module="fabric_master"><FabricMasterPage /></ProtectedModule>} />
      <Route path="/thread-master" element={<ProtectedModule module="thread_master"><ThreadMasterPage /></ProtectedModule>} />
      <Route path="/stitch-master" element={<ProtectedModule module="stitch_master"><StitchMasterPage /></ProtectedModule>} />
      <Route path="/smv" element={<ProtectedModule module="smv"><SMVPage /></ProtectedModule>} />
      <Route path="/efficiency" element={<ProtectedModule module="efficiency"><EfficiencyPage /></ProtectedModule>} />
      <Route path="/capacity" element={<ProtectedModule module="capacity"><CapacityPage /></ProtectedModule>} />
      <Route path="/fabric" element={<ProtectedModule module="fabric_engineering"><FabricPage /></ProtectedModule>} />
      <Route path="/thread" element={<ProtectedModule module="thread_engineering"><ThreadPage /></ProtectedModule>} />
      <Route path="/costing" element={<ProtectedModule module="costing"><CostingPage /></ProtectedModule>} />
      <Route path="/export-orders" element={<ProtectedModule module="export_orders"><ExportOrdersPage /></ProtectedModule>} />
      <Route path="/fabric-requirements" element={<ProtectedModule module="fabric_requirements"><FabricRequirementsPage /></ProtectedModule>} />
      <Route path="/thread-requirements" element={<ProtectedModule module="thread_requirements"><ThreadRequirementsPage /></ProtectedModule>} />
      <Route path="/export-order" element={<Navigate to="/export-orders" replace />} />
      <Route path="/exportorders" element={<Navigate to="/export-orders" replace />} />
      <Route path="/reports" element={<ProtectedModule module="reports"><ReportsPage /></ProtectedModule>} />
      <Route path="/settings" element={<ProtectedModule module="administration"><SettingsPage /></ProtectedModule>} />

      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<PrivateRoute><NotFoundPage /></PrivateRoute>} />
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
