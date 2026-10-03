import React, { useState } from 'react';
import { Globe, Search } from 'lucide-react';
import { DiscoveredEndpoint } from '../types.js';

interface EndpointsViewProps {
  endpoints: DiscoveredEndpoint[];
}

export const EndpointsView: React.FC<EndpointsViewProps> = ({ endpoints }) => {
  const [methodFilter, setMethodFilter] = useState<string>('ALL');
  const [search, setSearch] = useState<string>('');

  const filtered = endpoints.filter(ep => {
    const matchesMethod = methodFilter === 'ALL' || ep.method === methodFilter;
    const matchesSearch = ep.path.toLowerCase().includes(search.toLowerCase());
    return matchesMethod && matchesSearch;
  });

  const getMethodBadge = (method: string) => {
    switch (method.toUpperCase()) {
      case 'GET': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'POST': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'PUT': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'DELETE': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  return (
    <div className="space-y-4">
      {/* Control Bar */}
      <div className="p-4 rounded-xl bg-[#0f172a] border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-2">
          <span className="text-xs text-slate-400 font-medium">Method:</span>
          {['ALL', 'GET', 'POST', 'PUT', 'DELETE'].map(m => (
            <button
              key={m}
              onClick={() => setMethodFilter(m)}
              className={`px-2.5 py-1 rounded text-xs font-mono font-medium transition-all ${
                methodFilter === m
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {m}
            </button>
          ))}
        </div>

        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search endpoint paths..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 pr-3 py-1.5 bg-slate-900 border border-slate-800 rounded-md text-xs text-slate-200 font-mono focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Endpoints Table */}
      <div className="p-5 rounded-xl bg-[#0f172a] border border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-sm font-bold text-white font-mono flex items-center space-x-2">
            <Globe className="w-4 h-4 text-blue-400" />
            <span>Discovered Endpoints & APIs ({filtered.length})</span>
          </h4>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="text-slate-400 uppercase text-[10px] border-b border-slate-800">
              <tr>
                <th className="py-2.5">Method</th>
                <th className="py-2.5">Path</th>
                <th className="py-2.5">Content-Type</th>
                <th className="py-2.5">Discovered Parameters</th>
                <th className="py-2.5 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filtered.map(ep => (
                <tr key={ep.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getMethodBadge(ep.method)}`}>
                      {ep.method}
                    </span>
                  </td>
                  <td className="py-3 font-semibold text-slate-200">{ep.path}</td>
                  <td className="py-3 text-slate-400 text-[11px]">{ep.contentType || 'unknown'}</td>
                  <td className="py-3 text-slate-300">
                    {ep.parameters.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {ep.parameters.map(p => (
                          <span key={p} className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px]">
                            {p}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-slate-500 text-[11px]">None</span>
                    )}
                  </td>
                  <td className="py-3 text-right">
                    <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold">
                      {ep.statusCode || 200}
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
