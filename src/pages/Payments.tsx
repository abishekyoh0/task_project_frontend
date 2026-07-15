import React, { useEffect, useState } from 'react';
import axiosInstance from '../api/axiosInstance';
import { useToast } from '../context/ToastContext';
import {
  CreditCard,
  Plus,
  Loader2,
  Tag,
  FileText,
  RefreshCcw,
  X,
  Calendar
} from 'lucide-react';

interface PaymentData {
  id: string;
  amount: string;
  currency: string;
  status: string;
  paymentMethod: string;
  transactionId: string;
  createdAt: string;
  registration: {
    ticketCode: string;
    event: {
      title: string;
    };
    user: {
      firstName: string;
      lastName: string;
      email: string;
    };
  };
}

interface CouponData {
  id: string;
  code: string;
  discountPercentage: number | null;
  discountFlat: number | null;
  maxUses: number | null;
  usedCount: number;
  isActive: boolean;
  event: {
    title: string;
  } | null;
}

export default function Payments() {
  const { showToast } = useToast();

  const [payments, setPayments] = useState<PaymentData[]>([]);
  const [coupons, setCoupons] = useState<CouponData[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'transactions' | 'coupons'>('transactions');

  // Coupon modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [couponLoading, setCouponLoading] = useState(false);
  const [events, setEvents] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    code: '',
    discountPercentage: '',
    discountFlat: '',
    maxUses: '',
    eventId: '',
  });

  const fetchPaymentsData = () => {
    setLoading(true);
    
    // Fetch payments and coupons in parallel
    Promise.all([
      axiosInstance.get('/payments/history'),
      axiosInstance.get('/payments/coupons/all'),
    ])
      .then(([payRes, coupRes]) => {
        setPayments(payRes.data.data);
        setCoupons(coupRes.data.data);
      })
      .catch(() => {
        showToast('Failed to load payments data', 'error');
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchPaymentsData();
  }, []);

  const handleRefund = async (paymentId: string) => {
    if (!window.confirm('Are you sure you want to issue a full refund for this transaction?')) {
      return;
    }

    try {
      await axiosInstance.post(`/payments/${paymentId}/refund`);
      showToast('Refund processed successfully!', 'success');
      fetchPaymentsData();
    } catch (err: any) {
      showToast(err.response?.data?.error?.message || 'Refund failed', 'error');
    }
  };

  const handleOpenCouponModal = async () => {
    setIsModalOpen(true);
    try {
      const res = await axiosInstance.get('/events?limit=100');
      setEvents(res.data.data);
    } catch {
      showToast('Failed to load events list', 'error');
    }
  };

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    setCouponLoading(true);

    try {
      await axiosInstance.post('/payments/coupons', {
        code: formData.code.toUpperCase(),
        discountPercentage: formData.discountPercentage ? parseInt(formData.discountPercentage) : undefined,
        discountFlat: formData.discountFlat ? parseFloat(formData.discountFlat) : undefined,
        maxUses: formData.maxUses ? parseInt(formData.maxUses) : undefined,
        eventId: formData.eventId || undefined,
      });

      showToast('Coupon created successfully!', 'success');
      setIsModalOpen(false);
      
      // Reset
      setFormData({
        code: '',
        discountPercentage: '',
        discountFlat: '',
        maxUses: '',
        eventId: '',
      });
      
      fetchPaymentsData();
    } catch (err: any) {
      showToast(err.response?.data?.error?.message || 'Failed to create coupon', 'error');
    } finally {
      setCouponLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      
      {/* HEADER ACTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-800 dark:text-white my-0">Billing & Coupons</h1>
          <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">Review ticket purchase audit trails and configure discounts.</p>
        </div>
        {activeTab === 'coupons' && (
          <button
            onClick={handleOpenCouponModal}
            className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-3 rounded-2xl text-sm font-semibold transition shadow-md shadow-indigo-500/20 w-fit"
          >
            <Plus className="w-4 h-4" />
            <span>Create Coupon</span>
          </button>
        )}
      </div>

      {/* TABS */}
      <div className="flex border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setActiveTab('transactions')}
          className={`px-6 py-3.5 text-sm font-semibold border-b-2 transition ${
            activeTab === 'transactions'
              ? 'border-indigo-650 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
          }`}
        >
          Transactions Ledger
        </button>
        <button
          onClick={() => setActiveTab('coupons')}
          className={`px-6 py-3.5 text-sm font-semibold border-b-2 transition ${
            activeTab === 'coupons'
              ? 'border-indigo-650 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
          }`}
        >
          Discount Coupons
        </button>
      </div>

      {loading ? (
        <div className="h-[40vh] flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        </div>
      ) : activeTab === 'transactions' ? (
        
        /* TRANSACTIONS TABLE */
        payments.length === 0 ? (
          <div className="py-20 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl">
            <CreditCard className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="font-semibold text-slate-700 dark:text-slate-300">No transactions recorded</h3>
            <p className="text-sm text-slate-400 mt-1">Audit details will automatically populate as tickets are sold.</p>
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-450 font-medium bg-slate-50 dark:bg-slate-950/20">
                    <th className="py-3 px-4">Transaction Code</th>
                    <th className="py-3 px-4">Customer</th>
                    <th className="py-3 px-4">Event Details</th>
                    <th className="py-3 px-4">Payment Info</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-center">Refund Action</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((pay) => (
                    <tr key={pay.id} className="border-b border-slate-50 dark:border-slate-800/40 last:border-0 hover:bg-slate-50/50 dark:hover:bg-slate-800/10 transition">
                      <td className="py-4 px-4">
                        <div className="font-semibold text-slate-800 dark:text-slate-100 font-mono text-xs">{pay.transactionId}</div>
                        <div className="text-[10px] text-slate-400 flex items-center space-x-1 mt-0.5">
                          <Calendar className="w-3 h-3" />
                          <span>{new Date(pay.createdAt).toLocaleDateString()}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="font-semibold text-slate-800 dark:text-slate-250">
                          {pay.registration?.user?.firstName} {pay.registration?.user?.lastName}
                        </div>
                        <div className="text-xs text-slate-400">{pay.registration?.user?.email}</div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="font-semibold text-slate-800 dark:text-slate-200 line-clamp-1">{pay.registration?.event?.title}</div>
                        <div className="text-[10px] text-slate-400 font-mono">Code: {pay.registration?.ticketCode}</div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="font-bold text-slate-800 dark:text-slate-200">
                          ${Number(pay.amount).toFixed(2)} {pay.currency}
                        </div>
                        <div className="text-[10px] text-indigo-500 font-medium uppercase tracking-wider">{pay.paymentMethod.replace('_', ' ')}</div>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider ${
                          pay.status === 'COMPLETED'
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400'
                            : pay.status === 'REFUNDED'
                            ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400'
                            : 'bg-rose-50 text-rose-700 dark:bg-rose-950/20 dark:text-rose-450'
                        }`}>
                          {pay.status}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-center">
                        {pay.status === 'COMPLETED' ? (
                          <button
                            onClick={() => handleRefund(pay.id)}
                            className="text-rose-500 hover:text-rose-700 text-xs font-semibold flex items-center justify-center space-x-1 border border-rose-100 hover:bg-rose-50/50 dark:border-rose-950/20 dark:hover:bg-rose-950/10 px-3 py-1.5 rounded-xl mx-auto transition"
                          >
                            <RefreshCcw className="w-3.5 h-3.5" />
                            <span>Issue Refund</span>
                          </button>
                        ) : (
                          <span className="text-xs text-slate-400">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      ) : (
        
        /* COUPONS GRID */
        coupons.length === 0 ? (
          <div className="py-20 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl">
            <Tag className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="font-semibold text-slate-700 dark:text-slate-300">No coupons active</h3>
            <p className="text-sm text-slate-400 mt-1">Configure discount values for promotional code validations.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {coupons.map((coupon) => (
              <div
                key={coupon.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-sm bg-indigo-50 dark:bg-indigo-950/40 text-indigo-650 dark:text-indigo-400 px-3 py-1.5 rounded-xl border border-indigo-200/50 dark:border-indigo-900/60 uppercase">
                      {coupon.code}
                    </span>
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                      coupon.isActive
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400'
                        : 'bg-slate-100 text-slate-450'
                    }`}>
                      {coupon.isActive ? 'Active' : 'Disabled'}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <div className="text-xl font-extrabold text-slate-850 dark:text-slate-105">
                      {coupon.discountPercentage
                        ? `${coupon.discountPercentage}% Off`
                        : `$${Number(coupon.discountFlat).toFixed(2)} Off`}
                    </div>
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block">Discount Amount</span>
                  </div>

                  <div className="text-xs text-slate-500 space-y-1 border-t border-slate-105/10 pt-3">
                    <div className="flex justify-between">
                      <span>Uses Count</span>
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        {coupon.usedCount} / {coupon.maxUses || 'Unlimited'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Event Boundary</span>
                      <span className="font-semibold text-slate-700 dark:text-slate-300 truncate max-w-[12rem]" title={coupon.event?.title || 'All Events'}>
                        {coupon.event?.title || 'Global (All)'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* CREATE COUPON MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md shadow-2xl p-6 relative animate-in zoom-in-95 duration-150">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-655"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-6">Create Discount Coupon</h2>
            
            <form onSubmit={handleCreateCoupon} className="space-y-4">
              
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Coupon Code</label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  placeholder="e.g. SAVE50"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 transition-colors uppercase"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Discount (%)</label>
                  <input
                    type="number"
                    value={formData.discountPercentage}
                    onChange={(e) => setFormData({ ...formData, discountPercentage: e.target.value, discountFlat: '' })}
                    placeholder="e.g. 20"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                    min={1}
                    max={100}
                    required={!formData.discountFlat}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Flat Discount ($)</label>
                  <input
                    type="number"
                    value={formData.discountFlat}
                    onChange={(e) => setFormData({ ...formData, discountFlat: e.target.value, discountPercentage: '' })}
                    placeholder="e.g. 10.00"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                    min={0.01}
                    step="0.01"
                    required={!formData.discountPercentage}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Max Uses Limit</label>
                <input
                  type="number"
                  value={formData.maxUses}
                  onChange={(e) => setFormData({ ...formData, maxUses: e.target.value })}
                  placeholder="e.g. 100 (Leave blank for unlimited)"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                  min={1}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Restrict to Event (Optional)</label>
                <select
                  value={formData.eventId}
                  onChange={(e) => setFormData({ ...formData, eventId: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-2xl px-4 py-3 text-sm focus:outline-none text-slate-600 dark:text-slate-350 cursor-pointer"
                >
                  <option value="">Apply to all events</option>
                  {events.map((ev) => (
                    <option key={ev.id} value={ev.id}>
                      {ev.title}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                disabled={couponLoading}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl py-4 font-semibold text-sm transition flex items-center justify-center space-x-2 disabled:opacity-50 mt-2"
              >
                {couponLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <span>Create Coupon</span>
                )}
              </button>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
