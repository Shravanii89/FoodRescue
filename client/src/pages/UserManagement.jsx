import React, { useState, useEffect, useCallback } from 'react';
import apiClient from '../api/apiClient';
import {
  Users,
  Search,
  Filter,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Building2,
  UserCheck,
  PowerOff,
  Power
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
    const delay = setTimeout(fetchUsers, 250);
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
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
          <UserCheck className="w-6 h-6 text-brand-600" />
          <span>User & Organization Management</span>
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Verify NGO identity credentials, manage account states, and supervise platform participants
        </p>
      </div>

      {feedback && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-semibold text-emerald-800 flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search user name, email, or org..."
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-brand-500 outline-hidden font-medium"
            />
          </div>

          <div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white capitalize outline-hidden focus:ring-2 focus:ring-brand-500"
            >
              <option value="">All Roles</option>
              <option value="donor">Donors</option>
              <option value="recipient">Recipients / NGOs</option>
              <option value="admin">Administrators</option>
            </select>
          </div>

          <div>
            <select
              value={verificationFilter}
              onChange={(e) => setVerificationFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white capitalize outline-hidden focus:ring-2 focus:ring-brand-500"
            >
              <option value="">All Verification States</option>
              <option value="pending">Pending Review</option>
              <option value="verified">Verified</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs">
        {loading ? (
          <div className="py-16 text-center">
            <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs text-slate-500">Querying user accounts...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400">
            No users match the selected filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">
                <tr>
                  <th className="py-3 px-3">Organization / User</th>
                  <th className="py-3 px-3">Role</th>
                  <th className="py-3 px-3">Contact</th>
                  <th className="py-3 px-3">Location</th>
                  <th className="py-3 px-3">Verification</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => (
                  <tr key={u._id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-3">
                      <p className="font-bold text-slate-900">
                        {u.organizationDetails?.orgName || u.name}
                      </p>
                      <span className="text-[10px] text-slate-400">{u.name} • {u.email}</span>
                    </td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        u.role === 'admin'
                          ? 'bg-purple-100 text-purple-800'
                          : u.role === 'donor'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <p>{u.phone || 'N/A'}</p>
                      <span className="text-[10px] text-slate-400">{u.organizationDetails?.registrationNumber}</span>
                    </td>
                    <td className="py-3 px-3 truncate max-w-[140px]">
                      {u.location?.address}
                    </td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        u.verificationStatus === 'verified'
                          ? 'bg-emerald-100 text-emerald-800'
                          : u.verificationStatus === 'pending'
                          ? 'bg-amber-100 text-amber-800 animate-pulse'
                          : 'bg-rose-100 text-rose-800'
                      }`}>
                        {u.verificationStatus}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span className={`inline-block w-2 h-2 rounded-full mr-1.5 ${u.isActive ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                      <span className="text-[11px] font-medium">{u.isActive ? 'Active' : 'Disabled'}</span>
                    </td>
                    <td className="py-3 px-3 text-right space-x-1.5">
                      {u.role !== 'admin' && u.verificationStatus !== 'verified' && (
                        <button
                          onClick={() => handleVerify(u._id, 'verified')}
                          className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] shadow-xs"
                        >
                          Verify
                        </button>
                      )}
                      {u.role !== 'admin' && u.verificationStatus === 'pending' && (
                        <button
                          onClick={() => handleVerify(u._id, 'rejected')}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-slate-600 font-semibold text-[11px]"
                        >
                          Reject
                        </button>
                      )}
                      {u.role !== 'admin' && (
                        <button
                          onClick={() => handleToggleActive(u._id, u.isActive)}
                          className={`p-1.5 rounded-lg text-xs font-semibold ${
                            u.isActive
                              ? 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                              : 'text-emerald-600 hover:bg-emerald-50'
                          }`}
                          title={u.isActive ? 'Deactivate account' : 'Activate account'}
                        >
                          {u.isActive ? <PowerOff className="w-3.5 h-3.5" /> : <Power className="w-3.5 h-3.5" />}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserManagement;
