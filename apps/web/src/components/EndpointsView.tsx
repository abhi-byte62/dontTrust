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
      case 'GET': return 'bg-white text-black font-bold';
      case 'POST': return 'bg-zinc-800 text-white font-bold';
      case 'PUT': return 'border border-zinc-600 text-zinc-300';
      case 'DELETE': return 'border border-zinc-400 text-white font-black';
      default: return 'border border-zinc-800 text-zinc-500';
    }
  };

  return (
    <div className="space-y-4 font-mono">
      {/* Control Bar */}
      <div className="p-3 bg-black border border-zinc-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-1.5">
          <span className="text-[10px] text-zinc-500 uppercase tracking-wider mr-1">METHOD:</span>
          {['ALL', 'GET', 'POST', 'PUT', 'DELETE'].map(m => (
            <button
              key={m}
              onClick={() => setMethodFilter(m)}
              className={`px-2 py-1 text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                methodFilter === m
                  ? 'bg-white text-black'
                  : 'bg-black text-zinc-400 hover:text-white border border-zinc-800'
              }`}
            >
              {m}
            </button>
          ))}
        </div>

        <div className="relative">
          <Search className="w-3 h-3 text-zinc-500 absolute left-2.5 top-2.5" />
          <input
            type="text"
            placeholder="SEARCH PATHS..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-7 pr-3 py-1 bg-black border border-zinc-800 text-xs text-white uppercase placeholder-zinc-600 focus:outline-none focus:border-white w-52"
          />
        </div>
      </div>

      {/* Endpoints Table */}
      <div className="p-4 bg-black border border-zinc-800">
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-zinc-800">
          <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-2">
            <Globe className="w-3.5 h-3.5 text-white" />
            <span>DISCOVERED APPLICATION ENDPOINTS ({filtered.length})</span>
          </h4>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="text-zinc-500 uppercase text-[10px] border-b border-zinc-900">
              <tr>
                <th className="py-2">METHOD</th>
                <th className="py-2">PATH</th>
                <th className="py-2">CONTENT-TYPE</th>
                <th className="py-2">PARAMETERS</th>
                <th className="py-2 text-right">STATUS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-900 text-[11px]">
              {filtered.map(ep => (
                <tr key={ep.id} className="hover:bg-zinc-950 transition-colors">
                  <td className="py-2.5">
                    <span className={`px-1.5 py-0.2 text-[9px] uppercase font-bold tracking-wider ${getMethodBadge(ep.method)}`}>
                      {ep.method}
                    </span>
                  </td>
                  <td className="py-2.5 font-medium text-white">{ep.path}</td>
                  <td className="py-2.5 text-zinc-500 text-[10px]">{ep.contentType || 'unknown'}</td>
                  <td className="py-2.5 text-zinc-300">
                    {ep.parameters.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {ep.parameters.map(p => (
                          <span key={p} className="px-1.5 py-0.2 bg-zinc-900 border border-zinc-800 text-zinc-300 text-[9px] uppercase">
                            {p}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-zinc-600 text-[10px]">-</span>
                    )}
                  </td>
                  <td className="py-2.5 text-right">
                    <span className="px-1.5 py-0.2 border border-zinc-700 bg-zinc-950 text-white text-[10px] font-bold">
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
