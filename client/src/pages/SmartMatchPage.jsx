import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../api/apiClient';
import { useAuth } from '../context/AuthContext';
import {
  Sparkles,
  SlidersHorizontal,
  MapPin,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import ExpiryBadge from '../components/ExpiryBadge';
import PageHeader from '../components/PageHeader';
import EmptyState from '../components/EmptyState';

const SmartMatchPage = () => {
  const { user } = useAuth();
  const [recommendations, setRecommendations] = useState([]);
  const [predictions, setPredictions] = useState(null);
  const [loading, setLoading] = useState(true);

  // Criteria Filters
  const [desiredQuantity, setDesiredQuantity] = useState(user?.organizationDetails?.capacityDailyMeals || 40);
  const [dietaryType, setDietaryType] = useState('vegetarian');
  const [maxDistanceKm, setMaxDistanceKm] = useState('15');

  const fetchMatches = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (desiredQuantity) params.set('desiredQuantity', desiredQuantity);
      if (dietaryType) params.set('dietaryType', dietaryType);
      if (maxDistanceKm) params.set('maxDistanceKm', maxDistanceKm);

      const [matchRes, predRes] = await Promise.all([
        apiClient.get(`/match/recommendations?${params.toString()}`),
        apiClient.get('/analytics/predictions')
      ]);

      if (matchRes.data?.data) {
        setRecommendations(matchRes.data.data);
      }
      if (predRes.data?.data) {
        setPredictions(predRes.data.data);
      }
    } catch (err) {
      console.error('Smart match fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMatches();
  }, [desiredQuantity, dietaryType, maxDistanceKm]);

  const getScoreColor = (score) => {
    if (score >= 85) return 'text-forest bg-forest/10 border-forest/30';
    if (score >= 70) return 'text-teal-700 bg-teal-50 border-teal-300';
    if (score >= 50) return 'text-amber-700 bg-amber-50 border-amber-300';
    return 'text-slate-600 bg-slate-100 border-slate-300';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Smart Match Compatibility Engine"
        subtitle="Rule-based multi-factor optimization prioritizing proximity distance, meal capacity fit, dietary compliance, and food safety urgency."
        badge="Rule Engine v2.1"
        badgeVariant="success"
      />

      {/* Recipient Preference Filter Controls */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
            <SlidersHorizontal className="w-4 h-4 text-forest" />
            <span>Tune Matching Criteria</span>
          </div>
          <span className="text-[11px] text-slate-400 font-medium">
            {recommendations.length} compatible batches ranked
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Desired Meal Quantity
            </label>
            <input
              type="number"
              min={1}
              value={desiredQuantity}
              onChange={(e) => setDesiredQuantity(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 outline-hidden focus:ring-2 focus:ring-forest"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Dietary Preference
            </label>
            <select
              value={dietaryType}
              onChange={(e) => setDietaryType(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white text-slate-800 outline-hidden focus:ring-2 focus:ring-forest capitalize"
            >
              <option value="vegetarian">Vegetarian</option>
              <option value="vegan">Vegan Only</option>
              <option value="non-vegetarian">Non-Vegetarian</option>
              <option value="">Any Dietary Type</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Max Proximity Distance
            </label>
            <select
              value={maxDistanceKm}
              onChange={(e) => setMaxDistanceKm(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white text-slate-800 outline-hidden focus:ring-2 focus:ring-forest"
            >
              <option value="5">Within 5 km (Immediate rescue)</option>
              <option value="15">Within 15 km (Moderate transit)</option>
              <option value="30">Within 30 km (Wider metropolitan)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Ranked Recommendations List */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-forest" />
          <span>Ranked Compatibility Matches</span>
        </h2>

        {loading ? (
          <div className="py-16 text-center">
            <div className="w-8 h-8 border-4 border-forest border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs text-slate-500 font-medium">Calculating compatibility scores across active batches...</p>
          </div>
        ) : recommendations.length === 0 ? (
          <EmptyState
            icon={AlertTriangle}
            title="No matching surplus found for current criteria"
            description="Try extending your proximity distance or reducing the desired quantity threshold."
            actionText="Reset Criteria"
            onAction={() => {
              setDesiredQuantity(40);
              setDietaryType('vegetarian');
              setMaxDistanceKm('30');
            }}
          />
        ) : (
          <div className="space-y-4">
            {recommendations.map((item) => (
              <div
                key={item._id}
                className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-5"
              >
                {/* Left: Score Badge & Core Info */}
                <div className="flex items-start gap-4 flex-1">
                  {/* Circular Score Pill */}
                  <div className={`w-16 h-16 rounded-2xl border-2 flex flex-col items-center justify-center shrink-0 ${getScoreColor(item.matchScore)}`}>
                    <span className="text-xl font-black leading-none">{item.matchScore}%</span>
                    <span className="text-[9px] font-bold uppercase tracking-wider mt-0.5">Match</span>
                  </div>

                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700">
                        {item.category?.replace('_', ' ')}
                      </span>
                      <span className="text-xs font-semibold text-slate-700 capitalize">
                        • {item.dietaryType}
                      </span>
                      <ExpiryBadge expiryTime={item.expiryTime} />
                      <span className="text-xs font-medium text-slate-500 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        {item.distanceKm} km away
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-slate-900">{item.title}</h3>
                    <p className="text-xs text-slate-500 line-clamp-1">{item.description}</p>

                    {/* Transparent Explanation Box */}
                    <div className="p-3 rounded-xl bg-forest/5 border border-forest/15 text-xs text-slate-800 font-medium">
                      <span className="font-bold text-forest block text-[11px] mb-0.5">
                        Rule Matching Rationale:
                      </span>
                      {item.matchExplanation}
                    </div>

                    {/* Scoring Breakdown Tags */}
                    {item.matchBreakdown && (
                      <div className="flex flex-wrap items-center gap-2 pt-1 text-[10px] text-slate-500 font-semibold">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100">
                          Distance: {item.matchBreakdown.distanceScore}/30 pts
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-slate-100">
                          Quantity Fit: {item.matchBreakdown.quantityScore}/25 pts
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-slate-100">
                          Urgency Window: {item.matchBreakdown.urgencyScore}/25 pts
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-slate-100">
                          Dietary: {item.matchBreakdown.dietaryScore}/15 pts
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Action */}
                <div className="shrink-0 flex sm:flex-col items-center justify-end gap-2 border-t md:border-t-0 md:border-l border-slate-100 pt-3 md:pt-0 md:pl-6">
                  <div className="text-right hidden sm:block">
                    <span className="text-base font-extrabold text-forest block">
                      {item.remainingQuantity} {item.unit}
                    </span>
                    <span className="text-[10px] text-slate-400">Available to claim</span>
                  </div>

                  <Link
                    to={`/listings/${item._id}`}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-forest hover:bg-forest-light text-white font-bold text-xs shadow-xs transition-colors flex items-center justify-center gap-1.5"
                  >
                    <span>Claim Match</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Demand & Expiry Risk Prediction Section */}
      {predictions && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-forest" />
                <span>Demand & Expiry-Risk Prediction Analysis</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">{predictions.notice}</p>
            </div>
            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-forest/10 text-forest-light">
              Deterministic Analytics
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Category Demand Estimates */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                Historical Category Demand
              </h3>
              <div className="space-y-2">
                {predictions.categoryDemand?.slice(0, 5).map((cd) => (
                  <div
                    key={cd.category}
                    className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs"
                  >
                    <div>
                      <p className="font-bold text-slate-900 capitalize">
                        {cd.category?.replace('_', ' ')}
                      </p>
                      <span className="text-[10px] text-slate-400">
                        Avg {cd.avgPeopleFed} meals per claim
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="w-24 bg-slate-200 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-forest h-full rounded-full"
                          style={{ width: `${cd.demandScore}%` }}
                        />
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        cd.demandLevel === 'High'
                          ? 'bg-rose-100 text-rose-800'
                          : cd.demandLevel === 'Moderate'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {cd.demandLevel} Demand
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* High-Risk Near-Expiry Monitor */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                High-Risk Near-Expiry Surplus Watch
              </h3>
              <div className="space-y-2">
                {predictions.nearExpiryRiskList?.length === 0 ? (
                  <p className="text-xs text-slate-400 p-4 bg-slate-50 rounded-xl">
                    No active listings currently in critical expiry threshold.
                  </p>
                ) : (
                  predictions.nearExpiryRiskList?.slice(0, 4).map((ner) => (
                    <div
                      key={ner._id}
                      className="p-3 rounded-xl bg-amber-50/60 border border-amber-200/80 text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <p className="font-bold text-slate-900">{ner.title}</p>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700">
                          {ner.riskLevel}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        {ner.hoursRemaining}h remaining • {ner.remainingQuantity} {ner.unit}
                      </p>
                      <p className="text-[10px] text-forest font-semibold">
                        Action: {ner.recommendedAction}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SmartMatchPage;
