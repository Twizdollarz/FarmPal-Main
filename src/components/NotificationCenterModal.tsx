import React, { useState, useEffect } from 'react';
import {
  Bell,
  BellRing,
  Clock,
  Shuffle,
  Send,
  CheckCircle2,
  X,
  MessageSquare,
  Sparkles,
  Smartphone,
  Plus,
  ShoppingBag,
} from 'lucide-react';
import { DailyReminder, FarmerProfile } from '../types';
import { playFriendlyChime } from '../lib/sound';

interface NotificationCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: FarmerProfile;
  currentReminder: DailyReminder | null;
  onTriggerNewReminder: () => Promise<DailyReminder | null>;
  onSendToWhatsApp: (reminder: DailyReminder) => void;
  onRecordExpense: () => void;
  onRecordSale: () => void;
}

export const NotificationCenterModal: React.FC<NotificationCenterModalProps> = ({
  isOpen,
  onClose,
  profile,
  currentReminder,
  onTriggerNewReminder,
  onSendToWhatsApp,
  onRecordExpense,
  onRecordSale,
}) => {
  const [activeReminder, setActiveReminder] = useState<DailyReminder | null>(currentReminder);
  const [loading, setLoading] = useState(false);
  const [browserPermission, setBrowserPermission] = useState<NotificationPermission>(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (currentReminder) {
      setActiveReminder(currentReminder);
    }
  }, [currentReminder]);

  if (!isOpen) return null;

  const handleShuffle = async () => {
    setLoading(true);
    try {
      const fresh = await onTriggerNewReminder();
      if (fresh) {
        setActiveReminder(fresh);
        playFriendlyChime();
        setFeedback('Loaded a fresh, unique reminder message!');
        setTimeout(() => setFeedback(null), 3000);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRequestBrowserNotification = async () => {
    if (typeof Notification === 'undefined') {
      alert('Your browser does not support native desktop notifications.');
      return;
    }
    const perm = await Notification.requestPermission();
    setBrowserPermission(perm);
    if (perm === 'granted' && activeReminder) {
      new Notification('FarmPal Daily Check-in 🌾', {
        body: activeReminder.message,
        icon: '/favicon.ico',
      });
      setFeedback('Browser notification permission granted & test sent!');
      setTimeout(() => setFeedback(null), 3500);
    }
  };

  const handleDispatchTest = () => {
    if (!activeReminder) return;
    onSendToWhatsApp(activeReminder);
    playFriendlyChime();
    setFeedback('Dispatched to WhatsApp Simulator & In-App notification bar!');
    setTimeout(() => setFeedback(null), 3500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-emerald-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-800 flex items-center justify-center text-amber-300">
              <BellRing className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold">Daily Reminders & Check-ins</h2>
              <p className="text-xs text-emerald-200">
                Friendly, relatable daily prompts for your farm expenses & sales
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-emerald-300 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-5 space-y-4 overflow-y-auto">
          {feedback && (
            <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 animate-fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{feedback}</span>
            </div>
          )}

          {/* Status Bar */}
          <div className="bg-stone-50 rounded-2xl p-4 border border-stone-200 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-stone-900 block">
                  Scheduled Daily Time
                </span>
                <span className="text-[11px] text-stone-500">
                  {profile.dailyReminderTime || '19:00'} (Evening Wind-down)
                </span>
              </div>
            </div>
            <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-100/70 px-2.5 py-1 rounded-full border border-emerald-300">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Active
            </span>
          </div>

          {/* Active Reminder Preview Card */}
          <div className="bg-gradient-to-br from-emerald-50/50 to-stone-50 rounded-2xl p-4 border border-emerald-200 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-emerald-900">
                  {activeReminder?.greeting || `Sanu ${profile.name || 'Musa'}! 🌾`}
                </span>
                <span className="text-[10px] bg-emerald-200/60 text-emerald-800 font-semibold px-2 py-0.5 rounded-full">
                  {activeReminder?.source === 'ai' ? 'AI Dynamic' : 'Rotating Pool'}
                </span>
              </div>
              <button
                onClick={handleShuffle}
                disabled={loading}
                className="flex items-center gap-1 text-xs font-bold text-emerald-700 hover:text-emerald-900 bg-white hover:bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-300 transition-all cursor-pointer shadow-2xs active:scale-95"
                title="Cycles to another distinct friendly message"
              >
                <Shuffle className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                <span>Different message</span>
              </button>
            </div>

            <p className="text-xs text-stone-700 leading-relaxed font-normal bg-white p-3 rounded-xl border border-stone-200">
              "{activeReminder?.message}"
            </p>

            {/* Quick action preview */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {activeReminder?.quickReplies?.map((r, i) => (
                <span
                  key={i}
                  className="text-[10px] font-semibold bg-white text-stone-700 px-2 py-1 rounded-lg border border-stone-200"
                >
                  {r}
                </span>
              ))}
            </div>
          </div>

          {/* Actions grid */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-stone-800 block">Trigger Actions</span>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleDispatchTest}
                className="flex items-center justify-center gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white py-2.5 px-3 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send WhatsApp Check-in</span>
              </button>

              <button
                onClick={() => {
                  onRecordExpense();
                  onClose();
                }}
                className="flex items-center justify-center gap-1.5 bg-stone-900 hover:bg-stone-800 text-white py-2.5 px-3 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95"
              >
                <Plus className="w-3.5 h-3.5 text-emerald-400 stroke-[3]" />
                <span>Record Expense</span>
              </button>
            </div>
          </div>

          {/* Browser Notification Section */}
          <div className="bg-stone-50 rounded-2xl p-3.5 border border-stone-200 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-stone-900 block">Browser Push Notifications</span>
              <p className="text-[11px] text-stone-500">
                Receive reminders even when the tab is running in the background.
              </p>
            </div>
            {browserPermission === 'granted' ? (
              <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-xl">
                Allowed
              </span>
            ) : (
              <button
                onClick={handleRequestBrowserNotification}
                className="bg-white hover:bg-stone-100 text-stone-800 border border-stone-300 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Enable
              </button>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-stone-100 px-5 py-3 border-t border-stone-200 flex items-center justify-between text-xs text-stone-500">
          <span>Non-repeating culturally authentic prompts</span>
          <button
            onClick={onClose}
            className="font-bold text-stone-700 hover:text-stone-900 px-3 py-1.5 rounded-xl hover:bg-stone-200 cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
