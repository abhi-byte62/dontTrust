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
        setUrlError('PLEASE ENTER A TARGET URL');
        return;
      }
      try {
        new URL(customUrl.trim());
      } catch {
        setUrlError('INVALID URL FORMAT (E.G. http://127.0.0.1:8080 OR https://target.local)');
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 font-mono">
      <div className="w-full max-w-lg bg-black border border-zinc-800 shadow-2xl p-5">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div className="flex items-center space-x-2">
            <Zap className="w-4 h-4 text-white" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">LAUNCH ASSESSMENT</h3>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-white cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5 text-xs">
          {/* Target Mode Toggle */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[10px] text-zinc-500 uppercase tracking-wider">TARGET DESTINATION</label>
              <div className="flex bg-zinc-950 border border-zinc-800 p-0.5">
                <button
                  type="button"
                  onClick={() => setTargetMode('custom')}
                  className={`flex items-center space-x-1 px-2 py-0.5 text-[10px] uppercase font-bold transition-colors cursor-pointer ${
                    targetMode === 'custom'
                      ? 'bg-white text-black'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <Globe className="w-2.5 h-2.5" />
                  <span>CUSTOM URL</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTargetMode('existing')}
                  className={`flex items-center space-x-1 px-2 py-0.5 text-[10px] uppercase font-bold transition-colors cursor-pointer ${
                    targetMode === 'existing'
                      ? 'bg-white text-black'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <ListFilter className="w-2.5 h-2.5" />
                  <span>EXISTING</span>
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
                  placeholder="https://target.local or http://127.0.0.1:8080"
                  className="w-full bg-black border border-zinc-800 p-2 text-white font-mono uppercase text-xs focus:border-white focus:outline-none placeholder-zinc-700"
                />
                {urlError && <p className="text-white bg-zinc-900 border border-zinc-700 p-1 text-[10px] mt-1 uppercase font-bold">{urlError}</p>}
                <p className="text-zinc-600 text-[9px] mt-1 uppercase">
                  ScopeEngine validates network boundaries for authorized testing.
                </p>
              </div>
            ) : (
              <select
                value={selectedTargetId}
                onChange={(e) => setSelectedTargetId(e.target.value)}
                className="w-full bg-black border border-zinc-800 p-2 text-white font-mono text-xs focus:border-white focus:outline-none cursor-pointer"
              >
                {targets.map(t => (
                  <option key={t.id} value={t.id} className="bg-black text-white">{t.url} ({t.hostname})</option>
                ))}
              </select>
            )}
          </div>

          {/* Profile Selection */}
          <div>
            <label className="text-[10px] text-zinc-500 uppercase tracking-wider block mb-1.5">ASSESSMENT PROFILE</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'RESEARCH_LAB', title: 'RESEARCH LAB', desc: 'Deep crawl, AST & canary verification' },
                { id: 'PASSIVE', title: 'PASSIVE ONLY', desc: 'Headers, TLS & passive recon' },
                { id: 'QUICK', title: 'QUICK SCAN', desc: 'Fast surface mapping & light checks' },
                { id: 'DEEP', title: 'DEEP AUDIT', desc: 'Full crawler with active rule catalog' }
              ].map(p => (
                <div
                  key={p.id}
                  onClick={() => setProfileName(p.id)}
                  className={`p-2.5 border cursor-pointer transition-colors ${
                    profileName === p.id
                      ? 'bg-white text-black border-white font-bold'
                      : 'bg-zinc-950 border-zinc-900 text-zinc-400 hover:border-zinc-700'
                  }`}
                >
                  <div className="text-[11px] font-bold uppercase">{p.title}</div>
                  <div className={`text-[9px] mt-0.5 uppercase ${profileName === p.id ? 'text-zinc-800' : 'text-zinc-500'}`}>{p.desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Active Testing Confirmation */}
          <div className="p-2.5 bg-zinc-950 border border-zinc-900 flex items-center justify-between">
            <div>
              <span className="font-bold text-white text-[11px] uppercase block">DIFFERENTIAL VERIFICATION</span>
              <span className="text-[9px] text-zinc-500 uppercase">Execute benign canary probes</span>
            </div>
            <input
              type="checkbox"
              checked={activeTestingEnabled}
              onChange={(e) => setActiveTestingEnabled(e.target.checked)}
              className="w-3.5 h-3.5 accent-white cursor-pointer"
            />
          </div>

          {/* Rate Limiting */}
          <div>
            <div className="flex items-center justify-between text-[10px] uppercase text-zinc-500 mb-1">
              <span>RATE LIMIT BUDGET</span>
              <span className="text-white font-bold">{maxRequestsPerSecond} REQ/SEC</span>
            </div>
            <input
              type="range"
              min="1"
              max="50"
              value={maxRequestsPerSecond}
              onChange={(e) => setMaxRequestsPerSecond(Number(e.target.value))}
              className="w-full accent-white cursor-pointer"
            />
          </div>

          <div className="pt-2 flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 bg-black border border-zinc-800 hover:border-zinc-600 text-zinc-300 uppercase tracking-wider text-xs font-bold cursor-pointer"
            >
              CANCEL
            </button>
            <button
              type="submit"
              className="flex items-center space-x-1.5 px-4 py-1.5 bg-white hover:bg-zinc-200 text-black uppercase tracking-wider text-xs font-bold cursor-pointer transition-colors"
            >
              <Play className="w-3 h-3 fill-black text-black" />
              <span>START ASSESSMENT</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
