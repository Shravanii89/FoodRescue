import React from 'react';
import { Link } from 'react-router-dom';
import { Inbox } from 'lucide-react';

const EmptyState = ({
  icon: Icon = Inbox,
  title = 'No items found',
  description = 'There are no records to display at this time.',
  actionLabel,
  actionTo,
  onAction,
  className = ''
}) => {
  return (
    <div className={`p-10 text-center rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col items-center justify-center ${className}`}>
      <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-500 flex items-center justify-center mb-3">
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="text-sm font-bold text-slate-900">{title}</h3>
      <p className="text-xs text-slate-500 max-w-sm mt-1 mb-4">{description}</p>
      
      {actionLabel && actionTo && (
        <Link
          to={actionTo}
          className="inline-flex items-center px-4 py-2 rounded-xl bg-forest hover:bg-forest-light text-white font-semibold text-xs transition-colors shadow-xs"
        >
          {actionLabel}
        </Link>
      )}

      {actionLabel && onAction && !actionTo && (
        <button
          onClick={onAction}
          className="inline-flex items-center px-4 py-2 rounded-xl bg-forest hover:bg-forest-light text-white font-semibold text-xs transition-colors shadow-xs"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
