import React, { useState } from 'react';
import {
  X,
  Star,
  MessageSquare,
  Sparkles,
  CheckCircle,
  ThumbsUp,
  AlertTriangle,
  Mic,
  MicOff,
  Phone,
  MapPin,
  Send,
  HelpCircle,
  Heart,
} from 'lucide-react';
import { FarmerFeedback, FarmerProfile } from '../types';

interface FarmerFeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: FarmerProfile;
  onFeedbackSubmitted?: () => void;
}

const FEATURE_OPTIONS = [
  { id: 'whatsapp', label: '💬 WhatsApp Assistant', desc: 'Chat & voice note logging' },
  { id: 'ussd', label: '📞 *384*24# USSD', desc: 'Offline quick record dialing' },
  { id: 'planning', label: '📊 Crop Budgets & Burn', desc: 'Expense allocations & yield targets' },
  { id: 'market', label: '🌾 Market Benchmarks', desc: 'Wholesale prices (Mile 12, Dawanau)' },
  { id: 'inventory', label: '📦 Storehouse Inventory', desc: 'Fertilizers, chemicals & seeds stock' },
  { id: 'debtors', label: '📝 Debtors & Credit Sales', desc: 'Tracking buyers owing money' },
  { id: 'intelligence', label: '📈 Financial Intelligence', desc: 'Cashflow health & crop break-evens' },
];

export const FarmerFeedbackModal: React.FC<FarmerFeedbackModalProps> = ({
  isOpen,
  onClose,
  profile,
  onFeedbackSubmitted,
}) => {
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>(['whatsapp', 'market']);
  const [easeOfUse, setEaseOfUse] = useState<'very_easy' | 'easy' | 'moderate' | 'difficult'>('very_easy');
  const [clarity, setClarity] = useState<'clear' | 'needs_pidgin_hausa' | 'too_technical'>('clear');
  const [nairaMatch, setNairaMatch] = useState<'yes' | 'partially' | 'no'>('yes');
  const [whatWorkedWell, setWhatWorkedWell] = useState('');
  const [whatWasConfusing, setWhatWasConfusing] = useState('');
  const [desiredNextFeature, setDesiredNextFeature] = useState('');

  // Farmer info
  const [farmerName, setFarmerName] = useState(profile.name || '');
  const [phoneOrEmail, setPhoneOrEmail] = useState(profile.phone || '');
  const [farmLocation, setFarmLocation] = useState(profile.location || 'Nigeria');
  const [primaryCrops, setPrimaryCrops] = useState('');
  const [deviceType, setDeviceType] = useState<'Android Phone' | 'iPhone' | 'Feature Phone (USSD)' | 'Tablet' | 'Computer'>('Android Phone');

  // Audio note simulation
  const [isRecordingAudio, setIsRecordingAudio] = useState(false);
  const [audioDuration, setAudioDuration] = useState(0);
  const [audioTranscript, setAudioTranscript] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const toggleFeature = (id: string) => {
    setSelectedFeatures((prev) =>
      prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]
    );
  };

  const handleStartAudio = () => {
    setIsRecordingAudio(true);
    setAudioDuration(0);
    const interval = setInterval(() => {
      setAudioDuration((prev) => {
        if (prev >= 6) {
          clearInterval(interval);
          setIsRecordingAudio(false);
          setAudioTranscript('Farmer voice note recorded: "The app is very helpful for our cooperative group in Kano. The Mile 12 price comparison showed us where to sell our tomato crates."');
          if (!whatWorkedWell) {
            setWhatWorkedWell('The WhatsApp and voice notes are very natural. The Mile 12 vs Dawanau price comparison helped our farmers understand true market values.');
          }
          return prev;
        }
        return prev + 1;
      });
    }, 1000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          farmerName: farmerName.trim() || 'Farmer Tester',
          phoneOrEmail: phoneOrEmail.trim(),
          farmLocation: farmLocation.trim(),
          primaryCrops: primaryCrops.trim(),
          rating,
          testedFeatures: selectedFeatures,
          easeOfUseRating: easeOfUse,
          clarityOfLanguage: clarity,
          nairaAndUnitsMatch: nairaMatch,
          whatWorkedWell: whatWorkedWell.trim(),
          whatWasConfusing: whatWasConfusing.trim(),
          desiredNextFeature: desiredNextFeature.trim(),
          deviceType,
          audioNoteTranscript: audioTranscript,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to submit feedback');
      }

      setIsSuccess(true);
      if (onFeedbackSubmitted) {
        onFeedbackSubmitted();
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error saving feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const ratingDescriptions: Record<number, string> = {
    1: '1/5 - Very Difficult / Couldn’t use it',
    2: '2/5 - Confusing / Needs a lot of work',
    3: '3/5 - Okay / Usable with guidance',
    4: '4/5 - Good / Works well for my farm',
    5: '5/5 - Excellent / Life-saving tool for farmers! 🌾',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/70 backdrop-blur-xs overflow-y-auto">
      <div
        id="farmer-feedback-modal"
        className="bg-white rounded-2xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-stone-200 overflow-hidden my-auto"
      >
        {/* Modal Header */}
        <div className="bg-linear-to-r from-emerald-800 to-emerald-900 text-white p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-700/80 border border-emerald-500/40 flex items-center justify-center text-emerald-200 shadow-xs">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold flex items-center gap-2">
                Farmer Tester Feedback
                <span className="text-[11px] bg-emerald-600/90 text-emerald-100 font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Pilot Testing
                </span>
              </h2>
              <p className="text-xs text-emerald-200/90">
                Help us improve FarmPal for Nigerian farmers and cooperative members
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-emerald-200 hover:text-white p-1.5 rounded-lg hover:bg-emerald-700/60 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 text-stone-800">
          {isSuccess ? (
            <div className="py-8 text-center space-y-4">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle className="w-10 h-10" />
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-bold text-stone-900">Nagode! Daalu! Ese pupo!</h3>
                <p className="text-sm text-stone-600 max-w-md mx-auto">
                  Thank you for testing FarmPal. Your feedback directly guides our next updates for Nigerian farmers.
                </p>
              </div>

              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl max-w-md mx-auto text-left text-xs text-emerald-900 space-y-2">
                <div className="font-semibold flex items-center gap-1.5 text-emerald-800">
                  <Heart className="w-4 h-4 text-emerald-600 fill-emerald-600" />
                  What happens next?
                </div>
                <p>
                  Our agronomic & product team reviews every test report. If you included your phone/WhatsApp, we will notify you when your requested features are deployed!
                </p>
              </div>

              <div className="pt-4 flex justify-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsSuccess(false);
                    onClose();
                  }}
                  className="bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-semibold px-6 py-2.5 rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  Back to FarmPal
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {errorMessage && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-xs text-rose-800">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* 1. Overall Rating */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider">
                  1. Overall Experience Rating <span className="text-rose-600">*</span>
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => {
                    const isFilled = (hoverRating || rating) >= star;
                    return (
                      <button
                        type="button"
                        key={star}
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        className="p-1 focus:outline-hidden transition-transform active:scale-95 cursor-pointer"
                        title={`${star} stars`}
                      >
                        <Star
                          className={`w-7 h-7 sm:w-8 sm:h-8 transition-colors ${
                            isFilled
                              ? 'text-amber-400 fill-amber-400'
                              : 'text-stone-300 hover:text-amber-200'
                          }`}
                        />
                      </button>
                    );
                  })}
                  <span className="text-xs font-semibold text-stone-600 ml-2">
                    {ratingDescriptions[rating]}
                  </span>
                </div>
              </div>

              {/* 2. Which features did you test? */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider">
                  2. Which Features Did You Test? (Select all that apply)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {FEATURE_OPTIONS.map((feat) => {
                    const isChecked = selectedFeatures.includes(feat.id);
                    return (
                      <button
                        type="button"
                        key={feat.id}
                        onClick={() => toggleFeature(feat.id)}
                        className={`text-left p-2.5 rounded-xl border text-xs transition-all flex items-start gap-2.5 cursor-pointer ${
                          isChecked
                            ? 'bg-emerald-50 border-emerald-500 text-emerald-950 font-medium shadow-2xs'
                            : 'bg-stone-50/70 border-stone-200 text-stone-600 hover:bg-stone-100/80'
                        }`}
                      >
                        <div
                          className={`w-4 h-4 mt-0.5 rounded border flex items-center justify-center shrink-0 transition-colors ${
                            isChecked
                              ? 'bg-emerald-600 border-emerald-600 text-white'
                              : 'border-stone-300 bg-white'
                          }`}
                        >
                          {isChecked && <CheckCircle className="w-3 h-3" />}
                        </div>
                        <div>
                          <div className="font-semibold text-stone-900">{feat.label}</div>
                          <div className="text-[11px] text-stone-500">{feat.desc}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 3. Ease of Use & Local Context */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-stone-700">
                    Ease of Use for Farmers
                  </label>
                  <select
                    value={easeOfUse}
                    onChange={(e) => setEaseOfUse(e.target.value as any)}
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-xs text-stone-800 focus:outline-hidden focus:border-emerald-600 cursor-pointer"
                  >
                    <option value="very_easy">Very Easy (Quick & intuitive)</option>
                    <option value="easy">Easy (Comfortable after 1 try)</option>
                    <option value="moderate">Moderate (Needs minor explanation)</option>
                    <option value="difficult">Difficult (Hard for rural farmers)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-stone-700">
                    Language & Terminology
                  </label>
                  <select
                    value={clarity}
                    onChange={(e) => setClarity(e.target.value as any)}
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-xs text-stone-800 focus:outline-hidden focus:border-emerald-600 cursor-pointer"
                  >
                    <option value="clear">Clear & easy to understand</option>
                    <option value="needs_pidgin_hausa">Needs more Pidgin / Hausa / Yoruba</option>
                    <option value="too_technical">Too technical / banking jargon</option>
                  </select>
                </div>
              </div>

              {/* 4. Qualitative Feedback (What worked & what was confusing) */}
              <div className="space-y-3 pt-2">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-stone-700">
                    What worked best or impressed you? 🌟
                  </label>
                  <textarea
                    rows={2}
                    value={whatWorkedWell}
                    onChange={(e) => setWhatWorkedWell(e.target.value)}
                    placeholder="e.g., Recording expenses by simply chatting on WhatsApp, or comparing wholesale prices with Mile 12..."
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl p-3 text-xs text-stone-800 focus:outline-hidden focus:border-emerald-600"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-stone-700">
                    What was confusing, slow, or needs fixing? ⚠️
                  </label>
                  <textarea
                    rows={2}
                    value={whatWasConfusing}
                    onChange={(e) => setWhatWasConfusing(e.target.value)}
                    placeholder="e.g., The USSD steps were a bit fast, or I want crate sizes to clearly state 25kg standard crates..."
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl p-3 text-xs text-stone-800 focus:outline-hidden focus:border-emerald-600"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-stone-700">
                    What feature do you wish FarmPal had next? 💡
                  </label>
                  <textarea
                    rows={2}
                    value={desiredNextFeature}
                    onChange={(e) => setDesiredNextFeature(e.target.value)}
                    placeholder="e.g., Direct SMS payment receipts, audio notes in Hausa, connection to commercial buyers..."
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl p-3 text-xs text-stone-800 focus:outline-hidden focus:border-emerald-600"
                  />
                </div>
              </div>

              {/* Voice Note Simulation for Farmers */}
              <div className="p-3.5 bg-stone-50 border border-stone-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold text-stone-700 flex items-center gap-1.5">
                    <Mic className="w-3.5 h-3.5 text-emerald-600" />
                    Prefer to speak your feedback? (Voice Note)
                  </div>
                  {isRecordingAudio && (
                    <span className="text-[11px] font-mono text-rose-600 animate-pulse font-bold">
                      Recording: 0:0{audioDuration}s
                    </span>
                  )}
                </div>

                {audioTranscript ? (
                  <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-900 flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold">Audio Note Captured: </span>
                      {audioTranscript}
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleStartAudio}
                    disabled={isRecordingAudio}
                    className={`w-full py-2 px-3 rounded-lg border text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      isRecordingAudio
                        ? 'bg-rose-50 border-rose-300 text-rose-700 animate-pulse'
                        : 'bg-white border-stone-300 text-stone-700 hover:bg-emerald-50 hover:border-emerald-400 hover:text-emerald-800'
                    }`}
                  >
                    {isRecordingAudio ? (
                      <>
                        <MicOff className="w-4 h-4 text-rose-600" />
                        Listening to farmer voice note...
                      </>
                    ) : (
                      <>
                        <Mic className="w-4 h-4 text-emerald-600" />
                        Record 5-Second Voice Note Feedback
                      </>
                    )}
                  </button>
                )}
              </div>

              {/* 5. Tester Details */}
              <div className="pt-2 border-t border-stone-200 space-y-3">
                <div className="text-xs font-bold text-stone-700 uppercase tracking-wider">
                  Your Tester Profile
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                      Your Name
                    </label>
                    <input
                      type="text"
                      value={farmerName}
                      onChange={(e) => setFarmerName(e.target.value)}
                      placeholder="e.g. Mallam Musa / Folashade"
                      className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-xs text-stone-800 focus:outline-hidden focus:border-emerald-600"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                      Phone / WhatsApp Number
                    </label>
                    <input
                      type="text"
                      value={phoneOrEmail}
                      onChange={(e) => setPhoneOrEmail(e.target.value)}
                      placeholder="e.g. 0803 123 4567"
                      className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-xs text-stone-800 focus:outline-hidden focus:border-emerald-600"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                      Farm Location / State
                    </label>
                    <input
                      type="text"
                      value={farmLocation}
                      onChange={(e) => setFarmLocation(e.target.value)}
                      placeholder="e.g. Kano, Ogun, Kaduna"
                      className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-xs text-stone-800 focus:outline-hidden focus:border-emerald-600"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                      Main Crops Grown
                    </label>
                    <input
                      type="text"
                      value={primaryCrops}
                      onChange={(e) => setPrimaryCrops(e.target.value)}
                      placeholder="e.g. Tomato, Maize, Onion"
                      className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-xs text-stone-800 focus:outline-hidden focus:border-emerald-600"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                      Device You Are Testing On
                    </label>
                    <select
                      value={deviceType}
                      onChange={(e) => setDeviceType(e.target.value as any)}
                      className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-xs text-stone-800 focus:outline-hidden focus:border-emerald-600 cursor-pointer"
                    >
                      <option value="Android Phone">Android Phone</option>
                      <option value="iPhone">iPhone</option>
                      <option value="Feature Phone (USSD)">Feature Phone (USSD)</option>
                      <option value="Tablet">Tablet</option>
                      <option value="Computer">Laptop / Computer</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-4 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-semibold text-stone-600 hover:text-stone-800 hover:bg-stone-100 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white text-xs font-bold px-6 py-2.5 rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer active:scale-95"
                >
                  {isSubmitting ? (
                    'Saving Feedback...'
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      Submit Farmer Feedback
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
