import React, { useState } from 'react';
import { Link, useLocation } from 'wouter';
import {
  LayoutDashboard, Building2, Users2, BarChart3, FileText, Map, Upload,
  WifiOff, Bell, Settings, ChevronLeft, ChevronRight, LogOut, User,
  ShieldCheck, ClipboardList, RefreshCw, Package, Briefcase, Menu, X,
  ChevronDown, MapPin, Database
} from 'lucide-react';
import { useAuth } from '../../lib/auth';
import { getInitials } from '../../lib/utils';
import NotificationBell from '../shared/NotificationBell';

interface NavItem {
  path: string;
  label: string;
  icon: React.ComponentType<any>;
  permission?: string;
  badge?: number;
  children?: Omit<NavItem, 'children'>[];
}

const navItems: NavItem[] = [
  { path: '/dashboard', label: 'Executive Dashboard', icon: LayoutDashboard, permission: 'analytics:read' },
  { path: '/dashboard/county', label: 'County Dashboard', icon: MapPin, permission: 'analytics:read' },
  { path: '/dashboard/data-quality', label: 'Data Quality', icon: Database, permission: 'analytics:read' },
  { path: '/msmes', label: 'MSME Registry', icon: Building2, permission: 'msme:read' },
  { path: '/bdsps', label: 'BDSP Registry', icon: Users2, permission: 'bdsp:read' },
  { path: '/products', label: 'Product Catalog', icon: Package, permission: 'msme:read' },
  { path: '/opportunities', label: 'Opportunities', icon: Briefcase },
  { path: '/map', label: 'GIS Map', icon: Map, permission: 'msme:read' },
  { path: '/reports', label: 'Reports', icon: FileText, permission: 'report:read' },
  { path: '/imports', label: 'Data Import', icon: Upload, permission: 'msme:import' },
  { path: '/offline', label: 'Offline Collection', icon: WifiOff },
  { path: '/sync', label: 'Sync Status', icon: RefreshCw },
  { path: '/users', label: 'User Management', icon: User, permission: 'user:read' },
  { path: '/roles', label: 'Roles & Permissions', icon: ShieldCheck, permission: 'role:manage' },
  { path: '/audit-logs', label: 'Audit Logs', icon: ClipboardList, permission: 'audit:read' },
  { path: '/notifications', label: 'Notifications', icon: Bell },
  { path: '/settings', label: 'System Settings', icon: Settings, permission: 'settings:read' },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [location] = useLocation();
  const { user, logout, hasPermission } = useAuth();

  const visibleItems = navItems.filter(item =>
    !item.permission || hasPermission(item.permission)
  );

  const isActive = (path: string) => {
    if (path === '/dashboard') return location === '/dashboard';
    return location.startsWith(path);
  };

  const SidebarContent = () => (
    <>
      {/* Logo / Branding */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-primary-700">
        <div className="w-10 h-10 rounded-lg bg-accent-600 flex items-center justify-center flex-shrink-0 shadow-lg">
          <span className="text-white font-bold text-sm">SBA</span>
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <p className="text-white font-semibold text-sm leading-tight truncate">MSME Portal</p>
            <p className="text-primary-400 text-xs leading-tight truncate">Ministry of Commerce</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-0.5">
        {visibleItems.map((item) => (
          <Link key={item.path} href={item.path}>
            <a
              className={`sidebar-link relative ${isActive(item.path) ? 'active' : ''}`}
              onClick={() => setMobileOpen(false)}
              title={collapsed ? item.label : undefined}
            >
              <item.icon size={18} className="flex-shrink-0" />
              {!collapsed && <span className="truncate">{item.label}</span>}
              {item.badge && !collapsed && (
                <span className="ml-auto bg-accent-600 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[18px] text-center">
                  {item.badge}
                </span>
              )}
            </a>
          </Link>
        ))}
      </nav>

      {/* User Profile */}
      <div className="border-t border-primary-700 p-3">
        {!collapsed ? (
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-primary-600 flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xs font-semibold">
                {user ? getInitials(user.firstName, user.lastName) : '?'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium truncate">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-primary-400 text-xs truncate">{user?.email}</p>
            </div>
            <div className="flex flex-col gap-1">
              <Link href="/profile">
                <a className="text-primary-400 hover:text-white p-1 rounded transition-colors" title="Profile">
                  <Settings size={14} />
                </a>
              </Link>
              <button onClick={logout} className="text-primary-400 hover:text-white p-1 rounded transition-colors" title="Logout">
                <LogOut size={14} />
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <div className="w-9 h-9 rounded-full bg-primary-600 flex items-center justify-center">
              <span className="text-white text-xs font-semibold">
                {user ? getInitials(user.firstName, user.lastName) : '?'}
              </span>
            </div>
            <button onClick={logout} className="text-primary-400 hover:text-white p-1 rounded transition-colors" title="Logout">
              <LogOut size={14} />
            </button>
          </div>
        )}
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-white border border-border rounded-full flex items-center justify-center shadow-sm text-muted-foreground hover:text-primary-700 transition-colors z-10 hidden lg:flex"
      >
        {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </button>
    </>
  );

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Desktop Sidebar */}
      <aside
        className={`sidebar relative hidden lg:flex flex-col transition-all duration-250 ${collapsed ? 'collapsed' : ''}`}
        style={{ width: collapsed ? 72 : 260 }}
      >
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-[260px] sidebar flex flex-col">
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="gov-header h-14 flex items-center gap-4 px-4 lg:px-6 flex-shrink-0">
          <button
            className="lg:hidden text-white hover:text-primary-200 transition-colors"
            onClick={() => setMobileOpen(true)}
          >
            <Menu size={20} />
          </button>

          {/* Breadcrumb area */}
          <div className="flex-1">
            <h1 className="text-white text-sm font-semibold hidden sm:block">
              SBA MSMEs Online Database and Reporting Portal
            </h1>
            <p className="text-primary-300 text-xs hidden md:block">
              Bureau of Small Business Administration — Ministry of Commerce and Industry, Liberia
            </p>
          </div>

          <div className="flex items-center gap-2">
            <NotificationBell />
            <Link href="/profile">
              <a className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-white text-xs font-semibold hover:bg-primary-500 transition-colors">
                {user ? getInitials(user.firstName, user.lastName) : '?'}
              </a>
            </Link>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <div className="animate-fade-in">
            {children}
          </div>
        </main>

        {/* Footer */}
        <footer className="gov-seal-bar">
          Republic of Liberia — Ministry of Commerce and Industry — SBA MSME Portal v1.0 — PAYEI / YEIB Program
        </footer>
      </div>
    </div>
  );
}
