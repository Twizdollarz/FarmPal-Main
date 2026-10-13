import React, { useState } from 'react';
import {
  Bell,
  Sparkles,
  Plus,
  ShoppingBag,
  MessageSquare,
  X,
  Shuffle,
  Volume2,
  VolumeX,
  Clock,
  Check,
} from 'lucide-react';
import { DailyReminder } from '../types';
import { playFriendlyChime } from '../lib/sound';

interface DailyReminderNotificationProps {
  reminder: DailyReminder | null;
  onClose: () => void;
  onRecordExpense: () => void;
  onRecordSale: () => void;
  onOpenWhatsApp: () => void;
  onShuffleReminder: () => Promise<void>;
  farmerName: string;
}

export const DailyReminderNotification: React.FC<DailyReminderNotificationProps> = ({
  reminder,
  onClose,
  onRecordExpense,
  onRecordSale,
  onOpenWhatsApp,
  onShuffleReminder,
  farmerName,
}) => {
  const [isShuffling, setIsShuffling] = useState(false);
  const [acknowledgedMsg, setAcknowledgedMsg] = useState<string | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);

  if (!reminder && !acknowledgedMsg) return null;

  const handleShuffle = async () => {
    setIsShuffling(true);
    try {
      await onShuffleReminder();
      if (soundEnabled) {
        playFriendlyChime();
      }
    } finally {
      setIsShuffling(false);
    }
  };

  const handleNothingToday = () => {
    setAcknowledgedMsg(
      `Understood ${farmerName}! 🙏 Resting well is an essential part of good farming. Have a peaceful evening! 🌿💤`
    );
    setTimeout(() => {
      setAcknowledgedMsg(null);
      onClose();
    }, 3500);
  };

  return (
    <div
      id="daily-reminder-banner"
      className="fixed bottom-4 right-4 z-50 max-w-md w-[calc(100vw-2rem)] sm:w-[420px] bg-white rounded-2xl shadow-2xl border-2 border-emerald-600/30 overflow-hidden transition-all duration-300 animate-in fade-in slide-in-from-bottom-5"
    >
      {/* Top Emerald Header */}
      <div className="bg-emerald-900 text-white px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="relative flex items-center justify-center">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping absolute" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
          </div>
          <div className="flex items-center gap-1.5">
            <Bell className="w-3.5 h-3.5 text-amber-300" />
            <span className="text-xs font-bold tracking-wide">Daily FarmPal Check-in</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-[10px] bg-emerald-800 text-emerald-200 px-2 py-0.5 rounded-md font-mono flex items-center gap-1">
            <Clock className="w-3 h-3 text-emerald-300" />
            {reminder?.time || '19:00'}
          </span>

          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            title={soundEnabled ? 'Mute reminder chime' : 'Enable reminder chime'}
            className="text-emerald-300 hover:text-white p-1 rounded-md transition-colors cursor-pointer"
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={onClose}
            aria-label="Dismiss reminder"
            className="text-emerald-300 hover:text-white p-1 rounded-md transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="p-4 bg-stone-50/50 space-y-3">
        {acknowledgedMsg ? (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 text-center space-y-1.5 animate-fade-in">
            <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center mx-auto">
              <Check className="w-4 h-4 stroke-[3]" />
            </div>
            <p className="text-xs font-medium text-emerald-900">{acknowledgedMsg}</p>
          </div>
        ) : (
          <>
            {/* Friendly Greeting & Message */}
            <div className="bg-white rounded-xl p-3.5 border border-stone-200 shadow-2xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-800">
                  {reminder?.greeting}
                </span>
                <span className="text-[10px] text-stone-400 font-medium">
                  {reminder?.source === 'ai' ? '✨ Smart AI Prompt' : '🌱 Daily Check-in'}
                </span>
              </div>
              <p className="text-xs text-stone-700 leading-relaxed font-normal">
                {reminder?.message}
              </p>
            </div>

            {/* Suggested 1-Tap Quick Action Pills */}
            {reminder?.quickReplies && reminder.quickReplies.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {reminder.quickReplies.map((reply, idx) => {
                  const isExpense = reply.includes('Spent') || reply.includes('Paid') || reply.includes('Inputs') || reply.includes('Bags') || reply.includes('Fuel');
                  const isSale = reply.includes('Sold') || reply.includes('Crates') || reply.includes('Harvest') || reply.includes('Sales') || reply.includes('Payment');
                  const isQuiet = reply.includes('Nothing') || reply.includes('Resting') || reply.includes('Quiet') || reply.includes('Done') || reply.includes('komai');

                  const handleClick = () => {
                    if (isExpense) onRecordExpense();
                    else if (isSale) onRecordSale();
                    else if (isQuiet) handleNothingToday();
                    else onOpenWhatsApp();
                  };

                  return (
                    <button
                      key={idx}
                      onClick={handleClick}
                      className="text-[11px] font-semibold px-2.5 py-1 rounded-lg border transition-all active:scale-95 cursor-pointer flex items-center gap-1 bg-white hover:bg-emerald-50 text-stone-800 border-stone-300 hover:border-emerald-500 shadow-2xs"
                    >
                      <span>{reply}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Main Action Buttons */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                id="btn-reminder-record-expense"
                onClick={onRecordExpense}
                className="flex items-center justify-center gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white py-2 px-3 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95"
              >
                <Plus className="w-3.5 h-3.5 stroke-[3]" />
                <span>Record Expense</span>
              </button>

              <button
                id="btn-reminder-record-sale"
                onClick={onRecordSale}
                className="flex items-center justify-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-stone-950 py-2 px-3 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95"
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>Record Sale</span>
              </button>
            </div>

            {/* Bottom auxiliary toolbar */}
            <div className="flex items-center justify-between pt-1 text-[11px] text-stone-500 border-t border-stone-200/70">
              <button
                onClick={onOpenWhatsApp}
                className="flex items-center gap-1 text-emerald-700 hover:text-emerald-900 font-semibold cursor-pointer transition-colors"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Reply in WhatsApp</span>
              </button>

              <button
                onClick={handleShuffle}
                disabled={isShuffling}
                className="flex items-center gap-1 text-stone-600 hover:text-stone-900 font-medium cursor-pointer transition-colors"
                title="Generates a different friendly reminder message"
              >
                <Shuffle className={`w-3.5 h-3.5 ${isShuffling ? 'animate-spin text-emerald-600' : ''}`} />
                <span>Different message</span>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
