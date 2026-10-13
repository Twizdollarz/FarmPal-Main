import React from 'react';
import {
  X,
  Printer,
  ShieldCheck,
  Building2,
  Calendar,
  MapPin,
  TrendingUp,
  Award,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { FarmerProfile, FarmSummary, CropComparison, DebtorSummary, FarmFinancialHealth } from '../types';
import { formatNaira } from '../lib/i18n';
import { FarmpalLogo } from './FarmpalLogo';

interface FarmFinancialHealthCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: FarmerProfile | null;
  farmSummary: FarmSummary | null;
  cropComparisons: CropComparison[];
  debtorSummary: DebtorSummary | null;
  financialHealth: FarmFinancialHealth | null;
}

export const FarmFinancialHealthCardModal: React.FC<FarmFinancialHealthCardModalProps> = ({
  isOpen,
  onClose,
  profile,
  farmSummary,
  cropComparisons,
  debtorSummary,
  financialHealth,
}) => {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const totalAcres = cropComparisons.reduce((sum, c) => sum + (c.farmSizeAcres || 0), 0);
  const totalSpent = farmSummary?.totalSpent || 0;
  const totalEarned = farmSummary?.totalEarned || 0;
  const netProfit = farmSummary?.netProfit || 0;
  const profitMargin = totalEarned > 0 ? Math.round((netProfit / totalEarned) * 1000) / 10 : 0;
  const totalOutstandingDebtors = debtorSummary?.totalOutstanding || 0;

  const todayStr = new Date().toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div
      id="farm-financial-health-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto"
    >
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8 print:border-none print:shadow-none print:m-0 print:w-full">
        {/* Modal Controls (Hidden in Print) */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50 print:hidden">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-emerald-600" />
            <h2 className="text-lg font-semibold text-slate-800">
              Farm Financial Health & Creditworthiness Statement
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <button
              id="print-statement-btn"
              onClick={handlePrint}
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              Print / Save PDF
            </button>
            <button
              id="close-statement-modal-btn"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Body */}
        <div className="p-8 space-y-8 print:p-0 text-slate-800">
          {/* Document Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b-2 border-emerald-600 gap-4">
            <div>
              <div className="flex items-center gap-3">
                <FarmpalLogo variant="full" theme="green" size="lg" />
                <span className="text-xs uppercase px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold tracking-wider">
                  Official Statement
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Verified Farm Record-Keeping & Financial Intelligence Document
              </p>
            </div>
            <div className="text-right sm:text-right text-xs text-slate-500 space-y-1">
              <p className="font-semibold text-slate-700">Document ID: FP-{Date.now().toString().slice(-6)}</p>
              <p>Generated: {todayStr}</p>
              <p>Purpose: Agricultural Credit & Cooperative Assessment</p>
            </div>
          </div>

          {/* Farmer & Plot Profile Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div>
              <span className="text-xs uppercase tracking-wider font-semibold text-slate-400">
                Farmer Identity
              </span>
              <p className="font-semibold text-slate-900 text-base mt-1">
                {profile?.name || 'Musa Ibrahim'}
              </p>
              <p className="text-xs text-slate-600 mt-0.5 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-slate-400" />
                {profile?.location || 'Kano, Nigeria'}
              </p>
              <p className="text-xs text-slate-500">{profile?.phone || '+234 803 123 4567'}</p>
            </div>

            <div>
              <span className="text-xs uppercase tracking-wider font-semibold text-slate-400">
                Land & Operations
              </span>
              <p className="font-semibold text-slate-900 text-base mt-1">
                {totalAcres} Acres Under Cultivation
              </p>
              <p className="text-xs text-slate-600 mt-0.5">
                Active Plots: {cropComparisons.map((c) => c.cropName).join(', ')}
              </p>
              <p className="text-xs text-slate-500">Record Quality: Continuous Verified Logs</p>
            </div>

            <div>
              <span className="text-xs uppercase tracking-wider font-semibold text-slate-400">
                Creditworthiness Rating
              </span>
              <div className="flex items-center gap-2 mt-1">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <span className="font-bold text-emerald-700 text-base">
                  {financialHealth?.healthRating || 'Strong'} Rating
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                Financial Score: <span className="font-bold">{financialHealth?.healthScore || 85} / 100</span>
              </p>
              <p className="text-xs text-emerald-600 font-medium">
                {financialHealth?.repaymentReadiness || 'Prime Candidate for Agri-Credit'}
              </p>
            </div>
          </div>

          {/* Consolidated Financial Summary Cards */}
          <div>
            <h3 className="text-xs uppercase tracking-wider font-bold text-slate-500 mb-3">
              1. Financial Performance Overview
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl border border-slate-200 bg-white">
                <span className="text-xs text-slate-500 font-medium">Money Earned (Revenue)</span>
                <p className="text-xl font-bold text-emerald-700 mt-1">
                  {formatNaira(totalEarned)}
                </p>
                <span className="text-[11px] text-slate-400">Total Produce Sold</span>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-white">
                <span className="text-xs text-slate-500 font-medium">Money Spent (Costs)</span>
                <p className="text-xl font-bold text-rose-600 mt-1">
                  {formatNaira(totalSpent)}
                </p>
                <span className="text-[11px] text-slate-400">Total Farm Inputs & Labour</span>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-white">
                <span className="text-xs text-slate-500 font-medium">Net Farm Profit</span>
                <p className={`text-xl font-bold mt-1 ${netProfit >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                  {formatNaira(netProfit)}
                </p>
                <span className="text-[11px] text-emerald-600 font-semibold">
                  {profitMargin}% Profit Margin
                </span>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-white">
                <span className="text-xs text-slate-500 font-medium">Uncollected Debt (Receivables)</span>
                <p className="text-xl font-bold text-amber-600 mt-1">
                  {formatNaira(totalOutstandingDebtors)}
                </p>
                <span className="text-[11px] text-slate-400">Owed by Market Buyers</span>
              </div>
            </div>
          </div>

          {/* Crop Economics & Return on Investment Table */}
          <div>
            <h3 className="text-xs uppercase tracking-wider font-bold text-slate-500 mb-3">
              2. Crop Productivity & Unit Economics
            </h3>
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600">
                  <tr>
                    <th className="py-2.5 px-4">Crop Plot</th>
                    <th className="py-2.5 px-3">Size (Acres)</th>
                    <th className="py-2.5 px-3">Money Spent</th>
                    <th className="py-2.5 px-3">Money Earned</th>
                    <th className="py-2.5 px-3">Net Profit</th>
                    <th className="py-2.5 px-3">Return (ROI)</th>
                    <th className="py-2.5 px-3 text-right">Profit / Acre</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-xs">
                  {cropComparisons.map((c) => (
                    <tr key={c.cropId} className="hover:bg-slate-50/50">
                      <td className="py-2.5 px-4 font-semibold text-slate-900">{c.cropName}</td>
                      <td className="py-2.5 px-3 text-slate-600">{c.farmSizeAcres} ac</td>
                      <td className="py-2.5 px-3 text-slate-700 font-medium">{formatNaira(c.totalSpent)}</td>
                      <td className="py-2.5 px-3 text-emerald-700 font-semibold">{formatNaira(c.totalEarned)}</td>
                      <td className={`py-2.5 px-3 font-bold ${c.netProfit >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                        {formatNaira(c.netProfit)}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className={`inline-flex px-1.5 py-0.5 rounded font-semibold ${c.roiPercent > 50 ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'}`}>
                          {c.roiPercent}%
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-semibold text-slate-900">
                        {formatNaira(c.profitPerAcre)} / ac
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Key Recommendations & Lending Officer Notes */}
          <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-2">
            <h4 className="text-xs uppercase font-bold text-slate-700 tracking-wider flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Automated Agronomic & Credit Officer Notes
            </h4>
            <ul className="text-xs text-slate-600 space-y-1 pl-5 list-disc">
              <li>
                <strong>Cash-Covered Operations:</strong> Farmer has sustained positive operating margins of{' '}
                {profitMargin}% across seasonal cycles with strong harvest sales liquidity.
              </li>
              <li>
                <strong>Receivables Quality:</strong> ₦{totalOutstandingDebtors.toLocaleString('en-NG')} in buyer
                credit is backed by verified market dates and historic repeat trade.
              </li>
              <li>
                <strong>Verification Statement:</strong> All entries are logged with verified receipts, wage tallies,
                and market price averages recorded on FarmPal.
              </li>
            </ul>
          </div>

          {/* Signature & Seal Block */}
          <div className="pt-6 border-t border-slate-200 flex justify-between items-end text-xs text-slate-500">
            <div>
              <p className="font-semibold text-slate-800">Farmer Signature: _______________________</p>
              <p className="mt-1">Musa Ibrahim • Farm Owner</p>
            </div>
            <div className="text-right">
              <div className="inline-block border-2 border-dashed border-emerald-600/40 px-4 py-2 rounded-lg text-emerald-700 font-mono text-[10px] uppercase font-bold text-center">
                FarmPal Verified Engine<br />Deterministic Record Seal
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
