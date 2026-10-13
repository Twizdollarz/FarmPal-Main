import React, { useState } from 'react';
import {
  Sprout,
  TrendingUp,
  ArrowDownRight,
  ArrowUpRight,
  Plus,
  Sparkles,
  Calendar,
  Layers,
  ChevronRight,
} from 'lucide-react';
import { Crop, FarmSummary, CropFinancials, FarmerProfile } from '../types';
import { translations, formatNaira } from '../lib/i18n';

interface HomeDashboardProps {
  crops: Crop[];
  cropFinancials: Record<string, CropFinancials>;
  farmSummary: FarmSummary;
  profile: FarmerProfile;
  onSelectCrop: (cropId: string) => void;
  onOpenNewCropModal: () => void;
  onQuickAction: (type: 'expense' | 'harvest' | 'sale', cropId?: string) => void;
}

export const HomeDashboard: React.FC<HomeDashboardProps> = ({
  crops,
  cropFinancials,
  farmSummary,
  profile,
  onSelectCrop,
  onOpenNewCropModal,
  onQuickAction,
}) => {
  const t = translations[profile.preferredLanguage] || translations.en;
  const [filter, setFilter] = useState<'all' | 'active' | 'finished'>('active');

  const activeCrops = crops.filter((c) => c.status === 'active');
  const finishedCrops = crops.filter((c) => c.status === 'finished');
  const displayedCrops =
    filter === 'active' ? activeCrops : filter === 'finished' ? finishedCrops : crops;

  const isProfitable = farmSummary.netProfit >= 0;

  return (
    <div className="space-y-6">
      {/* Top Banner: Apple Card - Farm Financial Overview */}
      <div className="bg-white dark:bg-[#1C1C1E] rounded-3xl p-6 sm:p-7 border border-black/[0.05] dark:border-white/[0.08] shadow-[0_2px_16px_rgba(0,0,0,0.03)] space-y-6 transition-colors">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-black/[0.05] dark:border-white/[0.08] pb-5">
          <div>
            <div className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400 font-medium mb-1">
              <span className="text-[#34C759] font-semibold">Overview</span>
              <span aria-hidden="true">·</span>
              <span>
                {activeCrops.length} active crop{activeCrops.length > 1 ? 's' : ''}
              </span>
              <span aria-hidden="true">·</span>
              <span>{profile.location}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#1D1D1F] dark:text-[#FFFFFF]">
              Welcome, {profile.name}
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="btn-start-new-crop-top"
              onClick={onOpenNewCropModal}
              className="flex items-center gap-2 bg-[#34C759] hover:bg-[#30B753] active:scale-95 text-white px-4 py-2 rounded-full text-xs font-semibold transition-all shadow-[0_2px_8px_rgba(52,199,89,0.25)] cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>{t.newCrop}</span>
            </button>
          </div>
        </div>

        {/* 3 Apple Inset Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          {/* Money Spent */}
          <div className="bg-[#F5F5F7] dark:bg-[#2C2C2E] rounded-2xl p-4.5 border border-black/[0.03] dark:border-white/[0.06] transition-all hover:bg-[#EDEDF0] dark:hover:bg-[#3A3A3C]">
            <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400 font-medium mb-1.5">
              <span>{t.moneySpent}</span>
              <span className="p-1 rounded-full bg-[#FF3B30]/10 text-[#FF3B30]">
                <ArrowDownRight className="w-3.5 h-3.5" />
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-semibold tabular-nums text-[#1D1D1F] dark:text-[#FFFFFF] tracking-tight">
              {formatNaira(farmSummary.totalSpent)}
            </div>
            <p className="text-[11px] text-neutral-400 dark:text-neutral-500 mt-1 font-normal">
              Total recorded input & labour
            </p>
          </div>

          {/* Money Earned */}
          <div className="bg-[#F5F5F7] dark:bg-[#2C2C2E] rounded-2xl p-4.5 border border-black/[0.03] dark:border-white/[0.06] transition-all hover:bg-[#EDEDF0] dark:hover:bg-[#3A3A3C]">
            <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400 font-medium mb-1.5">
              <span>{t.moneyEarned}</span>
              <span className="p-1 rounded-full bg-[#34C759]/10 text-[#34C759]">
                <ArrowUpRight className="w-3.5 h-3.5" />
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-semibold tabular-nums text-[#34C759] tracking-tight">
              {formatNaira(farmSummary.totalEarned)}
            </div>
            <p className="text-[11px] text-neutral-400 dark:text-neutral-500 mt-1 font-normal">
              Total revenue from crop sales
            </p>
          </div>

          {/* Current Profit */}
          <div className="bg-[#F5F5F7] dark:bg-[#2C2C2E] rounded-2xl p-4.5 border border-black/[0.03] dark:border-white/[0.06] transition-all hover:bg-[#EDEDF0] dark:hover:bg-[#3A3A3C]">
            <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400 font-medium mb-1.5">
              <span>{isProfitable ? t.profit : t.loss}</span>
              <span
                className={`p-1 rounded-full ${
                  isProfitable ? 'bg-[#34C759]/10 text-[#34C759]' : 'bg-amber-500/10 text-amber-500'
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5" />
              </span>
            </div>
            <div
              className={`text-2xl sm:text-3xl font-semibold tabular-nums tracking-tight ${
                isProfitable ? 'text-[#34C759]' : 'text-amber-500'
              }`}
            >
              {formatNaira(Math.abs(farmSummary.netProfit))}
            </div>
            <p className="text-[11px] text-neutral-400 dark:text-neutral-500 mt-1 font-normal">
              {isProfitable ? 'Farm operations are profitable' : 'Recovering recorded expenses'}
            </p>
          </div>
        </div>
      </div>

      {/* Smart Assistant Feed (Apple Intelligence Card) */}
      <div className="bg-gradient-to-br from-emerald-50/70 via-teal-50/40 to-sky-50/40 dark:from-emerald-950/25 dark:via-teal-950/20 dark:to-sky-950/20 border border-emerald-500/15 dark:border-emerald-500/25 rounded-3xl p-5 sm:p-6 backdrop-blur-xs transition-colors">
        <div className="flex items-center gap-2 text-[#1D1D1F] dark:text-[#F5F5F7] font-semibold text-sm mb-3">
          <Sparkles className="w-4 h-4 text-[#34C759]" />
          <span className="tracking-tight">{t.smartInsights}</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          {farmSummary.primaryInsights.map((insight, idx) => (
            <div
              key={idx}
              className="bg-white/80 dark:bg-[#1C1C1E]/80 backdrop-blur-md rounded-2xl p-3.5 text-xs sm:text-sm text-[#1D1D1F] dark:text-[#F5F5F7] border border-black/[0.04] dark:border-white/[0.06] flex items-start gap-2.5 shadow-2xs"
            >
              <div className="w-2 h-2 rounded-full bg-[#34C759] mt-1.5 shrink-0" />
              <span className="leading-relaxed">{insight}</span>
            </div>
          ))}
          {/* Highlight crop specific insights */}
          {(Object.values(cropFinancials) as CropFinancials[])
            .flatMap((cf) => (cf.insights ? cf.insights.slice(0, 1) : []))
            .slice(0, 2)
            .map((insight, idx) => (
              <div
                key={`crop-${idx}`}
                className="bg-white/80 dark:bg-[#1C1C1E]/80 backdrop-blur-md rounded-2xl p-3.5 text-xs sm:text-sm text-[#1D1D1F] dark:text-[#F5F5F7] border border-black/[0.04] dark:border-white/[0.06] flex items-start gap-2.5 shadow-2xs"
              >
                <div className="w-2 h-2 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                <span className="leading-relaxed">{insight}</span>
              </div>
            ))}
        </div>
      </div>

      {/* "My Crops" Section Header with Apple Segmented Control */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-2">
        <div>
          <h2 className="text-xl font-semibold text-[#1D1D1F] dark:text-[#FFFFFF] tracking-tight flex items-center gap-2">
            <span>{t.myCrops}</span>
            <span className="text-xs font-normal text-neutral-500 dark:text-neutral-400 bg-black/[0.04] dark:bg-white/[0.08] px-2 py-0.5 rounded-full">
              {displayedCrops.length}
            </span>
          </h2>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            Select a crop to view detailed ledger, break-even unit costs, and seasonal progress
          </p>
        </div>

        {/* Filter Pills (Apple Segmented Control) */}
        <div className="bg-[#E5E5EA]/70 dark:bg-[#2C2C2E]/80 backdrop-blur-md p-1 rounded-2xl border border-black/[0.04] dark:border-white/[0.06] flex items-center gap-0.5 self-start sm:self-auto">
          <button
            onClick={() => setFilter('active')}
            className={`px-3 py-1.5 rounded-xl text-xs transition-all cursor-pointer ${
              filter === 'active'
                ? 'bg-white dark:bg-[#3A3A3C] text-[#1D1D1F] dark:text-[#FFFFFF] shadow-[0_1px_3px_rgba(0,0,0,0.1),0_1px_2px_rgba(0,0,0,0.06)] font-semibold'
                : 'text-neutral-600 dark:text-neutral-300 hover:text-[#1D1D1F] dark:hover:text-white hover:bg-white/40 dark:hover:bg-white/10 font-medium'
            }`}
          >
            {t.activeCrops} ({activeCrops.length})
          </button>
          <button
            onClick={() => setFilter('finished')}
            className={`px-3 py-1.5 rounded-xl text-xs transition-all cursor-pointer ${
              filter === 'finished'
                ? 'bg-white dark:bg-[#3A3A3C] text-[#1D1D1F] dark:text-[#FFFFFF] shadow-[0_1px_3px_rgba(0,0,0,0.1),0_1px_2px_rgba(0,0,0,0.06)] font-semibold'
                : 'text-neutral-600 dark:text-neutral-300 hover:text-[#1D1D1F] dark:hover:text-white hover:bg-white/40 dark:hover:bg-white/10 font-medium'
            }`}
          >
            {t.finishedCrops} ({finishedCrops.length})
          </button>
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs transition-all cursor-pointer ${
              filter === 'all'
                ? 'bg-white dark:bg-[#3A3A3C] text-[#1D1D1F] dark:text-[#FFFFFF] shadow-[0_1px_3px_rgba(0,0,0,0.1),0_1px_2px_rgba(0,0,0,0.06)] font-semibold'
                : 'text-neutral-600 dark:text-neutral-300 hover:text-[#1D1D1F] dark:hover:text-white hover:bg-white/40 dark:hover:bg-white/10 font-medium'
            }`}
          >
            All ({crops.length})
          </button>
        </div>
      </div>

      {/* Active Crop Cards Grid */}
      {displayedCrops.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-[#1C1C1E] rounded-3xl border border-black/[0.06] dark:border-white/[0.08] p-8 shadow-2xs">
          <Sprout className="w-12 h-12 text-[#34C759] mx-auto mb-3 stroke-[1.5]" />
          <h3 className="text-base font-semibold text-[#1D1D1F] dark:text-[#FFFFFF]">No {filter} crops found</h3>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-sm mx-auto mt-1 mb-5">
            Start a new crop like Tomato, Cucumber, Sweetcorn, Pepper, or Okra to track expenses and sales.
          </p>
          <button
            onClick={onOpenNewCropModal}
            className="inline-flex items-center gap-2 bg-[#34C759] hover:bg-[#30B753] active:scale-95 text-white px-5 py-2 rounded-full text-xs font-semibold shadow-[0_2px_8px_rgba(52,199,89,0.25)] transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>{t.newCrop}</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {displayedCrops.map((crop) => {
            const fin = cropFinancials[crop.id] || {
              totalSpent: 0,
              totalEarned: 0,
              netProfit: 0,
              profitMarginPercent: 0,
              weightedAvgSellingPrice: 0,
              primaryUnit: 'crates',
              totalHarvestedQuantity: 0,
              totalSoldQuantity: 0,
            };
            const cropProfit = fin.netProfit >= 0;

            return (
              <div
                key={crop.id}
                id={`crop-card-${crop.id}`}
                className="bg-white dark:bg-[#1C1C1E] rounded-3xl border border-black/[0.05] dark:border-white/[0.08] shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.12)] hover:-translate-y-0.5 transition-all flex flex-col justify-between group overflow-hidden"
              >
                {/* Card Top / Header */}
                <div
                  className="p-5 sm:p-6 cursor-pointer"
                  onClick={() => onSelectCrop(crop.id)}
                >
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-semibold tracking-tight text-[#1D1D1F] dark:text-[#FFFFFF] group-hover:text-[#34C759] transition-colors">
                          {crop.name}
                        </h3>
                        {crop.status === 'active' ? (
                          <span className="text-[10px] font-semibold text-[#248A3D] dark:text-[#30D158] bg-[#34C759]/15 px-2 py-0.5 rounded-full">
                            Active
                          </span>
                        ) : (
                          <span className="text-[10px] font-medium text-neutral-500 dark:text-neutral-400 bg-neutral-100 dark:bg-white/[0.08] px-2 py-0.5 rounded-full">
                            Finished
                          </span>
                        )}
                      </div>
                      {crop.variety && (
                        <p className="text-xs text-neutral-500 dark:text-neutral-400 font-normal mt-0.5">{crop.variety}</p>
                      )}
                    </div>
                    <span className="text-neutral-400 group-hover:text-[#34C759] group-hover:translate-x-0.5 transition-all">
                      <ChevronRight className="w-5 h-5" />
                    </span>
                  </div>

                  {/* Farm Size & Planting Date meta */}
                  <div className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400 mb-4 pb-3 border-b border-black/[0.04] dark:border-white/[0.06]">
                    <span className="flex items-center gap-1">
                      <Layers className="w-3.5 h-3.5 text-neutral-400" />
                      {crop.farmSizeAcres} acre{crop.farmSizeAcres > 1 ? 's' : ''}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-neutral-400" />
                      Planted {crop.plantingDate}
                    </span>
                  </div>

                  {/* Financial Metrics Stack */}
                  <div className="space-y-2 text-xs sm:text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-neutral-500 dark:text-neutral-400 text-xs">{t.moneySpent}</span>
                      <span className="font-semibold tabular-nums text-neutral-800 dark:text-neutral-200">
                        {formatNaira(fin.totalSpent)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-neutral-500 dark:text-neutral-400 text-xs">{t.moneyEarned}</span>
                      <span className="font-semibold tabular-nums text-[#34C759]">
                        {formatNaira(fin.totalEarned)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-black/[0.04] dark:border-white/[0.06]">
                      <span className="text-neutral-600 dark:text-neutral-300 text-xs font-medium">
                        {cropProfit ? t.profit : t.loss}
                      </span>
                      <span
                        className={`font-semibold tabular-nums ${
                          cropProfit ? 'text-[#34C759]' : 'text-amber-500'
                        }`}
                      >
                        {formatNaira(fin.netProfit)}
                      </span>
                    </div>
                  </div>

                  {/* Variable price & harvest progress note */}
                  {fin.weightedAvgSellingPrice > 0 && (
                    <div className="mt-4 bg-[#F5F5F7] dark:bg-[#2C2C2E] rounded-xl p-2.5 text-xs text-neutral-600 dark:text-neutral-300 flex items-center justify-between border border-black/[0.02] dark:border-white/[0.04]">
                      <span className="text-[11px] text-neutral-500 dark:text-neutral-400">Avg selling price</span>
                      <span className="font-semibold tabular-nums text-[#1D1D1F] dark:text-[#FFFFFF]">
                        {formatNaira(fin.weightedAvgSellingPrice)} / {fin.primaryUnit}
                      </span>
                    </div>
                  )}
                </div>

                {/* Card Quick Action Bar (Apple Inset Buttons) */}
                <div className="bg-[#F5F5F7]/80 dark:bg-[#2C2C2E]/60 px-4 py-3 border-t border-black/[0.04] dark:border-white/[0.06] flex items-center justify-between gap-1.5 text-xs">
                  <button
                    onClick={() => onQuickAction('expense', crop.id)}
                    className="flex-1 py-1.5 px-2 bg-white dark:bg-[#1C1C1E] hover:bg-[#FF3B30]/10 text-[#FF3B30] font-medium rounded-xl border border-black/[0.06] dark:border-white/[0.08] transition-all text-center cursor-pointer active:scale-95 shadow-2xs"
                  >
                    + Expense
                  </button>
                  <button
                    onClick={() => onQuickAction('harvest', crop.id)}
                    className="flex-1 py-1.5 px-2 bg-white dark:bg-[#1C1C1E] hover:bg-[#34C759]/10 text-[#34C759] font-medium rounded-xl border border-black/[0.06] dark:border-white/[0.08] transition-all text-center cursor-pointer active:scale-95 shadow-2xs"
                  >
                    + Harvest
                  </button>
                  <button
                    onClick={() => onQuickAction('sale', crop.id)}
                    className="flex-1 py-1.5 px-2 bg-white dark:bg-[#1C1C1E] hover:bg-amber-500/10 text-amber-600 dark:text-amber-400 font-medium rounded-xl border border-black/[0.06] dark:border-white/[0.08] transition-all text-center cursor-pointer active:scale-95 shadow-2xs"
                  >
                    + Sale
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Inset bottom prompt to start crop */}
      <div className="bg-white dark:bg-[#1C1C1E] rounded-3xl p-5 sm:p-6 border border-black/[0.05] dark:border-white/[0.08] shadow-[0_2px_12px_rgba(0,0,0,0.02)] flex flex-col sm:flex-row items-center justify-between gap-4 transition-colors">
        <div className="flex items-center gap-3.5 text-neutral-700 dark:text-neutral-300">
          <div className="w-10 h-10 rounded-2xl bg-[#34C759]/15 text-[#34C759] flex items-center justify-center font-bold text-lg shrink-0">
            🌱
          </div>
          <div>
            <h4 className="text-sm font-semibold text-[#1D1D1F] dark:text-[#FFFFFF]">Planting another plot or crop?</h4>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Track Tomato, Cucumber, Sweetcorn, Pepper, Okra, or add any custom variety.
            </p>
          </div>
        </div>
        <button
          onClick={onOpenNewCropModal}
          className="w-full sm:w-auto bg-[#1D1D1F] dark:bg-white dark:text-[#1D1D1F] hover:bg-neutral-800 dark:hover:bg-neutral-200 active:scale-95 text-white px-4 py-2 rounded-full text-xs font-semibold transition-all shrink-0 cursor-pointer shadow-xs"
        >
          {t.newCrop}
        </button>
      </div>
    </div>
  );
};
