import { useQuery } from '@tanstack/react-query';
import { analyticsApi } from '../../lib/api';
import { Building2, Users2, CheckCircle2, Clock, TrendingUp, UserCheck, Shield, BarChart3, RefreshCw } from 'lucide-react';
import { formatNumber } from '../../lib/utils';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend, AreaChart, Area,
} from 'recharts';

const CATEGORY_COLORS = ['#6b7280', '#2563eb', '#7c3aed'];
const STATUS_COLORS: Record<string, string> = {
  DRAFT: '#6b7280', SUBMITTED: '#2563eb', UNDER_REVIEW: '#d97706', VERIFIED: '#0369a1', APPROVED: '#15803d', REJECTED: '#b91c1c', RETURNED_FOR_CORRECTION: '#7c3aed', ARCHIVED: '#374151',
};

function KPICard({ title, value, subtitle, icon: Icon, color, loading }: { title: string; value: number | string; subtitle?: string; icon: any; color: string; loading?: boolean }) {
  return (
    <div className={`kpi-card kpi-card-${color}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-muted-foreground text-xs font-medium uppercase tracking-wider mb-1">{title}</p>
          {loading ? (
            <div className="skeleton h-8 w-24 rounded" />
          ) : (
            <p className="text-3xl font-black text-foreground">{typeof value === 'number' ? formatNumber(value) : value}</p>
          )}
          {subtitle && <p className="text-muted-foreground text-xs mt-1">{subtitle}</p>}
        </div>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
          color === 'blue' ? 'bg-primary-100' : color === 'green' ? 'bg-green-100' : color === 'red' ? 'bg-red-100' : 'bg-amber-100'
        }`}>
          <Icon size={22} className={
            color === 'blue' ? 'text-primary-600' : color === 'green' ? 'text-green-600' : color === 'red' ? 'text-red-600' : 'text-amber-600'
          } />
        </div>
      </div>
    </div>
  );
}

export default function ExecutiveDashboard() {
  const { data: dashboard, isLoading } = useQuery({ queryKey: ['dashboard'], queryFn: () => analyticsApi.getDashboard().then(r => r.data.data) });
  const { data: countyData } = useQuery({ queryKey: ['msmes-by-county'], queryFn: () => analyticsApi.msmesByCounty().then(r => r.data.data) });
  const { data: sectorData } = useQuery({ queryKey: ['msmes-by-sector'], queryFn: () => analyticsApi.msmesBySector().then(r => r.data.data) });
  const { data: categoryData } = useQuery({ queryKey: ['msmes-by-category'], queryFn: () => analyticsApi.msmesByCategory().then(r => r.data.data) });
  const { data: statusData } = useQuery({ queryKey: ['msmes-by-status'], queryFn: () => analyticsApi.msmesByStatus().then(r => r.data.data) });
  const { data: monthlyData } = useQuery({ queryKey: ['monthly-registrations'], queryFn: () => analyticsApi.monthlyRegistrations().then(r => r.data.data) });
  const { data: quality } = useQuery({ queryKey: ['data-quality'], queryFn: () => analyticsApi.dataQuality().then(r => r.data.data) });

  const completeness = quality?.completenessRate || 0;

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Executive Dashboard</h1>
          <p className="page-subtitle">National MSME and BDSP database overview — Republic of Liberia</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <RefreshCw size={12} className="animate-spin-slow" />
            Live data
          </span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <KPICard title="Total MSMEs" value={dashboard?.totalMSMEs || 0} subtitle="All counties" icon={Building2} color="blue" loading={isLoading} />
        <KPICard title="Approved MSMEs" value={dashboard?.approvedMSMEs || 0} subtitle="Fully verified & approved" icon={CheckCircle2} color="green" loading={isLoading} />
        <KPICard title="Pending Review" value={dashboard?.pendingVerification || 0} subtitle="Awaiting action" icon={Clock} color="amber" loading={isLoading} />
        <KPICard title="Total BDSPs" value={dashboard?.totalBDSPs || 0} subtitle="Service providers" icon={Users2} color="blue" loading={isLoading} />
        <KPICard title="Youth-Led MSMEs" value={dashboard?.youthLed || 0} subtitle="Under 35 years" icon={TrendingUp} color="green" loading={isLoading} />
        <KPICard title="Women-Led MSMEs" value={dashboard?.womenLed || 0} subtitle="Women entrepreneurs" icon={UserCheck} color="red" loading={isLoading} />
        <KPICard title="Total Employment" value={dashboard?.employment?.total || 0} subtitle={`${formatNumber(dashboard?.employment?.female || 0)} female`} icon={BarChart3} color="blue" loading={isLoading} />
        <KPICard title="Data Completeness" value={`${completeness}%`} subtitle="Record quality score" icon={Shield} color={completeness >= 80 ? 'green' : completeness >= 60 ? 'amber' : 'red'} loading={isLoading} />
      </div>

      {/* Charts Row 1 */}
      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        {/* Monthly Registrations */}
        <div className="card lg:col-span-2">
          <div className="card-header"><p className="card-title">Monthly MSME Registrations (12 months)</p></div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={monthlyData || []}>
                <defs>
                  <linearGradient id="blueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1e3a5f" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#1e3a5f" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ fontSize: '12px', borderRadius: '8px', border: '1px solid #e5e7eb' }} />
                <Area type="monotone" dataKey="count" stroke="#1e3a5f" strokeWidth={2} fill="url(#blueGrad)" name="Registrations" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Pie */}
        <div className="card">
          <div className="card-header"><p className="card-title">MSMEs by Category</p></div>
          <div className="card-body flex flex-col items-center">
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={categoryData || []} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} innerRadius={40} paddingAngle={3}>
                  {(categoryData || []).map((_: any, i: number) => <Cell key={i} fill={CATEGORY_COLORS[i]} />)}
                </Pie>
                <Tooltip contentStyle={{ fontSize: '12px', borderRadius: '8px' }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap gap-3 justify-center mt-2">
              {(categoryData || []).map((d: any, i: number) => (
                <div key={d.name} className="flex items-center gap-1.5 text-xs">
                  <div className="w-3 h-3 rounded-sm" style={{ background: CATEGORY_COLORS[i] }} />
                  <span className="text-muted-foreground">{d.name}: <span className="font-semibold text-foreground">{formatNumber(d.value)}</span></span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        {/* By County */}
        <div className="card">
          <div className="card-header"><p className="card-title">MSMEs by County</p></div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={(countyData || []).slice(0, 10)} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis dataKey="county" type="category" tick={{ fontSize: 11 }} width={90} />
                <Tooltip contentStyle={{ fontSize: '12px', borderRadius: '8px' }} />
                <Bar dataKey="total" fill="#1e3a5f" name="Total" radius={[0, 3, 3, 0]} />
                <Bar dataKey="approved" fill="#15803d" name="Approved" radius={[0, 3, 3, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* By Sector */}
        <div className="card">
          <div className="card-header"><p className="card-title">MSMEs by Sector</p></div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={(sectorData || []).slice(0, 10)} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis dataKey="sector" type="category" tick={{ fontSize: 11 }} width={90} />
                <Tooltip contentStyle={{ fontSize: '12px', borderRadius: '8px' }} />
                <Bar dataKey="total" fill="#2d5f96" name="Total" radius={[0, 3, 3, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Workflow Status + Data Quality */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Workflow Status */}
        <div className="card">
          <div className="card-header"><p className="card-title">Workflow Pipeline</p></div>
          <div className="card-body space-y-3">
            {(statusData || []).filter((d: any) => d.count > 0).map((d: any) => (
              <div key={d.status} className="flex items-center gap-3">
                <div className="w-24 text-xs text-muted-foreground capitalize">{d.status.replace(/_/g, ' ')}</div>
                <div className="flex-1 progress-bar">
                  <div className="progress-fill" style={{ width: `${statusData ? Math.min(100, (d.count / Math.max(...statusData.map((s: any) => s.count))) * 100) : 0}%`, background: STATUS_COLORS[d.status] || '#6b7280' }} />
                </div>
                <div className="text-xs font-semibold text-foreground w-10 text-right">{formatNumber(d.count)}</div>
              </div>
            ))}
            {(!statusData || statusData.every((d: any) => d.count === 0)) && (
              <p className="text-sm text-muted-foreground text-center py-4">No records yet</p>
            )}
          </div>
        </div>

        {/* Data Quality */}
        <div className="card">
          <div className="card-header"><p className="card-title">Data Quality Summary</p></div>
          <div className="card-body">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-3xl font-black text-primary-700">{completeness}%</p>
                <p className="text-xs text-muted-foreground">Overall completeness score</p>
              </div>
              <div className="relative w-24 h-24">
                <svg viewBox="0 0 36 36" className="w-24 h-24 -rotate-90">
                  <circle cx="18" cy="18" r="15.9" fill="none" stroke="#e5e7eb" strokeWidth="3" />
                  <circle cx="18" cy="18" r="15.9" fill="none" stroke="#1e3a5f" strokeWidth="3"
                    strokeDasharray={`${completeness} ${100 - completeness}`} strokeLinecap="round" />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-primary-700">{completeness}%</span>
              </div>
            </div>
            <div className="space-y-2">
              {[
                { label: 'Missing GPS Coordinates', value: quality?.noGPS || 0, icon: '📍' },
                { label: 'Missing Phone Numbers', value: quality?.noPhone || 0, icon: '📞' },
                { label: 'Missing Email', value: quality?.noEmail || 0, icon: '✉️' },
                { label: 'Missing Sector Classification', value: quality?.noSector || 0, icon: '🏭' },
                { label: 'Pending Correction', value: quality?.pendingCorrection || 0, icon: '⚠️' },
              ].map(item => (
                <div key={item.label} className="flex items-center justify-between text-sm py-1 border-b border-border last:border-0">
                  <span className="text-muted-foreground flex items-center gap-1.5">{item.icon} {item.label}</span>
                  <span className={`font-semibold ${item.value > 0 ? 'text-amber-600' : 'text-success-600'}`}>{formatNumber(item.value)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
