import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import axiosInstance from '../api/axiosInstance';
import { useToast } from '../context/ToastContext';
import {
  Ticket,
  Search,
  CheckCircle,
  Loader2,
  AlertTriangle,
  QrCode,
  Calendar,
  X,
  UserCheck
} from 'lucide-react';

interface RegistrationData {
  id: string;
  ticketCode: string;
  status: string;
  checkedIn: boolean;
  checkedInAt: string | null;
  createdAt: string;
  event: {
    id: string;
    title: string;
    startDate: string;
    venue: string;
    price: string;
  };
  user?: {
    firstName: string;
    lastName: string;
    email: string;
  };
}

export default function Registrations() {
  const { user } = useSelector((state: RootState) => state.auth);
  const { showToast } = useToast();

  const [registrations, setRegistrations] = useState<RegistrationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'my' | 'admin'>('my');

  // QR Code details modal state
  const [selectedReg, setSelectedReg] = useState<RegistrationData | null>(null);

  // Admin scanning search state
  const [searchQuery, setSearchQuery] = useState('');
  const [adminRegs, setAdminRegs] = useState<RegistrationData[]>([]);
  const [adminLoading, setAdminLoading] = useState(false);

  const fetchMyTickets = () => {
    setLoading(true);
    axiosInstance
      .get('/registrations/my')
      .then((res: any) => {
        setRegistrations(res.data.data);
      })
      .catch(() => {
        showToast('Failed to load tickets', 'error');
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const fetchAdminRegistrations = () => {
    setAdminLoading(true);
    axiosInstance
      .get('/registrations', { params: { search: searchQuery || undefined } })
      .then((res: any) => {
        setAdminRegs(res.data.data);
      })
      .catch(() => {
        showToast('Failed to load organization registrations', 'error');
      })
      .finally(() => {
        setAdminLoading(false);
      });
  };

  useEffect(() => {
    if (activeTab === 'my') {
      fetchMyTickets();
    } else if (activeTab === 'admin') {
      fetchAdminRegistrations();
    }
  }, [activeTab, searchQuery]);

  const handleCancelTicket = async (regId: string) => {
    if (!window.confirm('Are you sure you want to cancel this ticket registration? This cannot be undone.')) {
      return;
    }

    try {
      await axiosInstance.post(`/registrations/${regId}/cancel`);
      showToast('Ticket cancelled successfully. Waitlisted members will be promoted.', 'success');
      fetchMyTickets();
    } catch (err: any) {
      showToast(err.response?.data?.error?.message || 'Cancellation failed', 'error');
    }
  };

  const handleCheckIn = async (regId: string) => {
    try {
      await axiosInstance.post(`/registrations/${regId}/checkin`);
      showToast('Attendee checked in successfully!', 'success');
      fetchAdminRegistrations();
    } catch (err: any) {
      showToast(err.response?.data?.error?.message || 'Check-in failed', 'error');
    }
  };

  const isCoordinator = user?.role === 'ORG_ADMIN' || user?.role === 'MANAGER';

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      
      {/* HEADER SECTION */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-800 dark:text-white my-0">Tickets Workspace</h1>
        <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">Manage ticket details, cancellations, and scan check-ins.</p>
      </div>

      {/* TABS SELECTOR */}
      {isCoordinator && (
        <div className="flex border-b border-slate-200 dark:border-slate-800">
          <button
            onClick={() => setActiveTab('my')}
            className={`px-6 py-3.5 text-sm font-semibold border-b-2 transition ${
              activeTab === 'my'
                ? 'border-indigo-650 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
            }`}
          >
            My Tickets
          </button>
          <button
            onClick={() => setActiveTab('admin')}
            className={`px-6 py-3.5 text-sm font-semibold border-b-2 transition ${
              activeTab === 'admin'
                ? 'border-indigo-650 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
            }`}
          >
            Check-In Scanner
          </button>
        </div>
      )}

      {/* USER TICKETS TAB */}
      {activeTab === 'my' && (
        loading ? (
          <div className="h-[40vh] flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          </div>
        ) : registrations.length === 0 ? (
          <div className="py-20 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl">
            <Ticket className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="font-semibold text-slate-700 dark:text-slate-300">No tickets booked</h3>
            <p className="text-sm text-slate-400 mt-1">Go to the events section and register to secure seats.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {registrations.map((reg) => (
              <div
                key={reg.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider ${
                      reg.status === 'REGISTERED'
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400'
                        : reg.status === 'WAITING_LIST'
                        ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400'
                        : 'bg-slate-100 text-slate-650'
                    }`}>
                      {reg.status}
                    </span>
                    <span className="text-[10px] font-semibold text-slate-400 font-mono">
                      {reg.ticketCode}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <h3 className="font-bold text-slate-800 dark:text-white line-clamp-1">{reg.event.title}</h3>
                    <div className="flex items-center space-x-1.5 text-xs text-slate-450">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{new Date(reg.event.startDate).toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 text-xs text-slate-400">
                    <span>Checked In:</span>
                    {reg.checkedIn ? (
                      <span className="text-emerald-600 font-semibold flex items-center space-x-0.5">
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>Yes</span>
                      </span>
                    ) : (
                      <span>No</span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-6">
                  <button
                    onClick={() => setSelectedReg(reg)}
                    className="flex items-center justify-center space-x-1 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 rounded-xl py-2.5 text-xs font-semibold text-slate-600 dark:text-slate-350 transition"
                  >
                    <QrCode className="w-4 h-4" />
                    <span>View Ticket</span>
                  </button>
                  {reg.status !== 'CANCELLED' && (
                    <button
                      onClick={() => handleCancelTicket(reg.id)}
                      className="border border-rose-100 hover:bg-rose-50/50 dark:border-rose-950/20 dark:hover:bg-rose-950/10 rounded-xl py-2.5 text-xs font-semibold text-rose-500 transition"
                    >
                      Cancel Booking
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* COORDINATOR SCANNER PANEL */}
      {activeTab === 'admin' && (
        <div className="space-y-6">
          {/* SEARCH */}
          <div className="relative max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2 rounded-2xl flex items-center shadow-sm">
            <Search className="h-5 w-5 text-slate-450 ml-2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search code, email, or name..."
              className="w-full bg-transparent border-0 pl-2 pr-4 py-2 text-sm focus:outline-none text-slate-850 dark:text-slate-100"
            />
          </div>

          {/* LIST */}
          {adminLoading ? (
            <div className="h-[30vh] flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            </div>
          ) : adminRegs.length === 0 ? (
            <div className="py-12 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl">
              <UserCheck className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="font-semibold text-slate-700 dark:text-slate-300">No registrations found</h3>
              <p className="text-sm text-slate-400 mt-1">Search or verify that attendees have secured seats.</p>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-450 font-medium bg-slate-50 dark:bg-slate-950/20">
                      <th className="py-3 px-4">Ticket</th>
                      <th className="py-3 px-4">Attendee</th>
                      <th className="py-3 px-4">Event</th>
                      <th className="py-3 px-4">Booking Status</th>
                      <th className="py-3 px-4 text-center">Attendance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {adminRegs.map((reg) => (
                      <tr key={reg.id} className="border-b border-slate-50 dark:border-slate-800/40 last:border-0 hover:bg-slate-50/50 dark:hover:bg-slate-800/10 transition">
                        <td className="py-4 px-4 font-mono text-xs font-semibold text-slate-800 dark:text-slate-100">{reg.ticketCode}</td>
                        <td className="py-4 px-4">
                          <div className="font-semibold text-slate-800 dark:text-slate-200">
                            {reg.user?.firstName} {reg.user?.lastName}
                          </div>
                          <div className="text-xs text-slate-400">{reg.user?.email}</div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="font-semibold text-slate-800 dark:text-slate-200 line-clamp-1">{reg.event.title}</div>
                          <div className="text-[10px] text-slate-400">{new Date(reg.event.startDate).toLocaleDateString()}</div>
                        </td>
                        <td className="py-4 px-4">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider ${
                            reg.status === 'REGISTERED'
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400'
                              : reg.status === 'WAITING_LIST'
                              ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400'
                              : 'bg-rose-50 text-rose-700 dark:bg-rose-950/20 dark:text-rose-450'
                          }`}>
                            {reg.status}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-center">
                          {reg.checkedIn ? (
                            <span className="inline-flex items-center space-x-1 text-emerald-600 font-bold text-xs bg-emerald-50 dark:bg-emerald-950/20 px-3 py-1.5 rounded-xl border border-emerald-250 dark:border-emerald-900/40">
                              <CheckCircle className="w-4 h-4" />
                              <span>Checked In</span>
                            </span>
                          ) : reg.status === 'REGISTERED' ? (
                            <button
                              onClick={() => handleCheckIn(reg.id)}
                              className="bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-1.5 rounded-xl text-xs font-semibold transition"
                            >
                              Check In
                            </button>
                          ) : (
                            <span className="text-xs text-slate-400 font-medium">Locked</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* DISPLAY TICKET DETAILS QR MODAL */}
      {selectedReg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-sm shadow-2xl p-6 relative text-center space-y-6 animate-in zoom-in-95 duration-150">
            <button
              onClick={() => setSelectedReg(null)}
              className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-650"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <h2 className="text-lg font-bold text-slate-800 dark:text-white my-0">Boarding Pass</h2>
              <p className="text-xs text-slate-450 mt-1">Present this ticket code at the event entrance.</p>
            </div>

            {/* MOCK QR CODE BOX */}
            <div className="w-48 h-48 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-2xl mx-auto flex flex-col items-center justify-center p-4 shadow-inner relative group select-none">
              <QrCode className="w-36 h-36 text-slate-800 dark:text-white" />
              <div className="absolute inset-0 bg-white/80 dark:bg-slate-950/80 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded-2xl">
                <span className="text-[10px] font-bold text-slate-800 dark:text-white uppercase tracking-wider">Ticket Confirmed</span>
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block">Ticket Code</span>
              <span className="text-lg font-bold text-slate-800 dark:text-white font-mono">{selectedReg.ticketCode}</span>
            </div>

            <div className="p-4 bg-slate-55 dark:bg-slate-950/20 border border-slate-150 dark:border-slate-800/80 rounded-2xl text-left text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-450">Event</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300 line-clamp-1">{selectedReg.event.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-450">Date & Time</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">{new Date(selectedReg.event.startDate).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-450">Attendee</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  {selectedReg.user ? `${selectedReg.user.firstName} ${selectedReg.user.lastName}` : `${user?.firstName} ${user?.lastName}`}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
