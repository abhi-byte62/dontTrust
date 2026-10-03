import React from 'react';
import { X, Copy, Check } from 'lucide-react';
import { Finding } from '../types.js';

interface EvidenceModalProps {
  finding: Finding | null;
  onClose: () => void;
}

export const EvidenceModal: React.FC<EvidenceModalProps> = ({ finding, onClose }) => {
  const [copied, setCopied] = React.useState(false);

  if (!finding) return null;

  const copyCurl = () => {
    const curl = `curl -X ${finding.httpMethod} "${finding.endpointPath.startsWith('http') ? finding.endpointPath : 'https://' + finding.targetHost + finding.endpointPath}"`;
    navigator.clipboard.writeText(curl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-xl bg-[#0f172a] border border-slate-800 shadow-2xl p-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center space-x-2">
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                finding.severity === 'CRITICAL' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                finding.severity === 'HIGH' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' :
                'bg-blue-500/20 text-blue-400 border border-blue-500/30'
              }`}>
                {finding.severity}
              </span>
              <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] font-mono font-semibold">
                Confidence: {finding.confidence}
              </span>
            </div>
            <h3 className="text-base font-bold text-white font-mono mt-1.5">{finding.title}</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-5 space-y-4 text-xs">
          {/* Target Info */}
          <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 font-mono">
            <div className="text-slate-400 text-[11px]">Vulnerable Location:</div>
            <div className="text-slate-200 mt-0.5">{finding.httpMethod} {finding.endpointPath}</div>
            <div className="text-slate-400 text-[11px] mt-2">Fingerprint Checksum:</div>
            <div className="text-slate-400 text-[10px] truncate">{finding.fingerprint}</div>
          </div>

          {/* Description & Impact */}
          <div>
            <h5 className="font-bold text-slate-300 font-mono mb-1">Technical Observation:</h5>
            <p className="text-slate-300 leading-relaxed">{finding.description}</p>
          </div>

          <div>
            <h5 className="font-bold text-slate-300 font-mono mb-1">Security Impact:</h5>
            <p className="text-slate-400 leading-relaxed">{finding.impact}</p>
          </div>

          <div>
            <h5 className="font-bold text-slate-300 font-mono mb-1">Remediation Guidance:</h5>
            <p className="text-emerald-400/90 leading-relaxed bg-emerald-950/20 p-3 rounded-lg border border-emerald-500/20">
              {finding.remediation}
            </p>
          </div>

          {/* Evidence Traces */}
          <div>
            <h5 className="font-bold text-slate-300 font-mono mb-1 flex items-center justify-between">
              <span>Raw Evidence & HTTP Snapshot</span>
              <button
                onClick={copyCurl}
                className="flex items-center space-x-1 text-[11px] text-blue-400 hover:underline cursor-pointer"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'Copied cURL' : 'Copy cURL'}</span>
              </button>
            </h5>
            <pre className="p-3 rounded-lg bg-black/90 font-mono text-[11px] text-slate-300 overflow-x-auto border border-slate-900">
              {JSON.stringify(finding.evidence, null, 2)}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
