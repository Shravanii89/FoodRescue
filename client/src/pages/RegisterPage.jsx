import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  HeartHandshake,
  Building2,
  Lock,
  Mail,
  User,
  Phone,
  MapPin,
  ArrowRight,
  AlertCircle,
  Eye,
  EyeOff
} from 'lucide-react';

const RegisterPage = () => {
  const [role, setRole] = useState('donor');
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    orgName: '',
    orgType: 'restaurant',
    registrationNumber: '',
    capacityDailyMeals: 60,
    description: '',
    address: 'Indiranagar 100 Feet Rd, Bengaluru',
    city: 'Bengaluru',
    lat: 12.9784,
    lng: 77.6408
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const payload = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role,
        phone: formData.phone,
        organizationDetails: {
          orgName: formData.orgName || formData.name,
          orgType: formData.orgType,
          registrationNumber: formData.registrationNumber,
          capacityDailyMeals: Number(formData.capacityDailyMeals),
          description: formData.description
        },
        location: {
          address: formData.address,
          city: formData.city,
          coordinates: [Number(formData.lng), Number(formData.lat)]
        }
      };

      const user = await register(payload);
      if (user.role === 'admin') navigate('/admin/dashboard');
      else if (user.role === 'donor') navigate('/donor/dashboard');
      else navigate('/recipient/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-8">
      <div className="text-center mb-8">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Join the FoodRescue Network
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Register your organization to start donating surplus food or claiming meals for your community
        </p>
      </div>

      {error && (
        <div className="mb-6 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Role Selection Tabs */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <button
          type="button"
          onClick={() => {
            setRole('donor');
            setFormData((p) => ({ ...p, orgType: 'restaurant' }));
          }}
          className={`p-4 rounded-2xl border text-left transition-all flex items-start gap-3 ${
            role === 'donor'
              ? 'bg-brand-50/80 border-brand-500 ring-2 ring-brand-500/20 shadow-xs'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className={`p-2.5 rounded-xl ${role === 'donor' ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <p className="font-bold text-slate-900 text-xs">Food Donor</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Hotel, Restaurant, Canteen, Bakery, Catering</p>
          </div>
        </button>

        <button
          type="button"
          onClick={() => {
            setRole('recipient');
            setFormData((p) => ({ ...p, orgType: 'ngo' }));
          }}
          className={`p-4 rounded-2xl border text-left transition-all flex items-start gap-3 ${
            role === 'recipient'
              ? 'bg-brand-50/80 border-brand-500 ring-2 ring-brand-500/20 shadow-xs'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className={`p-2.5 rounded-xl ${role === 'recipient' ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
            <HeartHandshake className="w-5 h-5" />
          </div>
          <div>
            <p className="font-bold text-slate-900 text-xs">Recipient / NGO</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Charity, Shelter, Orphanage, Community Kitchen</p>
          </div>
        </button>
      </div>

      {/* Registration Form */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-card">
        <form onSubmit={handleRegister} className="space-y-6">
          {/* Account Credentials */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              1. Account Credentials
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Contact Name *</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                  <input
                    type="text"
                    required
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="e.g. Chef Rajesh Sharma"
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-brand-500 outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address *</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                  <input
                    type="email"
                    required
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="contact@kitchen.org"
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-brand-500 outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Password *</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Min 6 characters"
                    className="w-full pl-9 pr-10 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-forest/20 focus:border-forest outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 transition-colors"
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+91 98765 43210"
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-brand-500 outline-hidden"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Organization Details */}
          <div className="pt-4 border-t border-slate-100">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              2. Organization Details
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Organization Name *</label>
                <input
                  type="text"
                  required
                  name="orgName"
                  value={formData.orgName}
                  onChange={handleChange}
                  placeholder={role === 'donor' ? 'The Grand Bistro & Suites' : 'Hope Children Care Home'}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-brand-500 outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Organization Type</label>
                <select
                  name="orgType"
                  value={formData.orgType}
                  onChange={handleChange}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-brand-500 outline-hidden bg-white capitalize"
                >
                  {role === 'donor' ? (
                    <>
                      <option value="restaurant">Restaurant</option>
                      <option value="hotel">Hotel & Banquet</option>
                      <option value="canteen">Canteen / Cafeteria</option>
                      <option value="hostel">Hostel Mess</option>
                      <option value="bakery">Bakery / Confectionery</option>
                      <option value="event_organizer">Event / Catering</option>
                      <option value="other">Other Commercial Donor</option>
                    </>
                  ) : (
                    <>
                      <option value="ngo">Registered NGO / Trust</option>
                      <option value="shelter">Night / Homeless Shelter</option>
                      <option value="community_kitchen">Community Kitchen</option>
                      <option value="other">Other Charitable Relief</option>
                    </>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Registration / FSSAI Number
                </label>
                <input
                  type="text"
                  name="registrationNumber"
                  value={formData.registrationNumber}
                  onChange={handleChange}
                  placeholder="e.g. FSSAI-2024-9988 or NGO-1287"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-brand-500 outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Daily Meals Capacity
                </label>
                <input
                  type="number"
                  name="capacityDailyMeals"
                  min={1}
                  value={formData.capacityDailyMeals}
                  onChange={handleChange}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-brand-500 outline-hidden"
                />
              </div>
            </div>
          </div>

          {/* Location Details (MongoDB 2dsphere GeoJSON) */}
          <div className="pt-4 border-t border-slate-100">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              3. Pickup / Distribution Location (GeoJSON Coords)
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Street Address</label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                  <input
                    type="text"
                    required
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="100 Feet Road, Indiranagar, Bengaluru"
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-brand-500 outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">City</label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-brand-500 outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Latitude</label>
                  <input
                    type="number"
                    step="0.0001"
                    name="lat"
                    value={formData.lat}
                    onChange={handleChange}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-brand-500 outline-hidden"
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
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-brand-500 outline-hidden"
                  />
                </div>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl bg-forest hover:bg-forest-light text-white font-bold text-xs shadow-md shadow-forest/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <span>Complete Registration</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-slate-100 text-center">
          <p className="text-xs text-slate-500">
            Already registered?{' '}
            <Link to="/login" className="font-bold text-forest hover:text-forest-light">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
