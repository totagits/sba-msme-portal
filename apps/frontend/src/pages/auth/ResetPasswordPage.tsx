import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useLocation } from 'wouter';
import { CheckCircle2, AlertCircle, Loader2, KeyRound } from 'lucide-react';
import { authApi } from '../../lib/api';

const schema = z.object({
  password: z.string().min(8, 'At least 8 characters').regex(/[A-Z]/, 'Must contain uppercase').regex(/[0-9]/, 'Must contain a number'),
  confirm: z.string(),
}).refine(d => d.password === d.confirm, { message: 'Passwords do not match', path: ['confirm'] });

export default function ResetPasswordPage({ token }: { token: string }) {
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({ resolver: zodResolver(schema) });

  const onSubmit = async (data: { password: string }) => {
    try {
      await authApi.resetPassword(token, data.password);
      setDone(true);
    } catch (e: any) {
      setError(e.response?.data?.error?.message || 'Failed to reset password. The token may be expired.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-900 to-primary-700 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-modal p-8">
          {done ? (
            <div className="text-center py-4">
              <CheckCircle2 size={48} className="text-success-600 mx-auto mb-4" />
              <h2 className="text-xl font-bold mb-2">Password Reset!</h2>
              <p className="text-muted-foreground text-sm mb-6">Your password has been successfully reset. You can now login with your new password.</p>
              <Link href="/login"><a className="btn-primary inline-flex">Go to Login</a></Link>
            </div>
          ) : (
            <>
              <div className="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center mb-4"><KeyRound size={22} className="text-primary-700" /></div>
              <h2 className="text-xl font-bold mb-1">Reset Password</h2>
              <p className="text-muted-foreground text-sm mb-6">Choose a strong new password for your account.</p>
              {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-center gap-2"><AlertCircle size={14} />{error}</div>}
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <label className="form-label">New Password</label>
                  <input type="password" className="form-input" placeholder="At least 8 characters" {...register('password')} />
                  {errors.password && <p className="form-error"><AlertCircle size={12} />{String(errors.password.message)}</p>}
                </div>
                <div>
                  <label className="form-label">Confirm New Password</label>
                  <input type="password" className="form-input" placeholder="Repeat your password" {...register('confirm')} />
                  {errors.confirm && <p className="form-error"><AlertCircle size={12} />{String(errors.confirm.message)}</p>}
                </div>
                <button type="submit" disabled={isSubmitting} className="btn-primary w-full py-2.5">
                  {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : null}
                  {isSubmitting ? 'Resetting...' : 'Reset Password'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
