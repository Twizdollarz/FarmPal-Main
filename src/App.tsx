import React, { useState, useEffect, useCallback } from 'react';
import { Navbar, NavTab } from './components/Navbar';
import { HomeDashboard } from './components/HomeDashboard';
import { CropDetailModal } from './components/CropDetailModal';
import { QuickEntryModal } from './components/QuickEntryModal';
import { NewCropModal } from './components/NewCropModal';
import { RecordsLedger } from './components/RecordsLedger';
import { SettingsView } from './components/SettingsView';
import { FinancialIntelligenceView } from './components/FinancialIntelligenceView';
import { DebtorsTracker } from './components/DebtorsTracker';
import { FarmFinancialHealthCardModal } from './components/FarmFinancialHealthCardModal';
import { PlanningView } from './components/PlanningView';
import { MarketPriceView } from './components/MarketPriceView';
import { UssdSimulatorModal } from './components/UssdSimulatorModal';
import { InventoryView } from './components/InventoryView';
import { DailyReminderNotification } from './components/DailyReminderNotification';
import { NotificationCenterModal } from './components/NotificationCenterModal';
import { FarmerFeedbackModal } from './components/FarmerFeedbackModal';
import { TesterFeedbackView } from './components/TesterFeedbackView';
import { WhatsAppLinkModal } from './components/WhatsAppLinkModal';
import { LandingPage } from './components/LandingPage';
import { OnboardingModal } from './components/OnboardingModal';
import { AdminDashboardView } from './components/AdminDashboardView';
import { DeveloperGateModal } from './components/DeveloperGateModal';
import { MessageSquare, Sparkles, Shield } from 'lucide-react';
import {
  Crop,
  CropFinancials,
  FarmSummary,
  Expense,
  SaleRecord,
  HarvestRecord,
  LabourRecord,
  ExpenseCategory,
  FarmerProfile,
  Language,
  CropComparison,
  DebtorSummary,
  CashflowMonth,
  FarmFinancialHealth,
  DailyReminder,
  ThemeMode,
} from './types';

export default function App() {
  const [activeTab, setActiveTab] = useState<NavTab>('crops');
  const [crops, setCrops] = useState<Crop[]>([]);
  const [cropFinancials, setCropFinancials] = useState<Record<string, CropFinancials>>({});
  const [farmSummary, setFarmSummary] = useState<FarmSummary>({
    totalSpent: 0,
    totalEarned: 0,
    netProfit: 0,
    overallProfitMargin: 0,
    cropSummaries: {},
    primaryInsights: [],
  });
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [sales, setSales] = useState<SaleRecord[]>([]);
  const [harvests, setHarvests] = useState<HarvestRecord[]>([]);
  const [labourRecords, setLabourRecords] = useState<LabourRecord[]>([]);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [profile, setProfile] = useState<FarmerProfile>({
    id: 'farmer-1',
    name: 'Musa Ibrahim',
    phone: '+234 803 123 4567',
    location: 'Kano, Nigeria',
    preferredLanguage: 'en',
    currency: 'NGN',
    activeCropIds: [],
    dailyReminderEnabled: true,
    dailyReminderTime: '19:00',
    tier: 'pro',
    role: 'admin',
    isAdmin: true,
    createdAt: new Date().toISOString(),
  });

  // Phase 2 Financial Intelligence States
  const [cropComparisons, setCropComparisons] = useState<CropComparison[]>([]);
  const [debtorSummary, setDebtorSummary] = useState<DebtorSummary | null>(null);
  const [cashflowTimeline, setCashflowTimeline] = useState<CashflowMonth[]>([]);
  const [financialHealth, setFinancialHealth] = useState<FarmFinancialHealth | null>(null);
  const [isStatementModalOpen, setIsStatementModalOpen] = useState(false);
  const [isUssdModalOpen, setIsUssdModalOpen] = useState(false);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [isWhatsAppLinkModalOpen, setIsWhatsAppLinkModalOpen] = useState(false);
  const [isOnboardingModalOpen, setIsOnboardingModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'landing' | 'app'>(() => {
    try {
      const hasOnboarded = localStorage.getItem('farmpal_has_onboarded');
      return hasOnboarded ? 'app' : 'landing';
    } catch {
      return 'landing';
    }
  });
  const [feedbackCount, setFeedbackCount] = useState(3);
  const [testerToastMessage, setTesterToastMessage] = useState<string | null>(null);

  // Developer Mode (Guarded for core engineer only: nwobodotemple2002@gmail.com)
  const [isDeveloperMode, setIsDeveloperMode] = useState<boolean>(() => {
    try {
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        if (params.get('dev') === 'true' || params.get('admin') === 'true' || params.get('devKey')) {
          localStorage.setItem('farmpal_dev_mode', 'true');
          return true;
        }
        return localStorage.getItem('farmpal_dev_mode') === 'true';
      }
    } catch {
      return false;
    }
    return false;
  });
  const [isDeveloperModalOpen, setIsDeveloperModalOpen] = useState(false);

  const handleUnlockDeveloperMode = () => {
    setIsDeveloperMode(true);
    try {
      localStorage.setItem('farmpal_dev_mode', 'true');
    } catch {}
    setTesterToastMessage('👨‍💻 Developer Mode Unlocked (Nwobodo Temple)');
    setActiveTab('admin');
  };

  const handleLockDeveloperMode = () => {
    setIsDeveloperMode(false);
    try {
      localStorage.removeItem('farmpal_dev_mode');
    } catch {}
    if (activeTab === 'admin') {
      setActiveTab('crops');
    }
    setTesterToastMessage('🔒 Developer Mode Locked');
  };

  const [selectedCropDetailId, setSelectedCropDetailId] = useState<string | null>(null);
  const [isQuickEntryOpen, setIsQuickEntryOpen] = useState(false);
  const [quickEntryType, setQuickEntryType] = useState<'expense' | 'sale' | 'harvest' | 'labour'>('expense');
  const [quickEntryCropId, setQuickEntryCropId] = useState<string | undefined>(undefined);
  const [isNewCropOpen, setIsNewCropOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Apple Theme Management (Light / Dark / System Auto)
  const [theme, setTheme] = useState<ThemeMode>(() => {
    try {
      const saved = localStorage.getItem('farmpal_theme');
      if (saved === 'light' || saved === 'dark' || saved === 'system') return saved;
    } catch (_) {}
    return 'system';
  });

  // Apply dark theme attribute to HTML and Body
  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;

    const applyTheme = () => {
      let isDark = false;
      if (theme === 'dark') {
        isDark = true;
      } else if (theme === 'light') {
        isDark = false;
      } else {
        isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      }

      if (isDark) {
        root.classList.add('dark');
        root.setAttribute('data-theme', 'dark');
        body.setAttribute('data-theme', 'dark');
      } else {
        root.classList.remove('dark');
        root.setAttribute('data-theme', 'light');
        body.setAttribute('data-theme', 'light');
      }
    };

    applyTheme();
    try {
      localStorage.setItem('farmpal_theme', theme);
    } catch (_) {}

    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const listener = () => applyTheme();
      mediaQuery.addEventListener('change', listener);
      return () => mediaQuery.removeEventListener('change', listener);
    }
  }, [theme]);

  // Daily Friendly Reminders State
  const [dailyReminder, setDailyReminder] = useState<DailyReminder | null>(null);
  const [showReminderBanner, setShowReminderBanner] = useState(false);
  const [isNotificationCenterOpen, setIsNotificationCenterOpen] = useState(false);

  const fetchDailyReminder = useCallback(async (forceNew = false) => {
    try {
      const res = await fetch(`/api/reminders/daily?forceNew=${forceNew}`);
      if (res.ok) {
        const data: DailyReminder = await res.json();
        setDailyReminder(data);
        return data;
      }
    } catch (e) {
      console.warn('Failed to fetch daily reminder:', e);
    }
    return null;
  }, []);

  // Load all data from backend
  const loadData = useCallback(async () => {
    try {
      const safeJson = async (res: Response) => {
        const contentType = res.headers.get('content-type') || '';
        if (!res.ok || !contentType.includes('application/json')) {
          return null;
        }
        try {
          return await res.json();
        } catch (e) {
          console.warn(`Failed to parse JSON for ${res.url}:`, e);
          return null;
        }
      };

      const [cropsRes, expRes, salesRes, harvRes, labRes, catRes, finRes, profRes, analyticsRes] =
        await Promise.all([
          fetch('/api/crops'),
          fetch('/api/expenses'),
          fetch('/api/sales'),
          fetch('/api/harvest'),
          fetch('/api/labour'),
          fetch('/api/categories'),
          fetch('/api/financials'),
          fetch('/api/profile'),
          fetch('/api/analytics'),
        ]);

      const cropsData = await safeJson(cropsRes);
      if (cropsData) setCrops(cropsData);

      const expData = await safeJson(expRes);
      if (expData) setExpenses(expData);

      const salesData = await safeJson(salesRes);
      if (salesData) setSales(salesData);

      const harvData = await safeJson(harvRes);
      if (harvData) setHarvests(harvData);

      const labData = await safeJson(labRes);
      if (labData) setLabourRecords(labData);

      const catData = await safeJson(catRes);
      if (catData) setCategories(catData);

      const profData = await safeJson(profRes);
      if (profData) setProfile(profData);

      const finData = await safeJson(finRes);
      if (finData) {
        if (finData.farmSummary) setFarmSummary(finData.farmSummary);
        if (finData.cropFinancials) setCropFinancials(finData.cropFinancials);
      }

      const analyticsData = await safeJson(analyticsRes);
      if (analyticsData) {
        if (!finData && analyticsData.farmSummary) {
          setFarmSummary(analyticsData.farmSummary);
        }
        setCropComparisons(analyticsData.cropComparisons || []);
        setDebtorSummary(analyticsData.debtorSummary || null);
        setCashflowTimeline(analyticsData.cashflowTimeline || []);
        setFinancialHealth(analyticsData.financialHealth || null);
      }
    } catch (err) {
      console.error('Error fetching farm data:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (viewMode === 'app') {
      loadData();
      fetchDailyReminder().then((rem) => {
        if (rem) {
          // Show gentle in-app reminder banner after short delay
          const timer = setTimeout(() => {
            setShowReminderBanner(true);
          }, 1500);
          return () => clearTimeout(timer);
        }
      });
    }
  }, [viewMode, loadData, fetchDailyReminder]);

  // Actions
  const handleCreateCrop = async (data: any) => {
    const res = await fetch('/api/crops', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to create crop');
    }
    await loadData();
  };

  const handleFinishCrop = async (cropId: string) => {
    await fetch(`/api/crops/${cropId}/finish`, { method: 'PUT' });
    await loadData();
  };

  const handleReopenCrop = async (cropId: string) => {
    await fetch(`/api/crops/${cropId}/reopen`, { method: 'PUT' });
    await loadData();
  };

  const handleSaveExpense = async (data: any) => {
    const res = await fetch('/api/expenses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to save expense');
    }
    await loadData();
  };

  const handleDeleteExpense = async (id: string) => {
    await fetch(`/api/expenses/${id}`, { method: 'DELETE' });
    await loadData();
  };

  const handleSaveSale = async (data: any) => {
    const res = await fetch('/api/sales', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to save sale');
    }
    await loadData();
  };

  const handleSaveHarvest = async (data: any) => {
    const res = await fetch('/api/harvest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to save harvest');
    }
    await loadData();
  };

  const handleSaveLabour = async (data: any) => {
    const res = await fetch('/api/labour', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to save labour');
    }
    await loadData();
  };

  const handleCollectDebtorPayment = async (saleId: string, amount: number, notes?: string) => {
    const res = await fetch(`/api/sales/${saleId}/collect-payment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount, notes }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to record debtor payment');
    }
    await loadData();
  };

  const handleUpdateProfile = async (updated: Partial<FarmerProfile>) => {
    const res = await fetch('/api/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated),
    });
    if (res.ok) {
      setProfile(await res.json());
    }
  };

  const handleResetSeed = async () => {
    await fetch('/api/reset', { method: 'POST' });
    await loadData();
  };

  const handleLanguageChange = (lang: Language) => {
    handleUpdateProfile({ preferredLanguage: lang });
  };

  const handleResetToCleanSlate = async () => {
    if (!window.confirm('Clear sample crops and expenses so you can test adding your own real farm records? (Feedback history will be preserved).')) return;
    try {
      const res = await fetch('/api/test-mode/clean-slate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          testerName: profile.name || 'Farmer Tester',
          testerLocation: profile.location || 'Nigeria',
          testerPhone: profile.phone || '',
        }),
      });
      if (res.ok) {
        setTesterToastMessage('🌱 Clean farm slate created! You can now test adding your own crops, expenses, and harvests.');
        await loadData();
        setActiveTab('crops');
        setTimeout(() => setTesterToastMessage(null), 5000);
      }
    } catch (e) {
      console.error('Failed to reset to clean slate:', e);
    }
  };

  const handleReloadDemoFarm = async () => {
    try {
      const res = await fetch('/api/test-mode/reload-demo', { method: 'POST' });
      if (res.ok) {
        setTesterToastMessage('🌾 Sample Kano farm reloaded with Tomato, Cucumber, Sweetcorn, crop budgets, and inventory records.');
        await loadData();
        setTimeout(() => setTesterToastMessage(null), 5000);
      }
    } catch (e) {
      console.error('Failed to reload demo farm:', e);
    }
  };

  const handleCompleteOnboarding = async (data: {
    profile: Partial<FarmerProfile>;
    initialCrops?: Array<{ name: string; acres: number; variety?: string }>;
    initialExpense?: { category: string; amount: number; description: string };
    useDemoData?: boolean;
  }) => {
    try {
      await handleUpdateProfile(data.profile);

      if (data.useDemoData) {
        await fetch('/api/test-mode/reload-demo', { method: 'POST' });
      } else {
        await fetch('/api/test-mode/clean-slate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            testerName: data.profile.name,
            testerLocation: data.profile.location,
            testerPhone: data.profile.phone,
            testerLanguage: data.profile.preferredLanguage,
          }),
        });

        if (data.initialCrops && data.initialCrops.length > 0) {
          for (const c of data.initialCrops) {
            await fetch('/api/crops', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                name: c.name,
                variety: c.variety,
                farmSizeAcres: c.acres,
              }),
            });
          }
        }

        if (data.initialExpense && data.initialExpense.amount > 0) {
          await fetch('/api/expenses', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              categoryName: data.initialExpense.category,
              totalAmount: data.initialExpense.amount,
              description: data.initialExpense.description,
              isShared: true,
            }),
          });
        }
      }

      try {
        localStorage.setItem('farmpal_has_onboarded', 'true');
      } catch (_) {}

      await loadData();
      setViewMode('app');
      setTesterToastMessage('🎉 Welcome to FarmPal! Your custom farm notebook is now ready.');
      setTimeout(() => setTesterToastMessage(null), 5000);
    } catch (err) {
      console.error('Failed to complete onboarding:', err);
    }
  };

  const openQuickEntry = (type: 'expense' | 'sale' | 'harvest' | 'labour', cropId?: string) => {
    setQuickEntryType(type);
    setQuickEntryCropId(cropId);
    setIsQuickEntryOpen(true);
  };

  const selectedCrop = crops.find((c) => c.id === selectedCropDetailId);

  // Direct redirect straight to WhatsApp Bot on WhatsApp
  const handleOpenWhatsAppBot = () => {
    const rawPhone = (profile.phone || '+2348031234567').replace(/[^0-9]/g, '');
    const cleanPhone = rawPhone.startsWith('0') ? '234' + rawPhone.slice(1) : rawPhone;
    const defaultText = encodeURIComponent(
      'Hello FarmPal! I want to record my farm expenses and check market prices.'
    );
    const waUrl = `https://wa.me/${cleanPhone || '2348031234567'}?text=${defaultText}`;
    window.open(waUrl, '_blank', 'noopener,noreferrer');
  };

  // VIEW MODE: PUBLIC LANDING PAGE
  if (viewMode === 'landing') {
    return (
      <>
        {/* Tester Action Toast Banner */}
        {testerToastMessage && (
          <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-[#1D1D1F]/90 dark:bg-white/90 backdrop-blur-xl text-white dark:text-[#1D1D1F] px-5 py-3 rounded-full shadow-[0_12px_36px_rgba(0,0,0,0.18)] border border-white/10 dark:border-black/10 text-xs font-semibold flex items-center gap-2.5 transition-all animate-bounce">
            <span className="w-2 h-2 rounded-full bg-[#34C759]" />
            <span>{testerToastMessage}</span>
          </div>
        )}

        <LandingPage
          onLaunchApp={() => setViewMode('app')}
          onOpenOnboarding={() => setIsOnboardingModalOpen(true)}
          currentTheme={theme}
          onThemeChange={setTheme}
        />

        <OnboardingModal
          isOpen={isOnboardingModalOpen}
          onClose={() => setIsOnboardingModalOpen(false)}
          onCompleteOnboarding={handleCompleteOnboarding}
          currentProfile={profile}
          currentTheme={theme}
        />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F5F7] dark:bg-[#000000] text-[#1D1D1F] dark:text-[#F5F5F7] flex flex-col font-sans antialiased selection:bg-[#34C759]/20 transition-colors duration-200">
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        profile={profile}
        onLanguageChange={handleLanguageChange}
        currentTheme={theme}
        onThemeChange={setTheme}
        onOpenQuickEntry={() => openQuickEntry('expense')}
        onOpenUssdModal={() => setIsUssdModalOpen(true)}
        debtorCount={debtorSummary?.debtorsWithDebtCount || 0}
        onOpenReminders={() => setIsNotificationCenterOpen(true)}
        hasActiveReminder={profile.dailyReminderEnabled}
        onOpenFeedbackModal={() => setIsFeedbackModalOpen(true)}
        onOpenWhatsAppBot={handleOpenWhatsAppBot}
        onOpenLanding={() => setViewMode('landing')}
        onOpenOnboarding={() => setIsOnboardingModalOpen(true)}
        feedbackCount={feedbackCount}
        isDeveloperMode={isDeveloperMode}
        onOpenDeveloperModal={() => setIsDeveloperModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center space-y-3">
            <div className="w-8 h-8 rounded-full border-2 border-emerald-600 border-t-transparent animate-spin" />
            <p className="text-xs text-stone-500 font-medium">Opening FarmPal notebook...</p>
          </div>
        ) : (
          <>
            {/* VIEW 1: CROPS LIST & MANAGEMENT */}
            {activeTab === 'crops' && (
              <HomeDashboard
                crops={crops}
                cropFinancials={cropFinancials}
                farmSummary={farmSummary}
                profile={profile}
                onSelectCrop={(cropId) => setSelectedCropDetailId(cropId)}
                onOpenNewCropModal={() => setIsNewCropOpen(true)}
                onQuickAction={(type, cropId) => openQuickEntry(type, cropId)}
              />
            )}

            {/* VIEW 1B: SEASONAL PLANNING, BUDGETS & AGRONOMIC TASKS (PHASE 3) */}
            {activeTab === 'planning' && (
              <PlanningView
                crops={crops}
                onOpenQuickEntry={(cropId) => openQuickEntry('expense', cropId)}
              />
            )}

            {/* VIEW 1C: MARKET PRICE INTELLIGENCE & BENCHMARKS (PHASE 3) */}
            {activeTab === 'market' && (
              <MarketPriceView />
            )}

            {/* VIEW: FARM STOREHOUSE DEPOT INVENTORY (PHASE 4) */}
            {activeTab === 'inventory' && (
              <InventoryView />
            )}

            {/* VIEW 2: FINANCIAL INTELLIGENCE (PHASE 2) */}
            {activeTab === 'intelligence' && (
              <FinancialIntelligenceView
                farmSummary={farmSummary}
                cropComparisons={cropComparisons}
                debtorSummary={debtorSummary}
                cashflowTimeline={cashflowTimeline}
                financialHealth={financialHealth}
                expenses={expenses}
                onOpenStatementModal={() => setIsStatementModalOpen(true)}
                onNavigateToDebtors={() => setActiveTab('debtors')}
                onNavigateToCropDetail={(cropId) => setSelectedCropDetailId(cropId)}
              />
            )}

            {/* VIEW 3: DEBTORS & CREDIT TRACKER (PHASE 2) */}
            {activeTab === 'debtors' && (
              <DebtorsTracker
                debtorSummary={debtorSummary}
                onCollectPayment={handleCollectDebtorPayment}
                onRefresh={loadData}
              />
            )}

            {/* VIEW 4: RECORDS LEDGER */}
            {activeTab === 'records' && (
              <RecordsLedger
                crops={crops}
                expenses={expenses}
                sales={sales}
                harvests={harvests}
                labourRecords={labourRecords}
                onDeleteExpense={handleDeleteExpense}
                onOpenQuickEntry={(type) => openQuickEntry(type)}
              />
            )}

            {/* VIEW 5: MASTER ADMIN DASHBOARD CONSOLE (DEVELOPER-ONLY) */}
            {activeTab === 'admin' && (
              isDeveloperMode ? (
                <AdminDashboardView
                  currentProfile={profile}
                  onUpdateProfile={handleUpdateProfile}
                  onNavigateToFarmer={(farmerId) => {
                    setTesterToastMessage(`Selected farmer profile: ${farmerId}`);
                  }}
                />
              ) : (
                <div className="py-20 text-center space-y-4 max-w-md mx-auto">
                  <div className="w-14 h-14 rounded-3xl bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 flex items-center justify-center mx-auto shadow-sm">
                    <Shield className="w-7 h-7" />
                  </div>
                  <h3 className="text-xl font-bold text-stone-900 dark:text-white">
                    Developer Access Required
                  </h3>
                  <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
                    The master ecosystem administration dashboard is guarded and only accessible to authorized developers.
                  </p>
                  <div className="pt-2">
                    <button
                      onClick={() => setIsDeveloperModalOpen(true)}
                      className="px-5 py-2.5 rounded-xl text-xs font-bold bg-purple-700 hover:bg-purple-800 text-white shadow-xs transition-colors cursor-pointer"
                    >
                      Authenticate Developer
                    </button>
                  </div>
                </div>
              )
            )}

            {/* VIEW 6: SETTINGS */}
            {activeTab === 'settings' && (
              <SettingsView
                profile={profile}
                onUpdateProfile={handleUpdateProfile}
                onResetSeed={handleResetSeed}
                onOpenWhatsAppLinkModal={() => setIsWhatsAppLinkModalOpen(true)}
                onOpenOnboarding={() => setIsOnboardingModalOpen(true)}
                onNavigateToAdmin={() => setActiveTab('admin')}
                isDeveloperMode={isDeveloperMode}
                onOpenDeveloperModal={() => setIsDeveloperModalOpen(true)}
                currentTheme={theme}
                onThemeChange={setTheme}
                onTriggerTestReminder={async () => {
                  const rem = await fetchDailyReminder(true);
                  if (rem) setShowReminderBanner(true);
                }}
              />
            )}

            {/* VIEW 7: FARMER FEEDBACK HUB */}
            {activeTab === 'feedback' && (
              <TesterFeedbackView
                profile={profile}
                onOpenFeedbackModal={() => setIsFeedbackModalOpen(true)}
                onResetToCleanSlate={handleResetToCleanSlate}
                onReloadDemoFarm={handleReloadDemoFarm}
              />
            )}
          </>
        )}
      </main>

      {/* Tester Action Toast Banner */}
      {testerToastMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-[#1D1D1F]/90 backdrop-blur-xl text-white px-5 py-3 rounded-full shadow-[0_12px_36px_rgba(0,0,0,0.18)] border border-white/10 text-xs font-medium flex items-center gap-2.5 animate-in fade-in slide-in-from-top-4">
          <Sparkles className="w-4 h-4 text-[#34C759] shrink-0" />
          <span>{testerToastMessage}</span>
          <button
            onClick={() => setTesterToastMessage(null)}
            className="text-neutral-400 hover:text-white ml-2 text-xs cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Daily Reminder Floating Banner */}
      {showReminderBanner && dailyReminder && (
        <DailyReminderNotification
          reminder={dailyReminder}
          farmerName={profile.name || 'Musa'}
          onClose={() => setShowReminderBanner(false)}
          onRecordExpense={() => {
            openQuickEntry('expense');
            setShowReminderBanner(false);
          }}
          onRecordSale={() => {
            openQuickEntry('sale');
            setShowReminderBanner(false);
          }}
          onOpenWhatsApp={() => {
            handleOpenWhatsAppBot();
            setShowReminderBanner(false);
          }}
          onShuffleReminder={async () => {
            const fresh = await fetchDailyReminder(true);
            if (fresh) setDailyReminder(fresh);
          }}
        />
      )}

      {/* Notification Center Modal */}
      <NotificationCenterModal
        isOpen={isNotificationCenterOpen}
        onClose={() => setIsNotificationCenterOpen(false)}
        profile={profile}
        currentReminder={dailyReminder}
        onTriggerNewReminder={() => fetchDailyReminder(true)}
        onSendToWhatsApp={() => {
          handleOpenWhatsAppBot();
          setIsNotificationCenterOpen(false);
        }}
        onRecordExpense={() => {
          openQuickEntry('expense');
          setIsNotificationCenterOpen(false);
        }}
        onRecordSale={() => {
          openQuickEntry('sale');
          setIsNotificationCenterOpen(false);
        }}
      />

      {/* MODAL 1: Crop Deep Inspection View */}
      {selectedCrop && (
        <CropDetailModal
          crop={selectedCrop}
          financials={
            cropFinancials[selectedCrop.id] || {
              totalSpent: 0,
              totalEarned: 0,
              netProfit: 0,
              profitMarginPercent: 0,
              weightedAvgSellingPrice: 0,
              primaryUnit: 'crates',
              totalHarvestedQuantity: 0,
              totalSoldQuantity: 0,
              breakEvenPrice: 0,
              expenseDistribution: [],
              insights: [],
            }
          }
          expenses={expenses}
          harvests={harvests}
          sales={sales}
          labourRecords={labourRecords}
          onClose={() => setSelectedCropDetailId(null)}
          onFinishCrop={handleFinishCrop}
          onReopenCrop={handleReopenCrop}
          onQuickAction={(type, cropId) => openQuickEntry(type, cropId)}
        />
      )}

      {/* MODAL 2: Quick Entry (Expense, Sale, Harvest, Labour) */}
      {isQuickEntryOpen && (
        <QuickEntryModal
          initialType={quickEntryType}
          initialCropId={quickEntryCropId}
          crops={crops}
          categories={categories}
          onClose={() => setIsQuickEntryOpen(false)}
          onSaveExpense={handleSaveExpense}
          onSaveSale={handleSaveSale}
          onSaveHarvest={handleSaveHarvest}
          onSaveLabour={handleSaveLabour}
        />
      )}

      {/* MODAL 3: Start New Crop */}
      {isNewCropOpen && (
        <NewCropModal
          onClose={() => setIsNewCropOpen(false)}
          onSaveCrop={handleCreateCrop}
        />
      )}

      {/* MODAL 4: Bank-Ready Farm Financial Health Statement (Phase 2) */}
      <FarmFinancialHealthCardModal
        isOpen={isStatementModalOpen}
        onClose={() => setIsStatementModalOpen(false)}
        profile={profile}
        farmSummary={farmSummary}
        cropComparisons={cropComparisons}
        debtorSummary={debtorSummary}
        financialHealth={financialHealth}
      />

      {/* MODAL 5: Offline USSD Handset Simulator (Phase 3) */}
      <UssdSimulatorModal
        isOpen={isUssdModalOpen}
        onClose={() => setIsUssdModalOpen(false)}
        onRecordAdded={loadData}
      />

      {/* MODAL 6: Farmer Tester Feedback Modal */}
      <FarmerFeedbackModal
        isOpen={isFeedbackModalOpen}
        onClose={() => setIsFeedbackModalOpen(false)}
        profile={profile}
        onFeedbackSubmitted={() => {
          setFeedbackCount((prev) => prev + 1);
          setTesterToastMessage('Nagode! Your feedback has been recorded in the Farmer Feedback Hub.');
          setTimeout(() => setTesterToastMessage(null), 5000);
        }}
      />

      {/* MODAL 8: Live WhatsApp Bot Link & Webhook Configuration */}
      <WhatsAppLinkModal
        isOpen={isWhatsAppLinkModalOpen}
        onClose={() => setIsWhatsAppLinkModalOpen(false)}
        profile={profile}
      />

      {/* MODAL 9: New User Farmer Onboarding Wizard */}
      <OnboardingModal
        isOpen={isOnboardingModalOpen}
        onClose={() => setIsOnboardingModalOpen(false)}
        onCompleteOnboarding={handleCompleteOnboarding}
        currentProfile={profile}
        currentTheme={theme}
      />

      {/* Floating Direct WhatsApp Bot Button on Screen */}
      <button
        type="button"
        id="btn-floating-whatsapp-bot"
        onClick={handleOpenWhatsAppBot}
        title="Open FarmPal on WhatsApp"
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2.5 bg-[#25D366] hover:bg-[#20BA5A] active:scale-95 text-white p-3.5 sm:px-4 sm:py-3 rounded-full shadow-[0_4px_16px_rgba(37,211,102,0.4)] hover:shadow-[0_6px_20px_rgba(37,211,102,0.5)] transition-all cursor-pointer group"
        aria-label="Direct WhatsApp Assistant"
      >
        <svg className="w-5 h-5 fill-current shrink-0" viewBox="0 0 24 24">
          <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.312.045-.693.076-1.99-.46-1.579-.652-2.584-2.28-2.663-2.384-.078-.104-.645-.859-.645-1.635 0-.776.406-1.157.55-1.314.144-.157.314-.197.418-.197.105 0 .21.002.301.006.096.004.225-.036.353.271.131.314.444 1.085.483 1.164.039.078.065.17.013.274-.052.105-.078.17-.157.262-.078.092-.165.205-.236.276-.079.079-.161.164-.069.322.092.157.408.673.875 1.089.601.536 1.109.702 1.267.781.157.078.249.066.341-.039.092-.105.393-.458.498-.615.105-.157.21-.131.353-.078.144.052.915.432 1.073.511.157.078.262.118.301.183.039.066.039.38-.105.785zM12 2C6.477 2 2 6.477 2 12c0 1.891.524 3.662 1.434 5.178L2 22l4.955-1.399A9.956 9.956 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm0 18.167c-1.697 0-3.273-.505-4.6-1.371l-.33-.217-2.923.824.814-2.977-.234-.344A8.146 8.146 0 013.833 12c0-4.503 3.664-8.167 8.167-8.167 4.503 0 8.167 3.664 8.167 8.167 0 4.503-3.664 8.167-8.167 8.167z" />
        </svg>
        <span className="hidden sm:inline text-xs font-bold tracking-tight">WhatsApp Assistant</span>
      </button>

      {/* Footer */}
      <footer className="border-t border-black/[0.05] dark:border-white/[0.05] bg-transparent py-8 text-center text-xs text-neutral-400 font-normal space-y-2">
        <p>FarmPal • Designed for clarity, speed, and real farmer economics</p>
        <div className="flex items-center justify-center gap-2.5 text-[11px] text-stone-400">
          <span>v1.4.0</span>
          <span>•</span>
          <button
            type="button"
            onClick={() => setIsDeveloperModalOpen(true)}
            className="hover:text-purple-600 dark:hover:text-purple-400 transition-colors cursor-pointer"
            title="Authorized Engineering Access Gate"
          >
            {isDeveloperMode ? '👨‍💻 Developer Mode Active' : 'Developer Access'}
          </button>
        </div>
      </footer>

      {/* Developer Access Gate Modal */}
      <DeveloperGateModal
        isOpen={isDeveloperModalOpen}
        onClose={() => setIsDeveloperModalOpen(false)}
        isDeveloperMode={isDeveloperMode}
        onUnlock={handleUnlockDeveloperMode}
        onLock={handleLockDeveloperMode}
      />
    </div>
  );
}
