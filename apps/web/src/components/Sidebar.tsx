import React from 'react';
import {
  LayoutDashboard,
  Activity,
  Network,
  Globe,
  AlertTriangle,
  BookOpen,
  FileText
} from 'lucide-react';

export type TabType = 'dashboard' | 'pipeline' | 'attack-surface' | 'endpoints' | 'findings' | 'rules' | 'reports';

interface SidebarProps {
  currentTab: TabType;
  onSelectTab: (tab: TabType) => void;
  findingsCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, onSelectTab, findingsCount }) => {
  const navItems: Array<{ id: TabType; label: string; icon: React.ReactNode; badge?: number }> = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'pipeline', label: 'Live Pipeline', icon: <Activity className="w-4 h-4" /> },
    { id: 'attack-surface', label: 'Attack Surface', icon: <Network className="w-4 h-4" /> },
    { id: 'endpoints', label: 'Endpoints & APIs', icon: <Globe className="w-4 h-4" /> },
    { id: 'findings', label: 'Findings & Evidence', icon: <AlertTriangle className="w-4 h-4" />, badge: findingsCount },
    { id: 'rules', label: 'Detection Rules', icon: <BookOpen className="w-4 h-4" /> },
    { id: 'reports', label: 'Export Reports', icon: <FileText className="w-4 h-4" /> }
  ];

  return (
    <aside className="w-64 border-r border-slate-800 bg-[#0b0f19] flex flex-col justify-between p-4">
      <div className="space-y-1">
        <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-400 font-mono">
          Platform Views
        </div>
        {navItems.map((item) => {
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                isActive
                  ? 'bg-blue-600/15 text-blue-400 border border-blue-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
              }`}
            >
              <div className="flex items-center space-x-3">
                {item.icon}
                <span>{item.label}</span>
              </div>
              {item.badge !== undefined && item.badge > 0 && (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-red-500/20 text-red-400 border border-red-500/30 font-semibold">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800 text-[11px] text-slate-400 space-y-1">
        <div className="flex items-center justify-between font-mono">
          <span>Engine Status</span>
          <span className="text-emerald-400 font-bold">ONLINE</span>
        </div>
        <div className="flex items-center justify-between font-mono text-slate-400">
          <span>Workers Active</span>
          <span>4 Swarm</span>
        </div>
      </div>
    </aside>
  );
};
