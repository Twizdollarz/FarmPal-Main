import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Clock,
  RotateCcw,
  Split,
  ChevronRight,
  Phone,
  Video,
  MoreVertical,
  Mic,
  Play,
  Pause,
  Bell,
  MessageSquare,
} from 'lucide-react';
import { WhatsAppMessage, Crop } from '../types';
import { formatNaira } from '../lib/i18n';
import { FarmpalEmblem } from './FarmpalLogo';

interface WhatsAppSimulatorProps {
  activeCrops: Crop[];
  onRefreshData: () => Promise<void>;
  onOpenUssdModal?: () => void;
  onOpenLinkModal?: () => void;
}

export const WhatsAppSimulator: React.FC<WhatsAppSimulatorProps> = ({
  activeCrops,
  onRefreshData,
  onOpenUssdModal,
  onOpenLinkModal,
}) => {
  const [messages, setMessages] = useState<WhatsAppMessage[]>([
    {
      id: 'msg-1',
      sender: 'farmpal',
      text: `Good day Musa! 👋\n\nI am FarmPal, your farm notebook.\nYou can speak or text me just like a WhatsApp friend:\n\n• "I spent 20k on labour, 15k on fertilizer and 5k on fuel today"\n• "What is tomato price in Lagos today?"\n• "Am I on budget for tomato?"\n• "What is the next task for cucumber?"\n• "Sold 20 crates of tomato to Mama Chidi on credit for 160k"\n• "Mama Chidi paid 160k balance today"`,
      timestamp: '08:00 AM',
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const samplePrompts = [
    'What is tomato price in Lagos today?',
    'Am I on budget for tomato?',
    'What is the next task for cucumber?',
    'I spent 20k on labour, 15k on fertilizer and 5k on fuel today',
    'Sold 20 crates of tomato to Mama Chidi on credit for 160k',
    'Mama Chidi paid 160k',
    'Market price for sweetcorn',
    'I harvested 40 bags of cucumber',
  ];

  const voicePresets = [
    {
      title: 'Labour & Weeding',
      text: 'I just paid 15k for 3 labourers to weed the cucumber plot',
      duration: '0:06',
    },
    {
      title: 'Debtor Payment Collection',
      text: 'Mama Chidi paid 160k balance today',
      duration: '0:04',
    },
    {
      title: 'Credit Sale to Buyer',
      text: 'Sold 20 crates of tomato to Mama Chidi on credit for 160k',
      duration: '0:07',
    },
  ];

  const handleSendMessage = async (customText?: string, isVoice: boolean = false, duration?: string) => {
    const text = (customText || inputText).trim();
    if (!text) return;

    // Add farmer message
    const farmerMsg: WhatsAppMessage = {
      id: `msg-${Date.now()}`,
      sender: 'farmer',
      text,
      isVoiceNote: isVoice,
      audioDuration: duration,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, farmerMsg]);
    if (!customText) setInputText('');
    setShowVoiceRecorder(false);
    setIsTyping(true);

    try {
      const res = await fetch('/api/whatsapp/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
      });
      const data = await res.json();

      setIsTyping(false);
      const botMsg: WhatsAppMessage = {
        id: `msg-${Date.now() + 1}`,
        sender: 'farmpal',
        text: data.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        pendingAction: data.parsedAction,
      };
      setMessages((prev) => [...prev, botMsg]);

      // If it was an auto-saved message, trigger data reload
      if (!data.parsedAction && (text.toLowerCase().includes('spent') || text.toLowerCase().includes('paid'))) {
        await onRefreshData();
      }
    } catch (err) {
      setIsTyping(false);
      setMessages((prev) => [
        ...prev,
        {
          id: `msg-${Date.now() + 1}`,
          sender: 'farmpal',
          text: 'Network issue connecting to FarmPal engine. Please try again.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    }
  };

  // Execute interactive pending action
  const handleExecuteAction = async (msgId: string, actionType: string, actionData: any) => {
    try {
      const res = await fetch('/api/whatsapp/execute-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actionType, data: actionData }),
      });
      const result = await res.json();

      // Clear pending action from message
      setMessages((prev) =>
        prev.map((m) => (m.id === msgId ? { ...m, pendingAction: undefined } : m))
      );

      // Add confirmation reply
      setMessages((prev) => [
        ...prev,
        {
          id: `msg-${Date.now()}`,
          sender: 'farmpal',
          text: result.message || 'Saved successfully! 🌱',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);

      await onRefreshData();
    } catch (err) {
      console.error('Error executing action:', err);
    }
  };

  // Simulate Daily Check-in reminder (fetches a fresh, friendly reminder every time)
  const handleTriggerDailyReminder = async () => {
    try {
      const res = await fetch('/api/reminders/daily?forceNew=true');
      if (res.ok) {
        const reminder = await res.json();
        const reminderMsg: WhatsAppMessage = {
          id: `rem-${Date.now()}`,
          sender: 'farmpal',
          text: `${reminder.greeting}\n\n${reminder.message}`,
          timestamp: reminder.timestamp || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isReminder: true,
          quickReplies: reminder.quickReplies || ['💸 Spent on Labour/Inputs', '🧺 Sold Harvest Today', '😴 Nothing Spent Today'],
        };
        setMessages((prev) => [...prev, reminderMsg]);
        return;
      }
    } catch (err) {
      console.error('Error triggering daily reminder:', err);
    }

    // Fallback if API fails
    const fallbackMsg: WhatsAppMessage = {
      id: `msg-${Date.now()}`,
      sender: 'farmpal',
      text: `Sanu Musa! 🌾 Hope farm work went smoothly today?\n\nJust checking in before you relax: did you buy fuel, pay any labourers, or sell any crates or bags today? Even small ₦500 counts o! Drop it here make I note am.`,
      timestamp: '07:00 PM',
      isReminder: true,
      quickReplies: ['💸 Paid Labour/Fuel', '🧺 Sold Some Crates', '😴 Nothing Spent Today'],
    };
    setMessages((prev) => [...prev, fallbackMsg]);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      {/* Overview explanation banner */}
      <div className="bg-emerald-950 text-white p-4.5 rounded-2xl border border-emerald-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <h3 className="text-sm font-bold text-white">Live WhatsApp Assistant Engine</h3>
          </div>
          <p className="text-xs text-emerald-200/80 mt-0.5">
            Test natural farmer speech, voice notes, multi-expense parsing, credit sales, and debt collection.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          {onOpenLinkModal && (
            <button
              onClick={onOpenLinkModal}
              title="Connect to real WhatsApp via Meta Cloud API Webhook"
              className="bg-[#25D366] hover:bg-[#20ba5a] active:scale-95 text-white px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shrink-0 cursor-pointer shadow-sm"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Link Actual WhatsApp</span>
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            </button>
          )}
          {onOpenUssdModal && (
            <button
              onClick={onOpenUssdModal}
              className="bg-stone-900 hover:bg-stone-800 text-emerald-300 border border-emerald-700 px-3 py-1.5 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition-colors shrink-0 cursor-pointer"
            >
              <Phone className="w-3.5 h-3.5 text-emerald-400" />
              <span>*384*24# USSD</span>
            </button>
          )}
          <button
            onClick={() => setShowVoiceRecorder(!showVoiceRecorder)}
            className="bg-emerald-800 hover:bg-emerald-700 text-emerald-100 px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shrink-0 cursor-pointer"
          >
            <Mic className="w-3.5 h-3.5 text-emerald-300" />
            <span>Simulate Voice Note</span>
          </button>
          <button
            id="btn-trigger-daily-reminder"
            onClick={handleTriggerDailyReminder}
            title="Sends a fresh, friendly reminder (different every time)"
            className="bg-emerald-800 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shrink-0 cursor-pointer border border-emerald-600 shadow-sm active:scale-95"
          >
            <Bell className="w-3.5 h-3.5 text-amber-300" />
            <span>Daily Check-in Reminder</span>
            <span className="text-[10px] bg-emerald-950/80 text-emerald-200 px-1.5 py-0.2 rounded-md font-mono">7 PM</span>
          </button>
        </div>
      </div>

      {/* Voice Note Selector Popover */}
      {showVoiceRecorder && (
        <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 space-y-2.5 animate-fade-in">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
              <Mic className="w-4 h-4 text-emerald-600" />
              Select a simulated farmer WhatsApp voice note:
            </span>
            <button
              onClick={() => setShowVoiceRecorder(false)}
              className="text-xs text-emerald-700 hover:text-emerald-950 font-semibold cursor-pointer"
            >
              Cancel
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {voicePresets.map((vp) => (
              <button
                key={vp.title}
                onClick={() => handleSendMessage(vp.text, true, vp.duration)}
                className="p-3 bg-white hover:bg-emerald-100/60 rounded-xl border border-emerald-200 text-left transition-all cursor-pointer shadow-2xs group"
              >
                <div className="flex items-center justify-between text-[11px] font-bold text-emerald-900 mb-1">
                  <span>{vp.title}</span>
                  <span className="text-emerald-600 font-mono text-[10px]">{vp.duration}</span>
                </div>
                <p className="text-xs text-stone-600 italic line-clamp-2">"{vp.text}"</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Suggested Quick Test Prompts */}
      <div className="space-y-1.5">
        <span className="text-xs font-semibold text-stone-600 block">
          Quick test natural language inputs:
        </span>
        <div className="flex flex-wrap gap-2">
          {samplePrompts.map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(prompt)}
              className="text-xs bg-white hover:bg-emerald-50 text-stone-700 hover:text-emerald-800 px-3 py-1.5 rounded-full border border-stone-200 hover:border-emerald-300 transition-all text-left shadow-2xs cursor-pointer"
            >
              "{prompt}"
            </button>
          ))}
        </div>
      </div>

      {/* Phone Mockup Window */}
      <div className="bg-[#e5ddd5] rounded-3xl shadow-xl border-4 border-stone-800 overflow-hidden max-w-xl mx-auto flex flex-col h-[580px]">
        {/* WhatsApp Top Bar */}
        <div className="bg-[#075e54] text-white px-4 py-3 flex items-center justify-between shadow-sm shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center p-1.5 shadow-sm shrink-0">
              <FarmpalEmblem color="#3ca83b" className="w-full h-full" />
            </div>
            <div>
              <h4 className="text-sm font-semibold tracking-tight text-white flex items-center gap-1.5">
                <span>FarmPal Assistant</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-300" />
              </h4>
              <p className="text-[11px] text-emerald-100/80">Active now • Ready for records</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-emerald-100">
            {onOpenLinkModal && (
              <button
                onClick={onOpenLinkModal}
                title="Connect live WhatsApp webhook"
                className="text-[10px] bg-white/20 hover:bg-white/30 text-white px-2 py-0.5 rounded-full transition-colors font-medium cursor-pointer"
              >
                Link Bot
              </button>
            )}
            <Phone className="w-4 h-4 opacity-70" />
            <Video className="w-4 h-4 opacity-70" />
            <MoreVertical className="w-4 h-4 opacity-70" />
          </div>
        </div>

        {/* Message Stream */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3">
          {messages.map((msg) => {
            const isFarmer = msg.sender === 'farmer';
            const isAudioPlaying = playingAudioId === msg.id;

            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isFarmer ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed shadow-2xs ${
                    isFarmer
                      ? 'bg-[#dcf8c6] text-stone-900 rounded-tr-none'
                      : 'bg-white text-stone-900 rounded-tl-none border border-stone-200/50'
                  }`}
                >
                  {/* Reminder Badge */}
                  {msg.isReminder && (
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md mb-2 border border-emerald-200 w-fit">
                      <Bell className="w-3 h-3 text-amber-500" />
                      <span>Daily Check-in Reminder</span>
                    </div>
                  )}

                  {/* Voice Note Audio Player */}
                  {msg.isVoiceNote ? (
                    <div className="space-y-2 mb-1">
                      <div className="flex items-center gap-3 bg-emerald-100/70 p-2.5 rounded-xl border border-emerald-300/60">
                        <button
                          type="button"
                          onClick={() => setPlayingAudioId(isAudioPlaying ? null : msg.id)}
                          className="w-8 h-8 rounded-full bg-emerald-700 hover:bg-emerald-800 text-white flex items-center justify-center shrink-0 shadow-xs cursor-pointer"
                        >
                          {isAudioPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                        </button>
                        <div className="flex-1">
                          <div className="flex items-center gap-1 h-4">
                            {[40, 70, 30, 90, 60, 45, 80, 65, 35, 75, 50, 85].map((h, idx) => (
                              <span
                                key={idx}
                                className={`w-1 rounded-full transition-all ${
                                  isAudioPlaying ? 'bg-emerald-600 animate-pulse' : 'bg-emerald-400'
                                }`}
                                style={{ height: `${h}%` }}
                              />
                            ))}
                          </div>
                        </div>
                        <span className="text-[11px] font-mono text-emerald-800 font-semibold">
                          {msg.audioDuration || '0:06'}
                        </span>
                      </div>
                      <p className="text-[11px] text-stone-700 italic bg-white/70 p-2 rounded-lg border border-emerald-200/40">
                        "{msg.text}"
                      </p>
                    </div>
                  ) : (
                    <p className="whitespace-pre-line">{msg.text}</p>
                  )}

                  <span className="text-[10px] text-stone-400 block text-right mt-1">
                    {msg.timestamp}
                  </span>

                  {/* Pending Interactive Action Bar */}
                  {msg.pendingAction && (
                    <div className="mt-3 pt-2.5 border-t border-stone-200/80 space-y-2">
                      {/* Confirm Multi-Expenses Action */}
                      {msg.pendingAction.type === 'confirm_expenses' && (
                        <div className="space-y-1.5">
                          <button
                            onClick={() =>
                              handleExecuteAction(msg.id, 'confirm_expenses', msg.pendingAction?.data)
                            }
                            className="w-full bg-[#075e54] hover:bg-[#064e46] text-white py-2 px-3 rounded-xl font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Save All {msg.pendingAction.data.expenses?.length} Expenses</span>
                          </button>
                        </div>
                      )}

                      {/* Confirm Sale Action */}
                      {msg.pendingAction.type === 'confirm_sale' && (
                        <button
                          onClick={() =>
                            handleExecuteAction(msg.id, 'confirm_sale', msg.pendingAction?.data)
                          }
                          className="w-full bg-[#075e54] hover:bg-[#064e46] text-white py-2 px-3 rounded-xl font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>
                            Confirm Sale ({formatNaira(msg.pendingAction.data.totalRevenue)})
                            {msg.pendingAction.data.isCredit ? ' [On Credit]' : ''}
                          </span>
                        </button>
                      )}

                      {/* Confirm Debt Payment Action */}
                      {msg.pendingAction.type === 'confirm_debt_payment' && (
                        <button
                          onClick={() =>
                            handleExecuteAction(
                              msg.id,
                              'confirm_debt_payment',
                              msg.pendingAction?.data
                            )
                          }
                          className="w-full bg-[#075e54] hover:bg-[#064e46] text-white py-2 px-3 rounded-xl font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>
                            Record Payment ({formatNaira(msg.pendingAction.data.amountPaid)})
                          </span>
                        </button>
                      )}

                      {/* Confirm Harvest Action */}
                      {msg.pendingAction.type === 'confirm_harvest' && (
                        <button
                          onClick={() =>
                            handleExecuteAction(msg.id, 'confirm_harvest', msg.pendingAction?.data)
                          }
                          className="w-full bg-[#075e54] hover:bg-[#064e46] text-white py-2 px-3 rounded-xl font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Confirm Harvest Record</span>
                        </button>
                      )}

                      {/* Split Shared Expense Action */}
                      {msg.pendingAction.type === 'split_expense' && (
                        <div className="space-y-1.5">
                          <button
                            onClick={() => {
                              const crops = msg.pendingAction?.data.crops || [];
                              const total = msg.pendingAction?.data.totalAmount;
                              const equalPct = Math.round(100 / crops.length);
                              let running = 0;
                              const allocations = crops.map((c: any, i: number) => {
                                let amt = Math.round((equalPct / 100) * total);
                                if (i === crops.length - 1) amt = total - running;
                                else running += amt;
                                return {
                                  cropId: c.id,
                                  cropName: c.name,
                                  percentage: equalPct,
                                  allocatedAmount: amt,
                                };
                              });
                              handleExecuteAction(msg.id, 'split_expense', {
                                categoryName: msg.pendingAction?.data.categoryName,
                                totalAmount: total,
                                allocations,
                              });
                            }}
                            className="w-full bg-emerald-700 hover:bg-emerald-800 text-white py-2 px-3 rounded-xl font-semibold text-xs transition-colors text-center"
                          >
                            1. Split 50/50 ({formatNaira(msg.pendingAction.data.totalAmount / 2)} each)
                          </button>
                          <button
                            onClick={() => {
                              // Split by farm size (e.g. 2 acres Tomato vs 1 acre Cucumber = 60/40)
                              const crops = msg.pendingAction?.data.crops || [];
                              const total = msg.pendingAction?.data.totalAmount;
                              const totalAcres = crops.reduce((s: number, c: any) => s + (c.farmSizeAcres || 1), 0);
                              let running = 0;
                              const allocations = crops.map((c: any, i: number) => {
                                const pct = Math.round(((c.farmSizeAcres || 1) / totalAcres) * 100);
                                let amt = Math.round((pct / 100) * total);
                                if (i === crops.length - 1) amt = total - running;
                                else running += amt;
                                return {
                                  cropId: c.id,
                                  cropName: c.name,
                                  percentage: pct,
                                  allocatedAmount: amt,
                                };
                              });
                              handleExecuteAction(msg.id, 'split_expense', {
                                categoryName: msg.pendingAction?.data.categoryName,
                                totalAmount: total,
                                allocations,
                              });
                            }}
                            className="w-full bg-stone-100 hover:bg-stone-200 text-stone-800 py-1.5 px-3 rounded-xl font-medium text-xs transition-colors text-center"
                          >
                            2. Split by Farm Size (Tomato 60% : Cucumber 40%)
                          </button>
                        </div>
                      )}

                      {/* Duplicate Warning Confirmation */}
                      {msg.pendingAction.type === 'confirm_duplicate' && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() =>
                              handleExecuteAction(msg.id, 'confirm_expenses', msg.pendingAction?.data)
                            }
                            className="flex-1 bg-amber-600 hover:bg-amber-700 text-white py-1.5 px-3 rounded-xl font-semibold text-xs"
                          >
                            Save Anyway
                          </button>
                          <button
                            onClick={() =>
                              setMessages((prev) =>
                                prev.map((m) =>
                                  m.id === msg.id ? { ...m, pendingAction: undefined } : m
                                )
                              )
                            }
                            className="flex-1 bg-stone-200 hover:bg-stone-300 text-stone-700 py-1.5 px-3 rounded-xl font-semibold text-xs"
                          >
                            Cancel
                          </button>
                        </div>
                      )}

                      {/* Disambiguate Crop Selection */}
                      {msg.pendingAction.type === 'disambiguate_crop' && (
                        <div className="space-y-1">
                          {msg.pendingAction.data.crops?.map((c: any) => (
                            <button
                              key={c.id}
                              onClick={() => {
                                const exp = msg.pendingAction?.data.expense;
                                handleExecuteAction(msg.id, 'confirm_expenses', {
                                  expenses: [
                                    {
                                      category: exp.category,
                                      amount: exp.amount,
                                      description: exp.description,
                                      cropId: c.id,
                                      cropName: c.name,
                                    },
                                  ],
                                });
                              }}
                              className="w-full text-left bg-stone-100 hover:bg-emerald-50 text-stone-800 px-3 py-1.5 rounded-lg text-xs font-medium border border-stone-200 flex items-center justify-between"
                            >
                              <span>For {c.name}</span>
                              <ChevronRight className="w-3.5 h-3.5 text-stone-400" />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Quick Reply Chips (for Daily Reminders) */}
                  {msg.quickReplies && msg.quickReplies.length > 0 && (
                    <div className="mt-2.5 pt-2 border-t border-stone-200/70 flex flex-wrap gap-1.5">
                      {msg.quickReplies.map((replyText, rIdx) => (
                        <button
                          key={rIdx}
                          onClick={() => {
                            handleSendMessage(replyText);
                          }}
                          className="text-[11px] bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-semibold px-2.5 py-1 rounded-full transition-all active:scale-95 cursor-pointer shadow-2xs"
                        >
                          {replyText}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {isTyping && (
            <div className="flex items-center gap-1.5 bg-white p-2.5 rounded-2xl rounded-tl-none w-20 shadow-2xs border border-stone-200/50">
              <span className="w-2 h-2 rounded-full bg-stone-400 animate-bounce" />
              <span className="w-2 h-2 rounded-full bg-stone-400 animate-bounce [animation-delay:0.2s]" />
              <span className="w-2 h-2 rounded-full bg-stone-400 animate-bounce [animation-delay:0.4s]" />
            </div>
          )}
          <div ref={chatBottomRef} />
        </div>

        {/* Input Bar */}
        <div className="bg-[#f0f0f0] p-2.5 flex items-center gap-2 border-t border-stone-300 shrink-0">
          <input
            type="text"
            placeholder="Type a message (e.g. Sold 20 crates to Mama Chidi on credit)..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSendMessage();
            }}
            className="flex-1 bg-white rounded-full px-4 py-2.5 text-xs text-stone-800 focus:outline-none border border-stone-200"
          />
          <button
            type="button"
            onClick={() => setShowVoiceRecorder(!showVoiceRecorder)}
            className="w-10 h-10 rounded-full bg-stone-200 hover:bg-emerald-100 text-stone-700 hover:text-emerald-800 flex items-center justify-center transition-colors shrink-0 cursor-pointer"
            title="Record Voice Note"
          >
            <Mic className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleSendMessage()}
            className="w-10 h-10 rounded-full bg-[#075e54] hover:bg-[#064e46] text-white flex items-center justify-center shadow-md transition-transform active:scale-95 shrink-0 cursor-pointer"
          >
            <Send className="w-4 h-4 ml-0.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
