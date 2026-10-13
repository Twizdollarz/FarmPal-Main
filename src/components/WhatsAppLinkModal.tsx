import React, { useState, useEffect } from 'react';
import {
  X,
  MessageSquare,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Terminal,
  Send,
  Loader2,
  CheckCircle2,
  AlertCircle,
  QrCode,
  Zap,
  Globe,
  HelpCircle,
} from 'lucide-react';
import { FarmerProfile } from '../types';

interface WhatsAppLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile?: FarmerProfile;
}

interface WebhookConfigResponse {
  status: string;
  verifyToken: string;
  metaWebhookUrl: string;
  isMetaConfigured: boolean;
  sampleVerifyHandshake: string;
}

export const WhatsAppLinkModal: React.FC<WhatsAppLinkModalProps> = ({
  isOpen,
  onClose,
  profile,
}) => {
  const [activeTab, setActiveTab] = useState<'meta' | 'tester' | 'wame'>('meta');
  const [config, setConfig] = useState<WebhookConfigResponse | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isLoadingConfig, setIsLoadingConfig] = useState(false);

  // Live Tester State
  const [testMessage, setTestMessage] = useState('Spent 15k on fertilizer for tomato');
  const [testSenderPhone, setTestSenderPhone] = useState('+2348031234567');
  const [testResult, setTestResult] = useState<any | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  // Custom WhatsApp number for wa.me link
  const [customPhone, setCustomPhone] = useState(profile?.phone || '+2348031234567');

  useEffect(() => {
    if (isOpen) {
      loadConfig();
    }
  }, [isOpen]);

  const loadConfig = async () => {
    setIsLoadingConfig(true);
    try {
      const res = await fetch('/api/whatsapp/config');
      if (res.ok) {
        const data = await res.json();
        setConfig(data);
      }
    } catch (e) {
      console.warn('Failed to load whatsapp config:', e);
    } finally {
      setIsLoadingConfig(false);
    }
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const handleRunWebhookTest = async () => {
    if (!testMessage.trim()) return;
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/whatsapp/test-webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: testMessage.trim(),
          senderPhone: testSenderPhone.trim(),
          provider: 'meta',
        }),
      });
      const data = await res.json();
      setTestResult(data);
    } catch (err: any) {
      setTestResult({
        error: 'Network error calling test-webhook endpoint',
        details: err?.message,
      });
    } finally {
      setIsTesting(false);
    }
  };

  if (!isOpen) return null;

  // Determine current origin/URL for display
  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : '';
  const metaUrl = config?.metaWebhookUrl || `${currentOrigin}/api/whatsapp/webhook`;
  const verifyToken = config?.verifyToken || 'farmpal_webhook_2026';

  const cleanPhoneForWame = customPhone.replace(/[^0-9]/g, '');
  const wameUrl = `https://wa.me/${cleanPhoneForWame}?text=${encodeURIComponent('Hello FarmPal! Spent 12k on fertilizer today')}`;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fade-in">
      <div className="bg-white/95 dark:bg-[#1C1C1E]/95 backdrop-blur-2xl w-full max-w-2xl rounded-3xl shadow-[0_24px_64px_rgba(0,0,0,0.24)] border border-black/[0.08] dark:border-white/[0.12] overflow-hidden my-auto flex flex-col max-h-[92vh] transition-colors">
        {/* Header */}
        <div className="p-5 sm:p-6 pb-4 border-b border-black/[0.06] dark:border-white/[0.08] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#25D366]/10 text-[#25D366] flex items-center justify-center border border-[#25D366]/20 shadow-2xs">
              <MessageSquare className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-semibold text-[#1D1D1F] dark:text-[#FFFFFF] tracking-tight">
                  Link to Actual WhatsApp Bot
                </h3>
                <span className="text-[11px] font-medium bg-[#34C759]/15 text-[#248A3D] dark:text-[#30D158] px-2 py-0.5 rounded-full border border-[#34C759]/30">
                  Live Webhook Ready
                </span>
              </div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Connect FarmPal's conversational AI engine to your real WhatsApp number or sandbox
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-black/[0.04] dark:bg-white/[0.08] hover:bg-black/[0.08] dark:hover:bg-white/[0.14] text-[#1D1D1F] dark:text-[#F5F5F7] flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Apple Segmented Control Tabs */}
        <div className="px-5 sm:px-6 pt-3 shrink-0">
          <div className="p-1 bg-black/[0.04] dark:bg-white/[0.08] rounded-2xl flex text-xs font-medium border border-black/[0.04] dark:border-white/[0.06]">
            <button
              type="button"
              onClick={() => setActiveTab('meta')}
              className={`flex-1 py-1.5 px-2 rounded-xl transition-all cursor-pointer text-center ${
                activeTab === 'meta'
                  ? 'bg-white dark:bg-[#2C2C2E] text-[#1D1D1F] dark:text-white shadow-xs font-semibold'
                  : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              Meta Cloud API (Official)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('tester')}
              className={`flex-1 py-1.5 px-2 rounded-xl transition-all cursor-pointer text-center flex items-center justify-center gap-1 ${
                activeTab === 'tester'
                  ? 'bg-white dark:bg-[#2C2C2E] text-[#1D1D1F] dark:text-white shadow-xs font-semibold'
                  : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              <span>Test Webhook</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('wame')}
              className={`flex-1 py-1.5 px-2 rounded-xl transition-all cursor-pointer text-center ${
                activeTab === 'wame'
                  ? 'bg-white dark:bg-[#2C2C2E] text-[#1D1D1F] dark:text-white shadow-xs font-semibold'
                  : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              wa.me QR & Link
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1">
          {/* TAB 1: META WHATSAPP CLOUD API */}
          {activeTab === 'meta' && (
            <div className="space-y-4">
              <div className="bg-[#25D366]/5 dark:bg-[#25D366]/10 p-4 rounded-2xl border border-[#25D366]/20 space-y-1">
                <span className="text-xs font-semibold text-[#128C7E] dark:text-[#25D366] flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4" />
                  Meta WhatsApp Business Cloud API (Recommended for Production)
                </span>
                <p className="text-xs text-neutral-600 dark:text-neutral-300">
                  FarmPal has the official Meta GET verification handshake and POST webhook handlers pre-built and running at <code className="bg-black/5 dark:bg-white/10 px-1 py-0.5 rounded font-mono text-[11px]">/api/whatsapp/webhook</code>.
                </p>
              </div>

              {/* Endpoint URLs to Copy */}
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-neutral-600 dark:text-neutral-400 block">
                    1. Meta Callback URL (Paste into Meta App Dashboard)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={metaUrl}
                      className="flex-1 bg-black/[0.03] dark:bg-white/[0.05] border border-black/[0.08] dark:border-white/[0.1] rounded-xl px-3 py-2 text-xs font-mono text-[#1D1D1F] dark:text-[#F5F5F7] select-all focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => copyToClipboard(metaUrl, 'metaUrl')}
                      className="px-3 py-2 bg-[#0071E3] hover:bg-[#0077ED] text-white rounded-xl text-xs font-medium flex items-center gap-1 transition-all cursor-pointer active:scale-95 shrink-0 shadow-2xs"
                    >
                      {copiedKey === 'metaUrl' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedKey === 'metaUrl' ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-neutral-600 dark:text-neutral-400 block">
                    2. Meta Verify Token (Paste into Meta App Dashboard)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={verifyToken}
                      className="flex-1 bg-black/[0.03] dark:bg-white/[0.05] border border-black/[0.08] dark:border-white/[0.1] rounded-xl px-3 py-2 text-xs font-mono text-[#1D1D1F] dark:text-[#F5F5F7] select-all focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => copyToClipboard(verifyToken, 'token')}
                      className="px-3 py-2 bg-black/[0.06] dark:bg-white/[0.1] hover:bg-black/[0.1] text-[#1D1D1F] dark:text-white rounded-xl text-xs font-medium flex items-center gap-1 transition-all cursor-pointer active:scale-95 shrink-0"
                    >
                      {copiedKey === 'token' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedKey === 'token' ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Step by step checklist */}
              <div className="bg-black/[0.02] dark:bg-white/[0.03] p-4 rounded-2xl border border-black/[0.06] dark:border-white/[0.08] space-y-3">
                <span className="text-xs font-semibold text-[#1D1D1F] dark:text-white block">
                  Quick 4-Step Setup on Meta Developer Portal:
                </span>
                <ol className="text-xs text-neutral-600 dark:text-neutral-300 space-y-2 list-decimal list-inside leading-relaxed">
                  <li>
                    Go to{' '}
                    <a
                      href="https://developers.facebook.com/apps"
                      target="_blank"
                      rel="noreferrer"
                      className="text-[#0071E3] hover:underline inline-flex items-center gap-0.5 font-medium"
                    >
                      developers.facebook.com <ExternalLink className="w-3 h-3 inline" />
                    </a>{' '}
                    and create/select an App (Type: <strong>Business</strong>).
                  </li>
                  <li>
                    Under <strong>Add Products</strong>, add <strong>WhatsApp</strong>. Meta will assign you a test phone number and a temporary access token.
                  </li>
                  <li>
                    Navigate to <strong>WhatsApp &gt; Configuration</strong>. Under <strong>Webhook</strong>, click <strong>Edit</strong>:
                    <div className="pl-4 mt-1 space-y-0.5 text-neutral-500 dark:text-neutral-400">
                      • <strong>Callback URL:</strong> Paste the URL copied above<br />
                      • <strong>Verify Token:</strong> <code className="text-emerald-700 dark:text-emerald-400 font-mono">{verifyToken}</code><br />
                      • Click <strong>Verify and Save</strong>. Click <strong>Manage Webhook fields</strong> and subscribe to <strong>messages</strong>.
                    </div>
                  </li>
                  <li>
                    In your project's <code className="bg-black/5 dark:bg-white/10 px-1 py-0.5 rounded font-mono">.env</code> file, set:
                    <div className="mt-1.5 p-2.5 bg-neutral-900 text-neutral-200 rounded-xl font-mono text-[11px] overflow-x-auto">
                      WHATSAPP_ACCESS_TOKEN=EAAG...<br />
                      WHATSAPP_PHONE_NUMBER_ID=1049281...<br />
                      WHATSAPP_VERIFY_TOKEN={verifyToken}
                    </div>
                  </li>
                </ol>
              </div>
            </div>
          )}

          {/* TAB 2: LIVE WEBHOOK TESTER */}
          {activeTab === 'tester' && (
            <div className="space-y-4">
              <div className="bg-blue-50/50 dark:bg-blue-950/20 p-4 rounded-2xl border border-blue-200 dark:border-blue-900/40 space-y-1">
                <span className="text-xs font-semibold text-[#0071E3] dark:text-blue-400 flex items-center gap-1.5">
                  <Zap className="w-4 h-4" />
                  Live Webhook Simulator &amp; Payload Inspector
                </span>
                <p className="text-xs text-neutral-600 dark:text-neutral-300">
                  Simulate an incoming WhatsApp message payload to verify how FarmPal's server processes it and generates the reply.
                </p>
              </div>

              <div className="space-y-3">
                {/* Preset Chips */}
                <div>
                  <label className="text-xs font-medium text-neutral-600 dark:text-neutral-400 block mb-1.5">
                    Select a farmer test scenario:
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      'Spent 15k on fertilizer for tomato',
                      'Paid 8k for 2 weeders today',
                      'Sold 25 crates of tomato for 200k to Alhaji Dan',
                      'Alhaji Dan paid 200k balance today',
                      'What is tomato price in Lagos today?',
                      'Am I on budget for tomato?',
                    ].map((sample, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setTestMessage(sample)}
                        className="text-[11px] bg-black/[0.04] dark:bg-white/[0.08] hover:bg-[#0071E3]/10 hover:text-[#0071E3] text-neutral-700 dark:text-neutral-300 px-2.5 py-1 rounded-full border border-black/[0.05] dark:border-white/[0.08] transition-colors cursor-pointer"
                      >
                        "{sample}"
                      </button>
                    ))}
                  </div>
                </div>

                {/* Input Message */}
                <div className="space-y-1">
                  <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300 block">
                    Message Body:
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={testMessage}
                      onChange={(e) => setTestMessage(e.target.value)}
                      placeholder="e.g. Spent 15k on fertilizer for tomato"
                      className="flex-1 bg-black/[0.03] dark:bg-white/[0.05] border border-black/[0.08] dark:border-white/[0.1] rounded-xl px-3 py-2 text-xs text-[#1D1D1F] dark:text-[#F5F5F7] focus:outline-none focus:ring-2 focus:ring-[#0071E3]/30"
                    />
                    <button
                      type="button"
                      onClick={handleRunWebhookTest}
                      disabled={isTesting || !testMessage.trim()}
                      className="px-4 py-2 bg-[#0071E3] hover:bg-[#0077ED] disabled:opacity-50 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 shrink-0 shadow-2xs"
                    >
                      {isTesting ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Testing...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-3.5 h-3.5" />
                          <span>Send Test</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Test Result Display */}
                {testResult && (
                  <div className="p-4 bg-black/[0.03] dark:bg-white/[0.04] rounded-2xl border border-black/[0.08] dark:border-white/[0.1] space-y-2.5 animate-fade-in">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4 text-[#34C759]" />
                        Webhook Processed Successfully
                      </span>
                      {testResult.actionExecuted && (
                        <span className="text-[11px] font-mono bg-black/5 dark:bg-white/10 px-2 py-0.5 rounded text-neutral-600 dark:text-neutral-400">
                          Action: {testResult.actionExecuted}
                        </span>
                      )}
                    </div>

                    {/* Bot WhatsApp Response Bubble */}
                    <div className="p-3 bg-[#DCF8C6] dark:bg-[#054740] rounded-xl border border-[#25D366]/30 text-xs text-stone-900 dark:text-stone-100 whitespace-pre-line shadow-2xs font-sans">
                      {testResult.botReply || 'No reply generated'}
                    </div>

                    {/* Raw details */}
                    {testResult.details && (
                      <div className="pt-2 border-t border-black/[0.05] dark:border-white/[0.06]">
                        <span className="text-[10px] uppercase font-mono text-neutral-400 tracking-wider block mb-1">
                          Records Updated in Farm Notebook:
                        </span>
                        <pre className="text-[11px] font-mono bg-black/5 dark:bg-black/40 p-2 rounded-lg text-neutral-800 dark:text-neutral-200 overflow-x-auto">
                          {JSON.stringify(testResult.details, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: DIRECT WA.ME LINK & QR */}
          {activeTab === 'wame' && (
            <div className="space-y-4">
              <div className="bg-[#25D366]/5 dark:bg-[#25D366]/10 p-4 rounded-2xl border border-[#25D366]/20 space-y-1">
                <span className="text-xs font-semibold text-[#128C7E] dark:text-[#25D366] flex items-center gap-1.5">
                  <QrCode className="w-4 h-4" />
                  Direct WhatsApp "Click-to-Chat" Link (wa.me)
                </span>
                <p className="text-xs text-neutral-600 dark:text-neutral-300">
                  Generate a quick WhatsApp link or QR code that farmers can tap on their mobile phone to immediately open a chat with FarmPal.
                </p>
              </div>

              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300 block">
                    WhatsApp Bot Phone Number (with Country Code):
                  </label>
                  <input
                    type="text"
                    value={customPhone}
                    onChange={(e) => setCustomPhone(e.target.value)}
                    placeholder="+234 803 123 4567"
                    className="w-full bg-black/[0.03] dark:bg-white/[0.05] border border-black/[0.08] dark:border-white/[0.1] rounded-xl px-3 py-2 text-xs text-[#1D1D1F] dark:text-[#F5F5F7] focus:outline-none"
                  />
                  <p className="text-[11px] text-neutral-400">
                    Use the phone number assigned to your FarmPal WhatsApp account or Meta Cloud API phone number.
                  </p>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-neutral-600 dark:text-neutral-400 block">
                    Generated wa.me URL:
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={wameUrl}
                      className="flex-1 bg-black/[0.03] dark:bg-white/[0.05] border border-black/[0.08] dark:border-white/[0.1] rounded-xl px-3 py-2 text-xs font-mono text-[#1D1D1F] dark:text-[#F5F5F7] select-all focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => copyToClipboard(wameUrl, 'wame')}
                      className="px-3 py-2 bg-black/[0.06] dark:bg-white/[0.1] hover:bg-black/[0.1] text-[#1D1D1F] dark:text-white rounded-xl text-xs font-medium flex items-center gap-1 transition-all cursor-pointer active:scale-95 shrink-0"
                    >
                      {copiedKey === 'wame' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedKey === 'wame' ? 'Copied' : 'Copy'}</span>
                    </button>
                    <a
                      href={wameUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-2 bg-[#25D366] hover:bg-[#20ba5a] text-white rounded-xl text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer active:scale-95 shrink-0 shadow-2xs"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Open WhatsApp</span>
                    </a>
                  </div>
                </div>

                {/* QR Code Card */}
                <div className="p-4 bg-black/[0.02] dark:bg-white/[0.03] rounded-2xl border border-black/[0.06] dark:border-white/[0.08] flex items-center gap-4">
                  <div className="w-20 h-20 bg-white rounded-xl p-2 border border-black/[0.1] shadow-2xs flex items-center justify-center shrink-0">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(wameUrl)}`}
                      alt="WhatsApp QR Code"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs font-semibold text-[#1D1D1F] dark:text-white block">
                      Farmer QR Code Scan
                    </span>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                      Print this QR code on a card or display it on farm field visits. Farmers scan with their phone camera to instantly start recording expenses via WhatsApp!
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-black/[0.06] dark:border-white/[0.08] bg-black/[0.01] dark:bg-white/[0.02] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
            <span className="w-2 h-2 rounded-full bg-[#34C759]" />
            <span>Server Webhook Endpoints Active on Port 3000</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-black/[0.06] dark:bg-white/[0.1] hover:bg-black/[0.1] dark:hover:bg-white/[0.15] text-[#1D1D1F] dark:text-white rounded-xl text-xs font-medium transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
