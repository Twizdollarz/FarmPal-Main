import React, { useState } from 'react';
import { Phone, RotateCcw, X, Send, WifiOff, CheckCircle } from 'lucide-react';
import { UssdSessionResponse } from '../types';

interface UssdSimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRecordAdded?: () => void;
}

export const UssdSimulatorModal: React.FC<UssdSimulatorModalProps> = ({
  isOpen,
  onClose,
  onRecordAdded,
}) => {
  const [sessionInput, setSessionInput] = useState('*384*24#');
  const [currentScreenText, setCurrentScreenText] = useState(
    'FarmPal Offline USSD (*384*24#)\n\nPress "CALL / SEND" to connect to FarmPal without internet or smartphone data.'
  );
  const [sessionActive, setSessionActive] = useState(false);
  const [isSessionEnded, setIsSessionEnded] = useState(false);
  const [currentTypedInput, setCurrentTypedInput] = useState('');
  const [sessionHistory, setSessionHistory] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const startSession = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/ussd', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: '' }),
      });
      const data: UssdSessionResponse = await res.json();
      setCurrentScreenText(data.message);
      setSessionActive(true);
      setIsSessionEnded(data.action === 'END');
      setSessionHistory([]);
      setCurrentTypedInput('');
    } catch (err) {
      console.error('USSD connection failed:', err);
      setCurrentScreenText('Network Error: Unable to reach USSD gateway. Check network signal.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendInput = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!sessionActive) {
      startSession();
      return;
    }

    if (!currentTypedInput.trim()) return;

    const newHistory = [...sessionHistory, currentTypedInput.trim()];
    const textQuery = newHistory.join('*');

    setIsLoading(true);
    try {
      const res = await fetch('/api/ussd', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: textQuery }),
      });
      const data: UssdSessionResponse = await res.json();
      setCurrentScreenText(data.message);
      setSessionHistory(newHistory);
      setCurrentTypedInput('');

      if (data.action === 'END') {
        setIsSessionEnded(true);
        if (onRecordAdded) {
          onRecordAdded();
        }
      }
    } catch (err) {
      console.error('USSD error:', err);
      setCurrentScreenText('Connection timed out. Please try dialling *384*24# again.');
      setIsSessionEnded(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeypadPress = (val: string) => {
    if (!sessionActive) {
      setSessionInput((prev) => prev + val);
    } else {
      setCurrentTypedInput((prev) => prev + val);
    }
  };

  const handleClear = () => {
    if (!sessionActive) {
      setSessionInput('');
    } else {
      setCurrentTypedInput((prev) => prev.slice(0, -1));
    }
  };

  const handleResetSession = () => {
    setSessionActive(false);
    setIsSessionEnded(false);
    setSessionHistory([]);
    setCurrentTypedInput('');
    setSessionInput('*384*24#');
    setCurrentScreenText(
      'FarmPal Offline USSD (*384*24#)\n\nPress "CALL / SEND" to connect to FarmPal without internet or smartphone data.'
    );
  };

  return (
    <div className="fixed inset-0 bg-stone-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-stone-900 rounded-3xl p-5 max-w-sm w-full border-4 border-stone-800 shadow-2xl relative text-stone-200 flex flex-col items-center">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-stone-400 hover:text-white p-1 rounded-full cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Earpiece speaker & brand header */}
        <div className="w-12 h-1.5 bg-stone-700 rounded-full mb-3" />
        <div className="flex items-center gap-1.5 text-[11px] font-bold tracking-widest text-stone-400 uppercase mb-3">
          <WifiOff className="w-3.5 h-3.5 text-emerald-400" />
          <span>FarmPal USSD • Offline Mode</span>
        </div>

        {/* Feature Phone LCD Screen */}
        <div className="w-full bg-[#1b2f24] border-2 border-[#2b4c39] rounded-xl p-3.5 shadow-inner mb-4 min-h-[160px] flex flex-col justify-between font-mono text-emerald-300">
          <div className="flex justify-between items-center text-[10px] text-emerald-400/80 border-b border-emerald-800/40 pb-1 mb-2">
            <span>MTN-NG | AIRTEL</span>
            <span>📶 Full Signal</span>
          </div>

          <div className="text-xs whitespace-pre-wrap leading-relaxed flex-1 overflow-y-auto max-h-[140px] text-emerald-200">
            {isLoading ? (
              <div className="flex items-center gap-2 py-4">
                <span className="animate-spin inline-block w-3 h-3 border-2 border-emerald-400 border-t-transparent rounded-full" />
                <span>Requesting...</span>
              </div>
            ) : (
              currentScreenText
            )}
          </div>

          {/* User input display bar */}
          <div className="mt-2 pt-1 border-t border-emerald-800/40 flex items-center justify-between text-xs">
            <span className="text-emerald-500 text-[10px]">
              {sessionActive ? (isSessionEnded ? 'SESSION ENDED' : 'INPUT:') : 'DIAL:'}
            </span>
            <span className="font-bold text-emerald-100 font-mono">
              {sessionActive ? currentTypedInput || '—' : sessionInput}
            </span>
          </div>
        </div>

        {/* Controls and Keypad */}
        <form onSubmit={handleSendInput} className="w-full space-y-3">
          {sessionActive && !isSessionEnded && (
            <div className="flex items-center gap-1.5">
              <input
                type="text"
                autoFocus
                placeholder="Type choice or amount..."
                value={currentTypedInput}
                onChange={(e) => setCurrentTypedInput(e.target.value)}
                className="flex-1 text-xs px-3 py-2 bg-stone-800 border border-stone-700 rounded-xl text-white focus:outline-none focus:border-emerald-500 font-mono"
              />
              <button
                type="submit"
                disabled={isLoading}
                className="bg-emerald-600 hover:bg-emerald-700 text-white p-2 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Action Row */}
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => {
                if (!sessionActive || isSessionEnded) startSession();
                else handleSendInput();
              }}
              disabled={isLoading}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1 transition-colors cursor-pointer col-span-2 shadow-xs"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>{!sessionActive ? 'DIAL *384*24#' : isSessionEnded ? 'DIAL AGAIN' : 'SEND CHOICE'}</span>
            </button>

            <button
              type="button"
              onClick={handleResetSession}
              className="bg-stone-800 hover:bg-stone-700 text-stone-300 font-semibold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>RESET</span>
            </button>
          </div>

          {/* Number Pad Grid */}
          <div className="grid grid-cols-3 gap-2 pt-1">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'].map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => handleKeypadPress(key)}
                className="bg-stone-800 hover:bg-stone-700 active:bg-stone-600 text-white font-bold py-2 rounded-xl text-sm transition-colors cursor-pointer border border-stone-700/60 shadow-2xs font-mono"
              >
                {key}
              </button>
            ))}
          </div>

          <div className="flex justify-between items-center text-[10px] text-stone-400 px-1 pt-1">
            <span>Simulates low-cost GSM feature phone</span>
            <button
              type="button"
              onClick={handleClear}
              className="text-stone-400 hover:text-white cursor-pointer"
            >
              CLEAR ⌫
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
