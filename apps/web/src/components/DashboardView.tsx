import React from 'react';
import { AlertTriangle, Globe, Activity, CheckCircle2, ShieldAlert } from 'lucide-react';
import { Scan, Finding } from '../types.js';

interface DashboardViewProps {
  scans: Scan[];
  activeScan: Scan | null;
  findings: Finding[];
  onSelectScan: (s: Scan) => void;
  onNavigateToFindings: () => void;
  onNavigateToPipeline: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  scans,
  activeScan,
  findings,
  onSelectScan,
  onNavigateToFindings,
  onNavigateToPipeline
}) => {
  const criticalCount = findings.filter(f => f.severity === 'CRITICAL').length;
  const highCount = findings.filter(f => f.severity === 'HIGH').length;

  return (
    <div className="space-y-6">
      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="p-4 bg-black border border-zinc-800 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">CRITICAL FINDINGS</p>
            <h3 className="text-2xl font-bold font-mono text-white mt-1">{criticalCount}</h3>
            <p className="text-[10px] font-mono text-zinc-400 mt-1 uppercase">IMMEDIATE ACTION</p>
          </div>
          <div className="w-8 h-8 bg-white text-black flex items-center justify-center font-mono font-bold">
            <ShieldAlert className="w-4 h-4 text-black" />
          </div>
        </div>

        <div className="p-4 bg-black border border-zinc-800 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">HIGH SEVERITY</p>
            <h3 className="text-2xl font-bold font-mono text-white mt-1">{highCount}</h3>
            <p className="text-[10px] font-mono text-zinc-400 mt-1 uppercase">EXPLOITABLE PATHS</p>
          </div>
          <div className="w-8 h-8 border border-zinc-700 bg-zinc-950 flex items-center justify-center font-mono">
            <AlertTriangle className="w-4 h-4 text-white" />
          </div>
        </div>

        <div className="p-4 bg-black border border-zinc-800 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">DISCOVERED ENDPOINTS</p>
            <h3 className="text-2xl font-bold font-mono text-white mt-1">
              {activeScan?.stats?.endpointsDiscovered || 0}
            </h3>
            <p className="text-[10px] font-mono text-zinc-400 mt-1 uppercase">ATTACK SURFACE NODES</p>
          </div>
          <div className="w-8 h-8 border border-zinc-700 bg-zinc-950 flex items-center justify-center font-mono">
            <Globe className="w-4 h-4 text-white" />
          </div>
        </div>

        <div className="p-4 bg-black border border-zinc-800 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">ASSESSMENTS COMPLETED</p>
            <h3 className="text-2xl font-bold font-mono text-white mt-1">
              {scans.filter(s => s.status === 'COMPLETED').length}
            </h3>
            <p className="text-[10px] font-mono text-zinc-400 mt-1 uppercase">DETERMINISTIC PROOFS</p>
          </div>
          <div className="w-8 h-8 border border-zinc-700 bg-zinc-950 flex items-center justify-center font-mono">
            <CheckCircle2 className="w-4 h-4 text-white" />
          </div>
        </div>
      </div>

      {/* Active Assessment Banner */}
      {activeScan && activeScan.status !== 'COMPLETED' && (
        <div className="p-4 bg-zinc-950 border border-zinc-800 flex items-center justify-between font-mono">
          <div className="flex items-center space-x-3">
            <div className="w-2 h-2 bg-white animate-ping" />
            <div>
              <div className="flex items-center space-x-2 text-xs">
                <span className="font-bold text-white uppercase tracking-wider">ACTIVE SCAN:</span>
                <span className="text-zinc-300">{activeScan.targetUrl}</span>
              </div>
              <p className="text-[10px] text-zinc-500 mt-0.5 uppercase tracking-wider">
                STAGE: <span className="text-white font-semibold">{activeScan.status}</span> |
                PROFILE: <span className="text-zinc-300">{activeScan.profileName}</span>
              </p>
            </div>
          </div>

          <button
            onClick={onNavigateToPipeline}
            className="px-3 py-1 bg-white hover:bg-zinc-200 text-black text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
          >
            LIVE PIPELINE
          </button>
        </div>
      )}

      {/* Two-Column Grid: Assessment History & Prioritized Findings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 font-mono">
        {/* Recent Scans */}
        <div className="p-4 bg-black border border-zinc-800">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-zinc-800">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-2">
              <Activity className="w-3.5 h-3.5 text-white" />
              <span>ASSESSMENT HISTORY</span>
            </h4>
            <span className="text-[10px] text-zinc-500">{scans.length} SCANS</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-zinc-500 uppercase text-[10px] border-b border-zinc-900">
                <tr>
                  <th className="py-2">TARGET</th>
                  <th className="py-2">PROFILE</th>
                  <th className="py-2">STATUS</th>
                  <th className="py-2 text-right">FINDINGS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-900 text-[11px]">
                {scans.slice(0, 5).map((scan) => (
                  <tr
                    key={scan.id}
                    onClick={() => onSelectScan(scan)}
                    className="hover:bg-zinc-950 cursor-pointer transition-colors"
                  >
                    <td className="py-2.5 font-medium text-white truncate max-w-[140px]">{scan.targetUrl}</td>
                    <td className="py-2.5 text-zinc-400">{scan.profileName}</td>
                    <td className="py-2.5">
                      <span className={`px-1.5 py-0.2 text-[9px] uppercase font-bold tracking-wider ${
                        scan.status === 'COMPLETED' ? 'bg-white text-black' :
                        scan.status === 'FAILED' ? 'border border-zinc-700 text-zinc-400' :
                        'bg-zinc-800 text-white animate-pulse'
                      }`}>
                        {scan.status}
                      </span>
                    </td>
                    <td className="py-2.5 text-right text-white font-bold">
                      {(scan.stats?.findingsCount?.critical || 0) +
                       (scan.stats?.findingsCount?.high || 0) +
                       (scan.stats?.findingsCount?.medium || 0) +
                       (scan.stats?.findingsCount?.low || 0)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* High Priority Findings */}
        <div className="p-4 bg-black border border-zinc-800">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-zinc-800">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-2">
              <AlertTriangle className="w-3.5 h-3.5 text-white" />
              <span>SECURITY FINDINGS</span>
            </h4>
            <button
              onClick={onNavigateToFindings}
              className="text-[10px] text-zinc-400 hover:text-white uppercase tracking-wider cursor-pointer underline"
            >
              VIEW ALL ({findings.length})
            </button>
          </div>

          <div className="space-y-2">
            {findings.slice(0, 4).map((f) => (
              <div
                key={f.id}
                className="p-2.5 bg-zinc-950 border border-zinc-900 hover:border-zinc-700 transition-colors"
              >
                <div className="flex items-center justify-between text-[10px]">
                  <span className={`px-1.5 py-0.2 font-bold uppercase tracking-wider ${
                    f.severity === 'CRITICAL' ? 'bg-white text-black font-black' :
                    f.severity === 'HIGH' ? 'bg-zinc-800 text-white' :
                    'border border-zinc-800 text-zinc-300'
                  }`}>
                    {f.severity}
                  </span>
                  <span className="text-zinc-500 uppercase">
                    CONFIDENCE: <span className="text-white">{f.confidence}</span>
                  </span>
                </div>
                <h5 className="text-xs font-semibold text-white mt-1">{f.title}</h5>
                <p className="text-[10px] text-zinc-500 mt-0.5 font-mono">
                  {f.httpMethod} {f.endpointPath}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
