import React from 'react';
import { AlertTriangle, Flame, Power } from 'lucide-react';
import type { RULCalculation } from '../types/telemetry';

interface AlarmBannerProps {
  rul: RULCalculation;
  onEmergencyStop: () => void;
}

export const AlarmBanner: React.FC<AlarmBannerProps> = ({ rul, onEmergencyStop }) => {
  const { severity, rulDays, primaryDegradationFactor, failureRisk } = rul;

  if (severity === 'NORMAL') return null;

  const isCritical = severity === 'CRITICAL';

  return (
    <div className={`w-full py-3 px-4 rounded-xl border flex flex-col sm:flex-row items-center justify-between gap-3 transition-all duration-500 ${
      isCritical
        ? 'bg-red-950/90 border-red-500 text-red-100 shadow-[0_0_25px_rgba(255,30,86,0.35)] animate-pulse-fast'
        : 'bg-amber-950/80 border-amber-500/80 text-amber-100 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
    }`}>
      {/* Left info */}
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${isCritical ? 'bg-red-900 border border-red-400' : 'bg-amber-900 border border-amber-400'}`}>
          {isCritical ? <Flame className="w-5 h-5 text-white" /> : <AlertTriangle className="w-5 h-5 text-amber-200" />}
        </div>
        <div>
          <div className="text-xs font-mono font-bold tracking-widest uppercase flex items-center gap-2">
            <span>{isCritical ? '🚨 ALARM: OPERATIONAL SHUTDOWN IMMINENT' : '⚠️ WARNING: ACCELERATED WEAR DETECTED'}</span>
            <span className="px-1.5 py-0.5 rounded bg-black/40 text-[10px]">
              RUL: {rulDays} DAYS ({failureRisk}% FAILURE RISK)
            </span>
          </div>
          <p className="text-xs opacity-90 font-mono mt-0.5">
            Physics-informed model indicates excessive {primaryDegradationFactor.toLowerCase()} degradation. Action required to avoid unplanned catastrophic trip.
          </p>
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={onEmergencyStop}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-mono font-bold text-xs shadow-lg transition-all active:scale-95 cursor-pointer"
        >
          <Power className="w-3.5 h-3.5" />
          <span>ENGAGE CONTROLLED STOP</span>
        </button>
      </div>
    </div>
  );
};
