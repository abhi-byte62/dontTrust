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
      case 'CRITICAL': return 'bg-white text-black font-black';
      case 'HIGH': return 'bg-zinc-800 text-white font-bold';
      case 'MEDIUM': return 'border border-zinc-600 text-zinc-300';
      case 'LOW': return 'border border-zinc-800 text-zinc-500';
      default: return 'border border-zinc-900 text-zinc-600';
    }
  };

  return (
    <div className="space-y-4 font-mono">
      {/* Control Bar */}
      <div className="p-3 bg-black border border-zinc-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-1.5">
          <span className="text-[10px] text-zinc-500 uppercase tracking-wider mr-1">SEVERITY:</span>
          {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map(s => (
            <button
              key={s}
              onClick={() => setSeverityFilter(s)}
              className={`px-2 py-1 text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                severityFilter === s
                  ? 'bg-white text-black'
                  : 'bg-black text-zinc-400 hover:text-white border border-zinc-800'
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        <div className="relative">
          <Search className="w-3 h-3 text-zinc-500 absolute left-2.5 top-2.5" />
          <input
            type="text"
            placeholder="SEARCH FINDINGS..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-7 pr-3 py-1 bg-black border border-zinc-800 text-xs text-white uppercase placeholder-zinc-600 focus:outline-none focus:border-white w-52"
          />
        </div>
      </div>

      {/* Findings Table */}
      <div className="p-4 bg-black border border-zinc-800">
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-zinc-800">
          <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-2">
            <AlertTriangle className="w-3.5 h-3.5 text-white" />
            <span>VERIFIED FINDINGS & EVIDENCE VAULT ({filtered.length})</span>
          </h4>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="text-zinc-500 uppercase text-[10px] border-b border-zinc-900">
              <tr>
                <th className="py-2">SEVERITY</th>
                <th className="py-2">CONFIDENCE</th>
                <th className="py-2">TITLE</th>
                <th className="py-2">ENDPOINT</th>
                <th className="py-2">CATEGORY</th>
                <th className="py-2 text-right">EVIDENCE</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-900 text-[11px]">
              {filtered.map(f => (
                <tr
                  key={f.id}
                  onClick={() => onSelectFinding(f)}
                  className="hover:bg-zinc-950 cursor-pointer transition-colors"
                >
                  <td className="py-2.5">
                    <span className={`px-1.5 py-0.2 text-[9px] uppercase font-bold tracking-wider ${getSeverityBadge(f.severity)}`}>
                      {f.severity}
                    </span>
                  </td>
                  <td className="py-2.5">
                    <span className="px-1.5 py-0.2 bg-zinc-950 text-zinc-400 text-[9px] uppercase border border-zinc-800">
                      {f.confidence}
                    </span>
                  </td>
                  <td className="py-2.5 font-medium text-white">{f.title}</td>
                  <td className="py-2.5 text-zinc-400 text-[10px]">{f.httpMethod} {f.endpointPath}</td>
                  <td className="py-2.5 text-zinc-500 text-[10px] uppercase">{f.category}</td>
                  <td className="py-2.5 text-right">
                    <span className="text-[10px] text-zinc-300 hover:text-white uppercase flex items-center justify-end space-x-1 underline">
                      <FileCode className="w-3 h-3" />
                      <span>INSPECT</span>
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
