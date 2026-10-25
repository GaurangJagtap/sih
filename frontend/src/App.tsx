import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { MainLayout } from './layouts/MainLayout';
import { Login } from './pages/Login';
import { AdminDashboard } from './pages/AdminDashboard';
import { InstitutionDashboard } from './pages/InstitutionDashboard';
import { ApplicationsList } from './pages/ApplicationsList';
import { ApplicationDetail } from './pages/ApplicationDetail';
import { ComplianceList } from './pages/ComplianceList';
import { EVCList } from './pages/EVCList';
import { DocumentsList } from './pages/DocumentsList';
import { VoiceAgentPage } from './pages/VoiceAgentPage';
import { EscalationsPage } from './pages/EscalationsPage';
import { RoutesConfigPage } from './pages/RoutesConfigPage';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

const DefaultRedirect: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.role === 'INSTITUTION') return <Navigate to="/institution/dashboard" replace />;
  return <Navigate to="/admin/dashboard" replace />;
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route
            path="/"
            element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<DefaultRedirect />} />
            <Route path="admin/dashboard" element={<AdminDashboard />} />
            <Route path="institution/dashboard" element={<InstitutionDashboard />} />
            <Route path="applications" element={<ApplicationsList />} />
            <Route path="applications/:id" element={<ApplicationDetail />} />
            <Route path="compliance" element={<ComplianceList />} />
            <Route path="evc" element={<EVCList />} />
            <Route path="documents" element={<DocumentsList />} />
            <Route path="voice-agent" element={<VoiceAgentPage />} />
            <Route path="escalations" element={<EscalationsPage />} />
            <Route path="routes-config" element={<RoutesConfigPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
