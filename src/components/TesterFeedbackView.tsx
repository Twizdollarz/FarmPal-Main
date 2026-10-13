import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  Star,
  Plus,
  Share2,
  Download,
  Filter,
  ThumbsUp,
  AlertCircle,
  Lightbulb,
  CheckCircle,
  MapPin,
  Calendar,
  Smartphone,
  Phone,
  RotateCcw,
  Sparkles,
  Search,
  Trash2,
} from 'lucide-react';
import { FarmerFeedback, FeedbackSummary, FarmerProfile } from '../types';

interface TesterFeedbackViewProps {
  profile: FarmerProfile;
  onOpenFeedbackModal: () => void;
  onResetToCleanSlate: () => void;
  onReloadDemoFarm: () => void;
}

let cachedFeedbackData: { feedbacks: FarmerFeedback[]; summary: FeedbackSummary | null } | null = null;

export const TesterFeedbackView: React.FC<TesterFeedbackViewProps> = ({
  profile,
  onOpenFeedbackModal,
  onResetToCleanSlate,
  onReloadDemoFarm,
}) => {
  const [feedbacks, setFeedbacks] = useState<FarmerFeedback[]>(() => cachedFeedbackData?.feedbacks ?? []);
  const [summary, setSummary] = useState<FeedbackSummary | null>(() => cachedFeedbackData?.summary ?? null);
  const [isLoading, setIsLoading] = useState(() => !cachedFeedbackData);
  const [filterRating, setFilterRating] = useState<string>('all');
  const [filterFeature, setFilterFeature] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchFeedbacks = async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const res = await fetch('/api/feedback');
      if (res.ok) {
        const data = await res.json();
        const freshFeedbacks = data.feedbacks || [];
        const freshSummary = data.summary || null;
        cachedFeedbackData = { feedbacks: freshFeedbacks, summary: freshSummary };
        setFeedbacks(freshFeedbacks);
        setSummary(freshSummary);
      }
    } catch (err) {
      console.error('Error fetching feedbacks:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFeedbacks(Boolean(cachedFeedbackData));
  }, []);

  const handleDeleteFeedback = async (id: string) => {
    if (!window.confirm('Delete this feedback submission?')) return;
    try {
      const res = await fetch(`/api/feedback/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchFeedbacks();
      }
    } catch (err) {
      console.error('Failed to delete feedback:', err);
    }
  };

  const handleExportCsv = () => {
    if (feedbacks.length === 0) return;
    const headers = [
      'Date',
      'Farmer Name',
      'Phone/Email',
      'Location',
      'Primary Crops',
      'Rating',
      'Ease of Use',
      'Language Clarity',
      'Tested Features',
      'What Worked Well',
      'What Was Confusing',
      'Desired Next Feature',
      'Device Type',
    ];

    const rows = feedbacks.map((f) => [
      `"${f.createdAt.split('T')[0]}"`,
      `"${f.farmerName.replace(/"/g, '""')}"`,
      `"${(f.phoneOrEmail || '').replace(/"/g, '""')}"`,
      `"${f.farmLocation.replace(/"/g, '""')}"`,
      `"${(f.primaryCrops || '').replace(/"/g, '""')}"`,
      f.rating,
      `"${f.easeOfUseRating}"`,
      `"${f.clarityOfLanguage}"`,
      `"${f.testedFeatures.join(', ')}"`,
      `"${f.whatWorkedWell.replace(/"/g, '""')}"`,
      `"${f.whatWasConfusing.replace(/"/g, '""')}"`,
      `"${f.desiredNextFeature.replace(/"/g, '""')}"`,
      `"${f.deviceType || ''}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `farmpal-farmer-feedback-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter feedbacks
  const filteredFeedbacks = feedbacks.filter((f) => {
    if (filterRating !== 'all' && f.rating.toString() !== filterRating) {
      return false;
    }
    if (filterFeature !== 'all' && !f.testedFeatures.includes(filterFeature)) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = f.farmerName.toLowerCase().includes(q);
      const matchLoc = f.farmLocation.toLowerCase().includes(q);
      const matchWell = f.whatWorkedWell.toLowerCase().includes(q);
      const matchConfusing = f.whatWasConfusing.toLowerCase().includes(q);
      const matchDesired = f.desiredNextFeature.toLowerCase().includes(q);
      if (!matchName && !matchLoc && !matchWell && !matchConfusing && !matchDesired) {
        return false;
      }
    }
    return true;
  });

  const featureLabels: Record<string, string> = {
    whatsapp: '💬 WhatsApp Bot',
    ussd: '📞 USSD (*384*24#)',
    planning: '📊 Crop Budgets & Tasks',
    market: '🌾 Market Benchmarks',
    inventory: '📦 Farm Inventory',
    debtors: '📝 Debtors Tracker',
    general: '📱 General Usability',
  };

  return (
    <div id="tester-feedback-view" className="space-y-6 pb-12">
      {/* Top Banner & Action Header */}
      <div className="bg-linear-to-r from-emerald-800 to-emerald-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-emerald-700/30 rounded-full blur-2xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-2 bg-emerald-700/80 border border-emerald-500/40 px-3 py-1 rounded-full text-xs font-semibold text-emerald-200 uppercase tracking-wider shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
              <span>Pilot Testing & Farmer Validation</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Farmer Feedback Hub
            </h1>
            <p className="text-sm text-emerald-100/90 leading-relaxed">
              Real responses, usability ratings, and feature requests from farmers testing FarmPal in the field across Kano, Ogun, Plateau, and Kaduna clusters.
            </p>
          </div>

          <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 shrink-0">
            <button
              onClick={onOpenFeedbackModal}
              className="bg-white text-emerald-900 hover:bg-emerald-50 text-xs sm:text-sm font-bold px-4 py-2.5 rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer active:scale-95"
            >
              <Plus className="w-4 h-4 text-emerald-700" />
              <span>Submit Farmer Feedback</span>
            </button>
          </div>
        </div>

        {/* Quick Metric Cards */}
        {summary && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-emerald-700/60">
            <div className="bg-emerald-950/40 backdrop-blur-xs border border-emerald-700/50 p-3.5 rounded-2xl">
              <div className="text-xs text-emerald-300 font-medium">Total Feedback</div>
              <div className="text-2xl font-black mt-0.5">{summary.totalCount}</div>
              <div className="text-[11px] text-emerald-200/80 mt-0.5">Farmer testers</div>
            </div>

            <div className="bg-emerald-950/40 backdrop-blur-xs border border-emerald-700/50 p-3.5 rounded-2xl">
              <div className="text-xs text-emerald-300 font-medium">Average Rating</div>
              <div className="text-2xl font-black mt-0.5 flex items-center gap-1">
                {summary.averageRating}
                <Star className="w-4 h-4 text-amber-400 fill-amber-400 inline" />
              </div>
              <div className="text-[11px] text-emerald-200/80 mt-0.5">Out of 5.0 stars</div>
            </div>

            <div className="bg-emerald-950/40 backdrop-blur-xs border border-emerald-700/50 p-3.5 rounded-2xl">
              <div className="text-xs text-emerald-300 font-medium">Ease of Use</div>
              <div className="text-2xl font-black mt-0.5">
                {summary.totalCount > 0
                  ? Math.round(
                      (((summary.easeOfUseBreakdown.very_easy || 0) +
                        (summary.easeOfUseBreakdown.easy || 0)) /
                        summary.totalCount) *
                        100
                    )
                  : 100}
                %
              </div>
              <div className="text-[11px] text-emerald-200/80 mt-0.5">Rated easy / very easy</div>
            </div>

            <div className="bg-emerald-950/40 backdrop-blur-xs border border-emerald-700/50 p-3.5 rounded-2xl">
              <div className="text-xs text-emerald-300 font-medium">Most Tested</div>
              <div className="text-base font-bold mt-1 truncate">
                {summary.topTestedFeatures[0]?.feature
                  ? featureLabels[summary.topTestedFeatures[0].feature] || summary.topTestedFeatures[0].feature
                  : 'WhatsApp Bot'}
              </div>
              <div className="text-[11px] text-emerald-200/80 mt-0.5">Highest engagement</div>
            </div>
          </div>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-stone-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 w-full md:w-auto grow">
          <div className="relative grow md:max-w-xs">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search feedback, farmer, state..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs text-stone-800 focus:outline-hidden focus:border-emerald-600"
            />
          </div>

          <select
            value={filterRating}
            onChange={(e) => setFilterRating(e.target.value)}
            className="bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-xs text-stone-700 focus:outline-hidden focus:border-emerald-600 cursor-pointer"
          >
            <option value="all">All Ratings</option>
            <option value="5">⭐⭐⭐⭐⭐ (5 Stars)</option>
            <option value="4">⭐⭐⭐⭐ (4 Stars)</option>
            <option value="3">⭐⭐⭐ (3 Stars)</option>
            <option value="2">⭐⭐ (2 Stars)</option>
            <option value="1">⭐ (1 Star)</option>
          </select>

          <select
            value={filterFeature}
            onChange={(e) => setFilterFeature(e.target.value)}
            className="bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-xs text-stone-700 focus:outline-hidden focus:border-emerald-600 cursor-pointer hidden sm:inline-block"
          >
            <option value="all">All Features</option>
            <option value="whatsapp">WhatsApp Assistant</option>
            <option value="ussd">USSD Offline (*384*24#)</option>
            <option value="planning">Crop Budgets & Tasks</option>
            <option value="market">Market Prices</option>
            <option value="inventory">Storehouse Inventory</option>
            <option value="debtors">Debtors Book</option>
          </select>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          <button
            onClick={handleExportCsv}
            disabled={feedbacks.length === 0}
            className="bg-stone-100 hover:bg-stone-200 disabled:opacity-50 text-stone-700 text-xs font-semibold px-3.5 py-2 rounded-xl border border-stone-300 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-stone-500" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={fetchFeedbacks}
            className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold px-3 py-2 rounded-xl border border-emerald-300 transition-colors cursor-pointer"
            title="Refresh Feedback"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Feedback Submissions Feed */}
      {isLoading ? (
        <div className="p-12 text-center text-stone-500 text-xs">
          Loading farmer feedback responses...
        </div>
      ) : filteredFeedbacks.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 border border-stone-200 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
            <MessageSquare className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-stone-900">No Feedback Matches</h3>
          <p className="text-xs text-stone-500 max-w-sm mx-auto">
            {searchQuery || filterRating !== 'all' || filterFeature !== 'all'
              ? 'Try clearing your search filters to see all farmer feedback.'
              : 'Be the first farmer tester to submit a review!'}
          </p>
          <button
            onClick={onOpenFeedbackModal}
            className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold px-4 py-2 rounded-xl transition-colors cursor-pointer"
          >
            Submit First Feedback 💬
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredFeedbacks.map((f) => (
            <div
              key={f.id}
              className="bg-white rounded-2xl p-5 border border-stone-200 shadow-xs hover:border-emerald-300 transition-all space-y-3 flex flex-col justify-between"
            >
              {/* Card Header */}
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-bold text-stone-900 flex items-center gap-1.5">
                      <span>{f.farmerName}</span>
                      {f.primaryCrops && (
                        <span className="text-[11px] text-stone-500 font-normal">
                          ({f.primaryCrops})
                        </span>
                      )}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-stone-500 mt-0.5">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-stone-400" />
                        {f.farmLocation}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-stone-400" />
                        {new Date(f.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <div className="flex items-center bg-amber-50 border border-amber-200 px-2 py-1 rounded-lg">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-3.5 h-3.5 ${
                            star <= f.rating
                              ? 'text-amber-400 fill-amber-400'
                              : 'text-stone-300'
                          }`}
                        />
                      ))}
                    </div>
                    <button
                      onClick={() => handleDeleteFeedback(f.id)}
                      className="text-stone-300 hover:text-rose-600 p-1 rounded-md transition-colors cursor-pointer"
                      title="Delete entry"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Tested Features Chips */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {f.testedFeatures.map((featId) => (
                    <span
                      key={featId}
                      className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-semibold px-2 py-0.5 rounded-full"
                    >
                      {featureLabels[featId] || featId}
                    </span>
                  ))}
                  {f.deviceType && (
                    <span className="bg-stone-100 text-stone-600 text-[10px] font-medium px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Smartphone className="w-2.5 h-2.5" />
                      {f.deviceType}
                    </span>
                  )}
                </div>
              </div>

              {/* Feedback Content Points */}
              <div className="space-y-2.5 pt-2 text-xs border-t border-stone-100">
                {f.whatWorkedWell && (
                  <div className="bg-emerald-50/50 p-2.5 rounded-xl border border-emerald-100 space-y-1">
                    <div className="font-bold text-emerald-900 flex items-center gap-1.5 text-[11px]">
                      <ThumbsUp className="w-3 h-3 text-emerald-600" />
                      What worked best:
                    </div>
                    <p className="text-stone-700 italic leading-relaxed">
                      &quot;{f.whatWorkedWell}&quot;
                    </p>
                  </div>
                )}

                {f.whatWasConfusing && (
                  <div className="bg-amber-50/50 p-2.5 rounded-xl border border-amber-200/80 space-y-1">
                    <div className="font-bold text-amber-900 flex items-center gap-1.5 text-[11px]">
                      <AlertCircle className="w-3 h-3 text-amber-600" />
                      What was confusing / needs work:
                    </div>
                    <p className="text-stone-700 italic leading-relaxed">
                      &quot;{f.whatWasConfusing}&quot;
                    </p>
                  </div>
                )}

                {f.desiredNextFeature && (
                  <div className="bg-blue-50/50 p-2.5 rounded-xl border border-blue-200/80 space-y-1">
                    <div className="font-bold text-blue-900 flex items-center gap-1.5 text-[11px]">
                      <Lightbulb className="w-3 h-3 text-blue-600" />
                      Requested next feature:
                    </div>
                    <p className="text-stone-700 italic leading-relaxed">
                      &quot;{f.desiredNextFeature}&quot;
                    </p>
                  </div>
                )}
              </div>

              {/* Card Footer: Metadata */}
              <div className="pt-2 flex items-center justify-between text-[11px] text-stone-500 border-t border-stone-100">
                <span className="capitalize">
                  Ease: <strong className="text-stone-700">{f.easeOfUseRating.replace('_', ' ')}</strong>
                </span>
                {f.phoneOrEmail && (
                  <span className="flex items-center gap-1 text-stone-600 font-mono">
                    <Phone className="w-2.5 h-2.5 text-stone-400" />
                    {f.phoneOrEmail}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tester Onboarding & Farm State Banner */}
      <div className="bg-stone-50 rounded-2xl p-5 border border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h4 className="text-xs font-bold text-stone-800">
            Testing with a New Farmer Group?
          </h4>
          <p className="text-xs text-stone-500 mt-0.5">
            You can wipe demo mock records to start a clean farm, or reload the sample Kano farm whenever needed.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onResetToCleanSlate}
            className="bg-white border border-stone-300 hover:border-emerald-500 hover:text-emerald-800 text-stone-700 text-xs font-semibold px-3.5 py-2 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
          >
            <RotateCcw className="w-3.5 h-3.5 text-stone-400" />
            <span>Clean Farm Slate</span>
          </button>
          <button
            onClick={onReloadDemoFarm}
            className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold px-3.5 py-2 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
            <span>Reload Demo Farm</span>
          </button>
        </div>
      </div>
    </div>
  );
};
