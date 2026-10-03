import React from 'react';
import { FileText, Download } from 'lucide-react';
import { Scan } from '../types.js';

interface ReportsViewProps {
  activeScan: Scan | null;
}

export const ReportsView: React.FC<ReportsViewProps> = ({ activeScan }) => {
  if (!activeScan) {
    return (
      <div className="p-12 text-center rounded-xl bg-[#0f172a] border border-slate-800">
        <FileText className="w-12 h-12 text-slate-400 mx-auto mb-3" />
        <h4 className="text-base font-bold text-slate-300 font-mono">No Scan Selected for Report Export</h4>
        <p className="text-xs text-slate-400 mt-1">Select an active or completed assessment to export compliance and technical reports.</p>
      </div>
    );
  }

  const downloadReport = (format: string) => {
    window.open(`/api/v1/scans/${activeScan.id}/report?format=${format}`, '_blank');
  };

  const formats = [
    { id: 'sarif', name: 'OASIS SARIF 2.1.0', ext: '.sarif.json', desc: 'Industry-standard static/dynamic analysis format for GitHub Security & CI/CD ingest.' },
    { id: 'html', name: 'Executive HTML Dossier', ext: '.html', desc: 'Self-contained visual report with dark engineering styling and finding breakdown.' },
    { id: 'markdown', name: 'Technical Markdown', ext: '.md', desc: 'Clean researcher notes format with remediation steps and reproduction proofs.' },
    { id: 'json', name: 'Raw Machine JSON', ext: '.json', desc: 'Complete unredacted structured data model of endpoints, assets, and findings.' }
  ];

  return (
    <div className="space-y-4">
      <div className="p-5 rounded-xl bg-[#0f172a] border border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h4 className="text-sm font-bold text-white font-mono flex items-center space-x-2">
              <FileText className="w-4 h-4 text-blue-400" />
              <span>Multi-Format Security Report Generator</span>
            </h4>
            <p className="text-xs text-slate-400 mt-1">
              Export findings for target: <span className="text-slate-200 font-mono">{activeScan.targetUrl}</span> (Scan ID: <span className="font-mono text-slate-400">{activeScan.id}</span>)
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {formats.map(fmt => (
            <div
              key={fmt.id}
              className="p-4 rounded-lg bg-slate-900 border border-slate-800 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-white">{fmt.name}</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">{fmt.ext}</span>
                </div>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">{fmt.desc}</p>
              </div>

              <button
                onClick={() => downloadReport(fmt.id)}
                className="mt-4 flex items-center justify-center space-x-2 w-full py-2 rounded bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 text-xs font-semibold font-mono transition-all cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download {fmt.id.toUpperCase()}</span>
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
