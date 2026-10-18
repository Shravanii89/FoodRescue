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
  RefreshCw,
  Building2,
  ArrowRight,
  FileText,
  AlertTriangle
} from 'lucide-react';
import StatCard from '../components/StatCard';
import StatusBadge from '../components/StatusBadge';
import EmptyState from '../components/EmptyState';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [pendingUsers, setPendingUsers] = useState([]);
  const [recentLogs, setRecentLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cleanupMsg, setCleanupMsg] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      const [overviewRes, usersRes, logsRes] = await Promise.all([
        apiClient.get('/admin/overview'),
        apiClient.get('/admin/users?verificationStatus=pending&limit=5'),
        apiClient.get('/admin/audit-logs?limit=5')
      ]);

      if (overviewRes.data?.data) setStats(overviewRes.data.data);
      if (usersRes.data?.data) setPendingUsers(usersRes.data.data);
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

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <div className="w-10 h-10 border-4 border-forest border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-semibold text-slate-500">Loading system administration center...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-forest/10 text-forest-light">
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

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleRunExpiryCleanup}
            disabled={actionLoading}
            className="px-4 py-2.5 rounded-2xl bg-forest hover:bg-forest-light text-white font-bold text-xs shadow-md shadow-forest/20 transition-all flex items-center gap-2 shrink-0 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 text-emerald-300 ${actionLoading ? 'animate-spin' : ''}`} />
            <span>Run Expiry Cleanup</span>
          </button>
          <Link
            to="/admin/verification"
            className="px-4 py-2.5 rounded-2xl bg-teal-50 hover:bg-teal-100 text-teal-800 font-bold text-xs transition-colors shrink-0"
          >
            Verification Queue
          </Link>
        </div>
      </div>

      {cleanupMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{cleanupMsg}</span>
        </div>
      )}

      {/* KPI Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <StatCard
          title="Total Users"
          value={stats?.totalUsers || 0}
          subtitle="Donors & charities"
          icon={Users}
          color="blue"
        />
        <StatCard
          title="Pending NGOs"
          value={stats?.pendingVerifications || 0}
          subtitle="Awaiting review"
          icon={ShieldCheck}
          color="amber"
        />
        <StatCard
          title="Active Food"
          value={stats?.activeListings || 0}
          subtitle="Current available"
          icon={Utensils}
          color="emerald"
        />
        <StatCard
          title="Total Postings"
          value={stats?.totalListings || 0}
          subtitle="Historical batches"
          icon={Clock}
          color="purple"
        />
        <StatCard
          title="Claims"
          value={stats?.totalRequests || 0}
          subtitle="Rescue requests"
          icon={Inbox}
          color="blue"
        />
        <StatCard
          title="Completed"
          value={stats?.totalPickups || 0}
          subtitle="Verified handovers"
          icon={CheckCircle2}
          color="emerald"
        />
      </div>

      {/* Pending NGO Verification Queue Section */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-forest" />
              <span>Pending Recipient Verifications</span>
            </h2>
            <p className="text-xs text-slate-500">Charities awaiting identity and tax-exempt credential validation</p>
          </div>
          <Link to="/admin/verification" className="text-xs font-bold text-forest hover:text-forest-light flex items-center gap-1">
            <span>Open Queue ({stats?.pendingVerifications || 0})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {pendingUsers.length === 0 ? (
          <EmptyState
            icon={ShieldCheck}
            title="All organizations verified"
            description="There are no pending recipient verification requests at this time. All community partners are reviewed."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50/80 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">
                <tr>
                  <th className="py-3 px-3">Organization Name</th>
                  <th className="py-3 px-3">Registration No.</th>
                  <th className="py-3 px-3">Contact Person</th>
                  <th className="py-3 px-3">Daily Capacity</th>
                  <th className="py-3 px-3 text-right">Quick Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pendingUsers.map((u) => (
                  <tr key={u._id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-3 font-bold text-slate-900">
                      {u.organizationDetails?.orgName || u.name}
                      <span className="block text-[10px] text-slate-400 font-normal capitalize">
                        {u.organizationDetails?.orgType || 'Community Kitchen'}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono text-[11px] text-slate-700">
                      {u.organizationDetails?.registrationNumber || 'Pending'}
                    </td>
                    <td className="py-3 px-3">
                      <p className="font-semibold text-slate-800">{u.name}</p>
                      <p className="text-[10px] text-slate-400">{u.email}</p>
                    </td>
                    <td className="py-3 px-3 font-semibold text-forest">
                      {u.organizationDetails?.capacityDailyMeals || 50} meals/day
                    </td>
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleVerifyUser(u._id, 'verified')}
                          disabled={actionLoading}
                          className="px-3 py-1.5 rounded-xl bg-forest hover:bg-forest-light text-white font-bold text-xs transition-colors shadow-2xs disabled:opacity-50"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleVerifyUser(u._id, 'rejected')}
                          disabled={actionLoading}
                          className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-slate-700 font-bold text-xs transition-colors disabled:opacity-50"
                        >
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Recent Platform Audit Log Stream */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <FileText className="w-4 h-4 text-forest" />
              <span>Recent Immutable Audit Logs</span>
            </h2>
            <p className="text-xs text-slate-500">Real-time system events, state transitions, and security logs</p>
          </div>
          <Link to="/admin/audit-logs" className="text-xs font-bold text-forest hover:text-forest-light flex items-center gap-1">
            <span>View Full Audit Log</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {recentLogs.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No audit entries logged yet"
            description="Audit events will appear as users authenticate and interact with food listings."
          />
        ) : (
          <div className="space-y-2">
            {recentLogs.map((log) => (
              <div
                key={log._id}
                className="p-3 rounded-2xl bg-slate-50/70 border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-2"
              >
                <div className="flex items-center gap-2.5">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-forest/10 text-forest font-mono">
                    {log.action}
                  </span>
                  <span className="font-semibold text-slate-800">
                    {log.userId?.name || 'System'} ({log.userRole || 'Automated'})
                  </span>
                </div>
                <div className="flex items-center gap-4 text-slate-500 text-[11px]">
                  <span>Entity: {log.entityType}</span>
                  <span>{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
