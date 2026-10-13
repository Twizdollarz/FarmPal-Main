import React, { useState } from 'react';
import {
  Sprout,
  MessageSquare,
  TrendingUp,
  PhoneCall,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Users,
  Landmark,
  CloudSun,
  Mic,
  Play,
  Pause,
  ChevronRight,
  Sun,
  Moon,
  ExternalLink,
  Award,
  Zap,
  Globe,
  BookOpen,
  Package,
  Store,
} from 'lucide-react';
import { FarmpalLogo, FarmpalEmblem } from './FarmpalLogo';
import { ThemeMode, Language } from '../types';

interface LandingPageProps {
  onLaunchApp: () => void;
  onOpenOnboarding: () => void;
  currentTheme?: ThemeMode;
  onThemeChange?: (theme: ThemeMode) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onLaunchApp,
  onOpenOnboarding,
  currentTheme = 'system',
  onThemeChange,
}) => {
  const [activeHeroTab, setActiveHeroTab] = useState<'voice' | 'economics' | 'debtors'>('voice');
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  return (
    <div className="min-h-screen bg-[#F5F5F7] dark:bg-[#000000] text-[#1D1D1F] dark:text-[#F5F5F7] font-sans antialiased selection:bg-[#34C759]/20 transition-colors duration-200">
      {/* ========================================================================= */}
      {/* 1. TOP BAR CONTRACT (Strict 1-Row, 3-Zone: Brand | Nav Links | Actions) */}
      {/* ========================================================================= */}
      <header className="sticky top-0 z-40 bg-[#F5F5F7]/80 dark:bg-[#000000]/80 backdrop-blur-xl border-b border-black/[0.06] dark:border-white/[0.08] transition-colors">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Zone 1: Single element brand mark */}
          <div className="flex items-center gap-3">
            <a
              href="#top"
              className="flex items-center gap-2 group cursor-pointer focus:outline-none"
              aria-label="FarmPal Home"
            >
              <FarmpalLogo theme={currentTheme === 'dark' ? 'dark' : 'light'} className="h-7 w-auto" />
            </a>
          </div>

          {/* Zone 2: 4-6 clean text navigation links */}
          <nav className="hidden md:flex items-center gap-7 text-xs font-medium text-neutral-600 dark:text-neutral-300">
            <a href="#capabilities" className="hover:text-black dark:hover:text-white transition-colors">
              Capabilities
            </a>
            <a href="#how-it-works" className="hover:text-black dark:hover:text-white transition-colors">
              How It Works
            </a>
            <a href="#whatsapp" className="hover:text-black dark:hover:text-white transition-colors">
              WhatsApp Voice Bot
            </a>
            <a href="#economics" className="hover:text-black dark:hover:text-white transition-colors">
              Unit Economics
            </a>
            <a href="#pricing" className="hover:text-black dark:hover:text-white transition-colors">
              Pricing
            </a>
          </nav>

          {/* Zone 3: Primary Actions & Theme Switcher */}
          <div className="flex items-center gap-2.5">
            {onThemeChange && (
              <button
                type="button"
                onClick={() => onThemeChange(currentTheme === 'dark' ? 'light' : 'dark')}
                title={`Toggle ${currentTheme === 'dark' ? 'Light' : 'Dark'} Mode`}
                className="w-8 h-8 rounded-full bg-black/[0.04] dark:bg-white/[0.08] hover:bg-black/[0.08] dark:hover:bg-white/[0.14] text-[#1D1D1F] dark:text-[#F5F5F7] border border-black/[0.06] dark:border-white/[0.08] flex items-center justify-center transition-all cursor-pointer active:scale-95 shadow-2xs"
                aria-label="Toggle theme"
              >
                {currentTheme === 'dark' ? (
                  <Sun className="w-3.5 h-3.5 text-amber-400 stroke-[2.2]" />
                ) : (
                  <Moon className="w-3.5 h-3.5 text-neutral-600 stroke-[2.2]" />
                )}
              </button>
            )}

            <button
              type="button"
              onClick={onLaunchApp}
              className="hidden sm:inline-flex px-3.5 py-1.5 text-xs font-medium text-neutral-700 dark:text-neutral-200 hover:text-black dark:hover:text-white transition-colors cursor-pointer"
            >
              Sign In
            </button>

            <button
              type="button"
              onClick={onOpenOnboarding}
              className="px-4 py-2 bg-[#0071E3] hover:bg-[#0077ED] active:scale-95 text-white rounded-full text-xs font-semibold tracking-tight transition-all cursor-pointer shadow-xs whitespace-nowrap"
            >
              Start Free Notebook
            </button>
          </div>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 2. HERO SECTION (High-Impact Focal Banner, Balanced Copy, Dual CTAs) */}
      {/* ========================================================================= */}
      <section id="top" className="pt-8 sm:pt-14 pb-12 sm:pb-20 px-4 sm:px-6 max-w-6xl mx-auto">
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 text-xs font-medium text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-800/50 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-[#34C759] animate-pulse" />
            <span>Built for Nigerian Farmers &amp; Commercial Agribusinesses</span>
          </div>

          <h1
            className="text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-[#1D1D1F] dark:text-[#FFFFFF] leading-[1.12]"
            style={{ textWrap: 'balance' }}
          >
            The intelligent farm notebook that quietly thinks for the farmer.
          </h1>

          <p
            className="text-sm sm:text-base text-neutral-600 dark:text-neutral-300 leading-relaxed max-w-2xl mx-auto"
            style={{ textWrap: 'balance' }}
          >
            Log expenses, fertilizer, labour, and harvest sales in natural Nigerian voice notes or WhatsApp messages. Turn daily farm work into clear profit margins, unit costs per crate, and automated debtor collection.
          </p>

          {/* Primary Action Buttons */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              type="button"
              onClick={onOpenOnboarding}
              className="w-full sm:w-auto px-6 py-3 bg-[#0071E3] hover:bg-[#0077ED] active:scale-95 text-white rounded-2xl text-sm font-semibold tracking-tight transition-all cursor-pointer shadow-md flex items-center justify-center gap-2"
            >
              <span>Start Free Farm Notebook</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={onLaunchApp}
              className="w-full sm:w-auto px-6 py-3 bg-white dark:bg-[#1C1C1E] hover:bg-neutral-50 dark:hover:bg-[#2C2C2E] active:scale-95 text-[#1D1D1F] dark:text-white rounded-2xl text-sm font-semibold tracking-tight border border-black/[0.08] dark:border-white/[0.12] transition-all cursor-pointer shadow-2xs flex items-center justify-center gap-2"
            >
              <Sprout className="w-4 h-4 text-[#34C759]" />
              <span>Explore Live Dashboard</span>
            </button>
          </div>

          {/* Social Proof Strip */}
          <div className="pt-3 text-xs text-neutral-500 dark:text-neutral-400 flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
            <span>Over 1,200+ smallholders recorded in 2026</span>
            <span aria-hidden="true">·</span>
            <span>Works on WhatsApp &amp; Offline USSD (*384*24#)</span>
            <span aria-hidden="true">·</span>
            <span>Zero manual Excel entry required</span>
          </div>
        </div>

        {/* Hero Visual Anchor & Interactive Product Mockup */}
        <div className="mt-10 sm:mt-12 relative rounded-3xl overflow-hidden border border-black/[0.08] dark:border-white/[0.12] shadow-[0_24px_64px_rgba(0,0,0,0.14)] bg-neutral-900 text-white">
          {/* Background Photography with Scrim */}
          <div className="relative h-64 sm:h-96 w-full overflow-hidden">
            <img
              src="/src/assets/images/hero_farmer_harvest_1790661563410.jpg"
              alt="Nigerian farmer in irrigated tomato fields using FarmPal"
              className="w-full h-full object-cover object-center transform hover:scale-105 transition-transform duration-1000"
              referrerPolicy="no-referrer"
              loading="eager"
              decoding="async"
              fetchPriority="high"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/60 to-transparent" />

            {/* Floating Top Metrics */}
            <div className="absolute top-4 left-4 right-4 flex items-center justify-between text-xs">
              <div className="bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#34C759]" />
                <span className="font-semibold text-white">Live Farm Engine Active</span>
              </div>
              <div className="hidden sm:flex bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 text-neutral-300 font-mono text-[11px]">
                Kano Hub • 3.5 Cultivated Acres
              </div>
            </div>
          </div>

          {/* Interactive Feature Demo Bar */}
          <div className="p-5 sm:p-7 bg-neutral-950 border-t border-white/10 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[11px] font-mono text-emerald-400 uppercase tracking-wider block">
                  Interactive Live Preview
                </span>
                <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  Experience How FarmPal Automatically Parses Daily Farm Life
                </h2>
              </div>

              {/* Segmented Control */}
              <div className="p-1 bg-white/10 rounded-2xl flex text-xs font-medium border border-white/10">
                <button
                  type="button"
                  onClick={() => setActiveHeroTab('voice')}
                  className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                    activeHeroTab === 'voice' ? 'bg-white text-black shadow-xs font-semibold' : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  WhatsApp Voice
                </button>
                <button
                  type="button"
                  onClick={() => setActiveHeroTab('economics')}
                  className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                    activeHeroTab === 'economics' ? 'bg-white text-black shadow-xs font-semibold' : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  Unit Break-Even
                </button>
                <button
                  type="button"
                  onClick={() => setActiveHeroTab('debtors')}
                  className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                    activeHeroTab === 'debtors' ? 'bg-white text-black shadow-xs font-semibold' : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  Debtor Recovery
                </button>
              </div>
            </div>

            {/* Tab 1: Voice & WhatsApp simulation */}
            {activeHeroTab === 'voice' && (
              <div className="p-4 sm:p-5 bg-neutral-900 rounded-2xl border border-white/10 grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                <div className="space-y-2.5">
                  <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
                    <MessageSquare className="w-4 h-4 text-[#25D366]" />
                    <span>Farmer WhatsApp Voice Note (0:06s):</span>
                  </div>
                  <div className="p-3 bg-neutral-800/80 rounded-xl border border-white/5 flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setIsPlayingAudio(!isPlayingAudio)}
                      className="w-9 h-9 rounded-full bg-[#25D366] text-white flex items-center justify-center transition-transform active:scale-95 cursor-pointer shrink-0"
                    >
                      {isPlayingAudio ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                    </button>
                    <div className="flex-1">
                      <div className="h-1.5 w-full bg-white/20 rounded-full overflow-hidden">
                        <div className={`h-full bg-[#25D366] rounded-full ${isPlayingAudio ? 'w-full transition-all duration-3000' : 'w-1/3'}`} />
                      </div>
                      <p className="text-[11px] text-neutral-300 italic mt-1">
                        "I just paid 15k for 3 labourers to weed cucumber, and 5k for generator fuel."
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-3.5 bg-neutral-950 rounded-xl border border-emerald-500/20 text-xs space-y-1.5 font-mono">
                  <span className="text-[10px] uppercase text-emerald-400 font-bold block">
                    ✓ FarmPal Instant AI Reconciliation
                  </span>
                  <div className="text-neutral-200">
                    • <strong className="text-white">Cucumber Labour:</strong> ₦15,000 (Allocated 100%)<br />
                    • <strong className="text-white">Farm Fuel:</strong> ₦5,000 (Split across Tomato &amp; Cucumber)<br />
                    • <span className="text-emerald-400">Break-even unit cost updated automatically in ledger.</span>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 2: Unit Economics simulation */}
            {activeHeroTab === 'economics' && (
              <div className="p-4 sm:p-5 bg-neutral-900 rounded-2xl border border-white/10 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 bg-neutral-800/60 rounded-xl border border-white/5 space-y-1">
                  <span className="text-[11px] text-neutral-400">Tomato Production Cost</span>
                  <div className="text-lg font-bold text-white font-mono">₦7,200 <span className="text-xs font-normal text-neutral-400">/ crate</span></div>
                  <span className="text-[11px] text-emerald-400">Direct costs, seed &amp; spray</span>
                </div>
                <div className="p-3 bg-neutral-800/60 rounded-xl border border-white/5 space-y-1">
                  <span className="text-[11px] text-neutral-400">Lagos Mile 12 Wholesale</span>
                  <div className="text-lg font-bold text-white font-mono">₦9,800 <span className="text-xs font-normal text-neutral-400">/ crate</span></div>
                  <span className="text-[11px] text-blue-400">+₦2,600 margin per crate</span>
                </div>
                <div className="p-3 bg-neutral-800/60 rounded-xl border border-white/5 space-y-1">
                  <span className="text-[11px] text-neutral-400">Certified Net Profit</span>
                  <div className="text-lg font-bold text-emerald-400 font-mono">+36.1% Margin</div>
                  <span className="text-[11px] text-neutral-400">Ready for bank credit appraisal</span>
                </div>
              </div>
            )}

            {/* Tab 3: Debtors Book simulation */}
            {activeHeroTab === 'debtors' && (
              <div className="p-4 sm:p-5 bg-neutral-900 rounded-2xl border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white">Mama Chidi (Oyo Road Depot)</span>
                    <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/30">
                      Credit Sale
                    </span>
                  </div>
                  <p className="text-neutral-400">
                    Sold 20 crates of tomato on credit for ₦160,000. Automated friendly WhatsApp reminder scheduled.
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <span className="text-[10px] text-neutral-400 block">Balance Due</span>
                    <span className="text-base font-bold text-white font-mono">₦160,000</span>
                  </div>
                  <button
                    type="button"
                    onClick={onLaunchApp}
                    className="px-3.5 py-1.5 bg-[#34C759] hover:bg-[#30B350] text-white rounded-xl text-xs font-semibold cursor-pointer"
                  >
                    Record Payment
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. CAPABILITIES / MECHANISMS (Clean Editorial 01 - 04 Human Numbering) */}
      {/* ========================================================================= */}
      <section id="capabilities" className="py-14 sm:py-20 px-4 sm:px-6 max-w-6xl mx-auto border-t border-black/[0.06] dark:border-white/[0.08]">
        <div className="max-w-2xl mb-12">
          <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider block mb-1">
            Core Operating System
          </span>
          <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-[#1D1D1F] dark:text-white" style={{ textWrap: 'balance' }}>
            Built specifically around how real farming actually happens.
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
          {/* 01. WhatsApp & Voice Notebook */}
          <div className="bg-white dark:bg-[#1C1C1E] rounded-3xl p-6 sm:p-8 border border-black/[0.06] dark:border-white/[0.08] shadow-2xs flex flex-col justify-between space-y-5">
            <div className="space-y-3">
              <span className="text-xs font-mono font-bold text-neutral-400 dark:text-neutral-500">
                01. NATURAL VOICE &amp; WHATSAPP
              </span>
              <h3 className="text-xl font-bold text-[#1D1D1F] dark:text-white tracking-tight">
                Speak or text in Pidgin, Hausa, Yoruba, or English.
              </h3>
              <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed">
                No forms or tables to fill after 10 hours in the sun. Text <em>"Spent 12k on fertilizer for tomato"</em> or send a 4-second audio note. FarmPal extracts the exact Naira amount, tags the category, and allocates it to the right crop plot.
              </p>
            </div>

            <div className="rounded-2xl overflow-hidden border border-black/[0.06] dark:border-white/[0.08] h-48 relative">
              <img
                src="/src/assets/images/bento_whatsapp_voice_1790661575602.jpg"
                alt="Farmer recording crop expense via WhatsApp voice note"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
                loading="lazy"
                decoding="async"
              />
              <div className="absolute bottom-2 left-2 right-2 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-xl text-[11px] text-white flex items-center justify-between border border-white/10">
                <span>Webhook Active on Port 3000</span>
                <span className="text-emerald-400 font-semibold">Meta WhatsApp Cloud API</span>
              </div>
            </div>
          </div>

          {/* 02. Unit Break-Even & Debtor Book */}
          <div className="bg-white dark:bg-[#1C1C1E] rounded-3xl p-6 sm:p-8 border border-black/[0.06] dark:border-white/[0.08] shadow-2xs flex flex-col justify-between space-y-5">
            <div className="space-y-3">
              <span className="text-xs font-mono font-bold text-neutral-400 dark:text-neutral-500">
                02. MARGINS &amp; DEBTORS BOOK
              </span>
              <h3 className="text-xl font-bold text-[#1D1D1F] dark:text-white tracking-tight">
                Know your minimum selling price before entering the market.
              </h3>
              <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed">
                Middlemen often negotiate blindly. FarmPal tells you your exact cost per crate or bag so you never sell at a loss. Plus, track all produce sold on credit and record partial repayments with zero forgotten receivables.
              </p>
            </div>

            <div className="p-4 bg-[#F5F5F7] dark:bg-[#2C2C2E] rounded-2xl border border-black/[0.05] dark:border-white/[0.06] space-y-2 text-xs">
              <div className="flex items-center justify-between font-semibold">
                <span className="text-[#1D1D1F] dark:text-white">Active Debtors Book</span>
                <span className="text-amber-600 dark:text-amber-400 font-mono">₦240,000 Total Receivables</span>
              </div>
              <div className="space-y-1.5 text-neutral-600 dark:text-neutral-300">
                <div className="flex justify-between p-2 bg-white dark:bg-[#1C1C1E] rounded-xl border border-black/[0.04] dark:border-white/[0.06]">
                  <span>Alhaji Danladi (Dawanau)</span>
                  <span className="font-mono font-bold text-neutral-900 dark:text-white">₦160,000 Due</span>
                </div>
                <div className="flex justify-between p-2 bg-white dark:bg-[#1C1C1E] rounded-xl border border-black/[0.04] dark:border-white/[0.06]">
                  <span>Mama Chidi (Ibadan)</span>
                  <span className="font-mono font-bold text-neutral-900 dark:text-white">₦80,000 Due</span>
                </div>
              </div>
            </div>
          </div>

          {/* 03. Farm Storehouse Inventory */}
          <div className="bg-white dark:bg-[#1C1C1E] rounded-3xl p-6 sm:p-8 border border-black/[0.06] dark:border-white/[0.08] shadow-2xs flex flex-col justify-between space-y-5">
            <div className="space-y-3">
              <span className="text-xs font-mono font-bold text-neutral-400 dark:text-neutral-500">
                03. STOREHOUSE &amp; INPUT INVENTORY
              </span>
              <h3 className="text-xl font-bold text-[#1D1D1F] dark:text-white tracking-tight">
                Control fertilizer, seeds, and chemical stocks without stockouts.
              </h3>
              <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed">
                Log inventory receipts and track usage as expenses. Get automated low-stock warnings before planting cycles so you never halt work midway.
              </p>
            </div>

            <div className="p-4 bg-amber-50 dark:bg-amber-950/30 rounded-2xl border border-amber-200 dark:border-amber-800/40 space-y-2 text-xs text-amber-950 dark:text-amber-300">
              <div className="flex items-center justify-between">
                <span className="font-bold flex items-center gap-1.5">
                  <Package className="w-4 h-4 text-amber-600" />
                  NPK 15:15:15 Fertilizer
                </span>
                <span className="font-semibold text-amber-700 dark:text-amber-400">14 Bags Remaining</span>
              </div>
              <p className="text-[11px] text-amber-800/80 dark:text-amber-300/80 leading-relaxed">
                Storehouse value: ₦490,000 • Safety reorder threshold: 5 bags
              </p>
            </div>
          </div>

          {/* 04. Wholesale Market Benchmarks */}
          <div className="bg-white dark:bg-[#1C1C1E] rounded-3xl p-6 sm:p-8 border border-black/[0.06] dark:border-white/[0.08] shadow-2xs flex flex-col justify-between space-y-5">
            <div className="space-y-3">
              <span className="text-xs font-mono font-bold text-neutral-400 dark:text-neutral-500">
                04. MULTI-MARKET PRICE INTELLIGENCE
              </span>
              <h3 className="text-xl font-bold text-[#1D1D1F] dark:text-white tracking-tight">
                Benchmark wholesale prices across major Nigerian hubs.
              </h3>
              <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed">
                Compare wholesale rates across Lagos Mile 12, Kano Dawanau, and Ibadan Bodija with haulage transport margins so you always sell at the peak price.
              </p>
            </div>

            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 rounded-2xl border border-emerald-200 dark:border-emerald-800/40 space-y-2 text-xs text-emerald-950 dark:text-emerald-300">
              <div className="flex items-center justify-between">
                <span className="font-bold flex items-center gap-1.5">
                  <Store className="w-4 h-4 text-emerald-600" />
                  Tomato (50kg Crate) Wholesale
                </span>
                <span className="font-semibold text-emerald-700 dark:text-emerald-400">₦28,000 Mile 12</span>
              </div>
              <p className="text-[11px] text-emerald-800/80 dark:text-emerald-300/80 leading-relaxed">
                Kano farmgate: ₦18,500 • Estimated net arbitrage margin after transport: +₦4,500/crate
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. COMPARISON (Messy Paper Notebook vs FarmPal Operating System) */}
      {/* ========================================================================= */}
      <section id="how-it-works" className="py-14 sm:py-20 px-4 sm:px-6 max-w-5xl mx-auto border-t border-black/[0.06] dark:border-white/[0.08]">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider block mb-1">
            Why FarmPal
          </span>
          <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-[#1D1D1F] dark:text-white" style={{ textWrap: 'balance' }}>
            Replacing lost paper notes with an automated financial brain.
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          {/* Old Way */}
          <div className="bg-red-50/50 dark:bg-red-950/15 p-6 rounded-3xl border border-red-200/60 dark:border-red-900/30 space-y-3">
            <span className="text-xs font-bold text-red-700 dark:text-red-400 uppercase tracking-wider block">
              Traditional Paper Notebook
            </span>
            <ul className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-300 space-y-2.5">
              <li className="flex items-start gap-2">
                <span className="text-red-500 font-bold shrink-0">✕</span>
                <span>Torn pages, rain-damaged notes, and forgotten cash outlays.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-500 font-bold shrink-0">✕</span>
                <span>Unrecorded credit sales leading to disputed buyer payments.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-500 font-bold shrink-0">✕</span>
                <span>No idea whether Tomato or Cucumber was actually profitable until harvest is over.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-500 font-bold shrink-0">✕</span>
                <span>Rejected by commercial banks due to zero verified financial statements.</span>
              </li>
            </ul>
          </div>

          {/* FarmPal Way */}
          <div className="bg-emerald-50/60 dark:bg-emerald-950/20 p-6 rounded-3xl border border-emerald-200 dark:border-emerald-800/40 space-y-3 shadow-2xs">
            <span className="text-xs font-bold text-emerald-800 dark:text-emerald-400 uppercase tracking-wider block">
              FarmPal Automated Operating System
            </span>
            <ul className="text-xs sm:text-sm text-neutral-800 dark:text-neutral-200 space-y-2.5">
              <li className="flex items-start gap-2">
                <span className="text-emerald-600 font-bold shrink-0">✓</span>
                <span>Speak or text on WhatsApp; records are backed up forever.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-600 font-bold shrink-0">✓</span>
                <span>Automated debtors ledger with polite WhatsApp repayment prompts.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-600 font-bold shrink-0">✓</span>
                <span>Live break-even cost per crate computed dynamically after every expense.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-600 font-bold shrink-0">✓</span>
                <span>Export audited CSV statements certified for bank loans and extension agents.</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. QUANTITATIVE SOCIAL PROOF & FARMER TESTIMONIALS */}
      {/* ========================================================================= */}
      <section className="py-14 sm:py-20 px-4 sm:px-6 max-w-6xl mx-auto border-t border-black/[0.06] dark:border-white/[0.08]">
        <div className="max-w-2xl mb-10">
          <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider block mb-1">
            Real Proof in the Field
          </span>
          <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-[#1D1D1F] dark:text-white" style={{ textWrap: 'balance' }}>
            Proven results across commercial clusters in Nigeria.
          </h2>
        </div>

        {/* Quantified Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <div className="p-4 bg-white dark:bg-[#1C1C1E] rounded-2xl border border-black/[0.06] dark:border-white/[0.08] shadow-2xs">
            <div className="text-2xl sm:text-3xl font-bold text-[#1D1D1F] dark:text-white font-mono">+34%</div>
            <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">Realized Net Margin</div>
          </div>
          <div className="p-4 bg-white dark:bg-[#1C1C1E] rounded-2xl border border-black/[0.06] dark:border-white/[0.08] shadow-2xs">
            <div className="text-2xl sm:text-3xl font-bold text-[#1D1D1F] dark:text-white font-mono">0</div>
            <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">Lost Credit Receivables</div>
          </div>
          <div className="p-4 bg-white dark:bg-[#1C1C1E] rounded-2xl border border-black/[0.06] dark:border-white/[0.08] shadow-2xs">
            <div className="text-2xl sm:text-3xl font-bold text-[#1D1D1F] dark:text-white font-mono">₦1.8M</div>
            <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">Avg Loan Pre-Approval</div>
          </div>
          <div className="p-4 bg-white dark:bg-[#1C1C1E] rounded-2xl border border-black/[0.06] dark:border-white/[0.08] shadow-2xs">
            <div className="text-2xl sm:text-3xl font-bold text-[#1D1D1F] dark:text-white font-mono">4.9 / 5</div>
            <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">Farmer Pilot Satisfaction</div>
          </div>
        </div>

        {/* Testimonials */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
          <div className="p-5 sm:p-6 bg-white dark:bg-[#1C1C1E] rounded-3xl border border-black/[0.06] dark:border-white/[0.08] shadow-2xs flex flex-col justify-between space-y-4">
            <p className="text-xs sm:text-sm text-neutral-700 dark:text-neutral-300 italic leading-relaxed">
              "Before FarmPal, I sold tomato crates at whatever price Dawanau middlemen offered. Now I know my unit cost is ₦7,200/crate. I refused lowball bids and made ₦420,000 extra profit this season."
            </p>
            <div>
              <span className="text-xs font-bold text-[#1D1D1F] dark:text-white block">Alhaji Danladi Usman</span>
              <span className="text-[11px] text-neutral-500">Commercial Tomato Farmer • Kano (4.5 Acres)</span>
            </div>
          </div>

          <div className="p-5 sm:p-6 bg-white dark:bg-[#1C1C1E] rounded-3xl border border-black/[0.06] dark:border-white/[0.08] shadow-2xs flex flex-col justify-between space-y-4">
            <p className="text-xs sm:text-sm text-neutral-700 dark:text-neutral-300 italic leading-relaxed">
              "Sending voice notes on WhatsApp changed everything for me. I just talk while riding my bike back from the farm. FarmPal logs labour and fuel automatically. No computer needed."
            </p>
            <div>
              <span className="text-xs font-bold text-[#1D1D1F] dark:text-white block">Amina Bello</span>
              <span className="text-[11px] text-neutral-500">Cucumber &amp; Sweetcorn Grower • Kaduna</span>
            </div>
          </div>

          <div className="p-5 sm:p-6 bg-white dark:bg-[#1C1C1E] rounded-3xl border border-black/[0.06] dark:border-white/[0.08] shadow-2xs flex flex-col justify-between space-y-4">
            <p className="text-xs sm:text-sm text-neutral-700 dark:text-neutral-300 italic leading-relaxed">
              "FarmPal changed how I sell my tomato harvest. I used to let market traders take crates on credit and lose track of payments. Now every debt is logged and I collect in full on WhatsApp."
            </p>
            <div>
              <span className="text-xs font-bold text-[#1D1D1F] dark:text-white block">Chief Emeka Eze</span>
              <span className="text-[11px] text-neutral-500">Commercial Tomato Farmer • Oyo State</span>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 6. TRANSPARENT PRICING / ACCESSIBILITY TIERS */}
      {/* ========================================================================= */}
      <section id="pricing" className="py-14 sm:py-20 px-4 sm:px-6 max-w-5xl mx-auto border-t border-black/[0.06] dark:border-white/[0.08]">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider block mb-1">
            Fair Agricultural Pricing
          </span>
          <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-[#1D1D1F] dark:text-white" style={{ textWrap: 'balance' }}>
            Always free for individual smallholder farmers.
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Tier 1: Smallholder Free */}
          <div className="p-6 bg-white dark:bg-[#1C1C1E] rounded-3xl border border-black/[0.08] dark:border-white/[0.1] shadow-2xs flex flex-col justify-between space-y-5">
            <div className="space-y-3">
              <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider block">
                Smallholder Notebook
              </span>
              <div className="text-3xl font-bold text-[#1D1D1F] dark:text-white font-mono">
                ₦0 <span className="text-xs font-normal text-neutral-500">/ forever free</span>
              </div>
              <p className="text-xs text-neutral-600 dark:text-neutral-400">
                For independent smallholders managing their own plots up to 5 acres.
              </p>
              <ul className="text-xs text-neutral-700 dark:text-neutral-300 space-y-2 pt-2 border-t border-black/[0.04] dark:border-white/[0.06]">
                <li className="flex items-center gap-2">✓ Unlimited WhatsApp Voice &amp; Text logging</li>
                <li className="flex items-center gap-2">✓ Crop unit break-even tracking</li>
                <li className="flex items-center gap-2">✓ Debtors &amp; credit sales book</li>
                <li className="flex items-center gap-2">✓ Daily 7 PM friendly check-in reminder</li>
                <li className="flex items-center gap-2">✓ Offline USSD (*384*24#) access</li>
              </ul>
            </div>
            <button
              type="button"
              onClick={onOpenOnboarding}
              className="w-full py-2.5 bg-black/[0.06] dark:bg-white/[0.1] hover:bg-black/[0.1] text-xs font-semibold text-[#1D1D1F] dark:text-white rounded-xl transition-all cursor-pointer"
            >
              Start Free Today
            </button>
          </div>

          {/* Tier 2: Commercial Pro (Marquee Highlight) */}
          <div className="p-6 bg-neutral-900 text-white rounded-3xl border border-white/20 shadow-xl flex flex-col justify-between space-y-5 relative">
            <div className="absolute -top-3 right-5 bg-[#34C759] text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full shadow-sm">
              Commercial Farm
            </div>
            <div className="space-y-3">
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider block">
                Commercial Producer
              </span>
              <div className="text-3xl font-bold text-white font-mono">
                ₦5,000 <span className="text-xs font-normal text-neutral-400">/ month</span>
              </div>
              <p className="text-xs text-neutral-300">
                For commercial agribusinesses, multi-field managers, and commercial greenhouse operators.
              </p>
              <ul className="text-xs text-neutral-200 space-y-2 pt-2 border-t border-white/10">
                <li className="flex items-center gap-2">✓ Everything in Free Notebook</li>
                <li className="flex items-center gap-2">✓ Multi-market wholesale price comparisons</li>
                <li className="flex items-center gap-2">✓ Seasonal crop budget burn &amp; stage alerts</li>
                <li className="flex items-center gap-2">✓ Multi-worker labour tracking &amp; payouts</li>
                <li className="flex items-center gap-2">✓ Farm depot storehouse inventory controls</li>
              </ul>
            </div>
            <button
              type="button"
              onClick={onOpenOnboarding}
              className="w-full py-2.5 bg-[#0071E3] hover:bg-[#0077ED] text-xs font-semibold text-white rounded-xl transition-all cursor-pointer shadow-sm"
            >
              Start 30-Day Pro Trial
            </button>
          </div>

          {/* Tier 3: Commercial Farm & Agribusiness Enterprise */}
          <div className="p-6 bg-white dark:bg-[#1C1C1E] rounded-3xl border border-black/[0.08] dark:border-white/[0.1] shadow-2xs flex flex-col justify-between space-y-5">
            <div className="space-y-3">
              <span className="text-xs font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider block">
                Commercial Farm &amp; Enterprise
              </span>
              <div className="text-3xl font-bold text-[#1D1D1F] dark:text-white font-mono">
                Custom <span className="text-xs font-normal text-neutral-500">/ per cluster</span>
              </div>
              <p className="text-xs text-neutral-600 dark:text-neutral-400">
                For commercial estate farms, state agricultural development boards, and FMCG industrial food offtakers.
              </p>
              <ul className="text-xs text-neutral-700 dark:text-neutral-300 space-y-2 pt-2 border-t border-black/[0.04] dark:border-white/[0.06]">
                <li className="flex items-center gap-2">✓ Multi-block production &amp; yield aggregation dashboard</li>
                <li className="flex items-center gap-2">✓ Wholesale commercial buyer contracts</li>
                <li className="flex items-center gap-2">✓ Bulk inputs &amp; warehouse inventory logistics</li>
                <li className="flex items-center gap-2">✓ Field supervisor mobile app sync</li>
                <li className="flex items-center gap-2">✓ Enterprise accounting ledger export</li>
              </ul>
            </div>
            <button
              type="button"
              onClick={onLaunchApp}
              className="w-full py-2.5 bg-black/[0.06] dark:bg-white/[0.1] hover:bg-black/[0.1] text-xs font-semibold text-[#1D1D1F] dark:text-white rounded-xl transition-all cursor-pointer"
            >
              Contact Enterprise Desk
            </button>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 7. CONVERSION BANNER (One-Click Launch into Onboarding) */}
      {/* ========================================================================= */}
      <section className="py-14 sm:py-20 px-4 sm:px-6 max-w-5xl mx-auto">
        <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-br from-emerald-900 via-neutral-900 to-neutral-950 text-white text-center space-y-4 shadow-2xl border border-white/10 relative overflow-hidden">
          <div className="w-12 h-12 rounded-2xl bg-white/10 text-emerald-400 flex items-center justify-center mx-auto mb-2">
            <Sprout className="w-6 h-6 stroke-[2.2]" />
          </div>

          <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-white" style={{ textWrap: 'balance' }}>
            Ready to give your farm an automated financial brain?
          </h2>

          <p className="text-xs sm:text-sm text-neutral-300 max-w-xl mx-auto leading-relaxed">
            Takes under 2 minutes to set up your primary crops. No credit card or paperwork required.
          </p>

          <div className="pt-3 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              type="button"
              onClick={onOpenOnboarding}
              className="w-full sm:w-auto px-6 py-3 bg-[#34C759] hover:bg-[#30B350] active:scale-95 text-white rounded-2xl text-xs sm:text-sm font-semibold tracking-tight transition-all cursor-pointer shadow-md flex items-center justify-center gap-2"
            >
              <span>Start Interactive Onboarding</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={onLaunchApp}
              className="w-full sm:w-auto px-6 py-3 bg-white/10 hover:bg-white/15 text-white rounded-2xl text-xs sm:text-sm font-semibold tracking-tight border border-white/10 transition-all cursor-pointer"
            >
              Explore Live Demo Farm
            </button>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 8. QUIET FOOTER (Brand Wordmark, Legal, Site Links) */}
      {/* ========================================================================= */}
      <footer className="border-t border-black/[0.06] dark:border-white/[0.08] py-10 px-4 sm:px-6 max-w-6xl mx-auto text-xs text-neutral-500 dark:text-neutral-400">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <FarmpalLogo theme={currentTheme === 'dark' ? 'dark' : 'light'} className="h-6 w-auto" />
            <span className="text-neutral-400">·</span>
            <span>Agricultural Financial Operating System</span>
          </div>

          <div className="flex items-center gap-5 text-neutral-600 dark:text-neutral-400">
            <button type="button" onClick={onLaunchApp} className="hover:text-black dark:hover:text-white cursor-pointer">
              Workspace
            </button>
            <button type="button" onClick={onOpenOnboarding} className="hover:text-black dark:hover:text-white cursor-pointer">
              Onboarding
            </button>
            <a href="#capabilities" className="hover:text-black dark:hover:text-white">
              Features
            </a>
            <a href="#pricing" className="hover:text-black dark:hover:text-white">
              Pricing
            </a>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-black/[0.04] dark:border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-neutral-400">
          <span>© 2026 FarmPal Technologies. All rights reserved. Designed for clarity and real farmer economics.</span>
          <span>Kano · Kaduna · Oyo · Benue</span>
        </div>
      </footer>
    </div>
  );
};
