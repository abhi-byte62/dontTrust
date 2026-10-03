import React from 'react';
import { BookOpen } from 'lucide-react';
import { RuleMeta } from '../types.js';

interface RulesViewProps {
  rules: RuleMeta[];
}

export const RulesView: React.FC<RulesViewProps> = ({ rules }) => {
  return (
    <div className="space-y-4">
      <div className="p-5 rounded-xl bg-[#0f172a] border border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h4 className="text-sm font-bold text-white font-mono flex items-center space-x-2">
              <BookOpen className="w-4 h-4 text-blue-400" />
              <span>Loaded Detection Rules & Verification Framework ({rules.length})</span>
            </h4>
            <p className="text-xs text-slate-400 mt-1">Modular extensible security rules loaded into the active scanner engine.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {rules.map(rule => (
            <div
              key={rule.id}
              className="p-4 rounded-lg bg-slate-900 border border-slate-800 space-y-2.5"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-slate-200">{rule.name}</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                  rule.mode === 'ACTIVE'
                    ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                    : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                }`}>
                  {rule.mode}
                </span>
              </div>

              <div className="flex items-center space-x-2 text-[11px] font-mono text-slate-400">
                <span>Rule ID: <span className="text-slate-300">{rule.id}</span></span>
                <span>•</span>
                <span>Category: <span className="text-blue-400">{rule.category}</span></span>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">{rule.description}</p>

              <div className="p-2.5 rounded bg-black/60 text-[11px] text-emerald-400/90 font-mono border border-slate-900">
                Remediation: {rule.remediation}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
