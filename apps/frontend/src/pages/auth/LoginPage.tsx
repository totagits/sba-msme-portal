import { useState } from 'react';
import { Link } from 'wouter';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, LogIn, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../../lib/auth';

const schema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginForm = z.infer<typeof schema>;

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginForm>({
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-900 via-primary-800 to-primary-700 flex flex-col">
      {/* Top government bar */}
      <div className="bg-primary-950 text-primary-300 text-xs py-2 px-6 flex items-center justify-between">
        <span>Republic of Liberia — Official Government Portal</span>
        <span>Ministry of Commerce and Industry</span>
      </div>

      {/* Main content */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          {/* Logo / Seal area */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 mb-4 shadow-lg">
              <div className="text-center">
                <div className="text-accent-400 font-black text-lg leading-tight">SBA</div>
                <div className="text-white/60 text-xs">PORTAL</div>
              </div>
            </div>
            <h1 className="text-white text-2xl font-bold mb-1">Welcome Back</h1>
            <p className="text-primary-300 text-sm">SBA MSMEs Online Database and Reporting Portal</p>
            <p className="text-primary-400 text-xs mt-1">Bureau of Small Business Administration</p>
          </div>

          {/* Login card */}
          <div className="bg-white rounded-2xl shadow-modal p-8">
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
                disabled={isSubmitting}
                className="btn-primary w-full py-2.5 mt-2"
              >
                {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <LogIn size={16} />}
                {isSubmitting ? 'Signing In...' : 'Sign In'}
              </button>
            </form>

            {/* Default credentials hint (dev only) */}
            <div className="mt-6 pt-4 border-t border-border">
              <p className="text-xs text-muted-foreground text-center mb-2">Default test credentials:</p>
              <div className="grid grid-cols-2 gap-1 text-xs text-muted-foreground">
                <span className="text-foreground font-medium">Super Admin:</span>
                <span>admin@sba.gov.lr</span>
                <span className="text-foreground font-medium">Data Officer:</span>
                <span>data.officer@sba.gov.lr</span>
                <span className="col-span-2 text-center mt-1">Password: <span className="font-mono font-medium">ChangeMe123!</span></span>
              </div>
            </div>
          </div>

          <p className="text-center text-primary-400 text-xs mt-6">
            © {new Date().getFullYear()} Bureau of Small Business Administration — Republic of Liberia
          </p>
        </div>
      </div>
    </div>
  );
}
