import { useState, useCallback } from 'react';
import { Link } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { msmeApi, settingsApi } from '../../lib/api';
import { formatDate, getStatusColor, getStatusLabel, getMSMECategoryColor, downloadBlob, debounce } from '../../lib/utils';
import { Plus, Search, Filter, Download, ChevronLeft, ChevronRight, Eye, Edit2, MoreVertical, Building2, CheckCircle2, AlertTriangle, Map } from 'lucide-react';
import { useAuth } from '../../lib/auth';

const BUSINESS_TYPES = ['SOLE_PROPRIETORSHIP','PARTNERSHIP','CORPORATION','COOPERATIVE','ASSOCIATION','INFORMAL_ENTERPRISE'];
const CATEGORIES = ['MICRO','SMALL','MEDIUM'];
const STATUSES = ['DRAFT','SUBMITTED','UNDER_REVIEW','VERIFIED','APPROVED','REJECTED','RETURNED_FOR_CORRECTION','ARCHIVED'];

export default function MSMEListPage() {
  const { hasPermission } = useAuth();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [exporting, setExporting] = useState(false);

  const debouncedSetSearch = useCallback(debounce((val: string) => { setDebouncedSearch(val); setPage(1); }, 400), []);

  const { data: counties } = useQuery({ queryKey: ['counties'], queryFn: () => settingsApi.getCounties().then(r => r.data.data) });
  const { data: sectors } = useQuery({ queryKey: ['sectors'], queryFn: () => settingsApi.getSectors().then(r => r.data.data) });

  const params = { page, limit: 20, search: debouncedSearch, ...filters };
  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['msmes', params],
    queryFn: () => msmeApi.list(params).then(r => r.data),
  });

  const msmes = data?.data || [];
  const pagination = data?.pagination;

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    debouncedSetSearch(e.target.value);
  };

  const handleFilter = (key: string, val: string) => {
    setFilters(prev => val ? { ...prev, [key]: val } : Object.fromEntries(Object.entries(prev).filter(([k]) => k !== key)));
    setPage(1);
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const response = await msmeApi.export(filters);
      downloadBlob(response.data, `msmes-export-${Date.now()}.csv`);
    } catch {}
    setExporting(false);
  };

  const activeFilterCount = Object.keys(filters).length;

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <Building2 size={22} className="text-primary-600" />
            MSME Registry
          </h1>
          <p className="page-subtitle">
            {pagination?.total !== undefined ? `${pagination.total.toLocaleString()} enterprises registered` : 'Loading...'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {hasPermission('msme:read') && (
            <Link href="/map">
              <a className="btn-secondary btn-sm gap-1.5"><Map size={14} />Map View</a>
            </Link>
          )}
          {hasPermission('msme:export') && (
            <button onClick={handleExport} disabled={exporting} className="btn-secondary btn-sm gap-1.5">
              <Download size={14} />{exporting ? 'Exporting...' : 'Export CSV'}
            </button>
          )}
          {hasPermission('msme:create') && (
            <Link href="/msmes/new">
              <a id="msme-create-btn" className="btn-primary btn-sm gap-1.5"><Plus size={14} />Register MSME</a>
            </Link>
          )}
        </div>
      </div>

      {/* Search + Filter Bar */}
      <div className="card mb-4">
        <div className="p-4 flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              id="msme-search"
              type="text"
              placeholder="Search by name, phone, owner, registration number..."
              className="form-input pl-9"
              value={search}
              onChange={handleSearch}
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`btn-secondary btn-sm gap-1.5 ${activeFilterCount > 0 ? 'bg-primary-50 border-primary-300 text-primary-700' : ''}`}
          >
            <Filter size={14} />
            Filters
            {activeFilterCount > 0 && <span className="bg-primary-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">{activeFilterCount}</span>}
          </button>
          {activeFilterCount > 0 && (
            <button onClick={() => { setFilters({}); setPage(1); }} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
              Clear all
            </button>
          )}
        </div>

        {showFilters && (
          <div className="px-4 pb-4 border-t border-border grid grid-cols-2 md:grid-cols-4 gap-3 pt-4">
            <div>
              <label className="form-label text-xs">County</label>
              <select className="form-input text-sm" value={filters.countyId || ''} onChange={e => handleFilter('countyId', e.target.value)}>
                <option value="">All Counties</option>
                {(counties || []).map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label text-xs">Sector</label>
              <select className="form-input text-sm" value={filters.sectorId || ''} onChange={e => handleFilter('sectorId', e.target.value)}>
                <option value="">All Sectors</option>
                {(sectors || []).map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label text-xs">Category</label>
              <select className="form-input text-sm" value={filters.msmeCategory || ''} onChange={e => handleFilter('msmeCategory', e.target.value)}>
                <option value="">All Categories</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c.charAt(0) + c.slice(1).toLowerCase()}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label text-xs">Status</label>
              <select className="form-input text-sm" value={filters.workflowStatus || ''} onChange={e => handleFilter('workflowStatus', e.target.value)}>
                <option value="">All Statuses</option>
                {STATUSES.map(s => <option key={s} value={s}>{getStatusLabel(s)}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label text-xs">Youth-Led</label>
              <select className="form-input text-sm" value={filters.isYouthLed || ''} onChange={e => handleFilter('isYouthLed', e.target.value)}>
                <option value="">All</option>
                <option value="true">Yes</option>
              </select>
            </div>
            <div>
              <label className="form-label text-xs">Women-Led</label>
              <select className="form-input text-sm" value={filters.isWomenLed || ''} onChange={e => handleFilter('isWomenLed', e.target.value)}>
                <option value="">All</option>
                <option value="true">Yes</option>
              </select>
            </div>
            <div>
              <label className="form-label text-xs">Business Type</label>
              <select className="form-input text-sm" value={filters.businessType || ''} onChange={e => handleFilter('businessType', e.target.value)}>
                <option value="">All Types</option>
                {BUSINESS_TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g,' ')}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label text-xs">Stage</label>
              <select className="form-input text-sm" value={filters.businessStage || ''} onChange={e => handleFilter('businessStage', e.target.value)}>
                <option value="">All Stages</option>
                {['IDEA','STARTUP','EARLY_GROWTH','GROWTH','MATURE'].map(s => <option key={s} value={s}>{s.replace(/_/,' ')}</option>)}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Business Name</th>
                <th>Category</th>
                <th>County</th>
                <th>Sector</th>
                <th>Owner</th>
                <th>Phone</th>
                <th>Employees</th>
                <th>Tags</th>
                <th>Status</th>
                <th>Registered</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 11 }).map((_, j) => (
                      <td key={j}><div className="skeleton h-4 rounded w-full" /></td>
                    ))}
                  </tr>
                ))
              ) : msmes.length === 0 ? (
                <tr>
                  <td colSpan={11} className="text-center py-16">
                    <Building2 size={40} className="text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-muted-foreground font-medium">No MSMEs found</p>
                    <p className="text-muted-foreground text-xs mt-1">Try adjusting your search or filters</p>
                    {hasPermission('msme:create') && (
                      <Link href="/msmes/new"><a className="btn-primary btn-sm mt-4 inline-flex"><Plus size={14} />Register First MSME</a></Link>
                    )}
                  </td>
                </tr>
              ) : (
                msmes.map((msme: any) => (
                  <tr key={msme.id} className={isFetching ? 'opacity-60' : ''}>
                    <td>
                      <Link href={`/msmes/${msme.id}`}>
                        <a className="font-medium text-primary-700 hover:text-primary-900 hover:underline transition-colors">
                          {msme.businessName}
                        </a>
                      </Link>
                      {msme.registrationNumber && (
                        <p className="text-xs text-muted-foreground font-mono mt-0.5">{msme.registrationNumber}</p>
                      )}
                    </td>
                    <td><span className={`chip ${getMSMECategoryColor(msme.msmeCategory)}`}>{msme.msmeCategory}</span></td>
                    <td className="text-sm">{msme.county?.name || '—'}</td>
                    <td className="text-sm text-muted-foreground">{msme.sector?.name || '—'}</td>
                    <td className="text-sm">{msme.ownerName || '—'}</td>
                    <td className="text-sm font-mono text-muted-foreground">{msme.phone || '—'}</td>
                    <td className="text-sm text-center">{msme.numberOfEmployees ?? '—'}</td>
                    <td>
                      <div className="flex gap-1 flex-wrap">
                        {msme.isYouthLed && <span className="chip chip-amber text-xs">Youth</span>}
                        {msme.isWomenLed && <span className="chip chip-red text-xs">Women</span>}
                        {msme.hasDisabilityInclusion && <span className="chip chip-purple text-xs">Disability</span>}
                      </div>
                    </td>
                    <td>
                      <span className={`status-badge ${getStatusColor(msme.workflowStatus)}`}>
                        {getStatusLabel(msme.workflowStatus)}
                      </span>
                    </td>
                    <td className="text-xs text-muted-foreground">{formatDate(msme.createdAt)}</td>
                    <td>
                      <div className="flex items-center justify-end gap-1">
                        <Link href={`/msmes/${msme.id}`}>
                          <a className="btn-ghost btn-sm p-1.5" title="View"><Eye size={14} /></a>
                        </Link>
                        {hasPermission('msme:update') && (
                          <Link href={`/msmes/${msme.id}/edit`}>
                            <a className="btn-ghost btn-sm p-1.5" title="Edit"><Edit2 size={14} /></a>
                          </Link>
                        )}
                        {hasPermission('msme:verify') && msme.workflowStatus === 'SUBMITTED' && (
                          <Link href={`/msmes/${msme.id}/verify`}>
                            <a className="btn-ghost btn-sm p-1.5 text-success-600" title="Verify"><CheckCircle2 size={14} /></a>
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="px-6 py-4 border-t border-border flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              Showing {((page - 1) * 20) + 1}–{Math.min(page * 20, pagination.total)} of {pagination.total.toLocaleString()} records
            </p>
            <div className="flex items-center gap-1">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="btn-secondary btn-sm p-1.5 disabled:opacity-40"><ChevronLeft size={14} /></button>
              {Array.from({ length: Math.min(7, pagination.totalPages) }, (_, i) => {
                const p = page <= 4 ? i + 1 : page + i - 3;
                if (p < 1 || p > pagination.totalPages) return null;
                return (
                  <button key={p} onClick={() => setPage(p)} className={`btn-sm px-3 py-1.5 rounded-md text-xs font-medium ${p === page ? 'bg-primary-700 text-white' : 'btn-secondary'}`}>{p}</button>
                );
              })}
              <button disabled={page === pagination.totalPages} onClick={() => setPage(p => p + 1)} className="btn-secondary btn-sm p-1.5 disabled:opacity-40"><ChevronRight size={14} /></button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
