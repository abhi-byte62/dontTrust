import React, { useState } from 'react';
import { Network, Globe, Server, FileCode, AlertTriangle, Layers, Search } from 'lucide-react';
import { AttackSurfaceGraph } from '../types.js';

interface AttackSurfaceExplorerProps {
  graph: AttackSurfaceGraph | null;
}

export const AttackSurfaceExplorer: React.FC<AttackSurfaceExplorerProps> = ({ graph }) => {
  const [filterType, setFilterType] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedNode, setSelectedNode] = useState<any | null>(null);

  if (!graph || graph.nodes.length === 0) {
    return (
      <div className="p-12 text-center rounded-xl bg-[#0f172a] border border-slate-800">
        <Network className="w-12 h-12 text-slate-400 mx-auto mb-3" />
        <h4 className="text-base font-bold text-slate-300 font-mono">No Attack Surface Graph Available</h4>
        <p className="text-xs text-slate-400 mt-1">Run a scan to map the target's attack surface nodes and relations.</p>
      </div>
    );
  }

  const filteredNodes = graph.nodes.filter(node => {
    const matchesFilter = filterType === 'ALL' || node.type === filterType;
    const matchesSearch = node.label.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getNodeIcon = (type: string) => {
    switch (type) {
      case 'DOMAIN': return <Globe className="w-4 h-4 text-blue-400" />;
      case 'PORT': return <Server className="w-4 h-4 text-purple-400" />;
      case 'ENDPOINT': return <FileCode className="w-4 h-4 text-emerald-400" />;
      case 'FINDING': return <AlertTriangle className="w-4 h-4 text-red-400" />;
      default: return <Layers className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="space-y-4">
      {/* Controls Bar */}
      <div className="p-4 rounded-xl bg-[#0f172a] border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-2">
          <span className="text-xs text-slate-400 font-medium">Filter Type:</span>
          {['ALL', 'DOMAIN', 'PORT', 'ENDPOINT', 'FINDING'].map(t => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={`px-2.5 py-1 rounded text-xs font-mono font-medium transition-all ${
                filterType === t
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search nodes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 pr-3 py-1.5 bg-slate-900 border border-slate-800 rounded-md text-xs text-slate-200 font-mono focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Graph Visual Explorer Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Node Grid Layout */}
        <div className="lg:col-span-2 p-5 rounded-xl bg-[#0f172a] border border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-bold text-white font-mono flex items-center space-x-2">
              <Network className="w-4 h-4 text-blue-400" />
              <span>Attack Surface Node Topology ({filteredNodes.length} Nodes)</span>
            </h4>
            <span className="text-xs text-slate-400">{graph.edges.length} Adjacency Edges</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[480px] overflow-y-auto pr-2">
            {filteredNodes.map(node => {
              const isSelected = selectedNode?.id === node.id;
              return (
                <div
                  key={node.id}
                  onClick={() => setSelectedNode(node)}
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-blue-950/40 border-blue-500 shadow-md shadow-blue-500/10'
                      : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {getNodeIcon(node.type)}
                      <span className="text-xs font-mono font-bold text-slate-200 truncate max-w-[180px]">
                        {node.label}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                      {node.type}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Node Inspector Detail Panel */}
        <div className="p-5 rounded-xl bg-[#0f172a] border border-slate-800">
          <h4 className="text-sm font-bold text-white font-mono mb-4">Node Inspector</h4>
          {selectedNode ? (
            <div className="space-y-3 text-xs">
              <div>
                <span className="text-slate-400 block">Identifier:</span>
                <span className="font-mono text-slate-200 text-[11px]">{selectedNode.id}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Type:</span>
                <span className="font-mono text-blue-400 font-bold">{selectedNode.type}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Label:</span>
                <span className="font-mono text-slate-200">{selectedNode.label}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Metadata:</span>
                <pre className="mt-1 p-2.5 rounded bg-black/70 font-mono text-[11px] text-slate-300 overflow-x-auto border border-slate-900">
                  {JSON.stringify(selectedNode.data, null, 2)}
                </pre>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-slate-400 text-xs">
              Select any node from the graph to inspect relationships and payload metadata.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
