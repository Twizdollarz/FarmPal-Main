import React, { useState, useEffect } from 'react';
import {
  Package,
  AlertCircle,
  CheckCircle2,
  Plus,
  Minus,
  Trash2,
  Archive,
  Layers,
  Sparkles,
  ShoppingBag,
  RefreshCw,
} from 'lucide-react';
import { FarmInventoryItem } from '../types';

let cachedInventoryItems: FarmInventoryItem[] | null = null;

export const InventoryView: React.FC = () => {
  const [items, setItems] = useState<FarmInventoryItem[]>(() => cachedInventoryItems ?? []);
  const [isLoading, setIsLoading] = useState(() => !cachedInventoryItems);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [adjustingItemId, setAdjustingItemId] = useState<string | null>(null);

  // New item form state
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState<'Fertilizer' | 'Chemicals' | 'Seeds' | 'Packaging' | 'Fuel' | 'Tools'>('Fertilizer');
  const [newQuantity, setNewQuantity] = useState<number>(10);
  const [newUnit, setNewUnit] = useState('bags');
  const [newThreshold, setNewThreshold] = useState<number>(4);
  const [newUnitValue, setNewUnitValue] = useState<number>(35000);
  const [newLocation, setNewLocation] = useState('Main Farm Storehouse');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchInventory = async (silent = false) => {
    try {
      if (!silent) setIsLoading(true);
      const res = await fetch('/api/inventory');
      if (res.ok) {
        const data = await res.json();
        cachedInventoryItems = data;
        setItems(data);
      }
    } catch (err) {
      console.error('Error fetching inventory:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory(Boolean(cachedInventoryItems));
  }, []);

  const handleAdjustQuantity = async (id: string, delta: number) => {
    try {
      setAdjustingItemId(id);
      const res = await fetch(`/api/inventory/${id}/adjust`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ delta }),
      });
      if (res.ok) {
        const updated = await res.json();
        setItems((prev) => prev.map((item) => (item.id === id ? updated : item)));
      }
    } catch (err) {
      console.error('Error adjusting inventory item:', err);
    } finally {
      setAdjustingItemId(null);
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (!confirm('Are you sure you want to remove this item from store records?')) return;
    try {
      const res = await fetch(`/api/inventory/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setItems((prev) => prev.filter((i) => i.id !== id));
      }
    } catch (err) {
      console.error('Error deleting inventory item:', err);
    }
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    try {
      setIsSubmitting(true);
      const res = await fetch('/api/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName,
          category: newCategory,
          currentQuantity: newQuantity,
          unit: newUnit,
          reorderThreshold: newThreshold,
          estimatedUnitValue: newUnitValue,
          storageLocation: newLocation,
        }),
      });
      if (res.ok) {
        const item = await res.json();
        setItems((prev) => [item, ...prev]);
        setIsAddModalOpen(false);
        setNewName('');
      }
    } catch (err) {
      console.error('Error adding inventory item:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center space-y-3">
        <div className="w-8 h-8 rounded-full border-2 border-emerald-600 border-t-transparent animate-spin" />
        <p className="text-xs text-stone-500 font-medium">Opening Farm Storehouse Inventory...</p>
      </div>
    );
  }

  const totalValuation = items.reduce((sum, item) => sum + item.currentQuantity * item.estimatedUnitValue, 0);
  const lowStockCount = items.filter((i) => i.status === 'low_stock' || i.status === 'out_of_stock').length;

  const categories = ['all', 'Fertilizer', 'Chemicals', 'Fuel', 'Packaging', 'Seeds', 'Tools'];
  const filteredItems = selectedCategory === 'all' ? items : items.filter((i) => i.category === selectedCategory);

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner & Valuation */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-stone-200 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                Phase 4 Depot
              </span>
              <span className="text-xs text-stone-400 font-mono">Real-Time Stock Reconciliation</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-stone-900">
              Farm Storehouse & Input Depot
            </h1>
            <p className="text-xs sm:text-sm text-stone-600 max-w-2xl">
              Track remaining bags of fertilizer, chemical liters, fuel drums, and crates to prevent field stockouts during critical spraying and planting windows.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-4 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Store Item</span>
            </button>
          </div>
        </div>

        {/* Quick summary stats */}
        <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-stone-50 p-3.5 rounded-xl border border-stone-200">
            <p className="text-[11px] text-stone-500 font-medium">Total Store Inventory Value</p>
            <p className="text-xl sm:text-2xl font-black text-stone-900 font-mono mt-1">
              ₦{totalValuation.toLocaleString('en-NG')}
            </p>
            <p className="text-[10px] text-stone-400">At current procurement cost</p>
          </div>

          <div className="bg-stone-50 p-3.5 rounded-xl border border-stone-200">
            <p className="text-[11px] text-stone-500 font-medium">Distinct Stock Items</p>
            <p className="text-xl sm:text-2xl font-black text-stone-900 font-mono mt-1">
              {items.length} Lines
            </p>
            <p className="text-[10px] text-stone-400">Across 6 input categories</p>
          </div>

          <div className="bg-stone-50 p-3.5 rounded-xl border border-stone-200">
            <p className="text-[11px] text-stone-500 font-medium">Reorder Alerts</p>
            <p className="text-xl sm:text-2xl font-black text-amber-700 font-mono mt-1">
              {lowStockCount} Items Low
            </p>
            <p className="text-[10px] text-amber-600">Below minimum buffer limit</p>
          </div>

          <div className="bg-stone-50 p-3.5 rounded-xl border border-stone-200">
            <p className="text-[11px] text-stone-500 font-medium">Primary Store</p>
            <p className="text-sm sm:text-base font-bold text-stone-900 mt-1 truncate">
              Dry Storehouse Bay 1
            </p>
            <p className="text-[10px] text-emerald-700">Protected & Ventilated</p>
          </div>
        </div>
      </div>

      {/* Category Pills Filter */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize whitespace-nowrap transition-colors cursor-pointer ${
              selectedCategory === cat
                ? 'bg-emerald-800 text-white shadow-xs'
                : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-100'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Inventory Items List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm sm:text-base font-bold text-stone-900">
            On-Hand Inventory Records ({filteredItems.length})
          </h2>
          <button
            onClick={fetchInventory}
            className="flex items-center gap-1 text-xs text-stone-500 hover:text-stone-800 cursor-pointer font-medium"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Sync Stock</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filteredItems.map((item) => {
            const isLow = item.status === 'low_stock';
            const isOut = item.status === 'out_of_stock';

            return (
              <div
                key={item.id}
                className="bg-white rounded-2xl p-4 border border-stone-200 shadow-2xs space-y-3 hover:border-emerald-300 transition-colors flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-stone-100 text-stone-700 px-2 py-0.5 rounded-md">
                          {item.category}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            isOut
                              ? 'bg-rose-100 text-rose-800'
                              : isLow
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          }`}
                        >
                          {isOut ? 'Out of Stock' : isLow ? 'Low Stock Warning' : 'Adequate Buffer'}
                        </span>
                      </div>
                      <h3 className="text-sm font-bold text-stone-900 mt-1">
                        {item.name}
                      </h3>
                      <p className="text-[11px] text-stone-400">Bay: {item.storageLocation}</p>
                    </div>

                    <button
                      onClick={() => handleDeleteItem(item.id)}
                      className="text-stone-300 hover:text-rose-600 transition-colors p-1 cursor-pointer"
                      title="Remove item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Quantity and Valuation details */}
                  <div className="grid grid-cols-3 gap-2 bg-stone-50 p-2.5 rounded-xl border border-stone-100 text-xs">
                    <div>
                      <p className="text-[10px] text-stone-400">Available Stock</p>
                      <p className="font-bold text-stone-900 font-mono text-sm">
                        {item.currentQuantity} <span className="text-[10px] font-normal text-stone-500">{item.unit}</span>
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-stone-400">Buffer Limit</p>
                      <p className="font-semibold text-stone-700 font-mono text-sm">
                        {item.reorderThreshold} {item.unit}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-stone-400">Total Value</p>
                      <p className="font-bold text-emerald-800 font-mono text-sm">
                        ₦{(item.currentQuantity * item.estimatedUnitValue).toLocaleString('en-NG')}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Quick adjustments in field */}
                <div className="pt-2 border-t border-stone-100 flex items-center justify-between gap-2">
                  <span className="text-[11px] text-stone-400">Restocked: {item.lastRestocked}</span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleAdjustQuantity(item.id, -1)}
                      disabled={item.currentQuantity <= 0 || adjustingItemId === item.id}
                      className="px-2.5 py-1 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 disabled:opacity-40 cursor-pointer"
                      title="Used 1 unit in field"
                    >
                      <Minus className="w-3 h-3" />
                      <span>Use 1</span>
                    </button>

                    <button
                      onClick={() => handleAdjustQuantity(item.id, 1)}
                      disabled={adjustingItemId === item.id}
                      className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
                      title="Add 1 unit to stock"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Restock</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ADD ITEM MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 border border-stone-200 shadow-xl">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] uppercase font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full">
                  Farm Storehouse
                </span>
                <h3 className="text-base font-bold text-stone-900 mt-1">
                  Add New Input Stock Item
                </h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-stone-400 hover:text-stone-600 text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddItem} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-stone-700 mb-1">Item / Input Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Potassium Nitrate Spray"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-xl font-medium focus:outline-emerald-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as any)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl font-medium focus:outline-emerald-600"
                  >
                    <option value="Fertilizer">Fertilizer</option>
                    <option value="Chemicals">Chemicals</option>
                    <option value="Seeds">Seeds</option>
                    <option value="Packaging">Packaging</option>
                    <option value="Fuel">Fuel</option>
                    <option value="Tools">Tools</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Unit of Measure</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. bags, litres"
                    value={newUnit}
                    onChange={(e) => setNewUnit(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl font-medium focus:outline-emerald-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Initial Quantity</label>
                  <input
                    type="number"
                    min="0"
                    value={newQuantity}
                    onChange={(e) => setNewQuantity(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl font-bold font-mono focus:outline-emerald-600"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Reorder Threshold</label>
                  <input
                    type="number"
                    min="1"
                    value={newThreshold}
                    onChange={(e) => setNewThreshold(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl font-bold font-mono focus:outline-emerald-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Unit Value (₦)</label>
                  <input
                    type="number"
                    min="0"
                    value={newUnitValue}
                    onChange={(e) => setNewUnitValue(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl font-bold font-mono focus:outline-emerald-600"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Storage Location</label>
                  <input
                    type="text"
                    value={newLocation}
                    onChange={(e) => setNewLocation(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl font-medium focus:outline-emerald-600"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 border border-stone-200 text-stone-700 rounded-xl font-medium hover:bg-stone-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl font-bold transition-colors cursor-pointer"
                >
                  {isSubmitting ? 'Saving...' : 'Add to Store'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
