import React from 'react';

const statusConfig = {
  // Listing statuses
  available: { label: 'Available', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  partially_claimed: { label: 'Partially Claimed', bg: 'bg-sky-50 text-sky-700 border-sky-200' },
  claimed: { label: 'Fully Claimed', bg: 'bg-slate-100 text-slate-700 border-slate-200' },
  expired: { label: 'Expired', bg: 'bg-rose-50 text-rose-700 border-rose-200' },
  cancelled: { label: 'Cancelled', bg: 'bg-zinc-100 text-zinc-600 border-zinc-200' },

  // Request & Pickup statuses
  pending: { label: 'Pending Approval', bg: 'bg-amber-50 text-amber-700 border-amber-200' },
  approved: { label: 'Approved', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  rejected: { label: 'Rejected', bg: 'bg-rose-50 text-rose-700 border-rose-200' },
  scheduled: { label: 'Pickup Scheduled', bg: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  in_transit: { label: 'In Transit', bg: 'bg-purple-50 text-purple-700 border-purple-200' },
  completed: { label: 'Completed', bg: 'bg-emerald-100 text-emerald-800 border-emerald-300 font-semibold' },
  missed: { label: 'Missed Pickup', bg: 'bg-rose-100 text-rose-800 border-rose-300' },

  // Verification status
  verified: { label: 'Verified NGO', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' }
};

const StatusBadge = ({ status, className = '' }) => {
  const normalized = (status || '').toLowerCase();
  const config = statusConfig[normalized] || {
    label: status ? status.replace('_', ' ') : 'Unknown',
    bg: 'bg-slate-100 text-slate-700 border-slate-200'
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border capitalize ${config.bg} ${className}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 opacity-75"></span>
      {config.label}
    </span>
  );
};

export default StatusBadge;
