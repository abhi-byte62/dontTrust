import React from 'react';
import { Shield, Radio, Lock } from 'lucide-react';
import { Project } from '../types.js';

interface HeaderProps {
  projects: Project[];
  selectedProject: Project | null;
  onSelectProject: (p: Project) => void;
  onOpenLauncher: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  projects,
  selectedProject,
  onSelectProject,
  onOpenLauncher
}) => {
  return (
    <header className="h-16 border-b border-slate-800 bg-[#0b0f19] px-6 flex items-center justify-between z-10">
      <div className="flex items-center space-x-6">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center">
            <Shield className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold tracking-tight text-white font-mono text-base">DONTTRUST</span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-blue-500/10 text-blue-400 border border-blue-500/20">v2.0-PRO</span>
            </div>
            <p className="text-[11px] text-slate-400">Application Security & Intelligence Platform</p>
          </div>
        </div>

        <div className="h-5 w-[1px] bg-slate-800" />

        {/* Project Selector */}
        <div className="flex items-center space-x-2">
          <span className="text-xs text-slate-400 font-medium">Project:</span>
          <select
            className="bg-slate-900 border border-slate-800 text-xs rounded-md px-3 py-1.5 text-slate-200 focus:outline-none focus:border-blue-500 font-mono"
            value={selectedProject?.id || ''}
            onChange={(e) => {
              const p = projects.find(item => item.id === e.target.value);
              if (p) onSelectProject(p);
            }}
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2 px-3 py-1.5 rounded-md bg-slate-900 border border-slate-800 text-xs text-slate-400">
          <Lock className="w-3.5 h-3.5 text-emerald-400" />
          <span>Scope Enforcement:</span>
          <span className="text-emerald-400 font-mono font-medium">STRICT (SSRF Guard Active)</span>
        </div>

        <button
          onClick={onOpenLauncher}
          className="flex items-center space-x-2 px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-lg shadow-blue-600/20 transition-all cursor-pointer"
        >
          <Radio className="w-3.5 h-3.5 animate-pulse" />
          <span>Launch New Scan</span>
        </button>
      </div>
    </header>
  );
};
