import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';
import { useToast } from '../context/ToastContext';
import { Lock, ArrowLeft, Loader2 } from 'lucide-react';

export default function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { showToast } = useToast();

  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const tokenParam = searchParams.get('token');
    if (tokenParam) {
      setToken(tokenParam);
    } else {
      showToast('No password reset token was found in the URL.', 'error');
    }
  }, [searchParams, showToast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      showToast('Reset token is missing or invalid', 'error');
      return;
    }
    if (!newPassword || newPassword.length < 8) {
      showToast('Password must be at least 8 characters long', 'error');
      return;
    }

    setLoading(true);

    try {
      await axiosInstance.post('/auth/reset-password', {
        token,
        newPassword,
      });

      showToast('Password successfully reset! Please login.', 'success');
      navigate('/login');
    } catch (err: any) {
      const errorMsg = err.response?.data?.error?.message || 'Password reset failed.';
      showToast(errorMsg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 px-4 transition-colors">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-3xl p-8 shadow-xl">
        
        {/* HEADER */}
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Reset Password</h2>
          <p className="text-slate-400 dark:text-slate-500 text-sm mt-2 font-medium">
            Enter a strong new password for your account
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">New Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-3.5 h-5 w-5 text-slate-400" />
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-2xl pl-12 pr-4 py-3.5 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !token}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl py-4 font-semibold text-sm transition-all duration-150 flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <span>Reset Password</span>
            )}
          </button>

          <div className="text-center pt-2">
            <Link
              to="/login"
              className="inline-flex items-center space-x-2 text-sm text-indigo-500 font-semibold hover:underline"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Login</span>
            </Link>
          </div>
        </form>

      </div>
    </div>
  );
}
