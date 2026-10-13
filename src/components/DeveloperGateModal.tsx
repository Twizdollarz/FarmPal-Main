import React, { useState } from 'react';
import { Shield, KeyRound, Lock, Unlock, AlertCircle, CheckCircle2, X, Terminal, Sparkles } from 'lucide-react';

interface DeveloperGateModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDeveloperMode: boolean;
  onUnlock: () => void;
  onLock: () => void;
}

const VALID_PASSCODES = ['farmpal2026', 'admin2026', 'nwobodo', 'dev', 'admin'];

export const DeveloperGateModal: React.FC<DeveloperGateModalProps> = ({
  isOpen,
  onClose,
  isDeveloperMode,
  onUnlock,
  onLock,
}) => {
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const clean = passcode.trim().toLowerCase();

    if (VALID_PASSCODES.includes(clean)) {
      setSuccess(true);
      setTimeout(() => {
        onUnlock();
        setSuccess(false);
        setPasscode('');
        onClose();
      }, 500);
    } else {
      setError('Invalid developer passcode. Access restricted to project administrators.');
    }
  };

  const handleAutoUnlock = () => {
    setSuccess(true);
    setTimeout(() => {
      onUnlock();
      setSuccess(false);
      setPasscode('');
      onClose();
    }, 400);
  };

  const handleDeactivate = () => {
    onLock();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white dark:bg-[#1C1C1E] rounded-3xl max-w-md w-full p-6 shadow-2xl border border-stone-200 dark:border-white/10 space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-stone-100 dark:border-white/5">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-2xl ${isDeveloperMode ? 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300' : 'bg-stone-100 dark:bg-white/10 text-stone-700 dark:text-stone-300'}`}>
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-stone-900 dark:text-white flex items-center gap-2">
                <span>Developer Access Gate</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/40 text-purple-800 dark:text-purple-300 font-bold">
                  RESTRICTED
                </span>
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Authorized developer portal for Nwobodo Temple
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-stone-100 dark:hover:bg-white/10 text-stone-400 hover:text-stone-600 dark:hover:text-white transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Status notice */}
        {isDeveloperMode ? (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800/40 text-purple-900 dark:text-purple-200 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold">
                <CheckCircle2 className="w-4 h-4 text-purple-600" />
                <span>Developer Session Active</span>
              </div>
              <p className="text-xs text-stone-600 dark:text-stone-300">
                You currently have full administrative visibility. Normal deployed users cannot see the Admin Console or telemetry.
              </p>
              <div className="text-[11px] font-mono text-purple-700 dark:text-purple-400 pt-1">
                Account: nwobodotemple2002@gmail.com
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={handleDeactivate}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-colors cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Lock & Return to User Mode</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2.5 rounded-xl text-xs font-bold bg-stone-900 dark:bg-white text-white dark:text-stone-900 hover:opacity-90 transition-opacity cursor-pointer"
              >
                Continue
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleVerify} className="space-y-4">
            <p className="text-xs text-stone-600 dark:text-stone-300">
              The admin dashboard is hidden by default in production. Enter your developer passcode to unlock the Master Admin Console and platform telemetry.
            </p>

            {error && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Developer access verified! Launching Admin Console...</span>
              </div>
            )}

            <div>
              <label className="text-xs font-semibold text-stone-700 dark:text-stone-300 block mb-1.5 flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-stone-400" />
                <span>Developer Passcode</span>
              </label>
              <input
                type="password"
                autoFocus
                placeholder="Enter passcode (e.g. farmpal2026)"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                className="w-full text-xs p-3 rounded-xl bg-stone-50 dark:bg-white/5 border border-stone-200 dark:border-white/10 text-stone-900 dark:text-white placeholder:text-stone-400 font-mono tracking-wider focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            {/* Quick Developer Auto-Unlock for Developer */}
            <div className="pt-1">
              <button
                type="button"
                onClick={handleAutoUnlock}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/40 border border-purple-200/80 dark:border-purple-800/50 transition-colors cursor-pointer"
              >
                <Terminal className="w-3.5 h-3.5" />
                <span>Auto-Unlock Developer Console (Nwobodo Temple)</span>
              </button>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100 dark:border-white/5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-white/5 cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="submit"
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-purple-700 hover:bg-purple-800 text-white shadow-xs cursor-pointer transition-colors"
              >
                <Unlock className="w-3.5 h-3.5" />
                <span>Unlock Admin</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
