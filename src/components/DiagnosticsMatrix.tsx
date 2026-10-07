import React from 'react';
import { 
  Wrench, 
  Cpu, 
  AlertTriangle 
} from 'lucide-react';
import type { DiagnosticsItem } from '../types/telemetry';

interface DiagnosticsMatrixProps {
  diagnostics: DiagnosticsItem[];
}

export const DiagnosticsMatrix: React.FC<DiagnosticsMatrixProps> = ({ diagnostics }) => {
  return (
    <div className="flex flex-col p-6 rounded-2xl bg-industrial-900/90 backdrop-blur-md border border-slate-800/80 shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-industrial-800 border border-slate-700/60 text-cyan">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wider font-display">
              ROOT-CAUSE DIAGNOSTICS & PRESCRIPTIVE AI
            </h2>
            <p className="text-xs text-slate-400">
              Component-level failure mode classification & recommended mitigation actions
            </p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2 text-xs font-mono text-slate-400">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400" /> &lt;30% Low
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber" /> 30-70% Med
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-crimson" /> &gt;70% High
          </span>
        </div>
      </div>

      {/* Diagnostics List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        {diagnostics.map((item, idx) => {
          const isHigh = item.probability > 70;
          const isMed = item.probability >= 30 && item.probability <= 70;

          const badgeColor = isHigh
            ? 'bg-red-950/80 text-red-400 border-red-500/50'
            : isMed
            ? 'bg-amber-950/80 text-amber border-amber/40'
            : 'bg-emerald-950/60 text-emerald-400 border-emerald-500/30';

          const progressColor = isHigh
            ? 'bg-crimson shadow-[0_0_10px_#ff1e56]'
            : isMed
            ? 'bg-amber shadow-[0_0_10px_#f59e0b]'
            : 'bg-emerald-400';

          return (
            <div
              key={idx}
              className={`p-4 rounded-xl border transition-all duration-300 ${
                isHigh
                  ? 'bg-red-950/20 border-red-500/40 border-glow-crimson'
                  : isMed
                  ? 'bg-amber-950/10 border-amber/30'
                  : 'bg-industrial-800/40 border-slate-800 hover:border-slate-700'
              }`}
            >
              {/* Top row */}
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <div className="text-[10px] font-mono text-slate-400 uppercase">
                    {item.component}
                  </div>
                  <h4 className="text-xs font-bold text-slate-100 mt-0.5">
                    {item.name}
                  </h4>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <span className={`px-2 py-0.5 rounded-full border text-[10px] font-mono font-bold ${badgeColor}`}>
                    {item.probability}% RISK
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-1.5 bg-industrial-950 rounded-full overflow-hidden my-2">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${progressColor}`}
                  style={{ width: `${item.probability}%` }}
                />
              </div>

              {/* Symptoms & Action */}
              <div className="space-y-1.5 mt-3 pt-2 border-t border-slate-800/60 text-[11px] font-mono">
                <div className="flex items-start gap-1.5 text-slate-300">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-slate-400">Observed:</strong> {item.symptom}
                  </span>
                </div>

                <div className="flex items-start gap-1.5 text-cyan">
                  <Wrench className="w-3.5 h-3.5 text-cyan shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-slate-400">Prescriptive:</strong> {item.actionRequired}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
