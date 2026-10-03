import React from 'react';
import { X, Lock, ShieldCheck } from 'lucide-react';

interface ScopePolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ScopePolicyModal: React.FC<ScopePolicyModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const policyItems = [
    { label: 'MODE', value: 'STRICT', status: 'ACTIVE', desc: 'Strict domain and IP perimeter enforcement' },
    { label: 'SSRF PROTECTION', value: 'ENABLED', status: 'ACTIVE', desc: 'Pre-flight socket IP resolution & bitwise masking' },
    { label: 'PRIVATE NETWORKS', value: 'BLOCKED', status: 'BLOCKED', desc: 'RFC 1918 (10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16)' },
    { label: 'LOOPBACK ADDRESSES', value: 'BLOCKED', status: 'BLOCKED', desc: 'IPv4 127.0.0.0/8 and IPv6 ::1 localhost' },
    { label: 'LINK-LOCAL & CGNAT', value: 'BLOCKED', status: 'BLOCKED', desc: 'RFC 3927 (169.254.0.0/16) and RFC 6598 (100.64.0.0/10)' },
    { label: 'CLOUD METADATA', value: 'BLOCKED', status: 'BLOCKED', desc: 'AWS / GCP / Azure metadata endpoint (169.254.169.254)' },
    { label: 'REDIRECT REVALIDATION', value: 'ENABLED', status: 'ACTIVE', desc: 'SSRF verification re-executed on every 3xx redirect hop' },
    { label: 'RATE LIMIT BUDGET', value: 'ENABLED', status: 'ACTIVE', desc: 'Token-bucket concurrency limiter & request throttle' },
    { label: 'SECRET REDACTOR', value: 'ACTIVE', status: 'ACTIVE', desc: 'Auto-scrubs Authorization headers, AWS keys, JWTs & PEMs' }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 font-mono">
      <div className="w-full max-w-xl bg-black border border-zinc-800 shadow-2xl p-5">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-white text-black flex items-center justify-center">
              <Lock className="w-3.5 h-3.5 text-black" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">SECURITY POLICY & SSRF GUARD</h3>
              <p className="text-[9px] text-zinc-500 uppercase tracking-widest mt-0.5">PERIMETER DEFENSE SPECIFICATION</p>
            </div>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-white cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="mt-4 space-y-3">
          <div className="p-2.5 bg-zinc-950 border border-zinc-900 flex items-center justify-between text-[10px]">
            <div className="flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-white" />
              <span className="text-zinc-400 uppercase">GUARD STATUS:</span>
              <span className="text-white font-bold uppercase tracking-wider">ENFORCING ZERO-TRUST BOUNDARIES</span>
            </div>
            <span className="px-1.5 py-0.2 bg-white text-black text-[9px] font-black uppercase">STRICT</span>
          </div>

          <div className="border border-zinc-900 bg-black overflow-hidden">
            <div className="divide-y divide-zinc-900">
              {policyItems.map((item) => (
                <div key={item.label} className="p-2.5 flex items-center justify-between text-xs hover:bg-zinc-950 transition-colors">
                  <div>
                    <div className="font-bold text-white text-[11px] tracking-wider uppercase">{item.label}</div>
                    <div className="text-[10px] text-zinc-500 font-sans mt-0.5">{item.desc}</div>
                  </div>
                  <span className={`px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider font-mono ${
                    item.status === 'BLOCKED'
                      ? 'border border-zinc-700 bg-zinc-950 text-zinc-300'
                      : 'bg-white text-black font-black'
                  }`}>
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 bg-white hover:bg-zinc-200 text-black uppercase tracking-wider text-xs font-bold cursor-pointer transition-colors"
            >
              CLOSE
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
