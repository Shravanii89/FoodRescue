import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../api/apiClient';
import PageHeader from '../components/PageHeader';
import StatusBadge from '../components/StatusBadge';
import ExpiryBadge from '../components/ExpiryBadge';
import EmptyState from '../components/EmptyState';
import ConfirmModal from '../components/ConfirmModal';
import {
  Utensils,
  Search,
  Filter,
  RefreshCw,
  Trash2,
  Eye,
  Building2,
  Clock,
  Sparkles,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';

const AdminListingsPage = () => {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  const [listingToCancel, setListingToCancel] = useState(null);
  const [cleanupLoading, setCleanupLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [feedback, setFeedback] = useState('');

  const fetchListings = async () => {
    try {
      setLoading(true);
      const url = statusFilter === 'all'
        ? '/listings?limit=50'
        : `/listings?status=${statusFilter}&limit=50`;
      const res = await apiClient.get(url);
      if (res.data?.data) {
        setListings(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load listings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchListings();
  }, [statusFilter]);

  const handleRunCleanup = async () => {
    try {
      setCleanupLoading(true);
      const res = await apiClient.post('/admin/expired-listings/cleanup');
      setFeedback(`System cleanup complete: ${res.data?.message || 'Expired listings updated.'}`);
      setTimeout(() => setFeedback(''), 5000);
      fetchListings();
    } catch (err) {
      alert(err.response?.data?.message || 'Cleanup pipeline failed.');
    } finally {
      setCleanupLoading(false);
    }
  };

  const handleCancelConfirm = async () => {
    if (!listingToCancel) return;
    try {
      setActionLoading(true);
      await apiClient.delete(`/listings/${listingToCancel._id}`);
      setFeedback(`Listing "${listingToCancel.title}" was cancelled.`);
      setTimeout(() => setFeedback(''), 4000);
      setListingToCancel(null);
      fetchListings();
    } catch (err) {
      alert(err.response?.data?.message || 'Cancellation failed.');
    } finally {
      setActionLoading(false);
    }
  };

  const filteredListings = listings.filter((l) => {
    const title = l.title || '';
    const donor = l.donorId?.organizationDetails?.orgName || l.donorId?.name || '';
    return (
      title.toLowerCase().includes(search.toLowerCase()) ||
      donor.toLowerCase().includes(search.toLowerCase())
    );
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Food Listings Administration"
        description="Monitor all surplus food postings across the platform, verify food categories, and trigger automated expiry cleanup pipelines."
        badge="Platform Inventory"
        actions={
          <button
            onClick={handleRunCleanup}
            disabled={cleanupLoading}
            className="px-4 py-2.5 rounded-xl bg-forest hover:bg-forest-light text-white font-semibold text-xs flex items-center gap-2 shadow-xs transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${cleanupLoading ? 'animate-spin' : ''}`} />
            <span>{cleanupLoading ? 'Cleaning Database...' : 'Run Expiry Cleanup'}</span>
          </button>
        }
      />

      {feedback && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search food item or donor..."
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest"
          >
            <option value="all">All Statuses</option>
            <option value="available">Available</option>
            <option value="partially_claimed">Partially Claimed</option>
            <option value="claimed">Fully Claimed</option>
            <option value="expired">Expired</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <button
            onClick={fetchListings}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
            title="Refresh listings"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[40vh] space-y-3">
          <div className="w-8 h-8 border-3 border-forest border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-500 font-medium">Loading platform food listings...</p>
        </div>
      ) : filteredListings.length === 0 ? (
        <EmptyState
          icon={Utensils}
          title="No food listings found"
          description="No food listings match your current search and status filters."
        />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50/80 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">Food Item</th>
                  <th className="py-3 px-4">Donor Kitchen</th>
                  <th className="py-3 px-4">Stock Quantity</th>
                  <th className="py-3 px-4">Expiry Time</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredListings.map((item) => (
                  <tr key={item._id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4">
                      <p className="font-bold text-slate-900">{item.title}</p>
                      <span className="text-[10px] text-slate-400 capitalize">
                        {item.category?.replace('_', ' ')} • {item.dietaryType}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-800">
                        {item.donorId?.organizationDetails?.orgName || item.donorId?.name}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {item.donorId?.phone || 'No phone'}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-forest text-sm">
                        {item.remainingQuantity}
                      </span>
                      <span className="text-slate-400 text-[11px]"> / {item.quantity} {item.unit}</span>
                    </td>
                    <td className="py-3 px-4">
                      <ExpiryBadge expiryTime={item.expiryTime} />
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={item.status} />
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          to={`/listings/${item._id}`}
                          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                          title="View preview"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        {item.status !== 'cancelled' && item.status !== 'expired' && (
                          <button
                            onClick={() => setListingToCancel(item)}
                            className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Force cancel listing"
                          >
                            <Trash2 className="w-4 h-4" />
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

      {/* Cancel Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(listingToCancel)}
        onClose={() => setListingToCancel(null)}
        onConfirm={handleCancelConfirm}
        title="Administrative Listing Cancellation"
        message={`Are you sure you want to cancel "${listingToCancel?.title}"? This administrative action immediately pulls the listing from public feeds.`}
        confirmText="Confirm Cancellation"
        confirmVariant="danger"
        loading={actionLoading}
      />
    </div>
  );
};

export default AdminListingsPage;
