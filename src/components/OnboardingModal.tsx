import React, { useState } from 'react';
import {
  X,
  Check,
  ChevronRight,
  ChevronLeft,
  User,
  Sprout,
  MessageSquare,
  Sparkles,
  Phone,
  Globe,
  Clock,
  ShieldCheck,
  ArrowRight,
  Plus,
  Landmark,
  Calendar,
  Layers,
  Award,
} from 'lucide-react';
import { FarmerProfile, Language, ThemeMode, Crop } from '../types';
import { FarmpalEmblem } from './FarmpalLogo';
import { playFriendlyChime } from '../lib/sound';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCompleteOnboarding: (data: {
    profile: Partial<FarmerProfile>;
    initialCrops?: Array<{ name: string; acres: number; variety?: string }>;
    initialExpense?: { category: string; amount: number; description: string };
    useDemoData?: boolean;
  }) => Promise<void>;
  currentProfile?: FarmerProfile;
  currentTheme?: ThemeMode;
}

const COMMON_CROPS = [
  { name: 'Tomato', variety: 'Cobra F1 / Roma', defaultAcres: 2.0, icon: '🍅' },
  { name: 'Cucumber', variety: 'Darina F1', defaultAcres: 1.5, icon: '🥒' },
  { name: 'Sweetcorn', variety: 'Overland Hybrid', defaultAcres: 1.0, icon: '🌽' },
  { name: 'Pepper', variety: 'Rodo / Sombo', defaultAcres: 1.0, icon: '🌶️' },
  { name: 'Cassava', variety: 'TME 419 High Starch', defaultAcres: 3.0, icon: '🥔' },
  { name: 'Rice', variety: 'Faro 44 Lowland', defaultAcres: 2.5, icon: '🌾' },
  { name: 'Onion', variety: 'Red Creole / Gashua', defaultAcres: 1.0, icon: '🧅' },
  { name: 'Maize', variety: 'SAMMAZ White Grain', defaultAcres: 2.0, icon: '🌽' },
];

const NIGERIAN_STATES = [
  'Kano',
  'Kaduna',
  'Plateau',
  'Oyo',
  'Benue',
  'Niger',
  'Ogun',
  'Ondo',
  'Katsina',
  'Taraba',
  'Cross River',
  'Enugu',
  'Edo',
  'Bauchi',
  'Nasarawa',
  'Other / Outside Nigeria',
];

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  isOpen,
  onClose,
  onCompleteOnboarding,
  currentProfile,
  currentTheme = 'system',
}) => {
  const [step, setStep] = useState<number>(1);
  const totalSteps = 5;

  // Step 1: Farmer & Farm Details
  const [name, setName] = useState(currentProfile?.name || 'Musa Ibrahim');
  const [phone, setPhone] = useState(currentProfile?.phone || '+234 803 123 4567');
  const [stateLocation, setStateLocation] = useState(
    currentProfile?.location?.split(',')[0]?.trim() || 'Kano'
  );
  const [language, setLanguage] = useState<Language>(
    currentProfile?.preferredLanguage || 'en'
  );

  // Step 2: Crops Portfolio
  const [selectedCrops, setSelectedCrops] = useState<
    Array<{ name: string; variety?: string; acres: number; icon: string }>
  >([
    { name: 'Tomato', variety: 'Cobra F1', acres: 2.0, icon: '🍅' },
    { name: 'Cucumber', variety: 'Darina F1', acres: 1.5, icon: '🥒' },
  ]);
  const [customCropInput, setCustomCropInput] = useState('');

  // Step 3: Logging Habits & Channel Preferences
  const [primaryChannel, setPrimaryChannel] = useState<'whatsapp' | 'web' | 'ussd'>('whatsapp');
  const [reminderEnabled, setReminderEnabled] = useState(true);
  const [reminderTime, setReminderTime] = useState('19:00');

  // Step 4: First Farm Record
  const [firstEntryChoice, setFirstEntryChoice] = useState<'custom' | 'demo'>('custom');
  const [firstCategory, setFirstCategory] = useState('Fertilizer');
  const [firstAmount, setFirstAmount] = useState('15000');
  const [firstDesc, setFirstDesc] = useState('Bought 1 bag of NPK 15:15:15');

  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const toggleCrop = (crop: typeof COMMON_CROPS[0]) => {
    const exists = selectedCrops.find((c) => c.name === crop.name);
    if (exists) {
      if (selectedCrops.length > 1) {
        setSelectedCrops(selectedCrops.filter((c) => c.name !== crop.name));
      }
    } else {
      setSelectedCrops([
        ...selectedCrops,
        {
          name: crop.name,
          variety: crop.variety,
          acres: crop.defaultAcres,
          icon: crop.icon,
        },
      ]);
    }
  };

  const updateCropAcres = (cropName: string, delta: number) => {
    setSelectedCrops(
      selectedCrops.map((c) => {
        if (c.name === cropName) {
          const newAcres = Math.max(0.5, Math.round((c.acres + delta) * 10) / 10);
          return { ...c, acres: newAcres };
        }
        return c;
      })
    );
  };

  const addCustomCrop = () => {
    const trimmed = customCropInput.trim();
    if (!trimmed) return;
    if (!selectedCrops.some((c) => c.name.toLowerCase() === trimmed.toLowerCase())) {
      setSelectedCrops([
        ...selectedCrops,
        { name: trimmed, variety: 'Local Variety', acres: 1.0, icon: '🌱' },
      ]);
    }
    setCustomCropInput('');
  };

  const handleNextStep = () => {
    if (step < totalSteps) {
      setStep((prev) => prev + 1);
      playFriendlyChime();
    }
  };

  const handleFinish = async () => {
    setIsSubmitting(true);
    try {
      if (firstEntryChoice === 'demo') {
        await onCompleteOnboarding({
          profile: {
            name,
            phone,
            location: `${stateLocation}, Nigeria`,
            preferredLanguage: language,
            dailyReminderEnabled: reminderEnabled,
            dailyReminderTime: reminderTime,
            reminderChannel: primaryChannel === 'whatsapp' ? 'whatsapp' : 'both',
          },
          useDemoData: true,
        });
      } else {
        await onCompleteOnboarding({
          profile: {
            name,
            phone,
            location: `${stateLocation}, Nigeria`,
            preferredLanguage: language,
            dailyReminderEnabled: reminderEnabled,
            dailyReminderTime: reminderTime,
            reminderChannel: primaryChannel === 'whatsapp' ? 'whatsapp' : 'both',
          },
          initialCrops: selectedCrops.map((c) => ({
            name: c.name,
            variety: c.variety,
            acres: c.acres,
          })),
          initialExpense:
            Number(firstAmount) > 0
              ? {
                  category: firstCategory,
                  amount: Number(firstAmount),
                  description: firstDesc,
                }
              : undefined,
          useDemoData: false,
        });
      }
      playFriendlyChime();
      onClose();
    } catch (err) {
      console.error('Error during onboarding completion:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalAcres = selectedCrops.reduce((sum, c) => sum + c.acres, 0);

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fade-in">
      <div className="bg-white/95 dark:bg-[#1C1C1E]/95 backdrop-blur-2xl w-full max-w-2xl rounded-3xl shadow-[0_24px_64px_rgba(0,0,0,0.28)] border border-black/[0.08] dark:border-white/[0.12] overflow-hidden my-auto flex flex-col max-h-[92vh] transition-colors">
        {/* Header with Step Indicator */}
        <div className="p-5 sm:p-6 pb-4 border-b border-black/[0.06] dark:border-white/[0.08] shrink-0">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#34C759]/15 flex items-center justify-center text-[#248A3D] dark:text-[#30D158]">
                <FarmpalEmblem color="#34C759" className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider block">
                  New Farmer Onboarding
                </span>
                <h3 className="text-base sm:text-lg font-semibold text-[#1D1D1F] dark:text-[#FFFFFF] tracking-tight">
                  {step === 1 && 'Welcome! Tell us about your farm'}
                  {step === 2 && 'What crops are you cultivating?'}
                  {step === 3 && 'Choose your record-keeping channel'}
                  {step === 4 && 'Record your first farm entry'}
                  {step === 5 && 'Your FarmPal Workspace is Ready'}
                </h3>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-black/[0.04] dark:bg-white/[0.08] hover:bg-black/[0.08] dark:hover:bg-white/[0.14] text-[#1D1D1F] dark:text-[#F5F5F7] flex items-center justify-center transition-colors cursor-pointer"
              aria-label="Skip / Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Step Progress Dots & Bar */}
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full flex-1 transition-all duration-300 ${
                  i < step
                    ? 'bg-[#34C759]'
                    : i === step
                    ? 'bg-[#0071E3]'
                    : 'bg-black/[0.06] dark:bg-white/[0.1]'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {/* STEP 1: FARMER PROFILE & LOCATION */}
          {step === 1 && (
            <div className="space-y-4 animate-fade-in">
              <p className="text-xs text-neutral-600 dark:text-neutral-300">
                FarmPal adapts to your region, language, and WhatsApp contact so your daily expenses and sales sync automatically with zero manual spreadsheet work.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 block">
                    Farmer or Farm Enterprise Name
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-3 top-3 text-neutral-400" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Musa Ibrahim / GreenValley Farms"
                      className="w-full pl-9 pr-3 py-2.5 bg-black/[0.03] dark:bg-white/[0.05] border border-black/[0.08] dark:border-white/[0.1] rounded-xl text-xs text-[#1D1D1F] dark:text-[#FFFFFF] focus:outline-none focus:ring-2 focus:ring-[#0071E3]/30 font-medium"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 block">
                    WhatsApp Phone Number
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 absolute left-3 top-3 text-neutral-400" />
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+234 803 123 4567"
                      className="w-full pl-9 pr-3 py-2.5 bg-black/[0.03] dark:bg-white/[0.05] border border-black/[0.08] dark:border-white/[0.1] rounded-xl text-xs text-[#1D1D1F] dark:text-[#FFFFFF] focus:outline-none focus:ring-2 focus:ring-[#0071E3]/30 font-medium"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 block">
                    Farm Location / State
                  </label>
                  <select
                    value={stateLocation}
                    onChange={(e) => setStateLocation(e.target.value)}
                    className="w-full px-3 py-2.5 bg-black/[0.03] dark:bg-[#2C2C2E] border border-black/[0.08] dark:border-white/[0.1] rounded-xl text-xs text-[#1D1D1F] dark:text-[#FFFFFF] focus:outline-none font-medium cursor-pointer"
                  >
                    {NIGERIAN_STATES.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 block">
                    Preferred Assistant Language
                  </label>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value as Language)}
                    className="w-full px-3 py-2.5 bg-black/[0.03] dark:bg-[#2C2C2E] border border-black/[0.08] dark:border-white/[0.1] rounded-xl text-xs text-[#1D1D1F] dark:text-[#FFFFFF] focus:outline-none font-medium cursor-pointer"
                  >
                    <option value="en">English (Official)</option>
                    <option value="ha">Hausa (Harshen Hausa)</option>
                    <option value="yo">Yoruba (Èdè Yorùbá)</option>
                    <option value="ig">Igbo (Asụsụ Igbo)</option>
                  </select>
                </div>
              </div>

              {/* Trust Badge */}
              <div className="p-3 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 rounded-2xl flex items-center gap-2.5 text-xs text-emerald-900 dark:text-emerald-300">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  Your farm figures remain completely private to you. They are only shared when you explicitly apply for bank credit facilities or pledge produce to your cooperative aggregation hub.
                </span>
              </div>
            </div>
          )}

          {/* STEP 2: CROPS & ACREAGE */}
          {step === 2 && (
            <div className="space-y-4 animate-fade-in">
              <div>
                <p className="text-xs text-neutral-600 dark:text-neutral-300">
                  Select the primary crops you are currently growing. FarmPal tracks separate unit break-evens (e.g. ₦/crate or ₦/bag) and allocated input expenses for each.
                </p>
              </div>

              {/* Crop Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {COMMON_CROPS.map((crop) => {
                  const isSelected = selectedCrops.some((c) => c.name === crop.name);
                  return (
                    <button
                      key={crop.name}
                      type="button"
                      onClick={() => toggleCrop(crop)}
                      className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between h-24 ${
                        isSelected
                          ? 'border-[#34C759] bg-[#34C759]/10 text-[#1D1D1F] dark:text-white shadow-2xs'
                          : 'border-black/[0.06] dark:border-white/[0.08] bg-black/[0.02] dark:bg-white/[0.03] text-neutral-600 dark:text-neutral-400 hover:border-black/[0.15]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xl">{crop.icon}</span>
                        {isSelected ? (
                          <div className="w-5 h-5 rounded-full bg-[#34C759] text-white flex items-center justify-center">
                            <Check className="w-3 h-3 stroke-[2.5]" />
                          </div>
                        ) : (
                          <div className="w-5 h-5 rounded-full border border-black/[0.1] dark:border-white/[0.2]" />
                        )}
                      </div>
                      <div>
                        <span className="text-xs font-semibold block leading-tight">{crop.name}</span>
                        <span className="text-[10px] text-neutral-500 dark:text-neutral-400 truncate block">
                          {crop.variety}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Add Custom Crop */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="text"
                  value={customCropInput}
                  onChange={(e) => setCustomCropInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addCustomCrop();
                    }
                  }}
                  placeholder="Add another crop (e.g. Ginger, Soya, Groundnut)..."
                  className="flex-1 px-3 py-2 bg-black/[0.03] dark:bg-white/[0.05] border border-black/[0.08] dark:border-white/[0.1] rounded-xl text-xs text-[#1D1D1F] dark:text-[#FFFFFF] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={addCustomCrop}
                  className="px-3.5 py-2 bg-black/[0.06] dark:bg-white/[0.1] hover:bg-black/[0.1] text-xs font-semibold rounded-xl text-[#1D1D1F] dark:text-white transition-all cursor-pointer flex items-center gap-1 shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Crop</span>
                </button>
              </div>

              {/* Configured Crops Acreage Counter */}
              <div className="p-4 bg-black/[0.02] dark:bg-white/[0.03] rounded-2xl border border-black/[0.06] dark:border-white/[0.08] space-y-3">
                <div className="flex items-center justify-between text-xs font-semibold text-[#1D1D1F] dark:text-white">
                  <span>Selected Crops & Cultivated Acreage</span>
                  <span className="text-emerald-700 dark:text-emerald-400 font-mono">
                    Total: {totalAcres} Acres
                  </span>
                </div>

                <div className="space-y-2">
                  {selectedCrops.map((c) => (
                    <div
                      key={c.name}
                      className="flex items-center justify-between p-2.5 bg-white dark:bg-[#2C2C2E] rounded-xl border border-black/[0.04] dark:border-white/[0.06] shadow-2xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-base">{c.icon}</span>
                        <span className="text-xs font-semibold text-[#1D1D1F] dark:text-white">
                          {c.name}
                        </span>
                        {c.variety && (
                          <span className="text-[10px] text-neutral-400 hidden sm:inline">
                            ({c.variety})
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => updateCropAcres(c.name, -0.5)}
                          className="w-6 h-6 rounded-lg bg-black/[0.05] dark:bg-white/[0.1] text-xs font-bold text-[#1D1D1F] dark:text-white flex items-center justify-center hover:bg-black/[0.1] cursor-pointer"
                        >
                          -
                        </button>
                        <span className="text-xs font-mono font-semibold w-12 text-center text-[#1D1D1F] dark:text-white">
                          {c.acres} ac
                        </span>
                        <button
                          type="button"
                          onClick={() => updateCropAcres(c.name, 0.5)}
                          className="w-6 h-6 rounded-lg bg-black/[0.05] dark:bg-white/[0.1] text-xs font-bold text-[#1D1D1F] dark:text-white flex items-center justify-center hover:bg-black/[0.1] cursor-pointer"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: RECORDING HABIT & REMINDERS */}
          {step === 3 && (
            <div className="space-y-4 animate-fade-in">
              <p className="text-xs text-neutral-600 dark:text-neutral-300">
                Choose how you prefer to note down daily expenditures and harvest sales. You can use any combination anytime.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  {
                    id: 'whatsapp',
                    title: 'WhatsApp Voice & Chat',
                    badge: 'Most Popular',
                    desc: 'Text or send quick voice notes in Nigerian Pidgin, Hausa, or English.',
                    icon: <MessageSquare className="w-5 h-5 text-[#25D366]" />,
                  },
                  {
                    id: 'web',
                    title: 'Web & Mobile App',
                    badge: 'Full Visuals',
                    desc: 'Clean Apple-designed dashboard with live charts, debtors, and ledgers.',
                    icon: <Globe className="w-5 h-5 text-[#0071E3]" />,
                  },
                  {
                    id: 'ussd',
                    title: 'Offline USSD *384*24#',
                    badge: 'Zero Internet',
                    desc: 'Dial on any basic button phone without data or airtime constraints.',
                    icon: <Phone className="w-5 h-5 text-amber-500" />,
                  },
                ].map((ch) => (
                  <button
                    key={ch.id}
                    type="button"
                    onClick={() => setPrimaryChannel(ch.id as any)}
                    className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                      primaryChannel === ch.id
                        ? 'border-[#0071E3] bg-[#0071E3]/5 dark:bg-[#0071E3]/15 ring-2 ring-[#0071E3]/30 shadow-2xs'
                        : 'border-black/[0.06] dark:border-white/[0.08] bg-black/[0.02] dark:bg-white/[0.03] hover:border-black/[0.15]'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        {ch.icon}
                        <span className="text-[10px] font-semibold text-neutral-500 dark:text-neutral-400 bg-black/[0.04] dark:bg-white/[0.08] px-2 py-0.5 rounded-full">
                          {ch.badge}
                        </span>
                      </div>
                      <h4 className="text-xs font-semibold text-[#1D1D1F] dark:text-white block mb-1">
                        {ch.title}
                      </h4>
                      <p className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-relaxed">
                        {ch.desc}
                      </p>
                    </div>
                    {primaryChannel === ch.id && (
                      <div className="flex items-center gap-1 text-[11px] text-[#0071E3] font-semibold">
                        <Check className="w-3.5 h-3.5" />
                        <span>Selected Preference</span>
                      </div>
                    )}
                  </button>
                ))}
              </div>

              {/* Daily Reminder Setting */}
              <div className="p-4 bg-black/[0.02] dark:bg-white/[0.03] rounded-2xl border border-black/[0.06] dark:border-white/[0.08] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-semibold text-[#1D1D1F] dark:text-white">
                    <Clock className="w-4 h-4 text-emerald-600" />
                    <span>Daily 7:00 PM Gentle Check-in Reminder</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={reminderEnabled}
                      onChange={(e) => setReminderEnabled(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-10 h-5 bg-black/[0.1] dark:bg-white/[0.2] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#34C759]"></div>
                  </label>
                </div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  Sends an empathetic evening check-in asking: *"Hope farm work went well today? Did you buy fuel, pay weeders, or sell produce today?"* Non-intrusive and non-repeating.
                </p>
              </div>
            </div>
          )}

          {/* STEP 4: FIRST FARM RECORD */}
          {step === 4 && (
            <div className="space-y-4 animate-fade-in">
              <p className="text-xs text-neutral-600 dark:text-neutral-300">
                How would you like to start your notebook? Log your first real farm expense right now, or pre-load with realistic demonstration farm data.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setFirstEntryChoice('custom')}
                  className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                    firstEntryChoice === 'custom'
                      ? 'border-[#0071E3] bg-[#0071E3]/5 dark:bg-[#0071E3]/15 ring-2 ring-[#0071E3]/30 shadow-2xs'
                      : 'border-black/[0.06] dark:border-white/[0.08] bg-black/[0.02] dark:bg-white/[0.03]'
                  }`}
                >
                  <div>
                    <span className="text-xs font-semibold text-[#1D1D1F] dark:text-white block">
                      Option A: Log My Real First Entry
                    </span>
                    <span className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1 block">
                      Start fresh with your own crops and record an actual expense or seedling purchase.
                    </span>
                  </div>
                  {firstEntryChoice === 'custom' && (
                    <span className="text-[11px] text-[#0071E3] font-semibold flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> Selected
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setFirstEntryChoice('demo')}
                  className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                    firstEntryChoice === 'demo'
                      ? 'border-[#0071E3] bg-[#0071E3]/5 dark:bg-[#0071E3]/15 ring-2 ring-[#0071E3]/30 shadow-2xs'
                      : 'border-black/[0.06] dark:border-white/[0.08] bg-black/[0.02] dark:bg-white/[0.03]'
                  }`}
                >
                  <div>
                    <span className="text-xs font-semibold text-[#1D1D1F] dark:text-white block">
                      Option B: Load Sample Kano Demo Farm
                    </span>
                    <span className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1 block">
                      Explore pre-populated Tomato, Cucumber, Sweetcorn ledger, debtors, and market benchmarks.
                    </span>
                  </div>
                  {firstEntryChoice === 'demo' && (
                    <span className="text-[11px] text-[#0071E3] font-semibold flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> Selected
                    </span>
                  )}
                </button>
              </div>

              {firstEntryChoice === 'custom' && (
                <div className="p-4 bg-black/[0.02] dark:bg-white/[0.03] rounded-2xl border border-black/[0.06] dark:border-white/[0.08] space-y-3">
                  <span className="text-xs font-semibold text-[#1D1D1F] dark:text-white block">
                    Your First Expense Entry
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-neutral-600 dark:text-neutral-400 block">
                        Category
                      </label>
                      <select
                        value={firstCategory}
                        onChange={(e) => setFirstCategory(e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-[#2C2C2E] border border-black/[0.08] dark:border-white/[0.1] rounded-xl text-xs text-[#1D1D1F] dark:text-[#FFFFFF] focus:outline-none cursor-pointer"
                      >
                        <option value="Fertilizer">Fertilizer (NPK / Urea)</option>
                        <option value="Labour">Labour & Weeding</option>
                        <option value="Seeds">Seeds & Seedlings</option>
                        <option value="Chemicals">Chemicals & Spraying</option>
                        <option value="Fuel">Fuel for Water Pump</option>
                        <option value="Land">Land Preparation / Tillage</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-medium text-neutral-600 dark:text-neutral-400 block">
                        Amount (₦ Naira)
                      </label>
                      <input
                        type="number"
                        value={firstAmount}
                        onChange={(e) => setFirstAmount(e.target.value)}
                        placeholder="15000"
                        className="w-full px-3 py-2 bg-white dark:bg-[#2C2C2E] border border-black/[0.08] dark:border-white/[0.1] rounded-xl text-xs text-[#1D1D1F] dark:text-[#FFFFFF] focus:outline-none font-mono"
                      />
                    </div>

                    <div className="sm:col-span-2 space-y-1">
                      <label className="text-xs font-medium text-neutral-600 dark:text-neutral-400 block">
                        Brief Note / Description
                      </label>
                      <input
                        type="text"
                        value={firstDesc}
                        onChange={(e) => setFirstDesc(e.target.value)}
                        placeholder="e.g. Bought 1 bag of NPK 15:15:15 from agro-dealer"
                        className="w-full px-3 py-2 bg-white dark:bg-[#2C2C2E] border border-black/[0.08] dark:border-white/[0.1] rounded-xl text-xs text-[#1D1D1F] dark:text-[#FFFFFF] focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 5: CERTIFIED FARMPAL LAUNCHPAD */}
          {step === 5 && (
            <div className="space-y-4 animate-fade-in text-center py-2">
              <div className="w-14 h-14 rounded-3xl bg-[#34C759]/15 text-[#34C759] flex items-center justify-center mx-auto shadow-sm">
                <Award className="w-7 h-7 stroke-[2.2]" />
              </div>

              <div>
                <h4 className="text-lg font-bold text-[#1D1D1F] dark:text-white tracking-tight">
                  Welcome to FarmPal, {name.split(' ')[0]}!
                </h4>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 max-w-md mx-auto">
                  Your certified farm workspace and automated bookkeeping notebook has been initialized for {stateLocation}, Nigeria.
                </p>
              </div>

              {/* Digital Farmer ID Badge Preview */}
              <div className="max-w-sm mx-auto p-4 bg-gradient-to-br from-neutral-900 to-stone-900 text-white rounded-3xl shadow-xl border border-white/10 text-left space-y-3 relative overflow-hidden">
                <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                  <div className="flex items-center gap-2">
                    <FarmpalEmblem color="#34C759" className="w-5 h-5" />
                    <span className="text-xs font-bold tracking-tight">FARMPAL AGRI-ID</span>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-500/30">
                    Tier 1 Certified
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-neutral-400 block uppercase tracking-wider">
                    Farmer & Farm
                  </span>
                  <span className="text-sm font-bold text-white block">{name}</span>
                  <span className="text-xs text-neutral-300 block">
                    {stateLocation}, Nigeria • {totalAcres} Cultivated Acres
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-white/10 text-xs">
                  <div>
                    <span className="text-[10px] text-neutral-400 block">Active Crops</span>
                    <span className="font-semibold text-white truncate block">
                      {selectedCrops.map((c) => c.name).join(', ')}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-neutral-400 block">Primary Sync</span>
                    <span className="font-semibold text-emerald-400">
                      {primaryChannel === 'whatsapp' ? 'WhatsApp Voice' : 'Web & USSD'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/40 rounded-2xl text-xs text-blue-900 dark:text-blue-300 max-w-md mx-auto">
                💡 <strong>Tip:</strong> Any time you pay labourers or sell produce, simply send a voice note on WhatsApp or dial *384*24#—your break-even price updates automatically!
              </div>
            </div>
          )}
        </div>

        {/* Modal Bottom Actions */}
        <div className="p-4 sm:p-5 border-t border-black/[0.06] dark:border-white/[0.08] bg-black/[0.01] dark:bg-white/[0.02] flex items-center justify-between shrink-0">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep((prev) => prev - 1)}
              className="px-4 py-2 text-xs font-semibold text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white flex items-center gap-1 transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors cursor-pointer"
            >
              Skip Tour
            </button>
          )}

          {step < totalSteps ? (
            <button
              type="button"
              onClick={handleNextStep}
              className="px-5 py-2.5 bg-[#0071E3] hover:bg-[#0077ED] active:scale-95 text-white rounded-2xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
            >
              <span>Continue</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleFinish}
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-[#34C759] hover:bg-[#30B350] active:scale-95 text-white rounded-2xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-md disabled:opacity-50"
            >
              <span>{isSubmitting ? 'Setting up notebook...' : 'Launch My Farm Notebook'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
