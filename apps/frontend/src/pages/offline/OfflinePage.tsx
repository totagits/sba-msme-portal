import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { offlineDB, getPendingCount, generateLocalId } from '../../lib/db';
import { settingsApi } from '../../lib/api';
import { WifiOff, Save, Loader2, MapPin, AlertCircle } from 'lucide-react';
import { Link } from 'wouter';

export default function OfflinePage() {
  const [pendingCount, setPendingCount] = useState(0);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    businessName: '', msmeCategory: 'MICRO', businessType: 'SOLE_PROPRIETORSHIP', formalityStatus: 'UNREGISTERED',
    countyId: '', ownerName: '', phone: '', isYouthLed: false, isWomenLed: false, gpsLatitude: '', gpsLongitude: '',
    numberOfEmployees: '', notes: '',
  });

  const { data: counties } = useQuery({ queryKey: ['counties'], queryFn: () => settingsApi.getCounties().then(r => r.data.data) });

  useEffect(() => {
    const updateCount = async () => setPendingCount(await getPendingCount());
    updateCount();
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => { window.removeEventListener('online', handleOnline); window.removeEventListener('offline', handleOffline); };
  }, [saved]);

  const captureGPS = () => navigator.geolocation?.getCurrentPosition(pos => setForm(f => ({ ...f, gpsLatitude: pos.coords.latitude.toString(), gpsLongitude: pos.coords.longitude.toString() })));

  const handleSave = async () => {
    if (!form.businessName || !form.countyId) return;
    await offlineDB.offlineMSMEs.add({
      localId: generateLocalId(),
      businessName: form.businessName,
      businessType: form.businessType,
      msmeCategory: form.msmeCategory as any,
      formalityStatus: form.formalityStatus,
      countyId: form.countyId,
      ownerName: form.ownerName,
      phone: form.phone,
      isYouthLed: form.isYouthLed,
      isWomenLed: form.isWomenLed,
      gpsLatitude: form.gpsLatitude ? parseFloat(form.gpsLatitude) : undefined,
      gpsLongitude: form.gpsLongitude ? parseFloat(form.gpsLongitude) : undefined,
      syncStatus: 'PENDING',
      createdAt: new Date(),
      updatedAt: new Date(),
      payload: { ...form },
    });
    setSaved(true);
    setForm({ businessName: '', msmeCategory: 'MICRO', businessType: 'SOLE_PROPRIETORSHIP', formalityStatus: 'UNREGISTERED', countyId: '', ownerName: '', phone: '', isYouthLed: false, isWomenLed: false, gpsLatitude: '', gpsLongitude: '', numberOfEmployees: '', notes: '' });
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="page-container max-w-2xl">
      <div className="page-header">
        <div><h1 className="page-title flex items-center gap-2"><WifiOff size={22} className="text-primary-600"/>Offline Data Collection</h1>
          <p className="page-subtitle">Collect MSME data without internet access — records sync automatically when online</p></div>
      </div>

      {/* Status Banner */}
      <div className={`mb-6 p-4 rounded-xl border-2 flex items-center gap-3 ${isOnline ? 'bg-green-50 border-green-300' : 'bg-amber-50 border-amber-300'}`}>
        <div className={`w-3 h-3 rounded-full ${isOnline ? 'bg-success-600' : 'bg-amber-500 animate-pulse'}`} />
        <div className="flex-1">
          <p className="font-semibold text-sm">{isOnline ? '🌐 Online — Data will sync immediately' : '📴 Offline — Data saved locally, will sync when connected'}</p>
          {pendingCount > 0 && <p className="text-xs text-muted-foreground mt-0.5">{pendingCount} record{pendingCount>1?'s':''} pending synchronization</p>}
        </div>
        {isOnline && pendingCount > 0 && <Link href="/sync"><a className="btn-primary btn-sm">Sync Now</a></Link>}
      </div>

      {saved && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-success-700 text-sm font-medium">
          ✅ Record saved locally! It will sync when you're back online.
        </div>
      )}

      {/* Offline MSME Form */}
      <div className="card">
        <div className="card-header"><p className="card-title">Register MSME (Offline)</p></div>
        <div className="card-body space-y-4">
          <div>
            <label className="form-label">Business Name *</label>
            <input className="form-input" placeholder="Enter business name" value={form.businessName} onChange={e => setForm(f => ({ ...f, businessName: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">MSME Category</label>
              <select className="form-input" value={form.msmeCategory} onChange={e => setForm(f => ({ ...f, msmeCategory: e.target.value }))}>
                <option value="MICRO">Micro</option><option value="SMALL">Small</option><option value="MEDIUM">Medium</option>
              </select>
            </div>
            <div>
              <label className="form-label">Business Type</label>
              <select className="form-input" value={form.businessType} onChange={e => setForm(f => ({ ...f, businessType: e.target.value }))}>
                {['SOLE_PROPRIETORSHIP','PARTNERSHIP','CORPORATION','COOPERATIVE','ASSOCIATION','INFORMAL_ENTERPRISE'].map(t=><option key={t} value={t}>{t.replace(/_/g,' ')}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="form-label">County *</label>
            <select className="form-input" value={form.countyId} onChange={e => setForm(f => ({ ...f, countyId: e.target.value }))}>
              <option value="">— Select County —</option>
              {(counties||[]).map((c:any) => <option key={c.id} value={c.id}>{c.name} County</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="form-label">Owner Name</label><input className="form-input" value={form.ownerName} onChange={e => setForm(f => ({ ...f, ownerName: e.target.value }))} /></div>
            <div><label className="form-label">Phone</label><input className="form-input" type="tel" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="form-label">Total Employees</label><input className="form-input" type="number" value={form.numberOfEmployees} onChange={e => setForm(f => ({ ...f, numberOfEmployees: e.target.value }))} /></div>
            <div className="flex flex-col gap-2 mt-6">
              <label className="flex items-center gap-2 text-sm cursor-pointer"><input type="checkbox" checked={form.isYouthLed} onChange={e => setForm(f => ({ ...f, isYouthLed: e.target.checked }))} />Youth-Led</label>
              <label className="flex items-center gap-2 text-sm cursor-pointer"><input type="checkbox" checked={form.isWomenLed} onChange={e => setForm(f => ({ ...f, isWomenLed: e.target.checked }))} />Women-Led</label>
            </div>
          </div>
          <div>
            <label className="form-label">GPS Location</label>
            <div className="flex gap-2 items-end">
              <input className="form-input" type="number" step="any" placeholder="Latitude" value={form.gpsLatitude} onChange={e => setForm(f => ({ ...f, gpsLatitude: e.target.value }))} />
              <input className="form-input" type="number" step="any" placeholder="Longitude" value={form.gpsLongitude} onChange={e => setForm(f => ({ ...f, gpsLongitude: e.target.value }))} />
              <button onClick={captureGPS} className="btn-secondary whitespace-nowrap gap-1.5"><MapPin size={14}/>Capture</button>
            </div>
          </div>
          <div><label className="form-label">Notes</label><textarea className="form-input" rows={2} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} /></div>
        </div>
        <div className="px-6 py-4 border-t border-border flex justify-end bg-muted/30">
          <button onClick={handleSave} disabled={!form.businessName || !form.countyId} className="btn-primary gap-2">
            <Save size={14}/>Save Offline
          </button>
        </div>
      </div>

      <div className="mt-4 text-center">
        <Link href="/sync"><a className="text-sm text-primary-600 hover:underline">View Sync Status & Pending Records →</a></Link>
      </div>
    </div>
  );
}
