import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import apiClient from '../api/apiClient';
import { useAuth } from '../context/AuthContext';
import {
  ArrowLeft,
  Clock,
  MapPin,
  Building2,
  Phone,
  Utensils,
  ThermometerSnowflake,
  ShieldCheck,
  HeartHandshake,
  CheckCircle2,
  AlertCircle,
  Truck,
  Sparkles
} from 'lucide-react';
import ExpiryBadge from '../components/ExpiryBadge';
import StatusBadge from '../components/StatusBadge';

const ListingDetails = () => {
  const { id } = useParams();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Claim Request Form State
  const [requestedQuantity, setRequestedQuantity] = useState('');
  const [peopleToFeed, setPeopleToFeed] = useState('');
  const [proposedTime, setProposedTime] = useState('');
  const [vehicleType, setVehicleType] = useState('van');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [claimSuccess, setClaimSuccess] = useState(false);

  useEffect(() => {
    const fetchListing = async () => {
      try {
        setLoading(true);
        const res = await apiClient.get(`/listings/${id}`);
        if (res.data?.data) {
          const data = res.data.data;
          setListing(data);
          setRequestedQuantity(Math.min(data.remainingQuantity, 40));
          setPeopleToFeed(Math.min(data.remainingQuantity, 40));

          // Default proposed pickup time to 1.5 hours from now
          const targetTime = new Date(Date.now() + 1.5 * 3600 * 1000);
          targetTime.setMinutes(targetTime.getMinutes() - targetTime.getTimezoneOffset());
          setProposedTime(targetTime.toISOString().slice(0, 16));
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Listing not found.');
      } finally {
        setLoading(false);
      }
    };
    fetchListing();
  }, [id]);

  const handleClaimSubmit = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    setError('');
    setSubmitting(true);

    try {
      const res = await apiClient.post('/requests', {
        listingId: listing._id,
        requestedQuantity: Number(requestedQuantity),
        peopleToFeed: Number(peopleToFeed),
        pickupDetails: {
          proposedTime: new Date(proposedTime),
          vehicleType,
          contactPerson: user?.name,
          contactPhone: user?.phone
        },
        message
      });

      if (res.data?.success) {
        setClaimSuccess(true);
        // Update remaining stock locally
        setListing((prev) => ({
          ...prev,
          remainingQuantity: res.data.listing.remainingQuantity,
          status: res.data.listing.status
        }));
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit claim request.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center">
        <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs text-slate-500">Loading food donation details...</p>
      </div>
    );
  }

  if (error || !listing) {
    return (
      <div className="max-w-md mx-auto py-12 text-center">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
        <h2 className="text-base font-bold text-slate-800">Donation Unavailable</h2>
        <p className="text-xs text-slate-500 mt-1">{error || 'This listing does not exist.'}</p>
        <Link
          to="/explore"
          className="mt-4 inline-block px-4 py-2 rounded-xl bg-brand-600 text-white font-bold text-xs"
        >
          Back to Explorer
        </Link>
      </div>
    );
  }

  const isDonorOwner = user && String(listing.donorId?._id) === String(user._id);
  const isAvailable = (listing.status === 'available' || listing.status === 'partially_claimed') && listing.remainingQuantity > 0;
  const isExpired = new Date() > new Date(listing.expiryTime);

  return (
    <div className="max-w-4xl mx-auto py-4 space-y-6">
      {/* Top Breadcrumb */}
      <div className="flex items-center gap-3">
        <Link
          to="/explore"
          className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <span className="text-xs text-slate-400">Available Donations /</span>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 line-clamp-1">{listing.title}</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Column: Food Listing Specification */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-brand-50 text-brand-800 border border-brand-100">
                  {listing.category?.replace('_', ' ')}
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-semibold capitalize bg-slate-100 text-slate-700">
                  {listing.dietaryType}
                </span>
              </div>
              <ExpiryBadge expiryTime={listing.expiryTime} />
            </div>

            <div>
              <h2 className="text-lg font-bold text-slate-900">Food Description</h2>
              <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
                {listing.description || 'Freshly prepared edible surplus food ready for humanitarian distribution.'}
              </p>
            </div>

            {/* Inventory & Timing Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 p-4 rounded-2xl bg-slate-50/80 border border-slate-100 text-xs">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Remaining Stock</span>
                <span className="text-base font-extrabold text-brand-700">
                  {listing.remainingQuantity} {listing.unit}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Initial Batch</span>
                <span className="text-base font-bold text-slate-700">
                  {listing.quantity} {listing.unit}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">People Fed</span>
                <span className="text-base font-bold text-emerald-700">
                  ~{listing.peopleFedEstimate} people
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Prepared At</span>
                <span className="font-medium text-slate-800">
                  {new Date(listing.preparationTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Expiry Date & Time</span>
                <span className="font-medium text-slate-800">
                  {new Date(listing.expiryTime).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Batch Status</span>
                <StatusBadge status={listing.status} className="mt-0.5" />
              </div>
            </div>

            {/* Storage & Refrigeration */}
            <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-100 text-xs text-slate-700 space-y-1.5">
              <p className="font-bold text-emerald-900 flex items-center gap-1.5">
                <ThermometerSnowflake className="w-4 h-4 text-emerald-700" />
                <span>Storage & Logistics Protocol</span>
              </p>
              <p className="text-slate-600">{listing.storageInstructions}</p>
              {listing.isRefrigerationRequired && (
                <p className="font-semibold text-blue-700 text-[11px] mt-1">
                  ❄️ Cold chain / insulated thermal transit required.
                </p>
              )}
            </div>

            {/* Donor Profile Card */}
            <div className="pt-4 border-t border-slate-100">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                Donor Organization Details
              </h3>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-brand-100 text-brand-700 font-bold flex items-center justify-center shrink-0">
                  <Building2 className="w-5 h-5" />
                </div>
                <div className="text-xs">
                  <p className="font-bold text-slate-900 text-sm">
                    {listing.donorId?.organizationDetails?.orgName || listing.donorId?.name}
                  </p>
                  <p className="text-slate-500 capitalize">
                    {listing.donorId?.organizationDetails?.orgType} Partner
                  </p>
                  <p className="text-slate-600 mt-1 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{listing.pickupAddress}</span>
                  </p>
                  {listing.donorId?.phone && (
                    <p className="text-slate-600 mt-0.5 flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{listing.donorId.phone}</span>
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Claim Action Form */}
        <div className="space-y-4">
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-card">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 rounded-xl bg-brand-50 text-brand-600">
                <HeartHandshake className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Request Food Claim</h3>
                <p className="text-[11px] text-slate-500">Atomic stock reservation for verified NGOs</p>
              </div>
            </div>

            {claimSuccess ? (
              <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-3 animate-fadeIn">
                <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                <h4 className="font-bold text-slate-900 text-sm">Claim Request Submitted!</h4>
                <p className="text-xs text-slate-600">
                  Your request has been routed to the donor for approval. The requested stock is temporarily reserved.
                </p>
                <Link
                  to="/requests"
                  className="block w-full py-2 px-3 rounded-xl bg-brand-600 text-white font-bold text-xs shadow-xs"
                >
                  Track in My Requests
                </Link>
              </div>
            ) : !isAvailable || isExpired ? (
              <div className="p-4 rounded-2xl bg-slate-100 text-center text-xs text-slate-500">
                <Clock className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="font-bold text-slate-700">Not Available for Claim</p>
                <p className="mt-1">This surplus batch has expired or has already been completely claimed.</p>
              </div>
            ) : isDonorOwner ? (
              <div className="p-4 rounded-2xl bg-slate-50 text-center text-xs text-slate-600">
                <p className="font-semibold">You are the donor of this batch.</p>
                <Link
                  to={`/listings/edit/${listing._id}`}
                  className="inline-block mt-3 px-4 py-1.5 rounded-xl bg-slate-200 text-slate-800 font-bold text-xs"
                >
                  Edit Listing
                </Link>
              </div>
            ) : user && user.role === 'recipient' && user.verificationStatus !== 'verified' ? (
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-2">
                <p className="font-bold flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-amber-600" />
                  <span>Account Pending Verification</span>
                </p>
                <p className="text-[11px] text-amber-800">
                  Your organization is pending administrative review. You will be able to claim surplus donations as soon as an administrator verifies your NGO credentials.
                </p>
              </div>
            ) : (
              <form onSubmit={handleClaimSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Requested Quantity ({listing.unit}) *
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    max={listing.remainingQuantity}
                    value={requestedQuantity}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setRequestedQuantity(val);
                      setPeopleToFeed(val);
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-brand-500 outline-hidden font-bold text-slate-900"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    Max claimable: {listing.remainingQuantity} {listing.unit}
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Individuals to Feed *
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={peopleToFeed}
                    onChange={(e) => setPeopleToFeed(e.target.value)}
                    placeholder="e.g. 35"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-brand-500 outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Proposed Pickup Time *
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={proposedTime}
                    onChange={(e) => setProposedTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-brand-500 outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Transport Vehicle
                  </label>
                  <select
                    value={vehicleType}
                    onChange={(e) => setVehicleType(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white capitalize outline-hidden focus:ring-2 focus:ring-brand-500"
                  >
                    <option value="van">Van / Small Truck</option>
                    <option value="car">Car / SUV</option>
                    <option value="auto">Auto Rickshaw</option>
                    <option value="bike">Two Wheeler with carrier</option>
                    <option value="on_foot">On Foot / Hand Cart</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Message to Kitchen (Optional)
                  </label>
                  <textarea
                    rows={2}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="e.g. Arriving with insulated food-grade containers."
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs outline-hidden focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-2.5 px-4 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md shadow-brand-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {submitting ? (
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <HeartHandshake className="w-4 h-4" />
                      <span>Submit Claim Request</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ListingDetails;
