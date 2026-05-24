import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { msmeApi, settingsApi } from '../../lib/api';
import { ArrowLeft, Save, Send, AlertCircle, Loader2, MapPin, ChevronRight, ChevronDown } from 'lucide-react';
import { Link } from 'wouter';

const schema = z.object({
  businessName: z.string().min(2, 'Business name must be at least 2 characters'),
  registrationNumber: z.string().optional(),
  taxIdentificationNumber: z.string().optional(),
  businessType: z.enum(['SOLE_PROPRIETORSHIP','PARTNERSHIP','CORPORATION','COOPERATIVE','ASSOCIATION','INFORMAL_ENTERPRISE']),
  msmeCategory: z.enum(['MICRO','SMALL','MEDIUM']),
  formalityStatus: z.enum(['REGISTERED','UNREGISTERED','PENDING_REGISTRATION']),
  countyId: z.string().uuid('Please select a county'),
  districtId: z.string().uuid().optional().or(z.literal('')),
  sectorId: z.string().uuid().optional().or(z.literal('')),
  subsectorId: z.string().uuid().optional().or(z.literal('')),
  cityTownCommunity: z.string().optional(),
  physicalAddress: z.string().optional(),
  gpsLatitude: z.preprocess(v => v === '' ? undefined : Number(v), z.number().optional()),
  gpsLongitude: z.preprocess(v => v === '' ? undefined : Number(v), z.number().optional()),
  contactPerson: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  website: z.string().url().optional().or(z.literal('')),
  ownerName: z.string().optional(),
  ownerGender: z.string().optional(),
  ownerAge: z.preprocess(v => v === '' ? undefined : Number(v), z.number().optional()),
  ownerNationality: z.string().optional(),
  isYouthLed: z.boolean().default(false),
  isWomenLed: z.boolean().default(false),
  hasDisabilityInclusion: z.boolean().default(false),
  numberOfEmployees: z.preprocess(v => v === '' ? undefined : Number(v), z.number().optional()),
  numberOfFemaleEmployees: z.preprocess(v => v === '' ? undefined : Number(v), z.number().optional()),
  numberOfYouthEmployees: z.preprocess(v => v === '' ? undefined : Number(v), z.number().optional()),
  annualRevenueRange: z.string().optional(),
  businessStage: z.string().optional(),
  digitalReadiness: z.enum(['NONE','BASIC','INTERMEDIATE','ADVANCED']).default('NONE'),
  productsServices: z.string().optional(),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface Step { id: number; title: string; }
const steps: Step[] = [
  { id: 1, title: 'Business Identity' },
  { id: 2, title: 'Location' },
  { id: 3, title: 'Contact & Owner' },
  { id: 4, title: 'Operations' },
  { id: 5, title: 'Review & Submit' },
];

export default function MSMEFormPage({ id }: { id?: string }) {
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const [step, setStep] = useState(1);
  const [duplicate, setDuplicate] = useState<any>(null);

  const { data: counties } = useQuery({ queryKey: ['counties'], queryFn: () => settingsApi.getCounties().then(r => r.data.data) });
  const { data: sectors } = useQuery({ queryKey: ['sectors'], queryFn: () => settingsApi.getSectors().then(r => r.data.data) });

  const { data: existing } = useQuery({
    queryKey: ['msme', id],
    queryFn: () => msmeApi.getById(id!).then(r => r.data.data),
    enabled: !!id,
  });

  const { register, handleSubmit, watch, control, reset, formState: { errors, isSubmitting, isDirty } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { businessType: 'SOLE_PROPRIETORSHIP', msmeCategory: 'MICRO', formalityStatus: 'UNREGISTERED', digitalReadiness: 'NONE', isYouthLed: false, isWomenLed: false, hasDisabilityInclusion: false },
  });

  const watchedCounty = watch('countyId');
  const watchedSector = watch('sectorId');

  const { data: districts } = useQuery({
    queryKey: ['districts', watchedCounty],
    queryFn: () => settingsApi.getDistricts(watchedCounty).then(r => r.data.data),
    enabled: !!watchedCounty,
  });

  const selectedSector = (sectors || []).find((s: any) => s.id === watchedSector);
  const subsectors = selectedSector?.subsectors || [];

  useEffect(() => {
    if (existing) reset({ ...existing, gpsLatitude: existing.gpsLatitude ?? undefined, gpsLongitude: existing.gpsLongitude ?? undefined });
  }, [existing, reset]);

  const saveDraft = useMutation({
    mutationFn: (data: FormData) => id ? msmeApi.update(id, data) : msmeApi.create(data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['msmes'] });
      if (!id) navigate(`/msmes/${res.data.data.id}/edit`);
    },
  });

  const submitForReview = useMutation({
    mutationFn: async (data: FormData) => {
      let msmeId = id;
      if (!msmeId) {
        const res = await msmeApi.create(data);
        msmeId = res.data.data.id;
      } else {
        await msmeApi.update(id!, data);
      }
      await msmeApi.workflow(msmeId!, { action: 'submit' });
      return msmeId;
    },
    onSuccess: (msmeId) => {
      queryClient.invalidateQueries({ queryKey: ['msmes'] });
      navigate(`/msmes/${msmeId}`);
    },
  });

  const handleCapture = () => {
    navigator.geolocation?.getCurrentPosition(
      pos => { reset({ ...watch(), gpsLatitude: pos.coords.latitude, gpsLongitude: pos.coords.longitude }); },
      () => alert('Unable to get GPS location. Please ensure location services are enabled.')
    );
  };

  const onSaveDraft = handleSubmit(data => saveDraft.mutate(data));
  const onSubmit = handleSubmit(data => submitForReview.mutate(data));

  const error = saveDraft.error as any || submitForReview.error as any;

  const SectionHeader = ({ title }: { title: string }) => (
    <h3 className="text-sm font-semibold text-primary-700 uppercase tracking-wider border-b border-border pb-2 mb-4">{title}</h3>
  );

  const Field = ({ label, name, required, hint, children }: { label: string; name: keyof FormData; required?: boolean; hint?: string; children: React.ReactNode }) => (
    <div>
      <label className="form-label">{label}{required && <span className="text-destructive ml-1">*</span>}</label>
      {children}
      {hint && <p className="text-xs text-muted-foreground mt-1">{hint}</p>}
      {errors[name] && <p className="form-error"><AlertCircle size={12} />{String(errors[name]?.message)}</p>}
    </div>
  );

  return (
    <div className="page-container max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link href="/msmes"><a className="btn-ghost p-2"><ArrowLeft size={18} /></a></Link>
        <div>
          <h1 className="page-title">{id ? 'Edit MSME' : 'Register New MSME'}</h1>
          <p className="page-subtitle">{existing?.businessName || 'New Enterprise Registration'}</p>
        </div>
      </div>

      {/* Duplicate Warning */}
      {duplicate && (
        <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
          <AlertCircle size={20} className="text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-amber-800 text-sm">Potential Duplicate Detected</p>
            <p className="text-amber-700 text-xs mt-1">A similar record exists: <Link href={`/msmes/${duplicate.duplicateId}`}><a className="underline">{duplicate.duplicateName}</a></Link></p>
          </div>
        </div>
      )}

      {/* Step indicator */}
      <div className="flex items-center mb-8 overflow-x-auto pb-2">
        {steps.map((s, i) => (
          <div key={s.id} className="flex items-center">
            <button
              onClick={() => setStep(s.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                step === s.id ? 'bg-primary-100 text-primary-700' : step > s.id ? 'text-success-600' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                step === s.id ? 'bg-primary-700 text-white' : step > s.id ? 'bg-success-600 text-white' : 'bg-muted text-muted-foreground'
              }`}>{step > s.id ? '✓' : s.id}</span>
              {s.title}
            </button>
            {i < steps.length - 1 && <ChevronRight size={14} className="text-muted-foreground mx-1 flex-shrink-0" />}
          </div>
        ))}
      </div>

      <div className="card">
        <div className="card-body">
          {/* Step 1 — Business Identity */}
          {step === 1 && (
            <div className="space-y-5">
              <SectionHeader title="Business Identity" />
              <div className="grid md:grid-cols-2 gap-5">
                <div className="md:col-span-2">
                  <Field label="Business Name" name="businessName" required hint="Enter the full legal or operating name of the enterprise">
                    <input className="form-input" placeholder="e.g. Monrovia Farmers Cooperative" {...register('businessName')} />
                  </Field>
                </div>
                <Field label="Registration Number" name="registrationNumber" hint="Ministry of Commerce registration number, if available">
                  <input className="form-input" placeholder="e.g. MOC-2024-001234" {...register('registrationNumber')} />
                </Field>
                <Field label="Tax Identification Number (TIN)" name="taxIdentificationNumber">
                  <input className="form-input" placeholder="e.g. TIN-001234567" {...register('taxIdentificationNumber')} />
                </Field>
                <Field label="Business Type" name="businessType" required>
                  <select className="form-input" {...register('businessType')}>
                    {['SOLE_PROPRIETORSHIP','PARTNERSHIP','CORPORATION','COOPERATIVE','ASSOCIATION','INFORMAL_ENTERPRISE'].map(t => (
                      <option key={t} value={t}>{t.replace(/_/g,' ')}</option>
                    ))}
                  </select>
                </Field>
                <Field label="MSME Category" name="msmeCategory" required hint="Micro: ≤10 staff | Small: 11–50 | Medium: 51–250">
                  <select className="form-input" {...register('msmeCategory')}>
                    <option value="MICRO">Micro Enterprise</option>
                    <option value="SMALL">Small Enterprise</option>
                    <option value="MEDIUM">Medium Enterprise</option>
                  </select>
                </Field>
                <Field label="Formality Status" name="formalityStatus" required>
                  <select className="form-input" {...register('formalityStatus')}>
                    <option value="REGISTERED">Registered</option>
                    <option value="UNREGISTERED">Unregistered / Informal</option>
                    <option value="PENDING_REGISTRATION">Pending Registration</option>
                  </select>
                </Field>
                <Field label="Sector" name="sectorId">
                  <select className="form-input" {...register('sectorId')}>
                    <option value="">— Select Sector —</option>
                    {(sectors || []).map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </Field>
                {subsectors.length > 0 && (
                  <Field label="Sub-sector" name="subsectorId">
                    <select className="form-input" {...register('subsectorId')}>
                      <option value="">— Select Sub-sector —</option>
                      {subsectors.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </Field>
                )}
                <div className="md:col-span-2">
                  <Field label="Products / Services Description" name="productsServices">
                    <textarea className="form-input" rows={3} placeholder="Briefly describe what this business produces or sells..." {...register('productsServices')} />
                  </Field>
                </div>
              </div>
            </div>
          )}

          {/* Step 2 — Location */}
          {step === 2 && (
            <div className="space-y-5">
              <SectionHeader title="Business Location" />
              <div className="grid md:grid-cols-2 gap-5">
                <Field label="County" name="countyId" required>
                  <select className="form-input" {...register('countyId')}>
                    <option value="">— Select County —</option>
                    {(counties || []).map((c: any) => <option key={c.id} value={c.id}>{c.name} County</option>)}
                  </select>
                </Field>
                <Field label="District" name="districtId">
                  <select className="form-input" {...register('districtId')} disabled={!watchedCounty}>
                    <option value="">— Select District —</option>
                    {(districts || []).map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </Field>
                <Field label="City / Town / Community" name="cityTownCommunity">
                  <input className="form-input" placeholder="e.g. Monrovia, Gbarnga, Buchanan" {...register('cityTownCommunity')} />
                </Field>
                <div className="md:col-span-2">
                  <Field label="Physical Address" name="physicalAddress">
                    <input className="form-input" placeholder="Street address, landmark, or description" {...register('physicalAddress')} />
                  </Field>
                </div>
                <div className="md:col-span-2">
                  <p className="form-label">GPS Coordinates</p>
                  <div className="flex gap-3 items-end">
                    <div className="flex-1">
                      <label className="text-xs text-muted-foreground">Latitude</label>
                      <input className="form-input" type="number" step="any" placeholder="e.g. 6.3006" {...register('gpsLatitude')} />
                    </div>
                    <div className="flex-1">
                      <label className="text-xs text-muted-foreground">Longitude</label>
                      <input className="form-input" type="number" step="any" placeholder="e.g. -10.7969" {...register('gpsLongitude')} />
                    </div>
                    <button type="button" onClick={handleCapture} className="btn-secondary gap-1.5 whitespace-nowrap">
                      <MapPin size={14} />Capture GPS
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Use the button to auto-capture device GPS coordinates for precise mapping.</p>
                </div>
              </div>
            </div>
          )}

          {/* Step 3 — Contact & Owner */}
          {step === 3 && (
            <div className="space-y-5">
              <SectionHeader title="Contact Information" />
              <div className="grid md:grid-cols-2 gap-5">
                <Field label="Contact Person" name="contactPerson"><input className="form-input" {...register('contactPerson')} placeholder="Full name" /></Field>
                <Field label="Phone Number" name="phone"><input className="form-input" type="tel" {...register('phone')} placeholder="+231 77 000 0000" /></Field>
                <Field label="Email Address" name="email"><input className="form-input" type="email" {...register('email')} placeholder="business@email.com" /></Field>
                <Field label="Website" name="website"><input className="form-input" type="url" {...register('website')} placeholder="https://example.com" /></Field>
              </div>
              <SectionHeader title="Business Owner" />
              <div className="grid md:grid-cols-2 gap-5">
                <Field label="Owner Full Name" name="ownerName"><input className="form-input" {...register('ownerName')} placeholder="First and last name" /></Field>
                <Field label="Owner Gender" name="ownerGender">
                  <select className="form-input" {...register('ownerGender')}>
                    <option value="">— Select —</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </Field>
                <Field label="Owner Age" name="ownerAge"><input className="form-input" type="number" {...register('ownerAge')} placeholder="Age in years" /></Field>
                <Field label="Nationality" name="ownerNationality"><input className="form-input" {...register('ownerNationality')} placeholder="e.g. Liberian" /></Field>
              </div>
              <SectionHeader title="Inclusion Indicators" />
              <div className="grid md:grid-cols-3 gap-4">
                {[
                  { field: 'isYouthLed' as const, label: 'Youth-Led Business', desc: 'Owner(s) aged 18–35' },
                  { field: 'isWomenLed' as const, label: 'Women-Led Business', desc: 'Majority women-owned or led' },
                  { field: 'hasDisabilityInclusion' as const, label: 'Disability Inclusion', desc: 'Employs persons with disabilities' },
                ].map(({ field, label, desc }) => (
                  <label key={field} className="flex items-start gap-3 p-4 border border-border rounded-lg cursor-pointer hover:border-primary-400 hover:bg-primary-50 transition-all">
                    <Controller control={control} name={field} render={({ field: f }) => (
                      <input type="checkbox" className="mt-0.5 rounded border-gray-300 text-primary-600 focus:ring-primary-500" checked={!!f.value} onChange={e => f.onChange(e.target.checked)} />
                    )} />
                    <div>
                      <p className="text-sm font-medium text-foreground">{label}</p>
                      <p className="text-xs text-muted-foreground">{desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Step 4 — Operations */}
          {step === 4 && (
            <div className="space-y-5">
              <SectionHeader title="Employment & Revenue" />
              <div className="grid md:grid-cols-2 gap-5">
                <Field label="Total Employees" name="numberOfEmployees"><input className="form-input" type="number" {...register('numberOfEmployees')} placeholder="0" /></Field>
                <Field label="Female Employees" name="numberOfFemaleEmployees"><input className="form-input" type="number" {...register('numberOfFemaleEmployees')} placeholder="0" /></Field>
                <Field label="Youth Employees (18-35)" name="numberOfYouthEmployees"><input className="form-input" type="number" {...register('numberOfYouthEmployees')} placeholder="0" /></Field>
                <Field label="Annual Revenue Range (USD)" name="annualRevenueRange">
                  <select className="form-input" {...register('annualRevenueRange')}>
                    <option value="">— Select Range —</option>
                    <option value="UNDER_50K">Under $50,000</option>
                    <option value="FROM_50K_TO_200K">$50,000 – $200,000</option>
                    <option value="FROM_200K_TO_500K">$200,000 – $500,000</option>
                    <option value="FROM_500K_TO_1M">$500,000 – $1,000,000</option>
                    <option value="ABOVE_1M">Above $1,000,000</option>
                  </select>
                </Field>
                <Field label="Business Stage" name="businessStage">
                  <select className="form-input" {...register('businessStage')}>
                    <option value="">— Select Stage —</option>
                    {['IDEA','STARTUP','EARLY_GROWTH','GROWTH','MATURE'].map(s => <option key={s} value={s}>{s.replace(/_/,' ')}</option>)}
                  </select>
                </Field>
                <Field label="Digital Readiness" name="digitalReadiness">
                  <select className="form-input" {...register('digitalReadiness')}>
                    <option value="NONE">None — No digital tools</option>
                    <option value="BASIC">Basic — Mobile money / basic phone</option>
                    <option value="INTERMEDIATE">Intermediate — Internet & smartphone</option>
                    <option value="ADVANCED">Advanced — E-commerce / digital systems</option>
                  </select>
                </Field>
                <div className="md:col-span-2">
                  <Field label="Additional Notes" name="notes">
                    <textarea className="form-input" rows={3} {...register('notes')} placeholder="Any additional information about this enterprise..." />
                  </Field>
                </div>
              </div>
            </div>
          )}

          {/* Step 5 — Review & Submit */}
          {step === 5 && (
            <div className="space-y-6">
              <SectionHeader title="Review & Submit" />
              <div className="bg-primary-50 rounded-xl p-5 border border-primary-200">
                <p className="text-sm text-primary-700 font-medium mb-3">Please review all information before submitting. Once submitted, this record will go into the verification workflow.</p>
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <div><span className="text-muted-foreground">Business Name:</span> <span className="font-medium">{watch('businessName') || '—'}</span></div>
                  <div><span className="text-muted-foreground">Category:</span> <span className="font-medium">{watch('msmeCategory')}</span></div>
                  <div><span className="text-muted-foreground">Business Type:</span> <span className="font-medium">{watch('businessType')?.replace(/_/g,' ')}</span></div>
                  <div><span className="text-muted-foreground">Status:</span> <span className="font-medium">{watch('formalityStatus')?.replace(/_/g,' ')}</span></div>
                  <div><span className="text-muted-foreground">Phone:</span> <span className="font-medium">{watch('phone') || '—'}</span></div>
                  <div><span className="text-muted-foreground">Owner:</span> <span className="font-medium">{watch('ownerName') || '—'}</span></div>
                  <div><span className="text-muted-foreground">Employees:</span> <span className="font-medium">{watch('numberOfEmployees') ?? '—'}</span></div>
                  <div><span className="text-muted-foreground">GPS:</span> <span className="font-medium">{watch('gpsLatitude') ? `${watch('gpsLatitude')?.toFixed(4)}, ${watch('gpsLongitude')?.toFixed(4)}` : 'Not captured'}</span></div>
                </div>
                <div className="flex gap-4 mt-3">
                  {watch('isYouthLed') && <span className="chip chip-amber">Youth-Led</span>}
                  {watch('isWomenLed') && <span className="chip chip-red">Women-Led</span>}
                  {watch('hasDisabilityInclusion') && <span className="chip chip-purple">Disability Inclusive</span>}
                </div>
              </div>
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-center gap-2">
                  <AlertCircle size={14} />{error?.response?.data?.error?.message || 'An error occurred. Please try again.'}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="px-6 py-4 border-t border-border flex items-center justify-between bg-muted/30">
          <div className="flex gap-2">
            {step > 1 && <button type="button" onClick={() => setStep(s => s - 1)} className="btn-secondary">← Previous</button>}
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={onSaveDraft} disabled={saveDraft.isPending} className="btn-secondary gap-1.5">
              {saveDraft.isPending ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              Save Draft
            </button>
            {step < 5 ? (
              <button type="button" onClick={() => setStep(s => s + 1)} className="btn-primary">
                Next → 
              </button>
            ) : (
              <button type="button" onClick={onSubmit} disabled={submitForReview.isPending} className="btn-primary gap-1.5">
                {submitForReview.isPending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                Submit for Review
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
