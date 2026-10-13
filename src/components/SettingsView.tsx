import React, { useState, useEffect } from 'react';
import {
  User,
  Globe,
  Bell,
  CreditCard,
  RotateCcw,
  Check,
  ShieldCheck,
  Shield,
  Lock,
  Smartphone,
  Shuffle,
  Clock,
  MessageSquare,
  Sparkles,
  Sun,
  Moon,
  Monitor,
  Download,
} from 'lucide-react';
import { FarmerProfile, Language, DailyReminder, ThemeMode } from '../types';
import { translations } from '../lib/i18n';
import { playFriendlyChime } from '../lib/sound';

interface SettingsViewProps {
  profile: FarmerProfile;
  onUpdateProfile: (updated: Partial<FarmerProfile>) => Promise<void>;
  onResetSeed: () => Promise<void>;
  onTriggerTestReminder?: () => Promise<void>;
  onOpenWhatsAppLinkModal?: () => void;
  onOpenOnboarding?: () => void;
  onNavigateToAdmin?: () => void;
  isDeveloperMode?: boolean;
  onOpenDeveloperModal?: () => void;
  currentTheme?: ThemeMode;
  onThemeChange?: (theme: ThemeMode) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  profile,
  onUpdateProfile,
  onResetSeed,
  onTriggerTestReminder,
  onOpenWhatsAppLinkModal,
  onOpenOnboarding,
  onNavigateToAdmin,
  isDeveloperMode = false,
  onOpenDeveloperModal,
  currentTheme = 'system',
  onThemeChange,
}) => {
  const [name, setName] = useState(profile.name);
  const [phone, setPhone] = useState(profile.phone);
  const [location, setLocation] = useState(profile.location);
  const [language, setLanguage] = useState<Language>(profile.preferredLanguage);
  const [dailyReminder, setDailyReminder] = useState(profile.dailyReminderEnabled);
  const [reminderTime, setReminderTime] = useState(profile.dailyReminderTime);
  const [reminderChannel, setReminderChannel] = useState<'whatsapp' | 'in_app' | 'both'>(
    profile.reminderChannel || 'both'
  );
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [previewReminder, setPreviewReminder] = useState<DailyReminder | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  // Load an initial preview reminder
  useEffect(() => {
    loadPreview();
  }, []);

  const loadPreview = async (forceNew = false) => {
    try {
      setPreviewLoading(true);
      const res = await fetch(`/api/reminders/daily?forceNew=${forceNew}`);
      if (res.ok) {
        const data = await res.json();
        setPreviewReminder(data);
      }
    } catch (err) {
      console.error('Error loading reminder preview:', err);
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleShufflePreview = async () => {
    playFriendlyChime();
    await loadPreview(true);
  };

  const t = translations[language] || translations.en;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSavedSuccess(false);
    try {
      await onUpdateProfile({
        name,
        phone,
        location,
        preferredLanguage: language,
        dailyReminderEnabled: dailyReminder,
        dailyReminderTime: reminderTime,
        reminderChannel,
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async () => {
    if (
      confirm(
        'Reset all crops and records back to initial realistic demonstration seed data?'
      )
    ) {
      await onResetSeed();
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h2 className="text-xl font-bold text-stone-900 tracking-tight">Farm Settings & Profile</h2>
        <p className="text-xs text-stone-500">
          Manage your farmer profile, notifications, and language preferences.
        </p>
      </div>

      {savedSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>Settings saved successfully!</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-5">
        {/* Profile Card */}
        <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 text-sm font-bold text-stone-900 pb-2 border-b border-stone-100">
            <User className="w-4 h-4 text-emerald-700" />
            <span>Farmer Profile</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-stone-700 block mb-1.5">
                Farmer Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-2.5 text-xs bg-stone-50 border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-stone-700 block mb-1.5">
                Phone Number (WhatsApp)
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full p-2.5 text-xs bg-stone-50 border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                required
              />
            </div>

            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-stone-700 block mb-1.5">
                Farm Location
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full p-2.5 text-xs bg-stone-50 border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                required
              />
            </div>
          </div>
        </div>

        {/* Language Preferences Card */}
        <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 text-sm font-bold text-stone-900 pb-2 border-b border-stone-100">
            <Globe className="w-4 h-4 text-emerald-700" />
            <span>Preferred Language</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {[
              { code: 'en', label: 'English', sub: 'English' },
              { code: 'ig', label: 'Igbo', sub: 'Asụsụ Igbo' },
              { code: 'yo', label: 'Yoruba', sub: 'Èdè Yorùbá' },
              { code: 'ha', label: 'Hausa', sub: 'Harshen Hausa' },
            ].map((lang) => (
              <button
                key={lang.code}
                type="button"
                onClick={() => setLanguage(lang.code as Language)}
                className={`p-3 rounded-xl border text-left transition-all ${
                  language === lang.code
                    ? 'border-emerald-600 bg-emerald-50/60 ring-2 ring-emerald-500/20'
                    : 'border-stone-200 bg-stone-50/50 hover:bg-stone-50'
                }`}
              >
                <span className="text-xs font-bold text-stone-900 block">{lang.label}</span>
                <span className="text-[10px] text-stone-500">{lang.sub}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Appearance & Theme Selection Card (Apple HIG Style) */}
        <div className="bg-white dark:bg-[#1C1C1E] rounded-3xl p-6 border border-black/[0.05] dark:border-white/[0.08] shadow-2xs space-y-4 transition-colors">
          <div className="flex items-center justify-between pb-2 border-b border-black/[0.05] dark:border-white/[0.08]">
            <div className="flex items-center gap-2 text-sm font-semibold text-[#1D1D1F] dark:text-[#FFFFFF]">
              {currentTheme === 'dark' ? (
                <Moon className="w-4 h-4 text-indigo-400" />
              ) : (
                <Sun className="w-4 h-4 text-amber-500" />
              )}
              <span>Appearance & Display</span>
            </div>
            <span className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">
              {currentTheme === 'light' ? 'Light Mode' : currentTheme === 'dark' ? 'Dark Mode' : 'System Auto'}
            </span>
          </div>

          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            Choose an interface theme that suits your working environment—under direct sunlight on the farm or during evening bookkeeping.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            {/* Light Mode Preview */}
            <button
              type="button"
              onClick={() => onThemeChange && onThemeChange('light')}
              className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                currentTheme === 'light'
                  ? 'border-[#0071E3] bg-blue-50/40 dark:bg-blue-950/20 ring-2 ring-[#0071E3]/30'
                  : 'border-black/[0.08] dark:border-white/[0.08] bg-[#F5F5F7] dark:bg-[#2C2C2E] hover:border-black/[0.15]'
              }`}
            >
              {/* Mini Light UI Preview Box */}
              <div className="w-full h-16 rounded-xl bg-[#F5F5F7] border border-black/[0.08] p-2 flex flex-col justify-between shadow-2xs overflow-hidden">
                <div className="h-3 w-full bg-white rounded-md shadow-2xs flex items-center px-1.5 gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#FF3B30]" />
                  <div className="w-1.5 h-1.5 rounded-full bg-[#FFCC00]" />
                  <div className="w-1.5 h-1.5 rounded-full bg-[#34C759]" />
                </div>
                <div className="grid grid-cols-2 gap-1">
                  <div className="h-6 bg-white rounded-md border border-black/[0.04]" />
                  <div className="h-6 bg-white rounded-md border border-black/[0.04]" />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Sun className="w-3.5 h-3.5 text-amber-500" />
                  <span className="text-xs font-semibold text-[#1D1D1F] dark:text-white">Light</span>
                </div>
                {currentTheme === 'light' && (
                  <Check className="w-3.5 h-3.5 text-[#0071E3]" />
                )}
              </div>
            </button>

            {/* Dark Mode Preview */}
            <button
              type="button"
              onClick={() => onThemeChange && onThemeChange('dark')}
              className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                currentTheme === 'dark'
                  ? 'border-[#0071E3] bg-blue-50/40 dark:bg-blue-950/20 ring-2 ring-[#0071E3]/30'
                  : 'border-black/[0.08] dark:border-white/[0.08] bg-[#F5F5F7] dark:bg-[#2C2C2E] hover:border-black/[0.15]'
              }`}
            >
              {/* Mini Dark UI Preview Box */}
              <div className="w-full h-16 rounded-xl bg-[#000000] border border-white/[0.12] p-2 flex flex-col justify-between shadow-2xs overflow-hidden">
                <div className="h-3 w-full bg-[#1C1C1E] rounded-md border border-white/[0.08] flex items-center px-1.5 gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#FF453A]" />
                  <div className="w-1.5 h-1.5 rounded-full bg-[#FFD60A]" />
                  <div className="w-1.5 h-1.5 rounded-full bg-[#30D158]" />
                </div>
                <div className="grid grid-cols-2 gap-1">
                  <div className="h-6 bg-[#1C1C1E] rounded-md border border-white/[0.08]" />
                  <div className="h-6 bg-[#1C1C1E] rounded-md border border-white/[0.08]" />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Moon className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="text-xs font-semibold text-[#1D1D1F] dark:text-white">Dark</span>
                </div>
                {currentTheme === 'dark' && (
                  <Check className="w-3.5 h-3.5 text-[#0071E3]" />
                )}
              </div>
            </button>

            {/* Auto System Preview */}
            <button
              type="button"
              onClick={() => onThemeChange && onThemeChange('system')}
              className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                currentTheme === 'system'
                  ? 'border-[#0071E3] bg-blue-50/40 dark:bg-blue-950/20 ring-2 ring-[#0071E3]/30'
                  : 'border-black/[0.08] dark:border-white/[0.08] bg-[#F5F5F7] dark:bg-[#2C2C2E] hover:border-black/[0.15]'
              }`}
            >
              {/* Mini Split UI Preview Box */}
              <div className="w-full h-16 rounded-xl border border-black/[0.08] dark:border-white/[0.1] flex shadow-2xs overflow-hidden">
                <div className="w-1/2 h-full bg-[#F5F5F7] p-2 flex flex-col justify-between border-r border-black/[0.08]">
                  <div className="h-3 w-full bg-white rounded-md shadow-2xs flex items-center px-1">
                    <div className="w-1 h-1 rounded-full bg-[#FF3B30]" />
                  </div>
                  <div className="h-6 bg-white rounded-md border border-black/[0.04]" />
                </div>
                <div className="w-1/2 h-full bg-[#000000] p-2 flex flex-col justify-between">
                  <div className="h-3 w-full bg-[#1C1C1E] rounded-md border border-white/[0.08] flex items-center px-1">
                    <div className="w-1 h-1 rounded-full bg-[#30D158]" />
                  </div>
                  <div className="h-6 bg-[#1C1C1E] rounded-md border border-white/[0.08]" />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Monitor className="w-3.5 h-3.5 text-neutral-500" />
                  <span className="text-xs font-semibold text-[#1D1D1F] dark:text-white">Auto (System)</span>
                </div>
                {currentTheme === 'system' && (
                  <Check className="w-3.5 h-3.5 text-[#0071E3]" />
                )}
              </div>
            </button>
          </div>
        </div>

        {/* Daily 7:00 PM Reminder */}
        <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-stone-100">
            <div className="flex items-center gap-2 text-sm font-bold text-stone-900">
              <Bell className="w-4 h-4 text-emerald-700" />
              <span>Daily Check-in Reminder</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={dailyReminder}
                onChange={(e) => setDailyReminder(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-stone-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
            </label>
          </div>

          <div>
            <span className="text-xs font-bold text-stone-900 block">
              Friendly & Relatable Daily Prompts
            </span>
            <p className="text-[11px] text-stone-500 mt-0.5">
              FarmPal sends an empathetic check-in asking if you spent on fuel, labour, or inputs, or made any sales today. The wording is culturally relatable and non-repeating (different every single time).
            </p>
          </div>

          {dailyReminder && (
            <div className="space-y-4 pt-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Time Picker */}
                <div className="bg-stone-50 p-3 rounded-xl border border-stone-200 space-y-1.5">
                  <label className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Reminder Time</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="time"
                      value={reminderTime}
                      onChange={(e) => setReminderTime(e.target.value)}
                      className="p-1.5 text-xs bg-white border border-stone-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none font-medium"
                    />
                    <span className="text-[11px] text-stone-500">Default: 7:00 PM (19:00)</span>
                  </div>
                </div>

                {/* Delivery Channel */}
                <div className="bg-stone-50 p-3 rounded-xl border border-stone-200 space-y-1.5">
                  <label className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
                    <Smartphone className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Delivery Channel</span>
                  </label>
                  <div className="grid grid-cols-3 gap-1">
                    {[
                      { id: 'both', label: 'Both' },
                      { id: 'whatsapp', label: 'WhatsApp' },
                      { id: 'in_app', label: 'In-App' },
                    ].map((ch) => (
                      <button
                        key={ch.id}
                        type="button"
                        onClick={() => setReminderChannel(ch.id as any)}
                        className={`py-1 px-2 rounded-lg text-xs font-semibold transition-all cursor-pointer text-center ${
                          reminderChannel === ch.id
                            ? 'bg-emerald-700 text-white shadow-2xs'
                            : 'bg-white text-stone-700 border border-stone-200 hover:bg-stone-100'
                        }`}
                      >
                        {ch.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Live Preview Card */}
              <div className="bg-gradient-to-br from-emerald-50/70 to-stone-50 rounded-2xl p-4 border border-emerald-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>Live Reminder Preview (Different Every Time)</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleShufflePreview}
                    disabled={previewLoading}
                    className="flex items-center gap-1 text-xs font-bold text-emerald-700 hover:text-emerald-900 bg-white hover:bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-300 transition-all cursor-pointer shadow-2xs active:scale-95"
                    title="Shuffles to show another unique message"
                  >
                    <Shuffle className={`w-3.5 h-3.5 ${previewLoading ? 'animate-spin' : ''}`} />
                    <span>Try Another Message</span>
                  </button>
                </div>

                <div className="bg-white p-3.5 rounded-xl border border-stone-200 shadow-2xs space-y-1.5">
                  <span className="text-xs font-bold text-emerald-800 block">
                    {previewReminder?.greeting || `Sanu ${name || 'Musa'}! 🌾`}
                  </span>
                  <p className="text-xs text-stone-700 leading-relaxed font-normal">
                    {previewReminder?.message || 'Loading friendly reminder...'}
                  </p>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {previewReminder?.quickReplies?.map((qr, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] bg-stone-100 text-stone-700 font-semibold px-2 py-0.5 rounded-md border border-stone-200"
                      >
                        {qr}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-stone-500 pt-1">
                  <span>✨ 25+ culturally tailored templates with anti-repetition rotation</span>
                  {onTriggerTestReminder && (
                    <button
                      type="button"
                      onClick={onTriggerTestReminder}
                      className="font-bold text-emerald-700 hover:text-emerald-900 flex items-center gap-1 cursor-pointer"
                    >
                      <Bell className="w-3 h-3" />
                      <span>Test In-App Alert</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Live WhatsApp Bot Integration Card */}
        <div className="bg-gradient-to-br from-[#25D366]/5 via-white to-white dark:from-[#25D366]/10 dark:via-[#1C1C1E] dark:to-[#1C1C1E] rounded-3xl p-5 sm:p-6 border border-[#25D366]/20 dark:border-[#25D366]/30 shadow-2xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-black/[0.05] dark:border-white/[0.08]">
            <div className="flex items-center gap-2 text-sm font-semibold text-[#1D1D1F] dark:text-[#FFFFFF]">
              <MessageSquare className="w-4 h-4 text-[#25D366]" />
              <span>Live WhatsApp Bot Connection</span>
            </div>
            <span className="text-xs font-medium text-[#248A3D] dark:text-[#30D158] bg-[#34C759]/15 px-2.5 py-0.5 rounded-full border border-[#34C759]/30">
              Webhooks Ready
            </span>
          </div>

          <p className="text-xs text-neutral-600 dark:text-neutral-400">
            Link FarmPal to Meta WhatsApp Business Cloud API so real farmers can text or voice-record expenses directly from their WhatsApp app on Android/iOS.
          </p>

          <div className="pt-1 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs font-mono text-neutral-500 dark:text-neutral-400">
              <span className="w-2 h-2 rounded-full bg-[#34C759]" />
              <span>Endpoint: /api/whatsapp/webhook</span>
            </div>
            {onOpenWhatsAppLinkModal && (
              <button
                type="button"
                onClick={onOpenWhatsAppLinkModal}
                className="px-4 py-2 bg-[#25D366] hover:bg-[#20ba5a] active:scale-95 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Link WhatsApp Bot</span>
              </button>
            )}
          </div>
        </div>

        {/* Administrative Privileges & Master Console Access (DEVELOPER-ONLY) */}
        {isDeveloperMode && (
          <div className="bg-white rounded-2xl p-5 border border-purple-200/80 shadow-2xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-purple-100">
              <div className="flex items-center gap-2 text-sm font-bold text-stone-900">
                <Shield className="w-4 h-4 text-purple-700" />
                <span>Administrative Privileges & Access (Developer Mode)</span>
              </div>
              <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                profile.isAdmin || profile.role === 'admin'
                  ? 'bg-purple-100 text-purple-800 border-purple-300'
                  : 'bg-stone-100 text-stone-700 border-stone-200'
              }`}>
                {profile.isAdmin || profile.role === 'admin' ? 'Master Administrator' : 'Standard Account'}
              </span>
            </div>

            <p className="text-xs text-stone-600">
              Administrators have full visibility across registered Nigerian farmer directories, commodity market price override controls, broadcast advisory messaging, and system telemetry.
            </p>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={async () => {
                    const newRole = profile.role === 'admin' ? 'farmer' : 'admin';
                    await onUpdateProfile({ role: newRole, isAdmin: newRole === 'admin' });
                  }}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-purple-50 text-purple-800 hover:bg-purple-100 border border-purple-200 transition-colors cursor-pointer"
                >
                  {profile.isAdmin || profile.role === 'admin' ? 'Toggle to Standard Farmer View' : 'Grant Admin Privileges'}
                </button>
              </div>

              {onNavigateToAdmin && (
                <button
                  type="button"
                  onClick={onNavigateToAdmin}
                  className="flex items-center gap-1.5 bg-purple-700 hover:bg-purple-800 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                >
                  <Shield className="w-3.5 h-3.5" />
                  <span>Launch Admin Dashboard</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Commercial Farm & Enterprise Tier */}
        <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-2xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-stone-100">
            <div className="flex items-center gap-2 text-sm font-bold text-stone-900">
              <CreditCard className="w-4 h-4 text-emerald-700" />
              <span>Subscription & Commercial Tier</span>
            </div>
            <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-300">
              Commercial Enterprise
            </span>
          </div>
          <p className="text-xs text-stone-600">
            Full agribusiness tier active: Real-time verified commodity benchmarks across Nigerian grain and produce markets, automated seasonal cost forecasting, harvest inventory ledger, debtor tracking, and multi-channel messaging.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
            <div className="bg-stone-50 p-2 rounded-lg border border-stone-100 text-center">
              <p className="text-[10px] text-stone-500 font-medium">Market Feeds</p>
              <p className="text-xs font-bold text-emerald-700">Verified</p>
            </div>
            <div className="bg-stone-50 p-2 rounded-lg border border-stone-100 text-center">
              <p className="text-[10px] text-stone-500 font-medium">Crop Budgets</p>
              <p className="text-xs font-bold text-emerald-700">Active</p>
            </div>
            <div className="bg-stone-50 p-2 rounded-lg border border-stone-100 text-center">
              <p className="text-[10px] text-stone-500 font-medium">SMS / WhatsApp</p>
              <p className="text-xs font-bold text-emerald-700">Connected</p>
            </div>
            <div className="bg-stone-50 p-2 rounded-lg border border-stone-100 text-center">
              <p className="text-[10px] text-stone-500 font-medium">Store Depot</p>
              <p className="text-xs font-bold text-emerald-700">Reconciled</p>
            </div>
          </div>
        </div>

        {/* Offline Codebase Backup Section */}
        <div className="bg-stone-900 text-white rounded-2xl p-5 border border-stone-800 shadow-sm space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-stone-800">
            <div className="flex items-center gap-2 text-sm font-bold text-white">
              <Download className="w-4 h-4 text-emerald-400" />
              <span>Offline Codebase Backup</span>
            </div>
            <span className="text-[11px] font-mono text-stone-400">
              Full System Bundle
            </span>
          </div>

          <p className="text-xs text-stone-300">
            Export a full offline zip archive containing all frontend components, database schemas, models, and dependencies for local deployment.
          </p>

          <div className="flex items-center gap-3 pt-1">
            <a
              href="/api/github/export-zip"
              download="farmpal-source.zip"
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download ZIP (.zip)</span>
            </a>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={handleReset}
              className="flex items-center gap-1.5 text-xs text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Sample Farm Data</span>
            </button>

            {onOpenOnboarding && (
              <button
                type="button"
                onClick={onOpenOnboarding}
                className="flex items-center gap-1.5 text-xs text-emerald-700 dark:text-emerald-400 hover:underline transition-colors font-medium cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Restart Onboarding Tour</span>
              </button>
            )}

            {onOpenDeveloperModal && (
              <button
                type="button"
                onClick={onOpenDeveloperModal}
                className="flex items-center gap-1.5 text-[11px] text-stone-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors cursor-pointer"
                title="Developer Access Gate"
              >
                <Lock className="w-3 h-3" />
                <span>{isDeveloperMode ? 'Developer Active' : 'Developer Access'}</span>
              </button>
            )}
          </div>

          <button
            type="submit"
            disabled={isSaving}
            className="bg-emerald-700 hover:bg-emerald-600 text-white px-5 py-2 rounded-xl text-xs font-semibold shadow-sm transition-all cursor-pointer disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </form>
    </div>
  );
};
