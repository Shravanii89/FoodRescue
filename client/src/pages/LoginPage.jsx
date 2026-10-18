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
  Sparkles
} from 'lucide-react';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login, quickDemoLogin } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isExpired = searchParams.get('expired') === 'true';

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const user = await login(email, password);
      redirectUser(user.role);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const redirectUser = (role) => {
    if (role === 'admin') navigate('/admin/dashboard');
    else if (role === 'donor') navigate('/donor/dashboard');
    else navigate('/recipient/dashboard');
  };

  const handleDemoSelect = async (role) => {
    setError('');
    setLoading(true);
    try {
      const user = await quickDemoLogin(role);
      redirectUser(user.role);
    } catch (err) {
      setError(err.message || 'Demo login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-8">
      <div className="text-center mb-8">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-700 to-emerald-500 mx-auto flex items-center justify-center text-white shadow-md shadow-brand-500/20 mb-3">
          <HeartHandshake className="w-7 h-7" />
        </div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Welcome Back</h1>
        <p className="text-xs text-slate-500 mt-1">Sign in to your FoodRescue account or choose a demo persona below</p>
      </div>

      {isExpired && (
        <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>Your session has expired. Please sign in again.</span>
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Demo Account Quick-Selection Cards */}
      <div className="mb-6 p-4 rounded-2xl bg-brand-50/70 border border-brand-200/80">
        <div className="flex items-center gap-1.5 text-xs font-bold text-brand-900 mb-2">
          <Sparkles className="w-3.5 h-3.5 text-brand-600" />
          <span>1-Click Demo Profiles (For College Viva / Evaluation)</span>
        </div>
        <div className="grid grid-cols-2 gap-2 text-left">
          <button
            type="button"
            onClick={() => handleDemoSelect('donor')}
            disabled={loading}
            className="p-2.5 rounded-xl bg-white hover:bg-emerald-50 border border-brand-200/60 shadow-xs text-xs transition-all hover:scale-[1.02]"
          >
            <p className="font-bold text-slate-800 flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5 text-brand-600" />
              Donor / Hotel
            </p>
            <p className="text-[10px] text-slate-500 mt-0.5">Grand Orchid Banquet</p>
          </button>

          <button
            type="button"
            onClick={() => handleDemoSelect('recipient')}
            disabled={loading}
            className="p-2.5 rounded-xl bg-white hover:bg-emerald-50 border border-brand-200/60 shadow-xs text-xs transition-all hover:scale-[1.02]"
          >
            <p className="font-bold text-slate-800 flex items-center gap-1">
              <HeartHandshake className="w-3.5 h-3.5 text-brand-600" />
              NGO / Shelter
            </p>
            <p className="text-[10px] text-slate-500 mt-0.5">Hope Community Kitchen</p>
          </button>

          <button
            type="button"
            onClick={() => handleDemoSelect('admin')}
            disabled={loading}
            className="p-2.5 rounded-xl bg-white hover:bg-emerald-50 border border-brand-200/60 shadow-xs text-xs transition-all hover:scale-[1.02]"
          >
            <p className="font-bold text-slate-800 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-brand-700" />
              Admin
            </p>
            <p className="text-[10px] text-slate-500 mt-0.5">Full System Controller</p>
          </button>

          <button
            type="button"
            onClick={() => handleDemoSelect('pending_ngo')}
            disabled={loading}
            className="p-2.5 rounded-xl bg-white hover:bg-amber-50 border border-amber-200/60 shadow-xs text-xs transition-all hover:scale-[1.02]"
          >
            <p className="font-bold text-slate-800 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              Pending NGO
            </p>
            <p className="text-[10px] text-amber-700 mt-0.5">Test Admin Verification</p>
          </button>
        </div>
      </div>

      {/* Manual Email/Password Form */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-card">
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@organization.org"
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-hidden transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-hidden transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md shadow-brand-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
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
            <Link to="/register" className="font-bold text-brand-600 hover:text-brand-700">
              Register here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
