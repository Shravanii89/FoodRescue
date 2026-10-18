import React, { useState, useEffect } from 'react';
import apiClient from '../api/apiClient';
import PageHeader from '../components/PageHeader';
import StatusBadge from '../components/StatusBadge';
import EmptyState from '../components/EmptyState';
import {
  Truck,
  CheckCircle2,
  Clock,
  Building2,
  Phone,
  Key,
  Calendar,
  AlertCircle,
  RefreshCw,
  Search
} from 'lucide-react';

const DonorPickupsPage = () => {
  const [pickups, setPickups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  
  // Verification Handover Modal State
  const [activePickup, setActivePickup] = useState(null);
  const [enteredPin, setEnteredPin] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [feedback, setFeedback] = useState('');

  const fetchPickups = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/pickups/my');
      if (res.data?.data) {
        setPickups(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch donor pickups:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPickups();
  }, []);

  const handleVerifyHandover = async (e) => {
    e.preventDefault();
    if (!activePickup || !enteredPin) return;
    try {
      setActionLoading(true);
      setErrorMessage('');
      const res = await apiClient.put(`/pickups/${activePickup._id}/status`, {
        status: 'completed',
        verificationCode: enteredPin.trim()
      });

      if (res.data?.success) {
        setFeedback(`Pickup handover successfully verified and marked as Completed!`);
        setTimeout(() => setFeedback(''), 5000);
        setActivePickup(null);
        setEnteredPin('');
        fetchPickups();
      }
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Invalid verification PIN.');
    } finally {
      setActionLoading(false);
    }
  };

  const filteredPickups = pickups.filter((p) => {
    const matchesFilter = filter === 'all' ? true : p.status === filter;
    const recipientName = p.recipientId?.organizationDetails?.orgName || p.recipientId?.name || '';
    const foodTitle = p.listingId?.title || '';
    const matchesSearch =
      recipientName.toLowerCase().includes(search.toLowerCase()) ||
      foodTitle.toLowerCase().includes(search.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pickup Tracking"
        description="Monitor scheduled volunteer pickups, verify recipient credentials, and complete handovers using OTP verification."
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
            { id: 'all', label: 'All Pickups', count: pickups.length },
            { id: 'scheduled', label: 'Scheduled', count: pickups.filter((p) => p.status === 'scheduled').length },
            { id: 'in_transit', label: 'In Transit', count: pickups.filter((p) => p.status === 'in_transit').length },
            { id: 'completed', label: 'Completed', count: pickups.filter((p) => p.status === 'completed').length }
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
              placeholder="Search pickup..."
              className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest"
            />
          </div>
          <button
            onClick={fetchPickups}
            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors shrink-0"
            title="Refresh pickups"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Pickups Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[40vh] space-y-3">
          <div className="w-8 h-8 border-3 border-forest border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-500 font-medium">Loading pickup records...</p>
        </div>
      ) : filteredPickups.length === 0 ? (
        <EmptyState
          icon={Truck}
          title="No pickup records found"
          description={
            filter !== 'all' || search
              ? 'No pickups match your current filters.'
              : 'You do not have any active or past pickups yet. When an incoming donation request is approved, a pickup record will be scheduled here.'
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredPickups.map((item) => (
            <div
              key={item._id}
              className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <StatusBadge status={item.status} />
                  <span className="text-[11px] text-slate-400 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(item.scheduledPickupTime).toLocaleDateString()}
                  </span>
                </div>

                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    {item.quantity} {item.unit} of "{item.listingId?.title || 'Food Donation'}"
                  </h3>
                  <div className="mt-2 space-y-1 text-xs text-slate-600">
                    <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                      <Building2 className="w-3.5 h-3.5 text-slate-400" />
                      <span>{item.recipientId?.organizationDetails?.orgName || item.recipientId?.name}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-500">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>Contact: {item.recipientId?.phone || 'Not provided'}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-500">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>Scheduled Window: {new Date(item.scheduledPickupTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                </div>

                {item.status === 'completed' && item.actualPickupTime && (
                  <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-100 text-xs text-emerald-800 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Handed over on {new Date(item.actualPickupTime).toLocaleString()}</span>
                  </div>
                )}
              </div>

              {/* Handover action */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                {item.status === 'scheduled' || item.status === 'in_transit' ? (
                  <button
                    onClick={() => {
                      setActivePickup(item);
                      setEnteredPin('');
                      setErrorMessage('');
                    }}
                    className="w-full py-2 px-3 rounded-xl bg-forest hover:bg-forest-light text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                  >
                    <Key className="w-3.5 h-3.5" />
                    <span>Verify Handover PIN</span>
                  </button>
                ) : (
                  <span className="text-xs text-slate-400 font-medium w-full text-center py-1">
                    Pickup Completed & Verified
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Verification Code Modal */}
      {activePickup && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-xl border border-slate-100 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-forest/10 text-forest-light flex items-center justify-center mx-auto">
              <Key className="w-6 h-6" />
            </div>

            <div className="text-center">
              <h3 className="text-base font-bold text-slate-900">Verify Pickup Handover</h3>
              <p className="text-xs text-slate-500 mt-1">
                Ask the NGO driver/representative for their 6-digit verification code to confirm food handover.
              </p>
            </div>

            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleVerifyHandover} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 text-center">
                  6-Digit Verification PIN *
                </label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={enteredPin}
                  onChange={(e) => setEnteredPin(e.target.value)}
                  placeholder="e.g. 278921"
                  className="w-full text-center tracking-widest text-lg font-mono font-bold px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest"
                />
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setActivePickup(null);
                    setEnteredPin('');
                    setErrorMessage('');
                  }}
                  className="flex-1 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading || enteredPin.length < 4}
                  className="flex-1 py-2 rounded-xl bg-forest hover:bg-forest-light text-white font-semibold text-xs transition-colors shadow-xs disabled:opacity-50"
                >
                  {actionLoading ? 'Verifying...' : 'Complete Handover'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DonorPickupsPage;
