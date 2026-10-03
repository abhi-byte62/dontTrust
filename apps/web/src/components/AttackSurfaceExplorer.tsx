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
      <div className="p-12 text-center bg-black border border-zinc-800 font-mono">
        <Network className="w-8 h-8 text-zinc-600 mx-auto mb-3" />
        <h4 className="text-sm font-bold text-zinc-300 uppercase tracking-wider">NO ATTACK SURFACE GRAPH AVAILABLE</h4>
        <p className="text-xs text-zinc-500 mt-1 uppercase">Run an assessment to map target entities and relations.</p>
      </div>
    );
  }

  const filteredNodes = graph.nodes.filter(node => {
    const matchesFilter = filterType === 'ALL' || node.type === filterType;
    const matchesSearch = node.label.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getNodeIcon = (type: string, isSelected: boolean) => {
    const colorClass = isSelected ? 'text-black' : 'text-white';
    switch (type) {
      case 'DOMAIN': return <Globe className={`w-3.5 h-3.5 ${colorClass}`} />;
      case 'PORT': return <Server className={`w-3.5 h-3.5 ${colorClass}`} />;
      case 'ENDPOINT': return <FileCode className={`w-3.5 h-3.5 ${colorClass}`} />;
      case 'FINDING': return <AlertTriangle className={`w-3.5 h-3.5 ${colorClass}`} />;
      default: return <Layers className={`w-3.5 h-3.5 ${colorClass}`} />;
    }
  };

  return (
    <div className="space-y-4 font-mono">
      {/* Controls Bar */}
      <div className="p-3 bg-black border border-zinc-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-1.5">
          <span className="text-[10px] text-zinc-500 uppercase tracking-wider mr-1">FILTER:</span>
          {['ALL', 'DOMAIN', 'PORT', 'ENDPOINT', 'FINDING'].map(t => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={`px-2 py-1 text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                filterType === t
                  ? 'bg-white text-black'
                  : 'bg-black text-zinc-400 hover:text-white border border-zinc-800'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="relative">
          <Search className="w-3 h-3 text-zinc-500 absolute left-2.5 top-2.5" />
          <input
            type="text"
            placeholder="SEARCH NODES..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-7 pr-3 py-1 bg-black border border-zinc-800 text-xs text-white uppercase placeholder-zinc-600 focus:outline-none focus:border-white w-48"
          />
        </div>
      </div>

      {/* Graph Visual Explorer Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Node Grid Layout */}
        <div className="lg:col-span-2 p-4 bg-black border border-zinc-800">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-zinc-800">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-2">
              <Network className="w-3.5 h-3.5 text-white" />
              <span>TOPOLOGY ({filteredNodes.length} NODES)</span>
            </h4>
            <span className="text-[10px] text-zinc-500 uppercase">{graph.edges.length} EDGES</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[480px] overflow-y-auto pr-1">
            {filteredNodes.map(node => {
              const isSelected = selectedNode?.id === node.id;
              return (
                <div
                  key={node.id}
                  onClick={() => setSelectedNode(node)}
                  className={`p-2.5 border cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-white text-black border-white font-bold'
                      : 'bg-zinc-950 border-zinc-900 text-zinc-300 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {getNodeIcon(node.type, isSelected)}
                      <span className="text-xs truncate max-w-[170px]">
                        {node.label}
                      </span>
                    </div>
                    <span className={`text-[9px] uppercase px-1 py-0.2 font-bold ${
                      isSelected ? 'bg-black text-white' : 'bg-zinc-900 text-zinc-400'
                    }`}>
                      {node.type}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Node Inspector Detail Panel */}
        <div className="p-4 bg-black border border-zinc-800">
          <h4 className="text-xs font-bold text-white uppercase tracking-wider pb-3 mb-3 border-b border-zinc-800">
            NODE INSPECTOR
          </h4>
          {selectedNode ? (
            <div className="space-y-2.5 text-xs">
              <div>
                <span className="text-zinc-500 uppercase text-[10px] block">IDENTIFIER</span>
                <span className="text-white text-[11px] font-mono break-all">{selectedNode.id}</span>
              </div>
              <div>
                <span className="text-zinc-500 uppercase text-[10px] block">TYPE</span>
                <span className="text-white font-bold uppercase">{selectedNode.type}</span>
              </div>
              <div>
                <span className="text-zinc-500 uppercase text-[10px] block">LABEL</span>
                <span className="text-white break-all">{selectedNode.label}</span>
              </div>
              <div>
                <span className="text-zinc-500 uppercase text-[10px] block">PAYLOAD DATA</span>
                <pre className="mt-1 p-2 bg-zinc-950 font-mono text-[10px] text-zinc-300 overflow-x-auto border border-zinc-900">
                  {JSON.stringify(selectedNode.data, null, 2)}
                </pre>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-zinc-500 text-xs uppercase">
              Select a node to view attributes.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
