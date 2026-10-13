import React, { useState } from 'react';
import {
  X,
  Calendar,
  Layers,
  TrendingUp,
  ArrowDownRight,
  ArrowUpRight,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Plus,
  Scale,
  Package,
  Clock,
  PieChart as PieIcon,
  Archive,
} from 'lucide-react';
import {
  Crop,
  CropFinancials,
  Expense,
  HarvestRecord,
  LabourRecord,
  SaleRecord,
} from '../types';
import { formatNaira } from '../lib/i18n';

interface CropDetailModalProps {
  crop: Crop;
  financials: CropFinancials;
  expenses: Expense[];
  harvests: HarvestRecord[];
  sales: SaleRecord[];
  labourRecords: LabourRecord[];
  onClose: () => void;
  onFinishCrop: (cropId: string) => void;
  onReopenCrop: (cropId: string) => void;
  onQuickAction: (type: 'expense' | 'harvest' | 'sale', cropId: string) => void;
}

export const CropDetailModal: React.FC<CropDetailModalProps> = ({
  crop,
  financials,
  expenses,
  harvests,
  sales,
  labourRecords,
  onClose,
  onFinishCrop,
  onReopenCrop,
  onQuickAction,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'expenses' | 'sales' | 'harvest'>('overview');

  // Filter items for this crop
  const cropExpenses = expenses.filter((e) =>
    e.allocations.some((a) => a.cropId === crop.id)
  );
  const cropHarvests = harvests.filter((h) => h.cropId === crop.id);
  const cropSales = sales.filter((s) => s.cropId === crop.id);
  const cropLabour = labourRecords.filter((l) => l.cropId === crop.id);

  const isProfitable = financials.netProfit >= 0;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-stone-200 overflow-hidden my-auto max-h-[90vh] flex flex-col">
        {/* Modal Top Header */}
        <div className="bg-emerald-900 text-white p-5 sm:p-6 flex items-start justify-between shrink-0">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xl sm:text-2xl font-bold tracking-tight">{crop.name}</span>
              <span
                className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                  crop.status === 'active'
                    ? 'bg-emerald-500/20 text-emerald-200 border border-emerald-400/30'
                    : 'bg-stone-500/30 text-stone-200 border border-stone-400/30'
                }`}
              >
                {crop.status === 'active' ? 'Active Crop' : 'Finished Crop'}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs text-emerald-200/80">
              {crop.variety && <span>Variety: {crop.variety}</span>}
              <span>•</span>
              <span className="flex items-center gap-1">
                <Layers className="w-3.5 h-3.5" />
                {crop.farmSizeAcres} Acres
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                Planted: {crop.plantingDate}
              </span>
              {crop.finishedDate && (
                <>
                  <span>•</span>
                  <span>Finished: {crop.finishedDate}</span>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {crop.status === 'active' ? (
              <button
                onClick={() => onFinishCrop(crop.id)}
                className="text-xs bg-emerald-800 hover:bg-emerald-700 text-emerald-100 border border-emerald-600 px-3 py-1.5 rounded-lg font-medium transition-colors"
              >
                Close Crop
              </button>
            ) : (
              <button
                onClick={() => onReopenCrop(crop.id)}
                className="text-xs bg-emerald-700 hover:bg-emerald-600 text-white px-3 py-1.5 rounded-lg font-medium transition-colors"
              >
                Reopen Crop
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 text-emerald-300 hover:text-white rounded-lg hover:bg-emerald-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Sub-tab Navigation */}
        <div className="bg-stone-100 border-b border-stone-200 px-5 flex items-center justify-between gap-2 overflow-x-auto shrink-0">
          <div className="flex items-center gap-2 py-2">
            <button
              onClick={() => setActiveSubTab('overview')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeSubTab === 'overview'
                  ? 'bg-white text-stone-900 shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Financial Intelligence
            </button>
            <button
              onClick={() => setActiveSubTab('expenses')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeSubTab === 'expenses'
                  ? 'bg-white text-stone-900 shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Expenses ({cropExpenses.length})
            </button>
            <button
              onClick={() => setActiveSubTab('sales')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeSubTab === 'sales'
                  ? 'bg-white text-stone-900 shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Sales ({cropSales.length})
            </button>
            <button
              onClick={() => setActiveSubTab('harvest')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeSubTab === 'harvest'
                  ? 'bg-white text-stone-900 shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Harvests ({cropHarvests.length})
            </button>
          </div>

          <div className="flex items-center gap-1.5 py-1">
            <button
              onClick={() => onQuickAction('expense', crop.id)}
              className="bg-rose-100 hover:bg-rose-200 text-rose-800 text-xs font-medium px-2.5 py-1 rounded-md transition-colors"
            >
              + Expense
            </button>
            <button
              onClick={() => onQuickAction('harvest', crop.id)}
              className="bg-emerald-100 hover:bg-emerald-200 text-emerald-800 text-xs font-medium px-2.5 py-1 rounded-md transition-colors"
            >
              + Harvest
            </button>
            <button
              onClick={() => onQuickAction('sale', crop.id)}
              className="bg-amber-100 hover:bg-amber-200 text-amber-800 text-xs font-medium px-2.5 py-1 rounded-md transition-colors"
            >
              + Sale
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1">
          {activeSubTab === 'overview' && (
            <div className="space-y-6">
              {/* 3 Core Financial Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-stone-50 rounded-xl p-4 border border-stone-200">
                  <div className="text-xs text-stone-500 mb-1 flex items-center justify-between">
                    <span>Money Spent</span>
                    <ArrowDownRight className="w-4 h-4 text-rose-500" />
                  </div>
                  <div className="text-xl font-bold text-stone-900">
                    {formatNaira(financials.totalSpent)}
                  </div>
                  <p className="text-[11px] text-stone-500 mt-1">Direct + shared allocations</p>
                </div>

                <div className="bg-stone-50 rounded-xl p-4 border border-stone-200">
                  <div className="text-xs text-stone-500 mb-1 flex items-center justify-between">
                    <span>Money Earned</span>
                    <ArrowUpRight className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="text-xl font-bold text-emerald-600">
                    {formatNaira(financials.totalEarned)}
                  </div>
                  <p className="text-[11px] text-stone-500 mt-1">
                    From {financials.totalSoldQuantity} {financials.primaryUnit} sold
                  </p>
                </div>

                <div
                  className={`rounded-xl p-4 border ${
                    isProfitable
                      ? 'bg-emerald-50/70 border-emerald-200'
                      : 'bg-amber-50/70 border-amber-200'
                  }`}
                >
                  <div className="text-xs text-stone-600 mb-1 flex items-center justify-between">
                    <span>{isProfitable ? 'Profit' : 'Net Deficit'}</span>
                    <TrendingUp
                      className={`w-4 h-4 ${isProfitable ? 'text-emerald-600' : 'text-amber-600'}`}
                    />
                  </div>
                  <div
                    className={`text-xl font-bold ${
                      isProfitable ? 'text-emerald-700' : 'text-amber-700'
                    }`}
                  >
                    {formatNaira(financials.netProfit)}
                  </div>
                  <p className="text-[11px] text-stone-500 mt-1">
                    Margin: {financials.profitMarginPercent}%
                  </p>
                </div>
              </div>

              {/* Variable Price & Unit Economics */}
              <div className="bg-stone-50 rounded-2xl p-4.5 border border-stone-200">
                <h4 className="text-xs font-bold uppercase tracking-wider text-stone-600 mb-3 flex items-center gap-1.5">
                  <Scale className="w-4 h-4 text-stone-500" />
                  <span>Variable Selling Price & Unit Economics</span>
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                  <div className="bg-white rounded-xl p-3 border border-stone-200/80">
                    <span className="text-[11px] text-stone-500 block">Total Harvested</span>
                    <span className="text-base font-bold text-stone-800">
                      {financials.totalHarvestedQuantity} {financials.primaryUnit}
                    </span>
                  </div>
                  <div className="bg-white rounded-xl p-3 border border-stone-200/80">
                    <span className="text-[11px] text-stone-500 block">Total Sold</span>
                    <span className="text-base font-bold text-stone-800">
                      {financials.totalSoldQuantity} {financials.primaryUnit}
                    </span>
                  </div>
                  <div className="bg-white rounded-xl p-3 border border-stone-200/80">
                    <span className="text-[11px] text-stone-500 block">Weighted Avg Price</span>
                    <span className="text-base font-bold text-emerald-700">
                      {financials.weightedAvgSellingPrice > 0
                        ? `${formatNaira(financials.weightedAvgSellingPrice)}`
                        : '—'}
                    </span>
                  </div>
                  <div className="bg-white rounded-xl p-3 border border-stone-200/80">
                    <span className="text-[11px] text-stone-500 block">Break-even Cost</span>
                    <span className="text-base font-bold text-stone-700">
                      {financials.breakEvenPrice > 0
                        ? `${formatNaira(financials.breakEvenPrice)}`
                        : '—'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Expense Distribution Visualizer */}
              <div className="bg-stone-50 rounded-2xl p-4.5 border border-stone-200">
                <h4 className="text-xs font-bold uppercase tracking-wider text-stone-600 mb-3 flex items-center gap-1.5">
                  <PieIcon className="w-4 h-4 text-stone-500" />
                  <span>Expense Distribution</span>
                </h4>
                {financials.expenseDistribution.length === 0 ? (
                  <p className="text-xs text-stone-500 italic py-3 text-center">
                    No expenses recorded for this crop yet.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {/* Visual proportion stacked bar */}
                    <div className="h-4 w-full bg-stone-200 rounded-full overflow-hidden flex shadow-inner">
                      {financials.expenseDistribution.map((item, idx) => {
                        const colors = [
                          'bg-emerald-600',
                          'bg-amber-500',
                          'bg-sky-500',
                          'bg-indigo-500',
                          'bg-rose-500',
                          'bg-stone-600',
                        ];
                        const col = colors[idx % colors.length];
                        return (
                          <div
                            key={idx}
                            title={`${item.categoryName}: ${item.percentage}%`}
                            className={`${col} h-full transition-all`}
                            style={{ width: `${item.percentage}%` }}
                          />
                        );
                      })}
                    </div>

                    {/* Breakdown items table */}
                    <div className="divide-y divide-stone-200/70 text-xs">
                      {financials.expenseDistribution.map((item, idx) => (
                        <div key={idx} className="py-2 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                            <span className="font-medium text-stone-800">{item.categoryName}</span>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="font-semibold text-stone-900">
                              {formatNaira(item.amount)}
                            </span>
                            <span className="text-stone-500 w-12 text-right">
                              {item.percentage}%
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Crop Specific Smart Insights */}
              {financials.insights.length > 0 && (
                <div className="bg-emerald-50/60 rounded-2xl p-4 border border-emerald-200/70">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-900 mb-2.5 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-emerald-600" />
                    <span>Insights on {crop.name}</span>
                  </h4>
                  <div className="space-y-2">
                    {financials.insights.map((insight, idx) => (
                      <div
                        key={idx}
                        className="bg-white/90 rounded-xl p-2.5 text-xs text-stone-700 border border-emerald-100 flex items-start gap-2"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                        <span>{insight}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tab 2: Expenses list */}
          {activeSubTab === 'expenses' && (
            <div className="space-y-3">
              {cropExpenses.length === 0 ? (
                <p className="text-xs text-stone-500 text-center py-8">
                  No expenses recorded for this crop yet.
                </p>
              ) : (
                <div className="divide-y divide-stone-100">
                  {cropExpenses.map((exp) => {
                    const alloc = exp.allocations.find((a) => a.cropId === crop.id);
                    const amountForThisCrop = alloc ? alloc.allocatedAmount : exp.totalAmount;
                    return (
                      <div key={exp.id} className="py-3 flex items-center justify-between text-xs">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-stone-900 text-sm">
                              {exp.categoryName}
                            </span>
                            {exp.isShared && (
                              <span className="text-[10px] bg-sky-100 text-sky-800 font-medium px-2 py-0.5 rounded-md">
                                Shared ({alloc?.percentage}%)
                              </span>
                            )}
                          </div>
                          <p className="text-stone-500 mt-0.5">{exp.description || 'No notes'}</p>
                          <span className="text-[11px] text-stone-400">{exp.expenseDate}</span>
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-stone-900 text-sm">
                            {formatNaira(amountForThisCrop)}
                          </span>
                          {exp.isShared && (
                            <span className="block text-[10px] text-stone-400">
                              (Original: {formatNaira(exp.totalAmount)})
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Tab 3: Sales list with weighted variable price */}
          {activeSubTab === 'sales' && (
            <div className="space-y-3">
              {cropSales.length === 0 ? (
                <p className="text-xs text-stone-500 text-center py-8">
                  No sales recorded for this crop yet.
                </p>
              ) : (
                <div className="divide-y divide-stone-100">
                  {cropSales.map((sale) => (
                    <div key={sale.id} className="py-3 flex items-center justify-between text-xs">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-stone-900 text-sm">
                            {sale.quantitySold} {sale.unit} @ {formatNaira(sale.pricePerUnit)}/{sale.unit}
                          </span>
                        </div>
                        <p className="text-stone-500 mt-0.5">
                          Buyer: {sale.buyerName || 'Local trader'} {sale.notes ? `• ${sale.notes}` : ''}
                        </p>
                        <span className="text-[11px] text-stone-400">{sale.saleDate}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-emerald-600 text-sm">
                          +{formatNaira(sale.totalRevenue)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tab 4: Harvest production list */}
          {activeSubTab === 'harvest' && (
            <div className="space-y-3">
              {cropHarvests.length === 0 ? (
                <p className="text-xs text-stone-500 text-center py-8">
                  No harvest recorded for this crop yet.
                </p>
              ) : (
                <div className="divide-y divide-stone-100">
                  {cropHarvests.map((h) => (
                    <div key={h.id} className="py-3 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-semibold text-stone-900 text-sm">
                          {h.quantity} {h.unit}
                        </span>
                        <p className="text-stone-500 mt-0.5">
                          Grade: {h.qualityGrade || 'Standard'} {h.notes ? `• ${h.notes}` : ''}
                        </p>
                        <span className="text-[11px] text-stone-400">{h.harvestDate}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-emerald-700 bg-emerald-50 px-2 py-1 rounded-md font-medium text-xs">
                          Harvested
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
