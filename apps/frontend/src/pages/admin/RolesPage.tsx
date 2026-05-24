import { useQuery } from '@tanstack/react-query';
import { usersApi } from '../../lib/api';
import { ShieldCheck, CheckCircle2 } from 'lucide-react';

export default function RolesPage() {
  const { data: roles, isLoading } = useQuery({ queryKey: ['roles'], queryFn: () => usersApi.getRoles().then(r => r.data.data) });

  return (
    <div className="page-container">
      <div className="page-header">
        <div><h1 className="page-title flex items-center gap-2"><ShieldCheck size={22} className="text-primary-600"/>Roles & Permissions</h1>
          <p className="page-subtitle">System roles and their associated permissions</p></div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {isLoading ? Array.from({length:4}).map((_,i)=><div key={i} className="card p-6"><div className="skeleton h-40 rounded"/></div>) :
         (roles||[]).map((role:any)=>(
          <div key={role.id} className="card">
            <div className="card-header">
              <div>
                <p className="card-title">{role.displayName}</p>
                <p className="text-xs text-muted-foreground font-mono mt-0.5">{role.name}</p>
              </div>
            </div>
            <div className="card-body">
              {role.description && <p className="text-sm text-muted-foreground mb-3">{role.description}</p>}
              <div className="flex flex-wrap gap-1.5">
                {role.permissions?.map((p:any)=>(
                  <span key={p.id} className="flex items-center gap-1 text-xs bg-primary-50 text-primary-700 border border-primary-200 rounded px-2 py-0.5 font-mono">
                    <CheckCircle2 size={10}/>{p.name}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
