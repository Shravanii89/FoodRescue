import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';

import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DonorDashboard from './pages/DonorDashboard';
import RecipientDashboard from './pages/RecipientDashboard';
import AdminDashboard from './pages/AdminDashboard';
import FoodListingExplorer from './pages/FoodListingExplorer';
import CreateEditListing from './pages/CreateEditListing';
import ListingDetails from './pages/ListingDetails';
import SmartMatchPage from './pages/SmartMatchPage';
import RequestManagement from './pages/RequestManagement';
import PickupTracking from './pages/PickupTracking';
import UserManagement from './pages/UserManagement';
import AnalyticsReports from './pages/AnalyticsReports';
import ProfilePage from './pages/ProfilePage';
import AuditLogsPage from './pages/AuditLogsPage';

// Protected Route wrapper with role check
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    // Redirect to user's appropriate default dashboard
    if (user?.role === 'admin') return <Navigate to="/admin/dashboard" replace />;
    if (user?.role === 'donor') return <Navigate to="/donor/dashboard" replace />;
    return <Navigate to="/recipient/dashboard" replace />;
  }

  return children;
};

// Role-based root redirect for authenticated users
const DashboardDispatcher = () => {
  const { user, isAuthenticated, loading } = useAuth();
  if (loading) return null;
  if (!isAuthenticated) return <Navigate to="/" replace />;
  if (user?.role === 'admin') return <Navigate to="/admin/dashboard" replace />;
  if (user?.role === 'donor') return <Navigate to="/donor/dashboard" replace />;
  return <Navigate to="/recipient/dashboard" replace />;
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Layout />}>
            {/* Public Routes */}
            <Route index element={<LandingPage />} />
            <Route path="login" element={<LoginPage />} />
            <Route path="register" element={<RegisterPage />} />
            <Route path="explore" element={<FoodListingExplorer />} />
            <Route path="listings/:id" element={<ListingDetails />} />
            <Route path="analytics" element={<AnalyticsReports />} />

            {/* Smart Match Engine */}
            <Route
              path="smart-match"
              element={
                <ProtectedRoute allowedRoles={['recipient', 'donor', 'admin']}>
                  <SmartMatchPage />
                </ProtectedRoute>
              }
            />

            {/* Donor Routes */}
            <Route
              path="donor/dashboard"
              element={
                <ProtectedRoute allowedRoles={['donor', 'admin']}>
                  <DonorDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="listings/create"
              element={
                <ProtectedRoute allowedRoles={['donor', 'admin']}>
                  <CreateEditListing />
                </ProtectedRoute>
              }
            />
            <Route
              path="listings/edit/:id"
              element={
                <ProtectedRoute allowedRoles={['donor', 'admin']}>
                  <CreateEditListing />
                </ProtectedRoute>
              }
            />

            {/* Recipient Routes */}
            <Route
              path="recipient/dashboard"
              element={
                <ProtectedRoute allowedRoles={['recipient', 'admin']}>
                  <RecipientDashboard />
                </ProtectedRoute>
              }
            />

            {/* Requests & Logistics (Shared with role-aware views) */}
            <Route
              path="requests"
              element={
                <ProtectedRoute allowedRoles={['donor', 'recipient', 'admin']}>
                  <RequestManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="pickups"
              element={
                <ProtectedRoute allowedRoles={['donor', 'recipient', 'admin']}>
                  <PickupTracking />
                </ProtectedRoute>
              }
            />

            {/* Admin Routes */}
            <Route
              path="admin/dashboard"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="admin/users"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <UserManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="admin/audit-logs"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AuditLogsPage />
                </ProtectedRoute>
              }
            />

            {/* Profile & Settings */}
            <Route
              path="profile"
              element={
                <ProtectedRoute allowedRoles={['donor', 'recipient', 'admin']}>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />

            {/* Dashboard Redirect */}
            <Route path="dashboard" element={<DashboardDispatcher />} />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
