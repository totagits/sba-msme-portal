import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { opportunitiesApi } from '../../lib/api';
import { formatDate } from '../../lib/utils';
import { Briefcase, Plus, Eye, Loader2 } from 'lucide-react';

export default function OpportunitiesPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', type: 'GRANT', status: 'OPEN', deadline: '' });

  const { data, isLoading } = useQuery({ queryKey: ['opportunities'], queryFn: () => opportunitiesApi.list().then(r => r.data.data) });
  const createMutation = useMutation({
    mutationFn: () => opportunitiesApi.create(form),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['opportunities'] }); setShowForm(false); setForm({ title: '', description: '', type: 'GRANT', status: 'OPEN', deadline: '' }); },
  });

  const TYPES = ['GRANT','LOAN','MENTORSHIP','TRAINING','MARKET_ACCESS','EXPORT_SUPPORT','TECHNOLOGY','OTHER'];

  return (
    <div className="page-container">
      <div className="page-header">
        <div><h1 className="page-title flex items-center gap-2"><Briefcase size={22} className="text-primary-600"/>Business Opportunities</h1>
          <p className="page-subtitle">Grants, loans, training, and market opportunities for MSMEs</p></div>
        <button onClick={() => setShowForm(true)} className="btn-primary btn-sm gap-1.5"><Plus size={14}/>Add Opportunity</button>
      </div>

      {/* Add Opportunity Form */}
      {showForm && (
        <div className="card mb-6">
          <div className="card-header"><p className="card-title">New Opportunity</p></div>
          <div className="card-body space-y-4">
            <div><label className="form-label">Title *</label><input className="form-input" value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))} placeholder="Opportunity title"/></div>
            <div><label className="form-label">Description</label><textarea className="form-input" rows={3} value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} placeholder="Details about this opportunity..."/></div>
            <div className="grid grid-cols-3 gap-4">
              <div><label className="form-label">Type</label><select className="form-input" value={form.type} onChange={e=>setForm(f=>({...f,type:e.target.value}))}>{TYPES.map(t=><option key={t} value={t}>{t.replace(/_/g,' ')}</option>)}</select></div>
              <div><label className="form-label">Status</label><select className="form-input" value={form.status} onChange={e=>setForm(f=>({...f,status:e.target.value}))}><option value="OPEN">Open</option><option value="CLOSED">Closed</option><option value="UPCOMING">Upcoming</option></select></div>
              <div><label className="form-label">Deadline</label><input type="date" className="form-input" value={form.deadline} onChange={e=>setForm(f=>({...f,deadline:e.target.value}))}/></div>
            </div>
          </div>
          <div className="px-6 py-4 border-t border-border flex gap-2 justify-end bg-muted/30">
            <button onClick={()=>setShowForm(false)} className="btn-secondary">Cancel</button>
            <button onClick={()=>createMutation.mutate()} disabled={!form.title||createMutation.isPending} className="btn-primary gap-1.5">
              {createMutation.isPending&&<Loader2 size={14} className="animate-spin"/>}Save Opportunity
            </button>
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {isLoading ? Array.from({length:6}).map((_,i)=><div key={i} className="card p-6"><div className="skeleton h-24 rounded"/></div>) :
         (data||[]).length===0 ? (
          <div className="card p-12 text-center col-span-full">
            <Briefcase size={48} className="text-muted-foreground/30 mx-auto mb-4"/>
            <p className="font-medium text-muted-foreground">No opportunities yet</p>
            <button onClick={()=>setShowForm(true)} className="btn-primary btn-sm mt-4 gap-1.5"><Plus size={14}/>Add First Opportunity</button>
          </div>
         ) : (data||[]).map((opp:any)=>(
          <div key={opp.id} className="card hover:shadow-card-hover hover:-translate-y-0.5 transition-all">
            <div className="card-header">
              <div>
                <h3 className="font-semibold text-foreground">{opp.title}</h3>
                <div className="flex gap-2 mt-1.5">
                  <span className="chip chip-blue text-xs">{opp.type?.replace(/_/g,' ')}</span>
                  <span className={`chip text-xs ${opp.status==='OPEN'?'chip-green':opp.status==='UPCOMING'?'chip-amber':'chip-gray'}`}>{opp.status}</span>
                </div>
              </div>
            </div>
            <div className="card-body">
              <p className="text-sm text-muted-foreground line-clamp-2">{opp.description||'No description provided.'}</p>
              {opp.deadline && <p className="text-xs text-muted-foreground mt-3">⏰ Deadline: {formatDate(opp.deadline)}</p>}
              {opp._count?.matches !== undefined && <p className="text-xs text-primary-600 mt-1 font-medium">{opp._count.matches} MSME{opp._count.matches!==1?'s':''} matched</p>}
            </div>
          </div>
         ))}
      </div>
    </div>
  );
}
