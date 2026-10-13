import React, { useState } from 'react';
import {
  Users,
  AlertCircle,
  CheckCircle2,
  Clock,
  Search,
  ArrowDownLeft,
  ChevronRight,
  DollarSign,
  Phone,
  Check,
} from 'lucide-react';
import { DebtorSummary, DebtorRecord, SaleRecord } from '../types';
import { formatNaira } from '../lib/i18n';

interface DebtorsTrackerProps {
  debtorSummary: DebtorSummary | null;
  onCollectPayment: (saleId: string, amount: number, notes?: string) => Promise<void>;
  onRefresh: () => void;
}

export const DebtorsTracker: React.FC<DebtorsTrackerProps> = ({
  debtorSummary,
  onCollectPayment,
  onRefresh,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDebtor, setSelectedDebtor] = useState<DebtorRecord | null>(null);
  const [activePaymentSale, setActivePaymentSale] = useState<SaleRecord | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<string>('');
  const [paymentNotes, setPaymentNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const debtors = debtorSummary?.debtors || [];
  const filteredDebtors = debtors.filter((d) =>
    d.buyerName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenPayment = (sale: SaleRecord) => {
    setActivePaymentSale(sale);
    setPaymentAmount(sale.amountDue ? sale.amountDue.toString() : '');
    setPaymentNotes('Cash received from buyer');
  };

  const handleSavePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePaymentSale) return;
    const amt = Number(paymentAmount);
    if (!amt || amt <= 0) return;

    try {
      setIsSubmitting(true);
      await onCollectPayment(activePaymentSale.id, amt, paymentNotes);
      setSuccessMessage(`Recorded payment of ${formatNaira(amt)}!`);
      setTimeout(() => setSuccessMessage(null), 3500);
      setActivePaymentSale(null);
      setPaymentAmount('');
      onRefresh();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-center gap-2 text-sm font-medium animate-fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          {successMessage}
        </div>
      )}

      {/* Header & Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Total Money Owed to You
            </span>
            <span className="p-2 bg-amber-50 text-amber-600 rounded-xl">
              <AlertCircle className="w-5 h-5" />
            </span>
          </div>
          <p className="text-2xl font-bold text-amber-700 mt-2">
            {formatNaira(debtorSummary?.totalOutstanding || 0)}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Across {debtors.length} buyer{debtors.length === 1 ? '' : 's'} with unpaid produce
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Total Credit Extended
            </span>
            <span className="p-2 bg-slate-50 text-slate-600 rounded-xl">
              <DollarSign className="w-5 h-5" />
            </span>
          </div>
          <p className="text-2xl font-bold text-slate-800 mt-2">
            {formatNaira(debtorSummary?.totalCreditExtended || 0)}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Total value of crops supplied on credit
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Total Recovered / Paid
            </span>
            <span className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <CheckCircle2 className="w-5 h-5" />
            </span>
          </div>
          <p className="text-2xl font-bold text-emerald-700 mt-2">
            {formatNaira(debtorSummary?.totalCollected || 0)}
          </p>
          <p className="text-xs text-emerald-600 font-medium mt-1">
            {debtorSummary?.totalCreditExtended && debtorSummary.totalCreditExtended > 0
              ? `${Math.round((debtorSummary.totalCollected / debtorSummary.totalCreditExtended) * 100)}% recovery rate`
              : 'All cleared'}
          </p>
        </div>
      </div>

      {/* Search & Debtors List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Debtors & Market Buyers Ledger
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Track buyers who took crates or bags on credit and record collections
            </p>
          </div>
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search buyer name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
            />
          </div>
        </div>

        {filteredDebtors.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3 opacity-80" />
            <p className="text-base font-semibold text-slate-800">No Outstanding Debts</p>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              All buyers have fully paid for their produce! When you record a sale on credit, it will automatically appear here.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredDebtors.map((debtor) => (
              <div
                key={debtor.buyerName}
                className="p-5 hover:bg-slate-50/70 transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-sm shrink-0">
                      {debtor.buyerName.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-slate-900 text-sm">{debtor.buyerName}</h4>
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                          {debtor.unpaidSalesCount} unpaid batch{debtor.unpaidSalesCount === 1 ? '' : 'es'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Latest supply: {debtor.latestSaleDate} • Total bought:{' '}
                        {formatNaira(debtor.totalCreditSales)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 sm:text-right">
                    <div>
                      <span className="text-xs text-slate-400 font-medium">Balance Owed</span>
                      <p className="text-lg font-bold text-amber-700">
                        {formatNaira(debtor.totalOutstanding)}
                      </p>
                    </div>

                    <button
                      id={`view-debtor-${debtor.buyerName.replace(/\s+/g, '-').toLowerCase()}`}
                      onClick={() =>
                        setSelectedDebtor(
                          selectedDebtor?.buyerName === debtor.buyerName ? null : debtor
                        )
                      }
                      className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                    >
                      {selectedDebtor?.buyerName === debtor.buyerName ? 'Hide Details' : 'View Batches'}
                    </button>
                  </div>
                </div>

                {/* Expanded Batches for this Buyer */}
                {selectedDebtor?.buyerName === debtor.buyerName && (
                  <div className="mt-4 pt-4 border-t border-slate-100 space-y-3 bg-slate-50/50 p-3 rounded-xl">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Unpaid Produce Batches
                    </span>
                    <div className="space-y-2">
                      {debtor.sales.map((sale) => (
                        <div
                          key={sale.id}
                          className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-white rounded-xl border border-slate-200 text-xs gap-3"
                        >
                          <div>
                            <span className="font-semibold text-slate-800">
                              {sale.quantitySold} {sale.unit} of {sale.cropName}
                            </span>
                            <span className="text-slate-400 ml-2">(@ {formatNaira(sale.pricePerUnit)}/{sale.unit})</span>
                            <p className="text-slate-500 text-[11px] mt-0.5">
                              Supplied: {sale.saleDate} • Total: {formatNaira(sale.totalRevenue)}
                              {sale.amountPaid > 0 && ` (Paid ₦${sale.amountPaid.toLocaleString()} deposit)`}
                            </p>
                            {sale.notes && (
                              <p className="text-slate-400 text-[11px] italic mt-0.5">"{sale.notes}"</p>
                            )}
                          </div>

                          <div className="flex items-center gap-3 justify-between sm:justify-end">
                            <div className="text-right">
                              <span className="text-[11px] text-slate-400">Still Owed:</span>
                              <p className="font-bold text-amber-700 text-sm">
                                {formatNaira(sale.amountDue || sale.totalRevenue)}
                              </p>
                            </div>
                            <button
                              id={`collect-btn-${sale.id}`}
                              onClick={() => handleOpenPayment(sale)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg shadow-xs transition-colors cursor-pointer"
                            >
                              <ArrowDownLeft className="w-3.5 h-3.5" />
                              Record Payment
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Record Payment Modal */}
      {activePaymentSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-slate-200 p-6 space-y-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Record Debt Payment</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Collecting money from {activePaymentSale.buyerName || 'Buyer'} for {activePaymentSale.quantitySold}{' '}
                {activePaymentSale.unit} of {activePaymentSale.cropName}
              </p>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
              <div className="flex justify-between text-slate-600">
                <span>Total Sale Value:</span>
                <span className="font-semibold">{formatNaira(activePaymentSale.totalRevenue)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Already Paid:</span>
                <span className="font-semibold">{formatNaira(activePaymentSale.amountPaid || 0)}</span>
              </div>
              <div className="flex justify-between text-amber-800 font-bold border-t border-slate-200 pt-1">
                <span>Current Amount Due:</span>
                <span>{formatNaira(activePaymentSale.amountDue || activePaymentSale.totalRevenue)}</span>
              </div>
            </div>

            <form onSubmit={handleSavePayment} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Amount Collected (₦)
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  max={activePaymentSale.amountDue || activePaymentSale.totalRevenue}
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder="e.g. 50000"
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Payment Note (Optional)
                </label>
                <input
                  type="text"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  placeholder="e.g. Cash collected at Mile 12 market"
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setActivePaymentSale(null)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 text-xs font-medium bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'Recording...' : 'Confirm Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
