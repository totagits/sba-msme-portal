import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { bdspApi, settingsApi } from '../../lib/api';
import { ArrowLeft, Save, Send, AlertCircle, Loader2, MapPin } from 'lucide-react';
import { Link } from 'wouter';

const schema = z.object({
  providerName: z.string().min(2, 'Provider name is required'),
  providerType: z.enum(['CONSULTANT','TRAINING_INSTITUTION','INCUBATOR','ACCELERATOR','FINANCIAL_INSTITUTION','NGO','COOPERATIVE_SUPPORT','MENTOR','TECHNOLOGY_PROVIDER','MARKET_LINKAGE','LEGAL_ACCOUNTING']),
  registrationStatus: z.enum(['REGISTERED','UNREGISTERED','PENDING_REGISTRATION']).default('REGISTERED'),
  contactPerson: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  website: z.string().url().optional().or(z.literal('')),
  physicalAddress: z.string().optional(),
  countyId: z.string().uuid('Select a county'),
  sectorId: z.string().uuid().optional().or(z.literal('')),
  gpsLatitude: z.preprocess(v => v===''?undefined:Number(v), z.number().optional()),
  gpsLongitude: z.preprocess(v => v===''?undefined:Number(v), z.number().optional()),
  yearsOfExperience: z.preprocess(v => v===''?undefined:Number(v), z.number().optional()),
  staffCapacity: z.preprocess(v => v===''?undefined:Number(v), z.number().optional()),
  availabilityStatus: z.enum(['AVAILABLE','UNAVAILABLE','SEASONAL']).default('AVAILABLE'),
  targetBeneficiaries: z.string().optional(),
  pastAssignments: z.string().optional(),
  servicePricingModel: z.string().optional(),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export default function BDSPFormPage({ id }: { id?: string }) {
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const { data: counties } = useQuery({ queryKey: ['counties'], queryFn: () => settingsApi.getCounties().then(r => r.data.data) });
  const { data: sectors } = useQuery({ queryKey: ['sectors'], queryFn: () => settingsApi.getSectors().then(r => r.data.data) });
  const { data: existing } = useQuery({ queryKey: ['bdsp', id], queryFn: () => bdspApi.getById(id!).then(r => r.data.data), enabled: !!id });

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { providerType: 'TRAINING_INSTITUTION', registrationStatus: 'REGISTERED', availabilityStatus: 'AVAILABLE' },
  });

  useEffect(() => { if (existing) reset(existing); }, [existing, reset]);

  const captureGPS = () => navigator.geolocation?.getCurrentPosition(pos => reset({ ...watch(), gpsLatitude: pos.coords.latitude, gpsLongitude: pos.coords.longitude }));

  const saveMutation = useMutation({
    mutationFn: (data: FormData) => id ? bdspApi.update(id, data) : bdspApi.create(data),
    onSuccess: (res) => { queryClient.invalidateQueries({ queryKey: ['bdsps'] }); navigate(`/bdsps/${res.data.data.id}`); },
  });

  const submitMutation = useMutation({
    mutationFn: async (data: FormData) => {
      let bId = id;
      if (!bId) { const res = await bdspApi.create(data); bId = res.data.data.id; } else await bdspApi.update(id!, data);
      await bdspApi.workflow(bId!, { action: 'submit' });
      return bId;
    },
    onSuccess: bId => { queryClient.invalidateQueries({ queryKey: ['bdsps'] }); navigate(`/bdsps/${bId}`); },
  });

  const onSave = handleSubmit(d => saveMutation.mutate(d));
  const onSubmit = handleSubmit(d => submitMutation.mutate(d));
  const err = saveMutation.error as any || submitMutation.error as any;

  const Field = ({ label, name, children, hint }: { label: string; name: keyof FormData; children: React.ReactNode; hint?: string }) => (
    <div>
      <label className="form-label">{label}</label>
      {children}
      {hint && <p className="text-xs text-muted-foreground mt-1">{hint}</p>}
      {errors[name] && <p className="form-error"><AlertCircle size={12} />{String(errors[name]?.message)}</p>}
    </div>
  );

  return (
    <div className="page-container max-w-3xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/bdsps"><a className="btn-ghost p-2"><ArrowLeft size={18} /></a></Link>
        <div>
          <h1 className="page-title">{id ? 'Edit BDSP' : 'Register New BDSP'}</h1>
          <p className="page-subtitle">{existing?.providerName || 'New Service Provider'}</p>
        </div>
      </div>

      {err && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-center gap-2"><AlertCircle size={14} />{err?.response?.data?.error?.message || 'An error occurred'}</div>}

      <div className="card">
        <div className="card-body space-y-6">
          <div>
            <h3 className="text-sm font-semibold text-primary-700 uppercase tracking-wider border-b border-border pb-2 mb-4">Provider Identity</h3>
            <div className="grid md:grid-cols-2 gap-5">
              <div className="md:col-span-2"><Field label="Provider / Organization Name *" name="providerName"><input className="form-input" placeholder="Full name of the BDSP organization" {...register('providerName')} /></Field></div>
              <Field label="Provider Type *" name="providerType">
                <select className="form-input" {...register('providerType')}>
                  {['CONSULTANT','TRAINING_INSTITUTION','INCUBATOR','ACCELERATOR','FINANCIAL_INSTITUTION','NGO','COOPERATIVE_SUPPORT','MENTOR','TECHNOLOGY_PROVIDER','MARKET_LINKAGE','LEGAL_ACCOUNTING'].map(t=><option key={t} value={t}>{t.replace(/_/g,' ')}</option>)}
                </select>
              </Field>
              <Field label="Registration Status" name="registrationStatus">
                <select className="form-input" {...register('registrationStatus')}>
                  <option value="REGISTERED">Registered</option><option value="UNREGISTERED">Unregistered</option><option value="PENDING_REGISTRATION">Pending Registration</option>
                </select>
              </Field>
              <Field label="Years of Experience" name="yearsOfExperience"><input className="form-input" type="number" {...register('yearsOfExperience')} placeholder="0" /></Field>
              <Field label="Staff Capacity" name="staffCapacity"><input className="form-input" type="number" {...register('staffCapacity')} placeholder="Number of staff" /></Field>
              <Field label="Availability Status" name="availabilityStatus">
                <select className="form-input" {...register('availabilityStatus')}>
                  <option value="AVAILABLE">Available</option><option value="UNAVAILABLE">Currently Unavailable</option><option value="SEASONAL">Seasonal</option>
                </select>
              </Field>
              <Field label="Service Pricing Model" name="servicePricingModel">
                <select className="form-input" {...register('servicePricingModel')}>
                  <option value="">— Select —</option><option value="FREE">Free / Subsidized</option><option value="FEE_FOR_SERVICE">Fee for Service</option><option value="GRANT_FUNDED">Grant-Funded</option><option value="MIXED">Mixed</option>
                </select>
              </Field>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-primary-700 uppercase tracking-wider border-b border-border pb-2 mb-4">Location & Contact</h3>
            <div className="grid md:grid-cols-2 gap-5">
              <Field label="County *" name="countyId">
                <select className="form-input" {...register('countyId')}>
                  <option value="">— Select County —</option>{(counties||[]).map((c:any)=><option key={c.id} value={c.id}>{c.name} County</option>)}
                </select>
              </Field>
              <Field label="Sector Focus" name="sectorId">
                <select className="form-input" {...register('sectorId')}>
                  <option value="">— Select Sector —</option>{(sectors||[]).map((s:any)=><option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </Field>
              <div className="md:col-span-2"><Field label="Physical Address" name="physicalAddress"><input className="form-input" placeholder="Office address, landmark, or description" {...register('physicalAddress')} /></Field></div>
              <div className="md:col-span-2">
                <label className="form-label">GPS Coordinates</label>
                <div className="flex gap-3 items-end">
                  <div className="flex-1"><label className="text-xs text-muted-foreground">Latitude</label><input className="form-input" type="number" step="any" {...register('gpsLatitude')} /></div>
                  <div className="flex-1"><label className="text-xs text-muted-foreground">Longitude</label><input className="form-input" type="number" step="any" {...register('gpsLongitude')} /></div>
                  <button type="button" onClick={captureGPS} className="btn-secondary gap-1.5"><MapPin size={14} />Capture</button>
                </div>
              </div>
              <Field label="Contact Person" name="contactPerson"><input className="form-input" {...register('contactPerson')} /></Field>
              <Field label="Phone Number" name="phone"><input className="form-input" type="tel" {...register('phone')} /></Field>
              <Field label="Email" name="email"><input className="form-input" type="email" {...register('email')} /></Field>
              <Field label="Website" name="website"><input className="form-input" type="url" {...register('website')} /></Field>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-primary-700 uppercase tracking-wider border-b border-border pb-2 mb-4">Program Details</h3>
            <div className="space-y-4">
              <Field label="Target Beneficiaries" name="targetBeneficiaries"><input className="form-input" {...register('targetBeneficiaries')} placeholder="e.g. Youth entrepreneurs, women in agriculture, informal traders" /></Field>
              <Field label="Past Assignments / Track Record" name="pastAssignments"><textarea className="form-input" rows={3} {...register('pastAssignments')} placeholder="Brief description of past work and outcomes..." /></Field>
              <Field label="Additional Notes" name="notes"><textarea className="form-input" rows={2} {...register('notes')} /></Field>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-border flex justify-between bg-muted/30">
          <Link href="/bdsps"><a className="btn-secondary">Cancel</a></Link>
          <div className="flex gap-2">
            <button type="button" onClick={onSave} disabled={saveMutation.isPending} className="btn-secondary gap-1.5">
              {saveMutation.isPending && <Loader2 size={14} className="animate-spin" />}<Save size={14} />Save Draft
            </button>
            <button type="button" onClick={onSubmit} disabled={submitMutation.isPending} className="btn-primary gap-1.5">
              {submitMutation.isPending && <Loader2 size={14} className="animate-spin" />}<Send size={14} />Submit for Review
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
