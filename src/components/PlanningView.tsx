import React, { useState, useEffect } from 'react';
import {
  PieChart,
  Calendar,
  CheckCircle2,
  Circle,
  AlertTriangle,
  TrendingUp,
  Plus,
  ArrowRight,
  Clock,
  Sparkles,
  DollarSign,
  ChevronRight,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { CropBudget, CropCalendarSchedule, AgronomicTask, Crop } from '../types';
import { formatNaira } from '../lib/i18n';

interface PlanningViewProps {
  crops: Crop[];
  onOpenQuickEntry?: (cropId?: string, categoryName?: string) => void;
}

let cachedPlanningData: { budgets: CropBudget[]; calendars: CropCalendarSchedule[]; tasks: AgronomicTask[] } | null = null;

export const PlanningView: React.FC<PlanningViewProps> = ({ crops, onOpenQuickEntry }) => {
  const [budgets, setBudgets] = useState<CropBudget[]>(() => cachedPlanningData?.budgets ?? []);
  const [calendars, setCalendars] = useState<CropCalendarSchedule[]>(() => cachedPlanningData?.calendars ?? []);
  const [tasks, setTasks] = useState<AgronomicTask[]>(() => cachedPlanningData?.tasks ?? []);
  const [loading, setLoading] = useState(() => !cachedPlanningData);
  const [activeCropId, setActiveCropId] = useState<string>(() => cachedPlanningData?.budgets?.[0]?.cropId ?? '');
  const [taskFilter, setTaskFilter] = useState<'all' | 'pending' | 'completed'>('pending');
  const [showNewTaskModal, setShowNewTaskModal] = useState(false);

  // New task form state
  const [newTaskCropId, setNewTaskCropId] = useState('');
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskCategory, setNewTaskCategory] = useState('Labour');
  const [newTaskDueDate, setNewTaskDueDate] = useState(
    new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [newTaskCost, setNewTaskCost] = useState('');
  const [newTaskNotes, setNewTaskNotes] = useState('');
  const [isSubmittingTask, setIsSubmittingTask] = useState(false);

  const fetchPlanningData = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const [bRes, cRes] = await Promise.all([
        fetch('/api/planning/budgets'),
        fetch('/api/planning/calendar'),
      ]);

      let freshBudgets = budgets;
      let freshCalendars = calendars;
      let freshTasks = tasks;

      if (bRes.ok) {
        freshBudgets = await bRes.json();
        setBudgets(freshBudgets);
        if (freshBudgets.length > 0 && !activeCropId) {
          setActiveCropId(freshBudgets[0].cropId);
        }
      }

      if (cRes.ok) {
        const cData = await cRes.json();
        freshCalendars = cData.calendar || [];
        freshTasks = cData.tasks || [];
        setCalendars(freshCalendars);
        setTasks(freshTasks);
      }

      cachedPlanningData = {
        budgets: freshBudgets,
        calendars: freshCalendars,
        tasks: freshTasks,
      };
    } catch (err) {
      console.error('Failed to load planning data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlanningData(Boolean(cachedPlanningData));
  }, []);

  const currentBudget = budgets.find((b) => b.cropId === activeCropId) || budgets[0];
  const currentCalendar = calendars.find((c) => c.cropId === activeCropId) || calendars[0];

  const totalFarmBudget = budgets.reduce((sum, b) => sum + b.totalBudget, 0);
  const totalFarmSpent = budgets.reduce((sum, b) => sum + b.totalSpent, 0);
  const totalFarmRemaining = Math.max(0, totalFarmBudget - totalFarmSpent);
  const farmBurnRate = totalFarmBudget > 0 ? Math.round((totalFarmSpent / totalFarmBudget) * 100) : 0;

  const handleToggleTask = async (taskId: string) => {
    try {
      const res = await fetch(`/api/planning/tasks/${taskId}/toggle`, { method: 'POST' });
      if (res.ok) {
        const updated = await res.json();
        setTasks((prev) => prev.map((t) => (t.id === taskId ? updated : t)));
      }
    } catch (err) {
      console.error('Error toggling task:', err);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    setIsSubmittingTask(true);
    try {
      const res = await fetch('/api/planning/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cropId: newTaskCropId || activeCropId || crops[0]?.id,
          title: newTaskTitle.trim(),
          category: newTaskCategory,
          dueDate: newTaskDueDate,
          estimatedCost: newTaskCost ? Number(newTaskCost) : undefined,
          notes: newTaskNotes.trim() || undefined,
        }),
      });

      if (res.ok) {
        const created = await res.json();
        setTasks((prev) => [created, ...prev]);
        setShowNewTaskModal(false);
        setNewTaskTitle('');
        setNewTaskCost('');
        setNewTaskNotes('');
      }
    } catch (err) {
      console.error('Error creating task:', err);
    } finally {
      setIsSubmittingTask(false);
    }
  };

  const filteredTasks = tasks.filter((t) => {
    if (activeCropId && t.cropId !== activeCropId) return false;
    if (taskFilter === 'pending') return !t.completed;
    if (taskFilter === 'completed') return t.completed;
    return true;
  });

  if (loading && budgets.length === 0) {
    return (
      <div className="py-16 text-center text-stone-500">
        <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs">Loading seasonal budgets and crop calendar...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview Metric Banner */}
      <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-stone-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-stone-600 font-medium">Target Cost Forecasting & Crop Milestones</span>
            </div>
            <h2 className="text-xl font-bold text-stone-900 mt-1">Seasonal Planning & Budget Burn Rate</h2>
            <p className="text-xs text-stone-600 mt-0.5">
              Track seasonal inputs against predefined target allocations to prevent cost overruns before harvest.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setNewTaskCropId(activeCropId || crops[0]?.id || '');
                setShowNewTaskModal(true);
              }}
              className="flex items-center gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold px-3.5 py-2 rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Schedule Farm Task</span>
            </button>
          </div>
        </div>

        {/* Aggregate Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4">
          <div className="bg-stone-50 p-3.5 rounded-xl border border-stone-100">
            <span className="text-[11px] font-semibold text-stone-600 uppercase tracking-wider block">
              Total Farm Budget
            </span>
            <span className="text-lg font-bold text-stone-900 mt-0.5 block">
              {formatNaira(totalFarmBudget)}
            </span>
            <span className="text-[10px] text-stone-600">Across {budgets.length} active crops</span>
          </div>

          <div className="bg-stone-50 p-3.5 rounded-xl border border-stone-100">
            <span className="text-[11px] font-semibold text-stone-600 uppercase tracking-wider block">
              Spent to Date
            </span>
            <span className="text-lg font-bold text-stone-900 mt-0.5 block">
              {formatNaira(totalFarmSpent)}
            </span>
            <span className="text-[10px] text-emerald-700 font-medium">{farmBurnRate}% of budget used</span>
          </div>

          <div className="bg-stone-50 p-3.5 rounded-xl border border-stone-100">
            <span className="text-[11px] font-semibold text-stone-600 uppercase tracking-wider block">
              Remaining Allowance
            </span>
            <span className="text-lg font-bold text-emerald-700 mt-0.5 block">
              {formatNaira(totalFarmRemaining)}
            </span>
            <span className="text-[10px] text-stone-600">Buffer until final sales</span>
          </div>

          <div className="bg-stone-50 p-3.5 rounded-xl border border-stone-100">
            <span className="text-[11px] font-semibold text-stone-600 uppercase tracking-wider block">
              Farm Burn Status
            </span>
            <div className="flex items-center gap-1.5 mt-1">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  farmBurnRate > 100 ? 'bg-red-500' : farmBurnRate >= 80 ? 'bg-amber-500' : 'bg-emerald-500'
                }`}
              />
              <span className="text-xs font-bold text-stone-900">
                {farmBurnRate > 100 ? 'Over Budget' : farmBurnRate >= 80 ? 'Approaching Limit' : 'Healthy Control'}
              </span>
            </div>
            <span className="text-[10px] text-stone-600">Seasonal pacing</span>
          </div>
        </div>
      </div>

      {/* Crop Selector Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {budgets.map((b) => (
          <button
            key={b.cropId}
            onClick={() => setActiveCropId(b.cropId)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeCropId === b.cropId
                ? 'bg-stone-900 text-white shadow-xs'
                : 'bg-white text-stone-600 hover:text-stone-900 border border-stone-200 hover:border-stone-300'
            }`}
          >
            <span>{b.cropName}</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-stone-100 text-stone-700 font-mono">
              {b.farmSizeAcres} ac
            </span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                b.status === 'exceeded'
                  ? 'bg-red-100 text-red-700 font-bold'
                  : b.status === 'near_limit'
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-emerald-100 text-emerald-800'
              }`}
            >
              {b.overallBurnPercent}% spent
            </span>
          </button>
        ))}
      </div>

      {currentBudget && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Crop Budget Burn Rate & Breakdown (2 cols) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Active Crop Budget Card */}
            <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-2xs space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-100">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-stone-900">{currentBudget.cropName} Seasonal Budget</h3>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-stone-100 text-stone-700">
                      {currentBudget.farmSizeAcres} Acres
                    </span>
                  </div>
                  <p className="text-xs text-stone-600 mt-0.5">
                    Allocated budget: {formatNaira(currentBudget.totalBudget)} | Actual recorded: {formatNaira(currentBudget.totalSpent)}
                  </p>
                </div>

                <div className="text-right">
                  <span className="text-[11px] font-semibold text-stone-600 uppercase tracking-wider block">
                    Remaining
                  </span>
                  <span
                    className={`text-base font-bold ${
                      currentBudget.remainingBudget < 0 ? 'text-red-600' : 'text-emerald-700'
                    }`}
                  >
                    {formatNaira(currentBudget.remainingBudget)}
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div>
                <div className="flex justify-between text-xs font-semibold text-stone-700 mb-1.5">
                  <span>Overall Budget Burn Rate</span>
                  <span
                    className={
                      currentBudget.overallBurnPercent > 100
                        ? 'text-red-600 font-bold'
                        : currentBudget.overallBurnPercent >= 80
                        ? 'text-amber-600 font-bold'
                        : 'text-emerald-700'
                    }
                  >
                    {currentBudget.overallBurnPercent}% Used
                  </span>
                </div>
                <div className="w-full bg-stone-100 h-3 rounded-full overflow-hidden p-0.5 border border-stone-200">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      currentBudget.overallBurnPercent > 100
                        ? 'bg-red-500'
                        : currentBudget.overallBurnPercent >= 80
                        ? 'bg-amber-500'
                        : 'bg-emerald-600'
                    }`}
                    style={{ width: `${Math.min(100, currentBudget.overallBurnPercent)}%` }}
                  />
                </div>
              </div>

              {/* Category-Level Budget Burn */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wider">
                    Category Breakdown vs Target
                  </h4>
                  <span className="text-[11px] text-stone-600">Spent / Target</span>
                </div>

                <div className="space-y-2.5">
                  {currentBudget.categoryBudgets.map((cat) => (
                    <div key={cat.categoryName} className="p-3 bg-stone-50 rounded-xl border border-stone-100">
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-stone-900">{cat.categoryName}</span>
                          {cat.status === 'exceeded' && (
                            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-red-100 text-red-700 flex items-center gap-1">
                              <AlertTriangle className="w-2.5 h-2.5" />
                              Over Budget
                            </span>
                          )}
                          {cat.status === 'warning' && (
                            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-800">
                              Warning (≥80%)
                            </span>
                          )}
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-stone-900">{formatNaira(cat.spentAmount)}</span>
                          <span className="text-stone-600 text-[11px]"> / {formatNaira(cat.allocatedBudget)}</span>
                        </div>
                      </div>

                      <div className="w-full bg-stone-200 h-1.5 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            cat.status === 'exceeded'
                              ? 'bg-red-500'
                              : cat.status === 'warning'
                              ? 'bg-amber-500'
                              : 'bg-emerald-600'
                          }`}
                          style={{ width: `${Math.min(100, cat.burnPercent)}%` }}
                        />
                      </div>

                      <div className="flex justify-between items-center text-[11px] text-stone-600 mt-1">
                        <span>{cat.burnPercent}% of allocation used</span>
                        <span>
                          {cat.remainingAmount >= 0
                            ? `${formatNaira(cat.remainingAmount)} remaining`
                            : `${formatNaira(Math.abs(cat.remainingAmount))} overspent`}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Harvest Yield & Net Margin Projection */}
              <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-900 pb-2 border-b border-emerald-200/60">
                  <Sparkles className="w-4 h-4 text-emerald-700" />
                  <span>Harvest Target & Net Margin Forecast</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3">
                  <div>
                    <span className="text-[11px] text-emerald-800 font-medium block">Planned Yield</span>
                    <span className="text-sm font-bold text-emerald-950 mt-0.5 block">
                      {currentBudget.targetYieldQuantity} {currentBudget.targetYieldUnit}
                    </span>
                    <span className="text-[10px] text-emerald-700">
                      @ {formatNaira(currentBudget.targetSellingPricePerUnit)} / {currentBudget.targetYieldUnit}
                    </span>
                  </div>

                  <div>
                    <span className="text-[11px] text-emerald-800 font-medium block">Projected Revenue</span>
                    <span className="text-sm font-bold text-emerald-950 mt-0.5 block">
                      {formatNaira(currentBudget.projectedRevenue)}
                    </span>
                    <span className="text-[10px] text-emerald-700">At benchmark selling price</span>
                  </div>

                  <div>
                    <span className="text-[11px] text-emerald-800 font-medium block">Projected Net Margin</span>
                    <span className="text-sm font-bold text-emerald-700 mt-0.5 block">
                      +{formatNaira(currentBudget.projectedNetProfit)}
                    </span>
                    <span className="text-[10px] text-emerald-800">
                      ROI: {Math.round((currentBudget.projectedNetProfit / currentBudget.totalBudget) * 100)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Growth Calendar & Milestones Track */}
            {currentCalendar && (
              <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-2xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-emerald-700" />
                    <h3 className="text-sm font-bold text-stone-900">
                      {currentCalendar.cropName} Growth Stage & Agronomic Calendar
                    </h3>
                  </div>
                  <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                    Day {currentCalendar.daysAfterPlanting} of {currentCalendar.totalDaysToMaturity}
                  </span>
                </div>

                {/* Overall Timeline Progress */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs text-stone-600">
                    <span>Planted: {currentCalendar.plantingDate}</span>
                    <span className="font-semibold text-stone-800">
                      Est. Harvest: {currentCalendar.estimatedHarvestDate}
                    </span>
                  </div>
                  <div className="w-full bg-stone-100 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-600 h-full rounded-full transition-all"
                      style={{ width: `${currentCalendar.overallProgressPercent}%` }}
                    />
                  </div>
                </div>

                {/* Stage Steps */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-2">
                  {currentCalendar.stages.map((stage, idx) => (
                    <div
                      key={stage.id}
                      className={`p-3 rounded-xl border text-xs transition-all ${
                        stage.isCurrent
                          ? 'bg-emerald-50 border-emerald-300 ring-2 ring-emerald-500/20'
                          : stage.isCompleted
                          ? 'bg-stone-50 border-stone-200 opacity-90'
                          : 'bg-white border-stone-100 opacity-60'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-bold text-stone-600 uppercase">
                          Stage {idx + 1} • Days {stage.startDay}-{stage.endDay}
                        </span>
                        {stage.isCompleted ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        ) : stage.isCurrent ? (
                          <span className="w-2 h-2 rounded-full bg-emerald-600 animate-ping" />
                        ) : (
                          <Circle className="w-3.5 h-3.5 text-stone-300" />
                        )}
                      </div>
                      <h4 className="font-bold text-stone-900 line-clamp-1">{stage.stageName}</h4>
                      <p className="text-[11px] text-stone-600 mt-1 line-clamp-2">{stage.keyAction}</p>
                    </div>
                  ))}
                </div>

                {/* Current Stage Advisory Callout */}
                {currentCalendar.currentStage && (
                  <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200 flex items-start gap-3">
                    <div className="p-2 bg-emerald-100 rounded-lg text-emerald-800 shrink-0">
                      <Zap className="w-4 h-4" />
                    </div>
                    <div>
                      <h5 className="text-xs font-bold text-stone-900">
                        Current Milestone: {currentCalendar.currentStage.stageName}
                      </h5>
                      <p className="text-xs text-stone-600 mt-0.5">
                        {currentCalendar.currentStage.advisoryNotes}
                      </p>
                      <p className="text-[11px] text-emerald-800 font-semibold mt-1">
                        Priority Action: {currentCalendar.currentStage.keyAction}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Column: Agronomic Tasks & To-Do Checklist (1 col) */}
          <div className="space-y-4">
            <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-2xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-emerald-700" />
                  <h3 className="text-sm font-bold text-stone-900">Scheduled Farm Tasks</h3>
                </div>
                <button
                  onClick={() => {
                    setNewTaskCropId(activeCropId || crops[0]?.id || '');
                    setShowNewTaskModal(true);
                  }}
                  className="text-xs font-bold text-emerald-700 hover:text-emerald-800 cursor-pointer flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  <span>Add Task</span>
                </button>
              </div>

              {/* Filter pills */}
              <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-lg">
                <button
                  onClick={() => setTaskFilter('pending')}
                  className={`flex-1 py-1 text-[11px] font-bold rounded-md transition-all cursor-pointer ${
                    taskFilter === 'pending'
                      ? 'bg-white text-stone-900 shadow-2xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  Pending ({tasks.filter((t) => (!activeCropId || t.cropId === activeCropId) && !t.completed).length})
                </button>
                <button
                  onClick={() => setTaskFilter('completed')}
                  className={`flex-1 py-1 text-[11px] font-bold rounded-md transition-all cursor-pointer ${
                    taskFilter === 'completed'
                      ? 'bg-white text-stone-900 shadow-2xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  Done ({tasks.filter((t) => (!activeCropId || t.cropId === activeCropId) && t.completed).length})
                </button>
                <button
                  onClick={() => setTaskFilter('all')}
                  className={`flex-1 py-1 text-[11px] font-bold rounded-md transition-all cursor-pointer ${
                    taskFilter === 'all'
                      ? 'bg-white text-stone-900 shadow-2xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  All ({tasks.filter((t) => !activeCropId || t.cropId === activeCropId).length})
                </button>
              </div>

              {/* Task list */}
              <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
                {filteredTasks.length === 0 ? (
                  <div className="py-8 text-center text-stone-400 text-xs">
                    No {taskFilter} tasks found for this crop.
                  </div>
                ) : (
                  filteredTasks.map((t) => (
                    <div
                      key={t.id}
                      className={`p-3 rounded-xl border text-xs transition-all ${
                        t.completed
                          ? 'bg-stone-50/70 border-stone-200 opacity-70'
                          : 'bg-white border-stone-200 hover:border-emerald-300 shadow-2xs'
                      }`}
                    >
                      <div className="flex items-start gap-2.5">
                        <button
                          onClick={() => handleToggleTask(t.id)}
                          className="mt-0.5 text-stone-400 hover:text-emerald-700 transition-colors cursor-pointer shrink-0"
                        >
                          {t.completed ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          ) : (
                            <Circle className="w-4 h-4 text-stone-300" />
                          )}
                        </button>

                        <div className="flex-1 min-w-0">
                          <span
                            className={`font-bold block ${
                              t.completed ? 'line-through text-stone-500' : 'text-stone-900'
                            }`}
                          >
                            {t.title}
                          </span>

                          <div className="flex items-center gap-2 text-[11px] text-stone-500 mt-1">
                            <span className="bg-stone-100 text-stone-700 px-1.5 py-0.2 rounded font-medium">
                              {t.category}
                            </span>
                            <span>Due: {t.dueDate}</span>
                            {t.estimatedCost && (
                              <span className="text-emerald-700 font-semibold">
                                ~{formatNaira(t.estimatedCost)}
                              </span>
                            )}
                          </div>

                          {t.notes && <p className="text-[11px] text-stone-500 mt-1 italic">{t.notes}</p>}

                          {!t.completed && onOpenQuickEntry && (
                            <div className="pt-2 mt-2 border-t border-stone-100 flex justify-end">
                              <button
                                onClick={() => onOpenQuickEntry(t.cropId, t.category)}
                                className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
                              >
                                <span>Log Expense for this</span>
                                <ArrowRight className="w-3 h-3" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Advisory Box */}
            <div className="bg-stone-900 text-white rounded-2xl p-4.5 space-y-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <h4 className="text-xs font-bold text-stone-100">Agricultural Extension Advisory</h4>
              </div>
              <p className="text-xs text-stone-300 leading-relaxed">
                Keeping input expenses below ₦180,000 per acre on irrigated vegetables typically yields an ROI &gt; 65% in Northern Nigerian seasonal cycles.
              </p>
              <div className="text-[11px] text-stone-400 pt-1 border-t border-stone-800">
                Data calibrated for Kano / Kaduna / Plateau soil zones.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New Task Modal */}
      {showNewTaskModal && (
        <div className="fixed inset-0 bg-stone-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 border border-stone-200 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-stone-100">
              <h3 className="text-sm font-bold text-stone-900">Schedule Agronomic Farm Task</h3>
              <button
                onClick={() => setShowNewTaskModal(false)}
                className="text-stone-400 hover:text-stone-700 text-xs font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-stone-700 block mb-1">Target Crop</label>
                <select
                  value={newTaskCropId}
                  onChange={(e) => setNewTaskCropId(e.target.value)}
                  className="w-full text-xs p-2 rounded-xl bg-stone-50 border border-stone-300 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  {crops.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.farmSizeAcres} ac)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-stone-700 block mb-1">Task Title</label>
                <input
                  type="text"
                  placeholder="e.g. 2nd Weeding and side-dressing fertilizer"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  required
                  className="w-full text-xs p-2 rounded-xl bg-stone-50 border border-stone-300 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-stone-700 block mb-1">Category</label>
                  <select
                    value={newTaskCategory}
                    onChange={(e) => setNewTaskCategory(e.target.value)}
                    className="w-full text-xs p-2 rounded-xl bg-stone-50 border border-stone-300 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    <option value="Labour">Labour</option>
                    <option value="Fertilizer">Fertilizer</option>
                    <option value="Chemicals">Chemicals</option>
                    <option value="Irrigation">Irrigation</option>
                    <option value="Harvesting">Harvesting</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-stone-700 block mb-1">Due Date</label>
                  <input
                    type="date"
                    value={newTaskDueDate}
                    onChange={(e) => setNewTaskDueDate(e.target.value)}
                    className="w-full text-xs p-2 rounded-xl bg-stone-50 border border-stone-300 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-stone-700 block mb-1">
                  Estimated Cost (₦) <span className="text-stone-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="number"
                  placeholder="e.g. 15000"
                  value={newTaskCost}
                  onChange={(e) => setNewTaskCost(e.target.value)}
                  className="w-full text-xs p-2 rounded-xl bg-stone-50 border border-stone-300 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-stone-700 block mb-1">
                  Agronomic Notes <span className="text-stone-400 font-normal">(Optional)</span>
                </label>
                <textarea
                  rows={2}
                  placeholder="Dosage, application technique, or safety measures..."
                  value={newTaskNotes}
                  onChange={(e) => setNewTaskNotes(e.target.value)}
                  className="w-full text-xs p-2 rounded-xl bg-stone-50 border border-stone-300 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setShowNewTaskModal(false)}
                  className="px-3.5 py-2 text-xs font-semibold text-stone-600 hover:text-stone-900 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingTask}
                  className="bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                >
                  {isSubmittingTask ? 'Saving...' : 'Add Farm Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
