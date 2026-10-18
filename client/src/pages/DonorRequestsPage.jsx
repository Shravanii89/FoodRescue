import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../api/apiClient';
import PageHeader from '../components/PageHeader';
import StatusBadge from '../components/StatusBadge';
import EmptyState from '../components/EmptyState';
import ConfirmModal from '../components/ConfirmModal';
import {
  Inbox,
  CheckCircle2,
  XCircle,
  Clock,
  Building2,
  Phone,
  Truck,
  Users,
  Search,
  RefreshCw,
  AlertCircle
} from 'lucide-react';

const DonorRequestsPage = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  
  // Action Modal State
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [actionType, setActionType] = useState(null); // 'approve' | 'reject'
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [feedback, setFeedback] = useState('');

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/requests/donor');
      if (res.data?.data) {
        setRequests(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch donor requests:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleStatusSubmit = async () => {
    if (!selectedRequest || !actionType) return;
    try {
      setActionLoading(true);
      const res = await apiClient.put(`/requests/${selectedRequest._id}/status`, {
        status: actionType === 'approve' ? 'approved' : 'rejected',
        rejectionReason: actionType === 'reject' ? rejectionReason : ''
      });

      if (res.data?.success) {
        setFeedback(
          actionType === 'approve'
            ? 'Donation claim approved! A pickup record has been scheduled with a verification PIN.'
            : 'Donation claim has been rejected and reserved stock returned to availability.'
        );
        setTimeout(() => setFeedback(''), 5000);
        setSelectedRequest(null);
        setActionType(null);
        setRejectionReason('');
        fetchRequests();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update request.');
    } finally {
      setActionLoading(false);
    }
  };

  const filteredRequests = requests.filter((r) => {
    const matchesFilter = filter === 'all' ? true : r.status === filter;
    const recipientName = r.recipientId?.organizationDetails?.orgName || r.recipientId?.name || '';
    const foodTitle = r.listingId?.title || '';
    const matchesSearch =
      recipientName.toLowerCase().includes(search.toLowerCase()) ||
      foodTitle.toLowerCase().includes(search.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  const pendingCount = requests.filter((r) => r.status === 'pending').length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Incoming Donation Requests"
        description="Review, approve, and manage food claim requests submitted by registered community shelters and charities."
        badge="Logistics Portal"
      />

      {feedback && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Filter Tabs & Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {[
            { id: 'all', label: 'All Requests', count: requests.length },
            { id: 'pending', label: 'Pending Review', count: pendingCount, highlight: pendingCount > 0 },
            { id: 'approved', label: 'Approved', count: requests.filter((r) => r.status === 'approved').length },
            { id: 'rejected', label: 'Rejected', count: requests.filter((r) => r.status === 'rejected').length }
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
                  filter === tab.id
                    ? 'bg-white/20 text-white'
                    : tab.highlight
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-slate-200 text-slate-700'
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
              placeholder="Search NGO or food..."
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
          <p className="text-xs text-slate-500 font-medium">Loading incoming requests...</p>
        </div>
      ) : filteredRequests.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title="No donation requests found"
          description={
            filter !== 'all' || search
              ? 'No requests match your current filters. Try switching tabs to view all incoming requests.'
              : 'You do not have any incoming food donation requests at the moment. As local NGOs discover your surplus food, requests will appear here.'
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredRequests.map((req) => (
            <div
              key={req._id}
              className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:shadow-md transition-shadow"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge status={req.status} />
                    <span className="text-[11px] text-slate-400">
                      Requested {new Date(req.createdAt).toLocaleString()}
                    </span>
                    {req.recipientId?.verificationStatus === 'verified' && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                        Verified Charity
                      </span>
                    )}
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      {req.requestedQuantity} {req.unit} of "{req.listingId?.title || 'Food Batch'}"
                    </h3>
                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 mt-1">
                      <span className="flex items-center gap-1 font-semibold text-slate-800">
                        <Building2 className="w-3.5 h-3.5 text-slate-400" />
                        {req.recipientId?.organizationDetails?.orgName || req.recipientId?.name}
                      </span>
                      <span className="flex items-center gap-1 text-slate-500">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        {req.pickupDetails?.contactPhone || req.recipientId?.phone || 'Not provided'}
                      </span>
                      <span className="flex items-center gap-1 font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                        <Users className="w-3.5 h-3.5" />
                        Feeds ~{req.peopleToFeed} people
                      </span>
                      <span className="flex items-center gap-1 text-slate-500">
                        <Truck className="w-3.5 h-3.5 text-slate-400" />
                        Vehicle: {req.pickupDetails?.vehicleType || 'Standard'}
                      </span>
                    </div>
                  </div>

                  {req.message && (
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-600 italic">
                      "{req.message}"
                    </div>
                  )}

                  {req.rejectionReason && (
                    <div className="p-3 rounded-xl bg-rose-50 border border-rose-100 text-xs text-rose-800 font-medium">
                      Rejection Reason: {req.rejectionReason}
                    </div>
                  )}
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-2 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                  {req.status === 'pending' ? (
                    <>
                      <button
                        onClick={() => {
                          setSelectedRequest(req);
                          setActionType('approve');
                        }}
                        className="px-4 py-2 rounded-xl bg-forest hover:bg-forest-light text-white font-semibold text-xs transition-colors shadow-xs flex items-center gap-1.5"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Approve Request</span>
                      </button>
                      <button
                        onClick={() => {
                          setSelectedRequest(req);
                          setActionType('reject');
                        }}
                        className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-slate-700 font-semibold text-xs transition-colors flex items-center gap-1.5"
                      >
                        <XCircle className="w-4 h-4" />
                        <span>Reject</span>
                      </button>
                    </>
                  ) : req.status === 'approved' ? (
                    <Link
                      to="/donor/pickups"
                      className="px-4 py-2 rounded-xl bg-teal-50 text-teal-800 hover:bg-teal-100 font-semibold text-xs transition-colors flex items-center gap-1.5"
                    >
                      <Truck className="w-4 h-4" />
                      <span>Track Pickup</span>
                    </Link>
                  ) : (
                    <span className="text-xs text-slate-400">Processed</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Confirmation & Status Update Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-xl border border-slate-100 space-y-4">
            <h3 className="text-base font-bold text-slate-900">
              {actionType === 'approve' ? 'Approve Donation Request' : 'Reject Donation Request'}
            </h3>
            
            <p className="text-xs text-slate-600 leading-relaxed">
              {actionType === 'approve'
                ? `Approve ${selectedRequest.requestedQuantity} ${selectedRequest.unit} for "${selectedRequest.recipientId?.organizationDetails?.orgName || selectedRequest.recipientId?.name}". A secure pickup record with OTP handover code will be generated.`
                : `Reject request for "${selectedRequest.listingId?.title}". The reserved quantity will be returned to your surplus stock.`}
            </p>

            {actionType === 'reject' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Reason for Rejection *
                </label>
                <textarea
                  rows={3}
                  required
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="e.g., Food batch was consumed internally or logistics window passed..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                />
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setSelectedRequest(null);
                  setActionType(null);
                  setRejectionReason('');
                }}
                disabled={actionLoading}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleStatusSubmit}
                disabled={actionLoading || (actionType === 'reject' && !rejectionReason.trim())}
                className={`px-4 py-2 rounded-xl text-xs font-semibold text-white transition-colors shadow-xs ${
                  actionType === 'approve'
                    ? 'bg-forest hover:bg-forest-light'
                    : 'bg-rose-600 hover:bg-rose-700'
                } disabled:opacity-50`}
              >
                {actionLoading ? 'Processing...' : actionType === 'approve' ? 'Confirm Approval' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DonorRequestsPage;
