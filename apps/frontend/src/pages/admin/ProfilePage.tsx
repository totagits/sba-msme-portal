import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authApi } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { User, Save, KeyRound, Loader2, CheckCircle2 } from 'lucide-react';

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const queryClient = useQueryClient();
  const [pwdForm, setPwdForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [pwdError, setPwdError] = useState('');
  const [pwdSaved, setPwdSaved] = useState(false);

  const changePwdMutation = useMutation({
    mutationFn: () => authApi.changePassword(pwdForm.currentPassword, pwdForm.newPassword),
    onSuccess: () => { setPwdSaved(true); setPwdForm({ currentPassword: '', newPassword: '', confirm: '' }); setTimeout(() => setPwdSaved(false), 3000); },
    onError: (e:any) => setPwdError(e.response?.data?.error?.message || 'Failed to change password'),
  });

  const handleChangePwd = () => {
    setPwdError('');
    if (pwdForm.newPassword !== pwdForm.confirm) { setPwdError('Passwords do not match'); return; }
    if (pwdForm.newPassword.length < 8) { setPwdError('Password must be at least 8 characters'); return; }
    changePwdMutation.mutate();
  };

  return (
    <div className="page-container max-w-3xl">
      <div className="page-header">
        <div><h1 className="page-title flex items-center gap-2"><User size={22} className="text-primary-600"/>My Profile</h1>
          <p className="page-subtitle">Manage your account settings and security</p></div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Profile Info */}
        <div className="card">
          <div className="card-header"><p className="card-title">Account Information</p></div>
          <div className="card-body">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-full bg-primary-600 flex items-center justify-center text-white text-xl font-bold">
                {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
              </div>
              <div>
                <p className="text-lg font-bold">{user?.firstName} {user?.lastName}</p>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
                <div className="flex flex-wrap gap-1 mt-2">
                  {user?.roles?.map((r:string) => <span key={r} className="chip chip-blue text-xs">{r}</span>)}
                </div>
              </div>
            </div>
            <div className="space-y-3 text-sm border-t border-border pt-4">
              <div className="flex justify-between"><span className="text-muted-foreground">Email:</span><span>{user?.email}</span></div>
            </div>
          </div>
        </div>

        {/* Change Password */}
        <div className="card">
          <div className="card-header"><p className="card-title flex items-center gap-2"><KeyRound size={16}/>Change Password</p></div>
          <div className="card-body space-y-4">
            {pwdSaved && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-success-700 flex items-center gap-2">
                <CheckCircle2 size={14}/>Password changed successfully!
              </div>
            )}
            {pwdError && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{pwdError}</div>}
            <div>
              <label className="form-label">Current Password</label>
              <input type="password" className="form-input" value={pwdForm.currentPassword} onChange={e => setPwdForm(f => ({ ...f, currentPassword: e.target.value }))} />
            </div>
            <div>
              <label className="form-label">New Password</label>
              <input type="password" className="form-input" value={pwdForm.newPassword} onChange={e => setPwdForm(f => ({ ...f, newPassword: e.target.value }))} />
            </div>
            <div>
              <label className="form-label">Confirm New Password</label>
              <input type="password" className="form-input" value={pwdForm.confirm} onChange={e => setPwdForm(f => ({ ...f, confirm: e.target.value }))} />
            </div>
            <button onClick={handleChangePwd} disabled={changePwdMutation.isPending || !pwdForm.currentPassword || !pwdForm.newPassword} className="btn-primary w-full gap-2">
              {changePwdMutation.isPending && <Loader2 size={14} className="animate-spin"/>}
              Update Password
            </button>
          </div>
        </div>
      </div>

      <div className="mt-6 pt-6 border-t border-border flex justify-end">
        <button onClick={logout} className="btn-destructive gap-2">Sign Out of Portal</button>
      </div>
    </div>
  );
}
