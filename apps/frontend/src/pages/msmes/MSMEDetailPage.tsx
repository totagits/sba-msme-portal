import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useLocation } from 'wouter';
import { msmeApi } from '../../lib/api';
import { formatDate, getStatusColor, getStatusLabel, getMSMECategoryColor } from '../../lib/utils';
import { ArrowLeft, Edit2, MapPin, Phone, Mail, Globe, Users, Building2, CheckCircle2, XCircle, RotateCcw, Archive, Clock, Send } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../../lib/auth';

const WORKFLOW_ACTIONS = [
  { action: 'submit', label: 'Submit for Review', icon: Send, style: 'btn-primary', permission: 'msme:create' },
  { action: 'verify', label: 'Verify', icon: CheckCircle2, style: 'bg-cyan-600 text-white hover:bg-cyan-700 btn', permission: 'msme:verify' },
  { action: 'approve', label: 'Approve', icon: CheckCircle2, style: 'bg-success-600 text-white hover:bg-success-700 btn', permission: 'msme:approve' },
  { action: 'return', label: 'Return for Correction', icon: RotateCcw, style: 'bg-purple-600 text-white hover:bg-purple-700 btn', permission: 'msme:approve' },
  { action: 'reject', label: 'Reject', icon: XCircle, style: 'btn-destructive', permission: 'msme:approve' },
  { action: 'archive', label: 'Archive', icon: Archive, style: 'btn-secondary', permission: 'msme:delete' },
];

const VALID_TRANSITIONS: Record<string, string[]> = {
  DRAFT: ['submit'],
  SUBMITTED: ['verify', 'return', 'reject'],
  UNDER_REVIEW: ['verify', 'return', 'reject'],
  RETURNED_FOR_CORRECTION: ['submit'],
  VERIFIED: ['approve', 'return', 'reject'],
  APPROVED: ['archive'],
  REJECTED: ['archive'],
  ARCHIVED: [],
};

export default function MSMEDetailPage({ id }: { id: string }) {
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const { hasPermission } = useAuth();
  const [workflowModal, setWorkflowModal] = useState<string | null>(null);
  const [comment, setComment] = useState('');

  const { data: msme, isLoading } = useQuery({
    queryKey: ['msme', id],
    queryFn: () => msmeApi.getById(id).then(r => r.data.data),
  });

  const workflowMutation = useMutation({
    mutationFn: (action: string) => msmeApi.workflow(id, { action, comment }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['msme', id] }); setWorkflowModal(null); setComment(''); },
  });

  if (isLoading) return (
    <div className="page-container"><div className="space-y-4">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="skeleton h-20 rounded-xl" />)}</div></div>
  );

  if (!msme) return <div className="page-container"><p className="text-muted-foreground">MSME not found.</p></div>;

  const allowedActions = VALID_TRANSITIONS[msme.workflowStatus] || [];

  return (
    <div className="page-container max-w-5xl">
      {/* Header */}
      <div className="flex items-start gap-4 mb-6">
        <Link href="/msmes"><a className="btn-ghost p-2 mt-1"><ArrowLeft size={18} /></a></Link>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-foreground">{msme.businessName}</h1>
            <span className={`chip ${getMSMECategoryColor(msme.msmeCategory)}`}>{msme.msmeCategory}</span>
            <span className={`status-badge ${getStatusColor(msme.workflowStatus)}`}>{getStatusLabel(msme.workflowStatus)}</span>
          </div>
          <p className="text-muted-foreground text-sm mt-1 flex items-center gap-2">
            {msme.county?.name && <><MapPin size={13} />{msme.county.name} County</>}
            {msme.sector?.name && <><span>•</span>{msme.sector.name}</>}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {hasPermission('msme:update') && (
            <Link href={`/msmes/${id}/edit`}><a className="btn-secondary btn-sm gap-1.5"><Edit2 size={14} />Edit</a></Link>
          )}
        </div>
      </div>

      {/* Workflow Action Bar */}
      {allowedActions.length > 0 && (
        <div className="card mb-6 p-4 border-primary-200 bg-primary-50">
          <p className="text-xs font-semibold text-primary-700 uppercase tracking-wider mb-3">Workflow Actions</p>
          <div className="flex gap-2 flex-wrap">
            {WORKFLOW_ACTIONS
              .filter(a => allowedActions.includes(a.action) && hasPermission(a.permission))
              .map(a => (
                <button key={a.action} onClick={() => setWorkflowModal(a.action)} className={`${a.style} btn-sm gap-1.5 px-4 py-2`}>
                  <a.icon size={14} />{a.label}
                </button>
              ))}
          </div>
          {msme.correctionComments && (
            <div className="mt-3 p-3 bg-purple-50 border border-purple-200 rounded-lg text-sm text-purple-700">
              <strong>Correction Required:</strong> {msme.correctionComments}
            </div>
          )}
          {msme.rejectionReason && (
            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              <strong>Rejection Reason:</strong> {msme.rejectionReason}
            </div>
          )}
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Business Details */}
          <div className="card">
            <div className="card-header"><p className="card-title">Business Information</p></div>
            <div className="card-body grid md:grid-cols-2 gap-4 text-sm">
              {[
                ['Business Type', msme.businessType?.replace(/_/g,' ')],
                ['Formality Status', msme.formalityStatus?.replace(/_/g,' ')],
                ['Registration No.', msme.registrationNumber || '—'],
                ['TIN', msme.taxIdentificationNumber || '—'],
                ['Business Stage', msme.businessStage?.replace(/_/,' ') || '—'],
                ['Digital Readiness', msme.digitalReadiness || 'NONE'],
              ].map(([label, value]) => (
                <div key={label}>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-0.5">{label}</p>
                  <p className="font-medium">{value}</p>
                </div>
              ))}
              {msme.productsServices && (
                <div className="md:col-span-2">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-0.5">Products / Services</p>
                  <p className="font-medium">{msme.productsServices}</p>
                </div>
              )}
            </div>
          </div>

          {/* Owner Info */}
          <div className="card">
            <div className="card-header"><p className="card-title">Owner & Contact</p></div>
            <div className="card-body grid md:grid-cols-2 gap-4 text-sm">
              {[
                ['Owner Name', msme.ownerName || '—'],
                ['Owner Gender', msme.ownerGender || '—'],
                ['Owner Age', msme.ownerAge ? `${msme.ownerAge} years` : '—'],
                ['Nationality', msme.ownerNationality || '—'],
                ['Contact Person', msme.contactPerson || '—'],
              ].map(([label, value]) => (
                <div key={label}>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-0.5">{label}</p>
                  <p className="font-medium">{value}</p>
                </div>
              ))}
              <div className="md:col-span-2 flex flex-wrap gap-3">
                {msme.phone && <a href={`tel:${msme.phone}`} className="flex items-center gap-1.5 text-primary-700 hover:underline"><Phone size={14} />{msme.phone}</a>}
                {msme.email && <a href={`mailto:${msme.email}`} className="flex items-center gap-1.5 text-primary-700 hover:underline"><Mail size={14} />{msme.email}</a>}
                {msme.website && <a href={msme.website} target="_blank" rel="noopener" className="flex items-center gap-1.5 text-primary-700 hover:underline"><Globe size={14} />{msme.website}</a>}
              </div>
            </div>
          </div>

          {/* Employment */}
          <div className="card">
            <div className="card-header"><p className="card-title">Employment & Financials</p></div>
            <div className="card-body grid grid-cols-3 gap-4 text-center">
              {[
                { label: 'Total Employees', value: msme.numberOfEmployees ?? '—' },
                { label: 'Female Employees', value: msme.numberOfFemaleEmployees ?? '—' },
                { label: 'Youth Employees', value: msme.numberOfYouthEmployees ?? '—' },
              ].map(({ label, value }) => (
                <div key={label} className="bg-muted rounded-lg p-4">
                  <p className="text-2xl font-black text-primary-700">{value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{label}</p>
                </div>
              ))}
              {msme.annualRevenueRange && (
                <div className="col-span-3 bg-green-50 rounded-lg p-3 text-sm">
                  <span className="text-muted-foreground">Annual Revenue Range: </span>
                  <span className="font-semibold text-success-700">{msme.annualRevenueRange.replace(/_/g,' ')}</span>
                </div>
              )}
            </div>
          </div>

          {/* Inclusion Indicators */}
          <div className="card">
            <div className="card-header"><p className="card-title">Inclusion Indicators</p></div>
            <div className="card-body flex gap-4 flex-wrap">
              <div className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border ${msme.isYouthLed ? 'bg-amber-50 border-amber-300 text-amber-700' : 'bg-muted border-border text-muted-foreground'}`}>
                {msme.isYouthLed ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                <span className="text-sm font-medium">Youth-Led</span>
              </div>
              <div className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border ${msme.isWomenLed ? 'bg-red-50 border-red-300 text-red-700' : 'bg-muted border-border text-muted-foreground'}`}>
                {msme.isWomenLed ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                <span className="text-sm font-medium">Women-Led</span>
              </div>
              <div className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border ${msme.hasDisabilityInclusion ? 'bg-purple-50 border-purple-300 text-purple-700' : 'bg-muted border-border text-muted-foreground'}`}>
                {msme.hasDisabilityInclusion ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                <span className="text-sm font-medium">Disability Inclusive</span>
              </div>
            </div>
          </div>

          {/* Workflow History */}
          {msme.workflowActions?.length > 0 && (
            <div className="card">
              <div className="card-header"><p className="card-title">Workflow History</p></div>
              <div className="card-body">
                <div className="space-y-3">
                  {msme.workflowActions.map((action: any) => (
                    <div key={action.id} className="flex items-start gap-3 text-sm">
                      <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0 text-primary-700 font-bold text-xs">
                        {action.user.firstName.charAt(0)}{action.user.lastName.charAt(0)}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{action.user.firstName} {action.user.lastName}</p>
                        <p className="text-muted-foreground text-xs">
                          <span className={`status-badge ${getStatusColor(action.fromStatus)} mr-1`}>{getStatusLabel(action.fromStatus)}</span>
                          → <span className={`status-badge ${getStatusColor(action.toStatus)} ml-1`}>{getStatusLabel(action.toStatus)}</span>
                        </p>
                        {action.comment && <p className="text-muted-foreground mt-1 italic">"{action.comment}"</p>}
                        <p className="text-xs text-muted-foreground mt-1">{formatDate(action.createdAt, 'datetime')}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Sidebar */}
        <div className="space-y-4">
          {/* Location */}
          <div className="card p-4">
            <p className="card-title mb-3">Location</p>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2"><MapPin size={14} className="text-muted-foreground" /><span>{msme.county?.name} County</span></div>
              {msme.district?.name && <p className="text-muted-foreground ml-5">{msme.district.name} District</p>}
              {msme.cityTownCommunity && <p className="text-muted-foreground ml-5">{msme.cityTownCommunity}</p>}
              {msme.physicalAddress && <p className="text-muted-foreground ml-5 text-xs">{msme.physicalAddress}</p>}
              {msme.gpsLatitude && msme.gpsLongitude && (
                <div className="mt-2 p-2 bg-muted rounded-lg font-mono text-xs text-muted-foreground">
                  📍 {msme.gpsLatitude.toFixed(4)}, {msme.gpsLongitude.toFixed(4)}
                  <a href={`https://maps.google.com?q=${msme.gpsLatitude},${msme.gpsLongitude}`} target="_blank" rel="noopener" className="ml-2 text-primary-600 hover:underline">Open Map</a>
                </div>
              )}
            </div>
          </div>

          {/* Record Info */}
          <div className="card p-4">
            <p className="card-title mb-3">Record Information</p>
            <div className="space-y-2 text-xs text-muted-foreground">
              <div className="flex justify-between"><span>Created by:</span><span className="font-medium text-foreground">{msme.createdBy?.firstName} {msme.createdBy?.lastName}</span></div>
              <div className="flex justify-between"><span>Created at:</span><span className="font-medium text-foreground">{formatDate(msme.createdAt, 'datetime')}</span></div>
              {msme.verifiedAt && <div className="flex justify-between"><span>Verified at:</span><span className="font-medium text-success-600">{formatDate(msme.verifiedAt, 'datetime')}</span></div>}
              {msme.approvedAt && <div className="flex justify-between"><span>Approved at:</span><span className="font-medium text-success-600">{formatDate(msme.approvedAt, 'datetime')}</span></div>}
            </div>
          </div>

          {/* Documents */}
          {msme.documents?.length > 0 && (
            <div className="card p-4">
              <p className="card-title mb-3">Documents ({msme.documents.length})</p>
              <div className="space-y-2">
                {msme.documents.map((doc: any) => (
                  <a key={doc.id} href={doc.fileUrl} target="_blank" rel="noopener" className="flex items-center gap-2 text-sm text-primary-700 hover:underline">
                    📎 {doc.fileName}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Workflow Modal */}
      {workflowModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl shadow-modal p-6 w-full max-w-md">
            <h3 className="font-bold text-lg mb-2 capitalize">{workflowModal.replace(/_/g,' ')} MSME</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {workflowModal === 'approve' ? 'This will approve the MSME record and add it to the national database.' :
               workflowModal === 'reject' ? 'This will reject this MSME record. Please provide a reason.' :
               workflowModal === 'return' ? 'This will return the record for correction. Please specify what needs to be fixed.' :
               workflowModal === 'verify' ? 'This confirms field verification of this enterprise.' :
               workflowModal === 'submit' ? 'This will submit the record for review by a verifier.' : 'Confirm this workflow action.'}
            </p>
            <textarea
              className="form-input mb-4"
              rows={3}
              placeholder={['return','reject'].includes(workflowModal) ? 'Required: Enter reason or comments...' : 'Optional: Add a comment...'}
              value={comment}
              onChange={e => setComment(e.target.value)}
            />
            <div className="flex gap-2 justify-end">
              <button onClick={() => setWorkflowModal(null)} className="btn-secondary">Cancel</button>
              <button
                onClick={() => workflowMutation.mutate(workflowModal)}
                disabled={workflowMutation.isPending || (['return','reject'].includes(workflowModal) && !comment.trim())}
                className="btn-primary gap-1.5"
              >
                {workflowMutation.isPending && <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
