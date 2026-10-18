import React, { useState, useEffect } from 'react';
import apiClient from '../api/apiClient';
import { useAuth } from '../context/AuthContext';
import {
  Truck,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Building2,
  MapPin,
  Star,
  Send,
  AlertCircle,
  Key
} from 'lucide-react';
import StatusBadge from '../components/StatusBadge';

const PickupTracking = () => {
  const { user } = useAuth();
  const isDonor = user?.role === 'donor';

  const [pickups, setPickups] = useState([]);
  const [loading, setLoading] = useState(true);

  // Verification PIN dialog state
  const [verifyModalPickup, setVerifyModalPickup] = useState(null);
  const [enteredPin, setEnteredPin] = useState('');
  const [verifyError, setVerifyError] = useState('');
  const [verifyLoading, setVerifyLoading] = useState(false);

  // Feedback dialog state
  const [feedbackPickup, setFeedbackPickup] = useState(null);
  const [rating, setRating] = useState(5);
  const [comments, setComments] = useState('');
  const [feedbackLoading, setFeedbackLoading] = useState(false);

  const [successMsg, setSuccessMsg] = useState('');

  const fetchPickups = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/pickups/my');
      if (res.data?.data) {
        setPickups(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load pickups:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPickups();
  }, []);

  const handleUpdateStatus = async (pickupId, newStatus) => {
    try {
      const res = await apiClient.put(`/pickups/${pickupId}/status`, { status: newStatus });
      if (res.data?.success) {
        setSuccessMsg(`Pickup marked as ${newStatus.replace('_', ' ')}!`);
        setTimeout(() => setSuccessMsg(''), 4000);
        fetchPickups();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update status.');
    }
  };

  const handleConfirmHandoffWithPin = async (e) => {
    e.preventDefault();
    if (!verifyModalPickup) return;
    setVerifyError('');
    setVerifyLoading(true);

    try {
      const res = await apiClient.put(`/pickups/${verifyModalPickup._id}/status`, {
        status: 'completed',
        verificationCode: enteredPin
      });

      if (res.data?.success) {
        setSuccessMsg('Handoff verified successfully! Donation completed and meals logged.');
        setTimeout(() => setSuccessMsg(''), 4000);
        setVerifyModalPickup(null);
        setEnteredPin('');
        fetchPickups();
      }
    } catch (err) {
      setVerifyError(err.response?.data?.message || 'Invalid verification PIN.');
    } finally {
      setVerifyLoading(false);
    }
  };

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    if (!feedbackPickup) return;
    setFeedbackLoading(true);

    try {
      await apiClient.post(`/pickups/${feedbackPickup._id}/feedback`, {
        rating,
        comments
      });
      setSuccessMsg('Thank you for rating this donation transfer!');
      setTimeout(() => setSuccessMsg(''), 4000);
      setFeedbackPickup(null);
      setComments('');
      fetchPickups();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit feedback.');
    } finally {
      setFeedbackLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
          <Truck className="w-6 h-6 text-brand-600" />
          <span>Pickup Tracking & Chain of Custody</span>
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Real-time logistics coordination, secure 6-digit OTP verification, and impact confirmation
        </p>
      </div>

      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-semibold text-emerald-800 flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {loading ? (
        <div className="py-20 text-center">
          <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-slate-500">Loading pickup records...</p>
        </div>
      ) : pickups.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80">
          <Truck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-800">No pickup dispatches found</h3>
          <p className="text-xs text-slate-500 mt-1">Once a claim is approved by the donor, pickup records appear here.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {pickups.map((p) => {
            const isCompleted = p.status === 'completed';
            const isRecipient = String(user?._id) === String(p.recipientId?._id);

            return (
              <div
                key={p._id}
                className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs hover:shadow-md transition-all space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Dispatched Batch
                    </span>
                    <h3 className="font-bold text-slate-900 text-base">{p.listingId?.title}</h3>
                  </div>
                  <StatusBadge status={p.status} />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  {/* Parties */}
                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                    <span className="text-[10px] font-bold uppercase text-slate-400 block">Participants</span>
                    <p className="font-bold text-slate-900 flex items-center gap-1">
                      <Building2 className="w-3.5 h-3.5 text-slate-500" />
                      <span>{p.donorId?.organizationDetails?.orgName || p.donorId?.name}</span>
                    </p>
                    <p className="text-slate-600 flex items-center gap-1">
                      <Truck className="w-3.5 h-3.5 text-slate-400" />
                      <span>Recipient: {p.recipientId?.organizationDetails?.orgName || p.recipientId?.name}</span>
                    </p>
                  </div>

                  {/* Quantity & Pickup Scheduled */}
                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                    <span className="text-[10px] font-bold uppercase text-slate-400 block">Quantity & Schedule</span>
                    <p className="font-extrabold text-brand-700 text-sm">
                      {p.quantity} {p.unit}
                    </p>
                    <p className="text-slate-500 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{new Date(p.scheduledPickupTime).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span>
                    </p>
                  </div>

                  {/* Verification Code Box */}
                  <div className={`p-3 rounded-2xl border text-center flex flex-col justify-center ${
                    isCompleted ? 'bg-emerald-50/70 border-emerald-200' : 'bg-brand-50/80 border-brand-200'
                  }`}>
                    <span className="text-[10px] font-bold uppercase text-slate-500 block">
                      {isCompleted ? 'Verified Transfer PIN' : 'Recipient Handover OTP'}
                    </span>
                    <span className="text-xl font-black tracking-widest text-slate-900 font-mono my-0.5">
                      {p.verificationCode}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      {isRecipient ? 'Show this PIN to donor on pickup' : 'Verify this PIN from recipient driver'}
                    </span>
                  </div>
                </div>

                {/* Pickup Address */}
                <div className="text-xs text-slate-600 flex items-center gap-1.5 pt-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span><strong>Pickup Point:</strong> {p.listingId?.pickupAddress}</span>
                </div>

                {/* Action Buttons */}
                <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                  <div className="text-[11px] text-slate-500">
                    {isCompleted ? (
                      <span className="text-emerald-700 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Completed at {new Date(p.actualPickupTime || p.updatedAt).toLocaleTimeString()}
                      </span>
                    ) : (
                      <span>Awaiting handoff verification</span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Status updates for In-Transit */}
                    {!isCompleted && p.status === 'scheduled' && (
                      <button
                        onClick={() => handleUpdateStatus(p._id, 'in_transit')}
                        className="px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-bold transition-colors"
                      >
                        Mark In-Transit
                      </button>
                    )}

                    {/* Donor Handoff Verification */}
                    {!isCompleted && isDonor && (
                      <button
                        onClick={() => {
                          setVerifyModalPickup(p);
                          setEnteredPin('');
                          setVerifyError('');
                        }}
                        className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-all flex items-center gap-1.5"
                      >
                        <Key className="w-3.5 h-3.5" />
                        <span>Verify PIN & Complete</span>
                      </button>
                    )}

                    {/* Feedback Rating Button for Recipient */}
                    {isCompleted && isRecipient && !p.feedback?.rating && (
                      <button
                        onClick={() => {
                          setFeedbackPickup(p);
                          setRating(5);
                          setComments('');
                        }}
                        className="px-4 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-bold transition-colors flex items-center gap-1.5"
                      >
                        <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                        <span>Submit Food Feedback</span>
                      </button>
                    )}

                    {p.feedback?.rating && (
                      <div className="flex items-center gap-1 px-3 py-1 rounded-xl bg-amber-50 text-amber-900 text-xs font-semibold">
                        <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                        <span>{p.feedback.rating} / 5 Rating Given</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Verify PIN Modal */}
      {verifyModalPickup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="text-center">
              <div className="w-12 h-12 rounded-2xl bg-brand-100 text-brand-700 mx-auto flex items-center justify-center mb-2">
                <Key className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Verify Pickup OTP</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Enter the 6-digit PIN provided by the recipient driver for "{verifyModalPickup.listingId?.title}".
              </p>
            </div>

            {verifyError && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
                {verifyError}
              </div>
            )}

            <form onSubmit={handleConfirmHandoffWithPin} className="space-y-4">
              <input
                type="text"
                required
                maxLength={6}
                value={enteredPin}
                onChange={(e) => setEnteredPin(e.target.value)}
                placeholder="e.g. 482910"
                className="w-full text-center text-2xl font-black tracking-widest py-3 rounded-xl border border-slate-200 font-mono focus:ring-2 focus:ring-brand-500 outline-hidden"
              />

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setVerifyModalPickup(null)}
                  className="w-1/2 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={verifyLoading || enteredPin.length !== 6}
                  className="w-1/2 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold disabled:opacity-50"
                >
                  {verifyLoading ? 'Verifying...' : 'Confirm Handoff'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Feedback Review Modal */}
      {feedbackPickup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Rate Food Quality & Transfer</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Help maintain community hygiene standards and encourage donors
              </p>
            </div>

            <form onSubmit={handleFeedbackSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">Quality Rating (1-5)</label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      type="button"
                      key={s}
                      onClick={() => setRating(s)}
                      className={`p-2 rounded-xl border transition-all ${
                        rating >= s ? 'bg-amber-50 border-amber-300 text-amber-500' : 'bg-slate-50 border-slate-200 text-slate-300'
                      }`}
                    >
                      <Star className="w-5 h-5 fill-current" />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Feedback Comments</label>
                <textarea
                  rows={3}
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  placeholder="e.g. Delicious hot food, properly packed in stainless trays. Nourished 60 elderly residents!"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-brand-500 outline-hidden"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setFeedbackPickup(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={feedbackLoading}
                  className="px-5 py-2 rounded-xl bg-brand-600 text-white text-xs font-bold shadow-xs"
                >
                  {feedbackLoading ? 'Submitting...' : 'Submit Feedback'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PickupTracking;
