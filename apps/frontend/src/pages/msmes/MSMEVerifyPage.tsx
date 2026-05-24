import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'wouter';
import { msmeApi, verificationsApi } from '../../lib/api';
import { useState } from 'react';
import { ArrowLeft, MapPin, CheckCircle2, XCircle, Camera, Save, Loader2 } from 'lucide-react';
import { formatDate, getStatusLabel } from '../../lib/utils';

export default function MSMEVerifyPage({ id }: { id: string }) {
  const queryClient = useQueryClient();
  const [findings, setFindings] = useState({ businessExists: true, ownershipConfirmed: true, locationConfirmed: true, notes: '', gpsLatitude: '', gpsLongitude: '' });
  const [saved, setSaved] = useState(false);

  const { data: msme } = useQuery({ queryKey: ['msme', id], queryFn: () => msmeApi.getById(id).then(r => r.data.data) });

  const captureGPS = () => {
    navigator.geolocation?.getCurrentPosition(pos => {
      setFindings(f => ({ ...f, gpsLatitude: pos.coords.latitude.toString(), gpsLongitude: pos.coords.longitude.toString() }));
    });
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      await verificationsApi.create({ msmeId: id, visitDate: new Date().toISOString(), businessExists: findings.businessExists, ownershipConfirmed: findings.ownershipConfirmed, locationConfirmed: findings.locationConfirmed, findings: findings.notes, gpsLatitude: findings.gpsLatitude ? parseFloat(findings.gpsLatitude) : undefined, gpsLongitude: findings.gpsLongitude ? parseFloat(findings.gpsLongitude) : undefined, outcome: 'COMPLETED' });
      if (findings.businessExists && findings.ownershipConfirmed) await msmeApi.workflow(id, { action: 'verify', comment: findings.notes });
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['msme', id] }); setSaved(true); },
  });

  if (!msme) return <div className="page-container"><div className="skeleton h-64 rounded-xl" /></div>;

  if (saved) return (
    <div className="page-container max-w-2xl">
      <div className="card p-12 text-center">
        <CheckCircle2 size={64} className="text-success-600 mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-2">Verification Recorded</h2>
        <p className="text-muted-foreground mb-6">Field verification for <strong>{msme.businessName}</strong> has been saved and the record status updated.</p>
        <div className="flex gap-3 justify-center">
          <Link href={`/msmes/${id}`}><a className="btn-primary">View MSME</a></Link>
          <Link href="/msmes"><a className="btn-secondary">Back to Registry</a></Link>
        </div>
      </div>
    </div>
  );

  return (
    <div className="page-container max-w-3xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href={`/msmes/${id}`}><a className="btn-ghost p-2"><ArrowLeft size={18} /></a></Link>
        <div>
          <h1 className="page-title">Field Verification</h1>
          <p className="page-subtitle">{msme.businessName} — {msme.county?.name} County</p>
        </div>
      </div>

      {/* Business summary */}
      <div className="card mb-6 p-5 bg-primary-50 border-primary-200">
        <div className="grid md:grid-cols-3 gap-4 text-sm">
          <div><p className="text-xs text-muted-foreground uppercase">Category</p><p className="font-semibold">{msme.msmeCategory}</p></div>
          <div><p className="text-xs text-muted-foreground uppercase">Owner</p><p className="font-semibold">{msme.ownerName || '—'}</p></div>
          <div><p className="text-xs text-muted-foreground uppercase">Phone</p><p className="font-semibold">{msme.phone || '—'}</p></div>
          <div className="md:col-span-2"><p className="text-xs text-muted-foreground uppercase">Address</p><p className="font-semibold">{msme.physicalAddress || msme.cityTownCommunity || '—'}</p></div>
          <div><p className="text-xs text-muted-foreground uppercase">Status</p><p className="font-semibold">{getStatusLabel(msme.workflowStatus)}</p></div>
        </div>
      </div>

      {/* Verification checklist */}
      <div className="card mb-6">
        <div className="card-header"><p className="card-title">Verification Checklist</p></div>
        <div className="card-body space-y-4">
          {[
            { key: 'businessExists', label: 'Business Exists at Stated Location', desc: 'Physical inspection confirms the business is operating at the stated address' },
            { key: 'ownershipConfirmed', label: 'Ownership Confirmed', desc: 'Owner identity verified against stated information' },
            { key: 'locationConfirmed', label: 'Location Details Confirmed', desc: 'Physical address and GPS coordinates match the stated location' },
          ].map(item => (
            <div key={item.key} className={`flex items-start gap-4 p-4 rounded-xl border-2 transition-all cursor-pointer ${(findings as any)[item.key] ? 'border-success-500 bg-green-50' : 'border-red-200 bg-red-50'}`}
              onClick={() => setFindings(f => ({ ...f, [item.key]: !(f as any)[item.key] }))}>
              {(findings as any)[item.key] ? <CheckCircle2 size={22} className="text-success-600 flex-shrink-0 mt-0.5" /> : <XCircle size={22} className="text-red-500 flex-shrink-0 mt-0.5" />}
              <div>
                <p className="font-semibold text-sm">{item.label}</p>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
              <div className="ml-auto">
                <span className={`chip ${(findings as any)[item.key] ? 'chip-green' : 'chip-red'}`}>{(findings as any)[item.key] ? 'CONFIRMED' : 'NOT CONFIRMED'}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* GPS & Findings */}
      <div className="card mb-6">
        <div className="card-header"><p className="card-title">Site GPS & Field Notes</p></div>
        <div className="card-body space-y-4">
          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <label className="form-label">Visit GPS Latitude</label>
              <input className="form-input" type="number" step="any" value={findings.gpsLatitude} onChange={e => setFindings(f => ({ ...f, gpsLatitude: e.target.value }))} placeholder="Auto-captured or enter manually" />
            </div>
            <div className="flex-1">
              <label className="form-label">Visit GPS Longitude</label>
              <input className="form-input" type="number" step="any" value={findings.gpsLongitude} onChange={e => setFindings(f => ({ ...f, gpsLongitude: e.target.value }))} placeholder="Auto-captured or enter manually" />
            </div>
            <button type="button" onClick={captureGPS} className="btn-secondary gap-1.5"><MapPin size={14} />Capture</button>
          </div>
          <div>
            <label className="form-label">Field Notes / Findings</label>
            <textarea className="form-input" rows={4} placeholder="Describe observations, discrepancies, or additional findings from the field visit..." value={findings.notes} onChange={e => setFindings(f => ({ ...f, notes: e.target.value }))} />
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 justify-end">
        <Link href={`/msmes/${id}`}><a className="btn-secondary">Cancel</a></Link>
        <button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending} className="btn-primary gap-2">
          {saveMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          {findings.businessExists && findings.ownershipConfirmed ? 'Save & Mark Verified' : 'Save Findings Only'}
        </button>
      </div>
    </div>
  );
}
