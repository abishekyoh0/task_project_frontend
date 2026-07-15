import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import axiosInstance from '../api/axiosInstance';
import { useToast } from '../context/ToastContext';
import {
  Calendar,
  MapPin,
  Users,
  Tag,
  DollarSign,
  AlertTriangle,
  Loader2,
  CheckCircle,
  Clock,
  ArrowLeft,
  X,
  CreditCard
} from 'lucide-react';

interface EventData {
  id: string;
  title: string;
  description: string;
  banner: string | null;
  venue: string;
  capacity: number;
  registeredCount: number;
  category: string;
  price: string;
  startDate: string;
  endDate: string;
  status: string;
  registrationDeadline: string;
}

export default function EventDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { user } = useSelector((state: RootState) => state.auth);

  const [event, setEvent] = useState<EventData | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Booking checkout modal state
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState<'details' | 'payment'>('details');
  const [couponCode, setCouponCode] = useState('');
  const [discountAmount, setDiscountAmount] = useState(0);
  const [finalPrice, setFinalPrice] = useState(0);
  const [couponApplied, setCouponApplied] = useState(false);
  const [couponValidating, setCouponValidating] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  
  // Registration result
  const [registration, setRegistration] = useState<any | null>(null);
  const [paymentMethod, setPaymentMethod] = useState('CREDIT_CARD');

  const fetchEventDetails = () => {
    setLoading(true);
    axiosInstance
      .get(`/events/${id}`)
      .then((res: any) => {
        setEvent(res.data.data);
        setFinalPrice(Number(res.data.data.price));
      })
      .catch(() => {
        showToast('Failed to load event details', 'error');
        navigate('/events');
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchEventDetails();
  }, [id]);

  const handleStatusChange = async (status: string) => {
    if (!event) return;
    setActionLoading(true);

    try {
      await axiosInstance.patch(`/events/${event.id}/status`, { status });
      showToast(`Event status updated to ${status}!`, 'success');
      fetchEventDetails();
    } catch (err: any) {
      showToast(err.response?.data?.error?.message || 'Status update failed', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleValidateCoupon = async () => {
    if (!event || !couponCode) return;
    setCouponValidating(true);

    try {
      const res = await axiosInstance.post('/payments/coupons/validate', {
        code: couponCode,
        eventId: event.id,
      });

      const { discountAmount, finalPrice } = res.data.data;
      setDiscountAmount(discountAmount);
      setFinalPrice(finalPrice);
      setCouponApplied(true);
      showToast('Coupon code applied successfully!', 'success');
    } catch (err: any) {
      showToast(err.response?.data?.error?.message || 'Invalid coupon code', 'error');
      setCouponCode('');
    } finally {
      setCouponValidating(false);
    }
  };

  const handleBookTicket = async () => {
    if (!event) return;
    setBookingLoading(true);

    try {
      // 1. Submit Registration
      const regRes = await axiosInstance.post('/registrations', {
        eventId: event.id,
      });

      const reg = regRes.data.data;
      setRegistration(reg);

      // If placed on waiting list, no payment is required. Done!
      if (reg.status === 'WAITING_LIST') {
        showToast('Event is full! You have been placed on the waiting list.', 'info');
        setIsCheckoutOpen(false);
        navigate('/registrations');
      } else {
        // Seat secured. If event is free, execute checkout immediately for $0
        if (finalPrice === 0) {
          await axiosInstance.post('/payments', {
            registrationId: reg.id,
            paymentMethod: 'FREE',
            couponCode: couponApplied ? couponCode : undefined,
          });
          showToast('Free ticket booked successfully!', 'success');
          setIsCheckoutOpen(false);
          navigate('/registrations');
        } else {
          // Push to payment step
          setCheckoutStep('payment');
        }
      }
    } catch (err: any) {
      showToast(err.response?.data?.error?.message || 'Registration booking failed', 'error');
    } finally {
      setBookingLoading(false);
    }
  };

  const handleProcessPayment = async () => {
    if (!registration) return;
    setBookingLoading(true);

    try {
      await axiosInstance.post('/payments', {
        registrationId: registration.id,
        paymentMethod,
        couponCode: couponApplied ? couponCode : undefined,
      });

      showToast('Payment successful! Your ticket is confirmed.', 'success');
      setIsCheckoutOpen(false);
      navigate('/registrations');
    } catch (err: any) {
      showToast(err.response?.data?.error?.message || 'Payment processing failed', 'error');
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="h-[70vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!event) return null;

  const isDeadlinePassed = new Date(event.registrationDeadline) < new Date();
  const seatsRemaining = event.capacity - event.registeredCount;
  const isOrganizer = user?.role === 'ORG_ADMIN' || user?.role === 'MANAGER';

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      
      {/* BACK BUTTON */}
      <button
        onClick={() => navigate('/events')}
        className="flex items-center space-x-2 text-slate-500 hover:text-slate-800 dark:hover:text-slate-100 font-semibold transition"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Events</span>
      </button>

      {/* EVENT TITLE JUMBOTRON */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
        <div className="h-64 sm:h-96 w-full bg-slate-100 dark:bg-slate-950 relative">
          {event.banner ? (
            <img src={`/${event.banner}`} alt={event.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-350 bg-gradient-to-br from-indigo-50 to-violet-50 dark:from-slate-950 dark:to-slate-900">
              <Calendar className="w-20 h-20" />
            </div>
          )}
          <div className="absolute inset-0 bg-slate-950/20 backdrop-blur-[1px]" />
          
          <div className="absolute bottom-6 left-6 text-white space-y-2">
            <span className="bg-indigo-650 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
              {event.category}
            </span>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-white my-0 drop-shadow-md">
              {event.title}
            </h1>
          </div>
        </div>

        {/* DETAILS SECTION */}
        <div className="p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* DESCRIPTION */}
          <div className="lg:col-span-2 space-y-6">
            <div className="space-y-3">
              <h2 className="text-xl font-bold text-slate-800 dark:text-white my-0">Event Overview</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed whitespace-pre-line">
                {event.description}
              </p>
            </div>

            {/* ORGANIZER ACTIONS */}
            {isOrganizer && (
              <div className="p-6 bg-slate-50 dark:bg-slate-950/25 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-4">
                <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 my-0">Organizer Controls</h3>
                <div className="flex flex-wrap gap-3">
                  {event.status === 'DRAFT' && (
                    <button
                      onClick={() => handleStatusChange('PUBLISHED')}
                      disabled={actionLoading}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl text-xs font-semibold transition"
                    >
                      Publish Event
                    </button>
                  )}
                  {event.status === 'PUBLISHED' && (
                    <>
                      <button
                        onClick={() => handleStatusChange('CANCELLED')}
                        disabled={actionLoading}
                        className="bg-rose-600 hover:bg-rose-700 text-white px-4 py-2.5 rounded-xl text-xs font-semibold transition"
                      >
                        Cancel Event
                      </button>
                      <button
                        onClick={() => handleStatusChange('ARCHIVED')}
                        disabled={actionLoading}
                        className="bg-slate-600 hover:bg-slate-700 text-white px-4 py-2.5 rounded-xl text-xs font-semibold transition"
                      >
                        Archive Event
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* SIDE INFO BOX */}
          <div className="space-y-6 bg-slate-50/50 dark:bg-slate-950/15 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl h-fit">
            <div className="space-y-4">
              
              {/* PRICE */}
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <span className="text-sm text-slate-400 font-medium">Ticket Price</span>
                <span className="text-xl font-bold text-slate-800 dark:text-white">
                  {Number(event.price) === 0 ? 'Free' : `$${Number(event.price).toFixed(2)}`}
                </span>
              </div>

              {/* TIMING */}
              <div className="flex items-start space-x-3 text-xs text-slate-500 dark:text-slate-400">
                <Calendar className="w-5 h-5 text-slate-400 mt-0.5" />
                <div>
                  <span className="font-semibold text-slate-700 dark:text-slate-300 block">Date & Time</span>
                  <span>{new Date(event.startDate).toLocaleString()} to {new Date(event.endDate).toLocaleTimeString()}</span>
                </div>
              </div>

              {/* VENUE */}
              <div className="flex items-start space-x-3 text-xs text-slate-500 dark:text-slate-400">
                <MapPin className="w-5 h-5 text-slate-400 mt-0.5" />
                <div>
                  <span className="font-semibold text-slate-700 dark:text-slate-300 block">Venue Location</span>
                  <span>{event.venue}</span>
                </div>
              </div>

              {/* CAPACITY */}
              <div className="flex items-start space-x-3 text-xs text-slate-500 dark:text-slate-400">
                <Users className="w-5 h-5 text-slate-400 mt-0.5" />
                <div>
                  <span className="font-semibold text-slate-700 dark:text-slate-300 block">Capacity</span>
                  <span>{event.registeredCount} / {event.capacity} seats filled ({seatsRemaining <= 0 ? 'Full' : `${seatsRemaining} left`})</span>
                </div>
              </div>

              {/* DEADLINE */}
              <div className="flex items-start space-x-3 text-xs text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800 pt-3">
                <Clock className="w-5 h-5 text-slate-400 mt-0.5" />
                <div>
                  <span className="font-semibold text-slate-700 dark:text-slate-300 block">Registration Deadline</span>
                  <span className={isDeadlinePassed ? 'text-rose-500 font-medium' : ''}>
                    {new Date(event.registrationDeadline).toLocaleString()}
                  </span>
                </div>
              </div>

            </div>

            {/* BOOKING BUTTON */}
            {event.status === 'PUBLISHED' ? (
              <button
                onClick={() => {
                  setCheckoutStep('details');
                  setIsCheckoutOpen(true);
                }}
                disabled={isDeadlinePassed}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl py-3.5 font-semibold text-sm transition mt-6 disabled:opacity-50"
              >
                {isDeadlinePassed ? 'Registration Closed' : seatsRemaining <= 0 ? 'Join Waiting List' : 'Register Now'}
              </button>
            ) : (
              <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 text-amber-800 dark:bg-amber-950/20 dark:border-amber-900/40 dark:text-amber-400 text-xs font-semibold text-center mt-6">
                Registration is inactive ({event.status.toLowerCase()})
              </div>
            )}
          </div>

        </div>
      </div>

      {/* CHECKOUT BOOKING MODAL */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md shadow-2xl p-6 relative animate-in zoom-in-95 duration-150">
            <button
              onClick={() => setIsCheckoutOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-5 h-5" />
            </button>

            {checkoutStep === 'details' ? (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-slate-800 dark:text-white my-0">Ticket Details</h2>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Review pricing and apply any coupons.</p>
                </div>

                <div className="space-y-3 bg-slate-50 dark:bg-slate-950/25 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Ticket Type</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-350">General Admission</span>
                  </div>
                  <div className="flex justify-between border-t border-slate-100 dark:border-slate-800 pt-2">
                    <span className="text-slate-500">Base Price</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-350">${Number(event.price).toFixed(2)}</span>
                  </div>
                  {couponApplied && (
                    <div className="flex justify-between text-emerald-600">
                      <span>Discount Coupon ({couponCode})</span>
                      <span>-${discountAmount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between border-t border-slate-200 dark:border-slate-800 pt-2 font-bold text-slate-800 dark:text-white text-base">
                    <span>Total Amount</span>
                    <span>${finalPrice.toFixed(2)}</span>
                  </div>
                </div>

                {/* COUPON INPUT */}
                {Number(event.price) > 0 && (
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Coupon Code</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                        disabled={couponApplied || couponValidating}
                        placeholder="e.g. DISCOUNT20"
                        className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-2xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 transition-colors uppercase disabled:opacity-50"
                      />
                      <button
                        type="button"
                        onClick={handleValidateCoupon}
                        disabled={couponApplied || couponValidating || !couponCode}
                        className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 px-4 rounded-2xl text-xs font-semibold transition disabled:opacity-50"
                      >
                        {couponValidating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Apply'}
                      </button>
                    </div>
                  </div>
                )}

                {/* WAITLIST ADVISORY WARNING */}
                {seatsRemaining <= 0 && (
                  <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl text-amber-800 dark:bg-amber-950/20 dark:border-amber-900/40 dark:text-amber-400 text-xs flex items-start space-x-2">
                    <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <span>This event is currently sold out. Booking will place you in the waiting list queue. No billing occurs until a seat is promoted.</span>
                  </div>
                )}

                <button
                  onClick={handleBookTicket}
                  disabled={bookingLoading}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl py-3.5 font-semibold text-sm transition flex items-center justify-center space-x-2 disabled:opacity-50"
                >
                  {bookingLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <span>{seatsRemaining <= 0 ? 'Confirm Waitlist' : 'Proceed to Checkout'}</span>
                  )}
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-slate-800 dark:text-white my-0">Billing Checkout</h2>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Submit mock payment parameters.</p>
                </div>

                <div className="p-4 bg-slate-50 dark:bg-slate-950/25 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-4">
                  <div className="text-sm font-semibold flex items-center justify-between text-slate-700 dark:text-slate-300">
                    <span>Total Amount</span>
                    <span className="text-indigo-600 dark:text-indigo-400 font-bold">${finalPrice.toFixed(2)}</span>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Payment Method</label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('CREDIT_CARD')}
                        className={`flex items-center justify-center space-x-2 py-3 rounded-2xl border text-sm font-medium transition ${
                          paymentMethod === 'CREDIT_CARD'
                            ? 'bg-indigo-50 border-indigo-200 text-indigo-600 dark:bg-indigo-950/40 dark:border-indigo-900/60 dark:text-indigo-400'
                            : 'border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                        }`}
                      >
                        <CreditCard className="w-4 h-4" />
                        <span>Card</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('MOCK_GATEWAY')}
                        className={`flex items-center justify-center space-x-2 py-3 rounded-2xl border text-sm font-medium transition ${
                          paymentMethod === 'MOCK_GATEWAY'
                            ? 'bg-indigo-50 border-indigo-200 text-indigo-600 dark:bg-indigo-950/40 dark:border-indigo-900/60 dark:text-indigo-400'
                            : 'border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                        }`}
                      >
                        <span>Mock Pay</span>
                      </button>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleProcessPayment}
                  disabled={bookingLoading}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl py-3.5 font-semibold text-sm transition flex items-center justify-center space-x-2 disabled:opacity-50"
                >
                  {bookingLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <span>Process Payment (${finalPrice.toFixed(2)})</span>
                  )}
                </button>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
