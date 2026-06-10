import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { authApi } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { User as UserIcon, Save, KeyRound, Loader2, CheckCircle2, Phone, ShieldAlert, Camera } from 'lucide-react';

export default function ProfilePage() {
  const { user, logout, updateUserInfo } = useAuth();
  const queryClient = useQueryClient();

  // Profile Form State
  const [profileForm, setProfileForm] = useState({
    phone: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    profileImageUrl: '',
  });
  const [profileError, setProfileError] = useState('');
  const [profileSaved, setProfileSaved] = useState(false);

  // Password Form State
  const [pwdForm, setPwdForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [pwdError, setPwdError] = useState('');
  const [pwdSaved, setPwdSaved] = useState(false);

  useEffect(() => {
    if (user) {
      setProfileForm({
        phone: user.phone || '',
        emergencyContactName: user.emergencyContactName || '',
        emergencyContactPhone: user.emergencyContactPhone || '',
        profileImageUrl: user.profileImageUrl || '',
      });
    }
  }, [user]);

  // Mutations
  const updateProfileMutation = useMutation({
    mutationFn: (data: typeof profileForm) => authApi.updateProfile(data),
    onSuccess: (res) => {
      setProfileSaved(true);
      updateUserInfo(res.data.data);
      setTimeout(() => setProfileSaved(false), 3000);
    },
    onError: (e: any) => setProfileError(e.response?.data?.error?.message || 'Failed to update profile information'),
  });

  const changePwdMutation = useMutation({
    mutationFn: () => authApi.changePassword(pwdForm.currentPassword, pwdForm.newPassword),
    onSuccess: () => {
      setPwdSaved(true);
      setPwdForm({ currentPassword: '', newPassword: '', confirm: '' });
      setTimeout(() => setPwdSaved(false), 3000);
    },
    onError: (e: any) => setPwdError(e.response?.data?.error?.message || 'Failed to change password'),
  });

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError('');
    updateProfileMutation.mutate(profileForm);
  };

  const handleChangePwd = (e: React.FormEvent) => {
    e.preventDefault();
    setPwdError('');
    if (pwdForm.newPassword !== pwdForm.confirm) {
      setPwdError('Passwords do not match');
      return;
    }
    if (pwdForm.newPassword.length < 8) {
      setPwdError('Password must be at least 8 characters');
      return;
    }
    changePwdMutation.mutate();
  };

  return (
    <div className="page-container max-w-4xl mx-auto py-8 px-4">
      {/* Page Header */}
      <div className="page-header mb-8">
        <div>
          <h1 className="page-title flex items-center gap-2.5 text-2xl font-extrabold tracking-tight">
            <UserIcon size={26} className="text-primary-600" />
            My Profile
          </h1>
          <p className="page-subtitle text-sm text-muted-foreground mt-1">
            Manage your personal profile details, emergency contacts, and security credentials
          </p>
        </div>
      </div>

      <div className="grid md:grid-cols-12 gap-8 items-start">
        {/* Left Side: General Profile Info & Photo */}
        <div className="md:col-span-7 space-y-6">
          <form onSubmit={handleUpdateProfile} className="card bg-white border border-border rounded-2xl shadow-sm overflow-hidden">
            <div className="card-header border-b border-border bg-slate-50/50 p-5">
              <h2 className="card-title text-base font-bold text-slate-800 flex items-center gap-2">
                <UserIcon size={18} className="text-primary-600" />
                Personal & Contact Details
              </h2>
            </div>
            
            <div className="card-body p-6 space-y-5">
              {profileSaved && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-xl text-sm text-success-700 flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-success-600 flex-shrink-0" />
                  <span>Profile updated successfully!</span>
                </div>
              )}
              {profileError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 flex items-center gap-2">
                  <ShieldAlert size={16} className="text-red-600 flex-shrink-0" />
                  <span>{profileError}</span>
                </div>
              )}

              {/* Avatar and Info Block */}
              <div className="flex flex-col sm:flex-row items-center gap-5 pb-5 border-b border-slate-100">
                <div className="relative group">
                  {profileForm.profileImageUrl ? (
                    <img 
                      src={profileForm.profileImageUrl} 
                      alt="Avatar" 
                      className="w-20 h-20 rounded-full object-cover border-2 border-primary-100 shadow-sm"
                      onError={() => setProfileForm(f => ({ ...f, profileImageUrl: '' }))}
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-primary-600 to-primary-500 flex items-center justify-center text-white text-2xl font-bold border-2 border-primary-100 shadow-sm">
                      {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    <Camera size={18} className="text-white" />
                  </div>
                </div>
                <div className="text-center sm:text-left">
                  <h3 className="text-lg font-bold text-slate-900">{user?.firstName} {user?.lastName}</h3>
                  <p className="text-sm text-muted-foreground">{user?.email}</p>
                  <div className="flex flex-wrap justify-center sm:justify-start gap-1 mt-2">
                    {user?.roles?.map((r: string) => (
                      <span key={r} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-primary-50 text-primary-700 border border-primary-100 uppercase tracking-wider scale-[0.9]">
                        {r.replace('_', ' ')}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Form Input Fields */}
              <div className="space-y-4">
                <div>
                  <label htmlFor="profile-photo" className="form-label">Profile Photo URL</label>
                  <div className="relative">
                    <input 
                      id="profile-photo"
                      type="url" 
                      placeholder="https://example.com/avatar.jpg"
                      value={profileForm.profileImageUrl} 
                      onChange={e => setProfileForm(f => ({ ...f, profileImageUrl: e.target.value }))}
                      className="form-input"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="profile-phone" className="form-label">Contact Phone Number</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                      <Phone size={14} />
                    </span>
                    <input 
                      id="profile-phone"
                      type="tel" 
                      placeholder="+231 77 000 0000"
                      value={profileForm.phone} 
                      onChange={e => setProfileForm(f => ({ ...f, phone: e.target.value }))}
                      className="form-input pl-9"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Emergency Contact Details</h4>
                  
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="emergency-name" className="form-label">Contact Person Name</label>
                      <input 
                        id="emergency-name"
                        type="text" 
                        placeholder="John Doe"
                        value={profileForm.emergencyContactName} 
                        onChange={e => setProfileForm(f => ({ ...f, emergencyContactName: e.target.value }))}
                        className="form-input"
                      />
                    </div>
                    <div>
                      <label htmlFor="emergency-phone" className="form-label">Contact Person Phone</label>
                      <input 
                        id="emergency-phone"
                        type="tel" 
                        placeholder="+231 77 000 0000"
                        value={profileForm.emergencyContactPhone} 
                        onChange={e => setProfileForm(f => ({ ...f, emergencyContactPhone: e.target.value }))}
                        className="form-input"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end">
                <button 
                  type="submit" 
                  disabled={updateProfileMutation.isPending} 
                  className="btn-primary px-5 py-2.5 gap-2"
                >
                  {updateProfileMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  <span>Save Changes</span>
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Right Side: Change Password & Session Actions */}
        <div className="md:col-span-5 space-y-6">
          <form onSubmit={handleChangePwd} className="card bg-white border border-border rounded-2xl shadow-sm overflow-hidden">
            <div className="card-header border-b border-border bg-slate-50/50 p-5">
              <h2 className="card-title text-base font-bold text-slate-800 flex items-center gap-2">
                <KeyRound size={18} className="text-primary-600" />
                Change Password
              </h2>
            </div>

            <div className="card-body p-6 space-y-4">
              {pwdSaved && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-xl text-sm text-success-700 flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-success-600 flex-shrink-0" />
                  <span>Password changed successfully!</span>
                </div>
              )}
              {pwdError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 flex items-center gap-2">
                  <ShieldAlert size={16} className="text-red-600 flex-shrink-0" />
                  <span>{pwdError}</span>
                </div>
              )}

              <div>
                <label htmlFor="current-pwd" className="form-label">Current Password</label>
                <input 
                  id="current-pwd"
                  type="password" 
                  className="form-input" 
                  value={pwdForm.currentPassword} 
                  onChange={e => setPwdForm(f => ({ ...f, currentPassword: e.target.value }))} 
                  required
                />
              </div>

              <div>
                <label htmlFor="new-pwd" className="form-label">New Password</label>
                <input 
                  id="new-pwd"
                  type="password" 
                  className="form-input" 
                  value={pwdForm.newPassword} 
                  onChange={e => setPwdForm(f => ({ ...f, newPassword: e.target.value }))} 
                  required
                />
              </div>

              <div>
                <label htmlFor="confirm-pwd" className="form-label">Confirm New Password</label>
                <input 
                  id="confirm-pwd"
                  type="password" 
                  className="form-input" 
                  value={pwdForm.confirm} 
                  onChange={e => setPwdForm(f => ({ ...f, confirm: e.target.value }))} 
                  required
                />
              </div>

              <button 
                type="submit" 
                disabled={changePwdMutation.isPending || !pwdForm.currentPassword || !pwdForm.newPassword} 
                className="btn-primary w-full py-2.5 mt-2 gap-2"
              >
                {changePwdMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <KeyRound size={16} />}
                <span>Update Password</span>
              </button>
            </div>
          </form>

          {/* Session Logout Action */}
          <div className="card bg-slate-50/50 border border-border border-dashed rounded-2xl p-6 text-center">
            <p className="text-xs text-muted-foreground mb-4">
              Need to leave? Sign out of your active portal session safely below.
            </p>
            <button 
              type="button" 
              onClick={logout} 
              className="btn-destructive w-full py-2.5"
            >
              Sign Out of Portal
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
