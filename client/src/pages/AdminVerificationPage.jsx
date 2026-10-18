import React, { useState, useEffect } from 'react';
import apiClient from '../api/apiClient';
import PageHeader from '../components/PageHeader';
import StatusBadge from '../components/StatusBadge';
import EmptyState from '../components/EmptyState';
import ConfirmModal from '../components/ConfirmModal';
import {
  ShieldCheck,
  Building2,
  CheckCircle2,
  XCircle,
  Clock,
  Phone,
  MapPin,
  FileText,
  Search,
  RefreshCw,
  Users
} from 'lucide-react';

const AdminVerificationPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');
  const [search, setSearch] = useState('');
  
  const [selectedUser, setSelectedUser] = useState(null);
  const [verificationAction, setVerificationAction] = useState(null); // 'verified' | 'rejected'
  const [actionLoading, setActionLoading] = useState(false);
  const [feedback, setFeedback] = useState('');

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const url = filter === 'all'
        ? `/admin/users?role=recipient`
        : `/admin/users?role=recipient&verificationStatus=${filter}`;
      const res = await apiClient.get(url);
      if (res.data?.data) {
        setUsers(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch verification queue:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [filter]);

  const handleVerificationConfirm = async () => {
    if (!selectedUser || !verificationAction) return;
    try {
      setActionLoading(true);
      const res = await apiClient.put(`/admin/users/${selectedUser._id}/verify`, {
        verificationStatus: verificationAction
      });

      if (res.data?.success) {
        setFeedback(`Organization "${selectedUser.organizationDetails?.orgName || selectedUser.name}" successfully marked as ${verificationAction}.`);
        setTimeout(() => setFeedback(''), 5000);
        setSelectedUser(null);
        setVerificationAction(null);
        fetchUsers();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Verification update failed.');
    } finally {
      setActionLoading(false);
    }
  };

  const filteredUsers = users.filter((u) => {
    const org = u.organizationDetails?.orgName || '';
    const name = u.name || '';
    const email = u.email || '';
    const reg = u.organizationDetails?.registrationNumber || '';
    return (
      org.toLowerCase().includes(search.toLowerCase()) ||
      name.toLowerCase().includes(search.toLowerCase()) ||
      email.toLowerCase().includes(search.toLowerCase()) ||
      reg.toLowerCase().includes(search.toLowerCase())
    );
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="NGO Verification Center"
        description="Review registration credentials, audit NGO charitable eligibility, and approve or reject community recipients."
        badge="Governance Authority"
      />

      {feedback && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Filter Tabs & Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
          {[
            { id: 'pending', label: 'Pending Verification' },
            { id: 'verified', label: 'Verified NGOs' },
            { id: 'rejected', label: 'Rejected' },
            { id: 'all', label: 'All Recipients' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                filter === tab.id
                  ? 'bg-forest text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative w-full sm:w-60">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search NGO or reg no..."
              className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest"
            />
          </div>
          <button
            onClick={fetchUsers}
            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors shrink-0"
            title="Refresh queue"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[40vh] space-y-3">
          <div className="w-8 h-8 border-3 border-forest border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-500 font-medium">Loading verification queue...</p>
        </div>
      ) : filteredUsers.length === 0 ? (
        <EmptyState
          icon={ShieldCheck}
          title={filter === 'pending' ? 'Verification queue is clear' : 'No organizations found'}
          description={
            filter === 'pending'
              ? 'There are currently no recipient organizations waiting for administrative verification. Great job!'
              : 'No recipient accounts match your current search query.'
          }
        />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50/80 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">Organization & Contact</th>
                  <th className="py-3 px-4">Type & Reg Number</th>
                  <th className="py-3 px-4">Daily Meal Capacity</th>
                  <th className="py-3 px-4">Location</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Verification Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map((u) => (
                  <tr key={u._id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900 text-sm">
                        {u.organizationDetails?.orgName || u.name}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Rep: {u.name} • {u.email}
                      </div>
                      {u.phone && (
                        <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <Phone className="w-3 h-3" />
                          <span>{u.phone}</span>
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className="capitalize font-medium text-slate-800">
                        {u.organizationDetails?.orgType || 'NGO'}
                      </span>
                      <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                        Reg: {u.organizationDetails?.registrationNumber || 'Not specified'}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-forest text-sm">
                        {u.organizationDetails?.capacityDailyMeals || 50}
                      </span>
                      <span className="text-[10px] text-slate-400"> meals/day</span>
                    </td>
                    <td className="py-3 px-4 text-[11px] text-slate-500 max-w-xs truncate">
                      {u.location?.address || 'Bengaluru, Karnataka'}
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={u.verificationStatus || 'pending'} />
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {u.verificationStatus !== 'verified' && (
                          <button
                            onClick={() => {
                              setSelectedUser(u);
                              setVerificationAction('verified');
                            }}
                            className="px-3 py-1.5 rounded-xl bg-forest hover:bg-forest-light text-white font-semibold text-xs transition-colors flex items-center gap-1 shadow-xs"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Verify NGO</span>
                          </button>
                        )}
                        {u.verificationStatus !== 'rejected' && (
                          <button
                            onClick={() => {
                              setSelectedUser(u);
                              setVerificationAction('rejected');
                            }}
                            className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-slate-700 font-semibold text-xs transition-colors flex items-center gap-1"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Reject</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(selectedUser)}
        onClose={() => {
          setSelectedUser(null);
          setVerificationAction(null);
        }}
        onConfirm={handleVerificationConfirm}
        title={verificationAction === 'verified' ? 'Verify Organization' : 'Reject Organization'}
        message={
          verificationAction === 'verified'
            ? `Are you sure you want to approve "${selectedUser?.organizationDetails?.orgName || selectedUser?.name}"? Once verified, they will gain full access to request and claim surplus food.`
            : `Are you sure you want to reject "${selectedUser?.organizationDetails?.orgName || selectedUser?.name}"? They will be unable to claim food donations until re-verified.`
        }
        confirmText={verificationAction === 'verified' ? 'Approve & Verify' : 'Confirm Rejection'}
        confirmVariant={verificationAction === 'verified' ? 'primary' : 'danger'}
        loading={actionLoading}
      />
    </div>
  );
};

export default AdminVerificationPage;
