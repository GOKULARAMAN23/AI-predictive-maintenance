import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  AlertTriangle, 
  ShieldCheck, 
  Flame, 
  Calendar, 
  Activity, 
  Radio, 
  TrendingDown 
} from 'lucide-react';
import type { RULCalculation } from '../types/telemetry';

interface CircularRULGaugeProps {
  rul: RULCalculation;
  isStreaming?: boolean;
}

export const CircularRULGauge: React.FC<CircularRULGaugeProps> = ({ rul, isStreaming = true }) => {
  const {
    healthIndex,
    failureRisk,
    rulDays,
    rulLowerBound,
    rulUpperBound,
    severity,
    estimatedShutdownDate,
    primaryDegradationFactor,
  } = rul;

  // Visual styling configs based on severity
  const severityConfig = {
    NORMAL: {
      strokeColor: '#00f0ff',
      glowClass: 'glow-cyan',
      textGlowClass: 'text-glow-cyan',
      badgeBg: 'bg-cyan-950/80 border-cyan/40 text-cyan',
      badgeText: 'NORMAL / STABLE',
      icon: ShieldCheck,
      ringGradientId: 'cyanGradient',
    },
    WARNING: {
      strokeColor: '#f59e0b',
      glowClass: 'glow-amber',
      textGlowClass: 'text-glow-amber',
      badgeBg: 'bg-amber-950/80 border-amber/40 text-amber',
      badgeText: 'DEGRADATION DETECTED',
      icon: AlertTriangle,
      ringGradientId: 'amberGradient',
    },
    CRITICAL: {
      strokeColor: '#ff1e56',
      glowClass: 'glow-crimson animate-pulse-glow',
      textGlowClass: 'text-glow-crimson',
      badgeBg: 'bg-red-950/90 border-red-500/60 text-red-400',
      badgeText: 'CRITICAL / SHUTDOWN IMMINENT',
      icon: Flame,
      ringGradientId: 'crimsonGradient',
    },
  }[severity];

  // SVG Radial Ring Calculations
  const size = 320;
  const strokeWidth = 14;
  const center = size / 2;
  const radius = center - strokeWidth - 12;
  const circumference = 2 * Math.PI * radius;

  // Max scale is 90 days
  const maxDaysScale = 90;
  const normalizedProgress = Math.min(1, Math.max(0, rulDays / maxDaysScale));
  const strokeDashoffset = circumference - normalizedProgress * circumference;

  // Generate 48 tick marks for industrial HUD ring
  const ticks = Array.from({ length: 48 }, (_, i) => {
    const angle = (i * 360) / 48;
    const isMajor = i % 6 === 0;
    const rad = (angle * Math.PI) / 180;
    const innerR = radius - (isMajor ? 16 : 8);
    const outerR = radius - 4;
    const x1 = center + innerR * Math.cos(rad);
    const y1 = center + innerR * Math.sin(rad);
    const x2 = center + outerR * Math.cos(rad);
    const y2 = center + outerR * Math.sin(rad);
    return { angle, x1, y1, x2, y2, isMajor };
  });

  const IconComponent = severityConfig.icon;

  const formattedDate = estimatedShutdownDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className={`relative flex flex-col items-center justify-center p-6 bg-industrial-900/90 backdrop-blur-md rounded-2xl border border-slate-800/80 ${severityConfig.glowClass} transition-all duration-700`}>
      {/* Background radial engineering grid */}
      <div className="absolute inset-0 bg-circuit-overlay opacity-30 pointer-events-none rounded-2xl" />
      
      {/* Top Header info */}
      <div className="w-full flex items-center justify-between z-10 mb-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-industrial-800 border border-slate-700/60">
            <Activity className="w-4 h-4 text-cyan" />
          </div>
          <div>
            <div className="text-[11px] font-mono tracking-widest text-slate-400 uppercase">
              PREDICTIVE RUL ENGINE
            </div>
            <div className="text-xs font-semibold text-slate-200">
              REMAINING USEFUL LIFE
            </div>
          </div>
        </div>

        {/* Live status beacon */}
        <div className="flex items-center gap-2">
          {isStreaming && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-industrial-800/90 border border-slate-700/80">
              <span className="relative flex h-2 w-2">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                  severity === 'CRITICAL' ? 'bg-crimson' : severity === 'WARNING' ? 'bg-amber' : 'bg-cyan'
                }`} />
                <span className={`relative inline-flex rounded-full h-2 w-2 ${
                  severity === 'CRITICAL' ? 'bg-crimson' : severity === 'WARNING' ? 'bg-amber' : 'bg-cyan'
                }`} />
              </span>
              <span className="text-[10px] font-mono tracking-wider text-slate-300">STREAMING</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Circular SVG Gauge */}
      <div className="relative flex items-center justify-center my-3">
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="transform -rotate-90 filter drop-shadow-md"
        >
          <defs>
            {/* Gradients */}
            <linearGradient id="cyanGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#00f0ff" />
              <stop offset="60%" stopColor="#00d2df" />
              <stop offset="100%" stopColor="#10b981" />
            </linearGradient>

            <linearGradient id="amberGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fbbf24" />
              <stop offset="50%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#d97706" />
            </linearGradient>

            <linearGradient id="crimsonGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ff0055" />
              <stop offset="50%" stopColor="#ff1e56" />
              <stop offset="100%" stopColor="#b91c1c" />
            </linearGradient>

            {/* Glowing filter */}
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Background Track Ring */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="transparent"
            stroke="#161d2b"
            strokeWidth={strokeWidth}
            className="opacity-70"
          />

          {/* Secondary Sub-Track */}
          <circle
            cx={center}
            cy={center}
            r={radius - strokeWidth}
            fill="#0b0e14"
            stroke="#1c2536"
            strokeWidth="1"
            strokeDasharray="4 4"
          />

          {/* Dynamic Industrial Tick Marks */}
          {ticks.map((t, idx) => (
            <line
              key={idx}
              x1={t.x1}
              y1={t.y1}
              x2={t.x2}
              y2={t.y2}
              stroke={t.isMajor ? '#334155' : '#1e293b'}
              strokeWidth={t.isMajor ? 1.5 : 1}
            />
          ))}

          {/* Animated Main Progress Ring */}
          <motion.circle
            cx={center}
            cy={center}
            r={radius}
            fill="transparent"
            stroke={`url(#${severityConfig.ringGradientId})`}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
            strokeLinecap="round"
            filter="url(#glow)"
          />

          {/* Leading Indicator Dot */}
          {rulDays > 0 && (
            <motion.circle
              cx={center + radius * Math.cos((normalizedProgress * 360 * Math.PI) / 180)}
              cy={center + radius * Math.sin((normalizedProgress * 360 * Math.PI) / 180)}
              r={strokeWidth / 2 + 1}
              fill="#ffffff"
              animate={{
                scale: [1, 1.3, 1],
                opacity: [0.9, 1, 0.9],
              }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
          )}
        </svg>

        {/* Center Content Overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
          {/* Status Icon Badge */}
          <div className="mb-1">
            <span className="text-[11px] font-mono tracking-widest text-slate-400 uppercase">
              ESTIMATED SHUTDOWN
            </span>
          </div>

          {/* Big Hero Days Display */}
          <div className="flex items-baseline justify-center my-0.5">
            <AnimatePresence mode="wait">
              <motion.span
                key={rulDays}
                initial={{ opacity: 0.6, y: -2 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0.6, y: 2 }}
                transition={{ duration: 0.25 }}
                className={`text-6xl font-extrabold tracking-tight font-mono-num ${severityConfig.textGlowClass}`}
                style={{ color: severityConfig.strokeColor }}
              >
                {rulDays >= 10 ? Math.round(rulDays) : rulDays.toFixed(1)}
              </motion.span>
            </AnimatePresence>
            <span className="ml-2 text-xl font-bold tracking-wide text-slate-300 uppercase font-display">
              DAYS
            </span>
          </div>

          {/* Confidence Interval */}
          <div className="text-[11px] font-mono text-slate-400/90 mb-2">
            95% CI: <span className="text-slate-200 font-semibold">{rulLowerBound}d – {rulUpperBound}d</span>
          </div>

          {/* Status Label Pill */}
          <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-[11px] font-semibold tracking-wider ${severityConfig.badgeBg}`}>
            <IconComponent className="w-3.5 h-3.5 shrink-0" />
            <span>{severityConfig.badgeText}</span>
          </div>
        </div>
      </div>

      {/* Sub-Card HUD: Motor Health (%) vs Failure Risk Index (%) */}
      <div className="w-full grid grid-cols-2 gap-3 mt-1 pt-3 border-t border-slate-800/80 z-10">
        {/* Motor Health */}
        <div className="flex flex-col p-2.5 rounded-xl bg-industrial-800/60 border border-slate-700/50">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-mono text-slate-400 uppercase">MOTOR HEALTH</span>
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-bold font-mono-num text-slate-100">{healthIndex}%</span>
            <span className="text-[10px] text-slate-400">H(t)</span>
          </div>
          {/* Mini progress bar */}
          <div className="w-full h-1.5 bg-slate-800 rounded-full mt-1.5 overflow-hidden">
            <motion.div
              className={`h-full rounded-full ${
                healthIndex > 70 ? 'bg-emerald-400' : healthIndex > 40 ? 'bg-amber' : 'bg-crimson'
              }`}
              initial={{ width: 0 }}
              animate={{ width: `${healthIndex}%` }}
              transition={{ duration: 0.8 }}
            />
          </div>
        </div>

        {/* Failure Risk Index */}
        <div className="flex flex-col p-2.5 rounded-xl bg-industrial-800/60 border border-slate-700/50">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-mono text-slate-400 uppercase">FAILURE RISK</span>
            <TrendingDown className={`w-3.5 h-3.5 ${failureRisk > 60 ? 'text-crimson' : failureRisk > 30 ? 'text-amber' : 'text-slate-400'}`} />
          </div>
          <div className="flex items-baseline gap-1">
            <span className={`text-xl font-bold font-mono-num ${
              failureRisk > 60 ? 'text-crimson' : failureRisk > 30 ? 'text-amber' : 'text-slate-200'
            }`}>
              {failureRisk}%
            </span>
            <span className="text-[10px] text-slate-400">INDEX</span>
          </div>
          {/* Mini progress bar */}
          <div className="w-full h-1.5 bg-slate-800 rounded-full mt-1.5 overflow-hidden">
            <motion.div
              className={`h-full rounded-full ${
                failureRisk > 60 ? 'bg-crimson' : failureRisk > 30 ? 'bg-amber' : 'bg-cyan'
              }`}
              initial={{ width: 0 }}
              animate={{ width: `${failureRisk}%` }}
              transition={{ duration: 0.8 }}
            />
          </div>
        </div>
      </div>

      {/* Footer Info: Estimated Date & Primary Factor */}
      <div className="w-full flex items-center justify-between mt-3 text-[11px] text-slate-400 font-mono">
        <div className="flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          <span>Trip Date: <strong className="text-slate-200">{formattedDate}</strong></span>
        </div>
        <div className="flex items-center gap-1">
          <Radio className="w-3.5 h-3.5 text-cyan" />
          <span>Lead Fault: <strong className="text-slate-200">{primaryDegradationFactor}</strong></span>
        </div>
      </div>
    </div>
  );
};
