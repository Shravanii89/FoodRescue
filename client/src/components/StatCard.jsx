import React from 'react';

const StatCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  color = 'emerald',
  className = ''
}) => {
  const colorMap = {
    emerald: {
      iconBg: 'bg-emerald-50 text-emerald-600 border-emerald-100',
      glow: 'hover:border-emerald-300/80',
      badge: 'text-emerald-700 bg-emerald-50'
    },
    blue: {
      iconBg: 'bg-blue-50 text-blue-600 border-blue-100',
      glow: 'hover:border-blue-300/80',
      badge: 'text-blue-700 bg-blue-50'
    },
    amber: {
      iconBg: 'bg-amber-50 text-amber-600 border-amber-100',
      glow: 'hover:border-amber-300/80',
      badge: 'text-amber-700 bg-amber-50'
    },
    purple: {
      iconBg: 'bg-purple-50 text-purple-600 border-purple-100',
      glow: 'hover:border-purple-300/80',
      badge: 'text-purple-700 bg-purple-50'
    }
  };

  const selectedTheme = colorMap[color] || colorMap.emerald;

  return (
    <div
      className={`relative bg-white/90 backdrop-blur-sm p-6 rounded-2xl border border-slate-200/90 shadow-sm transition-all duration-200 hover:shadow-md ${selectedTheme.glow} ${className}`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold tracking-wider text-slate-500 uppercase">{title}</p>
          <h3 className="mt-2 text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight">
            {value}
          </h3>
          {subtitle && (
            <p className="mt-1 text-xs text-slate-500 flex items-center gap-1">
              {subtitle}
            </p>
          )}
        </div>
        {Icon && (
          <div className={`p-3 rounded-xl border ${selectedTheme.iconBg}`}>
            <Icon className="w-6 h-6" />
          </div>
        )}
      </div>

      {trend && (
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
          <span className={`px-2 py-0.5 rounded-full font-medium ${selectedTheme.badge}`}>
            {trend}
          </span>
          <span className="text-slate-400">Live verified</span>
        </div>
      )}
    </div>
  );
};

export default StatCard;
