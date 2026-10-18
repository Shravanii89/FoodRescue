import React, { useState, useEffect } from 'react';
import apiClient from '../api/apiClient';
import PageHeader from '../components/PageHeader';
import StatusBadge from '../components/StatusBadge';
import EmptyState from '../components/EmptyState';
import {
  Truck,
  Search,
  Filter,
  RefreshCw,
  Building2,
  Calendar,
  Key,
  CheckCircle2,
  Phone
} from 'lucide-react';

const AdminPickupsPage = () => {
  const [pickups, setPickups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const fetchPickups = async () => {
    try {
      setLoading(true);
      const url = statusFilter === 'all'
        ? '/pickups?limit=50'
        : `/pickups?status=${statusFilter}&limit=50`;
      const res = await apiClient.get(url);
      if (res.data?.data) {
        setPickups(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load pickups:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPickups();
  }, [statusFilter]);

  const filteredPickups = pickups.filter((p) => {
    const food = p.listingId?.title || '';
    const donor = p.donorId?.organizationDetails?.orgName || p.donorId?.name || '';
    const recipient = p.recipientId?.organizationDetails?.orgName || p.recipientId?.name || '';
    return (
      food.toLowerCase().includes(search.toLowerCase()) ||
      donor.toLowerCase().includes(search.toLowerCase()) ||
      recipient.toLowerCase().includes(search.toLowerCase())
    );
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pickup Records & Logistics"
        description="Monitor physical transport logistics, audit completed verification codes, and verify food distribution chain of custody."
        badge="Platform Logistics"
      />

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search pickup..."
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
            <option value="all">All Pickup Statuses</option>
            <option value="scheduled">Scheduled</option>
            <option value="in_transit">In Transit</option>
            <option value="completed">Completed</option>
          </select>
          <button
            onClick={fetchPickups}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
            title="Refresh pickups"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[40vh] space-y-3">
          <div className="w-8 h-8 border-3 border-forest border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-500 font-medium">Loading platform pickups...</p>
        </div>
      ) : filteredPickups.length === 0 ? (
        <EmptyState
          icon={Truck}
          title="No pickup records found"
          description="No pickup records match your current filter criteria."
        />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50/80 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">Food Item & Quantity</th>
                  <th className="py-3 px-4">Donor Kitchen</th>
                  <th className="py-3 px-4">Recipient Shelter</th>
                  <th className="py-3 px-4">Scheduled Window</th>
                  <th className="py-3 px-4">Verification PIN</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Handover Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPickups.map((p) => (
                  <tr key={p._id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4">
                      <p className="font-bold text-slate-900">{p.listingId?.title || 'Food Batch'}</p>
                      <span className="text-forest font-semibold text-xs">
                        {p.quantity} {p.unit}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-800">
                        {p.donorId?.organizationDetails?.orgName || p.donorId?.name}
                      </div>
                      <div className="text-[10px] text-slate-400 truncate max-w-xs">
                        {p.listingId?.pickupAddress || p.donorId?.location?.address}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-800">
                        {p.recipientId?.organizationDetails?.orgName || p.recipientId?.name}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {p.recipientId?.phone || 'No phone'}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-[11px] text-slate-600">
                      <div>{new Date(p.scheduledPickupTime).toLocaleDateString()}</div>
                      <div className="text-slate-400">
                        {new Date(p.scheduledPickupTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 font-mono font-bold text-xs tracking-wider border border-slate-200">
                        {p.verificationCode}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={p.status} />
                    </td>
                    <td className="py-3 px-4 text-right text-[11px] text-slate-500">
                      {p.actualPickupTime ? (
                        <span className="text-emerald-700 font-medium">
                          {new Date(p.actualPickupTime).toLocaleString()}
                        </span>
                      ) : (
                        <span className="text-slate-400">Pending Handover</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPickupsPage;
