import React from 'react';
import {
  Sprout,
  MessageSquare,
  BookOpen,
  Settings,
  Plus,
  TrendingUp,
  Users,
  Calendar,
  Store,
  PhoneCall,
  Package,
  Bell,
  Sun,
  Moon,
  Globe,
  Sparkles,
  Shield,
} from 'lucide-react';
import { Language, FarmerProfile, ThemeMode } from '../types';
import { translations } from '../lib/i18n';
import { FarmpalLogo } from './FarmpalLogo';

export type NavTab =
  | 'crops'
  | 'planning'
  | 'market'
  | 'inventory'
  | 'intelligence'
  | 'debtors'
  | 'records'
  | 'admin'
  | 'settings'
  | 'feedback';

interface NavbarProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  profile: FarmerProfile;
  onLanguageChange: (lang: Language) => void;
  currentTheme?: ThemeMode;
  onThemeChange?: (theme: ThemeMode) => void;
  onOpenQuickEntry: () => void;
  onOpenUssdModal?: () => void;
  debtorCount?: number;
  onOpenReminders?: () => void;
  hasActiveReminder?: boolean;
  onOpenFeedbackModal?: () => void;
  onOpenWhatsAppBot?: () => void;
  onOpenLanding?: () => void;
  onOpenOnboarding?: () => void;
  feedbackCount?: number;
  isDeveloperMode?: boolean;
  onOpenDeveloperModal?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  profile,
  onLanguageChange,
  currentTheme = 'system',
  onThemeChange,
  onOpenQuickEntry,
  onOpenUssdModal,
  debtorCount = 0,
  onOpenReminders,
  hasActiveReminder = true,
  onOpenFeedbackModal,
  onOpenWhatsAppBot,
  onOpenLanding,
  onOpenOnboarding,
  feedbackCount = 0,
  isDeveloperMode = false,
  onOpenDeveloperModal,
}) => {
  const t = translations[profile.preferredLanguage] || translations.en;

  return (
    <header className="sticky top-0 z-40 bg-[#F5F5F7]/85 dark:bg-[#1C1C1E]/85 backdrop-blur-2xl border-b border-black/[0.06] dark:border-white/[0.08] transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand & Wordmark */}
          <div
            id="nav-brand-logo"
            className="flex items-center gap-2.5 cursor-pointer shrink-0 py-1 select-none group"
            onClick={() => setActiveTab('crops')}
            title="FarmPal Home"
          >
            <FarmpalLogo variant="full" theme="adaptive" size="md" />
            <span className="text-[11px] font-medium tracking-tight text-apple-secondary group-hover:text-apple-primary transition-colors hidden sm:inline-block">
              macOS Edition
            </span>
          </div>

          {/* Right actions (Apple HIG style buttons) */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            {/* USSD Simulator Button */}
            {onOpenUssdModal && (
              <button
                onClick={onOpenUssdModal}
                title="Dial *384*24# Offline USSD"
                className="flex items-center gap-1.5 bg-black/[0.04] hover:bg-black/[0.08] active:scale-95 text-[#1D1D1F] border border-black/[0.06] px-3 py-1.5 rounded-full text-xs font-mono font-medium shadow-2xs transition-all cursor-pointer"
              >
                <PhoneCall className="w-3.5 h-3.5 text-[#34C759]" />
                <span className="hidden md:inline">*384*24#</span>
                <span className="md:hidden">USSD</span>
              </button>
            )}

            {/* Language dropdown */}
            <div className="hidden sm:flex items-center text-xs bg-black/[0.04] dark:bg-white/[0.08] hover:bg-black/[0.07] dark:hover:bg-white/[0.12] rounded-full px-2.5 py-1 border border-black/[0.06] dark:border-white/[0.08] transition-all">
              <span className="text-neutral-500 dark:text-neutral-400 mr-1.5 font-medium">Lang:</span>
              <select
                id="language-selector"
                value={profile.preferredLanguage}
                onChange={(e) => onLanguageChange(e.target.value as Language)}
                aria-label="Preferred Language"
                className="bg-transparent text-[#1D1D1F] dark:text-[#F5F5F7] font-medium focus:outline-none cursor-pointer text-xs"
              >
                <option value="en" className="dark:bg-[#1C1C1E] dark:text-white">English</option>
                <option value="ig" className="dark:bg-[#1C1C1E] dark:text-white">Igbo (Asụsụ)</option>
                <option value="yo" className="dark:bg-[#1C1C1E] dark:text-white">Yoruba (Èdè)</option>
                <option value="ha" className="dark:bg-[#1C1C1E] dark:text-white">Hausa (Harshe)</option>
              </select>
            </div>

            {/* Apple Theme Mode Switcher */}
            {onThemeChange && (
              <button
                id="nav-btn-theme-toggle"
                onClick={() => onThemeChange(currentTheme === 'dark' ? 'light' : 'dark')}
                title={`Theme: ${currentTheme.toUpperCase()} (Click to toggle)`}
                className="flex items-center justify-center p-2 rounded-full bg-black/[0.04] dark:bg-white/[0.08] hover:bg-black/[0.08] dark:hover:bg-white/[0.14] text-[#1D1D1F] dark:text-[#F5F5F7] border border-black/[0.06] dark:border-white/[0.08] transition-all cursor-pointer active:scale-95 shadow-2xs"
                aria-label="Toggle light or dark theme"
              >
                {currentTheme === 'dark' ? (
                  <Sun className="w-3.5 h-3.5 text-amber-400 stroke-[2.2]" />
                ) : (
                  <Moon className="w-3.5 h-3.5 text-neutral-600 stroke-[2.2]" />
                )}
              </button>
            )}

            {/* Landing Page Trigger Button */}
            {onOpenLanding && (
              <button
                id="nav-btn-landing-page"
                onClick={onOpenLanding}
                title="View FarmPal Landing Page & Features"
                className="flex items-center gap-1.5 bg-black/[0.04] dark:bg-white/[0.08] hover:bg-black/[0.08] dark:hover:bg-white/[0.14] active:scale-95 text-[#1D1D1F] dark:text-[#F5F5F7] border border-black/[0.06] dark:border-white/[0.08] px-3 py-1.5 rounded-full text-xs font-medium shadow-2xs transition-all cursor-pointer"
              >
                <Globe className="w-3.5 h-3.5 text-[#0071E3]" />
                <span className="hidden xl:inline">Landing Page</span>
                <span className="xl:hidden">Website</span>
              </button>
            )}

            {/* Onboarding Tour Trigger Button */}
            {onOpenOnboarding && (
              <button
                id="nav-btn-onboarding-tour"
                onClick={onOpenOnboarding}
                title="Start Farmer Onboarding Wizard"
                className="flex items-center gap-1.5 bg-emerald-500/10 hover:bg-emerald-500/15 active:scale-95 text-emerald-800 dark:text-emerald-300 border border-emerald-500/20 px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer shadow-2xs"
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span className="hidden lg:inline">Onboarding</span>
              </button>
            )}

            {/* Farmer Feedback Modal Trigger Button */}
            {onOpenFeedbackModal && (
              <button
                id="nav-btn-feedback-trigger"
                onClick={onOpenFeedbackModal}
                title="Give Farmer Feedback"
                className="flex items-center gap-1.5 bg-amber-500/10 hover:bg-amber-500/15 active:scale-95 text-amber-900 dark:text-amber-300 border border-amber-500/20 px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer"
              >
                <MessageSquare className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                <span className="hidden md:inline">Feedback</span>
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
              </button>
            )}

            {/* Admin Console Trigger Button (Developer-Only) */}
            {isDeveloperMode && (
              <button
                id="nav-btn-admin-console"
                onClick={() => setActiveTab('admin')}
                title="Master Admin Dashboard (Developer Access Only)"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer shadow-2xs active:scale-95 ${
                  activeTab === 'admin'
                    ? 'bg-purple-700 text-white shadow-xs'
                    : 'bg-purple-500/10 hover:bg-purple-500/20 text-purple-700 dark:text-purple-300 border border-purple-500/20'
                }`}
              >
                <Shield className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                <span className="hidden md:inline">Dev Admin</span>
                <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse" />
              </button>
            )}

            {/* Direct WhatsApp Bot Trigger */}
            {onOpenWhatsAppBot && (
              <button
                id="nav-btn-whatsapp-bot"
                onClick={onOpenWhatsAppBot}
                title="Open FarmPal on WhatsApp"
                className="flex items-center gap-1.5 bg-[#25D366]/10 hover:bg-[#25D366]/20 active:scale-95 text-[#128C7E] dark:text-[#25D366] border border-[#25D366]/30 px-3 py-1.5 rounded-full text-xs font-semibold shadow-2xs transition-all cursor-pointer"
              >
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                  <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.312.045-.693.076-1.99-.46-1.579-.652-2.584-2.28-2.663-2.384-.078-.104-.645-.859-.645-1.635 0-.776.406-1.157.55-1.314.144-.157.314-.197.418-.197.105 0 .21.002.301.006.096.004.225-.036.353.271.131.314.444 1.085.483 1.164.039.078.065.17.013.274-.052.105-.078.17-.157.262-.078.092-.165.205-.236.276-.079.079-.161.164-.069.322.092.157.408.673.875 1.089.601.536 1.109.702 1.267.781.157.078.249.066.341-.039.092-.105.393-.458.498-.615.105-.157.21-.131.353-.078.144.052.915.432 1.073.511.157.078.262.118.301.183.039.066.039.38-.105.785zM12 2C6.477 2 2 6.477 2 12c0 1.891.524 3.662 1.434 5.178L2 22l4.955-1.399A9.956 9.956 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm0 18.167c-1.697 0-3.273-.505-4.6-1.371l-.33-.217-2.923.824.814-2.977-.234-.344A8.146 8.146 0 013.833 12c0-4.503 3.664-8.167 8.167-8.167 4.503 0 8.167 3.664 8.167 8.167 0 4.503-3.664 8.167-8.167 8.167z" />
                </svg>
                <span className="hidden sm:inline">WhatsApp</span>
              </button>
            )}

            {/* Daily Reminder Bell Button */}
            {onOpenReminders && (
              <button
                id="nav-btn-reminders"
                onClick={onOpenReminders}
                title="Daily Record Reminders & Check-ins"
                className="relative p-2 rounded-full bg-black/[0.04] hover:bg-black/[0.08] active:scale-95 text-[#1D1D1F] border border-black/[0.06] transition-all cursor-pointer"
              >
                <Bell className="w-4 h-4" />
                {hasActiveReminder && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#FF3B30] ring-2 ring-white" />
                )}
              </button>
            )}

            {/* Quick Add Button (Apple System Green) */}
            <button
              id="btn-quick-record-entry"
              onClick={onOpenQuickEntry}
              className="flex items-center gap-1.5 bg-[#34C759] hover:bg-[#30B753] active:scale-95 text-white px-4 py-2 rounded-full text-xs font-semibold shadow-[0_2px_8px_rgba(52,199,89,0.28)] transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span className="hidden sm:inline">Record Entry</span>
              <span className="sm:hidden">Add</span>
            </button>
          </div>
        </div>
      </div>

      {/* Nav Tabs Bar (Apple Segmented Control Pill Container) */}
      <div className="border-t border-black/[0.04] dark:border-white/[0.06] px-4 py-2 bg-[#F5F5F7]/95 dark:bg-[#1C1C1E]/95">
        <div className="max-w-7xl mx-auto flex items-center justify-start">
          <div className="bg-[#E5E5EA]/70 dark:bg-[#2C2C2E]/80 backdrop-blur-md p-1 rounded-2xl flex items-center gap-0.5 overflow-x-auto max-w-full border border-black/[0.04] dark:border-white/[0.06] scrollbar-none">
            <button
              id="nav-tab-crops"
              onClick={() => setActiveTab('crops')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs whitespace-nowrap transition-all cursor-pointer ${
                activeTab === 'crops'
                  ? 'bg-white dark:bg-[#3A3A3C] text-[#1D1D1F] dark:text-[#FFFFFF] shadow-[0_1px_3px_rgba(0,0,0,0.1),0_1px_2px_rgba(0,0,0,0.06)] font-semibold'
                  : 'text-neutral-600 dark:text-neutral-300 hover:text-[#1D1D1F] dark:hover:text-white hover:bg-white/50 dark:hover:bg-white/10 font-medium'
              }`}
            >
              <Sprout className="w-3.5 h-3.5 text-[#34C759]" />
              <span>{t.myCrops}</span>
            </button>

            <button
              id="nav-tab-planning"
              onClick={() => setActiveTab('planning')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs whitespace-nowrap transition-all cursor-pointer ${
                activeTab === 'planning'
                  ? 'bg-white dark:bg-[#3A3A3C] text-[#1D1D1F] dark:text-[#FFFFFF] shadow-[0_1px_3px_rgba(0,0,0,0.1),0_1px_2px_rgba(0,0,0,0.06)] font-semibold'
                  : 'text-neutral-600 dark:text-neutral-300 hover:text-[#1D1D1F] dark:hover:text-white hover:bg-white/50 dark:hover:bg-white/10 font-medium'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Budgets & Tasks</span>
            </button>

            <button
              id="nav-tab-market"
              onClick={() => setActiveTab('market')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs whitespace-nowrap transition-all cursor-pointer ${
                activeTab === 'market'
                  ? 'bg-white dark:bg-[#3A3A3C] text-[#1D1D1F] dark:text-[#FFFFFF] shadow-[0_1px_3px_rgba(0,0,0,0.1),0_1px_2px_rgba(0,0,0,0.06)] font-semibold'
                  : 'text-neutral-600 dark:text-neutral-300 hover:text-[#1D1D1F] dark:hover:text-white hover:bg-white/50 dark:hover:bg-white/10 font-medium'
              }`}
            >
              <Store className="w-3.5 h-3.5" />
              <span>Market Prices</span>
            </button>

            {/* Store Inventory */}
            <button
              id="nav-tab-inventory"
              onClick={() => setActiveTab('inventory')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs whitespace-nowrap transition-all cursor-pointer ${
                activeTab === 'inventory'
                  ? 'bg-white dark:bg-[#3A3A3C] text-[#1D1D1F] dark:text-[#FFFFFF] shadow-[0_1px_3px_rgba(0,0,0,0.1),0_1px_2px_rgba(0,0,0,0.06)] font-semibold'
                  : 'text-neutral-600 dark:text-neutral-300 hover:text-[#1D1D1F] dark:hover:text-white hover:bg-white/50 dark:hover:bg-white/10 font-medium'
              }`}
            >
              <Package className="w-3.5 h-3.5" />
              <span>Inventory</span>
            </button>

            {/* Financial Intelligence */}
            <button
              id="nav-tab-intelligence"
              onClick={() => setActiveTab('intelligence')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs whitespace-nowrap transition-all cursor-pointer ${
                activeTab === 'intelligence'
                  ? 'bg-white dark:bg-[#3A3A3C] text-[#1D1D1F] dark:text-[#FFFFFF] shadow-[0_1px_3px_rgba(0,0,0,0.1),0_1px_2px_rgba(0,0,0,0.06)] font-semibold'
                  : 'text-neutral-600 dark:text-neutral-300 hover:text-[#1D1D1F] dark:hover:text-white hover:bg-white/50 dark:hover:bg-white/10 font-medium'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5 text-indigo-400" />
              <span>Intelligence</span>
            </button>

            {/* Debtors */}
            <button
              id="nav-tab-debtors"
              onClick={() => setActiveTab('debtors')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs whitespace-nowrap transition-all cursor-pointer relative ${
                activeTab === 'debtors'
                  ? 'bg-white dark:bg-[#3A3A3C] text-[#1D1D1F] dark:text-[#FFFFFF] shadow-[0_1px_3px_rgba(0,0,0,0.1),0_1px_2px_rgba(0,0,0,0.06)] font-semibold'
                  : 'text-neutral-600 dark:text-neutral-300 hover:text-[#1D1D1F] dark:hover:text-white hover:bg-white/50 dark:hover:bg-white/10 font-medium'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Debtors</span>
              {debtorCount > 0 && (
                <span className="px-1.5 py-0.2 text-[10px] rounded-full bg-amber-500 text-white font-bold">
                  {debtorCount}
                </span>
              )}
            </button>

            {/* Records */}
            <button
              id="nav-tab-records"
              onClick={() => setActiveTab('records')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs whitespace-nowrap transition-all cursor-pointer ${
                activeTab === 'records'
                  ? 'bg-white dark:bg-[#3A3A3C] text-[#1D1D1F] dark:text-[#FFFFFF] shadow-[0_1px_3px_rgba(0,0,0,0.1),0_1px_2px_rgba(0,0,0,0.06)] font-semibold'
                  : 'text-neutral-600 dark:text-neutral-300 hover:text-[#1D1D1F] dark:hover:text-white hover:bg-white/50 dark:hover:bg-white/10 font-medium'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Records</span>
            </button>

            {/* Tester Feedback */}
            <button
              id="nav-tab-feedback"
              onClick={() => setActiveTab('feedback')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs whitespace-nowrap transition-all cursor-pointer relative ${
                activeTab === 'feedback'
                  ? 'bg-white dark:bg-[#3A3A3C] text-[#1D1D1F] dark:text-[#FFFFFF] shadow-[0_1px_3px_rgba(0,0,0,0.1),0_1px_2px_rgba(0,0,0,0.06)] font-semibold'
                  : 'text-neutral-600 dark:text-neutral-300 hover:text-[#1D1D1F] dark:hover:text-white hover:bg-white/50 dark:hover:bg-white/10 font-medium'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5 text-amber-500" />
              <span>Feedback</span>
              <span className="text-[10px] text-amber-800 dark:text-amber-300 bg-amber-500/20 px-1.5 py-0.2 rounded-full font-medium">
                Pilot
              </span>
            </button>

            {/* Admin Console Tab (DEVELOPER ONLY) */}
            {isDeveloperMode && (
              <button
                id="nav-tab-admin"
                onClick={() => setActiveTab('admin')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs whitespace-nowrap transition-all cursor-pointer relative ${
                  activeTab === 'admin'
                    ? 'bg-purple-700 text-white shadow-[0_1px_3px_rgba(0,0,0,0.1),0_1px_2px_rgba(0,0,0,0.06)] font-semibold'
                    : 'text-neutral-600 dark:text-neutral-300 hover:text-purple-700 dark:hover:text-purple-300 hover:bg-white/50 dark:hover:bg-white/10 font-medium'
                }`}
              >
                <Shield className={`w-3.5 h-3.5 ${activeTab === 'admin' ? 'text-white' : 'text-purple-600 dark:text-purple-400'}`} />
                <span>Admin</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  activeTab === 'admin'
                    ? 'bg-white/20 text-white'
                    : 'bg-purple-500/15 text-purple-700 dark:text-purple-300'
                }`}>
                  Dev
                </span>
              </button>
            )}

            {/* Settings */}
            <button
              id="nav-tab-settings"
              onClick={() => setActiveTab('settings')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs whitespace-nowrap transition-all cursor-pointer ${
                activeTab === 'settings'
                  ? 'bg-white dark:bg-[#3A3A3C] text-[#1D1D1F] dark:text-[#FFFFFF] shadow-[0_1px_3px_rgba(0,0,0,0.1),0_1px_2px_rgba(0,0,0,0.06)] font-semibold'
                  : 'text-neutral-600 dark:text-neutral-300 hover:text-[#1D1D1F] dark:hover:text-white hover:bg-white/50 dark:hover:bg-white/10 font-medium'
              }`}
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Settings</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
