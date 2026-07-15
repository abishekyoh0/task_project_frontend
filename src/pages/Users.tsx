import React, { useEffect, useState } from 'react';
import axiosInstance from '../api/axiosInstance';
import { useToast } from '../context/ToastContext';
import {
  Users as UsersIcon,
  Plus,
  Loader2,
  Upload,
  UserX,
  UserCheck,
  Mail,
  X,
  FileSpreadsheet
} from 'lucide-react';

interface MemberData {
  id: string;
  role: string;
  joinedAt: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    isActive: boolean;
  };
}

export default function Users() {
  const { showToast } = useToast();

  const [members, setMembers] = useState<MemberData[]>([]);
  const [loading, setLoading] = useState(true);

  // Invite modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteMode, setInviteMode] = useState<'single' | 'bulk'>('single');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('USER');
  const [csvFile, setCsvFile] = useState<File | null>(null);

  const fetchMembers = () => {
    setLoading(true);
    axiosInstance
      .get('/organizations/my/members')
      .then((res: any) => {
        setMembers(res.data.data);
      })
      .catch(() => {
        showToast('Failed to load organization members', 'error');
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  const handleToggleActive = async (memberUserId: string, currentStatus: boolean) => {
    try {
      await axiosInstance.patch(`/organizations/my/members/${memberUserId}/status`, {
        isActive: !currentStatus,
      });
      showToast(`User account status updated successfully!`, 'success');
      fetchMembers();
    } catch (err: any) {
      showToast(err.response?.data?.error?.message || 'Failed to update status', 'error');
    }
  };

  const handleSingleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setInviteLoading(true);

    try {
      await axiosInstance.post('/organizations/my/invite', { email, role });
      showToast(`Invitation sent to ${email}!`, 'success');
      setIsModalOpen(false);
      setEmail('');
      setRole('USER');
      fetchMembers();
    } catch (err: any) {
      showToast(err.response?.data?.error?.message || 'Failed to send invitation', 'error');
    } finally {
      setInviteLoading(false);
    }
  };

  const handleBulkInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!csvFile) return;
    setInviteLoading(true);

    try {
      const uploadForm = new FormData();
      uploadForm.append('file', csvFile);

      const res = await axiosInstance.post('/upload/invite-csv', uploadForm, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const { successfulInvitations, failedInvitations } = res.data.data;
      showToast(
        `CSV process completed. Sent ${successfulInvitations} invitations, ${failedInvitations} failed.`,
        'info'
      );
      setIsModalOpen(false);
      setCsvFile(null);
      fetchMembers();
    } catch (err: any) {
      showToast(err.response?.data?.error?.message || 'CSV process failed', 'error');
    } finally {
      setInviteLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setCsvFile(e.target.files[0]);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-800 dark:text-white my-0">Users Directory</h1>
          <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">Manage organization members, invitation setups, and status logs.</p>
        </div>
        <button
          onClick={() => {
            setInviteMode('single');
            setIsModalOpen(true);
          }}
          className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-3 rounded-2xl text-sm font-semibold transition shadow-md shadow-indigo-500/20 w-fit"
        >
          <Plus className="w-4 h-4" />
          <span>Invite Member</span>
        </button>
      </div>

      {loading ? (
        <div className="h-[40vh] flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        </div>
      ) : members.length === 0 ? (
        <div className="py-20 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl">
          <UsersIcon className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="font-semibold text-slate-700 dark:text-slate-300">No members found</h3>
          <p className="text-sm text-slate-400 mt-1">Invite colleagues to help manage your platform.</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-450 font-medium bg-slate-50 dark:bg-slate-950/20">
                  <th className="py-3 px-4">Member Name</th>
                  <th className="py-3 px-4">Email Address</th>
                  <th className="py-3 px-4">Role Binding</th>
                  <th className="py-3 px-4">Account Status</th>
                  <th className="py-3 px-4 text-center">Status Action</th>
                </tr>
              </thead>
              <tbody>
                {members.map((member) => (
                  <tr key={member.id} className="border-b border-slate-50 dark:border-slate-800/40 last:border-0 hover:bg-slate-50/50 dark:hover:bg-slate-800/10 transition">
                    <td className="py-4 px-4 font-semibold text-slate-800 dark:text-slate-100">
                      {member.user.firstName} {member.user.lastName}
                    </td>
                    <td className="py-4 px-4 text-slate-500 dark:text-slate-400 font-medium">{member.user.email}</td>
                    <td className="py-4 px-4">
                      <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider bg-indigo-50 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-400 border border-indigo-150/40 dark:border-indigo-900/40">
                        {member.role}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider ${
                        member.user.isActive
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400'
                          : 'bg-rose-50 text-rose-700 dark:bg-rose-950/20 dark:text-rose-450'
                      }`}>
                        {member.user.isActive ? 'Active' : 'Disabled'}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <button
                        onClick={() => handleToggleActive(member.user.id, member.user.isActive)}
                        className={`text-xs font-semibold flex items-center justify-center space-x-1 border px-3 py-1.5 rounded-xl mx-auto transition ${
                          member.user.isActive
                            ? 'border-rose-100 text-rose-500 hover:bg-rose-50/50 dark:border-rose-950/20 dark:hover:bg-rose-950/10'
                            : 'border-emerald-100 text-emerald-600 hover:bg-emerald-50/50 dark:border-emerald-950/20 dark:hover:bg-emerald-950/10'
                        }`}
                      >
                        {member.user.isActive ? (
                          <>
                            <UserX className="w-3.5 h-3.5" />
                            <span>Disable</span>
                          </>
                        ) : (
                          <>
                            <UserCheck className="w-3.5 h-3.5" />
                            <span>Activate</span>
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* INVITATION MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md shadow-2xl p-6 relative animate-in zoom-in-95 duration-150">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-650"
            >
              <X className="w-5 h-5" />
            </button>
            
            <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-6">Invite Organization Colleague</h2>

            {/* TAB SELECTOR */}
            <div className="flex border-b border-slate-100 dark:border-slate-800 mb-6 text-sm">
              <button
                onClick={() => setInviteMode('single')}
                className={`flex-1 pb-3 font-semibold border-b-2 transition ${
                  inviteMode === 'single' ? 'border-indigo-650 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-slate-400'
                }`}
              >
                Single Invite
              </button>
              <button
                onClick={() => setInviteMode('bulk')}
                className={`flex-1 pb-3 font-semibold border-b-2 transition ${
                  inviteMode === 'bulk' ? 'border-indigo-650 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-slate-400'
                }`}
              >
                Bulk CSV Upload
              </button>
            </div>

            {inviteMode === 'single' ? (
              <form onSubmit={handleSingleInvite} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-slate-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="colleague@yourcompany.com"
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-2xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Authorized Role</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-2xl px-4 py-3 text-sm focus:outline-none text-slate-600 dark:text-slate-350 cursor-pointer"
                  >
                    <option value="USER">User (Attendee)</option>
                    <option value="MANAGER">Manager (Coordinator)</option>
                    <option value="ORG_ADMIN">Organization Admin</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={inviteLoading}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl py-3.5 font-semibold text-sm transition flex items-center justify-center space-x-2 disabled:opacity-50 mt-2"
                >
                  {inviteLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <span>Send Invitation</span>
                  )}
                </button>
              </form>
            ) : (
              <form onSubmit={handleBulkInvite} className="space-y-6">
                
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">CSV Invitations File</label>
                  <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50 dark:bg-slate-950 relative min-h-32">
                    {csvFile ? (
                      <div className="flex flex-col items-center justify-center space-y-2 text-slate-700 dark:text-slate-300">
                        <FileSpreadsheet className="w-10 h-10 text-indigo-500" />
                        <span className="text-xs font-medium truncate max-w-[15rem]">{csvFile.name}</span>
                        <button
                          type="button"
                          onClick={() => setCsvFile(null)}
                          className="text-[10px] text-rose-500 hover:underline"
                        >
                          Remove file
                        </button>
                      </div>
                    ) : (
                      <label className="cursor-pointer flex flex-col items-center justify-center space-y-2 text-slate-400 hover:text-indigo-500 transition w-full h-full">
                        <Upload className="w-8 h-8" />
                        <span className="text-xs font-medium text-center">Click to select CSV (must contain columns: email, role)</span>
                        <input type="file" onChange={handleFileChange} accept=".csv" className="hidden" required />
                      </label>
                    )}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={inviteLoading || !csvFile}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl py-3.5 font-semibold text-sm transition flex items-center justify-center space-x-2 disabled:opacity-50"
                >
                  {inviteLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <span>Process Bulk Upload</span>
                  )}
                </button>
              </form>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
