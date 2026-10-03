import React from 'react';
import { BookOpen } from 'lucide-react';
import { RuleMeta } from '../types.js';

interface RulesViewProps {
  rules: RuleMeta[];
}

export const RulesView: React.FC<RulesViewProps> = ({ rules }) => {
  return (
    <div className="space-y-4 font-mono">
      <div className="p-4 bg-black border border-zinc-800">
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-zinc-800">
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-2">
              <BookOpen className="w-3.5 h-3.5 text-white" />
              <span>DETECTION RULE CATALOG ({rules.length})</span>
            </h4>
            <p className="text-[10px] text-zinc-500 mt-0.5 uppercase">Modular active/passive security analysis rules.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {rules.map(rule => (
            <div
              key={rule.id}
              className="p-3 bg-zinc-950 border border-zinc-900 hover:border-zinc-700 transition-colors space-y-2 text-xs"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white uppercase">{rule.name}</span>
                <span className="px-1.5 py-0.2 text-[9px] font-bold uppercase tracking-wider bg-white text-black">
                  {rule.mode}
                </span>
              </div>

              <div className="flex items-center space-x-2 text-[10px] text-zinc-500 uppercase">
                <span>ID: <span className="text-zinc-300">{rule.id}</span></span>
                <span>•</span>
                <span>CATEGORY: <span className="text-white">{rule.category}</span></span>
              </div>

              <p className="text-[11px] text-zinc-300 leading-relaxed font-sans">{rule.description}</p>

              <div className="p-2 bg-black text-[10px] text-zinc-300 font-mono border border-zinc-800">
                <span className="text-zinc-500 uppercase">REMEDIATION:</span> {rule.remediation}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
