import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  PlusCircle,
  ShoppingBag,
  Sparkles,
  Inbox,
  Truck,
  BarChart3,
  Users,
  ShieldAlert,
  Compass,
  UserCheck,
  FileText
} from 'lucide-react';

const Sidebar = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const role = user?.role || 'recipient';

  // Navigation schema per role
  const getNavLinks = () => {
    if (role === 'admin') {
      return [
        { to: '/admin/dashboard', label: 'Admin Overview', icon: LayoutDashboard },
        { to: '/admin/users', label: 'User Verification', icon: UserCheck },
        { to: '/explore', label: 'All Food Listings', icon: Compass },
        { to: '/requests', label: 'Platform Requests', icon: Inbox },
        { to: '/pickups', label: 'Pickup Logistics', icon: Truck },
        { to: '/smart-match', label: 'Smart Match Engine', icon: Sparkles },
        { to: '/analytics', label: 'Reports & Analytics', icon: BarChart3 },
        { to: '/admin/audit-logs', label: 'System Audit Logs', icon: FileText },
      ];
    }

    if (role === 'donor') {
      return [
        { to: '/donor/dashboard', label: 'Donor Dashboard', icon: LayoutDashboard },
        { to: '/listings/create', label: 'List Surplus Food', icon: PlusCircle, badge: 'New' },
        { to: '/explore', label: 'Browse Food Feed', icon: Compass },
        { to: '/requests', label: 'Donation Requests', icon: Inbox },
        { to: '/pickups', label: 'Scheduled Pickups', icon: Truck },
        { to: '/smart-match', label: 'Match Recommendations', icon: Sparkles },
        { to: '/analytics', label: 'My Impact & Analytics', icon: BarChart3 },
      ];
    }

    // Recipient / NGO default
    return [
      { to: '/recipient/dashboard', label: 'NGO Dashboard', icon: LayoutDashboard },
      { to: '/smart-match', label: 'Smart Match (AI Engine)', icon: Sparkles, badge: 'Smart' },
      { to: '/explore', label: 'Explore Available Food', icon: Compass },
      { to: '/requests', label: 'My Claim Requests', icon: Inbox },
      { to: '/pickups', label: 'Pickup Tracking', icon: Truck },
      { to: '/analytics', label: 'Community Analytics', icon: BarChart3 },
    ];
  };

  const navLinks = getNavLinks();

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs lg:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-16 bottom-0 left-0 z-40 w-64 bg-white border-r border-slate-200/80 flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* User Card info in sidebar */}
        <div className="p-4 border-b border-slate-100 bg-slate-50/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-100 text-brand-700 font-bold flex items-center justify-center text-sm border border-brand-200/80">
              {user?.name ? user.name[0].toUpperCase() : 'U'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-slate-900 truncate">{user?.name}</p>
              <p className="text-[11px] text-slate-500 truncate">
                {user?.organizationDetails?.orgName || user?.email}
              </p>
              <span className="inline-block mt-1 px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider rounded-full bg-brand-100 text-brand-800">
                {role} mode
              </span>
            </div>
          </div>
        </div>

        {/* Links Navigation */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          <div className="px-3 pb-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Navigation Menu
          </div>

          {navLinks.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-brand-50 text-brand-700 font-semibold shadow-xs'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`
                }
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4 text-current" />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-brand-600 text-white">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </div>

        {/* Bottom System Status */}
        <div className="p-3 border-t border-slate-100 bg-slate-50/50 text-[11px] text-slate-500">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>MongoDB Connected</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1">Smart Match Rule Engine v2.1</p>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
