import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';
import { useToast } from '../context/ToastContext';
import { Mail, Lock, User, Building, Loader2, ArrowRight } from 'lucide-react';

export default function Register() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [createOrg, setCreateOrg] = useState(false);
  const [organizationName, setOrganizationName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName || !lastName || !email || !password) {
      showToast('Please fill out all required fields', 'error');
      return;
    }

    if (createOrg && !organizationName) {
      showToast('Please specify your organization name', 'error');
      return;
    }

    setLoading(true);

    try {
      await axiosInstance.post('/auth/register', {
        firstName,
        lastName,
        email,
        password,
        organizationName: createOrg ? organizationName : undefined,
      });

      showToast('Account registered successfully! Please sign in.', 'success');
      navigate('/login');
    } catch (err: any) {
      const errorMsg = err.response?.data?.error?.message || 'Registration failed. Try again.';
      showToast(errorMsg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 px-4 transition-colors">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-3xl p-8 shadow-xl">
        
        {/* HEADER */}
        <div className="text-center mb-8">
          <div className="inline-flex w-12 h-12 rounded-2xl bg-indigo-600 items-center justify-center text-white font-bold text-xl shadow-lg shadow-indigo-500/20 mb-4">
            Æ
          </div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Create Account</h2>
          <p className="text-slate-400 dark:text-slate-500 text-sm mt-1">Get started booking or organizing events</p>
        </div>

        {/* REGISTER FORM */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">First Name</label>
              <div className="relative">
                <User className="absolute left-3 top-3.5 h-4.5 w-4.5 text-slate-400" />
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="John"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-2xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                  required
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Last Name</label>
              <div className="relative">
                <User className="absolute left-3 top-3.5 h-4.5 w-4.5 text-slate-400" />
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Doe"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-2xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                  required
                />
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-slate-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-2xl pl-11 pr-4 py-3.5 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-slate-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min. 8 characters"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-2xl pl-11 pr-4 py-3.5 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                required
              />
            </div>
          </div>

          {/* ORGANIZATIONAL TOGGLE */}
          <div className="py-2">
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={createOrg}
                onChange={(e) => setCreateOrg(e.target.checked)}
                className="rounded text-indigo-600 focus:ring-indigo-500 border-slate-350 dark:border-slate-700 w-4.5 h-4.5 bg-slate-50 dark:bg-slate-950"
              />
              <span className="text-sm font-medium text-slate-600 dark:text-slate-300 select-none">
                Register as an Event Organizer / Create Organization
              </span>
            </label>
          </div>

          {createOrg && (
            <div className="space-y-1 p-5 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 animate-in fade-in slide-in-from-top-2 duration-150">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Organization Name</label>
              <div className="relative">
                <Building className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-slate-400" />
                <input
                  type="text"
                  value={organizationName}
                  onChange={(e) => setOrganizationName(e.target.value)}
                  placeholder="e.g. Acme Event Management"
                  className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-2xl pl-11 pr-4 py-3.5 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                  required={createOrg}
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl py-4 font-semibold text-sm transition-all duration-150 flex items-center justify-center space-x-2 disabled:opacity-50 mt-2"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <span>Sign Up</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* REDIRECT */}
        <div className="mt-8 text-center border-t border-slate-100 dark:border-slate-800 pt-6">
          <p className="text-sm text-slate-400">
            Already have an account?{' '}
            <Link to="/login" className="text-indigo-500 font-semibold hover:underline">
              Sign in instead
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
}
