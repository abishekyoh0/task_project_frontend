import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';
import { useToast } from '../context/ToastContext';
import { Mail, ArrowLeft, Loader2 } from 'lucide-react';

export default function ForgotPassword() {
  const { showToast } = useToast();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      showToast('Please enter your email', 'error');
      return;
    }

    setLoading(true);

    try {
      await axiosInstance.post('/auth/forgot-password', { email });
      setSubmitted(true);
      showToast('If the email matches an account, a reset link has been printed to the console logger.', 'info');
    } catch (err: any) {
      const errorMsg = err.response?.data?.error?.message || 'Password reset request failed.';
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
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Recover Password</h2>
          <p className="text-slate-400 dark:text-slate-500 text-sm mt-2">
            Enter your account email to receive a password reset token
          </p>
        </div>

        {submitted ? (
          <div className="space-y-6 text-center">
            <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-2xl text-indigo-900 dark:bg-indigo-950/20 dark:border-indigo-900/40 dark:text-indigo-400 text-sm leading-relaxed">
              Password recovery link generated! Since this is a local development mock, the reset link has been printed to the <strong>backend console terminal logs</strong>.
            </div>
            <Link
              to="/login"
              className="inline-flex items-center space-x-2 text-sm text-indigo-500 font-semibold hover:underline"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Login</span>
            </Link>
          </div>
        ) : (
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

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl py-4 font-semibold text-sm transition-all duration-150 flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <span>Request Reset Token</span>
              )}
            </button>

            <div className="text-center pt-2">
              <Link
                to="/login"
                className="inline-flex items-center space-x-2 text-sm text-indigo-500 font-semibold hover:underline"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Cancel</span>
              </Link>
            </div>
          </form>
        )}

      </div>
    </div>
  );
}
