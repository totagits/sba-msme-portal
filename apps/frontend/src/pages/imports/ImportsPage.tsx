import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { importsApi } from '../../lib/api';
import { formatDate } from '../../lib/utils';
import { Upload, FileSpreadsheet, AlertTriangle, CheckCircle2, Loader2, RotateCcw } from 'lucide-react';

export default function ImportsPage() {
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [entityType, setEntityType] = useState('MSME');
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [rollbackId, setRollbackId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({ queryKey: ['imports'], queryFn: () => importsApi.list().then(r => r.data.data) });

  const uploadMutation = useMutation({
    mutationFn: () => importsApi.upload(selectedFile!, entityType),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['imports'] }); setSelectedFile(null); },
  });

  const rollbackMutation = useMutation({
    mutationFn: (id: string) => importsApi.rollback(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['imports'] }); setRollbackId(null); },
  });

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && (file.name.endsWith('.csv') || file.name.endsWith('.xlsx'))) setSelectedFile(file);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setSelectedFile(file);
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div><h1 className="page-title flex items-center gap-2"><Upload size={22} className="text-primary-600"/>Data Import</h1>
          <p className="page-subtitle">Bulk import MSMEs or BDSPs from CSV or Excel files</p></div>
      </div>

      {/* Upload Card */}
      <div className="card mb-8">
        <div className="card-header"><p className="card-title">Upload Data File</p></div>
        <div className="card-body space-y-5">
          <div>
            <label className="form-label">Entity Type</label>
            <div className="flex gap-3">
              {['MSME','BDSP'].map(t => (
                <label key={t} className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 cursor-pointer transition-all ${entityType===t?'border-primary-500 bg-primary-50 text-primary-700':'border-border text-muted-foreground hover:border-primary-200'}`}>
                  <input type="radio" className="sr-only" name="entityType" value={t} checked={entityType===t} onChange={()=>setEntityType(t)} />
                  <span className="text-sm font-medium">{t === 'MSME' ? 'MSME Registry' : 'BDSP Registry'}</span>
                </label>
              ))}
            </div>
          </div>

          <div
            className={`border-2 border-dashed rounded-xl p-10 text-center transition-all cursor-pointer ${dragOver ? 'border-primary-500 bg-primary-50' : 'border-border hover:border-primary-300'}`}
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileRef.current?.click()}
          >
            <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls" className="sr-only" onChange={handleFileSelect} />
            {selectedFile ? (
              <div>
                <FileSpreadsheet size={40} className="text-success-600 mx-auto mb-3" />
                <p className="font-semibold text-foreground">{selectedFile.name}</p>
                <p className="text-sm text-muted-foreground mt-1">{(selectedFile.size / 1024).toFixed(1)} KB • Click to change</p>
              </div>
            ) : (
              <div>
                <Upload size={40} className="text-muted-foreground/40 mx-auto mb-3" />
                <p className="font-semibold text-foreground mb-1">Drop your file here or click to browse</p>
                <p className="text-sm text-muted-foreground">Supported formats: CSV (.csv) and Excel (.xlsx, .xls) — Max 10MB</p>
              </div>
            )}
          </div>

          {/* Template Download */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm flex items-start gap-3">
            <FileSpreadsheet size={18} className="text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-blue-800">Download Template</p>
              <p className="text-blue-600 text-xs mt-0.5">Use the standard template to ensure all required columns are present and correctly formatted.</p>
              <div className="flex gap-2 mt-2">
                <a href="/templates/msme-import-template.csv" download className="text-xs text-blue-700 font-semibold hover:underline">MSME Template (CSV)</a>
                <span className="text-blue-400">•</span>
                <a href="/templates/bdsp-import-template.csv" download className="text-xs text-blue-700 font-semibold hover:underline">BDSP Template (CSV)</a>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button onClick={() => uploadMutation.mutate()} disabled={!selectedFile || uploadMutation.isPending} className="btn-primary gap-2">
              {uploadMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
              {uploadMutation.isPending ? 'Uploading & Processing...' : 'Upload & Import'}
            </button>
          </div>
        </div>
      </div>

      {/* Import History */}
      <div className="card">
        <div className="card-header"><p className="card-title">Import History</p></div>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead><tr><th>File Name</th><th>Entity</th><th>Total Rows</th><th>Success</th><th>Errors</th><th>Imported By</th><th>Date</th><th className="text-right">Actions</th></tr></thead>
            <tbody>
              {isLoading ? (
                Array.from({length:4}).map((_,i)=><tr key={i}>{Array.from({length:8}).map((_,j)=><td key={j}><div className="skeleton h-4 rounded"/></td>)}</tr>)
              ) : (data||[]).length===0 ? (
                <tr><td colSpan={8} className="text-center py-12">
                  <Upload size={40} className="text-muted-foreground/30 mx-auto mb-3"/>
                  <p className="text-muted-foreground">No imports yet</p>
                </td></tr>
              ) : (data||[]).map((imp:any)=>(
                <tr key={imp.id}>
                  <td className="font-medium text-sm">{imp.originalFileName}</td>
                  <td><span className="chip chip-blue text-xs">{imp.entityType}</span></td>
                  <td className="text-center">{imp.totalRows}</td>
                  <td className="text-center"><span className="flex items-center gap-1 text-success-600 font-semibold justify-center"><CheckCircle2 size={12}/>{imp.successRows}</span></td>
                  <td className="text-center">
                    {imp.errorRows>0 ? <span className="flex items-center gap-1 text-destructive font-semibold justify-center"><AlertTriangle size={12}/>{imp.errorRows}</span> : <span className="text-muted-foreground">0</span>}
                  </td>
                  <td className="text-sm">{imp.importedBy?.firstName} {imp.importedBy?.lastName}</td>
                  <td className="text-xs text-muted-foreground">{formatDate(imp.createdAt,'datetime')}</td>
                  <td>
                    <div className="flex items-center justify-end">
                      {imp.status!=='ROLLED_BACK' && (
                        <button onClick={()=>setRollbackId(imp.id)} className="btn-ghost btn-sm text-xs text-destructive gap-1">
                          <RotateCcw size={12}/>Rollback
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Rollback Confirm */}
      {rollbackId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full">
            <div className="flex items-center gap-3 mb-3"><AlertTriangle size={24} className="text-destructive"/><h3 className="font-bold text-lg">Rollback Import</h3></div>
            <p className="text-sm text-muted-foreground mb-5">This will soft-delete all records created by this import batch. This action can be undone by contacting an administrator.</p>
            <div className="flex gap-2 justify-end">
              <button onClick={()=>setRollbackId(null)} className="btn-secondary">Cancel</button>
              <button onClick={()=>rollbackMutation.mutate(rollbackId)} disabled={rollbackMutation.isPending} className="btn-destructive gap-1.5">
                {rollbackMutation.isPending&&<Loader2 size={14} className="animate-spin"/>}Confirm Rollback
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
