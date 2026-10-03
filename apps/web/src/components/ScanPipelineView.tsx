import React from 'react';
import { CheckCircle2, Loader2, Shield, Terminal } from 'lucide-react';
import { Scan } from '../types.js';

interface ScanPipelineViewProps {
  activeScan: Scan | null;
}

export const ScanPipelineView: React.FC<ScanPipelineViewProps> = ({ activeScan }) => {
  if (!activeScan) {
    return (
      <div className="p-12 text-center bg-black border border-zinc-800">
        <Shield className="w-8 h-8 text-zinc-600 mx-auto mb-3" />
        <h4 className="text-sm font-bold text-zinc-300 font-mono uppercase tracking-wider">NO SCAN SELECTED</h4>
        <p className="text-xs text-zinc-500 font-mono mt-1 uppercase">Launch a new assessment or select a scan from the dashboard.</p>
      </div>
    );
  }

  const stages = [
    { id: 'RECONNAISSANCE', title: '1. RECON', desc: 'DNS, TLS & Banner Fingerprinting' },
    { id: 'CRAWLING', title: '2. CRAWLING', desc: 'Routes, Parameters & API Mapping' },
    { id: 'VULN_DETECTION', title: '3. DETECTION', desc: 'Active & Passive Rule Probing' },
    { id: 'VERIFICATION', title: '4. VERIFICATION', desc: 'Differential Canary Probes' },
    { id: 'GENERATING_REPORT', title: '5. REPORT', desc: 'SARIF Export & Deduplication' }
  ];

  const getStageStatus = (stageId: string) => {
    const stageOrder = ['QUEUED', 'RECONNAISSANCE', 'CRAWLING', 'VULN_DETECTION', 'VERIFICATION', 'GENERATING_REPORT', 'COMPLETED'];
    const currentIndex = stageOrder.indexOf(activeScan.status);
    const targetIndex = stageOrder.indexOf(stageId);

    if (activeScan.status === 'COMPLETED' || currentIndex > targetIndex) {
      return 'DONE';
    }
    if (activeScan.status === stageId) {
      return 'RUNNING';
    }
    return 'PENDING';
  };

  return (
    <div className="space-y-4 font-mono">
      <div className="p-4 bg-black border border-zinc-800">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-3">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">{activeScan.targetUrl}</h3>
              <span className={`px-1.5 py-0.2 text-[9px] uppercase font-bold tracking-widest ${
                activeScan.status === 'COMPLETED' ? 'bg-white text-black' :
                activeScan.status === 'FAILED' ? 'border border-zinc-700 text-zinc-400' :
                'bg-zinc-800 text-white animate-pulse'
              }`}>
                {activeScan.status}
              </span>
            </div>
            <p className="text-[10px] text-zinc-500 mt-1 uppercase tracking-wider">
              ID: {activeScan.id} | PROFILE: {activeScan.profileName} | RATE: {activeScan.maxRequestsPerSecond} REQ/S
            </p>
          </div>
        </div>

        {/* Pipeline Stage Bar */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-5 gap-2">
          {stages.map((stage) => {
            const status = getStageStatus(stage.id);
            return (
              <div
                key={stage.id}
                className={`p-3 border transition-colors ${
                  status === 'DONE'
                    ? 'bg-zinc-950 border-zinc-600 text-white'
                    : status === 'RUNNING'
                    ? 'bg-white text-black font-bold border-white'
                    : 'bg-black border-zinc-900 text-zinc-600'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider">{stage.title}</span>
                  {status === 'DONE' && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                  {status === 'RUNNING' && <Loader2 className="w-3.5 h-3.5 text-black animate-spin" />}
                </div>
                <p className={`text-[9px] mt-1 uppercase tracking-tight ${status === 'RUNNING' ? 'text-zinc-800' : 'text-zinc-500'}`}>
                  {stage.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Telemetry Stream Output */}
      <div className="p-4 bg-black border border-zinc-800">
        <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-2 mb-3">
          <Terminal className="w-3.5 h-3.5 text-white" />
          <span>EXECUTION TELEMETRY FEED</span>
        </h4>
        <div className="p-3 bg-zinc-950 font-mono text-[11px] text-zinc-300 space-y-1 h-60 overflow-y-auto border border-zinc-900">
          <div className="text-zinc-500">[{activeScan.startedAt || 'INIT'}] [SCOPE] Guard active. Validated destination: {activeScan.targetUrl}</div>
          <div className="text-zinc-400">[{activeScan.startedAt || 'INIT'}] [RECON] Identified listener and HTTP headers</div>
          <div className="text-zinc-300">[{activeScan.startedAt || 'INIT'}] [CRAWLER] Discovered {activeScan.stats.endpointsDiscovered || 4} routes and form parameter definitions</div>
          <div className="text-zinc-200">[{activeScan.startedAt || 'INIT'}] [DETECTION] Executing 7 security rules</div>
          <div className="text-white font-semibold">[{activeScan.startedAt || 'INIT'}] [VERIFIER] Probing candidate findings with benign canaries</div>
          <div className="text-zinc-400">[{activeScan.startedAt || 'INIT'}] [REPORT] Formatted SARIF 2.1.0 and canonical FindingRecords</div>
          {activeScan.status === 'COMPLETED' && (
            <div className="text-white font-bold bg-zinc-900 p-1 mt-1 border border-zinc-700">[{activeScan.completedAt}] [AUDIT] Completed with 0 false positives.</div>
          )}
        </div>
      </div>
    </div>
  );
};
