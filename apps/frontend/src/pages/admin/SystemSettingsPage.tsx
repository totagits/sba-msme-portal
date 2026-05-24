import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { settingsApi } from '../../lib/api';
import { Settings, Save } from 'lucide-react';
import { useState } from 'react';

export default function SystemSettingsPage() {
  const queryClient = useQueryClient();
  const { data: settings, isLoading } = useQuery({ queryKey: ['settings'], queryFn: () => settingsApi.getAll().then(r => r.data.data) });
  const { data: counties } = useQuery({ queryKey: ['counties'], queryFn: () => settingsApi.getCounties().then(r => r.data.data) });
  const { data: sectors } = useQuery({ queryKey: ['sectors'], queryFn: () => settingsApi.getSectors().then(r => r.data.data) });
  const [values, setValues] = useState<Record<string,string>>({});
  const [savedKeys, setSavedKeys] = useState<string[]>([]);

  const updateMutation = useMutation({
    mutationFn: (key: string) => settingsApi.update(key, values[key]),
    onSuccess: (_, key) => { queryClient.invalidateQueries({ queryKey: ['settings'] }); setSavedKeys(prev => [...prev, key]); setTimeout(() => setSavedKeys(prev => prev.filter(k => k !== key)), 2000); },
  });

  const grouped = (settings||[]).reduce((acc: any, s: any) => {
    const cat = s.category || 'General';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(s);
    return acc;
  }, {});

  return (
    <div className="page-container">
      <div className="page-header">
        <div><h1 className="page-title flex items-center gap-2"><Settings size={22} className="text-primary-600"/>System Settings</h1>
          <p className="page-subtitle">Configure system-wide settings, counties, and sectors</p></div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Settings */}
        <div className="lg:col-span-2 space-y-6">
          {isLoading ? <div className="skeleton h-48 rounded-xl"/> :
           Object.entries(grouped).map(([category, items]: [string, any]) => (
            <div key={category} className="card">
              <div className="card-header"><p className="card-title">{category}</p></div>
              <div className="card-body space-y-4">
                {items.map((setting: any) => (
                  <div key={setting.key}>
                    <label className="form-label">{setting.label || setting.key}</label>
                    {setting.description && <p className="text-xs text-muted-foreground mb-1.5">{setting.description}</p>}
                    <div className="flex gap-2">
                      <input
                        className="form-input flex-1"
                        defaultValue={setting.value}
                        onChange={e => setValues(prev => ({ ...prev, [setting.key]: e.target.value }))}
                        readOnly={!setting.isEditable}
                      />
                      {setting.isEditable && values[setting.key] !== undefined && values[setting.key] !== setting.value && (
                        <button onClick={() => updateMutation.mutate(setting.key)} className="btn-primary btn-sm gap-1.5">
                          {savedKeys.includes(setting.key) ? '✓ Saved' : <><Save size={12}/>Save</>}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Reference Data */}
        <div className="space-y-6">
          <div className="card">
            <div className="card-header"><p className="card-title">Counties ({(counties||[]).length})</p></div>
            <div className="card-body max-h-64 overflow-y-auto">
              <div className="space-y-1">
                {(counties||[]).map((c:any) => (
                  <div key={c.id} className="flex items-center justify-between py-1 text-sm">
                    <span>{c.name}</span>
                    <span className="text-xs text-muted-foreground">{c.region||''}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header"><p className="card-title">Economic Sectors ({(sectors||[]).length})</p></div>
            <div className="card-body max-h-64 overflow-y-auto">
              <div className="space-y-1">
                {(sectors||[]).map((s:any) => (
                  <div key={s.id} className="py-1">
                    <p className="text-sm font-medium">{s.name}</p>
                    {s.subsectors?.length>0 && <p className="text-xs text-muted-foreground ml-3">{s.subsectors.length} sub-sector{s.subsectors.length>1?'s':''}</p>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
