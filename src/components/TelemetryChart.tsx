import React, { useState } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from 'recharts';
import { LineChart as ChartIcon, Zap, Thermometer, Activity, ShieldCheck } from 'lucide-react';
import type { TelemetryHistoryPoint, TelemetryLimits } from '../types/telemetry';

interface TelemetryChartProps {
  history: TelemetryHistoryPoint[];
  limits: TelemetryLimits;
}

type TabType = 'combined' | 'current' | 'temperature' | 'vibration' | 'health';

export const TelemetryChart: React.FC<TelemetryChartProps> = ({ history, limits }) => {
  const [activeTab, setActiveTab] = useState<TabType>('combined');

  return (
    <div className="flex flex-col p-6 rounded-2xl bg-industrial-900/90 backdrop-blur-md border border-slate-800/80 shadow-xl">
      {/* Header with Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-industrial-800 border border-slate-700/60 text-cyan">
            <ChartIcon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wider font-display">
              SYNCHRONIZED TELEMETRY TIMELINE
            </h2>
            <p className="text-xs text-slate-400">
              Live multi-channel sensor dynamics vs. physics failure bounds
            </p>
          </div>
        </div>

        {/* Tab Filters */}
        <div className="flex items-center bg-industrial-800/80 p-1 rounded-xl border border-slate-700/60 gap-1 text-xs font-mono">
          <button
            onClick={() => setActiveTab('combined')}
            className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
              activeTab === 'combined'
                ? 'bg-cyan text-industrial-950 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            OVERVIEW
          </button>
          <button
            onClick={() => setActiveTab('current')}
            className={`flex items-center gap-1 px-3 py-1 rounded-lg transition-all cursor-pointer ${
              activeTab === 'current'
                ? 'bg-cyan text-industrial-950 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Zap className="w-3 h-3" />
            <span>CURRENT</span>
          </button>
          <button
            onClick={() => setActiveTab('temperature')}
            className={`flex items-center gap-1 px-3 py-1 rounded-lg transition-all cursor-pointer ${
              activeTab === 'temperature'
                ? 'bg-amber text-industrial-950 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Thermometer className="w-3 h-3" />
            <span>TEMP</span>
          </button>
          <button
            onClick={() => setActiveTab('vibration')}
            className={`flex items-center gap-1 px-3 py-1 rounded-lg transition-all cursor-pointer ${
              activeTab === 'vibration'
                ? 'bg-purple-400 text-industrial-950 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Activity className="w-3 h-3" />
            <span>VIBRATION</span>
          </button>
          <button
            onClick={() => setActiveTab('health')}
            className={`flex items-center gap-1 px-3 py-1 rounded-lg transition-all cursor-pointer ${
              activeTab === 'health'
                ? 'bg-emerald-400 text-industrial-950 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-3 h-3" />
            <span>HEALTH / RUL</span>
          </button>
        </div>
      </div>

      {/* Main Chart Area */}
      <div className="h-72 w-full mt-4">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={history} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.6} />
            <XAxis
              dataKey="timeLabel"
              stroke="#64748b"
              fontSize={10}
              tickLine={false}
              axisLine={{ stroke: '#334155' }}
            />
            <YAxis
              stroke="#64748b"
              fontSize={10}
              tickLine={false}
              axisLine={{ stroke: '#334155' }}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-industrial-950/95 border border-slate-700/80 p-3 rounded-xl shadow-2xl backdrop-blur-md text-xs font-mono space-y-1">
                      <div className="text-slate-400 font-bold border-b border-slate-800 pb-1 mb-1">
                        TIMESTAMP: {label}
                      </div>
                      {payload.map((p, idx) => (
                        <div key={idx} className="flex items-center justify-between gap-4">
                          <span style={{ color: p.color }}>{p.name}:</span>
                          <span className="font-bold text-slate-100">{p.value}</span>
                        </div>
                      ))}
                    </div>
                  );
                }
                return null;
              }}
            />
            <Legend
              wrapperStyle={{ fontSize: '11px', fontFamily: 'JetBrains Mono', paddingTop: '10px' }}
            />

            {/* Threshold Reference Lines */}
            {activeTab === 'current' && (
              <ReferenceLine y={limits.currentMax} stroke="#ff1e56" strokeDasharray="4 4" label={{ value: 'TRIP LIMIT 30A', fill: '#ff1e56', fontSize: 10 }} />
            )}
            {activeTab === 'temperature' && (
              <ReferenceLine y={limits.tempMax} stroke="#ff1e56" strokeDasharray="4 4" label={{ value: 'THERMAL RUNAWAY 100°C', fill: '#ff1e56', fontSize: 10 }} />
            )}
            {activeTab === 'vibration' && (
              <ReferenceLine y={limits.vibrationMax} stroke="#ff1e56" strokeDasharray="4 4" label={{ value: 'ISO DANGER 7.5g', fill: '#ff1e56', fontSize: 10 }} />
            )}

            {/* Chart Series Lines */}
            {(activeTab === 'combined' || activeTab === 'current') && (
              <Line
                type="monotone"
                name="Current (A)"
                dataKey="current"
                stroke="#00f0ff"
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
            )}

            {(activeTab === 'combined' || activeTab === 'temperature') && (
              <Line
                type="monotone"
                name="Temp (°C)"
                dataKey="temperature"
                stroke="#f59e0b"
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
            )}

            {(activeTab === 'combined' || activeTab === 'vibration') && (
              <Line
                type="monotone"
                name="Vibration (g)"
                dataKey="vibration"
                stroke="#a855f7"
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
            )}

            {(activeTab === 'combined' || activeTab === 'health') && (
              <Line
                type="monotone"
                name="Health H(t) (%)"
                dataKey="healthIndex"
                stroke="#10b981"
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
            )}

            {activeTab === 'health' && (
              <Line
                type="monotone"
                name="RUL (Days)"
                dataKey="rulDays"
                stroke="#38bdf8"
                strokeWidth={2}
                strokeDasharray="4 4"
                dot={false}
                isAnimationActive={false}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
