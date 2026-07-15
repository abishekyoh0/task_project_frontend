import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store';
import { logout } from '../store/authSlice';
import { setTenantId } from '../store/tenantSlice';
import { useDarkMode } from '../hooks/useDarkMode';
import axiosInstance from '../api/axiosInstance';
import { io, Socket } from 'socket.io-client';
import {
  LayoutDashboard,
  Calendar,
  Ticket,
  CreditCard,
  Users,
  Settings,
  Globe,
  Bell,
  Sun,
  Moon,
  LogOut,
  Menu,
  X,
  ChevronDown,
  Info
} from 'lucide-react';

interface RealtimeNotification {
  message: string;
  type: string;
  timestamp: string;
}

export default function SidebarLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);
  const { activeTenantId } = useSelector((state: RootState) => state.tenant);

  const [isDark, toggleDarkMode] = useDarkMode();
  
  // Responsive sidebar toggle
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Notifications dropdown
  const [notifications, setNotifications] = useState<RealtimeNotification[]>([]);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Super Admin organizations dropdown
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [orgDropdownOpen, setOrgDropdownOpen] = useState(false);

  const notifRef = useRef<HTMLDivElement>(null);
  const orgRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);

  // Close dropdowns on clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setIsNotifOpen(false);
      }
      if (orgRef.current && !orgRef.current.contains(event.target as Node)) {
        setOrgDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch organizations if Super Admin
  useEffect(() => {
    if (user?.role === 'SUPER_ADMIN') {
      axiosInstance.get('/organizations/my/members?limit=100').catch(() => {}); // fallback or custom super admin API
      // For now mock or fetch list
      axiosInstance.get('/organizations/my').then((res: any) => {
        setOrganizations([res.data.data]);
      }).catch(() => {});
    }
  }, [user]);

  // Connect to Socket.IO for real-time notifications
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    // Establish WebSocket Connection
    const socket = io('/notifications', {
      auth: { token },
      transports: ['websocket'],
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Realtime notification WebSocket connected');
    });

    socket.on('notification', (data: RealtimeNotification) => {
      setNotifications((prev) => [data, ...prev]);
      setUnreadCount((count) => count + 1);
      // Trigger a simple HTML notification sound or display toast if needed
    });

    // Listen for force logouts from axios refreshing failures
    const handleForceLogout = () => {
      dispatch(logout());
      navigate('/login');
    };
    window.addEventListener('auth-logout', handleForceLogout);

    return () => {
      socket.disconnect();
      window.removeEventListener('auth-logout', handleForceLogout);
    };
  }, [dispatch, navigate]);

  const handleLogout = () => {
    const refreshToken = localStorage.getItem('refreshToken') || '';
    axiosInstance.post('/auth/logout', { refreshToken }).finally(() => {
      dispatch(logout());
      navigate('/login');
    });
  };

  const navLinks = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, roles: ['SUPER_ADMIN', 'ORG_ADMIN', 'MANAGER', 'USER'] },
    { name: 'Events', path: '/events', icon: Calendar, roles: ['SUPER_ADMIN', 'ORG_ADMIN', 'MANAGER', 'USER'] },
    { name: 'Tickets', path: '/registrations', icon: Ticket, roles: ['SUPER_ADMIN', 'ORG_ADMIN', 'MANAGER', 'USER'] },
    { name: 'Billing', path: '/payments', icon: CreditCard, roles: ['SUPER_ADMIN', 'ORG_ADMIN', 'MANAGER'] },
    { name: 'Users', path: '/users', icon: Users, roles: ['SUPER_ADMIN', 'ORG_ADMIN'] },
    { name: 'Settings', path: '/settings', icon: Settings, roles: ['SUPER_ADMIN', 'ORG_ADMIN', 'MANAGER', 'USER'] },
  ];

  const filteredLinks = navLinks.filter(
    (link) => link.roles.includes(user?.role || 'USER')
  );

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN': return 'Platform Admin';
      case 'ORG_ADMIN': return 'Org Admin';
      case 'MANAGER': return 'Manager';
      default: return 'User';
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 text-slate-800 dark:bg-slate-950 dark:text-slate-200 overflow-hidden font-sans">
      
      {/* SIDEBAR CONTAINER */}
      <aside
        className={`fixed inset-y-0 left-0 z-30 w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transform lg:translate-x-0 lg:static transition-transform duration-300 ease-in-out ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* LOGO AREA */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold shadow-md shadow-indigo-500/20">
              Æ
            </div>
            <span className="text-lg font-semibold bg-gradient-to-r from-indigo-600 to-violet-600 dark:from-indigo-400 dark:to-violet-400 bg-clip-text text-transparent">
              EventFlow
            </span>
          </div>
          <button
            className="lg:hidden p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800"
            onClick={() => setIsSidebarOpen(false)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* NAVIGATION LINKS */}
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto max-h-[calc(100vh-4rem)]">
          {filteredLinks.map((link) => {
            const Icon = link.icon;
            const isActive = location.pathname.startsWith(link.path);
            return (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setIsSidebarOpen(false)}
                className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400 font-medium'
                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/40 hover:text-slate-800 dark:hover:text-slate-100'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500'}`} />
                <span>{link.name}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* OVERLAY FOR MOBILE SIDEBAR */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-slate-950/30 backdrop-blur-sm lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* MAIN CONTAINER */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        
        {/* HEADER AREA */}
        <header className="flex items-center justify-between h-16 px-6 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 z-10 shadow-sm">
          
          {/* MOBILE SIDEBAR TRIGGER */}
          <div className="flex items-center space-x-4 lg:space-x-0">
            <button
              className="lg:hidden p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800"
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </button>
            
            {/* SUPER ADMIN TENANT SELECTOR */}
            {user?.role === 'SUPER_ADMIN' && organizations.length > 0 && (
              <div ref={orgRef} className="relative">
                <button
                  onClick={() => setOrgDropdownOpen(!orgDropdownOpen)}
                  className="flex items-center space-x-2 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 text-sm font-medium"
                >
                  <Globe className="w-4 h-4 text-indigo-500" />
                  <span>Tenant Org</span>
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                </button>

                {orgDropdownOpen && (
                  <div className="absolute left-0 mt-2 w-56 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="px-4 py-1 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Select Organization
                    </div>
                    {organizations.map((org) => (
                      <button
                        key={org.id}
                        onClick={() => {
                          dispatch(setTenantId(org.id));
                          setOrgDropdownOpen(false);
                          window.location.reload(); // Reload context
                        }}
                        className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-between ${
                          activeTenantId === org.id ? 'text-indigo-600 dark:text-indigo-400 font-semibold' : ''
                        }`}
                      >
                        <span>{org.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* RIGHT ACTIONS */}
          <div className="flex items-center space-x-4">
            
            {/* DARK MODE SWITCH */}
            <button
              onClick={toggleDarkMode}
              className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors duration-200"
            >
              {isDark ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-slate-500" />}
            </button>

            {/* REAL-TIME NOTIFICATION BELL */}
            <div ref={notifRef} className="relative">
              <button
                onClick={() => {
                  setIsNotifOpen(!isNotifOpen);
                  setUnreadCount(0);
                }}
                className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors duration-200 relative"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-rose-500 border border-white dark:border-slate-900 rounded-full flex items-center justify-center text-[10px] text-white font-bold">
                    {unreadCount}
                  </span>
                )}
              </button>

              {isNotifOpen && (
                <div className="absolute right-0 mt-3 w-80 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl z-50 max-h-[30rem] overflow-y-auto py-2 divide-y divide-slate-100 dark:divide-slate-800 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-4 py-2 font-semibold text-slate-800 dark:text-slate-200 flex items-center justify-between">
                    <span>Notifications</span>
                    {notifications.length > 0 && (
                      <button
                        onClick={() => setNotifications([])}
                        className="text-xs text-indigo-500 hover:underline"
                      >
                        Clear all
                      </button>
                    )}
                  </div>
                  {notifications.length === 0 ? (
                    <div className="px-4 py-6 text-center text-sm text-slate-400">
                      No new notifications
                    </div>
                  ) : (
                    notifications.map((notif, idx) => (
                      <div key={idx} className="p-4 hover:bg-slate-55 dark:hover:bg-slate-800/40 transition-colors flex items-start space-x-3">
                        <Info className="w-4 h-4 text-indigo-500 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                            {notif.message}
                          </p>
                          <span className="text-[10px] text-slate-400 block mt-1">
                            {new Date(notif.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* PROFILE WIDGET */}
            <div className="flex items-center space-x-3 border-l border-slate-200 dark:border-slate-800 pl-4">
              <div className="hidden md:flex flex-col text-right">
                <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  {user?.firstName} {user?.lastName}
                </span>
                <span className="text-[11px] text-indigo-500 font-medium">
                  {getRoleLabel(user?.role || '')}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="p-2.5 rounded-xl border border-rose-100 dark:border-rose-950/40 bg-rose-50/50 hover:bg-rose-50 dark:bg-rose-950/10 dark:hover:bg-rose-950/20 text-rose-500 transition-colors"
                title="Sign Out"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>

          </div>
        </header>

        {/* WORKSPACE CONTENT AREA */}
        <main className="flex-1 overflow-y-auto p-8 bg-slate-50 dark:bg-slate-950">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>

    </div>
  );
}
