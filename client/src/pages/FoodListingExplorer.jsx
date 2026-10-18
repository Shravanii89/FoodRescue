import React, { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import apiClient from '../api/apiClient';
import { useAuth } from '../context/AuthContext';
import {
  Search,
  Filter,
  Compass,
  MapPin,
  Clock,
  Utensils,
  Sparkles,
  SlidersHorizontal,
  ArrowRight,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import ExpiryBadge from '../components/ExpiryBadge';
import StatusBadge from '../components/StatusBadge';

const FoodListingExplorer = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });

  // Filter States
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [category, setCategory] = useState(searchParams.get('category') || '');
  const [dietaryType, setDietaryType] = useState(searchParams.get('dietaryType') || '');
  const [minQuantity, setMinQuantity] = useState(searchParams.get('minQuantity') || '');
  const [maxDistanceKm, setMaxDistanceKm] = useState(searchParams.get('maxDistanceKm') || '');

  const fetchListings = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (category) params.set('category', category);
      if (dietaryType) params.set('dietaryType', dietaryType);
      if (minQuantity) params.set('minQuantity', minQuantity);
      if (maxDistanceKm) params.set('maxDistanceKm', maxDistanceKm);

      // Pass user location if available for 2dsphere proximity search
      if (user?.location?.coordinates && maxDistanceKm) {
        params.set('lat', user.location.coordinates[1]);
        params.set('lng', user.location.coordinates[0]);
      }

      const res = await apiClient.get(`/listings?${params.toString()}`);
      if (res.data?.success) {
        setListings(res.data.data || []);
        setPagination(res.data.pagination || { page: 1, pages: 1, total: 0 });
      }
    } catch (err) {
      console.error('Failed to load listings:', err);
    } finally {
      setLoading(false);
    }
  }, [search, category, dietaryType, minQuantity, maxDistanceKm, user]);

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchListings();
    }, 250);
    return () => clearTimeout(delayDebounce);
  }, [fetchListings]);

  const categories = [
    { label: 'All Categories', value: '' },
    { label: 'Cooked Meals', value: 'cooked_meals' },
    { label: 'Bakery', value: 'bakery' },
    { label: 'Fruits & Veg', value: 'fruits_vegetables' },
    { label: 'Dairy', value: 'dairy_products' },
    { label: 'Packaged Goods', value: 'packaged_goods' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <Compass className="w-6 h-6 text-brand-600" />
            <span>Surplus Food Explorer</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Discover verified surplus batches filtered by category, distance, and expiry window
          </p>
        </div>

        <Link
          to="/smart-match"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-gradient-to-r from-brand-600 to-emerald-700 text-white font-bold text-xs shadow-md shadow-brand-600/20 hover:scale-105 transition-all"
        >
          <Sparkles className="w-4 h-4 text-emerald-200" />
          <span>Try Smart Match Engine</span>
        </Link>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by meal name, ingredient, or neighborhood..."
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 text-xs focus:ring-2 focus:ring-brand-500 outline-hidden bg-slate-50/50 focus:bg-white transition-all font-medium"
          />
        </div>

        {/* Quick Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {categories.map((c) => (
            <button
              key={c.value}
              onClick={() => setCategory(c.value)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                category === c.value
                  ? 'bg-brand-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        {/* Advanced Filter Row */}
        <div className="pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Dietary Preference
            </label>
            <select
              value={dietaryType}
              onChange={(e) => setDietaryType(e.target.value)}
              className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs bg-white text-slate-700 outline-hidden focus:ring-2 focus:ring-brand-500"
            >
              <option value="">Any Dietary</option>
              <option value="vegetarian">Vegetarian Only</option>
              <option value="vegan">Vegan Only</option>
              <option value="non-vegetarian">Non-Vegetarian</option>
              <option value="halal">Halal</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Minimum Quantity
            </label>
            <input
              type="number"
              min={1}
              placeholder="e.g. 25"
              value={minQuantity}
              onChange={(e) => setMinQuantity(e.target.value)}
              className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs bg-white text-slate-700 outline-hidden focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Max Distance (MongoDB 2dsphere)
            </label>
            <select
              value={maxDistanceKm}
              onChange={(e) => setMaxDistanceKm(e.target.value)}
              className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs bg-white text-slate-700 outline-hidden focus:ring-2 focus:ring-brand-500"
            >
              <option value="">Any Distance</option>
              <option value="3">Within 3 km</option>
              <option value="5">Within 5 km</option>
              <option value="10">Within 10 km</option>
              <option value="20">Within 20 km</option>
            </select>
          </div>
        </div>
      </div>

      {/* Listings Grid */}
      {loading ? (
        <div className="py-20 text-center">
          <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-slate-500">Querying surplus food records...</p>
        </div>
      ) : listings.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80">
          <Utensils className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h2 className="text-sm font-bold text-slate-800">No surplus food batches match your criteria</h2>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Try adjusting your search filters or resetting distance limits to view more donations.
          </p>
          <button
            onClick={() => {
              setSearch('');
              setCategory('');
              setDietaryType('');
              setMinQuantity('');
              setMaxDistanceKm('');
            }}
            className="mt-4 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 transition-colors"
          >
            Clear All Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {listings.map((item) => (
            <div
              key={item._id}
              className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
            >
              <div>
                {/* Header Tags */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700">
                    {item.category?.replace('_', ' ')}
                  </span>
                  <ExpiryBadge expiryTime={item.expiryTime} />
                </div>

                {/* Title & Description */}
                <h3 className="text-base font-bold text-slate-900 group-hover:text-brand-700 transition-colors line-clamp-1">
                  {item.title}
                </h3>
                <p className="mt-1 text-xs text-slate-500 line-clamp-2 leading-relaxed">
                  {item.description || 'High-quality freshly prepared surplus batch.'}
                </p>

                {/* Metadata Pills */}
                <div className="mt-4 pt-3 border-t border-slate-100 space-y-2 text-xs text-slate-600">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Available Stock:</span>
                    <span className="font-extrabold text-brand-700">
                      {item.remainingQuantity} <span className="text-slate-500 font-normal">/ {item.quantity} {item.unit}</span>
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Dietary:</span>
                    <span className="font-semibold capitalize text-slate-800">{item.dietaryType}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Donor:</span>
                    <span className="font-medium text-slate-800 truncate max-w-[150px]">
                      {item.donorId?.organizationDetails?.orgName || item.donorId?.name || 'Local Kitchen'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" />
                      Location:
                    </span>
                    <span className="text-slate-700 truncate max-w-[160px]">
                      {item.pickupAddress}
                    </span>
                  </div>
                </div>
              </div>

              {/* Bottom Action */}
              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <StatusBadge status={item.status} />

                <Link
                  to={`/listings/${item._id}`}
                  className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-xs transition-all flex items-center gap-1.5"
                >
                  <span>Claim / Details</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FoodListingExplorer;
