import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../api/apiClient';
import { useAuth } from '../context/AuthContext';
import {
  HeartHandshake,
  Sparkles,
  Truck,
  Inbox,
  CheckCircle2,
  AlertCircle,
  Compass,
  ArrowRight,
  Clock,
  Building2,
  Key
} from 'lucide-react';
import StatCard from '../components/StatCard';
import StatusBadge from '../components/StatusBadge';
import ExpiryBadge from '../components/ExpiryBadge';
import EmptyState from '../components/EmptyState';

const RecipientDashboard = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [pickups, setPickups] = useState([]);
  const [matches, setMatches] = useState([]);
  const [availableCount, setAvailableCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [requestsRes, pickupsRes, matchRes, listingsRes] = await Promise.all([
        apiClient.get('/requests/my'),
        apiClient.get('/pickups/my'),
        apiClient.get('/match/recommendations?limit=3'),
        apiClient.get('/listings?limit=1')
      ]);

      if (requestsRes.data?.data) setRequests(requestsRes.data.data);
      if (pickupsRes.data?.data) setPickups(pickupsRes.data.data);
      if (matchRes.data?.data) setMatches(matchRes.data.data.slice(0, 3));
      if (listingsRes.data?.pagination?.total !== undefined) {
        setAvailableCount(listingsRes.data.pagination.total);
      }
    } catch (err) {
      console.error('Failed to load recipient dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const pendingCount = requests.filter((r) => r.status === 'pending').length;
  const approvedCount = requests.filter((r) => r.status === 'approved').length;
  const scheduledPickupsCount = pickups.filter((p) => p.status === 'scheduled').length;
  const completedPickupsCount = pickups.filter((p) => p.status === 'completed').length;
  const totalMealsClaimed = requests
    .filter((r) => r.status === 'completed' || r.status === 'approved')
    .reduce((acc, r) => acc + r.requestedQuantity, 0);

  const isVerified = user?.verificationStatus === 'verified';

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <div className="w-10 h-10 border-4 border-forest border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-semibold text-slate-500">Loading recipient food rescue portal...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                isVerified
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-amber-50 text-amber-800 border border-amber-200'
              }`}
            >
              {isVerified ? 'Verified Community NGO' : 'Verification In Review'}
            </span>
            <span className="text-xs text-slate-400 capitalize">• {user?.organizationDetails?.orgType || 'Charity'}</span>
          </div>

          <h1 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
            {user?.organizationDetails?.orgName || user?.name}
          </h1>

          <p className="text-xs text-slate-500 mt-0.5">
            Capacity: {user?.organizationDetails?.capacityDailyMeals || 50} meals daily • Serving {user?.location?.address || 'Bengaluru'}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            to="/explore"
            className="px-4 py-2.5 rounded-2xl bg-forest hover:bg-forest-light text-white font-bold text-xs shadow-md shadow-forest/20 transition-all flex items-center gap-2 shrink-0"
          >
            <Compass className="w-4 h-4 text-emerald-300" />
            <span>Find Food</span>
          </Link>
          <Link
            to="/smart-match"
            className="px-4 py-2.5 rounded-2xl bg-teal-50 hover:bg-teal-100 text-teal-800 font-bold text-xs transition-colors shrink-0 flex items-center gap-1.5"
          >
            <Sparkles className="w-4 h-4 text-teal-600" />
            <span>Smart Match</span>
          </Link>
        </div>
      </div>

      {!isVerified && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Identity Verification Pending</p>
            <p className="mt-0.5 text-amber-800 leading-relaxed">
              Your charitable organization is currently queued for administrator approval. You can browse food listings and view Smart Match recommendations; claim requests will be enabled immediately upon administrative verification.
            </p>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        <StatCard
          title="Available Food"
          value={availableCount}
          subtitle="Batches nearby"
          icon={Compass}
          color="emerald"
        />
        <StatCard
          title="Active Requests"
          value={pendingCount}
          subtitle="Pending donor review"
          icon={Inbox}
          color="amber"
        />
        <StatCard
          title="Approved Claims"
          value={approvedCount}
          subtitle="Ready for transport"
          icon={CheckCircle2}
          color="blue"
        />
        <StatCard
          title="Upcoming Pickups"
          value={scheduledPickupsCount}
          subtitle="Scheduled window"
          icon={Truck}
          color="purple"
        />
        <StatCard
          title="Completed Rescues"
          value={completedPickupsCount}
          subtitle={`${totalMealsClaimed} meals received`}
          icon={HeartHandshake}
          color="emerald"
        />
      </div>

      {/* Recommended Smart Matches Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-forest" />
              <span>Recommended Surplus for Your Center</span>
            </h2>
            <p className="text-xs text-slate-500">Deterministically ranked by distance, capacity match, and expiry safety</p>
          </div>
          <Link to="/smart-match" className="text-xs font-bold text-forest hover:text-forest-light flex items-center gap-1">
            <span>View All Matches</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {matches.length === 0 ? (
          <EmptyState
            icon={Sparkles}
            title="No recommended batches right now"
            description="As donors in your vicinity post surplus food matching your meal capacity, compatible recommendations will appear here."
            actionLabel="Browse Available Food"
            actionTo="/explore"
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {matches.map((item) => (
              <div
                key={item._id}
                className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-forest/10 text-forest-light">
                      {item.matchScore}% Match
                    </span>
                    <ExpiryBadge expiryTime={item.expiryTime} />
                  </div>

                  <h3 className="font-bold text-slate-900 text-sm line-clamp-1">{item.title}</h3>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">{item.matchExplanation}</p>

                  <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                    <span>Available:</span>
                    <span className="font-bold text-forest">{item.remainingQuantity} {item.unit}</span>
                  </div>
                </div>

                <Link
                  to={`/listings/${item._id}`}
                  className="mt-4 w-full py-2 px-3 rounded-xl bg-forest hover:bg-forest-light text-white font-bold text-xs text-center transition-colors shadow-xs"
                >
                  Claim Batch
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Claim Requests Tracking */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">My Donation Claims & Requests</h2>
            <p className="text-xs text-slate-500">Live status of claims submitted to donor kitchens</p>
          </div>
          <Link to="/recipient/requests" className="text-xs font-bold text-forest hover:text-forest-light flex items-center gap-1">
            <span>View All ({requests.length})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {requests.length === 0 ? (
          <EmptyState
            icon={Inbox}
            title="No donation claims submitted yet"
            description="Explore available surplus food nearby and submit requests for your community kitchen or shelter."
            actionLabel="Discover Food"
            actionTo="/explore"
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50/80 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">
                <tr>
                  <th className="py-3 px-3">Surplus Food</th>
                  <th className="py-3 px-3">Donor Kitchen</th>
                  <th className="py-3 px-3">Claim Quantity</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3 text-right">Logistics</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {requests.slice(0, 5).map((req) => (
                  <tr key={req._id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-3">
                      <p className="font-bold text-slate-900">{req.listingId?.title}</p>
                      <span className="text-[10px] text-slate-400 capitalize">{req.listingId?.category?.replace('_', ' ')}</span>
                    </td>
                    <td className="py-3 px-3 font-medium text-slate-800">
                      {req.donorId?.organizationDetails?.orgName || req.donorId?.name}
                    </td>
                    <td className="py-3 px-3 font-bold text-forest">
                      {req.requestedQuantity} {req.unit}
                    </td>
                    <td className="py-3 px-3">
                      <StatusBadge status={req.status} />
                    </td>
                    <td className="py-3 px-3 text-right">
                      {req.status === 'approved' ? (
                        <Link
                          to="/recipient/pickups"
                          className="px-3 py-1.5 rounded-xl bg-teal-50 text-teal-800 hover:bg-teal-100 font-bold text-xs flex items-center justify-end gap-1"
                        >
                          <Key className="w-3.5 h-3.5 text-teal-600" />
                          <span>View PIN</span>
                        </Link>
                      ) : (
                        <span className="text-[11px] text-slate-400">
                          {new Date(req.createdAt).toLocaleDateString()}
                        </span>
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

export default RecipientDashboard;
