import React from 'react';
import { 
  AreaChart, 
  Area, 
  ResponsiveContainer, 
  YAxis, 
  Tooltip 
} from 'recharts';
import { 
  Zap, 
  Thermometer, 
  Activity, 
  TrendingUp, 
  TrendingDown, 
  Gauge 
} from 'lucide-react';
import type { IsoVibrationZone } from '../types/telemetry';

export type MetricType = 'current' | 'temperature' | 'vibration';

interface TelemetryCardProps {
  type: MetricType;
  value: number;
  rate: number; // Rate of change per min
  nominal: number;
  maxLimit: number;
  historyData: { timeLabel: string; value: number }[];
  isoZone?: IsoVibrationZone;
  unit: string;
  sensorModel: string;
}

export const TelemetryCard: React.FC<TelemetryCardProps> = ({
  type,
  value,
  rate,
  nominal,
  maxLimit,
  historyData,
  isoZone,
  unit,
  sensorModel,
}) => {
  // Metric configurations
  const config = {
    current: {
      title: 'RMS PHASE CURRENT',
      icon: Zap,
      accentColor: '#00f0ff',
      gradientId: 'currentGrad',
      strokeColor: '#00f0ff',
      fillColor: 'rgba(0, 240, 255, 0.15)',
      description: 'Stator 3-Phase RMS Load',
      warningThreshold: maxLimit * 0.75, // e.g. 22.5A
      criticalThreshold: maxLimit * 0.90, // e.g. 27.0A
    },
    temperature: {
      title: 'SURFACE TEMPERATURE',
      icon: Thermometer,
      accentColor: '#f59e0b',
      gradientId: 'tempGrad',
      strokeColor: '#f59e0b',
      fillColor: 'rgba(245, 158, 11, 0.15)',
      description: 'DS18B20 Bearing Housing Temp',
      warningThreshold: 65.0, // °C
      criticalThreshold: 85.0, // °C
    },
    vibration: {
      title: 'VIBRATION INTENSITY',
      icon: Activity,
      accentColor: '#a855f7',
      gradientId: 'vibGrad',
      strokeColor: '#a855f7',
      fillColor: 'rgba(168, 85, 247, 0.15)',
      description: 'MPU6050 Tri-Axial RMS Accel',
      warningThreshold: 2.8, // g RMS (Zone C)
      criticalThreshold: 4.5, // g RMS (Zone D)
    },
  }[type];

  const IconComponent = config.icon;

  // Status severity for this metric
  const isCritical = value >= config.criticalThreshold;
  const isWarning = !isCritical && value >= config.warningThreshold;

  // Status badges
  const statusColor = isCritical
    ? 'text-crimson border-crimson/50 bg-crimson/10'
    : isWarning
    ? 'text-amber border-amber/50 bg-amber/10'
    : 'text-emerald-400 border-emerald-500/30 bg-emerald-950/40';

  const statusText = isCritical ? 'CRITICAL' : isWarning ? 'WARNING' : 'NOMINAL';

  // Capacity percentage (clamped 0 - 100%)
  const percentage = Math.min(100, Math.max(0, Math.round((value / maxLimit) * 100)));

  // ISO 10816 Zone config for vibration
  const isoZoneConfig: Record<IsoVibrationZone, { label: string; badge: string }> = {
    ZONE_A: { label: 'ISO ZONE A: GOOD', badge: 'bg-emerald-950/60 text-emerald-400 border-emerald-500/30' },
    ZONE_B: { label: 'ISO ZONE B: SATISFACTORY', badge: 'bg-cyan-950/60 text-cyan border-cyan/30' },
    ZONE_C: { label: 'ISO ZONE C: ALERT', badge: 'bg-amber-950/60 text-amber border-amber/40' },
    ZONE_D: { label: 'ISO ZONE D: TRIP DANGER', badge: 'bg-red-950/80 text-red-400 border-red-500/60 animate-pulse' },
  };

  // Sparkline data min/max padding for chart
  const sparkMin = Math.min(...historyData.map(d => d.value), nominal * 0.7);
  const sparkMax = Math.max(...historyData.map(d => d.value), maxLimit * 0.8);

  return (
    <div className={`relative flex flex-col justify-between p-5 rounded-2xl bg-industrial-900/90 backdrop-blur-md border ${
      isCritical ? 'border-crimson/60 border-glow-crimson' : isWarning ? 'border-amber/50 border-glow-amber' : 'border-slate-800/80 hover:border-slate-700/80'
    } transition-all duration-500 group overflow-hidden`}>
      {/* Background corner glow */}
      <div 
        className="absolute -top-16 -right-16 w-32 h-32 rounded-full opacity-10 blur-2xl pointer-events-none transition-opacity group-hover:opacity-20"
        style={{ backgroundColor: config.accentColor }}
      />

      {/* Top row: Sensor ID, Icon & Status */}
      <div>
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2.5">
            <div 
              className="p-2 rounded-xl border bg-industrial-800"
              style={{ borderColor: `${config.accentColor}33`, color: config.accentColor }}
            >
              <IconComponent className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] font-mono tracking-wider text-slate-400 uppercase">
                {sensorModel}
              </div>
              <h3 className="text-xs font-bold text-slate-200 tracking-wide">
                {config.title}
              </h3>
            </div>
          </div>

          <div className="flex flex-col items-end gap-1">
            <span className={`px-2 py-0.5 rounded-full border text-[10px] font-mono font-bold tracking-wider ${statusColor}`}>
              {statusText}
            </span>
            {isoZone && (
              <span className={`px-1.5 py-0.5 rounded border text-[9px] font-mono ${isoZoneConfig[isoZone].badge}`}>
                {isoZone.replace('_', ' ')}
              </span>
            )}
          </div>
        </div>

        {/* Primary Value Readout & Rate of Change */}
        <div className="flex items-baseline justify-between mt-3 mb-2">
          <div className="flex items-baseline gap-1.5">
            <span 
              className="text-4xl font-extrabold font-mono-num tracking-tight"
              style={{ color: isCritical ? '#ff1e56' : isWarning ? '#f59e0b' : '#f8fafc' }}
            >
              {type === 'vibration' ? value.toFixed(2) : value.toFixed(1)}
            </span>
            <span className="text-sm font-bold text-slate-400 font-mono">
              {unit}
            </span>
          </div>

          {/* Rate of Change Badge (Δ/Δt) */}
          <div className="flex items-center gap-1 text-xs font-mono">
            {rate > 0 ? (
              <span className={`flex items-center gap-0.5 ${Math.abs(rate) > 0.5 ? 'text-amber' : 'text-slate-400'}`}>
                <TrendingUp className="w-3.5 h-3.5" />
                <span>+{Math.abs(rate).toFixed(2)} {unit}/min</span>
              </span>
            ) : rate < 0 ? (
              <span className="flex items-center gap-0.5 text-emerald-400">
                <TrendingDown className="w-3.5 h-3.5" />
                <span>-{Math.abs(rate).toFixed(2)} {unit}/min</span>
              </span>
            ) : (
              <span className="text-slate-500">±0.00 {unit}/min</span>
            )}
          </div>
        </div>

        {/* Progress Bar towards Max Limit */}
        <div className="my-2">
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mb-1">
            <span>Nominal: {nominal}{unit}</span>
            <span className="font-semibold text-slate-300">{percentage}% of Trip Limit</span>
            <span>Limit: {maxLimit}{unit}</span>
          </div>
          <div className="h-2 w-full bg-industrial-800 rounded-full overflow-hidden p-0.5 border border-slate-700/40">
            <div 
              className={`h-full rounded-full transition-all duration-700 ${
                isCritical ? 'bg-crimson shadow-[0_0_8px_#ff1e56]' : isWarning ? 'bg-amber shadow-[0_0_8px_#f59e0b]' : 'bg-cyan'
              }`}
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Mini Sparkline Chart */}
      <div className="mt-3 pt-2 border-t border-slate-800/80">
        <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mb-1">
          <span className="flex items-center gap-1">
            <Gauge className="w-3 h-3 text-slate-400" />
            <span>REAL-TIME SPARKLINE (L30s)</span>
          </span>
          <span className="text-slate-400">Avg: {(historyData.reduce((acc, curr) => acc + curr.value, 0) / (historyData.length || 1)).toFixed(1)}{unit}</span>
        </div>

        <div className="h-14 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={historyData} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id={config.gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={config.strokeColor} stopOpacity={0.4} />
                  <stop offset="95%" stopColor={config.strokeColor} stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <YAxis hide domain={[Math.floor(sparkMin * 0.9), Math.ceil(sparkMax * 1.1)]} />
              <Tooltip 
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-industrial-950/95 border border-slate-700/80 px-2 py-1 rounded shadow-lg text-[10px] font-mono text-slate-200">
                        <span>{payload[0].value} {unit}</span>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke={config.strokeColor}
                strokeWidth={2}
                fillOpacity={1}
                fill={`url(#${config.gradientId})`}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
