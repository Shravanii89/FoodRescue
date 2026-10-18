import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../api/apiClient';
import { useAuth } from '../context/AuthContext';
import {
  Utensils,
  PlusCircle,
  Inbox,
  Truck,
  CheckCircle2,
  Clock,
  ArrowRight,
  Eye,
  Building2,
  Users,
  AlertCircle
} from 'lucide-react';
import StatCard from '../components/StatCard';
import ExpiryBadge from '../components/ExpiryBadge';
import StatusBadge from '../components/StatusBadge';
import EmptyState from '../components/EmptyState';

const DonorDashboard = () => {
  const { user } = useAuth();
  const [listings, setListings] = useState([]);
  const [requests, setRequests] = useState([]);
  const [pickups, setPickups] = useState([]);
  const [loading, setLoading] = useState(true);

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

  // Compute metrics from real database records
  const totalListingsPosted = listings.length;
  const availableListingsCount = listings.filter((l) => l.status === 'available' || l.status === 'partially_claimed').length;
  const pendingRequestsCount = requests.filter((r) => r.status === 'pending').length;
  const approvedRequestsCount = requests.filter((r) => r.status === 'approved').length;
  const completedDonationsCount = pickups.filter((p) => p.status === 'completed').length;
  const totalMealsClaimed = listings.reduce((acc, l) => acc + (l.quantity - l.remainingQuantity), 0);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <div className="w-10 h-10 border-4 border-forest border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-semibold text-slate-500">Loading donor operations dashboard...</p>
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
              Donor Center
            </span>
            <span className="text-xs text-slate-400 capitalize">• {user?.organizationDetails?.orgType || 'Food Donor'}</span>
          </div>

          <h1 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
            {user?.organizationDetails?.orgName || user?.name}
          </h1>

          <p className="text-xs text-slate-500 mt-0.5">
            Pickup Hub: {user?.location?.address || 'Bengaluru, Karnataka'}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            to="/listings/create"
            className="px-4 py-2.5 rounded-2xl bg-forest hover:bg-forest-light text-white font-bold text-xs shadow-md shadow-forest/20 transition-all flex items-center gap-2 shrink-0"
          >
            <PlusCircle className="w-4 h-4 text-emerald-300" />
            <span>Add Food Donation</span>
          </Link>
          <Link
            to="/donor/listings"
            className="px-4 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-colors shrink-0"
          >
            Manage Listings
          </Link>
        </div>
      </div>

      {pendingRequestsCount > 0 && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <p className="font-bold">You have {pendingRequestsCount} pending food claim request(s)!</p>
              <p className="text-[11px] text-amber-800">
                Local charities are waiting for your approval to collect surplus batches.
              </p>
            </div>
          </div>
          <Link
            to="/donor/requests"
            className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs whitespace-nowrap transition-colors"
          >
            Review Requests
          </Link>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        <StatCard
          title="Donations Posted"
          value={totalListingsPosted}
          subtitle="All surplus batches"
          icon={Utensils}
          color="emerald"
        />
        <StatCard
          title="Active Available"
          value={availableListingsCount}
          subtitle="Available for claim"
          icon={PlusCircle}
          color="blue"
        />
        <StatCard
          title="Pending Requests"
          value={pendingRequestsCount}
          subtitle="Awaiting your review"
          icon={Inbox}
          color="amber"
        />
        <StatCard
          title="Approved Claims"
          value={approvedRequestsCount}
          subtitle="Scheduled for pickup"
          icon={Truck}
          color="purple"
        />
        <StatCard
          title="Completed Handovers"
          value={completedDonationsCount}
          subtitle={`${totalMealsClaimed} meals rescued`}
          icon={CheckCircle2}
          color="emerald"
        />
      </div>

      {/* Recent Incoming Requests */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Recent Incoming Requests</h2>
            <p className="text-xs text-slate-500">Charity claims submitted for your surplus food postings</p>
          </div>
          <Link to="/donor/requests" className="text-xs font-bold text-forest hover:text-forest-light flex items-center gap-1">
            <span>View All ({requests.length})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {requests.length === 0 ? (
          <EmptyState
            icon={Inbox}
            title="No incoming requests yet"
            description="When local charities submit claims for your food donations, they will appear here for your review and approval."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50/80 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">
                <tr>
                  <th className="py-3 px-3">Surplus Food</th>
                  <th className="py-3 px-3">Recipient Organization</th>
                  <th className="py-3 px-3">Claim Quantity</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3">Requested At</th>
                  <th className="py-3 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {requests.slice(0, 5).map((r) => (
                  <tr key={r._id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-3">
                      <p className="font-bold text-slate-900">{r.listingId?.title || 'Food Listing'}</p>
                      <span className="text-[10px] text-slate-400 capitalize">
                        {r.listingId?.category?.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-semibold text-slate-800">
                        {r.recipientId?.organizationDetails?.orgName || r.recipientId?.name}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Feeds ~{r.peopleToFeed} people
                      </div>
                    </td>
                    <td className="py-3 px-3 font-bold text-forest text-sm">
                      {r.requestedQuantity} {r.unit}
                    </td>
                    <td className="py-3 px-3">
                      <StatusBadge status={r.status} />
                    </td>
                    <td className="py-3 px-3 text-[11px] text-slate-500">
                      {new Date(r.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-3 text-right">
                      {r.status === 'pending' ? (
                        <Link
                          to="/donor/requests"
                          className="px-3 py-1.5 rounded-lg bg-forest hover:bg-forest-light text-white font-bold text-xs transition-colors shadow-2xs"
                        >
                          Review Claim
                        </Link>
                      ) : r.status === 'approved' ? (
                        <Link
                          to="/donor/pickups"
                          className="px-3 py-1.5 rounded-lg bg-teal-50 text-teal-800 hover:bg-teal-100 font-bold text-xs transition-colors"
                        >
                          Pickup Details
                        </Link>
                      ) : (
                        <span className="text-[11px] text-slate-400">Processed</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Active Food Listings Summary */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">My Active Surplus Postings</h2>
            <p className="text-xs text-slate-500">Live batches currently discoverable by nearby food rescue charities</p>
          </div>
          <Link to="/donor/listings" className="text-xs font-bold text-forest hover:text-forest-light flex items-center gap-1">
            <span>All Listings ({listings.length})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {listings.length === 0 ? (
          <EmptyState
            icon={Utensils}
            title="No food listings published"
            description="You have not published any surplus food batches yet. Post surplus meals from your kitchen to prevent food waste."
            actionLabel="Add Food Donation"
            actionTo="/listings/create"
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {listings.slice(0, 3).map((item) => (
              <div
                key={item._id}
                className="bg-slate-50/70 rounded-2xl p-4 border border-slate-200/80 hover:bg-white hover:shadow-sm transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <StatusBadge status={item.status} />
                    <ExpiryBadge expiryTime={item.expiryTime} />
                  </div>
                  <h3 className="font-bold text-slate-900 text-sm line-clamp-1">{item.title}</h3>
                  <p className="text-[11px] text-slate-500 mt-0.5 capitalize">
                    {item.category?.replace('_', ' ')} • {item.dietaryType}
                  </p>
                  
                  <div className="mt-3 pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs">
                    <span className="text-slate-500">Remaining:</span>
                    <span className="font-bold text-forest">
                      {item.remainingQuantity} / {item.quantity} {item.unit}
                    </span>
                  </div>
                </div>

                <div className="mt-4 pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
                  <Link
                    to={`/listings/edit/${item._id}`}
                    className="text-xs font-semibold text-forest hover:text-forest-light"
                  >
                    Edit
                  </Link>
                  <Link
                    to={`/listings/${item._id}`}
                    className="text-xs font-semibold text-slate-500 hover:text-slate-800"
                  >
                    View
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DonorDashboard;
