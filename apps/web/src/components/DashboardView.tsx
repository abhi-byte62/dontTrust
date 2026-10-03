import React from 'react';
import { AlertTriangle, Globe, Activity, CheckCircle2, Flame } from 'lucide-react';
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
      {/* Top Telemetry Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-[#0f172a] border border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-medium">Critical Findings</p>
            <h3 className="text-2xl font-bold font-mono text-red-500 mt-1">{criticalCount}</h3>
            <p className="text-[11px] text-red-400/80 mt-1">Requires immediate remediation</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center">
            <Flame className="w-5 h-5 text-red-400" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#0f172a] border border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-medium">High Severity</p>
            <h3 className="text-2xl font-bold font-mono text-orange-400 mt-1">{highCount}</h3>
            <p className="text-[11px] text-orange-400/80 mt-1">High exploitability impact</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-orange-400" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#0f172a] border border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-medium">Discovered Endpoints</p>
            <h3 className="text-2xl font-bold font-mono text-blue-400 mt-1">
              {activeScan?.stats?.endpointsDiscovered || 0}
            </h3>
            <p className="text-[11px] text-blue-400/80 mt-1">Mapped attack surface</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
            <Globe className="w-5 h-5 text-blue-400" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#0f172a] border border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-medium">Assessments Completed</p>
            <h3 className="text-2xl font-bold font-mono text-emerald-400 mt-1">
              {scans.filter(s => s.status === 'COMPLETED').length}
            </h3>
            <p className="text-[11px] text-emerald-400/80 mt-1">Full evidence verified</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          </div>
        </div>
      </div>

      {/* Active Assessment Banner */}
      {activeScan && activeScan.status !== 'COMPLETED' && (
        <div className="p-4 rounded-xl bg-blue-950/40 border border-blue-500/30 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-3 h-3 rounded-full bg-blue-500 animate-ping" />
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-mono font-bold text-blue-400">ACTIVE SCAN IN PROGRESS:</span>
                <span className="text-xs font-mono text-white">{activeScan.targetUrl}</span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Current Stage: <span className="text-blue-300 font-mono font-semibold">{activeScan.status}</span> |
                Profile: <span className="text-slate-300 font-mono">{activeScan.profileName}</span>
              </p>
            </div>
          </div>

          <button
            onClick={onNavigateToPipeline}
            className="px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium cursor-pointer"
          >
            View Live Stream
          </button>
        </div>
      )}

      {/* Two-Column Grid: Recent Scans & High Impact Findings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Scans Table */}
        <div className="p-5 rounded-xl bg-[#0f172a] border border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-bold text-white font-mono flex items-center space-x-2">
              <Activity className="w-4 h-4 text-blue-400" />
              <span>Assessment History</span>
            </h4>
            <span className="text-xs text-slate-400">{scans.length} Scans Run</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-slate-400 uppercase font-mono border-b border-slate-800 text-[10px]">
                <tr>
                  <th className="py-2.5">Target</th>
                  <th className="py-2.5">Profile</th>
                  <th className="py-2.5">Status</th>
                  <th className="py-2.5 text-right">Findings</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {scans.slice(0, 5).map((scan) => (
                  <tr
                    key={scan.id}
                    onClick={() => onSelectScan(scan)}
                    className="hover:bg-slate-800/40 cursor-pointer transition-colors"
                  >
                    <td className="py-3 font-medium text-slate-200">{scan.targetUrl}</td>
                    <td className="py-3 text-slate-400">{scan.profileName}</td>
                    <td className="py-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                        scan.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                        scan.status === 'FAILED' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                        'bg-blue-500/10 text-blue-400 border border-blue-500/20 animate-pulse'
                      }`}>
                        {scan.status}
                      </span>
                    </td>
                    <td className="py-3 text-right text-slate-300">
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
        <div className="p-5 rounded-xl bg-[#0f172a] border border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-bold text-white font-mono flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-orange-400" />
              <span>Prioritized Security Findings</span>
            </h4>
            <button
              onClick={onNavigateToFindings}
              className="text-xs text-blue-400 hover:text-blue-300 cursor-pointer"
            >
              View All
            </button>
          </div>

          <div className="space-y-3">
            {findings.slice(0, 4).map((f) => (
              <div
                key={f.id}
                className="p-3 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${
                    f.severity === 'CRITICAL' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                    f.severity === 'HIGH' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' :
                    'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                  }`}>
                    {f.severity}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">
                    Confidence: <span className="text-emerald-400 font-semibold">{f.confidence}</span>
                  </span>
                </div>
                <h5 className="text-xs font-semibold text-slate-100 mt-1.5">{f.title}</h5>
                <p className="text-[11px] font-mono text-slate-400 mt-1">
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
