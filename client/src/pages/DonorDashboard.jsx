import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../api/apiClient';
import { useAuth } from '../context/AuthContext';
import {
  Utensils,
  PlusCircle,
  Clock,
  Inbox,
  Truck,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Eye,
  Trash2,
  Edit,
  ArrowRight
} from 'lucide-react';
import StatCard from '../components/StatCard';
import ExpiryBadge from '../components/ExpiryBadge';
import StatusBadge from '../components/StatusBadge';
import ConfirmModal from '../components/ConfirmModal';

const DonorDashboard = () => {
  const { user } = useAuth();
  const [listings, setListings] = useState([]);
  const [requests, setRequests] = useState([]);
  const [pickups, setPickups] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal actions state
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [actionType, setActionType] = useState(null); // 'approve' | 'reject'
  const [rejectionReason, setRejectionReason] = useState('');
  const [modalLoading, setModalLoading] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState('');

  const fetchDonorData = async () => {
    try {
      setLoading(true);
      const [listingsRes, requestsRes, pickupsRes] = await Promise.all([
        apiClient.get('/listings/my'),
        apiClient.get('/requests/donor'),
        apiClient.get('/pickups/my')
      ]);

      if (listingsRes.data?.data) setListings(listingsRes.data.data);
      if (requestsRes.data?.data) setRequests(requestsRes.data.data);
      if (pickupsRes.data?.data) setPickups(pickupsRes.data.data);
    } catch (err) {
      console.error('Failed to load donor dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDonorData();
  }, []);

  const handleRequestStatus = async () => {
    if (!selectedRequest || !actionType) return;
    setModalLoading(true);

    try {
      const res = await apiClient.put(`/requests/${selectedRequest._id}/status`, {
        status: actionType === 'approve' ? 'approved' : 'rejected',
        rejectionReason: actionType === 'reject' ? rejectionReason : ''
      });

      if (res.data?.success) {
        setFeedbackMsg(`Request successfully ${actionType === 'approve' ? 'approved! Pickup scheduled' : 'rejected'}.`);
        setTimeout(() => setFeedbackMsg(''), 4000);
        setSelectedRequest(null);
        setActionType(null);
        setRejectionReason('');
        fetchDonorData();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Action failed.');
    } finally {
      setModalLoading(false);
    }
  };

  const handleCancelListing = async (listingId) => {
    if (!window.confirm('Are you sure you want to cancel this surplus food listing?')) return;
    try {
      await apiClient.delete(`/listings/${listingId}`);
      fetchDonorData();
    } catch (err) {
      alert(err.response?.data?.message || 'Could not cancel listing.');
    }
  };

  // Compute metrics
  const activeListingsCount = listings.filter((l) => l.status === 'available' || l.status === 'partially_claimed').length;
  const totalMealsRescued = listings.reduce((acc, l) => acc + (l.quantity - l.remainingQuantity), 0);
  const pendingRequests = requests.filter((r) => r.status === 'pending');
  const scheduledPickups = pickups.filter((p) => p.status === 'scheduled');

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800">
              Donor Portal
            </span>
            <span className="text-xs text-slate-400">• Verified Kitchen</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
            {user?.organizationDetails?.orgName || user?.name}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage surplus listings, approve community requests, and coordinate pickup logistics.
          </p>
        </div>

        <Link
          to="/listings/create"
          className="px-4 py-2.5 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md shadow-brand-500/20 transition-all flex items-center justify-center gap-2 shrink-0"
        >
          <PlusCircle className="w-4 h-4" />
          <span>List Surplus Food</span>
        </Link>
      </div>

      {feedbackMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-semibold text-emerald-800 flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{feedbackMsg}</span>
        </div>
      )}

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Active Listings"
          value={activeListingsCount}
          subtitle="Ready for pickup"
          icon={Utensils}
          color="emerald"
        />
        <StatCard
          title="Meals Rescued"
          value={totalMealsRescued}
          subtitle="Distributed to charities"
          icon={CheckCircle2}
          color="blue"
        />
        <StatCard
          title="Pending Requests"
          value={pendingRequests.length}
          subtitle="Requires your approval"
          icon={Inbox}
          color={pendingRequests.length > 0 ? 'amber' : 'emerald'}
        />
        <StatCard
          title="Scheduled Pickups"
          value={scheduledPickups.length}
          subtitle="En route or today"
          icon={Truck}
          color="purple"
        />
      </div>

      {/* Pending Donation Requests to Review */}
      {pendingRequests.length > 0 && (
        <div className="bg-amber-50/70 border border-amber-200/80 rounded-3xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping" />
              <h2 className="text-base font-bold text-slate-900">
                Action Required: Pending Donation Claims ({pendingRequests.length})
              </h2>
            </div>
            <Link to="/requests" className="text-xs font-bold text-amber-900 hover:underline">
              View All
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingRequests.map((req) => (
              <div
                key={req._id}
                className="bg-white p-5 rounded-2xl border border-amber-200 shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-bold text-slate-900 text-sm">
                        {req.recipientId?.organizationDetails?.orgName || req.recipientId?.name}
                      </p>
                      <p className="text-[11px] text-slate-500">{req.listingId?.title}</p>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                      Pending
                    </span>
                  </div>

                  <div className="mt-3 pt-2 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs text-slate-600">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Claim Quantity:</span>
                      <span className="font-bold text-slate-900">
                        {req.requestedQuantity} {req.unit}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">People Fed:</span>
                      <span className="font-bold text-emerald-700">~{req.peopleToFeed} individuals</span>
                    </div>
                  </div>

                  {req.message && (
                    <p className="mt-2 text-xs italic text-slate-600 bg-slate-50 p-2 rounded-xl">
                      "{req.message}"
                    </p>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                  <button
                    onClick={() => {
                      setSelectedRequest(req);
                      setActionType('reject');
                    }}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-rose-50 hover:text-rose-700 text-slate-600 text-xs font-semibold transition-colors"
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => {
                      setSelectedRequest(req);
                      setActionType('approve');
                    }}
                    className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs"
                  >
                    Approve Claim
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active Listings Section */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">My Surplus Food Listings</h2>
            <p className="text-xs text-slate-500">Live batches created from your kitchen</p>
          </div>
          <Link
            to="/listings/create"
            className="text-xs font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1"
          >
            <span>+ Add Batch</span>
          </Link>
        </div>

        {listings.length === 0 ? (
          <div className="py-12 text-center">
            <Utensils className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-xs font-bold text-slate-600">No surplus food listings created yet.</p>
            <p className="text-[11px] text-slate-400 mt-1">Post your evening or buffet surplus to connect with local shelters.</p>
            <Link
              to="/listings/create"
              className="inline-block mt-4 px-4 py-2 rounded-xl bg-brand-600 text-white font-bold text-xs shadow-xs"
            >
              Create First Listing
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">
                <tr>
                  <th className="py-3 px-3">Food Item</th>
                  <th className="py-3 px-3">Category</th>
                  <th className="py-3 px-3">Available / Total</th>
                  <th className="py-3 px-3">Expiry Countdown</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {listings.map((l) => (
                  <tr key={l._id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-3">
                      <p className="font-bold text-slate-900">{l.title}</p>
                      <span className="text-[10px] text-slate-400 capitalize">{l.dietaryType}</span>
                    </td>
                    <td className="py-3 px-3 capitalize">
                      {l.category?.replace('_', ' ')}
                    </td>
                    <td className="py-3 px-3 font-semibold text-slate-900">
                      <span className="text-brand-700">{l.remainingQuantity}</span> / {l.quantity} {l.unit}
                    </td>
                    <td className="py-3 px-3">
                      <ExpiryBadge expiryTime={l.expiryTime} />
                    </td>
                    <td className="py-3 px-3">
                      <StatusBadge status={l.status} />
                    </td>
                    <td className="py-3 px-3 text-right space-x-1">
                      <Link
                        to={`/listings/${l._id}`}
                        className="p-1.5 text-slate-400 hover:text-brand-600 hover:bg-slate-100 rounded-lg inline-block transition-colors"
                        title="View details"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>
                      <Link
                        to={`/listings/edit/${l._id}`}
                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded-lg inline-block transition-colors"
                        title="Edit listing"
                      >
                        <Edit className="w-4 h-4" />
                      </Link>
                      {l.status === 'available' && (
                        <button
                          onClick={() => handleCancelListing(l._id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg inline-block transition-colors"
                          title="Cancel listing"
                        >
                          <Trash2 className="w-4 h-4" />
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

      {/* Confirmation Modal for Request Approval / Rejection */}
      <ConfirmModal
        isOpen={Boolean(selectedRequest && actionType)}
        onClose={() => {
          setSelectedRequest(null);
          setActionType(null);
          setRejectionReason('');
        }}
        onConfirm={handleRequestStatus}
        title={actionType === 'approve' ? 'Approve Donation Claim' : 'Reject Donation Claim'}
        message={
          actionType === 'approve'
            ? `Confirm approval of ${selectedRequest?.requestedQuantity} ${selectedRequest?.unit} for "${selectedRequest?.recipientId?.organizationDetails?.orgName || selectedRequest?.recipientId?.name}". A secure pickup OTP will be generated.`
            : `Reject this claim request. The reserved stock (${selectedRequest?.requestedQuantity} ${selectedRequest?.unit}) will be released back to your available surplus.`
        }
        confirmText={actionType === 'approve' ? 'Approve & Schedule' : 'Confirm Rejection'}
        variant={actionType === 'approve' ? 'success' : 'danger'}
        isLoading={modalLoading}
      />
    </div>
  );
};

export default DonorDashboard;
