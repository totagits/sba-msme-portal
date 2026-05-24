import { useState } from 'react';
import { Link } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersApi } from '../../lib/api';
import { formatDate, getStatusColor, getStatusLabel } from '../../lib/utils';
import { Plus, Search, Eye, Edit2, User } from 'lucide-react';

export default function UserManagementPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({ queryKey: ['users', { page, search }], queryFn: () => usersApi.list({ page, limit: 20, search }).then(r => r.data) });
  const users = data?.data || [];
  const pagination = data?.pagination;

  return (
    <div className="page-container">
      <div className="page-header">
        <div><h1 className="page-title flex items-center gap-2"><User size={22} className="text-primary-600"/>User Management</h1>
          <p className="page-subtitle">Manage system users, roles, and access permissions</p></div>
        <Link href="/users/new"><a className="btn-primary btn-sm gap-1.5"><Plus size={14}/>Add User</a></Link>
      </div>

      <div className="card mb-4 p-4">
        <div className="relative max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"/>
          <input type="text" placeholder="Search users by name or email..." className="form-input pl-9" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead><tr><th>Name</th><th>Email</th><th>Roles</th><th>County</th><th>Status</th><th>Last Login</th><th>Created</th><th className="text-right">Actions</th></tr></thead>
            <tbody>
              {isLoading ? Array.from({length:6}).map((_,i)=><tr key={i}>{Array.from({length:8}).map((_,j)=><td key={j}><div className="skeleton h-4 rounded"/></td>)}</tr>) :
               users.length===0 ? <tr><td colSpan={8} className="text-center py-12 text-muted-foreground">No users found</td></tr> :
               users.map((u:any)=>(
                <tr key={u.id}>
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 text-xs font-bold flex-shrink-0">
                        {u.firstName.charAt(0)}{u.lastName.charAt(0)}
                      </div>
                      <span className="font-medium">{u.firstName} {u.lastName}</span>
                    </div>
                  </td>
                  <td className="text-sm text-muted-foreground">{u.email}</td>
                  <td>
                    <div className="flex flex-wrap gap-1">
                      {u.roles?.slice(0,2).map((r:any)=><span key={r.id||r.name} className="chip chip-blue text-xs">{r.displayName||r.name}</span>)}
                      {u.roles?.length>2 && <span className="chip chip-gray text-xs">+{u.roles.length-2}</span>}
                    </div>
                  </td>
                  <td className="text-sm">{u.county?.name||'—'}</td>
                  <td><span className={`status-badge ${getStatusColor(u.status)}`}>{getStatusLabel(u.status)}</span></td>
                  <td className="text-xs text-muted-foreground">{u.lastLoginAt ? formatDate(u.lastLoginAt,'datetime') : 'Never'}</td>
                  <td className="text-xs text-muted-foreground">{formatDate(u.createdAt)}</td>
                  <td>
                    <div className="flex items-center justify-end gap-1">
                      <Link href={`/users/${u.id}`}><a className="btn-ghost btn-sm p-1.5"><Eye size={14}/></a></Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {pagination?.totalPages > 1 && (
          <div className="px-6 py-4 border-t border-border flex items-center justify-between">
            <p className="text-xs text-muted-foreground">{pagination.total} total users</p>
            <div className="flex gap-1">
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
