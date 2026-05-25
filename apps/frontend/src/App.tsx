import { useState } from 'react';
import { Route, Switch, Redirect } from 'wouter';
import { useAuth } from './lib/auth';
import AppShell from './components/layout/AppShell';
import OfflineIndicator from './components/shared/OfflineIndicator';

// Public pages
import LandingPage from './pages/auth/LandingPage';
import LoginPage from './pages/auth/LoginPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';

// Dashboard
import ExecutiveDashboard from './pages/dashboard/ExecutiveDashboard';
import CountyDashboard from './pages/dashboard/CountyDashboard';
import DataQualityDashboard from './pages/dashboard/DataQualityDashboard';

// MSMEs
import MSMEListPage from './pages/msmes/MSMEListPage';
import MSMEFormPage from './pages/msmes/MSMEFormPage';
import MSMEDetailPage from './pages/msmes/MSMEDetailPage';
import MSMEVerifyPage from './pages/msmes/MSMEVerifyPage';

// BDSPs
import BDSPListPage from './pages/bdsps/BDSPListPage';
import BDSPFormPage from './pages/bdsps/BDSPFormPage';
import BDSPDetailPage from './pages/bdsps/BDSPDetailPage';

// Other modules
import ProductCatalogPage from './pages/products/ProductCatalogPage';
import OpportunitiesPage from './pages/opportunities/OpportunitiesPage';
import ReportsPage from './pages/reports/ReportsPage';
import GenerateReportPage from './pages/reports/GenerateReportPage';
import ReportDetailPage from './pages/reports/ReportDetailPage';
import ImportsPage from './pages/imports/ImportsPage';
import MapPage from './pages/map/MapPage';
import OfflinePage from './pages/offline/OfflinePage';
import SyncStatusPage from './pages/offline/SyncStatusPage';
import AuditLogsPage from './pages/admin/AuditLogsPage';
import UserManagementPage from './pages/admin/UserManagementPage';
import UserDetailPage from './pages/admin/UserDetailPage';
import RolesPage from './pages/admin/RolesPage';
import NotificationsPage from './pages/admin/NotificationsPage';
import SystemSettingsPage from './pages/admin/SystemSettingsPage';
import ProfilePage from './pages/admin/ProfilePage';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return (
    <div className="flex items-center justify-center h-screen bg-background">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-muted-foreground text-sm">Loading SBA Portal...</p>
      </div>
    </div>
  );
  if (!isAuthenticated) return <Redirect to="/login" />;
  return <AppShell>{children}</AppShell>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return null;
  if (isAuthenticated) return <Redirect to="/dashboard" />;
  return <>{children}</>;
}

function GatewayGate({ children }: { children: React.ReactNode }) {
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState('');
  const [authorized, setAuthorized] = useState(() => {
    return localStorage.getItem('gateway_authorized') === 'true';
  });

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    const correctCode = 'LIBERIA-SBA-2026';
    
    if (passcode.trim().toUpperCase() === correctCode) {
      localStorage.setItem('gateway_authorized', 'true');
      setAuthorized(true);
      setError('');
    } else {
      setError('Invalid Gateway Passcode. Please contact SBA/MoCI Administration.');
    }
  };

  if (authorized) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-900 via-primary-800 to-primary-700 flex flex-col justify-between text-white font-sans p-6 select-none">
      {/* Top Government Bar */}
      <div className="text-center text-xs text-primary-300 font-medium tracking-wide uppercase mt-4">
        Bureau of Small Business Administration (SBA) — Republic of Liberia
      </div>

      {/* Main Glassmorphic Gate */}
      <div className="flex-1 flex items-center justify-center max-w-md w-full mx-auto my-8">
        <div className="w-full bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl flex flex-col items-center relative overflow-hidden">
          {/* Decorative glowing backdrops */}
          <div className="absolute -top-24 -left-24 w-48 h-48 bg-accent-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-primary-500/20 rounded-full blur-3xl pointer-events-none" />

          {/* Ministry Seal Container */}
          <div className="w-24 h-24 rounded-full bg-white border border-white/20 p-1 flex items-center justify-center shadow-lg mb-6 overflow-hidden">
            <img 
              src="/images/moci-seal.png" 
              alt="Ministry of Commerce &amp; Industry Seal" 
              className="w-full h-full object-contain"
            />
          </div>

          <h2 className="text-xl font-bold text-white text-center mb-1">LMIP Secure Gateway</h2>
          <p className="text-xs text-primary-300 text-center mb-6 leading-relaxed">
            This is a private staging and pre-production environment. Enter the official Gateway Access Passcode below to proceed.
          </p>

          <form onSubmit={handleVerify} className="w-full space-y-4">
            <div>
              <label htmlFor="gate-passcode" className="block text-[11px] font-semibold uppercase text-primary-300 mb-1.5 ml-1">
                Gateway Access Passcode
              </label>
              <input
                id="gate-passcode"
                type="password"
                placeholder="Enter global access code"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                className="w-full bg-white/5 border border-white/10 focus:border-white/30 rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-white/20 transition-all font-mono tracking-widest text-center"
                autoFocus
              />
            </div>

            {error && (
              <p className="text-red-400 text-xs text-center font-medium bg-red-500/10 border border-red-500/20 py-2.5 px-3 rounded-xl">
                {error}
              </p>
            )}

            <button
              type="submit"
              className="w-full bg-white hover:bg-white/95 text-primary-900 font-semibold py-3 px-4 rounded-xl transition-all shadow-md active:scale-[0.98] flex items-center justify-center gap-2 text-sm"
            >
              <span>Unlock Staging Access</span>
            </button>
          </form>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-[10px] text-primary-400">
        © {new Date().getFullYear()} Ministry of Commerce &amp; Industry. Unauthorized access is strictly prohibited and logged.
      </div>
    </div>
  );
}

export default function App() {
  return (
    <GatewayGate>
      <OfflineIndicator />
      <Switch>
        {/* Public */}
        <Route path="/">
          <PublicRoute><LandingPage /></PublicRoute>
        </Route>
        <Route path="/login">
          <PublicRoute><LoginPage /></PublicRoute>
        </Route>
        <Route path="/forgot-password">
          <PublicRoute><ForgotPasswordPage /></PublicRoute>
        </Route>
        <Route path="/reset-password/:token">
          {(params) => <PublicRoute><ResetPasswordPage token={params.token} /></PublicRoute>}
        </Route>

        {/* Dashboards */}
        <Route path="/dashboard">
          <ProtectedRoute><ExecutiveDashboard /></ProtectedRoute>
        </Route>
        <Route path="/dashboard/county">
          <ProtectedRoute><CountyDashboard /></ProtectedRoute>
        </Route>
        <Route path="/dashboard/data-quality">
          <ProtectedRoute><DataQualityDashboard /></ProtectedRoute>
        </Route>

        {/* MSMEs */}
        <Route path="/msmes">
          <ProtectedRoute><MSMEListPage /></ProtectedRoute>
        </Route>
        <Route path="/msmes/new">
          <ProtectedRoute><MSMEFormPage /></ProtectedRoute>
        </Route>
        <Route path="/msmes/:id/edit">
          {(params) => <ProtectedRoute><MSMEFormPage id={params.id} /></ProtectedRoute>}
        </Route>
        <Route path="/msmes/:id/verify">
          {(params) => <ProtectedRoute><MSMEVerifyPage id={params.id} /></ProtectedRoute>}
        </Route>
        <Route path="/msmes/:id">
          {(params) => <ProtectedRoute><MSMEDetailPage id={params.id} /></ProtectedRoute>}
        </Route>

        {/* BDSPs */}
        <Route path="/bdsps">
          <ProtectedRoute><BDSPListPage /></ProtectedRoute>
        </Route>
        <Route path="/bdsps/new">
          <ProtectedRoute><BDSPFormPage /></ProtectedRoute>
        </Route>
        <Route path="/bdsps/:id/edit">
          {(params) => <ProtectedRoute><BDSPFormPage id={params.id} /></ProtectedRoute>}
        </Route>
        <Route path="/bdsps/:id">
          {(params) => <ProtectedRoute><BDSPDetailPage id={params.id} /></ProtectedRoute>}
        </Route>

        {/* Other modules */}
        <Route path="/products"><ProtectedRoute><ProductCatalogPage /></ProtectedRoute></Route>
        <Route path="/opportunities"><ProtectedRoute><OpportunitiesPage /></ProtectedRoute></Route>

        <Route path="/reports"><ProtectedRoute><ReportsPage /></ProtectedRoute></Route>
        <Route path="/reports/generate"><ProtectedRoute><GenerateReportPage /></ProtectedRoute></Route>
        <Route path="/reports/:id">{(p) => <ProtectedRoute><ReportDetailPage id={p.id} /></ProtectedRoute>}</Route>

        <Route path="/imports"><ProtectedRoute><ImportsPage /></ProtectedRoute></Route>
        <Route path="/map"><ProtectedRoute><MapPage /></ProtectedRoute></Route>
        <Route path="/offline"><ProtectedRoute><OfflinePage /></ProtectedRoute></Route>
        <Route path="/sync"><ProtectedRoute><SyncStatusPage /></ProtectedRoute></Route>

        <Route path="/users"><ProtectedRoute><UserManagementPage /></ProtectedRoute></Route>
        <Route path="/users/:id">{(p) => <ProtectedRoute><UserDetailPage id={p.id} /></ProtectedRoute>}</Route>
        <Route path="/roles"><ProtectedRoute><RolesPage /></ProtectedRoute></Route>
        <Route path="/audit-logs"><ProtectedRoute><AuditLogsPage /></ProtectedRoute></Route>
        <Route path="/notifications"><ProtectedRoute><NotificationsPage /></ProtectedRoute></Route>
        <Route path="/settings"><ProtectedRoute><SystemSettingsPage /></ProtectedRoute></Route>
        <Route path="/profile"><ProtectedRoute><ProfilePage /></ProtectedRoute></Route>

        <Route><Redirect to="/dashboard" /></Route>
      </Switch>
    </GatewayGate>
  );
}
