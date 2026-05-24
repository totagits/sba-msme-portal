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

export default function App() {
  return (
    <>
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
    </>
  );
}
