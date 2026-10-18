import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../api/apiClient';
import {
  ShieldCheck,
  Users,
  Utensils,
  Clock,
  Inbox,
  Truck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  FileText,
  Building2,
  ArrowRight
} from 'lucide-react';
import StatCard from '../components/StatCard';
import StatusBadge from '../components/StatusBadge';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [pendingUsers, setPendingUsers] = useState([]);
  const [expiredListings, setExpiredListings] = useState([]);
  const [recentLogs, setRecentLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cleanupMsg, setCleanupMsg] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      const [overviewRes, usersRes, expiredRes, logsRes] = await Promise.all([
        apiClient.get('/admin/overview'),
        apiClient.get('/admin/users?verificationStatus=pending&limit=5'),
        apiClient.get('/admin/expired-listings'),
        apiClient.get('/admin/audit-logs?limit=6')
      ]);

      if (overviewRes.data?.data) setStats(overviewRes.data.data);
      if (usersRes.data?.data) setPendingUsers(usersRes.data.data);
      if (expiredRes.data?.data) setExpiredListings(expiredRes.data.data);
      if (logsRes.data?.data) setRecentLogs(logsRes.data.data);
    } catch (err) {
      console.error('Failed to load admin overview:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleVerifyUser = async (userId, status) => {
    try {
      setActionLoading(true);
      await apiClient.put(`/admin/users/${userId}/verify`, { verificationStatus: status });
      setCleanupMsg(`User successfully marked as ${status}.`);
      setTimeout(() => setCleanupMsg(''), 4000);
      fetchAdminData();
    } catch (err) {
      alert(err.response?.data?.message || 'Verification failed.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRunExpiryCleanup = async () => {
    try {
      setActionLoading(true);
      const res = await apiClient.post('/admin/expired-listings/cleanup');
      setCleanupMsg(`Database cleanup executed: ${res.data?.message}`);
      setTimeout(() => setCleanupMsg(''), 5000);
      fetchAdminData();
    } catch (err) {
      alert(err.response?.data?.message || 'Cleanup pipeline failed.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-brand-100 text-brand-800">
              Platform Governance
            </span>
            <span className="text-xs text-slate-400">• Full Root Access</span>
          </div>

          <h1 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
            System Administration & Control Center
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage NGO verification credentials, audit event streams, and database integrity pipelines.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRunExpiryCleanup}
            disabled={actionLoading}
            className="px-4 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-xs transition-colors flex items-center gap-2"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${actionLoading ? 'animate-spin' : ''}`} />
            <span>Run Expiry Cleanup</span>
          </button>
          <Link
            to="/admin/users"
            className="px-4 py-2.5 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-xs transition-colors"
          >
            User Directory
          </Link>
        </div>
      </div>

      {cleanupMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-semibold text-emerald-800 flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{cleanupMsg}</span>
        </div>
      )}

      {/* Overview StatCards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Platform Users"
          value={stats?.totalUsers || 0}
          subtitle="Donors, NGOs, Admins"
          icon={Users}
          color="emerald"
        />
        <StatCard
          title="Pending NGO Verifications"
          value={stats?.pendingVerifications || 0}
          subtitle="Requires credential review"
          icon={ShieldCheck}
          color={stats?.pendingVerifications > 0 ? 'amber' : 'emerald'}
        />
        <StatCard
          title="Active Food Batches"
          value={stats?.activeListings || 0}
          subtitle={`${stats?.expiredListings || 0} overdue`}
          icon={Utensils}
          color="blue"
        />
        <StatCard
          title="Completed Rescues"
          value={stats?.totalPickups || 0}
          subtitle={`${stats?.totalRequests || 0} claims logged`}
          icon={Truck}
          color="purple"
        />
      </div>

      {/* Pending Verifications Queue */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-brand-600" />
              <span>Pending Organization Verifications</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Review registered shelters and kitchens before enabling donation claim permissions
            </p>
          </div>
          <Link to="/admin/users" className="text-xs font-bold text-brand-600 hover:text-brand-700">
            View All Users
          </Link>
        </div>

        {pendingUsers.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
            <p className="font-semibold text-slate-700">All registered organizations are currently verified.</p>
            <p className="mt-0.5">No accounts pending administrative review.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {pendingUsers.map((u) => (
              <div key={u._id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold shrink-0">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div className="text-xs">
                    <p className="font-bold text-slate-900 text-sm">
                      {u.organizationDetails?.orgName || u.name}
                    </p>
                    <p className="text-slate-500 capitalize">
                      Role: {u.role} • Reg: {u.organizationDetails?.registrationNumber || 'Not specified'}
                    </p>
                    <p className="text-slate-600 mt-0.5">
                      Email: {u.email} • Capacity: {u.organizationDetails?.capacityDailyMeals} meals/day
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleVerifyUser(u._id, 'rejected')}
                    disabled={actionLoading}
                    className="px-3 py-1.5 rounded-xl border border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-semibold transition-colors"
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => handleVerifyUser(u._id, 'verified')}
                    disabled={actionLoading}
                    className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Approve & Verify</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Overdue Expired Listings & Cleanup */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-600" />
              <span>Overdue Expired Surplus Listings ({expiredListings.length})</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Listings past expiry timestamp that need MongoDB status update to "expired"
            </p>
          </div>

          {expiredListings.length > 0 && (
            <button
              onClick={handleRunExpiryCleanup}
              disabled={actionLoading}
              className="px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-xs"
            >
              Expire All Overdue ({expiredListings.length})
            </button>
          )}
        </div>

        {expiredListings.length === 0 ? (
          <div className="py-6 text-center text-xs text-slate-400">
            No overdue uncleaned food listings. Database indexes and TTL timers in order.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-[10px] font-bold uppercase text-slate-400">
                <tr>
                  <th className="py-2.5 px-3">Listing Title</th>
                  <th className="py-2.5 px-3">Donor</th>
                  <th className="py-2.5 px-3">Remaining</th>
                  <th className="py-2.5 px-3">Expired At</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {expiredListings.map((exp) => (
                  <tr key={exp._id}>
                    <td className="py-2.5 px-3 font-bold text-slate-800">{exp.title}</td>
                    <td className="py-2.5 px-3 font-medium text-slate-600">
                      {exp.donorId?.organizationDetails?.orgName || exp.donorId?.name}
                    </td>
                    <td className="py-2.5 px-3 text-brand-700 font-semibold">
                      {exp.remainingQuantity} {exp.unit}
                    </td>
                    <td className="py-2.5 px-3 text-rose-600 font-medium">
                      {new Date(exp.expiryTime).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                    </td>
                    <td className="py-2.5 px-3">
                      <StatusBadge status={exp.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* System Audit Logs Preview */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-brand-600" />
              <span>Real-Time Database Audit Logs</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Immutable security trail of operations, logins, stock reservations, and verifications
            </p>
          </div>
          <Link to="/admin/audit-logs" className="text-xs font-bold text-brand-600 hover:text-brand-700">
            Full Audit Log
          </Link>
        </div>

        <div className="space-y-2">
          {recentLogs.map((log) => (
            <div
              key={log._id}
              className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
            >
              <div className="flex items-center gap-2.5">
                <span className="px-2 py-0.5 rounded-md font-mono text-[10px] font-bold bg-slate-200 text-slate-800">
                  {log.action}
                </span>
                <span className="font-semibold text-slate-900">{log.entityType}</span>
                <span className="text-slate-500 text-[11px] truncate max-w-xs">
                  {JSON.stringify(log.details)}
                </span>
              </div>

              <div className="flex items-center gap-3 text-[11px] text-slate-400 shrink-0">
                <span>By: {log.userId?.name || log.userRole || 'System'}</span>
                <span>{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
