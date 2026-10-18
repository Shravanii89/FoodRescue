import React, { useState, useEffect } from 'react';
import apiClient from '../api/apiClient';
import PageHeader from '../components/PageHeader';
import StatusBadge from '../components/StatusBadge';
import EmptyState from '../components/EmptyState';
import {
  Inbox,
  Search,
  Filter,
  RefreshCw,
  Building2,
  Users,
  Clock,
  HeartHandshake
} from 'lucide-react';

const AdminRequestsPage = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const url = statusFilter === 'all'
        ? '/requests?limit=50'
        : `/requests?status=${statusFilter}&limit=50`;
      const res = await apiClient.get(url);
      if (res.data?.data) {
        setRequests(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load requests:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [statusFilter]);

  const filteredRequests = requests.filter((r) => {
    const food = r.listingId?.title || '';
    const donor = r.donorId?.organizationDetails?.orgName || r.donorId?.name || '';
    const recipient = r.recipientId?.organizationDetails?.orgName || r.recipientId?.name || '';
    return (
      food.toLowerCase().includes(search.toLowerCase()) ||
      donor.toLowerCase().includes(search.toLowerCase()) ||
      recipient.toLowerCase().includes(search.toLowerCase())
    );
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Donation Requests Audit"
        description="Oversee all surplus food claim transactions across donors and verified NGO recipients."
        badge="Platform Claims"
      />

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search food, donor, or NGO..."
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
            <option value="all">All Request Statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <button
            onClick={fetchRequests}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
            title="Refresh requests"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[40vh] space-y-3">
          <div className="w-8 h-8 border-3 border-forest border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-500 font-medium">Loading platform donation requests...</p>
        </div>
      ) : filteredRequests.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title="No donation requests found"
          description="No requests match your current search and filter settings."
        />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50/80 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">Food Item</th>
                  <th className="py-3 px-4">Donor Kitchen</th>
                  <th className="py-3 px-4">Claiming NGO</th>
                  <th className="py-3 px-4">Quantity / People</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Requested At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRequests.map((r) => (
                  <tr key={r._id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-900">
                      {r.listingId?.title || 'Food Listing'}
                      <div className="text-[10px] text-slate-400 font-normal capitalize">
                        {r.listingId?.category?.replace('_', ' ')}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-800">
                        {r.donorId?.organizationDetails?.orgName || r.donorId?.name}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {r.donorId?.phone || r.donorId?.email}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-800 flex items-center gap-1">
                        <span>{r.recipientId?.organizationDetails?.orgName || r.recipientId?.name}</span>
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {r.recipientId?.phone || r.recipientId?.email}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-forest text-sm">
                        {r.requestedQuantity} {r.unit}
                      </span>
                      <div className="text-[10px] text-slate-400">
                        ~{r.peopleToFeed} people fed
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={r.status} />
                    </td>
                    <td className="py-3 px-4 text-right text-[11px] text-slate-500">
                      {new Date(r.createdAt).toLocaleString()}
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

export default AdminRequestsPage;
