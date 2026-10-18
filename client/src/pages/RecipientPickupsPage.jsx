import React, { useState, useEffect } from 'react';
import apiClient from '../api/apiClient';
import PageHeader from '../components/PageHeader';
import StatusBadge from '../components/StatusBadge';
import EmptyState from '../components/EmptyState';
import {
  Truck,
  Key,
  Clock,
  Building2,
  MapPin,
  Phone,
  Calendar,
  CheckCircle2,
  Copy,
  Search,
  RefreshCw
} from 'lucide-react';

const RecipientPickupsPage = () => {
  const [pickups, setPickups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [copiedId, setCopiedId] = useState(null);

  const fetchPickups = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/pickups/my');
      if (res.data?.data) {
        setPickups(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch recipient pickups:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPickups();
  }, []);

  const handleCopyCode = (code, id) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const filteredPickups = pickups.filter((p) => {
    if (filter === 'all') return true;
    return p.status === filter;
  });

  const scheduledCount = pickups.filter((p) => p.status === 'scheduled').length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pickup Schedule & Logistics"
        description="View approved pickups and retrieve your unique 6-digit verification PIN to confirm safe food handover."
        badge="Recipient Logistics"
      />

      {/* Filter Tabs */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {[
            { id: 'all', label: 'All Pickups', count: pickups.length },
            { id: 'scheduled', label: 'Ready for Pickup', count: scheduledCount, highlight: scheduledCount > 0 },
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
                  filter === tab.id ? 'bg-white/20 text-white' : tab.highlight ? 'bg-amber-100 text-amber-800' : 'bg-slate-200 text-slate-700'
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        <button
          onClick={fetchPickups}
          className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors shrink-0"
          title="Refresh pickups"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Pickups Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[40vh] space-y-3">
          <div className="w-8 h-8 border-3 border-forest border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-500 font-medium">Loading pickup schedule...</p>
        </div>
      ) : filteredPickups.length === 0 ? (
        <EmptyState
          icon={Truck}
          title="No scheduled pickups"
          description={
            filter !== 'all'
              ? 'No pickups match this status filter.'
              : 'You do not have any scheduled pickups yet. When a donor approves your food claim request, the pickup record and verification PIN will appear here.'
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredPickups.map((p) => (
            <div
              key={p._id}
              className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <StatusBadge status={p.status} />
                  <span className="text-[11px] text-slate-400 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {new Date(p.scheduledPickupTime).toLocaleDateString()}
                  </span>
                </div>

                <div>
                  <h3 className="font-bold text-slate-900 text-base">
                    {p.quantity} {p.unit} of "{p.listingId?.title || 'Food Donation'}"
                  </h3>
                  
                  <div className="mt-3 space-y-1.5 text-xs text-slate-600">
                    <div className="flex items-center gap-2 font-semibold text-slate-800">
                      <Building2 className="w-4 h-4 text-slate-400 shrink-0" />
                      <span>{p.donorId?.organizationDetails?.orgName || p.donorId?.name}</span>
                    </div>

                    <div className="flex items-center gap-2 text-slate-600">
                      <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                      <span>{p.listingId?.pickupAddress || p.donorId?.location?.address || 'Pickup location on file'}</span>
                    </div>

                    <div className="flex items-center gap-2 text-slate-600">
                      <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                      <span>Donor Phone: {p.donorId?.phone || 'Not provided'}</span>
                    </div>

                    <div className="flex items-center gap-2 text-slate-600">
                      <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                      <span>Scheduled Window: {new Date(p.scheduledPickupTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                </div>

                {/* Handover PIN Display Box */}
                {p.status === 'scheduled' || p.status === 'in_transit' ? (
                  <div className="p-4 rounded-xl bg-forest/5 border border-forest/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-forest-light block">
                        Handover Verification PIN
                      </span>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Show this PIN to donor kitchen staff upon arrival:
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="px-3 py-1.5 rounded-lg bg-white border border-forest/30 font-mono text-base font-black text-forest tracking-widest shadow-2xs">
                        {p.verificationCode}
                      </div>
                      <button
                        onClick={() => handleCopyCode(p.verificationCode, p._id)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-forest hover:bg-forest/10 transition-colors"
                        title="Copy PIN"
                      >
                        {copiedId === p._id ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>
                      Pickup completed on {new Date(p.actualPickupTime || p.updatedAt).toLocaleString()}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RecipientPickupsPage;
