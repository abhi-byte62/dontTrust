import React from 'react';
import { Shield, Radio, Lock } from 'lucide-react';
import { Project } from '../types.js';

interface HeaderProps {
  projects: Project[];
  selectedProject: Project | null;
  onSelectProject: (p: Project) => void;
  onOpenLauncher: () => void;
  onNavigateHome: () => void;
  onOpenScopePolicy: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  projects,
  selectedProject,
  onSelectProject,
  onOpenLauncher,
  onNavigateHome,
  onOpenScopePolicy
}) => {
  return (
    <header className="h-14 border-b border-zinc-800 bg-black px-6 flex items-center justify-between z-10 sticky top-0">
      <div className="flex items-center space-x-6">
        <div
          onClick={onNavigateHome}
          className="flex items-center space-x-3 cursor-pointer hover:opacity-85 transition-opacity"
          title="Return to Dashboard"
        >
          <div className="w-7 h-7 bg-white text-black flex items-center justify-center font-black rounded-none">
            <Shield className="w-4 h-4 fill-black text-black" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold tracking-wider text-white font-mono text-sm uppercase">DONTTRUST</span>
              <span className="px-1.5 py-0.2 rounded-none text-[9px] font-mono bg-zinc-900 text-zinc-400 border border-zinc-800 uppercase tracking-widest">v2.0-PRO</span>
            </div>
            <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-mono">Security Assessment Platform</p>
          </div>
        </div>

        <div className="h-4 w-[1px] bg-zinc-800" />

        {/* Project Selector */}
        <div className="flex items-center space-x-2 font-mono text-xs">
          <span className="text-[11px] text-zinc-500 uppercase tracking-wider">PROJECT:</span>
          <select
            className="bg-black border border-zinc-800 text-xs rounded-none px-2.5 py-1 text-white focus:outline-none focus:border-white font-mono cursor-pointer transition-colors"
            value={selectedProject?.id || ''}
            onChange={(e) => {
              const p = projects.find(item => item.id === e.target.value);
              if (p) onSelectProject(p);
            }}
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id} className="bg-black text-white">{p.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        {/* Clickable Scope / Guard Badge */}
        <button
          type="button"
          onClick={onOpenScopePolicy}
          title="View Scope Enforcement & SSRF Policy Details"
          className="flex items-center space-x-2 px-2.5 py-1 bg-black border border-zinc-800 hover:border-zinc-500 text-[11px] text-zinc-400 hover:text-white font-mono transition-colors cursor-pointer"
        >
          <Lock className="w-3 h-3 text-white" />
          <span className="text-zinc-500 uppercase">GUARD:</span>
          <span className="text-white font-semibold uppercase">[STRICT] SSRF ON</span>
        </button>

        <button
          onClick={onOpenLauncher}
          className="flex items-center space-x-2 px-3.5 py-1.5 bg-white hover:bg-zinc-200 text-black text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
        >
          <Radio className="w-3.5 h-3.5 text-black animate-pulse" />
          <span>LAUNCH SCAN</span>
        </button>
      </div>
    </header>
  );
};
