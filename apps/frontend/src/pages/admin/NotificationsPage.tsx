import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationsApi } from '../../lib/api';
import { formatDate } from '../../lib/utils';
import { Bell, CheckCheck, Trash2 } from 'lucide-react';

export default function NotificationsPage() {
  const queryClient = useQueryClient();
  const { data: notifications, isLoading } = useQuery({ queryKey: ['notifications'], queryFn: () => notificationsApi.list().then(r => r.data.data) });
  const markAllRead = useMutation({ mutationFn: () => notificationsApi.markAllRead(), onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications','notificationCount'] }) });
  const markRead = useMutation({ mutationFn: (id:string) => notificationsApi.markRead(id), onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications','notificationCount'] }) });
  const del = useMutation({ mutationFn: (id:string) => notificationsApi.delete(id), onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications','notificationCount'] }) });

  const unread = (notifications||[]).filter((n:any) => !n.isRead);

  return (
    <div className="page-container max-w-3xl">
      <div className="page-header">
        <div><h1 className="page-title flex items-center gap-2"><Bell size={22} className="text-primary-600"/>Notifications</h1>
          <p className="page-subtitle">{unread.length} unread notifications</p></div>
        {unread.length>0 && <button onClick={()=>markAllRead.mutate()} className="btn-secondary btn-sm gap-1.5"><CheckCheck size={14}/>Mark All Read</button>}
      </div>

      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="divide-y divide-border">{Array.from({length:5}).map((_,i)=><div key={i} className="p-4"><div className="skeleton h-12 rounded"/></div>)}</div>
        ) : (notifications||[]).length===0 ? (
          <div className="p-16 text-center">
            <Bell size={48} className="text-muted-foreground/30 mx-auto mb-4"/>
            <p className="font-medium text-muted-foreground">No notifications</p>
            <p className="text-xs text-muted-foreground mt-1">System notifications will appear here</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {(notifications||[]).map((n:any)=>(
              <div key={n.id} className={`p-4 flex items-start gap-4 transition-colors hover:bg-muted/30 ${!n.isRead ? 'bg-primary-50/40' : ''}`}>
                <div className={`w-2.5 h-2.5 rounded-full mt-2 flex-shrink-0 ${!n.isRead ? 'bg-primary-600' : 'bg-transparent border border-muted-foreground/30'}`}/>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm ${!n.isRead ? 'font-semibold text-foreground' : 'text-foreground'}`}>{n.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{n.message}</p>
                  <p className="text-xs text-muted-foreground mt-1">{formatDate(n.createdAt,'datetime')}</p>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  {!n.isRead && <button onClick={()=>markRead.mutate(n.id)} className="btn-ghost btn-sm p-1.5 text-xs text-primary-600" title="Mark as read"><CheckCheck size={14}/></button>}
                  <button onClick={()=>del.mutate(n.id)} className="btn-ghost btn-sm p-1.5 text-muted-foreground hover:text-destructive"><Trash2 size={14}/></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
