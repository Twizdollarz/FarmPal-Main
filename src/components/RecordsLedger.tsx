import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Trash2,
  Calendar,
  Layers,
  TrendingDown,
  TrendingUp,
  Package,
  Users,
  AlertCircle,
  Download,
} from 'lucide-react';
import { Crop, Expense, SaleRecord, HarvestRecord, LabourRecord } from '../types';
import { formatNaira } from '../lib/i18n';

interface RecordsLedgerProps {
  crops: Crop[];
  expenses: Expense[];
  sales: SaleRecord[];
  harvests: HarvestRecord[];
  labourRecords: LabourRecord[];
  onDeleteExpense: (id: string) => Promise<void>;
  onOpenQuickEntry: (type: 'expense' | 'sale' | 'harvest' | 'labour') => void;
}

export const RecordsLedger: React.FC<RecordsLedgerProps> = ({
  crops,
  expenses,
  sales,
  harvests,
  labourRecords,
  onDeleteExpense,
  onOpenQuickEntry,
}) => {
  const [activeTab, setActiveTab] = useState<'expenses' | 'sales' | 'harvest' | 'labour'>('expenses');
  const [selectedCropFilter, setSelectedCropFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const queryLower = searchQuery.toLowerCase().trim();

  // Filter expenses
  const filteredExpenses = useMemo(() => {
    return expenses.filter((exp) => {
      const matchesCrop =
        selectedCropFilter === 'all' || exp.allocations.some((a) => a.cropId === selectedCropFilter);
      const matchesSearch =
        !queryLower ||
        exp.categoryName.toLowerCase().includes(queryLower) ||
        (exp.description && exp.description.toLowerCase().includes(queryLower)) ||
        exp.expenseDate.includes(queryLower);
      return matchesCrop && matchesSearch;
    });
  }, [expenses, selectedCropFilter, queryLower]);

  // Filter sales
  const filteredSales = useMemo(() => {
    return sales.filter((s) => {
      const matchesCrop = selectedCropFilter === 'all' || s.cropId === selectedCropFilter;
      const matchesSearch =
        !queryLower ||
        s.cropName.toLowerCase().includes(queryLower) ||
        (s.buyerName && s.buyerName.toLowerCase().includes(queryLower)) ||
        s.saleDate.includes(queryLower);
      return matchesCrop && matchesSearch;
    });
  }, [sales, selectedCropFilter, queryLower]);

  // Filter harvests
  const filteredHarvests = useMemo(() => {
    return harvests.filter((h) => {
      const matchesCrop = selectedCropFilter === 'all' || h.cropId === selectedCropFilter;
      const matchesSearch =
        !queryLower ||
        h.cropName.toLowerCase().includes(queryLower) ||
        h.harvestDate.includes(queryLower);
      return matchesCrop && matchesSearch;
    });
  }, [harvests, selectedCropFilter, queryLower]);

  // Filter labour
  const filteredLabour = useMemo(() => {
    return labourRecords.filter((l) => {
      const matchesCrop = selectedCropFilter === 'all' || l.cropId === selectedCropFilter;
      const matchesSearch =
        !queryLower ||
        l.cropName.toLowerCase().includes(queryLower) ||
        l.workType.toLowerCase().includes(queryLower) ||
        l.labourDate.includes(queryLower);
      return matchesCrop && matchesSearch;
    });
  }, [labourRecords, selectedCropFilter, queryLower]);

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete this ${name} entry?`)) {
      await onDeleteExpense(id);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-stone-900 tracking-tight">Farm Record Books</h2>
          <p className="text-xs text-stone-500">
            Every transaction retains its exact date and details. Nothing is lost.
          </p>
        </div>

        {/* Filter bar: Crop picker & Search */}
        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={selectedCropFilter}
            onChange={(e) => setSelectedCropFilter(e.target.value)}
            className="p-2 text-xs bg-white border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          >
            <option value="all">All Crops</option>
            {crops.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search records..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs bg-white border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none w-44"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <a
              href={`/api/export/csv/${activeTab === 'sales' ? 'sales' : 'expenses'}`}
              download
              className="flex items-center gap-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 px-3 py-1.5 rounded-xl text-xs font-semibold border border-stone-200 transition-colors"
              title="Download CSV report for co-operative, bank, or extension worker"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </a>

            <button
              onClick={() => onOpenQuickEntry(activeTab === 'expenses' ? 'expense' : activeTab === 'sales' ? 'sale' : activeTab === 'harvest' ? 'harvest' : 'labour')}
              className="bg-emerald-700 hover:bg-emerald-600 text-white px-3.5 py-1.5 rounded-xl text-xs font-semibold shadow-2xs cursor-pointer"
            >
              + Add Record
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl border border-stone-200 self-start text-xs font-semibold">
        <button
          onClick={() => setActiveTab('expenses')}
          className={`px-4 py-2 rounded-lg transition-all ${
            activeTab === 'expenses'
              ? 'bg-white text-rose-700 shadow-2xs'
              : 'text-stone-600 hover:text-stone-900'
          }`}
        >
          Money Spent ({filteredExpenses.length})
        </button>
        <button
          onClick={() => setActiveTab('sales')}
          className={`px-4 py-2 rounded-lg transition-all ${
            activeTab === 'sales'
              ? 'bg-white text-emerald-700 shadow-2xs'
              : 'text-stone-600 hover:text-stone-900'
          }`}
        >
          Money Earned ({filteredSales.length})
        </button>
        <button
          onClick={() => setActiveTab('harvest')}
          className={`px-4 py-2 rounded-lg transition-all ${
            activeTab === 'harvest'
              ? 'bg-white text-stone-900 shadow-2xs'
              : 'text-stone-600 hover:text-stone-900'
          }`}
        >
          Harvest ({filteredHarvests.length})
        </button>
        <button
          onClick={() => setActiveTab('labour')}
          className={`px-4 py-2 rounded-lg transition-all ${
            activeTab === 'labour'
              ? 'bg-white text-amber-800 shadow-2xs'
              : 'text-stone-600 hover:text-stone-900'
          }`}
        >
          Labour ({filteredLabour.length})
        </button>
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-2xs overflow-hidden">
        {/* TAB 1: EXPENSES */}
        {activeTab === 'expenses' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 text-stone-600 font-semibold border-b border-stone-200">
                <tr>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Applies To</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4">Source</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                  <th className="py-3 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredExpenses.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-stone-400">
                      No expense records found.
                    </td>
                  </tr>
                ) : (
                  filteredExpenses.map((exp) => (
                    <tr key={exp.id} className="hover:bg-stone-50/70 transition-colors">
                      <td className="py-3 px-4 font-medium text-stone-700 whitespace-nowrap">
                        {exp.expenseDate}
                      </td>
                      <td className="py-3 px-4 font-semibold text-stone-900">
                        {exp.categoryName}
                      </td>
                      <td className="py-3 px-4">
                        {exp.isShared ? (
                          <div className="flex flex-col gap-0.5">
                            <span className="inline-flex items-center gap-1 text-[10px] bg-sky-100 text-sky-800 px-1.5 py-0.5 rounded font-semibold w-fit">
                              Shared ({exp.allocations.length} crops)
                            </span>
                            <span className="text-[11px] text-stone-500">
                              {exp.allocations.map((a) => `${a.cropName} (${a.percentage}%)`).join(', ')}
                            </span>
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] bg-stone-100 text-stone-700 px-2 py-0.5 rounded font-medium">
                            {exp.allocations[0]?.cropName || 'General'}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-stone-500 max-w-xs truncate">
                        {exp.description || '—'}
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-[10px] uppercase font-semibold text-stone-400 bg-stone-100 px-1.5 py-0.5 rounded">
                          {exp.source}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-stone-900">
                        {formatNaira(exp.totalAmount)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => handleDelete(exp.id, exp.categoryName)}
                          className="p-1 text-stone-400 hover:text-rose-600 transition-colors"
                          title="Delete expense"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB 2: SALES */}
        {activeTab === 'sales' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 text-stone-600 font-semibold border-b border-stone-200">
                <tr>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Crop</th>
                  <th className="py-3 px-4">Quantity</th>
                  <th className="py-3 px-4">Price / Unit</th>
                  <th className="py-3 px-4">Buyer & Notes</th>
                  <th className="py-3 px-4 text-right">Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredSales.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-stone-400">
                      No sales recorded yet.
                    </td>
                  </tr>
                ) : (
                  filteredSales.map((s) => (
                    <tr key={s.id} className="hover:bg-stone-50/70 transition-colors">
                      <td className="py-3 px-4 font-medium text-stone-700 whitespace-nowrap">
                        {s.saleDate}
                      </td>
                      <td className="py-3 px-4 font-semibold text-stone-900">{s.cropName}</td>
                      <td className="py-3 px-4">
                        {s.quantitySold} {s.unit}
                      </td>
                      <td className="py-3 px-4 font-medium text-stone-700">
                        {formatNaira(s.pricePerUnit)} / {s.unit}
                      </td>
                      <td className="py-3 px-4 text-stone-500">
                        {s.buyerName || 'Local market'} {s.notes ? `• ${s.notes}` : ''}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-emerald-600">
                        +{formatNaira(s.totalRevenue)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB 3: HARVEST */}
        {activeTab === 'harvest' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 text-stone-600 font-semibold border-b border-stone-200">
                <tr>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Crop</th>
                  <th className="py-3 px-4">Quantity Harvested</th>
                  <th className="py-3 px-4">Quality / Grade</th>
                  <th className="py-3 px-4">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredHarvests.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-stone-400">
                      No harvest records found.
                    </td>
                  </tr>
                ) : (
                  filteredHarvests.map((h) => (
                    <tr key={h.id} className="hover:bg-stone-50/70 transition-colors">
                      <td className="py-3 px-4 font-medium text-stone-700 whitespace-nowrap">
                        {h.harvestDate}
                      </td>
                      <td className="py-3 px-4 font-semibold text-stone-900">{h.cropName}</td>
                      <td className="py-3 px-4 font-bold text-stone-900">
                        {h.quantity} {h.unit}
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-[10px] bg-emerald-50 text-emerald-800 font-medium px-2 py-0.5 rounded">
                          {h.qualityGrade || 'Standard'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-stone-500">{h.notes || '—'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB 4: LABOUR */}
        {activeTab === 'labour' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 text-stone-600 font-semibold border-b border-stone-200">
                <tr>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Crop</th>
                  <th className="py-3 px-4">Work Done</th>
                  <th className="py-3 px-4">Workers</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4 text-right">Amount Paid</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredLabour.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-stone-400">
                      No labour records found.
                    </td>
                  </tr>
                ) : (
                  filteredLabour.map((l) => (
                    <tr key={l.id} className="hover:bg-stone-50/70 transition-colors">
                      <td className="py-3 px-4 font-medium text-stone-700 whitespace-nowrap">
                        {l.labourDate}
                      </td>
                      <td className="py-3 px-4 font-semibold text-stone-900">{l.cropName}</td>
                      <td className="py-3 px-4 font-medium text-stone-800">{l.workType}</td>
                      <td className="py-3 px-4">
                        <span className="bg-stone-100 text-stone-700 px-2 py-0.5 rounded font-medium">
                          {l.workerCount} workers
                        </span>
                      </td>
                      <td className="py-3 px-4 text-stone-500">{l.description || '—'}</td>
                      <td className="py-3 px-4 text-right font-bold text-stone-900">
                        {formatNaira(l.amountPaid)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
