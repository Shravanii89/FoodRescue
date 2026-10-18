import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../api/apiClient';
import { useAuth } from '../context/AuthContext';
import {
  HeartHandshake,
  Sparkles,
  Compass,
  Truck,
  Inbox,
  CheckCircle2,
  Clock,
  MapPin,
  ShieldAlert,
  ArrowRight,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import StatCard from '../components/StatCard';
import StatusBadge from '../components/StatusBadge';
import ExpiryBadge from '../components/ExpiryBadge';

const RecipientDashboard = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [pickups, setPickups] = useState([]);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [requestsRes, pickupsRes, matchRes] = await Promise.all([
        apiClient.get('/requests/my'),
        apiClient.get('/pickups/my'),
        apiClient.get('/match/recommendations?limit=3')
      ]);

      if (requestsRes.data?.data) setRequests(requestsRes.data.data);
      if (pickupsRes.data?.data) setPickups(pickupsRes.data.data);
      if (matchRes.data?.data) setMatches(matchRes.data.data.slice(0, 3));
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
  const totalMealsClaimed = requests
    .filter((r) => r.status === 'completed' || r.status === 'approved')
    .reduce((acc, r) => acc + r.requestedQuantity, 0);
  const totalPeopleFed = requests
    .filter((r) => r.status === 'completed' || r.status === 'approved')
    .reduce((acc, r) => acc + (r.peopleToFeed || 0), 0);

  const isVerified = user?.verificationStatus === 'verified';

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
              isVerified ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
            }`}>
              {isVerified ? 'Verified Community NGO' : 'Verification In Review'}
            </span>
            <span className="text-xs text-slate-400 capitalize">• {user?.organizationDetails?.orgType}</span>
          </div>

          <h1 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
            {user?.organizationDetails?.orgName || user?.name}
          </h1>

          <p className="text-xs text-slate-500 mt-0.5">
            Capacity: {user?.organizationDetails?.capacityDailyMeals || 50} meals daily • Serving {user?.location?.address || 'Bengaluru'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/smart-match"
            className="px-4 py-2.5 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md shadow-brand-500/20 transition-all flex items-center gap-2 shrink-0"
          >
            <Sparkles className="w-4 h-4 text-emerald-200" />
            <span>AI Smart Match</span>
          </Link>
          <Link
            to="/explore"
            className="px-4 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-colors shrink-0"
          >
            Browse Surplus
          </Link>
        </div>
      </div>

      {!isVerified && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Identity Verification Pending</p>
            <p className="mt-0.5 text-amber-800">
              Your charitable organization is currently queued for administrator approval. You can view food batches and Smart Match scores in read-only mode until verified.
            </p>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Meals Secured"
          value={totalMealsClaimed}
          subtitle="Approved or completed"
          icon={HeartHandshake}
          color="emerald"
        />
        <StatCard
          title="People Nourished"
          value={totalPeopleFed}
          subtitle="Estimated individuals"
          icon={CheckCircle2}
          color="blue"
        />
        <StatCard
          title="Active Claims"
          value={pendingCount + approvedCount}
          subtitle={`${pendingCount} pending donor review`}
          icon={Inbox}
          color="amber"
        />
        <StatCard
          title="Scheduled Pickups"
          value={pickups.filter((p) => p.status === 'scheduled').length}
          subtitle="Ready for transport"
          icon={Truck}
          color="purple"
        />
      </div>

      {/* Recommended Smart Matches Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-brand-600" />
              <span>Recommended Surplus for Your Center</span>
            </h2>
            <p className="text-xs text-slate-500">Scored by proximity, quantity demand, and expiry safety</p>
          </div>
          <Link to="/smart-match" className="text-xs font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1">
            <span>View All Matches</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {matches.map((item) => (
            <div
              key={item._id}
              className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-brand-50 text-brand-800">
                    {item.matchScore}% Match
                  </span>
                  <ExpiryBadge expiryTime={item.expiryTime} />
                </div>

                <h3 className="font-bold text-slate-900 text-sm line-clamp-1">{item.title}</h3>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2">{item.matchExplanation}</p>

                <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                  <span>Available:</span>
                  <span className="font-bold text-brand-700">{item.remainingQuantity} {item.unit}</span>
                </div>
              </div>

              <Link
                to={`/listings/${item._id}`}
                className="mt-4 w-full py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs text-center transition-colors"
              >
                Claim Batch
              </Link>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Claim Requests Tracking */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">My Donation Claims & Requests</h2>
            <p className="text-xs text-slate-500">Status of your food requests submitted to local kitchens</p>
          </div>
          <Link to="/requests" className="text-xs font-bold text-brand-600 hover:text-brand-700">
            View All
          </Link>
        </div>

        {requests.length === 0 ? (
          <div className="py-10 text-center">
            <Inbox className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-xs font-bold text-slate-600">No donation requests made yet.</p>
            <p className="text-[11px] text-slate-400 mt-1">Browse available surplus food to submit claims for your shelter.</p>
            <Link
              to="/explore"
              className="inline-block mt-3 px-4 py-2 rounded-xl bg-brand-600 text-white font-bold text-xs"
            >
              Explore Available Food
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">
                <tr>
                  <th className="py-3 px-3">Surplus Food</th>
                  <th className="py-3 px-3">Donor Kitchen</th>
                  <th className="py-3 px-3">Claim Quantity</th>
                  <th className="py-3 px-3">People Fed</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3 text-right">Logistics</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {requests.slice(0, 6).map((req) => (
                  <tr key={req._id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-3">
                      <p className="font-bold text-slate-900">{req.listingId?.title}</p>
                      <span className="text-[10px] text-slate-400 capitalize">{req.listingId?.category?.replace('_', ' ')}</span>
                    </td>
                    <td className="py-3 px-3 font-medium text-slate-800">
                      {req.donorId?.organizationDetails?.orgName || req.donorId?.name}
                    </td>
                    <td className="py-3 px-3 font-bold text-brand-700">
                      {req.requestedQuantity} {req.unit}
                    </td>
                    <td className="py-3 px-3 text-emerald-700 font-semibold">
                      ~{req.peopleToFeed} people
                    </td>
                    <td className="py-3 px-3">
                      <StatusBadge status={req.status} />
                    </td>
                    <td className="py-3 px-3 text-right">
                      {req.status === 'approved' ? (
                        <Link
                          to="/pickups"
                          className="px-3 py-1 rounded-lg bg-indigo-50 text-indigo-700 font-bold text-[11px] hover:bg-indigo-100"
                        >
                          View PIN / Pickup
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
