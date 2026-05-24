import { useQuery } from '@tanstack/react-query';
import { usersApi } from '../../lib/api';
import { formatDate, getStatusColor, getStatusLabel } from '../../lib/utils';
import { Link } from 'wouter';
import { ArrowLeft, ShieldCheck } from 'lucide-react';

export default function UserDetailPage({ id }: { id: string }) {
  const { data: user, isLoading } = useQuery({ queryKey: ['user', id], queryFn: () => usersApi.getById(id).then(r => r.data.data) });

  if (isLoading) return <div className="page-container"><div className="skeleton h-48 rounded-xl"/></div>;
  if (!user) return <div className="page-container"><p className="text-muted-foreground">User not found.</p></div>;

  return (
    <div className="page-container max-w-3xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/users"><a className="btn-ghost p-2"><ArrowLeft size={18}/></a></Link>
        <div>
          <h1 className="page-title">{user.firstName} {user.lastName}</h1>
          <p className="page-subtitle">{user.email}</p>
        </div>
        <span className={`status-badge ml-auto ${getStatusColor(user.status)}`}>{getStatusLabel(user.status)}</span>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-6">
          <div className="card">
            <div className="card-header"><p className="card-title">Profile</p></div>
            <div className="card-body space-y-3 text-sm">
              {[['Email',user.email],['County',user.county?.name||'All Counties'],['Title',user.title||'—'],['Phone',user.phone||'—'],['Joined',formatDate(user.createdAt)],['Last Login',user.lastLoginAt?formatDate(user.lastLoginAt,'datetime'):'Never']].map(([l,v])=>(
                <div key={l} className="flex justify-between"><span className="text-muted-foreground">{l}:</span><span className="font-medium">{v}</span></div>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="card-header"><p className="card-title flex items-center gap-2"><ShieldCheck size={16}/>Roles</p></div>
            <div className="card-body">
              <div className="flex flex-wrap gap-2">
                {user.roles?.length>0 ? user.roles.map((r:any)=><span key={r.id} className="chip chip-blue">{r.displayName||r.name}</span>) : <p className="text-sm text-muted-foreground">No roles assigned</p>}
              </div>
            </div>
          </div>
        </div>

        <div>
          <div className="card">
            <div className="card-header"><p className="card-title">Login History</p></div>
            <div className="card-body">
              {user.loginHistory?.length>0 ? (
                <div className="space-y-2">
                  {user.loginHistory.slice(0,10).map((l:any)=>(
                    <div key={l.id} className="flex justify-between text-xs">
                      <span className="text-muted-foreground">{formatDate(l.createdAt,'datetime')}</span>
                      <span className={l.success?'text-success-600':'text-destructive'}>{l.success?'✓ Success':'✗ Failed'}</span>
                    </div>
                  ))}
                </div>
              ) : <p className="text-sm text-muted-foreground">No login history</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
