import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../api/apiClient';
import PageHeader from '../components/PageHeader';
import StatusBadge from '../components/StatusBadge';
import EmptyState from '../components/EmptyState';
import ConfirmModal from '../components/ConfirmModal';
import {
  Inbox,
  Building2,
  Clock,
  Phone,
  Truck,
  MapPin,
  Search,
  RefreshCw,
  PlusCircle,
  Key,
  XCircle,
  CheckCircle2
} from 'lucide-react';

const RecipientRequestsPage = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  
  const [requestToCancel, setRequestToCancel] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [feedback, setFeedback] = useState('');

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/requests/my');
      if (res.data?.data) {
        setRequests(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch recipient requests:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleCancelRequest = async () => {
    if (!requestToCancel) return;
    try {
      setActionLoading(true);
      const res = await apiClient.put(`/requests/${requestToCancel._id}/status`, {
        status: 'cancelled',
        rejectionReason: 'Cancelled by recipient NGO before donor review.'
      });
      if (res.data?.success) {
        setFeedback('Claim request cancelled successfully.');
        setTimeout(() => setFeedback(''), 4000);
        setRequestToCancel(null);
        fetchRequests();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to cancel request.');
    } finally {
      setActionLoading(false);
    }
  };

  const filteredRequests = requests.filter((r) => {
    const matchesFilter = filter === 'all' ? true : r.status === filter;
    const donorName = r.donorId?.organizationDetails?.orgName || r.donorId?.name || '';
    const foodTitle = r.listingId?.title || '';
    const matchesSearch =
      donorName.toLowerCase().includes(search.toLowerCase()) ||
      foodTitle.toLowerCase().includes(search.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Donation Requests"
        description="Track the status of all surplus food claim requests submitted by your charity to local donor kitchens."
        badge="Recipient Portal"
        actions={
          <Link
            to="/explore"
            className="px-4 py-2.5 rounded-xl bg-forest hover:bg-forest-light text-white font-semibold text-xs flex items-center gap-2 shadow-xs transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Discover Surplus Food</span>
          </Link>
        }
      />

      {feedback && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Filter Tabs & Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {[
            { id: 'all', label: 'All Requests', count: requests.length },
            { id: 'pending', label: 'Pending Review', count: requests.filter((r) => r.status === 'pending').length },
            { id: 'approved', label: 'Approved', count: requests.filter((r) => r.status === 'approved').length },
            { id: 'rejected', label: 'Rejected', count: requests.filter((r) => r.status === 'rejected').length },
            { id: 'cancelled', label: 'Cancelled', count: requests.filter((r) => r.status === 'cancelled').length }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                filter === tab.id
                  ? 'bg-forest text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  filter === tab.id ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                }`}
              >
                {tab.count}
              </span>
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
              placeholder="Search request..."
              className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest"
            />
          </div>
          <button
            onClick={fetchRequests}
            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors shrink-0"
            title="Refresh requests"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Requests List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[40vh] space-y-3">
          <div className="w-8 h-8 border-3 border-forest border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-500 font-medium">Loading your donation requests...</p>
        </div>
      ) : filteredRequests.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title="No requests found"
          description={
            filter !== 'all' || search
              ? 'No requests match your current filters.'
              : 'Your shelter has not submitted any food claim requests yet. Explore available surplus food nearby and claim batches for your center.'
          }
          actionLabel="Find Available Food"
          actionTo="/explore"
        />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50/80 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">Surplus Batch</th>
                  <th className="py-3 px-4">Donor Kitchen</th>
                  <th className="py-3 px-4">Quantity Claimed</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Requested On</th>
                  <th className="py-3 px-4 text-right">Logistics / Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRequests.map((r) => (
                  <tr key={r._id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4">
                      <p className="font-bold text-slate-900">{r.listingId?.title || 'Food Listing'}</p>
                      <span className="text-[10px] text-slate-400 capitalize">
                        {r.listingId?.category?.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-800">
                        {r.donorId?.organizationDetails?.orgName || r.donorId?.name}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {r.donorId?.phone || 'No phone'}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-forest text-sm">
                        {r.requestedQuantity} {r.unit}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Feeds ~{r.peopleToFeed} people
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={r.status} />
                      {r.rejectionReason && (
                        <p className="text-[10px] text-rose-600 mt-1 max-w-xs truncate">
                          Reason: {r.rejectionReason}
                        </p>
                      )}
                    </td>
                    <td className="py-3 px-4 text-[11px] text-slate-500">
                      {new Date(r.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {r.status === 'approved' ? (
                          <Link
                            to="/recipient/pickups"
                            className="px-3 py-1.5 rounded-xl bg-teal-50 text-teal-800 hover:bg-teal-100 font-semibold text-xs transition-colors flex items-center gap-1"
                          >
                            <Key className="w-3.5 h-3.5 text-teal-600" />
                            <span>View Pickup PIN</span>
                          </Link>
                        ) : r.status === 'pending' ? (
                          <button
                            onClick={() => setRequestToCancel(r)}
                            className="px-2.5 py-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 text-xs font-medium transition-colors"
                            title="Cancel request"
                          >
                            Cancel
                          </button>
                        ) : (
                          <span className="text-[11px] text-slate-400">Closed</span>
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

      {/* Cancel Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(requestToCancel)}
        onClose={() => setRequestToCancel(null)}
        onConfirm={handleCancelRequest}
        title="Cancel Donation Claim"
        message={`Are you sure you want to cancel your request for "${requestToCancel?.listingId?.title}"? The reserved quantity will be returned to the donor.`}
        confirmText="Yes, Cancel Request"
        confirmVariant="danger"
        loading={actionLoading}
      />
    </div>
  );
};

export default RecipientRequestsPage;
