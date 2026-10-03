import React, { useState } from 'react';
import { X, Zap, Play, Globe, ListFilter } from 'lucide-react';
import { Target, Project } from '../types.js';

interface ScanLauncherModalProps {
  isOpen: boolean;
  onClose: () => void;
  targets: Target[];
  selectedProject: Project | null;
  onLaunch: (params: {
    projectId: string;
    targetId?: string;
    customUrl?: string;
    profileName: string;
    activeTestingEnabled: boolean;
    maxRequestsPerSecond: number;
  }) => void;
}

export const ScanLauncherModal: React.FC<ScanLauncherModalProps> = ({
  isOpen,
  onClose,
  targets,
  selectedProject,
  onLaunch
}) => {
  const [targetMode, setTargetMode] = useState<'custom' | 'existing'>('custom');
  const [customUrl, setCustomUrl] = useState<string>('http://127.0.0.1:8080');
  const [selectedTargetId, setSelectedTargetId] = useState<string>(targets[0]?.id || '');
  const [profileName, setProfileName] = useState<string>('RESEARCH_LAB');
  const [activeTestingEnabled, setActiveTestingEnabled] = useState<boolean>(true);
  const [maxRequestsPerSecond, setMaxRequestsPerSecond] = useState<number>(10);
  const [urlError, setUrlError] = useState<string>('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject) return;

    if (targetMode === 'custom') {
      if (!customUrl.trim()) {
        setUrlError('Please enter a target URL');
        return;
      }
      try {
        new URL(customUrl.trim());
      } catch {
        setUrlError('Please enter a valid URL (e.g. http://127.0.0.1:8080 or https://example.com)');
        return;
      }
      setUrlError('');
      onLaunch({
        projectId: selectedProject.id,
        customUrl: customUrl.trim(),
        profileName,
        activeTestingEnabled,
        maxRequestsPerSecond
      });
    } else {
      if (!selectedTargetId) return;
      onLaunch({
        projectId: selectedProject.id,
        targetId: selectedTargetId,
        profileName,
        activeTestingEnabled,
        maxRequestsPerSecond
      });
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-xl bg-[#0f172a] border border-slate-800 shadow-2xl p-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <Zap className="w-5 h-5 text-blue-400" />
            <h3 className="text-base font-bold text-white font-mono">Launch Assessment</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4 text-xs">
          {/* Target Mode Toggle */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-slate-300 font-medium">Target Selection</label>
              <div className="flex bg-slate-900 border border-slate-800 rounded-md p-0.5">
                <button
                  type="button"
                  onClick={() => setTargetMode('custom')}
                  className={`flex items-center space-x-1 px-2.5 py-1 rounded text-[11px] font-medium transition-all ${
                    targetMode === 'custom'
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Globe className="w-3 h-3" />
                  <span>Custom URL</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTargetMode('existing')}
                  className={`flex items-center space-x-1 px-2.5 py-1 rounded text-[11px] font-medium transition-all ${
                    targetMode === 'existing'
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <ListFilter className="w-3 h-3" />
                  <span>Existing Target</span>
                </button>
              </div>
            </div>

            {targetMode === 'custom' ? (
              <div>
                <input
                  type="text"
                  value={customUrl}
                  onChange={(e) => {
                    setCustomUrl(e.target.value);
                    if (urlError) setUrlError('');
                  }}
                  placeholder="https://app.target.local or http://127.0.0.1:8080"
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-slate-200 font-mono focus:border-blue-500 focus:outline-none placeholder-slate-600"
                />
                {urlError && <p className="text-red-400 text-[11px] mt-1">{urlError}</p>}
                <p className="text-slate-500 text-[10px] mt-1">
                  ScopeEngine and SSRF guard will automatically validate the domain boundaries for authorized testing.
                </p>
              </div>
            ) : (
              <select
                value={selectedTargetId}
                onChange={(e) => setSelectedTargetId(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-slate-200 font-mono focus:border-blue-500 focus:outline-none"
              >
                {targets.map(t => (
                  <option key={t.id} value={t.id}>{t.url} ({t.hostname})</option>
                ))}
              </select>
            )}
          </div>

          {/* Profile Selection */}
          <div>
            <label className="block text-slate-300 font-medium mb-1.5">Scan Profile</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'RESEARCH_LAB', title: 'Research Lab', desc: 'Full recon, crawling & active verification' },
                { id: 'PASSIVE', title: 'Passive Only', desc: 'Headers, TLS & passive intelligence' },
                { id: 'QUICK', title: 'Quick Scan', desc: 'Fast surface mapping & light detection' },
                { id: 'DEEP', title: 'Deep Audit', desc: 'Deep crawler with full rule suite' }
              ].map(p => (
                <div
                  key={p.id}
                  onClick={() => setProfileName(p.id)}
                  className={`p-2.5 rounded-lg border cursor-pointer transition-all ${
                    profileName === p.id
                      ? 'bg-blue-600/15 border-blue-500 text-blue-400'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="font-bold text-[11px] font-mono">{p.title}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">{p.desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Active Testing Confirmation */}
          <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-semibold text-slate-200 block">Active Verification Testing</span>
                <span className="text-[11px] text-slate-400">Execute benign differential probes to verify findings</span>
              </div>
              <input
                type="checkbox"
                checked={activeTestingEnabled}
                onChange={(e) => setActiveTestingEnabled(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 focus:ring-0 cursor-pointer"
              />
            </div>
          </div>

          {/* Rate Limiting */}
          <div>
            <label className="block text-slate-300 font-medium mb-1.5">
              Rate Limit Budget: <span className="text-blue-400 font-mono">{maxRequestsPerSecond} req/sec</span>
            </label>
            <input
              type="range"
              min="1"
              max="50"
              value={maxRequestsPerSecond}
              onChange={(e) => setMaxRequestsPerSecond(Number(e.target.value))}
              className="w-full accent-blue-500 cursor-pointer"
            />
          </div>

          <div className="pt-3 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center space-x-2 px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Start Assessment</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
