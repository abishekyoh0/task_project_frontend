import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store';
import { updateProfileSuccess, updateOrganizationSuccess } from '../store/authSlice';
import axiosInstance from '../api/axiosInstance';
import { useToast } from '../context/ToastContext';
import {
  User,
  Building,
  Lock,
  Loader2,
  CheckCircle
} from 'lucide-react';

export default function Settings() {
  const dispatch = useDispatch();
  const { showToast } = useToast();
  const { user } = useSelector((state: RootState) => state.auth);

  // Profile forms state
  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [profileLoading, setProfileLoading] = useState(false);

  // Organization settings state
  const [orgName, setOrgName] = useState('');
  const [orgLoading, setOrgLoading] = useState(false);

  // Password change state
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  useEffect(() => {
    if (user?.organizationId) {
      axiosInstance.get('/organizations/my').then((res: any) => {
        setOrgName(res.data.data.name);
      }).catch(() => {});
    }
  }, [user]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileLoading(true);

    try {
      await axiosInstance.patch('/users/profile', { firstName, lastName });
      dispatch(updateProfileSuccess({ firstName, lastName }));
      showToast('Profile updated successfully!', 'success');
    } catch (err: any) {
      showToast(err.response?.data?.error?.message || 'Profile update failed', 'error');
    } finally {
      setProfileLoading(false);
    }
  };

  const handleUpdateOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgName) return;
    setOrgLoading(true);

    try {
      await axiosInstance.patch('/organizations/my', { name: orgName });
      showToast('Organization settings updated successfully!', 'success');
    } catch (err: any) {
      showToast(err.response?.data?.error?.message || 'Organization update failed', 'error');
    } finally {
      setOrgLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      showToast('New passwords do not match', 'error');
      return;
    }
    if (newPassword.length < 8) {
      showToast('Password must be at least 8 characters long', 'error');
      return;
    }

    setPasswordLoading(true);

    try {
      await axiosInstance.post('/users/change-password', {
        oldPassword,
        newPassword,
      });

      showToast('Password updated successfully!', 'success');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      showToast(err.response?.data?.error?.message || 'Password update failed', 'error');
    } finally {
      setPasswordLoading(false);
    }
  };

  const isOrgAdmin = user?.role === 'ORG_ADMIN';

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      
      {/* HEADER SECTION */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-800 dark:text-white my-0">Workspace Settings</h1>
        <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">Configure profile preferences, password security, and tenant configurations.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* PROFILE SETTINGS CARD */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-6">
          <div className="flex items-center space-x-3 pb-4 border-b border-slate-100 dark:border-slate-800">
            <User className="w-5 h-5 text-indigo-500" />
            <h3 className="font-bold text-slate-800 dark:text-white my-0">Personal Profile</h3>
          </div>

          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">First Name</label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Last Name</label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Email Address (Read-only)</label>
              <input
                type="email"
                value={user?.email || ''}
                className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-2xl px-4 py-3 text-sm text-slate-400 dark:text-slate-500 cursor-not-allowed"
                disabled
              />
            </div>

            <button
              type="submit"
              disabled={profileLoading}
              className="w-full bg-indigo-650 hover:bg-indigo-700 text-white rounded-2xl py-3.5 font-semibold text-xs transition flex items-center justify-center space-x-2 disabled:opacity-50 mt-4"
            >
              {profileLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Update Profile</span>}
            </button>
          </form>
        </div>

        {/* ORG SETTINGS CARD (Visible to Org Admins) */}
        {isOrgAdmin && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-6">
            <div className="flex items-center space-x-3 pb-4 border-b border-slate-100 dark:border-slate-800">
              <Building className="w-5 h-5 text-indigo-500" />
              <h3 className="font-bold text-slate-800 dark:text-white my-0">Organization Settings</h3>
            </div>

            <form onSubmit={handleUpdateOrg} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Organization Name</label>
                <input
                  type="text"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={orgLoading}
                className="w-full bg-indigo-650 hover:bg-indigo-700 text-white rounded-2xl py-3.5 font-semibold text-xs transition flex items-center justify-center space-x-2 disabled:opacity-50 mt-4"
              >
                {orgLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Update Organization Settings</span>}
              </button>
            </form>
          </div>
        )}

        {/* SECURITY SETTINGS CARD */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-6">
          <div className="flex items-center space-x-3 pb-4 border-b border-slate-100 dark:border-slate-800">
            <Lock className="w-5 h-5 text-indigo-500" />
            <h3 className="font-bold text-slate-800 dark:text-white my-0">Security & Credentials</h3>
          </div>

          <form onSubmit={handleChangePassword} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Current Password</label>
              <input
                type="password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min. 8 chars"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Confirm Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Min. 8 chars"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={passwordLoading}
              className="w-full bg-indigo-650 hover:bg-indigo-700 text-white rounded-2xl py-3.5 font-semibold text-xs transition flex items-center justify-center space-x-2 disabled:opacity-50 mt-4"
            >
              {passwordLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Update Password</span>}
            </button>
          </form>
        </div>

      </div>

    </div>
  );
}
