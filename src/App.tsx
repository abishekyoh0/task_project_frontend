import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastProvider } from './context/ToastContext';
import ProtectedRoute from './components/ProtectedRoute';
import SidebarLayout from './components/SidebarLayout';

// Page Components
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import Events from './pages/Events';
import EventDetails from './pages/EventDetails';
import Registrations from './pages/Registrations';
import Payments from './pages/Payments';
import Users from './pages/Users';
import Settings from './pages/Settings';

export default function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Auth Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* Protected Main App Routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <SidebarLayout />
              </ProtectedRoute>
            }
          >
            {/* Redirect root to dashboard */}
            <Route index element={<Navigate to="/dashboard" replace />} />
            
            {/* Shared Dashboard Page */}
            <Route path="dashboard" element={<Dashboard />} />

            {/* Event Catalog CRUD Pages */}
            <Route path="events" element={<Events />} />
            <Route path="events/:id" element={<EventDetails />} />

            {/* Registrations/Check-in Pages */}
            <Route path="registrations" element={<Registrations />} />

            {/* Payments Ledger Page (Super Admin, Org Admin, Manager) */}
            <Route
              path="payments"
              element={
                <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ORG_ADMIN', 'MANAGER']}>
                  <Payments />
                </ProtectedRoute>
              }
            />

            {/* Users Directory Management Page (Super Admin, Org Admin) */}
            <Route
              path="users"
              element={
                <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ORG_ADMIN']}>
                  <Users />
                </ProtectedRoute>
              }
            />

            {/* Profile Preferences & Password change settings */}
            <Route path="settings" element={<Settings />} />
          </Route>

          {/* Fallback to Dashboard */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  );
}
