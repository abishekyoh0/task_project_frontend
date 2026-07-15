import React, { useEffect, useState } from 'react';
import axiosInstance from '../api/axiosInstance';
import { useToast } from '../context/ToastContext';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { Link } from 'react-router-dom';
import {
  DollarSign,
  Ticket,
  Percent,
  AlertTriangle,
  Download,
  Loader2,
  Calendar,
  TrendingUp,
  ArrowRight,
  CheckCircle
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line
} from 'recharts';

interface MetricData {
  totalRevenue: number;
  totalRegistrations: number;
  attendanceRate: number;
  cancelledEvents: number;
}

interface TopEvent {
  id: string;
  title: string;
  capacity: number;
  registeredCount: number;
  price: string;
  status: string;
}

interface MonthlyStat {
  month: string;
  revenue: number;
  registrations: number;
}

export default function Dashboard() {
  const { showToast } = useToast();
  const { user } = useSelector((state: RootState) => state.auth);
  const [loading, setLoading] = useState(true);
  
  const [metrics, setMetrics] = useState<MetricData>({
    totalRevenue: 0,
    totalRegistrations: 0,
    attendanceRate: 0,
    cancelledEvents: 0,
  });

  const [topEvents, setTopEvents] = useState<TopEvent[]>([]);
  const [monthlyStats, setMonthlyStats] = useState<MonthlyStat[]>([]);
  const [myTickets, setMyTickets] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;

    if (user.role === 'USER') {
      axiosInstance
        .get('/registrations/my')
        .then((res: any) => {
          setMyTickets(res.data.data);
        })
        .catch(() => {
          showToast('Failed to load tickets', 'error');
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      axiosInstance
        .get('/dashboard/analytics')
        .then((res: any) => {
          const { metrics, topEvents, monthlyStatistics } = res.data.data;
          setMetrics(metrics);
          setTopEvents(topEvents);
          setMonthlyStats(monthlyStatistics);
        })
        .catch((err) => {
          showToast('Failed to load dashboard metrics', 'error');
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [user, showToast]);

  const handleExportCSV = async () => {
    try {
      const response = await axiosInstance.get('/dashboard/export', {
        responseType: 'blob',
      });
      
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `registrations_export_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      showToast('CSV export successful!', 'success');
    } catch {
      showToast('CSV export failed', 'error');
    }
  };

  if (loading) {
    return (
      <div className="h-[70vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (user?.role === 'USER') {
    const registeredCount = myTickets.filter(t => t.status === 'REGISTERED').length;
    const waitlistCount = myTickets.filter(t => t.status === 'WAITING_LIST').length;
    const attendedCount = myTickets.filter(t => t.checkedIn).length;

    return (
      <div className="space-y-8 animate-in fade-in duration-200">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-800 dark:text-white my-0">
            Welcome back, {user.firstName}!
          </h1>
          <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">
            Here is a summary of your booked tickets, waitlist status, and check-ins.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 flex items-center space-x-4 shadow-sm hover:shadow-md transition-shadow">
            <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400">
              <Ticket className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Registered Tickets</span>
              <span className="text-2xl font-bold text-slate-800 dark:text-white mt-1">{registeredCount}</span>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 flex items-center space-x-4 shadow-sm hover:shadow-md transition-shadow">
            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400">
              <Percent className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Waitlist Tickets</span>
              <span className="text-2xl font-bold text-slate-800 dark:text-white mt-1">{waitlistCount}</span>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 flex items-center space-x-4 shadow-sm hover:shadow-md transition-shadow">
            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
              <CheckCircle className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Checked In</span>
              <span className="text-2xl font-bold text-slate-800 dark:text-white mt-1">{attendedCount}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
            <div>
              <h3 className="font-semibold text-slate-800 dark:text-white text-lg">Looking for new events?</h3>
              <p className="text-slate-400 dark:text-slate-500 text-sm mt-1">Browse our complete event directory, find technical summits, SaaS meetups, and design workshops.</p>
            </div>
            <Link
              to="/events"
              className="mt-6 flex items-center justify-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl py-3.5 font-semibold text-sm transition-all"
            >
              <span>Explore Event Catalog</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
            <div>
              <h3 className="font-semibold text-slate-800 dark:text-white text-lg">Manage your tickets</h3>
              <p className="text-slate-400 dark:text-slate-500 text-sm mt-1">View QR codes for quick check-in at event entry gates, track waitlist spots, or cancel bookings.</p>
            </div>
            <Link
              to="/registrations"
              className="mt-6 flex items-center justify-center space-x-2 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 text-slate-655 dark:text-slate-300 rounded-2xl py-3.5 font-semibold text-sm transition-all"
            >
              <span>My Boarding Passes</span>
              <Ticket className="w-4 h-4" />
            </Link>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
          <h3 className="font-semibold text-slate-800 dark:text-white mb-6">Recent Bookings</h3>
          {myTickets.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <Ticket className="w-8 h-8 mx-auto mb-2 text-slate-300" />
              <span>You don't have any bookings yet.</span>
            </div>
          ) : (
            <div className="space-y-4">
              {myTickets.slice(0, 3).map(ticket => (
                <div key={ticket.id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-850 rounded-2xl">
                  <div className="space-y-1">
                    <h4 className="font-semibold text-slate-850 dark:text-white">{ticket.event.title}</h4>
                    <div className="flex items-center space-x-2 text-xs text-slate-405">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{new Date(ticket.event.startDate).toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider ${
                      ticket.status === 'REGISTERED'
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400'
                        : ticket.status === 'WAITING_LIST'
                        ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400'
                        : 'bg-slate-100 text-slate-650'
                    }`}>
                      {ticket.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-800 dark:text-white my-0">Dashboard Analytics</h1>
          <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">Real-time revenue, booking registrations, and seat check-ins auditing.</p>
        </div>
        <button
          onClick={handleExportCSV}
          className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-3 rounded-2xl text-sm font-semibold transition shadow-md shadow-indigo-500/20 w-fit"
        >
          <Download className="w-4 h-4" />
          <span>Export CSV Report</span>
        </button>
      </div>

      {/* METRIC CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* TOTAL REVENUE */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 flex items-center space-x-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Total Revenue</span>
            <span className="text-2xl font-bold text-slate-800 dark:text-white mt-1">${metrics.totalRevenue.toLocaleString()}</span>
          </div>
        </div>

        {/* BOOKED SEATS */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 flex items-center space-x-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
            <Ticket className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Registrations</span>
            <span className="text-2xl font-bold text-slate-800 dark:text-white mt-1">{metrics.totalRegistrations.toLocaleString()}</span>
          </div>
        </div>

        {/* CHECK-IN RATE */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 flex items-center space-x-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="p-4 rounded-2xl bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400">
            <Percent className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Attendance Rate</span>
            <span className="text-2xl font-bold text-slate-800 dark:text-white mt-1">{metrics.attendanceRate}%</span>
          </div>
        </div>

        {/* CANCELLED EVENTS */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 flex items-center space-x-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Cancelled Events</span>
            <span className="text-2xl font-bold text-slate-800 dark:text-white mt-1">{metrics.cancelledEvents}</span>
          </div>
        </div>

      </div>

      {/* GRAPH CHARTS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* REVENUE GROWTH */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-4 h-4 text-indigo-500" />
              <h3 className="font-semibold text-slate-800 dark:text-white">Revenue Trend</h3>
            </div>
            <span className="text-xs font-medium text-slate-450 bg-slate-50 dark:bg-slate-800 px-3 py-1 rounded-xl">Last 6 Months</span>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyStats} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" className="dark:stroke-slate-800" />
                <XAxis dataKey="month" stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ borderRadius: '16px', border: '1px solid #E2E8F0', fontSize: '12px' }} />
                <Line type="monotone" dataKey="revenue" stroke="#4f46e5" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* REGISTRATION PERFORMANCE */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-emerald-500" />
              <h3 className="font-semibold text-slate-800 dark:text-white">Monthly Bookings</h3>
            </div>
            <span className="text-xs font-medium text-slate-450 bg-slate-50 dark:bg-slate-800 px-3 py-1 rounded-xl">Last 6 Months</span>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyStats} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" className="dark:stroke-slate-800" />
                <XAxis dataKey="month" stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ borderRadius: '16px', border: '1px solid #E2E8F0', fontSize: '12px' }} />
                <Bar dataKey="registrations" fill="#10b981" radius={[8, 8, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* TOP EVENTS LIST */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
        <h3 className="font-semibold text-slate-800 dark:text-white mb-6">Top Performing Events</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-450 font-medium">
                <th className="pb-3 pl-4">Event Name</th>
                <th className="pb-3">Status</th>
                <th className="pb-3">Ticket Price</th>
                <th className="pb-3">Seats Sold</th>
                <th className="pb-3">Capacity Rate</th>
              </tr>
            </thead>
            <tbody>
              {topEvents.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-slate-400">No events found</td>
                </tr>
              ) : (
                topEvents.map((event) => {
                  const fillRate = ((event.registeredCount / event.capacity) * 100).toFixed(0);
                  return (
                    <tr key={event.id} className="border-b border-slate-50 dark:border-slate-800/40 last:border-0 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition">
                      <td className="py-4 pl-4 font-semibold text-slate-800 dark:text-slate-100">{event.title}</td>
                      <td className="py-4">
                        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${
                          event.status === 'PUBLISHED'
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400'
                            : 'bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400'
                        }`}>
                          {event.status}
                        </span>
                      </td>
                      <td className="py-4 font-medium text-slate-600 dark:text-slate-300">
                        {Number(event.price) === 0 ? 'Free' : `$${Number(event.price).toFixed(2)}`}
                      </td>
                      <td className="py-4 font-semibold text-slate-700 dark:text-slate-300">
                        {event.registeredCount} / {event.capacity}
                      </td>
                      <td className="py-4">
                        <div className="flex items-center space-x-2">
                          <div className="w-24 bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                            <div
                              className="bg-indigo-600 h-full rounded-full"
                              style={{ width: `${Math.min(Number(fillRate), 100)}%` }}
                            />
                          </div>
                          <span className="text-xs font-medium text-slate-500">{fillRate}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
