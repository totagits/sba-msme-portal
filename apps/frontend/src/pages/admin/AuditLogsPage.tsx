import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { auditApi } from '../../lib/api';
import { formatDate, debounce } from '../../lib/utils';
import { ClipboardList, Search } from 'lucide-react';

const ACTIONS = ['CREATE','UPDATE','DELETE','LOGIN','LOGOUT','WORKFLOW_TRANSITION','EXPORT','IMPORT','PASSWORD_CHANGE','ROLE_ASSIGN'];
const ENTITIES = ['MSME','BDSP','USER','ROLE','SETTING','REPORT','IMPORT_BATCH','OPPORTUNITY','VERIFICATION'];

export default function AuditLogsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filters, setFilters] = useState({ action: '', entityType: '', dateFrom: '', dateTo: '' });

  const debouncedSetSearch = useCallback(debounce((v:string) => { setDebouncedSearch(v); setPage(1); }, 400), []);
  const params = { page, limit: 25, search: debouncedSearch, ...Object.fromEntries(Object.entries(filters).filter(([,v])=>v)) };
  const { data, isLoading } = useQuery({ queryKey: ['audit-logs', params], queryFn: () => auditApi.list(params).then(r => r.data) });

  const logs = data?.data || [];
  const pagination = data?.pagination;

  return (
    <div className="page-container">
      <div className="page-header">
        <div><h1 className="page-title flex items-center gap-2"><ClipboardList size={22} className="text-primary-600"/>Audit Logs</h1>
          <p className="page-subtitle">Complete audit trail of all system actions and data changes</p></div>
      </div>

      {/* Filters */}
      <div className="card mb-4">
        <div className="p-4 grid md:grid-cols-5 gap-3">
          <div className="md:col-span-2 relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"/>
            <input type="text" placeholder="Search user, description..." className="form-input pl-9 text-sm" value={search} onChange={e => { setSearch(e.target.value); debouncedSetSearch(e.target.value); }} />
          </div>
          <select className="form-input text-sm" value={filters.action} onChange={e=>setFilters(f=>({...f,action:e.target.value}))}>
            <option value="">All Actions</option>{ACTIONS.map(a=><option key={a} value={a}>{a.replace(/_/g,' ')}</option>)}
          </select>
          <select className="form-input text-sm" value={filters.entityType} onChange={e=>setFilters(f=>({...f,entityType:e.target.value}))}>
            <option value="">All Entities</option>{ENTITIES.map(e=><option key={e} value={e}>{e}</option>)}
          </select>
          <input type="date" className="form-input text-sm" value={filters.dateFrom} onChange={e=>setFilters(f=>({...f,dateFrom:e.target.value}))} placeholder="From date"/>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead><tr><th>Timestamp</th><th>User</th><th>Action</th><th>Entity</th><th>Description</th><th>IP Address</th></tr></thead>
            <tbody>
              {isLoading ? Array.from({length:8}).map((_,i)=><tr key={i}>{Array.from({length:6}).map((_,j)=><td key={j}><div className="skeleton h-4 rounded"/></td>)}</tr>) :
               logs.length===0 ? <tr><td colSpan={6} className="text-center py-12 text-muted-foreground">No audit logs found</td></tr> :
               logs.map((log:any)=>(
                <tr key={log.id}>
                  <td className="text-xs text-muted-foreground font-mono whitespace-nowrap">{formatDate(log.createdAt,'datetime')}</td>
                  <td className="text-sm">
                    <p className="font-medium">{log.user?.firstName} {log.user?.lastName}</p>
                    <p className="text-xs text-muted-foreground">{log.user?.email}</p>
                  </td>
                  <td>
                    <span className={`chip text-xs font-mono ${log.action==='CREATE'?'chip-green':log.action==='DELETE'?'chip-red':log.action.includes('LOGIN')?'chip-purple':'chip-blue'}`}>
                      {log.action}
                    </span>
                  </td>
                  <td><span className="chip chip-gray text-xs">{log.entityType}</span></td>
                  <td className="text-sm max-w-xs truncate" title={log.description}>{log.description}</td>
                  <td className="text-xs font-mono text-muted-foreground">{log.ipAddress||'—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {pagination && pagination.totalPages > 1 && (
          <div className="px-6 py-4 border-t border-border flex items-center justify-between">
            <p className="text-xs text-muted-foreground">{pagination.total.toLocaleString()} total log entries</p>
            <div className="flex items-center gap-1">
              <button disabled={page===1} onClick={()=>setPage(p=>p-1)} className="btn-secondary btn-sm">← Prev</button>
              <span className="text-xs text-muted-foreground px-3">Page {page} of {pagination.totalPages}</span>
              <button disabled={page===pagination.totalPages} onClick={()=>setPage(p=>p+1)} className="btn-secondary btn-sm">Next →</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
