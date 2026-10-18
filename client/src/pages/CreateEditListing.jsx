import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import apiClient from '../api/apiClient';
import { useAuth } from '../context/AuthContext';
import {
  Utensils,
  Clock,
  MapPin,
  ShieldAlert,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  ThermometerSnowflake,
  Sparkles
} from 'lucide-react';

const CreateEditListing = () => {
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const navigate = useNavigate();
  const { user } = useAuth();

  // Helper to format Date for datetime-local input
  const toLocalISO = (date) => {
    const d = new Date(date);
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 16);
  };

  const defaultPrep = toLocalISO(new Date());
  const defaultExp = toLocalISO(new Date(Date.now() + 6 * 3600 * 1000)); // 6 hours from now default

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'cooked_meals',
    quantity: 40,
    unit: 'meals',
    dietaryType: 'vegetarian',
    preparationTime: defaultPrep,
    expiryTime: defaultExp,
    pickupAddress: user?.location?.address || '100 Feet Rd, Indiranagar, Bengaluru',
    lat: user?.location?.coordinates?.[1] || 12.9784,
    lng: user?.location?.coordinates?.[0] || 77.6408,
    storageInstructions: 'Keep covered in clean warm containers. Consume within expiry.',
    isRefrigerationRequired: false
  });

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEditMode);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (isEditMode) {
      const fetchListing = async () => {
        try {
          const res = await apiClient.get(`/listings/${id}`);
          if (res.data?.data) {
            const data = res.data.data;
            setFormData({
              title: data.title,
              description: data.description || '',
              category: data.category,
              quantity: data.quantity,
              unit: data.unit,
              dietaryType: data.dietaryType,
              preparationTime: toLocalISO(data.preparationTime),
              expiryTime: toLocalISO(data.expiryTime),
              pickupAddress: data.pickupAddress,
              lat: data.location?.coordinates?.[1] || 12.9784,
              lng: data.location?.coordinates?.[0] || 77.6408,
              storageInstructions: data.storageInstructions || '',
              isRefrigerationRequired: Boolean(data.isRefrigerationRequired)
            });
          }
        } catch (err) {
          setError(err.response?.data?.message || 'Could not load listing details.');
        } finally {
          setFetching(false);
        }
      };
      fetchListing();
    }
  }, [id, isEditMode]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const payload = {
        ...formData,
        quantity: Number(formData.quantity),
        preparationTime: new Date(formData.preparationTime),
        expiryTime: new Date(formData.expiryTime),
        location: {
          type: 'Point',
          coordinates: [Number(formData.lng), Number(formData.lat)]
        }
      };

      if (isEditMode) {
        await apiClient.put(`/listings/${id}`, payload);
        setSuccess('Listing updated successfully!');
      } else {
        await apiClient.post('/listings', payload);
        setSuccess('Surplus food listing published to live network!');
      }

      setTimeout(() => {
        navigate('/donor/dashboard');
      }, 1200);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save listing.');
    } finally {
      setLoading(false);
    }
  };

  // Compute calculated hours left
  const diffHours = (new Date(formData.expiryTime) - new Date()) / (1000 * 3600);

  if (fetching) {
    return (
      <div className="py-20 text-center">
        <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs text-slate-500">Loading food listing details...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-4 space-y-6">
      <div className="flex items-center gap-3">
        <Link
          to="/donor/dashboard"
          className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900">
            {isEditMode ? 'Edit Surplus Food Batch' : 'List Surplus Edible Food'}
          </h1>
          <p className="text-xs text-slate-500">
            Provide transparent preparation details and location for instant NGO discovery
          </p>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-semibold text-rose-800 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-semibold text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-card space-y-6">
        {/* Basic Information */}
        <div>
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
            <Utensils className="w-4 h-4 text-brand-600" />
            <span>1. Food Description & Category</span>
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Food Item Name *</label>
              <input
                type="text"
                required
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="e.g. Fresh Steamed Rice & Dal Makhani Trays"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-brand-500 outline-hidden font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Details & Preparation Notes</label>
              <textarea
                name="description"
                rows={2}
                value={formData.description}
                onChange={handleChange}
                placeholder="Describe food contents, packaging method (e.g. sanitized stainless vessels), and origin."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-brand-500 outline-hidden"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Category *</label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-brand-500 outline-hidden bg-white capitalize"
                >
                  <option value="cooked_meals">Cooked Meals (Buffet / Banquet)</option>
                  <option value="bakery">Bakery & Breads</option>
                  <option value="fruits_vegetables">Fruits & Vegetables</option>
                  <option value="dairy_products">Dairy Products</option>
                  <option value="packaged_goods">Packaged Groceries</option>
                  <option value="raw_ingredients">Raw Cooking Ingredients</option>
                  <option value="beverages">Beverages</option>
                  <option value="other">Other Edible Food</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Dietary Classification *</label>
                <select
                  name="dietaryType"
                  value={formData.dietaryType}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-brand-500 outline-hidden bg-white capitalize"
                >
                  <option value="vegetarian">Vegetarian (Standard)</option>
                  <option value="vegan">Vegan (Strictly Plant-Based)</option>
                  <option value="non-vegetarian">Non-Vegetarian (Chicken/Mutton/Fish)</option>
                  <option value="halal">Halal Certified</option>
                  <option value="jain">Jain (No Root Veggies)</option>
                  <option value="mixed">Mixed Assortment</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Quantity and Metrics */}
        <div className="pt-4 border-t border-slate-100">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-brand-600" />
            <span>2. Quantity & Supply Capacity</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Total Available Quantity *</label>
              <input
                type="number"
                required
                min={1}
                name="quantity"
                value={formData.quantity}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-brand-500 outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Unit of Measure *</label>
              <select
                name="unit"
                value={formData.unit}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-brand-500 outline-hidden bg-white capitalize"
              >
                <option value="meals">Meals (Individual Portions)</option>
                <option value="kg">Kilograms (kg)</option>
                <option value="plates">Plates</option>
                <option value="portions">Portions</option>
                <option value="packets">Packets</option>
                <option value="litres">Litres</option>
                <option value="boxes">Boxes</option>
              </select>
            </div>
          </div>
        </div>

        {/* Timestamps & Expiry Window */}
        <div className="pt-4 border-t border-slate-100">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-brand-600" />
              <span>3. Timing & Safety Window (BSON Date)</span>
            </h2>
            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${diffHours > 2 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800 animate-pulse'}`}>
              {diffHours > 0 ? `~${diffHours.toFixed(1)} hrs shelf-life` : 'Expired window!'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Preparation Time *</label>
              <input
                type="datetime-local"
                required
                name="preparationTime"
                value={formData.preparationTime}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-brand-500 outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Expiry / Best Before Time *</label>
              <input
                type="datetime-local"
                required
                name="expiryTime"
                value={formData.expiryTime}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-brand-500 outline-hidden"
              />
            </div>
          </div>
        </div>

        {/* Location & Storage Instructions */}
        <div className="pt-4 border-t border-slate-100">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-brand-600" />
            <span>4. Pickup Address & Storage Protocol</span>
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Pickup Address *</label>
              <input
                type="text"
                required
                name="pickupAddress"
                value={formData.pickupAddress}
                onChange={handleChange}
                placeholder="Kitchen gate, 100 Ft Rd, Indiranagar, Bengaluru"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-brand-500 outline-hidden"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Latitude</label>
                <input
                  type="number"
                  step="0.0001"
                  name="lat"
                  value={formData.lat}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-brand-500 outline-hidden"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Longitude</label>
                <input
                  type="number"
                  step="0.0001"
                  name="lng"
                  value={formData.lng}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-brand-500 outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Storage & Handling Instructions</label>
              <input
                type="text"
                name="storageInstructions"
                value={formData.storageInstructions}
                onChange={handleChange}
                placeholder="Keep covered, transport in insulated carriers, distribute within 3 hours."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-brand-500 outline-hidden"
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="isRefrigerationRequired"
                name="isRefrigerationRequired"
                checked={formData.isRefrigerationRequired}
                onChange={handleChange}
                className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500 border-slate-300"
              />
              <label htmlFor="isRefrigerationRequired" className="text-xs font-medium text-slate-700 flex items-center gap-1.5 cursor-pointer">
                <ThermometerSnowflake className="w-3.5 h-3.5 text-blue-500" />
                <span>Cold-chain refrigeration or thermal ice boxes required during transport</span>
              </label>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
          <Link
            to="/donor/dashboard"
            className="px-5 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md shadow-brand-500/20 transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>{isEditMode ? 'Update Listing' : 'Publish Surplus Food Batch'}</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateEditListing;
