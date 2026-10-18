import React from 'react';

const PageHeader = ({
  title,
  description,
  badge,
  actions,
  children
}) => {
  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
      <div>
        {badge && (
          <div className="mb-1.5 flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-forest/10 text-forest-light">
              {badge}
            </span>
          </div>
        )}
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
          {title}
        </h1>
        {description && (
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            {description}
          </p>
        )}
      </div>

      {(actions || children) && (
        <div className="flex items-center gap-2.5 shrink-0">
          {actions}
          {children}
        </div>
      )}
    </div>
  );
};

export default PageHeader;
