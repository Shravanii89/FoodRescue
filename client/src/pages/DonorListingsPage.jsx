import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../api/apiClient';
import PageHeader from '../components/PageHeader';
import StatusBadge from '../components/StatusBadge';
import ExpiryBadge from '../components/ExpiryBadge';
import EmptyState from '../components/EmptyState';
import ConfirmModal from '../components/ConfirmModal';
import {
  PlusCircle,
  Search,
  Filter,
  Edit,
  Trash2,
  Eye,
  Utensils,
  Clock,
  MapPin,
  ThermometerSnowflake,
  RefreshCw
} from 'lucide-react';

const DonorListingsPage = () => {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [listingToCancel, setListingToCancel] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [feedback, setFeedback] = useState('');

  const fetchListings = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/listings/my');
      if (res.data?.data) {
        setListings(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch donor listings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchListings();
  }, []);

  const handleCancelConfirm = async () => {
    if (!listingToCancel) return;
    try {
      setActionLoading(true);
      await apiClient.delete(`/listings/${listingToCancel._id}`);
      setFeedback('Listing cancelled successfully.');
      setTimeout(() => setFeedback(''), 4000);
      setListingToCancel(null);
      fetchListings();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to cancel listing.');
    } finally {
      setActionLoading(false);
    }
  };

  // Filter listings
  const filteredListings = listings.filter((l) => {
    const matchesSearch =
      l.title.toLowerCase().includes(search.toLowerCase()) ||
      l.pickupAddress?.toLowerCase().includes(search.toLowerCase()) ||
      l.category?.toLowerCase().includes(search.toLowerCase());

    const matchesStatus =
      statusFilter === 'all' ? true : l.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Food Listings"
        description="Manage your active surplus food postings, update stock quantities, and track claim availability."
        badge="Donor Portal"
        actions={
          <Link
            to="/listings/create"
            className="px-4 py-2.5 rounded-xl bg-forest hover:bg-forest-light text-white font-semibold text-xs flex items-center gap-2 shadow-xs transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add Food Donation</span>
          </Link>
        }
      />

      {feedback && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800">
          {feedback}
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
            placeholder="Search by food name or address..."
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
            <option value="cancelled">Cancelled</option>
            <option value="expired">Expired</option>
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

      {/* Listings Table / Cards */}
      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[40vh] space-y-3">
          <div className="w-8 h-8 border-3 border-forest border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-500 font-medium">Loading food listings...</p>
        </div>
      ) : filteredListings.length === 0 ? (
        <EmptyState
          icon={Utensils}
          title="No food listings found"
          description={
            search || statusFilter !== 'all'
              ? 'No listings match your search filters. Try clearing filters to see all donations.'
              : 'You have not published any surplus food listings yet. Donate surplus meals to local NGOs and food banks.'
          }
          actionLabel={search || statusFilter !== 'all' ? 'Reset Filters' : 'Post Your First Listing'}
          onAction={search || statusFilter !== 'all' ? () => { setSearch(''); setStatusFilter('all'); } : undefined}
          actionTo={search || statusFilter !== 'all' ? undefined : '/listings/create'}
        />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50/80 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">Food Item</th>
                  <th className="py-3 px-4">Available / Total</th>
                  <th className="py-3 px-4">Expiry Time</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Pickup Location</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredListings.map((item) => (
                  <tr key={item._id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-start gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-forest/10 text-forest-light flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs">
                          <Utensils className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 line-clamp-1">{item.title}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] text-slate-400 capitalize">
                              {item.category?.replace('_', ' ')}
                            </span>
                            {item.isRefrigerationRequired && (
                              <span className="flex items-center gap-0.5 text-[9px] font-medium text-sky-700 bg-sky-50 px-1.5 py-0.2 rounded">
                                <ThermometerSnowflake className="w-2.5 h-2.5" />
                                Refrig
                              </span>
                            )}
                          </div>
                        </div>
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
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1 text-[11px] text-slate-500 max-w-xs truncate">
                        <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="truncate">{item.pickupAddress}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          to={`/listings/${item._id}`}
                          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                          title="View public preview"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        {item.status !== 'cancelled' && item.status !== 'expired' && (
                          <Link
                            to={`/listings/edit/${item._id}`}
                            className="p-1.5 text-forest hover:text-forest-light hover:bg-forest/10 rounded-lg transition-colors"
                            title="Edit listing details"
                          >
                            <Edit className="w-4 h-4" />
                          </Link>
                        )}
                        {item.status === 'available' && (
                          <button
                            onClick={() => setListingToCancel(item)}
                            className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Cancel listing"
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
        title="Cancel Food Listing"
        message={`Are you sure you want to cancel "${listingToCancel?.title}"? This will remove the surplus batch from the public food discovery feed.`}
        confirmText="Yes, Cancel Listing"
        confirmVariant="danger"
        loading={actionLoading}
      />
    </div>
  );
};

export default DonorListingsPage;
