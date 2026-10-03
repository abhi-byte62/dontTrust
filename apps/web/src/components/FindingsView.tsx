import React, { useState } from 'react';
import { AlertTriangle, Search, FileCode } from 'lucide-react';
import { Finding } from '../types.js';

interface FindingsViewProps {
  findings: Finding[];
  onSelectFinding: (f: Finding) => void;
}

export const FindingsView: React.FC<FindingsViewProps> = ({ findings, onSelectFinding }) => {
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');
  const [search, setSearch] = useState<string>('');

  const filtered = findings.filter(f => {
    const matchesSeverity = severityFilter === 'ALL' || f.severity === severityFilter;
    const matchesSearch = f.title.toLowerCase().includes(search.toLowerCase()) ||
                          f.endpointPath.toLowerCase().includes(search.toLowerCase()) ||
                          f.ruleId.toLowerCase().includes(search.toLowerCase());
    return matchesSeverity && matchesSearch;
  });

  const getSeverityBadge = (sev: string) => {
    switch (sev) {
      case 'CRITICAL': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'HIGH': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'MEDIUM': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'LOW': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  return (
    <div className="space-y-4">
      {/* Control Bar */}
      <div className="p-4 rounded-xl bg-[#0f172a] border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-2">
          <span className="text-xs text-slate-400 font-medium">Severity:</span>
          {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map(s => (
            <button
              key={s}
              onClick={() => setSeverityFilter(s)}
              className={`px-2.5 py-1 rounded text-xs font-mono font-medium transition-all ${
                severityFilter === s
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search findings or rules..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 pr-3 py-1.5 bg-slate-900 border border-slate-800 rounded-md text-xs text-slate-200 font-mono focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Findings Table */}
      <div className="p-5 rounded-xl bg-[#0f172a] border border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-sm font-bold text-white font-mono flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-orange-400" />
            <span>Assessed Findings & Evidence Vault ({filtered.length})</span>
          </h4>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="text-slate-400 uppercase text-[10px] border-b border-slate-800">
              <tr>
                <th className="py-2.5">Severity</th>
                <th className="py-2.5">Confidence</th>
                <th className="py-2.5">Finding Title</th>
                <th className="py-2.5">Target Endpoint</th>
                <th className="py-2.5">Category</th>
                <th className="py-2.5 text-right">Evidence</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filtered.map(f => (
                <tr
                  key={f.id}
                  onClick={() => onSelectFinding(f)}
                  className="hover:bg-slate-800/40 cursor-pointer transition-colors"
                >
                  <td className="py-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getSeverityBadge(f.severity)}`}>
                      {f.severity}
                    </span>
                  </td>
                  <td className="py-3">
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] font-semibold border border-slate-700">
                      {f.confidence}
                    </span>
                  </td>
                  <td className="py-3 font-semibold text-slate-200">{f.title}</td>
                  <td className="py-3 text-slate-400 text-[11px]">{f.httpMethod} {f.endpointPath}</td>
                  <td className="py-3 text-slate-400 text-[10px]">{f.category}</td>
                  <td className="py-3 text-right">
                    <span className="text-xs text-blue-400 hover:underline flex items-center justify-end space-x-1">
                      <FileCode className="w-3.5 h-3.5" />
                      <span>View Trace</span>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
