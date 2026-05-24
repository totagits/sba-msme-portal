import { useState, useCallback } from 'react';
import { Link } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { bdspApi, settingsApi } from '../../lib/api';
import { formatDate, getStatusColor, getStatusLabel, debounce } from '../../lib/utils';
import { Plus, Search, Filter, Download, ChevronLeft, ChevronRight, Eye, Edit2, Users2, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../lib/auth';
import { downloadBlob } from '../../lib/utils';

const PROVIDER_TYPES = ['CONSULTANT','TRAINING_INSTITUTION','INCUBATOR','ACCELERATOR','FINANCIAL_INSTITUTION','NGO','COOPERATIVE_SUPPORT','MENTOR','TECHNOLOGY_PROVIDER','MARKET_LINKAGE','LEGAL_ACCOUNTING'];
const STATUSES = ['DRAFT','SUBMITTED','UNDER_REVIEW','VERIFIED','APPROVED','REJECTED','RETURNED_FOR_CORRECTION','ARCHIVED'];

export default function BDSPListPage() {
  const { hasPermission } = useAuth();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<Record<string, string>>({});

  const debouncedSetSearch = useCallback(debounce((val: string) => { setDebouncedSearch(val); setPage(1); }, 400), []);
  const { data: counties } = useQuery({ queryKey: ['counties'], queryFn: () => settingsApi.getCounties().then(r => r.data.data) });
  const params = { page, limit: 20, search: debouncedSearch, ...filters };
  const { data, isLoading } = useQuery({ queryKey: ['bdsps', params], queryFn: () => bdspApi.list(params).then(r => r.data) });

  const bdsps = data?.data || [];
  const pagination = data?.pagination;

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => { setSearch(e.target.value); debouncedSetSearch(e.target.value); };
  const handleFilter = (key: string, val: string) => { setFilters(prev => val ? { ...prev, [key]: val } : Object.fromEntries(Object.entries(prev).filter(([k]) => k !== key))); setPage(1); };
  const handleExport = async () => { try { const r = await bdspApi.export(); downloadBlob(r.data, `bdsps-export-${Date.now()}.csv`); } catch {} };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title flex items-center gap-2"><Users2 size={22} className="text-primary-600" />BDSP Registry</h1>
          <p className="page-subtitle">{pagination?.total !== undefined ? `${pagination.total.toLocaleString()} service providers registered` : 'Loading...'}</p>
        </div>
        <div className="flex items-center gap-2">
          {hasPermission('bdsp:read') && <button onClick={handleExport} className="btn-secondary btn-sm gap-1.5"><Download size={14} />Export CSV</button>}
          {hasPermission('bdsp:create') && <Link href="/bdsps/new"><a className="btn-primary btn-sm gap-1.5"><Plus size={14} />Register BDSP</a></Link>}
        </div>
      </div>

      <div className="card mb-4">
        <div className="p-4 flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input type="text" placeholder="Search by provider name, contact person, phone..." className="form-input pl-9" value={search} onChange={handleSearch} />
          </div>
          <button onClick={() => setShowFilters(!showFilters)} className={`btn-secondary btn-sm gap-1.5 ${Object.keys(filters).length > 0 ? 'bg-primary-50 border-primary-300 text-primary-700' : ''}`}>
            <Filter size={14} />Filters {Object.keys(filters).length > 0 && `(${Object.keys(filters).length})`}
          </button>
        </div>
        {showFilters && (
          <div className="px-4 pb-4 border-t border-border grid grid-cols-2 md:grid-cols-4 gap-3 pt-4">
            <div><label className="form-label text-xs">County</label>
              <select className="form-input text-sm" value={filters.countyId||''} onChange={e=>handleFilter('countyId',e.target.value)}>
                <option value="">All Counties</option>{(counties||[]).map((c:any)=><option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div><label className="form-label text-xs">Provider Type</label>
              <select className="form-input text-sm" value={filters.providerType||''} onChange={e=>handleFilter('providerType',e.target.value)}>
                <option value="">All Types</option>{PROVIDER_TYPES.map(t=><option key={t} value={t}>{t.replace(/_/g,' ')}</option>)}
              </select>
            </div>
            <div><label className="form-label text-xs">Status</label>
              <select className="form-input text-sm" value={filters.workflowStatus||''} onChange={e=>handleFilter('workflowStatus',e.target.value)}>
                <option value="">All Statuses</option>{STATUSES.map(s=><option key={s} value={s}>{getStatusLabel(s)}</option>)}
              </select>
            </div>
            <div><label className="form-label text-xs">Availability</label>
              <select className="form-input text-sm" value={filters.availabilityStatus||''} onChange={e=>handleFilter('availabilityStatus',e.target.value)}>
                <option value="">All</option><option value="AVAILABLE">Available</option><option value="UNAVAILABLE">Unavailable</option><option value="SEASONAL">Seasonal</option>
              </select>
            </div>
          </div>
        )}
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Provider Name</th><th>Type</th><th>County</th><th>Contact</th><th>Phone</th><th>Experience</th><th>Staff</th><th>Availability</th><th>Status</th><th>Registered</th><th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({length:6}).map((_,i)=><tr key={i}>{Array.from({length:11}).map((_,j)=><td key={j}><div className="skeleton h-4 rounded" /></td>)}</tr>)
              ) : bdsps.length===0 ? (
                <tr><td colSpan={11} className="text-center py-16">
                  <Users2 size={40} className="text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-muted-foreground font-medium">No BDSPs found</p>
                  {hasPermission('bdsp:create') && <Link href="/bdsps/new"><a className="btn-primary btn-sm mt-4 inline-flex"><Plus size={14} />Register First BDSP</a></Link>}
                </td></tr>
              ) : bdsps.map((bdsp:any)=>(
                <tr key={bdsp.id}>
                  <td>
                    <Link href={`/bdsps/${bdsp.id}`}><a className="font-medium text-primary-700 hover:underline">{bdsp.providerName}</a></Link>
                    {bdsp.certifications?.length>0 && <p className="text-xs text-muted-foreground mt-0.5">✓ {bdsp.certifications.length} certification{bdsp.certifications.length>1?'s':''}</p>}
                  </td>
                  <td><span className="chip chip-blue text-xs">{bdsp.providerType?.replace(/_/g,' ')}</span></td>
                  <td className="text-sm">{bdsp.county?.name || '—'}</td>
                  <td className="text-sm">{bdsp.contactPerson || '—'}</td>
                  <td className="text-sm font-mono text-muted-foreground">{bdsp.phone || '—'}</td>
                  <td className="text-sm text-center">{bdsp.yearsOfExperience ? `${bdsp.yearsOfExperience}y` : '—'}</td>
                  <td className="text-sm text-center">{bdsp.staffCapacity ?? '—'}</td>
                  <td><span className={`chip text-xs ${bdsp.availabilityStatus==='AVAILABLE'?'chip-green':bdsp.availabilityStatus==='SEASONAL'?'chip-amber':'chip-red'}`}>{bdsp.availabilityStatus}</span></td>
                  <td><span className={`status-badge ${getStatusColor(bdsp.workflowStatus)}`}>{getStatusLabel(bdsp.workflowStatus)}</span></td>
                  <td className="text-xs text-muted-foreground">{formatDate(bdsp.createdAt)}</td>
                  <td>
                    <div className="flex items-center justify-end gap-1">
                      <Link href={`/bdsps/${bdsp.id}`}><a className="btn-ghost btn-sm p-1.5"><Eye size={14} /></a></Link>
                      {hasPermission('bdsp:update') && <Link href={`/bdsps/${bdsp.id}/edit`}><a className="btn-ghost btn-sm p-1.5"><Edit2 size={14} /></a></Link>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {pagination && pagination.totalPages > 1 && (
          <div className="px-6 py-4 border-t border-border flex items-center justify-between">
            <p className="text-xs text-muted-foreground">Showing {((page-1)*20)+1}–{Math.min(page*20,pagination.total)} of {pagination.total.toLocaleString()} records</p>
            <div className="flex items-center gap-1">
              <button disabled={page===1} onClick={()=>setPage(p=>p-1)} className="btn-secondary btn-sm p-1.5 disabled:opacity-40"><ChevronLeft size={14} /></button>
              {Array.from({length:Math.min(5,pagination.totalPages)},(_,i)=>{ const p=page<=3?i+1:page+i-2; if(p<1||p>pagination.totalPages) return null; return <button key={p} onClick={()=>setPage(p)} className={`btn-sm px-3 py-1.5 rounded-md text-xs font-medium ${p===page?'bg-primary-700 text-white':'btn-secondary'}`}>{p}</button>; })}
              <button disabled={page===pagination.totalPages} onClick={()=>setPage(p=>p+1)} className="btn-secondary btn-sm p-1.5 disabled:opacity-40"><ChevronRight size={14} /></button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
