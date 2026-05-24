import { useState } from 'react';
import { Link } from 'wouter';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, LogIn, AlertCircle, Loader2, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../lib/auth';

const schema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginForm = z.infer<typeof schema>;

const demoUsers = [
  { email: 'admin@sba.gov.lr', role: 'Super Admin', color: 'border-red-500/30 bg-red-500/5 text-red-300' },
  { email: 'sba.admin@sba.gov.lr', role: 'SBA Admin', color: 'border-blue-500/30 bg-blue-500/5 text-blue-300' },
  { email: 'supervisor@sba.gov.lr', role: 'County Supervisor', color: 'border-emerald-500/30 bg-emerald-500/5 text-emerald-300' },
  { email: 'data.officer@sba.gov.lr', role: 'Data Entry Officer', color: 'border-indigo-500/30 bg-indigo-500/5 text-indigo-300' },
  { email: 'inspector@sba.gov.lr', role: 'Field Inspector', color: 'border-teal-500/30 bg-teal-500/5 text-teal-300' },
  { email: 'analyst@sba.gov.lr', role: 'Data Analyst', color: 'border-amber-500/30 bg-amber-500/5 text-amber-300' },
  { email: 'partner@sba.gov.lr', role: 'Partner Viewer', color: 'border-purple-500/30 bg-purple-500/5 text-purple-300' },
  { email: 'finance.viewer@sba.gov.lr', role: 'Finance Viewer', color: 'border-cyan-500/30 bg-cyan-500/5 text-cyan-300' },
  { email: 'owner@sba.gov.lr', role: 'MSME Owner', color: 'border-lime-500/30 bg-lime-500/5 text-lime-300' },
  { email: 'auditor@sba.gov.lr', role: 'Auditor', color: 'border-rose-500/30 bg-rose-500/5 text-rose-300' },
];

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [quickLoginEmail, setQuickLoginEmail] = useState<string | null>(null);
  const { login } = useAuth();

  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm<LoginForm>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: LoginForm) => {
    try {
      setError('');
      await login(data.email, data.password);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Login failed. Please try again.');
    }
  };

  const handleQuickLogin = async (email: string) => {
    if (isSubmitting || quickLoginEmail) return;
    try {
      setError('');
      setQuickLoginEmail(email);
      setValue('email', email);
      setValue('password', 'ChangeMe123!');
      await login(email, 'ChangeMe123!');
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Login failed. Please try again.');
      setQuickLoginEmail(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-900 via-primary-800 to-primary-700 flex flex-col">
      {/* Top government bar */}
      <div className="bg-primary-950 text-primary-300 text-xs py-2 px-6 flex items-center justify-between">
        <span>Republic of Liberia — Official Government Portal</span>
        <span>Ministry of Commerce and Industry</span>
      </div>

      {/* Main content */}
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-5xl">
          {/* Back button */}
          <div className="flex justify-start mb-4">
            <Link href="/">
              <a className="inline-flex items-center gap-2 text-xs text-primary-300 hover:text-white transition-all bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-lg border border-white/10 shadow-sm backdrop-blur-sm group">
                <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
                <span>Back to Homepage</span>
              </a>
            </Link>
          </div>

          {/* Logo / Seal area */}
          <div className="text-center mb-8">
            <Link href="/">
              <a className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-white border border-white/20 mb-4 shadow-lg hover:shadow-xl transition-all group overflow-hidden p-1">
                <img 
                  src="/images/moci-seal.png" 
                  alt="Ministry of Commerce &amp; Industry Seal" 
                  className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                />
              </a>
            </Link>
            <h1 className="text-white text-2xl font-bold mb-1">Welcome Back</h1>
            <p className="text-primary-300 text-sm">SBA MSMEs Online Database and Reporting Portal</p>
            <p className="text-primary-400 text-xs mt-1">Bureau of Small Business Administration</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
            {/* Quick Demo Access Card */}
            <div className="lg:col-span-7 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 shadow-2xl flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-2 h-2 rounded-full bg-accent-500 animate-pulse" />
                  <h3 className="text-white text-base font-bold">Quick Demo Access</h3>
                </div>
                <p className="text-primary-200 text-xs mb-6">
                  Select a pre-configured role below to log in instantly and experience its tailored dashboard layout, permissions, and county filters.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {demoUsers.map((u) => {
                    const isClicked = quickLoginEmail === u.email;
                    return (
                      <button
                        key={u.email}
                        type="button"
                        disabled={isSubmitting || !!quickLoginEmail}
                        onClick={() => handleQuickLogin(u.email)}
                        className={`flex flex-col items-start p-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 active:bg-white/15 transition-all text-left shadow-sm group relative overflow-hidden ${quickLoginEmail && !isClicked ? 'opacity-50' : ''}`}
                      >
                        {/* Glow effect on hover */}
                        <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/5 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                        
                        <div className="flex items-center justify-between w-full mb-1">
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${u.color}`}>
                            {u.role}
                          </span>
                          {isClicked && <Loader2 size={12} className="animate-spin text-white" />}
                        </div>
                        <span className="text-[10px] text-primary-300 font-mono truncate w-full">
                          {u.email}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between text-xs text-primary-300">
                <span>Default Password: <span className="font-mono text-white font-semibold">ChangeMe123!</span></span>
                <span className="bg-white/10 px-2 py-0.5 rounded border border-white/5 text-[10px]">DEMO ENVIRONMENT</span>
              </div>
            </div>

            {/* Login Card */}
            <div className="lg:col-span-5 bg-white rounded-2xl shadow-modal p-8 flex flex-col justify-center">
              <h2 className="text-foreground text-lg font-semibold mb-6">Sign In to Your Account</h2>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2 text-sm text-red-700">
                  <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <label className="form-label" htmlFor="email">Email Address</label>
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="your.name@sba.gov.lr"
                    className={`form-input ${errors.email ? 'border-red-400 focus:ring-red-500' : ''}`}
                    {...register('email')}
                  />
                  {errors.email && <p className="form-error"><AlertCircle size={12} />{errors.email.message}</p>}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="form-label mb-0" htmlFor="password">Password</label>
                    <Link href="/forgot-password">
                      <a className="text-xs text-primary-600 hover:text-primary-800 transition-colors">Forgot password?</a>
                    </Link>
                  </div>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      placeholder="Enter your password"
                      className={`form-input pr-10 ${errors.password ? 'border-red-400' : ''}`}
                      {...register('password')}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {errors.password && <p className="form-error"><AlertCircle size={12} />{errors.password.message}</p>}
                </div>

                <button
                  id="login-submit"
                  type="submit"
                  disabled={isSubmitting || !!quickLoginEmail}
                  className="btn-primary w-full py-2.5 mt-2"
                >
                  {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <LogIn size={16} />}
                  {isSubmitting ? 'Signing In...' : 'Sign In'}
                </button>
              </form>
            </div>
          </div>

          <p className="text-center text-primary-400 text-xs mt-8">
            © {new Date().getFullYear()} Bureau of Small Business Administration — Republic of Liberia
          </p>
        </div>
      </div>
    </div>
  );
}
