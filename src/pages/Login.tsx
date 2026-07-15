import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { authStart, authSuccess, authFailure } from '../store/authSlice';
import { RootState } from '../store';
import axiosInstance from '../api/axiosInstance';
import { useToast } from '../context/ToastContext';
import { Mail, Lock, Loader2, ArrowRight } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { showToast } = useToast();
  const { loading, error } = useSelector((state: RootState) => state.auth);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [activeTab, setActiveTab] = useState<'SUPER_ADMIN' | 'ORG_ADMIN' | 'USER'>('USER');

  const from = location.state?.from?.pathname || '/dashboard';

  const handleRoleTabChange = (role: 'SUPER_ADMIN' | 'ORG_ADMIN' | 'USER') => {
    setActiveTab(role);
    if (role === 'SUPER_ADMIN') {
      setEmail('superadmin@platform.com');
      setPassword('Password123!');
    } else if (role === 'ORG_ADMIN') {
      setEmail('admin@platform.com');
      setPassword('Password123!');
    } else {
      setEmail('');
      setPassword('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      showToast('Please enter both email and password', 'error');
      return;
    }

    dispatch(authStart());

    try {
      const response = await axiosInstance.post('/auth/login', {
        email,
        password,
      });

      const { user, accessToken, refreshToken } = response.data.data;
      dispatch(authSuccess({ user, accessToken, refreshToken }));
      
      showToast(`Welcome back, ${user.firstName}!`, 'success');
      navigate(from, { replace: true });
    } catch (err: any) {
      const errorMsg = err.response?.data?.error?.message || 'Login failed. Check your credentials.';
      dispatch(authFailure(errorMsg));
      showToast(errorMsg, 'error');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 px-4 transition-colors ">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-3xl p-8 shadow-xl">
        
        {/* LOGO TITLE */}
        <div className="text-center mb-8">
          <div className="inline-flex w-12 h-12 rounded-2xl bg-indigo-600 items-center justify-center text-white font-bold text-xl shadow-lg shadow-indigo-500/20 mb-4">
            Æ
          </div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Welcome Back</h2>
          <p className="text-slate-400 dark:text-slate-500 text-sm mt-1">Sign in to manage your events and tickets</p>
        </div>

        {/* ROLE TABS */}
        <div className="flex border border-slate-100 dark:border-slate-800/80 mb-6 bg-slate-50 dark:bg-slate-950/40 p-1 rounded-2xl">
          <button
            type="button"
            onClick={() => handleRoleTabChange('SUPER_ADMIN')}
            className={`flex-1 text-center py-2 rounded-xl text-xs font-bold transition-all duration-150 cursor-pointer ${
              activeTab === 'SUPER_ADMIN'
                ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            Super Admin
          </button>
          <button
            type="button"
            onClick={() => handleRoleTabChange('ORG_ADMIN')}
            className={`flex-1 text-center py-2 rounded-xl text-xs font-bold transition-all duration-150 cursor-pointer ${
              activeTab === 'ORG_ADMIN'
                ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            Org Admin
          </button>
          <button
            type="button"
            onClick={() => handleRoleTabChange('USER')}
            className={`flex-1 text-center py-2 rounded-xl text-xs font-bold transition-all duration-150 cursor-pointer ${
              activeTab === 'USER'
                ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            User
          </button>
        </div>

        {/* ERROR MESSAGE */}
        {error && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-100 rounded-2xl text-rose-800 dark:bg-rose-950/20 dark:border-rose-900/40 dark:text-rose-400 text-sm">
            {error}
          </div>
        )}

        {/* LOGIN FORM */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-4 top-3.5 h-5 w-5 text-slate-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-2xl pl-12 pr-4 py-3.5 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Password</label>
              <Link to="/forgot-password" className="text-xs text-indigo-500 hover:underline">Forgot password?</Link>
            </div>
            <div className="relative">
              <Lock className="absolute left-4 top-3.5 h-5 w-5 text-slate-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-2xl pl-12 pr-4 py-3.5 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl py-4 font-semibold text-sm transition-all duration-150 flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <span>Sign In</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* REGISTRATION REDIRECT */}
        <div className="mt-8 text-center border-t border-slate-100 dark:border-slate-800 pt-6">
          <p className="text-sm text-slate-400">
            Don't have an account?{' '}
            <Link to="/register" className="text-indigo-500 font-semibold hover:underline">
              Create an account
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
}
