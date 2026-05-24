import { useQuery } from '@tanstack/react-query';
import { analyticsApi } from '../../lib/api';
import { AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import { formatNumber } from '../../lib/utils';

export default function DataQualityDashboard() {
  const { data: quality } = useQuery({ queryKey: ['data-quality'], queryFn: () => analyticsApi.dataQuality().then(r => r.data.data) });
  const completeness = quality?.completenessRate || 0;

  const metrics = [
    { label: 'Total Records', value: quality?.total || 0, type: 'info' },
    { label: 'Missing GPS', value: quality?.noGPS || 0, type: quality?.noGPS > 0 ? 'warn' : 'ok' },
    { label: 'Missing Phone', value: quality?.noPhone || 0, type: quality?.noPhone > 0 ? 'warn' : 'ok' },
    { label: 'Missing Email', value: quality?.noEmail || 0, type: quality?.noEmail > 0 ? 'warn' : 'ok' },
    { label: 'Missing Sector', value: quality?.noSector || 0, type: quality?.noSector > 0 ? 'warn' : 'ok' },
    { label: 'Pending Correction', value: quality?.pendingCorrection || 0, type: quality?.pendingCorrection > 0 ? 'error' : 'ok' },
    { label: 'Unverified Records', value: quality?.unverified || 0, type: quality?.unverified > 0 ? 'warn' : 'ok' },
  ];

  return (
    <div className="page-container">
      <div className="page-header">
        <div><h1 className="page-title">Data Quality Dashboard</h1>
          <p className="page-subtitle">Monitor and improve MSME registry data completeness</p></div>
      </div>
      {/* Big score */}
      <div className="card mb-6 p-8 flex items-center gap-8 border-l-4 border-l-primary-600">
        <div className="text-center">
          <div className="relative w-32 h-32">
            <svg viewBox="0 0 36 36" className="w-32 h-32 -rotate-90">
              <circle cx="18" cy="18" r="15.9" fill="none" stroke="#e5e7eb" strokeWidth="2.5" />
              <circle cx="18" cy="18" r="15.9" fill="none" stroke={completeness >= 80 ? '#15803d' : completeness >= 60 ? '#d97706' : '#b91c1c'} strokeWidth="2.5"
                strokeDasharray={`${completeness} ${100 - completeness}`} strokeLinecap="round" />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-xl font-black text-primary-700">{completeness}%</span>
          </div>
          <p className="text-sm text-muted-foreground mt-2">Data Completeness Score</p>
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-lg mb-1">{completeness >= 80 ? '✅ Good Quality' : completeness >= 60 ? '⚠️ Needs Improvement' : '❌ Critical Issues'}</h3>
          <p className="text-muted-foreground text-sm mb-4">{completeness >= 80 ? 'Your data quality is strong. Continue monitoring for new records.' : 'Several records are missing critical fields. Use the actions below to resolve issues.'}</p>
          <div className="flex gap-3 flex-wrap">
            <button className="btn-primary btn-sm">Run Data Audit</button>
            <button className="btn-secondary btn-sm">Export Quality Report</button>
          </div>
        </div>
      </div>
      {/* Metric cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map(m => (
          <div key={m.label} className={`card p-5 border-l-4 ${m.type === 'ok' ? 'border-l-success-600' : m.type === 'warn' ? 'border-l-warning-600' : m.type === 'error' ? 'border-l-destructive' : 'border-l-primary-600'}`}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">{m.label}</p>
                <p className="text-2xl font-black">{formatNumber(m.value)}</p>
              </div>
              {m.type === 'ok' ? <CheckCircle2 size={20} className="text-success-600" /> : m.type === 'warn' ? <AlertTriangle size={20} className="text-warning-600" /> : m.type === 'error' ? <AlertTriangle size={20} className="text-destructive" /> : <Info size={20} className="text-primary-600" />}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
