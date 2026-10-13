import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  MapPin,
  Truck,
  RefreshCw,
  Package,
  Calendar,
  Calculator,
} from 'lucide-react';
import { MarketPriceBenchmark, WeeklyPricePoint } from '../types';
import { formatNaira } from '../lib/i18n';
import { DEFAULT_FALLBACK_BENCHMARKS } from '../data/marketPriceData';

let hasLoadedMarketBenchmarks = false;

const CROP_ICONS: Record<string, string> = {
  Tomato: '🍅',
  Maize: '🌽',
  Rice: '🍚',
  Pepper: '🌶️',
  'Pepper (Ata Rodo)': '🌶️',
  Onions: '🧅',
  Soybean: '🌱',
  Cucumber: '🥒',
  Sweetcorn: '🌽',
  Cabbage: '🥬',
};

export const MarketPriceView: React.FC = () => {
  const [benchmarks, setBenchmarks] = useState<MarketPriceBenchmark[]>(DEFAULT_FALLBACK_BENCHMARKS);
  const [loading, setLoading] = useState(() => !hasLoadedMarketBenchmarks && benchmarks.length === 0);
  const [selectedCrop, setSelectedCrop] = useState<string>('Tomato');
  const [regionFilter, setRegionFilter] = useState<'all' | 'North' | 'South' | 'West' | 'East'>('all');
  const [showHistory, setShowHistory] = useState<boolean>(false);

  // Profit / Interstate Transport Calculator state
  const [calcQuantity, setCalcQuantity] = useState<number>(30);
  const [selectedDestinationMarketId, setSelectedDestinationMarketId] = useState<string>('');
  const [calcTransportPerUnit, setCalcTransportPerUnit] = useState<number>(2500);

  const fetchMarketData = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const res = await fetch('/api/market/benchmarks');
      if (res.ok) {
        const data = await res.json();
        hasLoadedMarketBenchmarks = true;
        if (data.benchmarks && data.benchmarks.length > 0) {
          setBenchmarks(data.benchmarks);
        }
      }
    } catch (err) {
      console.warn('Could not reach remote market benchmark feed, using cached prices:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMarketData(hasLoadedMarketBenchmarks);
  }, []);

  const cropsAvailable: string[] = Array.from(new Set(benchmarks.map((b) => b.cropName)));

  // Filter benchmarks by selected crop
  const cropBenchmarks = benchmarks.filter(
    (b) => b.cropName.toLowerCase() === selectedCrop.toLowerCase()
  );

  // Filter by region
  const filteredBenchmarks = cropBenchmarks.filter((b) => {
    if (regionFilter === 'all') return true;
    return b.region === regionFilter;
  });

  const currentUnit = cropBenchmarks[0]?.unit || 'units';

  // Compute key metrics
  const avgPrice = cropBenchmarks.length > 0
    ? Math.round(cropBenchmarks.reduce((sum, b) => sum + b.wholesaleAvg, 0) / cropBenchmarks.length)
    : 0;

  const sortedByPrice = [...cropBenchmarks].sort((a, b) => a.wholesaleAvg - b.wholesaleAvg);
  const lowestMarket = sortedByPrice[0];
  const highestMarket = sortedByPrice[sortedByPrice.length - 1];

  // Local market vs Destination for calculator
  const localMarket = cropBenchmarks.find((b) => b.state.toLowerCase() === 'kano') || cropBenchmarks[0];
  const destinationMarket =
    cropBenchmarks.find((b) => b.id === selectedDestinationMarketId) ||
    cropBenchmarks.find((b) => b.state.toLowerCase() === 'lagos') ||
    highestMarket;

  // Auto update transport cost when crop or destination changes
  useEffect(() => {
    if (destinationMarket?.haulageRateFromNorth) {
      setCalcTransportPerUnit(destinationMarket.haulageRateFromNorth);
    } else if (currentUnit === 'crates') {
      setCalcTransportPerUnit(2500);
    } else {
      setCalcTransportPerUnit(5000);
    }
  }, [selectedCrop, destinationMarket?.id, currentUnit]);

  // Arbitrage calculations
  const localGross = (localMarket?.wholesaleAvg || 16500) * calcQuantity;
  const interstateGross = (destinationMarket?.wholesaleAvg || 36000) * calcQuantity;
  const totalHaulageCost = calcTransportPerUnit * calcQuantity;
  const interstateNet = interstateGross - totalHaulageCost;
  const arbitrageGain = interstateNet - localGross;

  return (
    <div className="space-y-5">
      {/* 1. Clean Header */}
      <div className="bg-white dark:bg-[#1C1C1E] rounded-2xl p-5 border border-stone-200 dark:border-white/10 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-stone-900 dark:text-white flex items-center gap-2">
              <span>🌾 Market Prices</span>
            </h2>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
              Current wholesale prices of agricultural commodities across Nigerian markets
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={() => fetchMarketData()}
              disabled={loading}
              className="flex items-center gap-1.5 text-xs font-semibold text-stone-700 dark:text-stone-200 hover:text-stone-900 dark:hover:text-white bg-stone-100 dark:bg-white/10 hover:bg-stone-200 px-3.5 py-2 rounded-xl transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh Prices</span>
            </button>
          </div>
        </div>

        {/* Commodity Selector Pills */}
        <div className="pt-4 border-t border-stone-100 dark:border-white/5 mt-4">
          <label className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider block mb-2">
            Select Commodity
          </label>
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {cropsAvailable.map((cropName) => {
              const isSelected = selectedCrop.toLowerCase() === cropName.toLowerCase();
              const icon = CROP_ICONS[cropName] || '🌾';
              return (
                <button
                  key={cropName}
                  onClick={() => setSelectedCrop(cropName)}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    isSelected
                      ? 'bg-emerald-700 text-white shadow-xs'
                      : 'bg-stone-100 dark:bg-white/5 text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-white/10'
                  }`}
                >
                  <span>{icon}</span>
                  <span>{cropName}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 2. Key Price Snapshot (3 High-Level Numbers) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 bg-white dark:bg-[#1C1C1E] rounded-2xl border border-stone-200 dark:border-white/10 shadow-2xs">
          <p className="text-[11px] font-semibold text-stone-500 dark:text-stone-400">
            Average Price ({selectedCrop})
          </p>
          <p className="text-xl font-bold text-stone-900 dark:text-white mt-1">
            {formatNaira(avgPrice)}
            <span className="text-xs font-normal text-stone-500"> / {currentUnit}</span>
          </p>
          <p className="text-[11px] text-stone-500 mt-1">National wholesale average</p>
        </div>

        <div className="p-4 bg-white dark:bg-[#1C1C1E] rounded-2xl border border-stone-200 dark:border-white/10 shadow-2xs">
          <p className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
            Lowest Market (Farmgate / Assembly)
          </p>
          <p className="text-xl font-bold text-emerald-800 dark:text-emerald-300 mt-1">
            {lowestMarket ? formatNaira(lowestMarket.wholesaleAvg) : '—'}
            <span className="text-xs font-normal text-stone-500"> / {currentUnit}</span>
          </p>
          <p className="text-[11px] text-stone-500 mt-1">
            {lowestMarket ? `${lowestMarket.marketName} (${lowestMarket.state})` : '—'}
          </p>
        </div>

        <div className="p-4 bg-white dark:bg-[#1C1C1E] rounded-2xl border border-stone-200 dark:border-white/10 shadow-2xs">
          <p className="text-[11px] font-semibold text-amber-700 dark:text-amber-400">
            Highest Market (Terminal Wholesale)
          </p>
          <p className="text-xl font-bold text-amber-800 dark:text-amber-300 mt-1">
            {highestMarket ? formatNaira(highestMarket.wholesaleAvg) : '—'}
            <span className="text-xs font-normal text-stone-500"> / {currentUnit}</span>
          </p>
          <p className="text-[11px] text-stone-500 mt-1">
            {highestMarket ? `${highestMarket.marketName} (${highestMarket.state})` : '—'}
          </p>
        </div>
      </div>

      {/* 3. Market Price Cards by City / Hub */}
      <div className="bg-white dark:bg-[#1C1C1E] rounded-2xl p-5 border border-stone-200 dark:border-white/10 shadow-2xs space-y-4">
        {/* Controls: Region Filter & Toggle History */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-100 dark:border-white/5">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            <span className="text-xs font-semibold text-stone-500 mr-1">Region:</span>
            {(['all', 'North', 'South', 'West'] as const).map((reg) => (
              <button
                key={reg}
                onClick={() => setRegionFilter(reg)}
                className={`px-3 py-1 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                  regionFilter === reg
                    ? 'bg-stone-900 text-white dark:bg-white dark:text-stone-900'
                    : 'bg-stone-100 dark:bg-white/5 text-stone-600 dark:text-stone-400 hover:bg-stone-200'
                }`}
              >
                {reg === 'all' ? 'All Markets' : `${reg}`}
              </button>
            ))}
          </div>

          <button
            onClick={() => setShowHistory(!showHistory)}
            className="flex items-center gap-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:underline cursor-pointer self-start sm:self-auto"
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>{showHistory ? 'Hide 4-Week History' : 'Show 4-Week History'}</span>
          </button>
        </div>

        {/* 4-Week History Table (When opened) */}
        {showHistory && (
          <div className="overflow-x-auto pb-2 border-b border-stone-100 dark:border-white/5">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-stone-200 dark:border-white/10 text-stone-500">
                  <th className="py-2 px-3 font-semibold">Market Hub</th>
                  <th className="py-2 px-3 font-semibold text-right">Week 1</th>
                  <th className="py-2 px-3 font-semibold text-right">Week 2</th>
                  <th className="py-2 px-3 font-semibold text-right">Week 3</th>
                  <th className="py-2 px-3 font-semibold text-right text-emerald-700 font-bold">This Week</th>
                  <th className="py-2 px-3 font-semibold text-right">Trend</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-white/5">
                {filteredBenchmarks.map((bench) => {
                  const weekly = bench.weeklyPrices || [];
                  const w1 = weekly[0]?.wholesaleAvg;
                  const w2 = weekly[1]?.wholesaleAvg;
                  const w3 = weekly[2]?.wholesaleAvg;
                  const w4 = weekly[weekly.length - 1]?.wholesaleAvg || bench.wholesaleAvg;
                  return (
                    <tr key={bench.id} className="hover:bg-stone-50 dark:hover:bg-white/5">
                      <td className="py-2.5 px-3 font-medium text-stone-900 dark:text-white">
                        {bench.marketName} ({bench.state})
                      </td>
                      <td className="py-2.5 px-3 text-right text-stone-600 dark:text-stone-400">
                        {w1 ? formatNaira(w1) : '—'}
                      </td>
                      <td className="py-2.5 px-3 text-right text-stone-600 dark:text-stone-400">
                        {w2 ? formatNaira(w2) : '—'}
                      </td>
                      <td className="py-2.5 px-3 text-right text-stone-600 dark:text-stone-400">
                        {w3 ? formatNaira(w3) : '—'}
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-stone-900 dark:text-white">
                        {formatNaira(w4)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-semibold">
                        <span className={bench.changePercent7d >= 0 ? 'text-emerald-700' : 'text-red-600'}>
                          {bench.changePercent7d >= 0 ? `+${bench.changePercent7d}%` : `${bench.changePercent7d}%`}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Clean Market Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredBenchmarks.map((bench) => {
            const isRising = bench.trend === 'rising';
            const isFalling = bench.trend === 'falling';

            return (
              <div
                key={bench.id}
                className="p-4 bg-stone-50 dark:bg-white/5 rounded-xl border border-stone-200/80 dark:border-white/10 hover:border-emerald-300 transition-all flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-stone-200/80 dark:bg-white/10 text-stone-700 dark:text-stone-300">
                      {bench.region} Region
                    </span>

                    <div
                      className={`flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${
                        isRising
                          ? 'bg-emerald-100 text-emerald-800'
                          : isFalling
                          ? 'bg-red-100 text-red-700'
                          : 'bg-stone-200 text-stone-700'
                      }`}
                    >
                      {isRising ? (
                        <TrendingUp className="w-3 h-3" />
                      ) : isFalling ? (
                        <TrendingDown className="w-3 h-3" />
                      ) : (
                        <Minus className="w-3 h-3" />
                      )}
                      <span>
                        {bench.changePercent7d > 0 ? `+${bench.changePercent7d}%` : `${bench.changePercent7d}%`}
                      </span>
                    </div>
                  </div>

                  <h4 className="text-sm font-bold text-stone-900 dark:text-white">{bench.marketName}</h4>
                  <div className="flex items-center gap-1 text-xs text-stone-500 mt-0.5">
                    <MapPin className="w-3 h-3 text-stone-400" />
                    <span>{bench.state} State</span>
                  </div>

                  {bench.packageType && (
                    <div className="mt-2 text-[11px] text-stone-600 dark:text-stone-400 flex items-center gap-1">
                      <Package className="w-3 h-3 text-stone-400 shrink-0" />
                      <span className="truncate">{bench.packageType}</span>
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-stone-200/60 dark:border-white/5">
                  <div className="flex items-baseline justify-between">
                    <span className="text-xl font-extrabold text-stone-900 dark:text-white">
                      {formatNaira(bench.wholesaleAvg)}
                    </span>
                    <span className="text-xs text-stone-500 font-medium">per {bench.unit}</span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-stone-500 mt-1 pt-1">
                    <span>Min: {formatNaira(bench.wholesaleMin)}</span>
                    <span>Max: {formatNaira(bench.wholesaleMax)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Simple Interstate Profit Estimator */}
      <div className="bg-white dark:bg-[#1C1C1E] rounded-2xl p-5 border border-stone-200 dark:border-white/10 shadow-2xs space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-stone-100 dark:border-white/5">
          <Calculator className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
          <h3 className="text-sm font-bold text-stone-900 dark:text-white">
            Interstate Profit Estimator ({selectedCrop})
          </h3>
        </div>

        <p className="text-xs text-stone-500 dark:text-stone-400">
          Check if sending your harvest to an urban market (like Lagos or Ibadan) gives you more profit after paying transport.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
          <div>
            <label className="text-xs font-semibold text-stone-700 dark:text-stone-300 block mb-1">
              Quantity to Sell ({currentUnit})
            </label>
            <input
              type="number"
              min={1}
              value={calcQuantity}
              onChange={(e) => setCalcQuantity(Math.max(1, Number(e.target.value)))}
              className="w-full text-xs p-2.5 rounded-xl bg-stone-50 dark:bg-white/5 border border-stone-300 dark:border-white/10 font-semibold text-stone-900 dark:text-white"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-stone-700 dark:text-stone-300 block mb-1">
              Destination Market
            </label>
            <select
              value={destinationMarket?.id || ''}
              onChange={(e) => setSelectedDestinationMarketId(e.target.value)}
              className="w-full text-xs p-2.5 rounded-xl bg-stone-50 dark:bg-white/5 border border-stone-300 dark:border-white/10 font-semibold text-stone-900 dark:text-white"
            >
              {cropBenchmarks
                .filter((b) => b.state.toLowerCase() !== 'kano')
                .map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.marketName} ({b.state}) — {formatNaira(b.wholesaleAvg)}/{b.unit}
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-stone-700 dark:text-stone-300 block mb-1">
              Transport Cost per {currentUnit} (₦)
            </label>
            <input
              type="number"
              step={100}
              value={calcTransportPerUnit}
              onChange={(e) => setCalcTransportPerUnit(Number(e.target.value))}
              className="w-full text-xs p-2.5 rounded-xl bg-stone-50 dark:bg-white/5 border border-stone-300 dark:border-white/10 font-semibold text-stone-900 dark:text-white"
            />
          </div>
        </div>

        {/* Simple Result Banner */}
        <div className="p-4 bg-stone-50 dark:bg-white/5 rounded-xl border border-stone-200 dark:border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="space-y-1">
            <span className="text-stone-500">
              Selling {calcQuantity} {currentUnit} locally ({localMarket?.marketName || 'Local'}):{' '}
              <strong className="text-stone-900 dark:text-white">{formatNaira(localGross)}</strong>
            </span>
            <div className="text-stone-500">
              Selling in {destinationMarket?.marketName || 'Lagos'} after transport (-{formatNaira(totalHaulageCost)}):{' '}
              <strong className="text-emerald-700 dark:text-emerald-400">{formatNaira(interstateNet)}</strong>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[11px] font-semibold text-stone-500 block">Estimated Net Difference:</span>
            <span
              className={`text-base font-bold ${
                arbitrageGain > 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-stone-600'
              }`}
            >
              {arbitrageGain > 0
                ? `+${formatNaira(arbitrageGain)} Extra Profit`
                : 'Better to sell locally'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
