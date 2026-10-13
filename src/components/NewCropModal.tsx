import React, { useState } from 'react';
import { X, Sprout, Search, Plus, Check } from 'lucide-react';

interface NewCropModalProps {
  onClose: () => void;
  onSaveCrop: (data: {
    name: string;
    variety?: string;
    plantingDate: string;
    farmSizeAcres: number;
    notes?: string;
  }) => Promise<void>;
}

export const NewCropModal: React.FC<NewCropModalProps> = ({ onClose, onSaveCrop }) => {
  const initialPopularCrops = [
    { name: 'Tomato', defaultVariety: 'Cobra F1 / Roma' },
    { name: 'Cucumber', defaultVariety: 'Darina / Murano' },
    { name: 'Sweetcorn', defaultVariety: 'Golden Bantam' },
    { name: 'Pepper', defaultVariety: 'Habanero / Rodo' },
    { name: 'Okra', defaultVariety: 'Clemson Spineless' },
    { name: 'Watermelon', defaultVariety: 'Sugar Baby' },
    { name: 'Cassava', defaultVariety: 'TME 419' },
    { name: 'Maize', defaultVariety: 'SAMMAZ' },
  ];

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCropName, setSelectedCropName] = useState('Tomato');
  const [customCropName, setCustomCropName] = useState('');
  const [variety, setVariety] = useState('Cobra F1');
  const [plantingDate, setPlantingDate] = useState(new Date().toISOString().split('T')[0]);
  const [farmSizeAcres, setFarmSizeAcres] = useState('1.0');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filteredCrops = initialPopularCrops.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectPreset = (name: string, defaultVariety: string) => {
    setSelectedCropName(name);
    setCustomCropName('');
    setVariety(defaultVariety);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const finalName = customCropName.trim() ? customCropName.trim() : selectedCropName;
    if (!finalName) {
      setError('Please provide a crop name');
      return;
    }

    const acres = Number(farmSizeAcres);
    if (!acres || acres <= 0) {
      setError('Please enter a valid farm size in acres');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSaveCrop({
        name: finalName,
        variety: variety.trim() || undefined,
        plantingDate,
        farmSizeAcres: acres,
        notes: notes.trim() || undefined,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create crop');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-stone-200 overflow-hidden my-auto">
        <div className="bg-emerald-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-700 flex items-center justify-center text-white">
              <Sprout className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold tracking-tight">Start a New Crop</h3>
              <p className="text-xs text-emerald-200/80">
                Multiple active crops are supported simultaneously
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-emerald-200 hover:text-white rounded-lg hover:bg-emerald-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mx-5 mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Crop Selector / Search */}
          <div>
            <label className="text-xs font-semibold text-stone-700 block mb-1.5">
              Select or Search Crop
            </label>
            <div className="relative mb-2">
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search common crops (Tomato, Cucumber, Pepper...)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs bg-stone-50 border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-1 bg-stone-50 rounded-xl border border-stone-200">
              {filteredCrops.map((c) => {
                const isSelected = selectedCropName === c.name && !customCropName;
                return (
                  <button
                    key={c.name}
                    type="button"
                    onClick={() => handleSelectPreset(c.name, c.defaultVariety)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border flex items-center gap-1 transition-colors ${
                      isSelected
                        ? 'bg-emerald-800 text-white border-emerald-800'
                        : 'bg-white text-stone-700 border-stone-300 hover:border-emerald-600'
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3" />}
                    <span>{c.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Crop input if not in list */}
          <div>
            <label className="text-xs font-semibold text-stone-700 block mb-1">
              Or enter custom crop name:
            </label>
            <input
              type="text"
              placeholder="e.g. Ginger, Plantain, Garlic"
              value={customCropName}
              onChange={(e) => {
                setCustomCropName(e.target.value);
                if (e.target.value.trim()) {
                  setSelectedCropName('');
                }
              }}
              className="w-full p-2.5 text-xs bg-stone-50 border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          {/* Variety and Farm Size */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-stone-700 block mb-1.5">
                Seed / Variety (optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Cobra F1"
                value={variety}
                onChange={(e) => setVariety(e.target.value)}
                className="w-full p-2.5 text-xs bg-stone-50 border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-stone-700 block mb-1.5">
                Farm Size (Acres)
              </label>
              <input
                type="number"
                step="0.1"
                placeholder="e.g. 2.0"
                value={farmSizeAcres}
                onChange={(e) => setFarmSizeAcres(e.target.value)}
                className="w-full p-2.5 text-xs bg-stone-50 border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                required
              />
            </div>
          </div>

          {/* Planting Date */}
          <div>
            <label className="text-xs font-semibold text-stone-700 block mb-1.5">
              Planting Date
            </label>
            <input
              type="date"
              value={plantingDate}
              onChange={(e) => setPlantingDate(e.target.value)}
              className="w-full p-2.5 text-xs bg-stone-50 border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-stone-700 block mb-1.5">
              Notes (optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Plot B near river irrigation canal"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-2.5 text-xs bg-stone-50 border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div className="pt-3 flex items-center justify-end gap-2 border-t border-stone-200">
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
              {isSubmitting ? 'Starting...' : 'Start Crop'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
