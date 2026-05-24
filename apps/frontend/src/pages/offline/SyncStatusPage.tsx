import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { offlineDB, getPendingCount } from '../../lib/db';
import { syncApi } from '../../lib/api';
import { RefreshCw, CheckCircle2, XCircle, Clock, Loader2, Trash2 } from 'lucide-react';

export default function SyncStatusPage() {
  const [pendingRecords, setPendingRecords] = useState<any[]>([]);
  const [failedRecords, setFailedRecords] = useState<any[]>([]);
  const [syncedRecords, setSyncedRecords] = useState<any[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncLog, setSyncLog] = useState<string[]>([]);
  const queryClient = useQueryClient();

  const loadRecords = async () => {
    const all = await offlineDB.offlineMSMEs.toArray();
    setPendingRecords(all.filter(r => r.syncStatus === 'PENDING'));
    setFailedRecords(all.filter(r => r.syncStatus === 'FAILED'));
    setSyncedRecords(all.filter(r => r.syncStatus === 'SYNCED'));
  };

  useEffect(() => { loadRecords(); }, []);

  const handleSync = async () => {
    if (pendingRecords.length === 0) return;
    setIsSyncing(true);
    const log: string[] = [];
    log.push(`Starting sync of ${pendingRecords.length} records...`);
    setSyncLog([...log]);

    for (const record of pendingRecords) {
      try {
        const response = await syncApi.sync([{ entityType: 'MSME', payload: record.payload }]);
        const result = response.data.data[0];
        if (result.success) {
          await offlineDB.offlineMSMEs.update(record.id!, { syncStatus: 'SYNCED', serverRecordId: result.recordId });
          log.push(`✅ Synced: ${record.businessName}`);
        } else {
          await offlineDB.offlineMSMEs.update(record.id!, { syncStatus: 'FAILED', errorMessage: result.error });
          log.push(`❌ Failed: ${record.businessName} — ${result.error}`);
        }
      } catch (e: any) {
        await offlineDB.offlineMSMEs.update(record.id!, { syncStatus: 'FAILED', errorMessage: e.message });
        log.push(`❌ Error: ${record.businessName} — ${e.message}`);
      }
      setSyncLog([...log]);
    }

    log.push(`Sync complete.`);
    setSyncLog([...log]);
    setIsSyncing(false);
    await loadRecords();
    queryClient.invalidateQueries({ queryKey: ['msmes'] });
  };

  const handleClearSynced = async () => {
    await offlineDB.offlineMSMEs.where('syncStatus').equals('SYNCED').delete();
    await loadRecords();
  };

  const retryFailed = async (id: number) => {
    await offlineDB.offlineMSMEs.update(id, { syncStatus: 'PENDING', errorMessage: undefined });
    await loadRecords();
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title flex items-center gap-2"><RefreshCw size={22} className="text-primary-600"/>Sync Status</h1>
          <p className="page-subtitle">Manage and monitor offline data synchronization</p>
        </div>
        <button onClick={handleSync} disabled={isSyncing || pendingRecords.length===0} className="btn-primary gap-2">
          {isSyncing ? <Loader2 size={16} className="animate-spin"/> : <RefreshCw size={16}/>}
          {isSyncing ? 'Syncing...' : `Sync ${pendingRecords.length} Records`}
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="card p-5 border-l-4 border-l-warning-600">
          <div className="flex items-center gap-3">
            <Clock size={24} className="text-warning-600"/>
            <div><p className="text-2xl font-black">{pendingRecords.length}</p><p className="text-xs text-muted-foreground">Pending Sync</p></div>
          </div>
        </div>
        <div className="card p-5 border-l-4 border-l-success-600">
          <div className="flex items-center gap-3">
            <CheckCircle2 size={24} className="text-success-600"/>
            <div><p className="text-2xl font-black">{syncedRecords.length}</p><p className="text-xs text-muted-foreground">Synced</p></div>
          </div>
        </div>
        <div className="card p-5 border-l-4 border-l-destructive">
          <div className="flex items-center gap-3">
            <XCircle size={24} className="text-destructive"/>
            <div><p className="text-2xl font-black">{failedRecords.length}</p><p className="text-xs text-muted-foreground">Failed</p></div>
          </div>
        </div>
      </div>

      {/* Sync Log */}
      {syncLog.length > 0 && (
        <div className="card mb-6">
          <div className="card-header"><p className="card-title">Sync Log</p></div>
          <div className="card-body">
            <div className="bg-gray-900 rounded-lg p-4 font-mono text-xs text-green-400 max-h-48 overflow-y-auto space-y-1">
              {syncLog.map((line, i) => <p key={i}>&gt; {line}</p>)}
              {isSyncing && <p className="animate-pulse">&gt; _</p>}
            </div>
          </div>
        </div>
      )}

      {/* Pending Records */}
      {pendingRecords.length > 0 && (
        <div className="card mb-6">
          <div className="card-header"><p className="card-title flex items-center gap-2"><Clock size={16} className="text-warning-600"/>Pending Records</p></div>
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead><tr><th>Business Name</th><th>Category</th><th>Owner</th><th>Phone</th><th>GPS</th><th>Captured At</th></tr></thead>
              <tbody>
                {pendingRecords.map(r=>(
                  <tr key={r.id}>
                    <td className="font-medium">{r.businessName}</td>
                    <td><span className="chip chip-gray text-xs">{r.msmeCategory}</span></td>
                    <td className="text-sm">{r.ownerName||'—'}</td>
                    <td className="text-sm font-mono">{r.phone||'—'}</td>
                    <td className="text-xs">{r.gpsLatitude?`📍 ${r.gpsLatitude?.toFixed(3)}, ${r.gpsLongitude?.toFixed(3)}`:'—'}</td>
                    <td className="text-xs text-muted-foreground">{new Date(r.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Failed Records */}
      {failedRecords.length > 0 && (
        <div className="card mb-6">
          <div className="card-header"><p className="card-title flex items-center gap-2"><XCircle size={16} className="text-destructive"/>Failed Records</p></div>
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead><tr><th>Business Name</th><th>Error</th><th>Captured At</th><th>Action</th></tr></thead>
              <tbody>
                {failedRecords.map(r=>(
                  <tr key={r.id}>
                    <td className="font-medium">{r.businessName}</td>
                    <td className="text-xs text-destructive">{r.errorMessage||'Unknown error'}</td>
                    <td className="text-xs text-muted-foreground">{new Date(r.createdAt).toLocaleString()}</td>
                    <td><button onClick={()=>retryFailed(r.id!)} className="text-xs text-primary-600 hover:underline">Retry</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Synced Records */}
      {syncedRecords.length > 0 && (
        <div className="card">
          <div className="card-header">
            <p className="card-title flex items-center gap-2"><CheckCircle2 size={16} className="text-success-600"/>Synced Records ({syncedRecords.length})</p>
            <button onClick={handleClearSynced} className="btn-ghost btn-sm text-muted-foreground gap-1.5"><Trash2 size={12}/>Clear Synced</button>
          </div>
          <div className="card-body"><p className="text-sm text-muted-foreground">These records have been successfully uploaded to the server. You can safely clear them from local storage.</p></div>
        </div>
      )}

      {pendingRecords.length===0 && failedRecords.length===0 && syncedRecords.length===0 && (
        <div className="card p-12 text-center">
          <RefreshCw size={48} className="text-muted-foreground/30 mx-auto mb-4"/>
          <p className="font-semibold text-muted-foreground">No offline records</p>
          <p className="text-sm text-muted-foreground mt-1">Go to Offline Collection to capture MSMEs without internet.</p>
        </div>
      )}
    </div>
  );
}
