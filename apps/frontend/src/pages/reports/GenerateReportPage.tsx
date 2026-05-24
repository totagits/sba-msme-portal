import { useState } from 'react';
import { useLocation } from 'wouter';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { reportsApi, settingsApi } from '../../lib/api';
import { Link } from 'wouter';
import { ArrowLeft, FileText, Loader2 } from 'lucide-react';

const REPORT_TYPES = [
  { value: 'NATIONAL_OVERVIEW', label: 'National Overview' },
  { value: 'COUNTY_PERFORMANCE', label: 'County Performance' },
  { value: 'SECTOR_ANALYSIS', label: 'Sector Analysis' },
  { value: 'YOUTH_WOMEN', label: 'Youth & Women Inclusion' },
  { value: 'WORKFLOW_PIPELINE', label: 'Workflow Pipeline' },
  { value: 'EMPLOYMENT', label: 'Employment Impact' },
  { value: 'DATA_QUALITY', label: 'Data Quality Audit' },
  { value: 'BDSP_CAPACITY', label: 'BDSP Capacity' },
  { value: 'CUSTOM', label: 'Custom Report' },
];

const PERIODS = [
  { value: 'MONTHLY', label: 'Monthly' },
  { value: 'QUARTERLY', label: 'Quarterly' },
  { value: 'SEMI_ANNUAL', label: 'Semi-Annual' },
  { value: 'ANNUAL', label: 'Annual' },
  { value: 'ALL_TIME', label: 'All Time' },
  { value: 'CUSTOM_RANGE', label: 'Custom Date Range' },
];

export default function GenerateReportPage() {
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ reportType: 'NATIONAL_OVERVIEW', period: 'ALL_TIME', title: '', countyId: '', sectorId: '', dateFrom: '', dateTo: '' });

  const { data: counties } = useQuery({ queryKey: ['counties'], queryFn: () => settingsApi.getCounties().then(r => r.data.data) });
  const { data: sectors } = useQuery({ queryKey: ['sectors'], queryFn: () => settingsApi.getSectors().then(r => r.data.data) });

  const generateMutation = useMutation({
    mutationFn: () => reportsApi.generate({ ...form, title: form.title || REPORT_TYPES.find(r => r.value === form.reportType)?.label || form.reportType }),
    onSuccess: (res) => { queryClient.invalidateQueries({ queryKey: ['reports'] }); navigate(`/reports/${res.data.data.id}`); },
  });

  return (
    <div className="page-container max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/reports"><a className="btn-ghost p-2"><ArrowLeft size={18} /></a></Link>
        <div><h1 className="page-title">Generate Report</h1><p className="page-subtitle">Configure and generate a new analytical report</p></div>
      </div>

      <div className="card">
        <div className="card-body space-y-5">
          <div>
            <label className="form-label">Report Title (optional)</label>
            <input className="form-input" placeholder="Auto-generated if left empty" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
          </div>
          <div>
            <label className="form-label">Report Type *</label>
            <select className="form-input" value={form.reportType} onChange={e => setForm(f => ({ ...f, reportType: e.target.value }))}>
              {REPORT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">Period</label>
            <select className="form-input" value={form.period} onChange={e => setForm(f => ({ ...f, period: e.target.value }))}>
              {PERIODS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select>
          </div>

          {form.period === 'CUSTOM_RANGE' && (
            <div className="grid grid-cols-2 gap-4">
              <div><label className="form-label">From Date</label><input type="date" className="form-input" value={form.dateFrom} onChange={e => setForm(f => ({ ...f, dateFrom: e.target.value }))} /></div>
              <div><label className="form-label">To Date</label><input type="date" className="form-input" value={form.dateTo} onChange={e => setForm(f => ({ ...f, dateTo: e.target.value }))} /></div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Filter by County (optional)</label>
              <select className="form-input" value={form.countyId} onChange={e => setForm(f => ({ ...f, countyId: e.target.value }))}>
                <option value="">All Counties</option>
                {(counties || []).map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Filter by Sector (optional)</label>
              <select className="form-input" value={form.sectorId} onChange={e => setForm(f => ({ ...f, sectorId: e.target.value }))}>
                <option value="">All Sectors</option>
                {(sectors || []).map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          </div>

          {/* Preview of what will be included */}
          <div className="bg-primary-50 border border-primary-200 rounded-xl p-4">
            <p className="text-sm font-semibold text-primary-700 mb-2">Report will include:</p>
            <ul className="text-xs text-primary-600 space-y-1 list-disc ml-4">
              <li>Total MSMEs and BDSPs registered in selected period and filters</li>
              <li>Breakdown by county, sector, and MSME category</li>
              <li>Youth-led and women-led enterprise counts</li>
              <li>Employment statistics (total, female, youth)</li>
              <li>Workflow pipeline status summary</li>
              {form.reportType === 'DATA_QUALITY' && <li>Data completeness and quality metrics</li>}
            </ul>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-border flex justify-between bg-muted/30">
          <Link href="/reports"><a className="btn-secondary">Cancel</a></Link>
          <button onClick={() => generateMutation.mutate()} disabled={generateMutation.isPending} className="btn-primary gap-2">
            {generateMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <FileText size={16} />}
            {generateMutation.isPending ? 'Generating...' : 'Generate Report'}
          </button>
        </div>
      </div>
    </div>
  );
}
