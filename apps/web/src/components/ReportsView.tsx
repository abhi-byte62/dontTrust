import React from 'react';
import { FileText, Download } from 'lucide-react';
import { Scan } from '../types.js';

interface ReportsViewProps {
  activeScan: Scan | null;
}

export const ReportsView: React.FC<ReportsViewProps> = ({ activeScan }) => {
  if (!activeScan) {
    return (
      <div className="p-12 text-center bg-black border border-zinc-800 font-mono">
        <FileText className="w-8 h-8 text-zinc-600 mx-auto mb-3" />
        <h4 className="text-sm font-bold text-zinc-300 uppercase tracking-wider">NO SCAN SELECTED FOR REPORT EXPORT</h4>
        <p className="text-xs text-zinc-500 mt-1 uppercase">Select an active or completed assessment to export reports.</p>
      </div>
    );
  }

  const downloadReport = (format: string) => {
    window.open(`/api/v1/scans/${activeScan.id}/report?format=${format}`, '_blank');
  };

  const formats = [
    { id: 'sarif', name: 'OASIS SARIF 2.1.0', ext: '.sarif.json', desc: 'Industry-standard static & dynamic analysis format for GitHub Security and CI/CD.' },
    { id: 'html', name: 'Executive HTML Dossier', ext: '.html', desc: 'Self-contained visual report with structured findings and verified traces.' },
    { id: 'markdown', name: 'Technical Markdown', ext: '.md', desc: 'Researcher notes format with remediation steps and reproduction commands.' },
    { id: 'json', name: 'Raw Machine JSON', ext: '.json', desc: 'Complete canonical FindingRecord structured data model.' }
  ];

  return (
    <div className="space-y-4 font-mono">
      <div className="p-4 bg-black border border-zinc-800">
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-zinc-800">
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-2">
              <FileText className="w-3.5 h-3.5 text-white" />
              <span>SECURITY REPORT EXPORTER</span>
            </h4>
            <p className="text-[10px] text-zinc-500 mt-0.5 uppercase">
              TARGET: <span className="text-white">{activeScan.targetUrl}</span> | ID: <span className="text-zinc-400">{activeScan.id}</span>
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {formats.map(fmt => (
            <div
              key={fmt.id}
              className="p-3.5 bg-zinc-950 border border-zinc-900 flex flex-col justify-between space-y-3"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white uppercase">{fmt.name}</span>
                  <span className="text-[9px] px-1.5 py-0.2 bg-black text-zinc-400 border border-zinc-800">{fmt.ext}</span>
                </div>
                <p className="text-[11px] text-zinc-400 mt-1.5 leading-relaxed font-sans">{fmt.desc}</p>
              </div>

              <button
                onClick={() => downloadReport(fmt.id)}
                className="flex items-center justify-center space-x-2 w-full py-1.5 bg-white hover:bg-zinc-200 text-black text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-black" />
                <span>EXPORT {fmt.id.toUpperCase()}</span>
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
