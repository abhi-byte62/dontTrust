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
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-3.5 h-3.5" /> },
    { id: 'pipeline', label: 'Live Pipeline', icon: <Activity className="w-3.5 h-3.5" /> },
    { id: 'attack-surface', label: 'Attack Surface', icon: <Network className="w-3.5 h-3.5" /> },
    { id: 'endpoints', label: 'Endpoints & APIs', icon: <Globe className="w-3.5 h-3.5" /> },
    { id: 'findings', label: 'Findings & Evidence', icon: <AlertTriangle className="w-3.5 h-3.5" />, badge: findingsCount },
    { id: 'rules', label: 'Detection Rules', icon: <BookOpen className="w-3.5 h-3.5" /> },
    { id: 'reports', label: 'Export Reports', icon: <FileText className="w-3.5 h-3.5" /> }
  ];

  return (
    <aside className="w-60 border-r border-zinc-800 bg-black flex flex-col justify-between p-3 select-none">
      <div className="space-y-0.5">
        <div className="px-2.5 py-2 text-[10px] font-bold uppercase tracking-widest text-zinc-500 font-mono">
          NAVIGATION
        </div>
        {navItems.map((item) => {
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2 text-xs font-mono uppercase tracking-wider transition-colors cursor-pointer ${
                isActive
                  ? 'bg-white text-black font-bold'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                {item.icon}
                <span>{item.label}</span>
              </div>
              {item.badge !== undefined && item.badge > 0 && (
                <span className={`px-1.5 py-0.2 text-[10px] font-mono font-bold ${
                  isActive ? 'bg-black text-white' : 'bg-zinc-800 text-white'
                }`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="p-3 bg-zinc-950 border border-zinc-800 text-[10px] font-mono text-zinc-400 space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-zinc-500 uppercase tracking-wider">ENGINE</span>
          <span className="text-white font-bold tracking-wider">[ ONLINE ]</span>
        </div>
        <div className="flex items-center justify-between text-zinc-400">
          <span className="text-zinc-500 uppercase tracking-wider">ORCHESTRATION</span>
          <span className="text-zinc-300">4 WORKERS</span>
        </div>
      </div>
    </aside>
  );
};
