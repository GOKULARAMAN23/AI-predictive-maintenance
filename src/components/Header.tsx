import React from 'react';
import { 
  Cpu, 
  Clock, 
  ShieldCheck, 
  Activity
} from 'lucide-react';
import type { MotorMetadata, HealthSeverity } from '../types/telemetry';

interface HeaderProps {
  motor: MotorMetadata;
  severity: HealthSeverity;
  isStreaming: boolean;
}

export const Header: React.FC<HeaderProps> = ({ motor, isStreaming }) => {
  return (
    <header className="relative bg-industrial-900/95 border-b border-slate-800/80 px-6 py-4 backdrop-blur-lg">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        {/* Left: Brand & Machine Identity */}
        <div className="flex items-center gap-4">
          {/* Logo Mark */}
          <div className="relative flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan/20 via-industrial-800 to-industrial-900 border border-cyan/40 shadow-lg shadow-cyan/10">
            <Activity className="w-6 h-6 text-cyan animate-pulse" />
            <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-industrial-950" />
          </div>

          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-extrabold tracking-wider text-slate-100 font-display flex items-center gap-1.5">
                MACHINE DNA<span className="text-cyan text-sm align-super">™</span>
              </h1>
              <span className="px-2 py-0.5 rounded-full bg-cyan-950/80 border border-cyan/50 text-[10px] font-mono text-cyan font-bold tracking-widest uppercase">
                EDGE AI LIVE
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2 mt-0.5 text-xs text-slate-400 font-mono">
              <span className="text-slate-200 font-semibold">{motor.name}</span>
              <span className="text-slate-600">•</span>
              <span className="text-cyan/90 font-mono">{motor.assetId}</span>
              <span className="text-slate-600">•</span>
              <span>{motor.model}</span>
            </div>
          </div>
        </div>

        {/* Right: Technical Specs & Connection Metadata */}
        <div className="flex flex-wrap items-center gap-3 text-xs font-mono">
          {/* Asset Specs Pill */}
          <div className="hidden sm:flex items-center gap-3 px-3 py-1.5 rounded-xl bg-industrial-800/80 border border-slate-700/60 text-slate-300">
            <div className="flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-cyan" />
              <span>{motor.powerRatingKw}kW / {motor.voltage}</span>
            </div>
            <span className="text-slate-700">|</span>
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber" />
              <span>{motor.operatingHours.toLocaleString()} hrs</span>
            </div>
            <span className="text-slate-700">|</span>
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>ISO 10816-3 Class II</span>
            </div>
          </div>

          {/* MQTT / Stream Status */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-industrial-800/80 border border-slate-700/60">
            <span className="relative flex h-2 w-2">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                isStreaming ? 'bg-emerald-400' : 'bg-amber'
              }`} />
              <span className={`relative inline-flex rounded-full h-2 w-2 ${
                isStreaming ? 'bg-emerald-400' : 'bg-amber'
              }`} />
            </span>
            <span className="text-slate-300 font-mono text-[11px]">
              MQTT://415.75KW.EDGE <span className="text-emerald-400 font-bold">(24ms)</span>
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};
