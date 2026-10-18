import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  HeartHandshake,
  Bell,
  CheckCheck,
  LogOut,
  User,
  ShieldCheck,
  Building2,
  Sparkles,
  ChevronDown,
  Menu,
  ExternalLink
} from 'lucide-react';

const Navbar = ({ onToggleSidebar }) => {
  const {
    user,
    isAuthenticated,
    logout,
    notifications,
    unreadCount,
    markNotificationRead,
    markAllNotificationsRead,
    quickDemoLogin
  } = useAuth();

  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showDemoMenu, setShowDemoMenu] = useState(false);
  const notifRef = useRef(null);
  const userMenuRef = useRef(null);
  const demoMenuRef = useRef(null);
  const navigate = useNavigate();

  // Close popovers on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setShowUserMenu(false);
      }
      if (demoMenuRef.current && !demoMenuRef.current.contains(e.target)) {
        setShowDemoMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleDemoSwitch = async (role) => {
    try {
      await quickDemoLogin(role);
      setShowDemoMenu(false);
      if (role === 'admin') navigate('/admin/dashboard');
      else if (role === 'donor') navigate('/donor/dashboard');
      else navigate('/recipient/dashboard');
    } catch (err) {
      console.error('Demo switch error:', err);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Left: Mobile hamburger & Brand */}
        <div className="flex items-center gap-3">
          {isAuthenticated && (
            <button
              onClick={onToggleSidebar}
              className="lg:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              aria-label="Toggle navigation"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}

          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-700 to-emerald-500 flex items-center justify-center text-white shadow-md shadow-brand-500/20 group-hover:scale-105 transition-transform">
              <HeartHandshake className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xl font-extrabold tracking-tight text-slate-900 group-hover:text-brand-700 transition-colors">
                Food<span className="text-brand-600">Rescue</span>
              </span>
              <span className="hidden sm:inline-block ml-2 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded bg-brand-100 text-brand-800">
                AD System
              </span>
            </div>
          </Link>
        </div>

        {/* Center / Navigation Links for non-logged in */}
        {!isAuthenticated && (
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
            <Link to="/explore" className="hover:text-brand-600 transition-colors">Available Surplus</Link>
            <Link to="/analytics" className="hover:text-brand-600 transition-colors">Platform Impact</Link>
          </nav>
        )}

        {/* Right Action Bar */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Quick Demo Role Switcher (Highly recommended for college evaluation) */}
          <div className="relative" ref={demoMenuRef}>
            <button
              onClick={() => setShowDemoMenu(!showDemoMenu)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200/80 hover:bg-emerald-100 transition-colors"
              title="Quickly switch demo personas for presentation"
            >
              <Sparkles className="w-3.5 h-3.5 text-brand-600" />
              <span className="hidden sm:inline">Demo Switcher</span>
              <ChevronDown className="w-3 h-3 text-emerald-600" />
            </button>

            {showDemoMenu && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-100 p-2 z-50">
                <div className="px-3 py-2 border-b border-slate-100 mb-1">
                  <p className="text-xs font-bold text-slate-800 uppercase tracking-wider">Demo Accounts</p>
                  <p className="text-[11px] text-slate-500">1-click login for college presentation</p>
                </div>
                <button
                  onClick={() => handleDemoSwitch('donor')}
                  className="w-full text-left px-3 py-2 rounded-xl text-xs font-medium text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 flex items-center justify-between"
                >
                  <div>
                    <p className="font-semibold text-slate-900">Hotel / Donor</p>
                    <p className="text-[10px] text-slate-500">The Grand Orchid Suites</p>
                  </div>
                  <Building2 className="w-4 h-4 text-emerald-600" />
                </button>
                <button
                  onClick={() => handleDemoSwitch('recipient')}
                  className="w-full text-left px-3 py-2 rounded-xl text-xs font-medium text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 flex items-center justify-between"
                >
                  <div>
                    <p className="font-semibold text-slate-900">NGO / Recipient</p>
                    <p className="text-[10px] text-slate-500">Hope Community Kitchen</p>
                  </div>
                  <HeartHandshake className="w-4 h-4 text-emerald-600" />
                </button>
                <button
                  onClick={() => handleDemoSwitch('admin')}
                  className="w-full text-left px-3 py-2 rounded-xl text-xs font-medium text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 flex items-center justify-between"
                >
                  <div>
                    <p className="font-semibold text-slate-900">Platform Admin</p>
                    <p className="text-[10px] text-slate-500">System Verifications & Audit</p>
                  </div>
                  <ShieldCheck className="w-4 h-4 text-brand-700" />
                </button>
                <button
                  onClick={() => handleDemoSwitch('pending_ngo')}
                  className="w-full text-left px-3 py-2 rounded-xl text-xs font-medium text-amber-800 hover:bg-amber-50 flex items-center justify-between"
                >
                  <div>
                    <p className="font-semibold text-amber-900">Pending NGO</p>
                    <p className="text-[10px] text-amber-600">Sunrise Shelter (Unverified)</p>
                  </div>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-200 font-bold">Demo</span>
                </button>
              </div>
            )}
          </div>

          {isAuthenticated ? (
            <>
              {/* Notification Bell with Dropdown */}
              <div className="relative" ref={notifRef}>
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                  aria-label="View notifications"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-100 p-3 z-50 animate-fadeIn">
                    <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900">Notifications</span>
                        {unreadCount > 0 && (
                          <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-brand-100 text-brand-800">
                            {unreadCount} new
                          </span>
                        )}
                      </div>
                      {unreadCount > 0 && (
                        <button
                          onClick={markAllNotificationsRead}
                          className="text-xs text-brand-600 hover:text-brand-700 flex items-center gap-1 font-medium"
                        >
                          <CheckCheck className="w-3.5 h-3.5" />
                          Mark all read
                        </button>
                      )}
                    </div>

                    <div className="max-h-80 overflow-y-auto space-y-2">
                      {notifications.length === 0 ? (
                        <div className="p-6 text-center text-xs text-slate-400">
                          No notifications yet.
                        </div>
                      ) : (
                        notifications.map((n) => (
                          <div
                            key={n._id}
                            onClick={() => {
                              if (!n.isRead) markNotificationRead(n._id);
                              if (n.link) navigate(n.link);
                              setShowNotifications(false);
                            }}
                            className={`p-2.5 rounded-xl text-xs transition-colors cursor-pointer border ${
                              n.isRead
                                ? 'bg-white border-slate-100 text-slate-600'
                                : 'bg-brand-50/60 border-brand-100 text-slate-800 font-medium'
                            }`}
                          >
                            <p className="font-semibold text-slate-900 flex items-center justify-between">
                              {n.title}
                              {!n.isRead && (
                                <span className="w-2 h-2 rounded-full bg-brand-600"></span>
                              )}
                            </p>
                            <p className="mt-0.5 text-slate-600">{n.message}</p>
                            <span className="text-[10px] text-slate-400 mt-1 block">
                              {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* User Avatar & Menu */}
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-100 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-brand-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                    {user?.name ? user.name[0].toUpperCase() : 'U'}
                  </div>
                  <div className="hidden md:block text-left text-xs leading-tight">
                    <p className="font-semibold text-slate-900">{user?.name}</p>
                    <span className="inline-block px-1.5 py-0.2 rounded text-[10px] font-bold uppercase tracking-wider bg-brand-100 text-brand-800">
                      {user?.role}
                    </span>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 p-2 z-50">
                    <div className="px-3 py-2 border-b border-slate-100 mb-1">
                      <p className="text-xs font-bold text-slate-900">{user?.name}</p>
                      <p className="text-[11px] text-slate-500 truncate">{user?.email}</p>
                      {user?.organizationDetails?.orgName && (
                        <p className="text-[11px] text-brand-700 font-medium mt-0.5">
                          {user.organizationDetails.orgName}
                        </p>
                      )}
                    </div>

                    <Link
                      to="/profile"
                      onClick={() => setShowUserMenu(false)}
                      className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 rounded-xl"
                    >
                      <User className="w-4 h-4 text-slate-400" />
                      Profile & Location
                    </Link>

                    <button
                      onClick={() => {
                        logout();
                        setShowUserMenu(false);
                        navigate('/login');
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl mt-1"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 hover:text-brand-700 transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-brand-600 hover:bg-brand-700 text-white shadow-sm shadow-brand-500/20 transition-all"
              >
                Join Network
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
