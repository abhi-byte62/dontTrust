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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 font-mono">
      <div className="w-full max-w-2xl max-h-[85vh] overflow-y-auto bg-black border border-zinc-800 shadow-2xl p-5">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-1.5 py-0.2 bg-white text-black font-black uppercase text-[10px]">
                {finding.severity}
              </span>
              <span className="px-1.5 py-0.2 bg-zinc-900 text-zinc-300 uppercase text-[10px] border border-zinc-800">
                CONFIDENCE: {finding.confidence}
              </span>
            </div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mt-2">{finding.title}</h3>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-white cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="mt-4 space-y-3 text-xs">
          {/* Target Info */}
          <div className="p-3 bg-zinc-950 border border-zinc-900 text-[11px]">
            <div className="text-zinc-500 uppercase text-[10px]">LOCATION</div>
            <div className="text-white mt-0.5">{finding.httpMethod} {finding.endpointPath}</div>
            <div className="text-zinc-500 uppercase text-[10px] mt-2">FINGERPRINT CHECKSUM</div>
            <div className="text-zinc-400 text-[10px] truncate">{finding.fingerprint}</div>
          </div>

          {/* Description & Impact */}
          <div>
            <h5 className="font-bold text-zinc-400 uppercase text-[10px] mb-1">OBSERVATION</h5>
            <p className="text-zinc-200 leading-relaxed text-[11px]">{finding.description}</p>
          </div>

          <div>
            <h5 className="font-bold text-zinc-400 uppercase text-[10px] mb-1">SECURITY IMPACT</h5>
            <p className="text-zinc-300 leading-relaxed text-[11px]">{finding.impact}</p>
          </div>

          <div>
            <h5 className="font-bold text-zinc-400 uppercase text-[10px] mb-1">REMEDIATION</h5>
            <p className="text-white leading-relaxed bg-zinc-950 p-2.5 border border-zinc-800 text-[11px]">
              {finding.remediation}
            </p>
          </div>

          {/* Evidence Traces */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="font-bold text-zinc-400 uppercase text-[10px]">RAW EVIDENCE</span>
              <button
                onClick={copyCurl}
                className="flex items-center space-x-1 text-[10px] text-white hover:underline cursor-pointer uppercase"
              >
                {copied ? <Check className="w-3 h-3 text-white" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'COPIED' : 'COPY CURL'}</span>
              </button>
            </div>
            <pre className="p-3 bg-zinc-950 font-mono text-[10px] text-zinc-300 overflow-x-auto border border-zinc-900">
              {JSON.stringify(finding.evidence, null, 2)}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
