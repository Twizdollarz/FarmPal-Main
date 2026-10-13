import React, { useState, useEffect } from 'react';
import {
  X,
  GitBranch,
  GitCommit,
  UploadCloud,
  Download,
  Terminal,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Copy,
  Check,
  ShieldCheck,
  FolderArchive,
  RefreshCw,
} from 'lucide-react';

interface GitHubModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface GitStatus {
  initialized: boolean;
  branch: string;
  lastCommitHash: string;
  lastCommitMsg: string;
  lastCommitDate: string;
  totalCommits: number;
  remoteOrigin: string | null;
}

export const GitHubModal: React.FC<GitHubModalProps> = ({ isOpen, onClose }) => {
  const [gitStatus, setGitStatus] = useState<GitStatus | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [repoUrl, setRepoUrl] = useState('');
  const [patToken, setPatToken] = useState('');
  const [branch, setBranch] = useState('main');
  const [pushing, setPushing] = useState(false);
  const [pushResult, setPushResult] = useState<{
    success: boolean;
    message: string;
    suggestion?: string;
  } | null>(null);
  const [copiedTerminal, setCopiedTerminal] = useState(false);
  const [activeMethod, setActiveMethod] = useState<'direct' | 'download'>('direct');

  useEffect(() => {
    if (isOpen) {
      fetchStatus();
    }
  }, [isOpen]);

  const fetchStatus = async () => {
    setLoadingStatus(true);
    try {
      const res = await fetch('/api/github/status');
      if (res.ok) {
        const data = await res.json();
        setGitStatus(data);
        if (data.branch) setBranch(data.branch);
        if (data.remoteOrigin && !repoUrl) {
          setRepoUrl(data.remoteOrigin);
        }
      }
    } catch (err) {
      console.error('Failed to fetch git status:', err);
    } finally {
      setLoadingStatus(false);
    }
  };

  const handlePush = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!repoUrl) return;

    setPushing(true);
    setPushResult(null);

    try {
      const res = await fetch('/api/github/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          repoUrl,
          token: patToken,
          branch,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setPushResult({
          success: true,
          message: data.message || 'Successfully pushed to GitHub!',
        });
        fetchStatus();
      } else {
        setPushResult({
          success: false,
          message: data.details || data.error || 'Failed to push to GitHub.',
          suggestion: data.suggestion,
        });
      }
    } catch (err: any) {
      setPushResult({
        success: false,
        message: err?.message || 'Network error occurred while pushing.',
        suggestion: 'Please verify your internet connection or use the ZIP download option below.',
      });
    } finally {
      setPushing(false);
    }
  };

  const terminalCommands = `# 1. Download or extract the project, then open terminal:
cd farmpal

# 2. Add your GitHub repository as remote:
git remote add origin ${repoUrl || 'https://github.com/<your-username>/farmpal.git'}

# 3. Rename branch to main (if not already):
git branch -M main

# 4. Push code to GitHub:
git push -u origin main`;

  const copyTerminalCommands = () => {
    navigator.clipboard.writeText(terminalCommands);
    setCopiedTerminal(true);
    setTimeout(() => setCopiedTerminal(false), 2500);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white/95 backdrop-blur-2xl rounded-3xl shadow-[0_24px_64px_rgba(0,0,0,0.18)] border border-black/[0.08] overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 flex items-center justify-between border-b border-black/[0.05]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#F5F5F7] border border-black/[0.06] flex items-center justify-center text-[#1D1D1F]">
              {/* GitHub SVG Icon */}
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold tracking-tight text-[#1D1D1F] flex items-center gap-2">
                Push FarmPal to GitHub
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#34C759]/15 text-[#248A3D] font-medium">
                  Git Ready
                </span>
              </h2>
              <p className="text-xs text-neutral-500">
                Publish repository, sync commits, or download project source code
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-neutral-400 hover:text-[#1D1D1F] hover:bg-black/[0.05] transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Local Git Status Card */}
          <div className="bg-[#F5F5F7] rounded-2xl p-4 border border-black/[0.04]">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-neutral-700 tracking-tight">
                <GitBranch className="w-3.5 h-3.5 text-[#34C759]" />
                Local Git Repository Status
              </div>
              <button
                onClick={fetchStatus}
                disabled={loadingStatus}
                className="text-xs text-neutral-500 hover:text-[#1D1D1F] flex items-center gap-1 cursor-pointer transition-colors"
                title="Refresh Git status"
              >
                <RefreshCw className={`w-3 h-3 ${loadingStatus ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="bg-white p-3 rounded-xl border border-black/[0.04] shadow-2xs">
                <span className="text-neutral-400 block text-[10px] font-medium">Branch</span>
                <span className="font-mono font-semibold text-[#34C759]">{gitStatus?.branch || 'main'}</span>
              </div>
              <div className="bg-white p-3 rounded-xl border border-black/[0.04] shadow-2xs">
                <span className="text-neutral-400 block text-[10px] font-medium">Latest Commit</span>
                <span className="font-mono font-semibold text-[#1D1D1F]">{gitStatus?.lastCommitHash || 'ready'}</span>
              </div>
              <div className="bg-white p-3 rounded-xl border border-black/[0.04] shadow-2xs">
                <span className="text-neutral-400 block text-[10px] font-medium">Total Commits</span>
                <span className="font-semibold text-[#1D1D1F]">{gitStatus?.totalCommits ?? 1} commits</span>
              </div>
              <div className="bg-white p-3 rounded-xl border border-black/[0.04] shadow-2xs">
                <span className="text-neutral-400 block text-[10px] font-medium">Status</span>
                <span className="text-[#34C759] font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Clean
                </span>
              </div>
            </div>

            {gitStatus?.lastCommitMsg && (
              <div className="mt-3 pt-2.5 border-t border-black/[0.05] text-xs text-neutral-600 flex items-center gap-2">
                <GitCommit className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                <span className="truncate italic">"{gitStatus.lastCommitMsg}"</span>
                <span className="text-neutral-400 text-[11px] shrink-0 ml-auto">
                  {gitStatus.lastCommitDate}
                </span>
              </div>
            )}
          </div>

          {/* Method Selection Tabs (Apple Segmented Control) */}
          <div className="bg-[#E5E5EA]/70 backdrop-blur-md p-1 rounded-2xl border border-black/[0.04] flex items-center gap-1">
            <button
              onClick={() => setActiveMethod('direct')}
              className={`flex-1 py-2 px-3 text-xs font-semibold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 ${
                activeMethod === 'direct'
                  ? 'bg-white text-[#1D1D1F] shadow-[0_1px_3px_rgba(0,0,0,0.1),0_1px_2px_rgba(0,0,0,0.06)]'
                  : 'text-neutral-600 hover:text-[#1D1D1F]'
              }`}
            >
              <UploadCloud className="w-4 h-4 text-[#34C759]" />
              Direct Push
            </button>
            <button
              onClick={() => setActiveMethod('download')}
              className={`flex-1 py-2 px-3 text-xs font-semibold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 ${
                activeMethod === 'download'
                  ? 'bg-white text-[#1D1D1F] shadow-[0_1px_3px_rgba(0,0,0,0.1),0_1px_2px_rgba(0,0,0,0.06)]'
                  : 'text-neutral-600 hover:text-[#1D1D1F]'
              }`}
            >
              <Download className="w-4 h-4 text-blue-600" />
              Download ZIP / Manual
            </button>
          </div>

          {/* METHOD 1: DIRECT PUSH FORM */}
          {activeMethod === 'direct' && (
            <form onSubmit={handlePush} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-800 mb-1">
                  GitHub Repository URL <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="https://github.com/nwobodotemple/farmpal.git"
                  value={repoUrl}
                  onChange={(e) => setRepoUrl(e.target.value)}
                  className="w-full text-xs font-mono px-3 py-2.5 border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-stone-50/50"
                />
                <p className="text-[11px] text-stone-500 mt-1">
                  Create a new repository on GitHub (e.g.{' '}
                  <a
                    href="https://github.com/new"
                    target="_blank"
                    rel="noreferrer"
                    className="text-emerald-700 underline font-medium inline-flex items-center gap-0.5"
                  >
                    github.com/new <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                  ) without initializing a README, then paste the URL above.
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-stone-800">
                    GitHub Personal Access Token (PAT)
                  </label>
                  <a
                    href="https://github.com/settings/tokens/new?scopes=repo"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-emerald-700 hover:text-emerald-800 font-medium inline-flex items-center gap-1"
                  >
                    Generate token <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </div>
                <input
                  type="password"
                  placeholder="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                  value={patToken}
                  onChange={(e) => setPatToken(e.target.value)}
                  className="w-full text-xs font-mono px-3 py-2.5 border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-stone-50/50"
                />
                <div className="flex items-center gap-1.5 mt-1 text-[11px] text-stone-500">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>
                    Your token is used only for this one push action and is never saved to disk.
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-800 mb-1">
                  Target Branch
                </label>
                <input
                  type="text"
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  className="w-36 text-xs font-mono px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              {/* Push Result Alerts */}
              {pushResult && (
                <div
                  className={`p-4 rounded-xl border text-xs ${
                    pushResult.success
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                      : 'bg-rose-50 border-rose-200 text-rose-900'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    {pushResult.success ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-rose-600 mt-0.5 shrink-0" />
                    )}
                    <div>
                      <p className="font-semibold">{pushResult.message}</p>
                      {pushResult.suggestion && (
                        <p className="text-stone-600 mt-1">{pushResult.suggestion}</p>
                      )}
                      {pushResult.success && (
                        <a
                          href={repoUrl.replace(/\.git$/, '')}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-2 inline-flex items-center gap-1 font-bold text-emerald-700 hover:underline"
                        >
                          View Repository on GitHub <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-medium text-stone-600 hover:text-stone-900 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={pushing || !repoUrl}
                  className="flex items-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-md transition-all disabled:opacity-50 cursor-pointer"
                >
                  {pushing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Pushing to GitHub...
                    </>
                  ) : (
                    <>
                      <UploadCloud className="w-4 h-4" />
                      Push Code to GitHub
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* METHOD 2: DOWNLOAD & MANUAL COMMANDS */}
          {activeMethod === 'download' && (
            <div className="space-y-5">
              {/* One Click Download Card */}
              <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-xl bg-emerald-100 text-emerald-800 shrink-0">
                    <FolderArchive className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-emerald-950">
                      Export Full Project ZIP Archive
                    </h3>
                    <p className="text-xs text-emerald-800/90 mt-0.5">
                      Contains all components, server, models, configs, assets, and documentation.
                    </p>
                  </div>
                </div>

                <a
                  href="/api/github/export-zip"
                  download="farmpal-source.zip"
                  className="shrink-0 flex items-center justify-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-sm transition-colors cursor-pointer text-center"
                >
                  <Download className="w-4 h-4" />
                  Download ZIP
                </a>
              </div>

              {/* Terminal Instructions */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-stone-700 flex items-center gap-1.5">
                    <Terminal className="w-3.5 h-3.5 text-stone-500" />
                    Push via Local Terminal Commands
                  </span>
                  <button
                    onClick={copyTerminalCommands}
                    className="text-xs font-medium text-stone-600 hover:text-stone-900 flex items-center gap-1 cursor-pointer"
                  >
                    {copiedTerminal ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-700 font-bold">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Commands</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="bg-stone-950 rounded-xl p-4 font-mono text-xs text-stone-200 overflow-x-auto relative">
                  <pre className="text-emerald-400">{terminalCommands}</pre>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-stone-50 px-6 py-3.5 border-t border-stone-200 flex items-center justify-between text-xs text-stone-500">
          <span>FarmPal Open Source Repository</span>
          <button
            onClick={onClose}
            className="text-stone-700 hover:text-stone-900 font-semibold cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
