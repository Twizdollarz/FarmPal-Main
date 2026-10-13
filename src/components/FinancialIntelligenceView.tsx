import React, { useState } from 'react';
import {
  TrendingUp,
  Award,
  DollarSign,
  AlertCircle,
  ShieldCheck,
  Printer,
  Calendar,
  Layers,
  BarChart3,
  CheckCircle2,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
  Scale,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  AreaChart,
  Area,
} from 'recharts';
import {
  CropComparison,
  DebtorSummary,
  CashflowMonth,
  FarmFinancialHealth,
  FarmSummary,
  Expense,
} from '../types';
import { formatNaira } from '../lib/i18n';

interface FinancialIntelligenceViewProps {
  farmSummary: FarmSummary | null;
  cropComparisons: CropComparison[];
  debtorSummary: DebtorSummary | null;
  cashflowTimeline: CashflowMonth[];
  financialHealth: FarmFinancialHealth | null;
  expenses: Expense[];
  onOpenStatementModal: () => void;
  onNavigateToDebtors: () => void;
  onNavigateToCropDetail: (cropId: string) => void;
}

export const FinancialIntelligenceView: React.FC<FinancialIntelligenceViewProps> = ({
  farmSummary,
  cropComparisons,
  debtorSummary,
  cashflowTimeline,
  financialHealth,
  expenses,
  onOpenStatementModal,
  onNavigateToDebtors,
  onNavigateToCropDetail,
}) => {
  const [activeTab, setActiveTab] = useState<'comparison' | 'cashflow' | 'expenses'>('comparison');

  const totalSpent = farmSummary?.totalSpent || 0;
  const totalEarned = farmSummary?.totalEarned || 0;
  const netProfit = farmSummary?.netProfit || 0;
  const marginPercent = totalEarned > 0 ? Math.round((netProfit / totalEarned) * 1000) / 10 : 0;
  const totalOutstanding = debtorSummary?.totalOutstanding || 0;

  // Best ROI Crop
  const sortedByRoi = [...cropComparisons].sort((a, b) => b.roiPercent - a.roiPercent);
  const bestCrop = sortedByRoi[0];

  // Farm-wide Expense Category rollup
  const farmCategoryMap = new Map<string, number>();
  for (const exp of expenses) {
    const prev = farmCategoryMap.get(exp.categoryName) || 0;
    farmCategoryMap.set(exp.categoryName, prev + exp.totalAmount);
  }
  const categoryList: { name: string; amount: number; percentage: number }[] = [];
  for (const [name, amount] of farmCategoryMap.entries()) {
    const percentage = totalSpent > 0 ? Math.round((amount / totalSpent) * 1000) / 10 : 0;
    categoryList.push({ name, amount, percentage });
  }
  categoryList.sort((a, b) => b.amount - a.amount);

  // Chart data for crop comparison
  const cropBarData = cropComparisons.map((c) => ({
    name: c.cropName,
    'Money Spent': c.totalSpent,
    'Money Earned': c.totalEarned,
    'Net Profit': c.netProfit,
  }));

  return (
    <div className="space-y-6">
      {/* Executive Financial Intelligence Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
                <TrendingUp className="w-5 h-5" />
              </span>
              <h2 className="text-xl font-bold text-slate-900">Farm Financial Intelligence</h2>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                Phase 2 Engine
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Deterministic crop profitability, unit economics, return on investment, and lending health score
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              id="open-health-statement-btn"
              onClick={onOpenStatementModal}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              Generate Financial Health Statement
            </button>
          </div>
        </div>

        {/* 4 Core Financial Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 pt-6">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Total Farm Earned
            </span>
            <p className="text-2xl font-bold text-emerald-700 mt-1">{formatNaira(totalEarned)}</p>
            <span className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
              <ArrowUpRight className="w-3.5 h-3.5 text-emerald-600" />
              From all produce sales
            </span>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Total Farm Spent
            </span>
            <p className="text-2xl font-bold text-rose-600 mt-1">{formatNaira(totalSpent)}</p>
            <span className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
              <ArrowDownRight className="w-3.5 h-3.5 text-rose-500" />
              Reconciled across all plots
            </span>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Net Farm Profit
            </span>
            <p className={`text-2xl font-bold mt-1 ${netProfit >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
              {formatNaira(netProfit)}
            </p>
            <span className="text-[11px] text-emerald-700 font-semibold mt-0.5 block">
              {marginPercent}% overall profit margin
            </span>
          </div>

          <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-200">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-800">
                Lending Health Score
              </span>
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-extrabold text-emerald-800">
                {financialHealth?.healthScore || 85}
              </span>
              <span className="text-xs font-semibold text-emerald-700">/ 100</span>
            </div>
            <span className="text-[11px] text-emerald-800 font-medium block mt-0.5">
              {financialHealth?.healthRating} • {financialHealth?.repaymentReadiness}
            </span>
          </div>
        </div>

        {/* Outstanding Receivables Alert Banner */}
        {totalOutstanding > 0 && (
          <div className="mt-5 p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-amber-900">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                You have <strong>{formatNaira(totalOutstanding)}</strong> in uncollected produce debt across{' '}
                {debtorSummary?.debtors.length} buyer{debtorSummary?.debtors.length === 1 ? '' : 's'}.
              </span>
            </div>
            <button
              id="manage-debtors-alert-btn"
              onClick={onNavigateToDebtors}
              className="inline-flex items-center gap-1 font-semibold text-amber-800 hover:text-amber-950 underline cursor-pointer"
            >
              Collect from Debtors <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-1">
        <button
          id="tab-crop-comparison"
          onClick={() => setActiveTab('comparison')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-colors cursor-pointer ${
            activeTab === 'comparison'
              ? 'bg-slate-900 text-white'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          Crop Productivity & Benchmarking
        </button>
        <button
          id="tab-cashflow"
          onClick={() => setActiveTab('cashflow')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-colors cursor-pointer ${
            activeTab === 'cashflow'
              ? 'bg-slate-900 text-white'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          Cash Flow Timeline
        </button>
        <button
          id="tab-expenses"
          onClick={() => setActiveTab('expenses')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-colors cursor-pointer ${
            activeTab === 'expenses'
              ? 'bg-slate-900 text-white'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          Farm-Wide Expense Distribution
        </button>
      </div>

      {/* Tab 1: Crop Comparison & Performance */}
      {activeTab === 'comparison' && (
        <div className="space-y-6">
          {/* Visual Chart Card */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Money Spent vs. Money Earned by Crop Plot
                </h3>
                <p className="text-xs text-slate-500">
                  Comparing revenue generated against production costs for each crop
                </p>
              </div>
              {bestCrop && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 border border-emerald-200 rounded-full text-xs font-semibold text-emerald-800">
                  <Award className="w-3.5 h-3.5 text-emerald-600" />
                  Top ROI: {bestCrop.cropName} ({bestCrop.roiPercent}%)
                </div>
              )}
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={cropBarData} margin={{ top: 20, right: 20, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} />
                  <YAxis
                    stroke="#64748b"
                    fontSize={11}
                    tickFormatter={(val) => `₦${(val / 1000).toFixed(0)}k`}
                    tickLine={false}
                  />
                  <Tooltip
                    formatter={(val: any) => [formatNaira(Number(val)), '']}
                    contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                  <Bar dataKey="Money Spent" fill="#ef4444" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="Money Earned" fill="#10b981" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="Net Profit" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Deep Benchmarking Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-slate-200">
              <h3 className="text-sm font-bold text-slate-900">Per-Acre & Efficiency Metrics</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Detailed comparison of capital efficiency and profit per acre
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-600">
                  <tr>
                    <th className="py-3 px-4">Crop</th>
                    <th className="py-3 px-3">Size</th>
                    <th className="py-3 px-3">Money Spent</th>
                    <th className="py-3 px-3">Money Earned</th>
                    <th className="py-3 px-3">Net Profit</th>
                    <th className="py-3 px-3">Return (ROI)</th>
                    <th className="py-3 px-3">Cost / Acre</th>
                    <th className="py-3 px-3">Profit / Acre</th>
                    <th className="py-3 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {cropComparisons.map((c) => (
                    <tr key={c.cropId} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-900">
                        {c.cropName}
                        {c.cropId === bestCrop?.cropId && (
                          <span className="ml-2 text-[10px] bg-emerald-100 text-emerald-800 font-semibold px-1.5 py-0.5 rounded">
                            Best ROI
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-slate-600">{c.farmSizeAcres} acres</td>
                      <td className="py-3 px-3 text-rose-600 font-medium">{formatNaira(c.totalSpent)}</td>
                      <td className="py-3 px-3 text-emerald-700 font-medium">{formatNaira(c.totalEarned)}</td>
                      <td className={`py-3 px-3 font-bold ${c.netProfit >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                        {formatNaira(c.netProfit)}
                      </td>
                      <td className="py-3 px-3">
                        <span className={`inline-flex px-2 py-0.5 rounded-full font-bold ${c.roiPercent > 50 ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'}`}>
                          {c.roiPercent}%
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-600">{formatNaira(c.costPerAcre)}/ac</td>
                      <td className="py-3 px-3 font-bold text-slate-900">{formatNaira(c.profitPerAcre)}/ac</td>
                      <td className="py-3 px-3 text-right">
                        <button
                          id={`view-crop-intel-${c.cropId}`}
                          onClick={() => onNavigateToCropDetail(c.cropId)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition-colors cursor-pointer"
                        >
                          View Plot
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Cashflow Timeline */}
      {activeTab === 'cashflow' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
            <div className="mb-4">
              <h3 className="text-sm font-bold text-slate-900">Monthly Cash Inflow vs. Outflow</h3>
              <p className="text-xs text-slate-500">
                Track how cash leaves the farm for inputs and returns during harvest cycles
              </p>
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={cashflowTimeline} margin={{ top: 20, right: 20, left: 10, bottom: 5 }}>
                  <defs>
                    <linearGradient id="earnedGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="spentGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="month" stroke="#64748b" fontSize={12} tickLine={false} />
                  <YAxis
                    stroke="#64748b"
                    fontSize={11}
                    tickFormatter={(val) => `₦${(val / 1000).toFixed(0)}k`}
                    tickLine={false}
                  />
                  <Tooltip
                    formatter={(val: any) => [formatNaira(Number(val)), '']}
                    contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                  <Area
                    type="monotone"
                    dataKey="earned"
                    name="Money Earned"
                    stroke="#10b981"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#earnedGrad)"
                  />
                  <Area
                    type="monotone"
                    dataKey="spent"
                    name="Money Spent"
                    stroke="#ef4444"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#spentGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {cashflowTimeline.map((item) => (
              <div key={item.month} className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
                <span className="text-xs font-bold text-slate-700">{item.month}</span>
                <div className="mt-2 space-y-1 text-xs">
                  <div className="flex justify-between text-emerald-700 font-semibold">
                    <span>Inflow:</span>
                    <span>{formatNaira(item.earned)}</span>
                  </div>
                  <div className="flex justify-between text-rose-600 font-medium">
                    <span>Outflow:</span>
                    <span>{formatNaira(item.spent)}</span>
                  </div>
                  <div className="flex justify-between font-bold border-t border-slate-100 pt-1 text-slate-900">
                    <span>Net Cashflow:</span>
                    <span className={item.net >= 0 ? 'text-emerald-700' : 'text-rose-600'}>
                      {formatNaira(item.net)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Farm-Wide Expense Distribution */}
      {activeTab === 'expenses' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Total Farm Expenditure by Category</h3>
            <p className="text-xs text-slate-500">
              Aggregated across all plots (Labour, Fertilizer, Seeds, Fuel, Irrigation, etc.)
            </p>
          </div>

          <div className="space-y-3">
            {categoryList.map((cat) => (
              <div key={cat.name} className="space-y-1">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-800">{cat.name}</span>
                  <span className="text-slate-600 font-mono">
                    {formatNaira(cat.amount)} ({cat.percentage}%)
                  </span>
                </div>
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-600 h-full rounded-full transition-all duration-500"
                    style={{ width: `${cat.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
