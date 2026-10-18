import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../api/apiClient';
import {
  HeartHandshake,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Truck,
  Leaf,
  Scale,
  Building2,
  Users,
  Utensils,
  Clock,
  Compass,
  CheckCircle2
} from 'lucide-react';
import ExpiryBadge from '../components/ExpiryBadge';
import StatusBadge from '../components/StatusBadge';

const LandingPage = () => {
  const [stats, setStats] = useState({
    totalMealsClaimed: 145,
    totalPeopleFed: 150,
    co2OffsetKg: 145,
    activeListingsCount: 6,
    totalDonors: 3,
    totalRecipients: 3
  });
  const [recentListings, setRecentListings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, listingsRes] = await Promise.all([
          apiClient.get('/analytics/dashboard-stats'),
          apiClient.get('/listings?limit=3')
        ]);
        if (statsRes.data?.stats) {
          setStats(statsRes.data.stats);
        }
        if (listingsRes.data?.data) {
          setRecentListings(listingsRes.data.data);
        }
      } catch (err) {
        console.warn('Could not load landing stats:', err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="space-y-16 lg:space-y-24 py-4">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-900 via-forest to-slate-900 text-white p-8 sm:p-12 lg:p-16 shadow-2xl">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 bg-brand-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -mb-12 -ml-12 w-96 h-96 bg-emerald-600/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-semibold text-emerald-300 mb-6">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Advanced Database Project • Smart Surplus Food Redistribution</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight text-white">
            Rescuing Surplus Food. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-green-200">
              Feeding Communities in Need.
            </span>
          </h1>

          <p className="mt-6 text-base sm:text-lg text-slate-300 leading-relaxed max-w-2xl">
            A state-of-the-art platform connecting hotels, restaurants, canteens, and caterers
            with verified NGOs and shelters. Powered by MongoDB geospatial indexing, atomic reservation,
            and rule-based Smart Match AI.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Link
              to="/explore"
              className="px-6 py-3.5 rounded-2xl bg-brand-500 hover:bg-brand-600 text-slate-950 font-bold text-sm shadow-lg shadow-brand-500/25 hover:shadow-brand-500/40 transition-all flex items-center gap-2 group"
            >
              <span>Explore Available Donations</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>

            <Link
              to="/login"
              className="px-6 py-3.5 rounded-2xl bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white font-semibold text-sm transition-all"
            >
              Sign In (Demo Logins)
            </Link>
          </div>
        </div>

        {/* Hero Impact Stats Bar */}
        <div className="mt-12 pt-8 border-t border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-6">
          <div>
            <p className="text-2xl sm:text-3xl font-extrabold text-brand-300">{stats.totalMealsClaimed}+</p>
            <p className="text-xs text-slate-400 mt-1">Meals Rescued</p>
          </div>
          <div>
            <p className="text-2xl sm:text-3xl font-extrabold text-emerald-300">{stats.totalPeopleFed}+</p>
            <p className="text-xs text-slate-400 mt-1">People Fed</p>
          </div>
          <div>
            <p className="text-2xl sm:text-3xl font-extrabold text-teal-300">{stats.co2OffsetKg} kg</p>
            <p className="text-xs text-slate-400 mt-1">CO₂ Offset</p>
          </div>
          <div>
            <p className="text-2xl sm:text-3xl font-extrabold text-lime-300">{stats.activeListingsCount}</p>
            <p className="text-xs text-slate-400 mt-1">Active Batches Live</p>
          </div>
        </div>
      </section>

      {/* The Problem vs Solution Section */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
        <div className="bg-white p-8 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mb-6">
              <Scale className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">The Food Wastage Challenge</h2>
            <p className="mt-3 text-sm text-slate-600 leading-relaxed">
              Every day, high-grade edible food from weddings, corporate banquets, college canteens,
              and bakeries is discarded due to tight expiry windows and a lack of real-time coordination
              with nearby charities.
            </p>
            <ul className="mt-4 space-y-2 text-xs text-slate-600">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                Over 40% of prepared banquet food remains unserved and disposed.
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                Shelters struggle to secure wholesome meals within strict preparation time limits.
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                Decomposing food in landfills accounts for massive methane and CO₂ emissions.
              </li>
            </ul>
          </div>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-brand-200/80 shadow-xs flex flex-col justify-between bg-gradient-to-br from-white to-brand-50/30">
          <div>
            <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center mb-6">
              <HeartHandshake className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">The FoodRescue Solution</h2>
            <p className="mt-3 text-sm text-slate-600 leading-relaxed">
              FoodRescue provides an end-to-end digital logistics pipeline connecting food donors
              and verified recipients with geospatial matching, atomic stock reservations, and pickup OTP handoffs.
            </p>
            <ul className="mt-4 space-y-2 text-xs text-slate-700">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-brand-600 shrink-0" />
                <span><strong>Smart Match AI:</strong> Calculates compatibility (0-100) using distance and expiry.</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-brand-600 shrink-0" />
                <span><strong>Atomic Protection:</strong> Conditional MongoDB updates prevent double claiming.</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-brand-600 shrink-0" />
                <span><strong>Admin Verification:</strong> Authenticates NGOs before granting access to food claims.</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* How It Works Workflow Steps */}
      <section className="bg-white p-8 sm:p-12 rounded-3xl border border-slate-200/80 shadow-xs">
        <div className="text-center max-w-xl mx-auto mb-10">
          <span className="text-xs font-bold uppercase tracking-wider text-brand-600 bg-brand-50 px-3 py-1 rounded-full">
            Platform Workflow
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-3">
            How Surplus Food Gets Rescued in 4 Steps
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100">
            <span className="w-8 h-8 rounded-xl bg-brand-600 text-white font-extrabold text-sm flex items-center justify-center mb-4 shadow-sm">
              1
            </span>
            <h3 className="font-bold text-slate-900 text-base">Donor Lists Surplus</h3>
            <p className="mt-2 text-xs text-slate-500 leading-relaxed">
              Kitchens log food category, quantity, dietary specs, prep time, and expiry window with pickup address.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100">
            <span className="w-8 h-8 rounded-xl bg-brand-600 text-white font-extrabold text-sm flex items-center justify-center mb-4 shadow-sm">
              2
            </span>
            <h3 className="font-bold text-slate-900 text-base">Smart Match Scoring</h3>
            <p className="mt-2 text-xs text-slate-500 leading-relaxed">
              Intelligent algorithm ranks nearby verified NGOs according to travel distance, quantity need, and expiry urgency.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100">
            <span className="w-8 h-8 rounded-xl bg-brand-600 text-white font-extrabold text-sm flex items-center justify-center mb-4 shadow-sm">
              3
            </span>
            <h3 className="font-bold text-slate-900 text-base">Atomic Claim & Review</h3>
            <p className="mt-2 text-xs text-slate-500 leading-relaxed">
              Recipient claims quantity with atomic conditional locks in MongoDB. Donor reviews and approves the request.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100">
            <span className="w-8 h-8 rounded-xl bg-brand-600 text-white font-extrabold text-sm flex items-center justify-center mb-4 shadow-sm">
              4
            </span>
            <h3 className="font-bold text-slate-900 text-base">OTP Verified Pickup</h3>
            <p className="mt-2 text-xs text-slate-500 leading-relaxed">
              NGO driver presents a 6-digit security PIN upon arrival. Food is distributed and environmental metrics are logged.
            </p>
          </div>
        </div>
      </section>

      {/* Live Available Food Preview */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">
              Live Surplus Food Available
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Active donations posted by registered local partners ready for immediate rescue
            </p>
          </div>
          <Link
            to="/explore"
            className="text-xs font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {recentListings.map((item) => (
            <div
              key={item._id}
              className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700">
                    {item.category?.replace('_', ' ')}
                  </span>
                  <ExpiryBadge expiryTime={item.expiryTime} />
                </div>

                <h3 className="text-base font-bold text-slate-900 line-clamp-1">{item.title}</h3>
                <p className="mt-1 text-xs text-slate-500 line-clamp-2">{item.description}</p>

                <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Available:</span>
                    <span className="font-bold text-brand-700">
                      {item.remainingQuantity} {item.unit}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Dietary:</span>
                    <span className="capitalize font-medium">{item.dietaryType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Donor:</span>
                    <span className="font-medium truncate max-w-[140px]">
                      {item.donorId?.organizationDetails?.orgName || item.donorId?.name || 'Local Partner'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100">
                <Link
                  to={`/listings/${item._id}`}
                  className="w-full py-2 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Utensils className="w-3.5 h-3.5" />
                  View & Claim Donation
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* College Project Evaluation Note */}
      <section className="p-6 rounded-2xl bg-slate-100 border border-slate-200 text-xs text-slate-600 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <p className="font-bold text-slate-800">Advanced Database (AD) College Project Information</p>
          <p className="mt-0.5 text-slate-500">
            Features MongoDB 2dsphere indexes, compound indexes, BSON date handling, aggregation pipelines, and atomic updates.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/login"
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-xs transition-colors"
          >
            Open Demo Sign In
          </Link>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
