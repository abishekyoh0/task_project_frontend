import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import axiosInstance from '../api/axiosInstance';
import { useToast } from '../context/ToastContext';
import {
  Search,
  Plus,
  Calendar,
  MapPin,
  Tag,
  Loader2,
  Users,
  Upload,
  X
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

export default function Events() {
  const { user } = useSelector((state: RootState) => state.auth);
  const { showToast } = useToast();
  
  const [events, setEvents] = useState<EventData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Pagination meta
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Modal create event state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    venue: '',
    capacity: '50',
    category: '',
    price: '',
    registrationDeadline: '',
    startDate: '',
    endDate: '',
  });

  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);

  const fetchEvents = () => {
    setLoading(true);
    const params: any = {
      page,
      limit: 9,
      search: search || undefined,
    };
    if (statusFilter) params.status = statusFilter;
    if (categoryFilter) params.category = categoryFilter;

    axiosInstance
      .get('/events', { params })
      .then((res: any) => {
        setEvents(res.data.data);
        setTotalPages(res.data.meta.totalPages);
      })
      .catch(() => {
        showToast('Failed to load events', 'error');
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchEvents();
  }, [page, search, categoryFilter, statusFilter]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 20 * 1024 * 1024) {
        showToast('File size exceeds the 20MB limit', 'error');
        return;
      }
      setBannerFile(file);
      setBannerPreview(URL.createObjectURL(file));
    }
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateLoading(true);

    try {
      let bannerUrl = '';
      
      // 1. Upload banner first if present
      if (bannerFile) {
        const uploadForm = new FormData();
        uploadForm.append('file', bannerFile);
        
        const uploadRes = await axiosInstance.post('/upload/banner', uploadForm, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        bannerUrl = uploadRes.data.data.url;
      }

      // 2. Submit event creation payload
      await axiosInstance.post('/events', {
        ...formData,
        capacity: parseInt(formData.capacity) || 0,
        price: parseFloat(formData.price) || 0,
        banner: bannerUrl || undefined,
      });

      showToast('Event created successfully!', 'success');
      setIsModalOpen(false);
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        venue: '',
        capacity: '50',
        category: '',
        price: '',
        registrationDeadline: '',
        startDate: '',
        endDate: '',
      });
      setBannerFile(null);
      setBannerPreview(null);
      
      // Refresh list
      fetchEvents();
    } catch (err: any) {
      const errorMsg = err.response?.data?.error?.message || 'Failed to create event.';
      showToast(errorMsg, 'error');
    } finally {
      setCreateLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      
      {/* HEADER ACTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-800 dark:text-white my-0">Events Catalog</h1>
          <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">Browse, view details, and register for active events.</p>
        </div>
        {(user?.role === 'ORG_ADMIN' || user?.role === 'MANAGER') && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-3 rounded-2xl text-sm font-semibold transition shadow-md shadow-indigo-500/20 w-fit"
          >
            <Plus className="w-4 h-4" />
            <span>Create Event</span>
          </button>
        )}
      </div>

      {/* FILTER SEARCH BAR */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-3xl flex flex-col md:flex-row gap-4 shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-3 h-5 w-5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search events by title, venue, category..."
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-2xl pl-12 pr-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 transition"
          />
        </div>
        <div className="flex gap-4">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-2xl px-4 py-2.5 text-sm focus:outline-none text-slate-600 dark:text-slate-350 cursor-pointer"
          >
            <option value="">All Categories</option>
            <option value="Technology">Technology</option>
            <option value="Business">Business</option>
            <option value="Education">Education</option>
            <option value="Social">Social</option>
          </select>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-2xl px-4 py-2.5 text-sm focus:outline-none text-slate-600 dark:text-slate-350 cursor-pointer"
          >
            <option value="">All Statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="PUBLISHED">Published</option>
            <option value="ARCHIVED">Archived</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
      </div>

      {/* EVENT GRID */}
      {loading ? (
        <div className="h-[40vh] flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        </div>
      ) : events.length === 0 ? (
        <div className="py-20 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl">
          <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="font-semibold text-slate-700 dark:text-slate-300">No events found</h3>
          <p className="text-sm text-slate-400 mt-1">Try relaxing your search or filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {events.map((event) => {
            const seatsRemaining = event.capacity - event.registeredCount;
            const fillPercentage = ((event.registeredCount / event.capacity) * 100).toFixed(0);
            return (
              <div
                key={event.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-3xl overflow-hidden shadow-sm hover:shadow-lg hover:border-slate-300 dark:hover:border-slate-700 transition duration-300 flex flex-col h-full group"
              >
                {/* BANNER PREVIEW */}
                <div className="h-48 w-full bg-slate-100 dark:bg-slate-950 relative overflow-hidden">
                  {event.banner ? (
                    <img
                      src={`/${event.banner}`}
                      alt={event.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-300 dark:text-slate-700 bg-gradient-to-br from-indigo-50 to-violet-50 dark:from-slate-950 dark:to-slate-900">
                      <Calendar className="w-12 h-12" />
                    </div>
                  )}

                  {/* PRICE TAG */}
                  <span className="absolute top-4 right-4 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-slate-800 dark:text-white shadow-sm border border-slate-100 dark:border-slate-800">
                    {Number(event.price) === 0 ? 'Free' : `$${Number(event.price).toFixed(0)}`}
                  </span>

                  {/* CATEGORY TAG */}
                  <span className="absolute bottom-4 left-4 bg-indigo-650/80 backdrop-blur-md px-2.5 py-0.5 rounded-full text-[10px] uppercase font-bold text-white tracking-wider flex items-center space-x-1">
                    <Tag className="w-3 h-3" />
                    <span>{event.category}</span>
                  </span>
                </div>

                {/* DETAILS CARD BODY */}
                <div className="p-6 flex-1 flex flex-col">
                  <div className="flex-1 space-y-4">
                    <div className="space-y-1">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wider ${
                        event.status === 'PUBLISHED'
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400'
                          : event.status === 'CANCELLED'
                          ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/20 dark:text-rose-400'
                          : 'bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400'
                      }`}>
                        {event.status}
                      </span>
                      <h3 className="font-bold text-lg text-slate-800 dark:text-white line-clamp-1">
                        {event.title}
                      </h3>
                    </div>

                    <p className="text-xs text-slate-400 dark:text-slate-500 line-clamp-2 leading-relaxed">
                      {event.description}
                    </p>

                    <div className="space-y-2 pt-2 border-t border-slate-50 dark:border-slate-800/40 text-xs text-slate-500 dark:text-slate-400">
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        <span>{new Date(event.startDate).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <MapPin className="w-4 h-4 text-slate-400" />
                        <span className="line-clamp-1">{event.venue}</span>
                      </div>
                    </div>
                  </div>

                  {/* SEATS RATIO BAR */}
                  <div className="mt-6 pt-4 border-t border-slate-50 dark:border-slate-800/40 space-y-2">
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span className="flex items-center space-x-1">
                        <Users className="w-3.5 h-3.5" />
                        <span>{event.registeredCount} / {event.capacity} booked</span>
                      </span>
                      <span>
                        {seatsRemaining <= 0 ? 'Waitlist' : `${seatsRemaining} seats left`}
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${seatsRemaining <= 0 ? 'bg-amber-500' : 'bg-indigo-650'}`}
                        style={{ width: `${Math.min(Number(fillPercentage), 100)}%` }}
                      />
                    </div>
                  </div>

                  <Link
                    to={`/events/${event.id}`}
                    className="w-full bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-center rounded-xl py-2.5 font-semibold text-xs transition mt-6 block"
                  >
                    View Event Details
                  </Link>

                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE EVENT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 relative animate-in zoom-in-95 duration-150">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-6">Create New Event</h2>
            
            <form onSubmit={handleCreateEvent} className="space-y-6">
              
              {/* FILE PICKER BANNER */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Event Banner</label>
                <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50 dark:bg-slate-950 relative overflow-hidden group min-h-36">
                  {bannerPreview ? (
                    <>
                      <img src={bannerPreview} alt="Preview" className="absolute inset-0 w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => {
                          setBannerFile(null);
                          setBannerPreview(null);
                        }}
                        className="absolute top-2 right-2 bg-slate-900/60 text-white p-1 rounded-full hover:bg-slate-950"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </>
                  ) : (
                    <label className="cursor-pointer flex flex-col items-center justify-center space-y-2 text-slate-400 hover:text-indigo-500 transition w-full h-full">
                      <Upload className="w-8 h-8" />
                      <span className="text-xs font-medium">Click to upload image (max 20MB)</span>
                      <input type="file" onChange={handleFileChange} accept="image/*" className="hidden" />
                    </label>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Event Title</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g. Design Hackathon"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-2xl px-4 py-3.5 text-sm focus:outline-none focus:border-indigo-500 transition-colors text-slate-600 dark:text-slate-350 cursor-pointer"
                    required
                  >
                    <option value="">Select Category</option>
                    <option value="Technology">Technology</option>
                    <option value="Business">Business</option>
                    <option value="Education">Education</option>
                    <option value="Social">Social</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Enter event outline..."
                  rows={3}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 transition-colors resize-none"
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Venue</label>
                  <input
                    type="text"
                    value={formData.venue}
                    onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                    placeholder="Room 101"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Capacity</label>
                  <input
                    type="number"
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                    min={1}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Price ($)</label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="0.00"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                    min={0}
                    step="0.01"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Start Date</label>
                  <input
                    type="datetime-local"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 transition-colors text-slate-650"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">End Date</label>
                  <input
                    type="datetime-local"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 transition-colors text-slate-650"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Deadline</label>
                  <input
                    type="datetime-local"
                    value={formData.registrationDeadline}
                    onChange={(e) => setFormData({ ...formData, registrationDeadline: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 transition-colors text-slate-650"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={createLoading}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl py-4 font-semibold text-sm transition flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                {createLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <span>Create Draft Event</span>
                )}
              </button>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
