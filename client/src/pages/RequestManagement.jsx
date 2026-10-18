import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../api/apiClient';
import { useAuth } from '../context/AuthContext';
import {
  Inbox,
  CheckCircle2,
  XCircle,
  Clock,
  Truck,
  Building2,
  MapPin,
  Calendar,
  AlertCircle
} from 'lucide-react';
import StatusBadge from '../components/StatusBadge';
import ConfirmModal from '../components/ConfirmModal';

const RequestManagement = () => {
  const { user } = useAuth();
  const isDonor = user?.role === 'donor';
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');

  // Modal actions
  const [selectedReq, setSelectedReq] = useState(null);
  const [actionType, setActionType] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [modalLoading, setModalLoading] = useState(false);
  const [feedback, setFeedback] = useState('');

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const endpoint = isDonor ? '/requests/donor' : '/requests/my';
      const res = await apiClient.get(endpoint);
      if (res.data?.data) {
        setRequests(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch donation requests:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [isDonor]);

  const handleActionConfirm = async () => {
    if (!selectedReq || !actionType) return;
    setModalLoading(true);

    try {
      const res = await apiClient.put(`/requests/${selectedReq._id}/status`, {
        status: actionType === 'approve' ? 'approved' : 'rejected',
        rejectionReason: actionType === 'reject' ? rejectionReason : ''
      });

      if (res.data?.success) {
        setFeedback(`Request successfully marked as ${actionType === 'approve' ? 'approved' : 'rejected'}.`);
        setTimeout(() => setFeedback(''), 4000);
        setSelectedReq(null);
        setActionType(null);
        setRejectionReason('');
        fetchRequests();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Action failed.');
    } finally {
      setModalLoading(false);
    }
  };

  const filteredRequests = requests.filter((r) => {
    if (filterStatus === 'all') return true;
    return r.status === filterStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <Inbox className="w-6 h-6 text-brand-600" />
            <span>Donation Requests Management</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {isDonor
              ? 'Review and approve surplus food claims submitted by verified charities'
              : 'Track the status and pickup arrangements of your organization claims'}
          </p>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-2xl text-xs font-semibold">
          {['all', 'pending', 'approved', 'rejected', 'completed'].map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1.5 rounded-xl capitalize transition-all ${
                filterStatus === st
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {feedback && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-semibold text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {loading ? (
        <div className="py-20 text-center">
          <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-slate-500">Loading donation requests...</p>
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80">
          <Inbox className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-800">No requests found</h3>
          <p className="text-xs text-slate-500 mt-1">There are no donation requests in this category.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredRequests.map((req) => (
            <div
              key={req._id}
              className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                {/* Header */}
                <div className="flex items-start justify-between gap-2 pb-3 border-b border-slate-100">
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">{req.listingId?.title}</h3>
                    <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                      <Building2 className="w-3.5 h-3.5 text-slate-400" />
                      <span>
                        {isDonor
                          ? (req.recipientId?.organizationDetails?.orgName || req.recipientId?.name)
                          : (req.donorId?.organizationDetails?.orgName || req.donorId?.name)}
                      </span>
                    </p>
                  </div>
                  <StatusBadge status={req.status} />
                </div>

                {/* Details Grid */}
                <div className="mt-4 grid grid-cols-2 gap-3 text-xs text-slate-600">
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Claim Quantity</span>
                    <span className="font-extrabold text-brand-700 text-sm">
                      {req.requestedQuantity} {req.unit}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">People Fed</span>
                    <span className="font-bold text-emerald-700 text-sm">
                      ~{req.peopleToFeed} individuals
                    </span>
                  </div>

                  <div className="col-span-2 text-[11px] text-slate-500 space-y-1">
                    <p className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>
                        Proposed Pickup: {new Date(req.pickupDetails?.proposedTime).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                      </span>
                    </p>
                    <p className="flex items-center gap-1.5">
                      <Truck className="w-3.5 h-3.5 text-slate-400" />
                      <span className="capitalize">Transport: {req.pickupDetails?.vehicleType || 'Van'}</span>
                    </p>
                  </div>
                </div>

                {req.message && (
                  <p className="mt-3 text-xs italic text-slate-600 bg-emerald-50/50 p-2.5 rounded-xl border border-emerald-100/60">
                    "{req.message}"
                  </p>
                )}

                {req.status === 'rejected' && req.rejectionReason && (
                  <p className="mt-3 text-xs text-rose-700 bg-rose-50 p-2.5 rounded-xl border border-rose-200">
                    <strong>Rejection note:</strong> {req.rejectionReason}
                  </p>
                )}
              </div>

              {/* Bottom Actions */}
              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[10px] text-slate-400">
                  {new Date(req.createdAt).toLocaleDateString()}
                </span>

                <div className="flex items-center gap-2">
                  {isDonor && req.status === 'pending' && (
                    <>
                      <button
                        onClick={() => {
                          setSelectedReq(req);
                          setActionType('reject');
                        }}
                        className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-rose-50 hover:text-rose-700 text-xs font-semibold transition-colors"
                      >
                        Reject
                      </button>
                      <button
                        onClick={() => {
                          setSelectedReq(req);
                          setActionType('approve');
                        }}
                        className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs"
                      >
                        Approve Claim
                      </button>
                    </>
                  )}

                  {req.status === 'approved' && (
                    <Link
                      to="/pickups"
                      className="px-4 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold transition-colors flex items-center gap-1.5"
                    >
                      <Truck className="w-3.5 h-3.5" />
                      <span>Track Pickup / PIN</span>
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(selectedReq && actionType)}
        onClose={() => {
          setSelectedReq(null);
          setActionType(null);
          setRejectionReason('');
        }}
        onConfirm={handleActionConfirm}
        title={actionType === 'approve' ? 'Approve Donation Claim' : 'Reject Donation Claim'}
        message={
          actionType === 'approve'
            ? `Confirm approval for ${selectedReq?.requestedQuantity} ${selectedReq?.unit}. A secure pickup OTP verification PIN will be generated immediately.`
            : `Are you sure you want to reject this request? The claimed quantity will be released back to your available stock.`
        }
        confirmText={actionType === 'approve' ? 'Approve & Create Pickup' : 'Confirm Rejection'}
        variant={actionType === 'approve' ? 'success' : 'danger'}
        isLoading={modalLoading}
      />
    </div>
  );
};

export default RequestManagement;
