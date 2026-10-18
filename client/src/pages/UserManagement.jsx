import React, { useState, useEffect, useCallback } from 'react';
import apiClient from '../api/apiClient';
import PageHeader from '../components/PageHeader';
import StatusBadge from '../components/StatusBadge';
import EmptyState from '../components/EmptyState';
import {
  Users,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Building2,
  UserCheck,
  PowerOff,
  Power,
  RefreshCw,
  Phone
} from 'lucide-react';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState('');
  const [verificationFilter, setVerificationFilter] = useState('');
  const [search, setSearch] = useState('');
  const [feedback, setFeedback] = useState('');

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (roleFilter) params.set('role', roleFilter);
      if (verificationFilter) params.set('verificationStatus', verificationFilter);
      if (search) params.set('search', search);

      const res = await apiClient.get(`/admin/users?${params.toString()}`);
      if (res.data?.data) {
        setUsers(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setLoading(false);
    }
  }, [roleFilter, verificationFilter, search]);

  useEffect(() => {
    const delay = setTimeout(fetchUsers, 200);
    return () => clearTimeout(delay);
  }, [fetchUsers]);

  const handleVerify = async (userId, status) => {
    try {
      await apiClient.put(`/admin/users/${userId}/verify`, { verificationStatus: status });
      setFeedback(`User verification status set to ${status}.`);
      setTimeout(() => setFeedback(''), 4000);
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.message || 'Verification update failed.');
    }
  };

  const handleToggleActive = async (userId, currentActive) => {
    try {
      await apiClient.put(`/admin/users/${userId}/status`, { isActive: !currentActive });
      setFeedback(`User account ${!currentActive ? 'activated' : 'deactivated'}.`);
      setTimeout(() => setFeedback(''), 4000);
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.message || 'Status toggle failed.');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="User & Organization Management"
        description="Oversee user registrations, inspect organization details, and manage account authorization states."
        badge="Access Control"
      />

      {feedback && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs font-semibold text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, email, or organization..."
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest"
          >
            <option value="">All Roles</option>
            <option value="donor">Donors</option>
            <option value="recipient">Recipients (NGOs)</option>
            <option value="admin">Administrators</option>
          </select>

          <select
            value={verificationFilter}
            onChange={(e) => setVerificationFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest"
          >
            <option value="">All Verification States</option>
            <option value="verified">Verified</option>
            <option value="pending">Pending</option>
            <option value="rejected">Rejected</option>
          </select>

          <button
            onClick={fetchUsers}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors shrink-0"
            title="Refresh users"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[40vh] space-y-3">
          <div className="w-8 h-8 border-3 border-forest border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-500 font-medium">Loading user records...</p>
        </div>
      ) : users.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No users match filters"
          description="Try broadening your role, verification, or search query filters to display results."
        />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50/80 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">User Details</th>
                  <th className="py-3 px-4">Role & Org</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Account State</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => (
                  <tr key={u._id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-forest/10 text-forest font-bold flex items-center justify-center text-xs shrink-0">
                          {u.name ? u.name[0].toUpperCase() : 'U'}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{u.name}</p>
                          <p className="text-[11px] text-slate-500">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="capitalize font-semibold text-slate-800">{u.role}</span>
                      <p className="text-[11px] text-slate-500">
                        {u.organizationDetails?.orgName || 'Independent'}
                      </p>
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={u.verificationStatus || 'pending'} />
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          u.isActive
                            ? 'bg-emerald-50 text-emerald-800'
                            : 'bg-rose-50 text-rose-800'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${u.isActive ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                        {u.isActive ? 'Active' : 'Disabled'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {u.role === 'recipient' && u.verificationStatus !== 'verified' && (
                          <button
                            onClick={() => handleVerify(u._id, 'verified')}
                            className="px-2.5 py-1 rounded-lg bg-forest hover:bg-forest-light text-white font-semibold text-[11px] transition-colors shadow-2xs"
                          >
                            Verify
                          </button>
                        )}
                        <button
                          onClick={() => handleToggleActive(u._id, u.isActive)}
                          className={`p-1.5 rounded-lg text-xs transition-colors ${
                            u.isActive
                              ? 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                              : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'
                          }`}
                          title={u.isActive ? 'Deactivate account' : 'Activate account'}
                        >
                          {u.isActive ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4 text-emerald-600" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
