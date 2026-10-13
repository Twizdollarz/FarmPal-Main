import React, { useState } from 'react';
import { X, Check, Calculator, Users, PlusCircle, Split } from 'lucide-react';
import { Crop, ExpenseCategory } from '../types';
import { formatNaira } from '../lib/i18n';

interface QuickEntryModalProps {
  initialType: 'expense' | 'harvest' | 'sale' | 'labour';
  initialCropId?: string;
  crops: Crop[];
  categories: ExpenseCategory[];
  onClose: () => void;
  onSaveExpense: (data: any) => Promise<void>;
  onSaveSale: (data: any) => Promise<void>;
  onSaveHarvest: (data: any) => Promise<void>;
  onSaveLabour: (data: any) => Promise<void>;
}

export const QuickEntryModal: React.FC<QuickEntryModalProps> = ({
  initialType,
  initialCropId,
  crops,
  categories,
  onClose,
  onSaveExpense,
  onSaveSale,
  onSaveHarvest,
  onSaveLabour,
}) => {
  const [entryType, setEntryType] = useState<'expense' | 'sale' | 'harvest' | 'labour'>(initialType);
  const activeCrops = crops.filter((c) => c.status === 'active');
  const defaultCropId = initialCropId || (activeCrops[0]?.id || crops[0]?.id || '');

  const todayStr = new Date().toISOString().split('T')[0];

  // Expense form state
  const [selectedCropId, setSelectedCropId] = useState<string>(defaultCropId);
  const [isSharedExpense, setIsSharedExpense] = useState<boolean>(false);
  const [selectedSharedCropIds, setSelectedSharedCropIds] = useState<string[]>(
    activeCrops.slice(0, 2).map((c) => c.id)
  );
  const [sharedPercentages, setSharedPercentages] = useState<Record<string, number>>({});
  const [expenseAmount, setExpenseAmount] = useState<string>('');
  const [expenseDate, setExpenseDate] = useState<string>(todayStr);
  const [categoryId, setCategoryId] = useState<string>('cat-fertilizer');
  const [customCategory, setCustomCategory] = useState<string>('');
  const [expenseDescription, setExpenseDescription] = useState<string>('');

  // Sale form state
  const [saleCropId, setSaleCropId] = useState<string>(defaultCropId);
  const [saleDate, setSaleDate] = useState<string>(todayStr);
  const [saleQuantity, setSaleQuantity] = useState<string>('');
  const [saleUnit, setSaleUnit] = useState<string>('crates');
  const [customSaleUnit, setCustomSaleUnit] = useState<string>('');
  const [salePricePerUnit, setSalePricePerUnit] = useState<string>('');
  const [saleBuyer, setSaleBuyer] = useState<string>('');
  const [saleNotes, setSaleNotes] = useState<string>('');

  // Harvest form state
  const [harvestCropId, setHarvestCropId] = useState<string>(defaultCropId);
  const [harvestDate, setHarvestDate] = useState<string>(todayStr);
  const [harvestQuantity, setHarvestQuantity] = useState<string>('');
  const [harvestUnit, setHarvestUnit] = useState<string>('crates');
  const [harvestGrade, setHarvestGrade] = useState<string>('Grade A');
  const [harvestNotes, setHarvestNotes] = useState<string>('');

  // Labour form state
  const [labourCropId, setLabourCropId] = useState<string>(defaultCropId);
  const [labourDate, setLabourDate] = useState<string>(todayStr);
  const [labourWorkType, setLabourWorkType] = useState<string>('Weeding');
  const [labourWorkerCount, setLabourWorkerCount] = useState<string>('5');
  const [labourAmountPaid, setLabourAmountPaid] = useState<string>('');
  const [labourDescription, setLabourDescription] = useState<string>('');

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Standard units
  const standardUnits = ['crates', 'bags', 'kg', 'tonnes', 'basket', 'bunch', 'pieces', 'other'];

  // Toggle shared crop selection
  const handleToggleSharedCrop = (cropId: string) => {
    if (selectedSharedCropIds.includes(cropId)) {
      if (selectedSharedCropIds.length <= 1) return; // Keep at least 1
      setSelectedSharedCropIds(selectedSharedCropIds.filter((id) => id !== cropId));
    } else {
      setSelectedSharedCropIds([...selectedSharedCropIds, cropId]);
    }
  };

  // Submit Expense
  const handleExpenseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const amount = Number(expenseAmount);
    if (!amount || amount <= 0) {
      setFormError('Please enter a valid expense amount');
      return;
    }

    let catName = categories.find((c) => c.id === categoryId)?.name || 'Other';
    if (categoryId === 'cat-custom') {
      if (!customCategory.trim()) {
        setFormError('Please enter a category name');
        return;
      }
      catName = customCategory.trim();
    }

    setIsSubmitting(true);
    try {
      if (isSharedExpense) {
        // Build allocations reconciling to exact amount
        const count = selectedSharedCropIds.length;
        const defaultPct = Math.round((100 / count) * 10) / 10;

        let runningTotal = 0;
        const allocations = selectedSharedCropIds.map((cid, idx) => {
          const crop = crops.find((c) => c.id === cid);
          const pct = sharedPercentages[cid] !== undefined ? sharedPercentages[cid] : defaultPct;
          let allocAmount = Math.round((pct / 100) * amount);
          if (idx === count - 1) {
            allocAmount = amount - runningTotal; // Exact reconciliation!
          } else {
            runningTotal += allocAmount;
          }
          return {
            cropId: cid,
            cropName: crop?.name || 'Crop',
            percentage: pct,
            allocatedAmount: allocAmount,
          };
        });

        await onSaveExpense({
          categoryId,
          categoryName: catName,
          totalAmount: amount,
          expenseDate,
          description: expenseDescription,
          isShared: true,
          allocations,
        });
      } else {
        const crop = crops.find((c) => c.id === selectedCropId);
        await onSaveExpense({
          categoryId,
          categoryName: catName,
          totalAmount: amount,
          expenseDate,
          description: expenseDescription,
          isShared: false,
          allocations: [
            {
              cropId: selectedCropId,
              cropName: crop?.name || 'Crop',
              percentage: 100,
              allocatedAmount: amount,
            },
          ],
        });
      }
      onClose();
    } catch (err: any) {
      setFormError(err.message || 'Failed to save expense');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit Sale
  const handleSaleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const qty = Number(saleQuantity);
    const price = Number(salePricePerUnit);
    if (!qty || qty <= 0 || !price || price <= 0) {
      setFormError('Please enter valid quantity and selling price');
      return;
    }
    const crop = crops.find((c) => c.id === saleCropId);
    const finalUnit = saleUnit === 'other' ? customSaleUnit || 'units' : saleUnit;

    setIsSubmitting(true);
    try {
      await onSaveSale({
        cropId: saleCropId,
        cropName: crop?.name || 'Crop',
        saleDate,
        quantitySold: qty,
        unit: finalUnit,
        pricePerUnit: price,
        buyerName: saleBuyer,
        notes: saleNotes,
      });
      onClose();
    } catch (err: any) {
      setFormError(err.message || 'Failed to save sale');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit Harvest
  const handleHarvestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const qty = Number(harvestQuantity);
    if (!qty || qty <= 0) {
      setFormError('Please enter a valid harvest quantity');
      return;
    }
    const crop = crops.find((c) => c.id === harvestCropId);

    setIsSubmitting(true);
    try {
      await onSaveHarvest({
        cropId: harvestCropId,
        cropName: crop?.name || 'Crop',
        harvestDate,
        quantity: qty,
        unit: harvestUnit,
        qualityGrade: harvestGrade,
        notes: harvestNotes,
      });
      onClose();
    } catch (err: any) {
      setFormError(err.message || 'Failed to save harvest');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit Labour
  const handleLabourSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const amt = Number(labourAmountPaid);
    if (!amt || amt <= 0) {
      setFormError('Please enter amount paid for labour');
      return;
    }
    const crop = crops.find((c) => c.id === labourCropId);

    setIsSubmitting(true);
    try {
      await onSaveLabour({
        cropId: labourCropId,
        cropName: crop?.name || 'Crop',
        labourDate,
        workType: labourWorkType,
        workerCount: Number(labourWorkerCount) || 1,
        amountPaid: amt,
        description: labourDescription || `${labourWorkerCount} workers for ${labourWorkType}`,
      });
      onClose();
    } catch (err: any) {
      setFormError(err.message || 'Failed to save labour');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white/95 backdrop-blur-2xl w-full max-w-lg rounded-3xl shadow-[0_24px_64px_rgba(0,0,0,0.18)] border border-black/[0.08] overflow-hidden my-auto">
        {/* Header with 4 Mode Switch Tabs */}
        <div className="px-6 pt-6 pb-2 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold tracking-tight text-[#1D1D1F]">Record Activity</h3>
            <p className="text-xs text-neutral-500">Track expense, sale, harvest or labour</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-500 hover:text-[#1D1D1F] rounded-full hover:bg-black/[0.06] transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 4 Mode Tabs (Apple Segmented Control) */}
        <div className="grid grid-cols-4 bg-[#E5E5EA]/70 backdrop-blur-md p-1 mx-6 my-2 rounded-2xl border border-black/[0.04] text-xs">
          <button
            type="button"
            onClick={() => setEntryType('expense')}
            className={`py-2 rounded-xl transition-all text-center cursor-pointer ${
              entryType === 'expense'
                ? 'bg-white text-[#FF3B30] shadow-[0_1px_3px_rgba(0,0,0,0.1),0_1px_2px_rgba(0,0,0,0.06)] font-semibold'
                : 'text-neutral-600 hover:text-[#1D1D1F] font-medium'
            }`}
          >
            Expense
          </button>
          <button
            type="button"
            onClick={() => setEntryType('sale')}
            className={`py-2 rounded-xl transition-all text-center cursor-pointer ${
              entryType === 'sale'
                ? 'bg-white text-[#34C759] shadow-[0_1px_3px_rgba(0,0,0,0.1),0_1px_2px_rgba(0,0,0,0.06)] font-semibold'
                : 'text-neutral-600 hover:text-[#1D1D1F] font-medium'
            }`}
          >
            Sale
          </button>
          <button
            type="button"
            onClick={() => setEntryType('harvest')}
            className={`py-2 rounded-xl transition-all text-center cursor-pointer ${
              entryType === 'harvest'
                ? 'bg-white text-[#1D1D1F] shadow-[0_1px_3px_rgba(0,0,0,0.1),0_1px_2px_rgba(0,0,0,0.06)] font-semibold'
                : 'text-neutral-600 hover:text-[#1D1D1F] font-medium'
            }`}
          >
            Harvest
          </button>
          <button
            type="button"
            onClick={() => setEntryType('labour')}
            className={`py-2 rounded-xl transition-all text-center cursor-pointer ${
              entryType === 'labour'
                ? 'bg-white text-amber-700 shadow-[0_1px_3px_rgba(0,0,0,0.1),0_1px_2px_rgba(0,0,0,0.06)] font-semibold'
                : 'text-neutral-600 hover:text-[#1D1D1F] font-medium'
            }`}
          >
            Labour
          </button>
        </div>

        {formError && (
          <div className="mx-6 mt-3 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-xs">
            {formError}
          </div>
        )}

        {/* Form Body */}
        <div className="p-6 pt-3">
          {/* ================= EXPENSE FORM ================= */}
          {entryType === 'expense' && (
            <form onSubmit={handleExpenseSubmit} className="space-y-4">
              {/* Single vs Shared Toggle */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-stone-700">Applies to:</label>
                  <button
                    type="button"
                    onClick={() => setIsSharedExpense(!isSharedExpense)}
                    className="text-xs text-emerald-700 hover:text-emerald-800 font-semibold flex items-center gap-1"
                  >
                    <Split className="w-3.5 h-3.5" />
                    <span>{isSharedExpense ? 'Switch to Single Crop' : 'Shared Expense (Multiple Crops)'}</span>
                  </button>
                </div>

                {!isSharedExpense ? (
                  <select
                    value={selectedCropId}
                    onChange={(e) => setSelectedCropId(e.target.value)}
                    className="w-full p-2.5 text-sm bg-stone-50 border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    {activeCrops.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.farmSizeAcres} acres)
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="bg-stone-50 p-3 rounded-xl border border-stone-200 space-y-2">
                    <p className="text-[11px] text-stone-500">
                      Select all crops this expense benefits (e.g. Fuel for generator pumping water):
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {activeCrops.map((c) => {
                        const isSelected = selectedSharedCropIds.includes(c.id);
                        return (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => handleToggleSharedCrop(c.id)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium border flex items-center gap-1.5 transition-colors ${
                              isSelected
                                ? 'bg-emerald-800 text-white border-emerald-800'
                                : 'bg-white text-stone-700 border-stone-300'
                            }`}
                          >
                            {isSelected && <Check className="w-3 h-3" />}
                            <span>{c.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* What did you spend on? (Category) */}
              <div>
                <label className="text-xs font-semibold text-stone-700 block mb-1.5">
                  What did you spend on?
                </label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full p-2.5 text-sm bg-stone-50 border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                  <option value="cat-custom">+ Add Custom Category...</option>
                </select>
                {categoryId === 'cat-custom' && (
                  <input
                    type="text"
                    placeholder="Enter custom category name (e.g. Trellising stakes)"
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                    className="w-full mt-2 p-2.5 text-sm bg-stone-50 border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                )}
              </div>

              {/* Amount & Date */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-stone-700 block mb-1.5">
                    Amount (₦)
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 40000"
                    value={expenseAmount}
                    onChange={(e) => setExpenseAmount(e.target.value)}
                    className="w-full p-2.5 text-sm bg-stone-50 border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-stone-700 block mb-1.5">
                    Date
                  </label>
                  <input
                    type="date"
                    value={expenseDate}
                    onChange={(e) => setExpenseDate(e.target.value)}
                    className="w-full p-2.5 text-sm bg-stone-50 border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    required
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="text-xs font-semibold text-stone-700 block mb-1.5">
                  Optional description
                </label>
                <input
                  type="text"
                  placeholder="e.g. 2 bags of NPK fertilizer from agro-dealer"
                  value={expenseDescription}
                  onChange={(e) => setExpenseDescription(e.target.value)}
                  className="w-full p-2.5 text-sm bg-stone-50 border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-semibold text-stone-600 hover:text-stone-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-emerald-700 hover:bg-emerald-600 text-white px-5 py-2.5 rounded-xl text-xs font-semibold shadow-sm transition-all"
                >
                  {isSubmitting ? 'Saving...' : 'Save Expense'}
                </button>
              </div>
            </form>
          )}

          {/* ================= SALE FORM ================= */}
          {entryType === 'sale' && (
            <form onSubmit={handleSaleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-stone-700 block mb-1.5">Crop Sold</label>
                <select
                  value={saleCropId}
                  onChange={(e) => setSaleCropId(e.target.value)}
                  className="w-full p-2.5 text-sm bg-stone-50 border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  {activeCrops.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-stone-700 block mb-1.5">
                    Quantity Sold
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 50"
                    value={saleQuantity}
                    onChange={(e) => setSaleQuantity(e.target.value)}
                    className="w-full p-2.5 text-sm bg-stone-50 border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-stone-700 block mb-1.5">Unit</label>
                  <select
                    value={saleUnit}
                    onChange={(e) => setSaleUnit(e.target.value)}
                    className="w-full p-2.5 text-sm bg-stone-50 border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    {standardUnits.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                  {saleUnit === 'other' && (
                    <input
                      type="text"
                      placeholder="Custom unit"
                      value={customSaleUnit}
                      onChange={(e) => setCustomSaleUnit(e.target.value)}
                      className="w-full mt-1.5 p-2 text-xs bg-stone-50 border border-stone-300 rounded-lg"
                    />
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-stone-700 block mb-1.5">
                    Price per {saleUnit} (₦)
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 8000"
                    value={salePricePerUnit}
                    onChange={(e) => setSalePricePerUnit(e.target.value)}
                    className="w-full p-2.5 text-sm bg-stone-50 border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-stone-700 block mb-1.5">Sale Date</label>
                  <input
                    type="date"
                    value={saleDate}
                    onChange={(e) => setSaleDate(e.target.value)}
                    className="w-full p-2.5 text-sm bg-stone-50 border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    required
                  />
                </div>
              </div>

              {/* Total revenue calculation preview */}
              {Number(saleQuantity) > 0 && Number(salePricePerUnit) > 0 && (
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-between text-xs">
                  <span className="text-emerald-800 font-medium">Calculated Revenue:</span>
                  <span className="text-sm font-bold text-emerald-800">
                    {formatNaira(Number(saleQuantity) * Number(salePricePerUnit))}
                  </span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-stone-700 block mb-1.5">
                    Buyer (optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Alhaji Danladi"
                    value={saleBuyer}
                    onChange={(e) => setSaleBuyer(e.target.value)}
                    className="w-full p-2.5 text-sm bg-stone-50 border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-stone-700 block mb-1.5">Notes</label>
                  <input
                    type="text"
                    placeholder="e.g. Cash payment received"
                    value={saleNotes}
                    onChange={(e) => setSaleNotes(e.target.value)}
                    className="w-full p-2.5 text-sm bg-stone-50 border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-semibold text-stone-600 hover:text-stone-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-emerald-700 hover:bg-emerald-600 text-white px-5 py-2.5 rounded-xl text-xs font-semibold shadow-sm transition-all"
                >
                  {isSubmitting ? 'Saving...' : 'Record Sale'}
                </button>
              </div>
            </form>
          )}

          {/* ================= HARVEST FORM ================= */}
          {entryType === 'harvest' && (
            <form onSubmit={handleHarvestSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-stone-700 block mb-1.5">Crop Harvested</label>
                <select
                  value={harvestCropId}
                  onChange={(e) => setHarvestCropId(e.target.value)}
                  className="w-full p-2.5 text-sm bg-stone-50 border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  {activeCrops.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-stone-700 block mb-1.5">
                    Quantity Harvested
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 65"
                    value={harvestQuantity}
                    onChange={(e) => setHarvestQuantity(e.target.value)}
                    className="w-full p-2.5 text-sm bg-stone-50 border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-stone-700 block mb-1.5">Unit</label>
                  <select
                    value={harvestUnit}
                    onChange={(e) => setHarvestUnit(e.target.value)}
                    className="w-full p-2.5 text-sm bg-stone-50 border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    {standardUnits.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-stone-700 block mb-1.5">Quality / Grade</label>
                  <select
                    value={harvestGrade}
                    onChange={(e) => setHarvestGrade(e.target.value)}
                    className="w-full p-2.5 text-sm bg-stone-50 border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    <option value="Grade A">Grade A (Premium)</option>
                    <option value="Standard">Standard / Market grade</option>
                    <option value="Rejects">Second grade / Rejects</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-stone-700 block mb-1.5">Date</label>
                  <input
                    type="date"
                    value={harvestDate}
                    onChange={(e) => setHarvestDate(e.target.value)}
                    className="w-full p-2.5 text-sm bg-stone-50 border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-stone-700 block mb-1.5">Notes</label>
                <input
                  type="text"
                  placeholder="e.g. Freshly picked, sorted into crates for tomorrow's market"
                  value={harvestNotes}
                  onChange={(e) => setHarvestNotes(e.target.value)}
                  className="w-full p-2.5 text-sm bg-stone-50 border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-semibold text-stone-600 hover:text-stone-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-emerald-700 hover:bg-emerald-600 text-white px-5 py-2.5 rounded-xl text-xs font-semibold shadow-sm transition-all"
                >
                  {isSubmitting ? 'Saving...' : 'Record Harvest'}
                </button>
              </div>
            </form>
          )}

          {/* ================= LABOUR FORM ================= */}
          {entryType === 'labour' && (
            <form onSubmit={handleLabourSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-stone-700 block mb-1.5">Crop</label>
                <select
                  value={labourCropId}
                  onChange={(e) => setLabourCropId(e.target.value)}
                  className="w-full p-2.5 text-sm bg-stone-50 border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  {activeCrops.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-stone-700 block mb-1.5">Work Done</label>
                  <select
                    value={labourWorkType}
                    onChange={(e) => setLabourWorkType(e.target.value)}
                    className="w-full p-2.5 text-sm bg-stone-50 border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    <option value="Weeding">Weeding</option>
                    <option value="Land clearing">Land clearing</option>
                    <option value="Ridging / Bed preparation">Ridging / Beds</option>
                    <option value="Transplanting">Transplanting</option>
                    <option value="Spraying chemicals/fertilizer">Spraying</option>
                    <option value="Staking / Trellising">Staking</option>
                    <option value="Harvesting labour">Harvesting labour</option>
                    <option value="General labour">General labour</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-stone-700 block mb-1.5">
                    Number of Workers
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 8"
                    value={labourWorkerCount}
                    onChange={(e) => setLabourWorkerCount(e.target.value)}
                    className="w-full p-2.5 text-sm bg-stone-50 border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-stone-700 block mb-1.5">
                    Total Paid (₦)
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 50000"
                    value={labourAmountPaid}
                    onChange={(e) => setLabourAmountPaid(e.target.value)}
                    className="w-full p-2.5 text-sm bg-stone-50 border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-stone-700 block mb-1.5">Date</label>
                  <input
                    type="date"
                    value={labourDate}
                    onChange={(e) => setLabourDate(e.target.value)}
                    className="w-full p-2.5 text-sm bg-stone-50 border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-stone-700 block mb-1.5">Description</label>
                <input
                  type="text"
                  placeholder="e.g. 8 workers weeded the tomato section"
                  value={labourDescription}
                  onChange={(e) => setLabourDescription(e.target.value)}
                  className="w-full p-2.5 text-sm bg-stone-50 border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <p className="text-[11px] text-stone-500 italic">
                * Note: Saving labour will automatically record both the labour logs and the financial expense of {formatNaira(Number(labourAmountPaid) || 0)}.
              </p>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-semibold text-stone-600 hover:text-stone-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-emerald-700 hover:bg-emerald-600 text-white px-5 py-2.5 rounded-xl text-xs font-semibold shadow-sm transition-all"
                >
                  {isSubmitting ? 'Saving...' : 'Record Labour'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
