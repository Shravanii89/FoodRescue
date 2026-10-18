import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  PlusCircle,
  Utensils,
  Sparkles,
  Inbox,
  Truck,
  Users,
  ShieldCheck,
  Compass,
  FileText,
  User,
  Building2,
  LogOut,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

const Sidebar = ({ isOpen, onClose, isCollapsed, onToggleCollapse }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const role = user?.role || 'recipient';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Strict role-based navigation schema matching specification 2
  const getNavLinks = () => {
    if (role === 'admin') {
      return [
        { to: '/admin/dashboard', label: 'Overview', icon: LayoutDashboard },
        { to: '/admin/users', label: 'User Management', icon: Users },
        { to: '/admin/verification', label: 'NGO Verification', icon: ShieldCheck, badge: 'Queue' },
        { to: '/admin/listings', label: 'Food Listings', icon: Utensils },
        { to: '/admin/requests', label: 'Donation Requests', icon: Inbox },
        { to: '/admin/pickups', label: 'Pickup Records', icon: Truck },
        { to: '/admin/audit-logs', label: 'Audit Logs', icon: FileText },
      ];
    }

    if (role === 'donor') {
      return [
        { to: '/donor/dashboard', label: 'Overview', icon: LayoutDashboard },
        { to: '/donor/listings', label: 'My Food Listings', icon: Utensils },
        { to: '/listings/create', label: 'Add Food Donation', icon: PlusCircle, badge: 'New' },
        { to: '/donor/requests', label: 'Incoming Requests', icon: Inbox },
        { to: '/donor/pickups', label: 'Pickup Tracking', icon: Truck },
        { to: '/profile', label: 'My Profile', icon: User },
      ];
    }

    // Recipient / NGO default
    return [
      { to: '/recipient/dashboard', label: 'Overview', icon: LayoutDashboard },
      { to: '/explore', label: 'Discover Food', icon: Compass },
      { to: '/smart-match', label: 'Smart Match', icon: Sparkles, badge: 'Rule v2.1' },
      { to: '/recipient/requests', label: 'My Donation Requests', icon: Inbox },
      { to: '/recipient/pickups', label: 'Pickup Schedule', icon: Truck },
      { to: '/profile', label: 'Organization Profile', icon: Building2 },
    ];
  };

  const navLinks = getNavLinks();

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs lg:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-16 bottom-0 left-0 z-40 bg-white border-r border-slate-200/80 flex flex-col transition-all duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } ${isCollapsed ? 'lg:w-20' : 'lg:w-64'} w-64`}
      >
        {/* User Card info in sidebar */}
        <div className={`p-4 border-b border-slate-100 bg-slate-50/60 ${isCollapsed ? 'lg:p-3 lg:text-center' : ''}`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-forest/10 text-forest-light font-bold flex items-center justify-center text-sm border border-forest/20 shrink-0">
              {user?.name ? user.name[0].toUpperCase() : 'U'}
            </div>
            {!isCollapsed && (
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-slate-900 truncate">{user?.name}</p>
                <p className="text-[11px] text-slate-500 truncate">
                  {user?.organizationDetails?.orgName || user?.email}
                </p>
                <span className="inline-block mt-1 px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider rounded-full bg-forest/10 text-forest-light border border-forest/20">
                  {role} portal
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Links Navigation */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {!isCollapsed && (
            <div className="px-3 pb-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              {role === 'admin' ? 'Administration' : role === 'donor' ? 'Donor Workspace' : 'Recipient Workspace'}
            </div>
          )}

          {navLinks.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onClose}
                title={isCollapsed ? item.label : undefined}
                className={({ isActive }) =>
                  `flex items-center ${
                    isCollapsed ? 'justify-center px-2 py-2.5' : 'justify-between px-3 py-2.5'
                  } rounded-xl text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-forest text-white font-semibold shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`
                }
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4 shrink-0" />
                  {!isCollapsed && <span>{item.label}</span>}
                </div>
                {!isCollapsed && item.badge && (
                  <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-white/20 text-white">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </div>

        {/* Bottom System Status & Logout */}
        <div className="p-3 border-t border-slate-100 bg-slate-50/50 space-y-2">
          <button
            onClick={handleLogout}
            className={`w-full flex items-center ${
              isCollapsed ? 'justify-center' : 'justify-start px-3'
            } py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors gap-2.5`}
            title="Sign Out"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {!isCollapsed && <span>Sign Out</span>}
          </button>

          {/* Desktop Collapse Toggle */}
          <div className="hidden lg:flex items-center justify-between pt-2 border-t border-slate-200/50">
            {!isCollapsed && (
              <span className="text-[10px] text-slate-400 font-medium">Collapse sidebar</span>
            )}
            <button
              onClick={onToggleCollapse}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors ml-auto"
              title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
