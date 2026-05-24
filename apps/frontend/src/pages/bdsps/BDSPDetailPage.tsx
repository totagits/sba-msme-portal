import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'wouter';
import { bdspApi } from '../../lib/api';
import { formatDate, getStatusColor, getStatusLabel } from '../../lib/utils';
import { ArrowLeft, Edit2, MapPin, Phone, Mail, Globe, CheckCircle2, XCircle, RotateCcw, Archive, Send } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../../lib/auth';

const VALID_TRANSITIONS: Record<string, string[]> = {
  DRAFT: ['submit'], SUBMITTED: ['verify','return','reject'], UNDER_REVIEW: ['verify','return','reject'],
  RETURNED_FOR_CORRECTION: ['submit'], VERIFIED: ['approve','return','reject'], APPROVED: ['archive'], REJECTED: ['archive'], ARCHIVED: [],
};

export default function BDSPDetailPage({ id }: { id: string }) {
  const queryClient = useQueryClient();
  const { hasPermission } = useAuth();
  const [workflowModal, setWorkflowModal] = useState<string | null>(null);
  const [comment, setComment] = useState('');

  const { data: bdsp, isLoading } = useQuery({ queryKey: ['bdsp', id], queryFn: () => bdspApi.getById(id).then(r => r.data.data) });
  const workflowMutation = useMutation({
    mutationFn: (action: string) => bdspApi.workflow(id, { action, comment }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['bdsp', id] }); setWorkflowModal(null); setComment(''); },
  });

  if (isLoading) return <div className="page-container"><div className="space-y-4">{Array.from({length:4}).map((_,i)=><div key={i} className="skeleton h-20 rounded-xl"/>)}</div></div>;
  if (!bdsp) return <div className="page-container"><p className="text-muted-foreground">BDSP not found.</p></div>;

  const allowedActions = VALID_TRANSITIONS[bdsp.workflowStatus] || [];

  return (
    <div className="page-container max-w-5xl">
      <div className="flex items-start gap-4 mb-6">
        <Link href="/bdsps"><a className="btn-ghost p-2 mt-1"><ArrowLeft size={18} /></a></Link>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold">{bdsp.providerName}</h1>
            <span className="chip chip-blue">{bdsp.providerType?.replace(/_/g,' ')}</span>
            <span className={`status-badge ${getStatusColor(bdsp.workflowStatus)}`}>{getStatusLabel(bdsp.workflowStatus)}</span>
            <span className={`chip ${bdsp.availabilityStatus==='AVAILABLE'?'chip-green':bdsp.availabilityStatus==='SEASONAL'?'chip-amber':'chip-red'}`}>{bdsp.availabilityStatus}</span>
          </div>
          <p className="text-muted-foreground text-sm mt-1">{bdsp.county?.name} County {bdsp.sector?.name && `• ${bdsp.sector.name}`}</p>
        </div>
        {hasPermission('bdsp:update') && <Link href={`/bdsps/${id}/edit`}><a className="btn-secondary btn-sm gap-1.5"><Edit2 size={14} />Edit</a></Link>}
      </div>

      {allowedActions.length > 0 && (
        <div className="card mb-6 p-4 border-primary-200 bg-primary-50">
          <p className="text-xs font-semibold text-primary-700 uppercase tracking-wider mb-3">Workflow Actions</p>
          <div className="flex gap-2 flex-wrap">
            {allowedActions.includes('submit') && hasPermission('bdsp:create') && <button onClick={()=>setWorkflowModal('submit')} className="btn-primary btn-sm gap-1.5"><Send size={14}/>Submit for Review</button>}
            {allowedActions.includes('verify') && hasPermission('bdsp:approve') && <button onClick={()=>setWorkflowModal('verify')} className="bg-cyan-600 text-white hover:bg-cyan-700 btn btn-sm gap-1.5"><CheckCircle2 size={14}/>Verify</button>}
            {allowedActions.includes('approve') && hasPermission('bdsp:approve') && <button onClick={()=>setWorkflowModal('approve')} className="bg-success-600 text-white hover:bg-success-700 btn btn-sm gap-1.5"><CheckCircle2 size={14}/>Approve</button>}
            {allowedActions.includes('return') && hasPermission('bdsp:approve') && <button onClick={()=>setWorkflowModal('return')} className="bg-purple-600 text-white hover:bg-purple-700 btn btn-sm gap-1.5"><RotateCcw size={14}/>Return</button>}
            {allowedActions.includes('reject') && hasPermission('bdsp:approve') && <button onClick={()=>setWorkflowModal('reject')} className="btn-destructive btn-sm gap-1.5"><XCircle size={14}/>Reject</button>}
            {allowedActions.includes('archive') && hasPermission('bdsp:delete') && <button onClick={()=>setWorkflowModal('archive')} className="btn-secondary btn-sm gap-1.5"><Archive size={14}/>Archive</button>}
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="card">
            <div className="card-header"><p className="card-title">Provider Details</p></div>
            <div className="card-body grid md:grid-cols-2 gap-4 text-sm">
              {[['Registration Status',bdsp.registrationStatus?.replace(/_/g,' ')],['Years of Experience',bdsp.yearsOfExperience?`${bdsp.yearsOfExperience} years`:'—'],['Staff Capacity',bdsp.staffCapacity??'—'],['Service Pricing',bdsp.servicePricingModel||'—'],['Target Beneficiaries',bdsp.targetBeneficiaries||'—']].map(([l,v])=>(<div key={l}><p className="text-xs text-muted-foreground uppercase tracking-wider mb-0.5">{l}</p><p className="font-medium">{v}</p></div>))}
              {bdsp.pastAssignments && <div className="md:col-span-2"><p className="text-xs text-muted-foreground uppercase tracking-wider mb-0.5">Past Assignments</p><p className="text-sm">{bdsp.pastAssignments}</p></div>}
            </div>
          </div>

          <div className="card">
            <div className="card-header"><p className="card-title">Contact Information</p></div>
            <div className="card-body grid md:grid-cols-2 gap-4 text-sm">
              <div><p className="text-xs text-muted-foreground uppercase">Contact Person</p><p className="font-medium">{bdsp.contactPerson||'—'}</p></div>
              <div className="flex flex-col gap-2">
                {bdsp.phone && <a href={`tel:${bdsp.phone}`} className="flex items-center gap-1.5 text-primary-700 hover:underline"><Phone size={14}/>{bdsp.phone}</a>}
                {bdsp.email && <a href={`mailto:${bdsp.email}`} className="flex items-center gap-1.5 text-primary-700 hover:underline"><Mail size={14}/>{bdsp.email}</a>}
                {bdsp.website && <a href={bdsp.website} target="_blank" rel="noopener" className="flex items-center gap-1.5 text-primary-700 hover:underline"><Globe size={14}/>{bdsp.website}</a>}
              </div>
            </div>
          </div>

          {bdsp.services?.length > 0 && (
            <div className="card">
              <div className="card-header"><p className="card-title">Services Offered ({bdsp.services.length})</p></div>
              <div className="card-body"><div className="flex flex-wrap gap-2">{bdsp.services.map((s:any)=><span key={s.id} className="chip chip-blue">{s.name}</span>)}</div></div>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="card p-4">
            <p className="card-title mb-3">Location</p>
            <div className="space-y-1 text-sm">
              <div className="flex items-center gap-2"><MapPin size={14} className="text-muted-foreground"/>{bdsp.county?.name} County</div>
              {bdsp.physicalAddress && <p className="text-muted-foreground ml-5 text-xs">{bdsp.physicalAddress}</p>}
              {bdsp.gpsLatitude && <div className="mt-2 p-2 bg-muted rounded-lg font-mono text-xs text-muted-foreground">📍 {bdsp.gpsLatitude.toFixed(4)}, {bdsp.gpsLongitude?.toFixed(4)}<a href={`https://maps.google.com?q=${bdsp.gpsLatitude},${bdsp.gpsLongitude}`} target="_blank" rel="noopener" className="ml-2 text-primary-600 hover:underline">Open Map</a></div>}
            </div>
          </div>
          <div className="card p-4">
            <p className="card-title mb-3">Record Info</p>
            <div className="space-y-2 text-xs text-muted-foreground">
              <div className="flex justify-between"><span>Created by:</span><span className="font-medium text-foreground">{bdsp.createdBy?.firstName} {bdsp.createdBy?.lastName}</span></div>
              <div className="flex justify-between"><span>Created at:</span><span className="font-medium text-foreground">{formatDate(bdsp.createdAt,'datetime')}</span></div>
            </div>
          </div>
        </div>
      </div>

      {workflowModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl shadow-modal p-6 w-full max-w-md">
            <h3 className="font-bold text-lg mb-2 capitalize">{workflowModal} BDSP</h3>
            <textarea className="form-input mb-4" rows={3} placeholder={['return','reject'].includes(workflowModal)?'Required: Enter reason...':'Optional: Add comment...'} value={comment} onChange={e=>setComment(e.target.value)} />
            <div className="flex gap-2 justify-end">
              <button onClick={()=>setWorkflowModal(null)} className="btn-secondary">Cancel</button>
              <button onClick={()=>workflowMutation.mutate(workflowModal)} disabled={workflowMutation.isPending||(['return','reject'].includes(workflowModal)&&!comment.trim())} className="btn-primary">
                {workflowMutation.isPending&&<span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin mr-1"/>}Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
