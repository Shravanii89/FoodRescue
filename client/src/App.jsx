import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';

// Public & Shared Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import FoodListingExplorer from './pages/FoodListingExplorer';
import ListingDetails from './pages/ListingDetails';
import SmartMatchPage from './pages/SmartMatchPage';
import AnalyticsReports from './pages/AnalyticsReports';
import ProfilePage from './pages/ProfilePage';
import ForbiddenPage from './pages/ForbiddenPage';

// Donor Specific Pages
import DonorDashboard from './pages/DonorDashboard';
import DonorListingsPage from './pages/DonorListingsPage';
import DonorRequestsPage from './pages/DonorRequestsPage';
import DonorPickupsPage from './pages/DonorPickupsPage';
import CreateEditListing from './pages/CreateEditListing';

// Recipient Specific Pages
import RecipientDashboard from './pages/RecipientDashboard';
import RecipientRequestsPage from './pages/RecipientRequestsPage';
import RecipientPickupsPage from './pages/RecipientPickupsPage';

// Administrator Specific Pages
import AdminDashboard from './pages/AdminDashboard';
import AdminVerificationPage from './pages/AdminVerificationPage';
import AdminListingsPage from './pages/AdminListingsPage';
import AdminRequestsPage from './pages/AdminRequestsPage';
import AdminPickupsPage from './pages/AdminPickupsPage';
import UserManagement from './pages/UserManagement';
import AuditLogsPage from './pages/AuditLogsPage';

// Protected Route wrapper with role check
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-4 border-forest border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    // Redirect unauthorized cross-role attempts to forbidden page
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

// Role-based root redirect for dashboard links
const DashboardDispatcher = () => {
  const { user, isAuthenticated, loading } = useAuth();
  if (loading) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.role === 'admin') return <Navigate to="/admin/dashboard" replace />;
  if (user?.role === 'donor') return <Navigate to="/donor/dashboard" replace />;
  return <Navigate to="/recipient/dashboard" replace />;
};

// Role-based dispatcher for generic requests URL
const RequestsDispatcher = () => {
  const { user, isAuthenticated, loading } = useAuth();
  if (loading) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.role === 'admin') return <Navigate to="/admin/requests" replace />;
  if (user?.role === 'donor') return <Navigate to="/donor/requests" replace />;
  return <Navigate to="/recipient/requests" replace />;
};

// Role-based dispatcher for generic pickups URL
const PickupsDispatcher = () => {
  const { user, isAuthenticated, loading } = useAuth();
  if (loading) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.role === 'admin') return <Navigate to="/admin/pickups" replace />;
  if (user?.role === 'donor') return <Navigate to="/donor/pickups" replace />;
  return <Navigate to="/recipient/pickups" replace />;
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
            <Route path="unauthorized" element={<ForbiddenPage />} />

            {/* Smart Match Engine */}
            <Route
              path="smart-match"
              element={
                <ProtectedRoute allowedRoles={['recipient', 'admin']}>
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
              path="donor/listings"
              element={
                <ProtectedRoute allowedRoles={['donor', 'admin']}>
                  <DonorListingsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="donor/requests"
              element={
                <ProtectedRoute allowedRoles={['donor', 'admin']}>
                  <DonorRequestsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="donor/pickups"
              element={
                <ProtectedRoute allowedRoles={['donor', 'admin']}>
                  <DonorPickupsPage />
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
            <Route
              path="recipient/requests"
              element={
                <ProtectedRoute allowedRoles={['recipient', 'admin']}>
                  <RecipientRequestsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="recipient/pickups"
              element={
                <ProtectedRoute allowedRoles={['recipient', 'admin']}>
                  <RecipientPickupsPage />
                </ProtectedRoute>
              }
            />

            {/* Administrator Routes */}
            <Route
              path="admin/dashboard"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="admin/verification"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminVerificationPage />
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
              path="admin/listings"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminListingsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="admin/requests"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminRequestsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="admin/pickups"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminPickupsPage />
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

            {/* Profile & Settings (Authenticated for all roles) */}
            <Route
              path="profile"
              element={
                <ProtectedRoute allowedRoles={['donor', 'recipient', 'admin']}>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />

            {/* Dispatcher Routes */}
            <Route path="dashboard" element={<DashboardDispatcher />} />
            <Route path="requests" element={<RequestsDispatcher />} />
            <Route path="pickups" element={<PickupsDispatcher />} />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
