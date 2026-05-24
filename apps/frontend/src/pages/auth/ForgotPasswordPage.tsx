import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'wouter';
import { Mail, ArrowLeft, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { authApi } from '../../lib/api';

const schema = z.object({ email: z.string().email('Enter a valid email') });

type FormData = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const [done, setDone] = useState(false);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    await authApi.forgotPassword(data.email);
    setDone(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-900 to-primary-700 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <Link href="/login"><a className="flex items-center gap-2 text-primary-300 hover:text-white text-sm mb-6 transition-colors"><ArrowLeft size={16} />Back to Login</a></Link>
        <div className="bg-white rounded-2xl shadow-modal p-8">
          {done ? (
            <div className="text-center py-4">
              <CheckCircle2 size={48} className="text-success-600 mx-auto mb-4" />
              <h2 className="text-xl font-bold mb-2">Check Your Email</h2>
              <p className="text-muted-foreground text-sm">If an account exists with this email, you will receive a password reset link within a few minutes.</p>
              <Link href="/login"><a className="btn-primary mt-6 inline-flex">Back to Login</a></Link>
            </div>
          ) : (
            <>
              <div className="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center mb-4"><Mail size={22} className="text-primary-700" /></div>
              <h2 className="text-xl font-bold mb-1">Forgot Password?</h2>
              <p className="text-muted-foreground text-sm mb-6">Enter your email address and we'll send you a link to reset your password.</p>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <label className="form-label">Email Address</label>
                  <input type="email" className="form-input" placeholder="your.email@example.com" {...register('email')} />
                  {errors.email && <p className="form-error"><AlertCircle size={12} />{String(errors.email.message)}</p>}
                </div>
                <button type="submit" disabled={isSubmitting} className="btn-primary w-full py-2.5">
                  {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : null}
                  {isSubmitting ? 'Sending...' : 'Send Reset Link'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
