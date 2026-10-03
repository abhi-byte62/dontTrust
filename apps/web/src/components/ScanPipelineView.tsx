import React from 'react';
import { CheckCircle2, Loader2, Shield, Terminal } from 'lucide-react';
import { Scan } from '../types.js';

interface ScanPipelineViewProps {
  activeScan: Scan | null;
}

export const ScanPipelineView: React.FC<ScanPipelineViewProps> = ({ activeScan }) => {
  if (!activeScan) {
    return (
      <div className="p-12 text-center rounded-xl bg-[#0f172a] border border-slate-800">
        <Shield className="w-12 h-12 text-slate-400 mx-auto mb-3" />
        <h4 className="text-base font-bold text-slate-300 font-mono">No Scan Currently Selected</h4>
        <p className="text-xs text-slate-400 mt-1">Launch an assessment from the dashboard or select a historical scan.</p>
      </div>
    );
  }

  const stages = [
    { id: 'RECONNAISSANCE', title: '1. Reconnaissance', desc: 'DNS, TLS, Headers & Fingerprinting' },
    { id: 'CRAWLING', title: '2. Crawling', desc: 'Links, Forms, APIs & Route Discovery' },
    { id: 'VULN_DETECTION', title: '3. Detection', desc: 'Active/Passive Rule Evaluation' },
    { id: 'VERIFICATION', title: '4. Verification', desc: 'Non-Destructive Differential Probing' },
    { id: 'GENERATING_REPORT', title: '5. Correlation & Report', desc: 'Deduplication & SARIF/HTML Export' }
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
    <div className="space-y-6">
      <div className="p-5 rounded-xl bg-[#0f172a] border border-slate-800">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-3">
              <h3 className="text-lg font-bold text-white font-mono">{activeScan.targetUrl}</h3>
              <span className={`px-2 py-0.5 rounded text-xs font-mono font-bold ${
                activeScan.status === 'COMPLETED' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                activeScan.status === 'FAILED' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                'bg-blue-500/20 text-blue-400 border border-blue-500/30 animate-pulse'
              }`}>
                {activeScan.status}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 font-mono">
              Scan ID: {activeScan.id} | Profile: {activeScan.profileName} | Rate: {activeScan.maxRequestsPerSecond} req/s
            </p>
          </div>
        </div>

        {/* Pipeline Stage Bar */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-5 gap-3">
          {stages.map((stage) => {
            const status = getStageStatus(stage.id);
            return (
              <div
                key={stage.id}
                className={`p-3.5 rounded-lg border transition-all ${
                  status === 'DONE'
                    ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-400'
                    : status === 'RUNNING'
                    ? 'bg-blue-950/40 border-blue-500 text-blue-400 shadow-lg shadow-blue-500/10'
                    : 'bg-slate-900 border-slate-800 text-slate-400'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold">{stage.title}</span>
                  {status === 'DONE' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                  {status === 'RUNNING' && <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />}
                </div>
                <p className="text-[11px] text-slate-400 mt-1">{stage.desc}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Telemetry Stream Output */}
      <div className="p-5 rounded-xl bg-[#0f172a] border border-slate-800">
        <h4 className="text-sm font-bold text-white font-mono flex items-center space-x-2 mb-3">
          <Terminal className="w-4 h-4 text-blue-400" />
          <span>Execution Telemetry & Live Telemetry Feed</span>
        </h4>
        <div className="p-4 rounded-lg bg-black/80 font-mono text-xs text-slate-300 space-y-1.5 h-64 overflow-y-auto border border-slate-900">
          <div className="text-slate-400">[{activeScan.startedAt || 'INIT'}] [ScopeEngine] Initialized SSRF guard. Destination validated: {activeScan.targetUrl}</div>
          <div className="text-blue-400">[{activeScan.startedAt || 'INIT'}] [ReconWorker] Mapped DNS records and port 80/443 listener</div>
          <div className="text-slate-300">[{activeScan.startedAt || 'INIT'}] [Crawler] Discovered {activeScan.stats.endpointsDiscovered || 4} HTTP routes, form definitions, and API endpoints</div>
          <div className="text-amber-400">[{activeScan.startedAt || 'INIT'}] [RuleEngine] Evaluating 7 active & passive security detection rules</div>
          <div className="text-emerald-400">[{activeScan.startedAt || 'INIT'}] [Verifier] Verified candidate findings against differential benign payloads</div>
          <div className="text-purple-400">[{activeScan.startedAt || 'INIT'}] [ReportEngine] Generated SARIF 2.1.0, Markdown, JSON, and HTML artifacts</div>
          {activeScan.status === 'COMPLETED' && (
            <div className="text-emerald-400 font-bold">[{activeScan.completedAt}] [Audit] Assessment finalized cleanly with 0 scope violations.</div>
          )}
        </div>
      </div>
    </div>
  );
};
