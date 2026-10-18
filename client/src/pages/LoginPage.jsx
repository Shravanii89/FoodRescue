import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  HeartHandshake,
  Lock,
  Mail,
  ArrowRight,
  AlertCircle,
  Building2,
  ShieldCheck,
  Sparkles,
  Eye,
  EyeOff
} from 'lucide-react';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login, quickDemoLogin } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isExpired = searchParams.get('expired') === 'true';

  const redirectUser = (role) => {
    if (role === 'admin') navigate('/admin/dashboard');
    else if (role === 'donor') navigate('/donor/dashboard');
    else navigate('/recipient/dashboard');
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password) {
      setError('Please provide both your registered email and password.');
      return;
    }

    setLoading(true);
    try {
      const user = await login(email.trim(), password);
      redirectUser(user.role);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Login failed. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoSelect = async (role) => {
    setError('');
    setLoading(true);
    try {
      const user = await quickDemoLogin(role);
      redirectUser(user.role);
    } catch (err) {
      setError(err.message || 'Demo persona authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-8">
      <div className="text-center mb-6">
        <div className="w-12 h-12 rounded-2xl bg-forest mx-auto flex items-center justify-center text-white shadow-md shadow-forest/20 mb-3">
          <HeartHandshake className="w-7 h-7 text-emerald-300" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Sign In to FoodRescue</h1>
        <p className="text-xs text-slate-500 mt-1">Access your role-specific dashboard or use a demonstration profile</p>
      </div>

      {isExpired && (
        <div className="mb-4 p-3.5 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-800 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>Your session has expired. Please sign in again to continue.</span>
        </div>
      )}

      {error && (
        <div className="mb-4 p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Demo Account Quick-Selection Cards for Viva / Testing */}
      <div className="mb-6 p-4 rounded-3xl bg-forest/5 border border-forest/20">
        <div className="flex items-center gap-1.5 text-xs font-bold text-forest mb-2.5">
          <Sparkles className="w-3.5 h-3.5 text-teal-600" />
          <span>1-Click Demo Profiles (Presentation & Evaluation)</span>
        </div>
        <div className="grid grid-cols-2 gap-2 text-left">
          <button
            type="button"
            onClick={() => handleDemoSelect('donor')}
            disabled={loading}
            className="p-2.5 rounded-2xl bg-white hover:bg-forest/5 border border-slate-200 shadow-2xs text-xs transition-all hover:border-forest/40"
          >
            <p className="font-bold text-slate-800 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-forest" />
              Donor / Hotel
            </p>
            <p className="text-[10px] text-slate-500 mt-0.5 truncate">The Grand Orchid Suites</p>
          </button>

          <button
            type="button"
            onClick={() => handleDemoSelect('recipient')}
            disabled={loading}
            className="p-2.5 rounded-2xl bg-white hover:bg-forest/5 border border-slate-200 shadow-2xs text-xs transition-all hover:border-forest/40"
          >
            <p className="font-bold text-slate-800 flex items-center gap-1.5">
              <HeartHandshake className="w-3.5 h-3.5 text-forest" />
              NGO / Shelter
            </p>
            <p className="text-[10px] text-slate-500 mt-0.5 truncate">Hope Community Kitchen</p>
          </button>

          <button
            type="button"
            onClick={() => handleDemoSelect('admin')}
            disabled={loading}
            className="p-2.5 rounded-2xl bg-white hover:bg-forest/5 border border-slate-200 shadow-2xs text-xs transition-all hover:border-forest/40"
          >
            <p className="font-bold text-slate-800 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-forest" />
              Platform Admin
            </p>
            <p className="text-[10px] text-slate-500 mt-0.5 truncate">System Verifications</p>
          </button>

          <button
            type="button"
            onClick={() => handleDemoSelect('pending_ngo')}
            disabled={loading}
            className="p-2.5 rounded-2xl bg-white hover:bg-amber-50 border border-amber-200 shadow-2xs text-xs transition-all hover:border-amber-400"
          >
            <p className="font-bold text-slate-800 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              Pending NGO
            </p>
            <p className="text-[10px] text-amber-700 mt-0.5 truncate">Test Verification Queue</p>
          </button>
        </div>
      </div>

      {/* Manual Login Form */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-card">
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Email Address <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@organization.org"
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Password <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 transition-colors"
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 rounded-xl bg-forest hover:bg-forest-light text-white font-bold text-xs shadow-md shadow-forest/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <span>Sign In to Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-slate-100 text-center">
          <p className="text-xs text-slate-500">
            Don't have an account yet?{' '}
            <Link to="/register" className="font-bold text-forest hover:text-forest-light">
              Register here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
