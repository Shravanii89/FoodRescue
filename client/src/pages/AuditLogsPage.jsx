import React, { useState, useEffect } from 'react';
import apiClient from '../api/apiClient';
import {
  FileText,
  Search,
  Filter,
  ShieldAlert,
  Clock,
  User,
  Database
} from 'lucide-react';

const AuditLogsPage = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState('');
  const [entityFilter, setEntityFilter] = useState('');

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (actionFilter) params.set('action', actionFilter);
      if (entityFilter) params.set('entityType', entityFilter);

      const res = await apiClient.get(`/admin/audit-logs?${params.toString()}`);
      if (res.data?.data) {
        setLogs(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [actionFilter, entityFilter]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
          <FileText className="w-6 h-6 text-brand-600" />
          <span>Database Audit Logs & Activity Trail</span>
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Immutable event stream capturing mutations, logins, stock claim reservations, and administrative actions
        </p>
      </div>

      {/* Filter Row */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs flex flex-wrap items-center gap-4">
        <div className="w-full sm:w-64">
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
            Filter by Entity Type
          </label>
          <select
            value={entityFilter}
            onChange={(e) => setEntityFilter(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white text-slate-800 outline-hidden focus:ring-2 focus:ring-brand-500"
          >
            <option value="">All Entities</option>
            <option value="FoodListing">FoodListing</option>
            <option value="DonationRequest">DonationRequest</option>
            <option value="PickupRecord">PickupRecord</option>
            <option value="User">User</option>
            <option value="System">System</option>
          </select>
        </div>

        <div className="w-full sm:w-64">
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
            Filter by Action Type
          </label>
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white text-slate-800 outline-hidden focus:ring-2 focus:ring-brand-500"
          >
            <option value="">All Actions</option>
            <option value="USER_REGISTER">USER_REGISTER</option>
            <option value="USER_LOGIN">USER_LOGIN</option>
            <option value="LISTING_CREATE">LISTING_CREATE</option>
            <option value="LISTING_UPDATE">LISTING_UPDATE</option>
            <option value="REQUEST_CREATE">REQUEST_CREATE</option>
            <option value="REQUEST_APPROVED">REQUEST_APPROVED</option>
            <option value="PICKUP_COMPLETED">PICKUP_COMPLETED</option>
            <option value="ADMIN_USER_VERIFY">ADMIN_USER_VERIFY</option>
          </select>
        </div>
      </div>

      {/* Audit Logs List */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs">
        {loading ? (
          <div className="py-16 text-center">
            <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs text-slate-500">Querying audit logs collection...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400">
            No audit records found matching criteria.
          </div>
        ) : (
          <div className="space-y-3">
            {logs.map((log) => (
              <div
                key={log._id}
                className="p-4 rounded-2xl bg-slate-50/70 border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-lg font-mono font-bold text-[11px] bg-slate-900 text-white">
                      {log.action}
                    </span>
                    <span className="px-2 py-0.5 rounded-md font-semibold text-[10px] bg-emerald-100 text-emerald-800">
                      {log.entityType}
                    </span>
                    <span className="text-slate-400 text-[11px] font-mono">
                      ID: {log.entityId || 'N/A'}
                    </span>
                  </div>

                  <p className="font-mono text-[11px] text-slate-700 bg-white p-2 rounded-xl border border-slate-100 mt-1">
                    {JSON.stringify(log.details, null, 2)}
                  </p>
                </div>

                <div className="text-right text-[11px] text-slate-400 shrink-0 space-y-0.5">
                  <p className="font-semibold text-slate-700">
                    Actor: {log.userId?.name || log.userRole || 'System'} ({log.userRole})
                  </p>
                  <p>IP: {log.ipAddress || '127.0.0.1'}</p>
                  <p className="flex items-center justify-end gap-1">
                    <Clock className="w-3 h-3 text-slate-400" />
                    <span>{new Date(log.timestamp).toLocaleString()}</span>
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AuditLogsPage;
