import React, { useRef } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Sliders, 
  Volume2, 
  VolumeX, 
  Download, 
  Flame, 
  Zap, 
  Activity, 
  Skull, 
  CheckCircle2,
  Layers,
  Upload,
  FileSpreadsheet,
  SkipBack,
  SkipForward,
  X,
  FileCode,
  Sparkles
} from 'lucide-react';
import type { 
  SimulationMode, 
  SensorReading, 
  TelemetryLimits, 
  ImportedDatasetState 
} from '../types/telemetry';

interface SimulationControlsProps {
  simulationMode: SimulationMode;
  setSimulationMode: (mode: SimulationMode) => void;
  isLiveStream: boolean;
  setIsLiveStream: (active: boolean) => void;
  streamSpeed: number;
  setStreamSpeed: (speed: number) => void;
  audioAlertsEnabled: boolean;
  setAudioAlertsEnabled: (enabled: boolean) => void;
  manualOverride: boolean;
  setManualOverride: (override: boolean) => void;
  sensorData: SensorReading;
  setManualSensorValues: (updates: Partial<SensorReading>) => void;
  resetToNormal: () => void;
  exportTelemetryCSV: () => void;
  limits: TelemetryLimits;

  // Imported dataset props
  importedDataset: ImportedDatasetState | null;
  importNotification: { type: 'success' | 'error'; message: string } | null;
  setImportNotification: (notification: { type: 'success' | 'error'; message: string } | null) => void;
  loadImportedFile: (file: File) => Promise<{ success: boolean; message: string }>;
  loadPresetImport: (scenario: 'run_to_failure' | 'thermal_runaway' | 'vibration_excursion') => void;
  toggleImportPlayback: () => void;
  seekImportFrame: (frameIndex: number) => void;
  exitImportMode: () => void;
}

export const SimulationControls: React.FC<SimulationControlsProps> = ({
  simulationMode,
  setSimulationMode,
  isLiveStream,
  setIsLiveStream,
  streamSpeed,
  setStreamSpeed,
  audioAlertsEnabled,
  setAudioAlertsEnabled,
  manualOverride,
  setManualOverride,
  sensorData,
  setManualSensorValues,
  resetToNormal,
  exportTelemetryCSV,
  limits,
  importedDataset,
  importNotification,
  setImportNotification,
  loadImportedFile,
  loadPresetImport,
  toggleImportPlayback,
  seekImportFrame,
  exitImportMode,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await loadImportedFile(file);
      // Reset input value so same file can be re-selected if needed
      e.target.value = '';
    }
  };

  const handleDownloadTemplate = () => {
    const template = 'Timestamp,TimeLabel,Current_A,Temperature_C,Vibration_gRMS,RPM\n' +
      '1700000001000,10:00:01,14.5,45.2,0.85,1485\n' +
      '1700000002000,10:00:02,15.1,46.0,0.92,1484\n' +
      '1700000003000,10:00:03,16.8,48.5,1.20,1480\n' +
      '1700000004000,10:00:04,19.4,54.1,2.45,1475\n' +
      '1700000005000,10:00:05,24.2,68.0,4.10,1460\n' +
      '1700000006000,10:00:06,28.5,89.4,6.80,1420\n';
    const blob = new Blob([template], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'sample_telemetry_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const presets: {
    id: SimulationMode;
    label: string;
    description: string;
    icon: React.ElementType;
    color: string;
    activeBorder: string;
  }[] = [
    {
      id: 'NORMAL',
      label: 'Nominal Steady State',
      description: 'Ideal baseline operation (RUL > 45d)',
      icon: CheckCircle2,
      color: 'text-cyan',
      activeBorder: 'border-cyan bg-cyan/10 text-cyan',
    },
    {
      id: 'BEARING_OVERHEAT',
      label: 'Simulate Bearing Overheat',
      description: 'Thermal runaway + housing vibration',
      icon: Flame,
      color: 'text-amber',
      activeBorder: 'border-amber bg-amber/10 text-amber',
    },
    {
      id: 'MISALIGNMENT_SPIKE',
      label: 'Simulate Misalignment Spike',
      description: '1X/2X shaft dynamic vibration (>5g)',
      icon: Activity,
      color: 'text-purple-400',
      activeBorder: 'border-purple-500 bg-purple-950/40 text-purple-300',
    },
    {
      id: 'CURRENT_OVERLOAD',
      label: 'Simulate Phase Imbalance',
      description: 'Stator overload draw (>27A)',
      icon: Zap,
      color: 'text-amber-400',
      activeBorder: 'border-amber-400 bg-amber-950/40 text-amber-300',
    },
    {
      id: 'CRITICAL_AVALANCHE',
      label: 'Simulate Multi-Fault Avalanche',
      description: 'Rapid degradation trip (RUL < 10d)',
      icon: Skull,
      color: 'text-crimson',
      activeBorder: 'border-crimson bg-crimson/10 text-crimson animate-pulse',
    },
  ];

  const isImportActive = !!importedDataset;

  return (
    <div className="flex flex-col p-6 rounded-2xl bg-industrial-900/90 backdrop-blur-md border border-slate-800/80 shadow-xl relative">
      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".csv,.json,.txt"
        className="hidden"
      />

      {/* Header & Main Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-industrial-800 border border-slate-700/60 text-cyan">
            {isImportActive ? <FileSpreadsheet className="w-5 h-5 text-emerald-400" /> : <Sliders className="w-5 h-5" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wider font-display">
                {isImportActive ? 'IMPORTED DATASET TELEMETRY RUNNER' : 'EDGE AI SIMULATION & DATASET CONTROLLER'}
              </h2>
              {isImportActive && (
                <span className="px-2 py-0.5 rounded-full bg-emerald-950 border border-emerald-500/50 text-[10px] font-mono text-emerald-400 font-bold animate-pulse">
                  FILE PLAYBACK ACTIVE
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400">
              {isImportActive 
                ? `Running live RUL analysis directly from uploaded telemetry dataset`
                : `Connect imported telemetry files or run edge degradation simulations`}
            </p>
          </div>
        </div>

        {/* Primary Action Buttons */}
        <div className="flex items-center flex-wrap gap-2">
          {/* IMPORT FILE BUTTON (Highlighted) */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/50 text-emerald-300 font-mono font-bold text-xs shadow-lg transition-all active:scale-95 cursor-pointer"
            title="Upload CSV or JSON telemetry data to run dashboard"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>IMPORT FILE (CSV/JSON)</span>
          </button>

          {/* Pause / Play */}
          <button
            onClick={isImportActive ? toggleImportPlayback : () => setIsLiveStream(!isLiveStream)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-mono font-semibold transition-all cursor-pointer ${
              (isImportActive ? importedDataset.isPlaying : isLiveStream)
                ? 'bg-industrial-800 border-slate-700 text-slate-200 hover:bg-industrial-750'
                : 'bg-emerald-950/80 border-emerald-500/60 text-emerald-400'
            }`}
          >
            {(isImportActive ? importedDataset.isPlaying : isLiveStream) ? (
              <>
                <Pause className="w-3.5 h-3.5 text-amber" />
                <span>PAUSE STREAM</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 text-emerald-400" />
                <span>RESUME STREAM</span>
              </>
            )}
          </button>

          {/* Speed Multipliers */}
          <div className="flex items-center bg-industrial-800 rounded-lg p-0.5 border border-slate-700/60 text-xs font-mono">
            {[1, 2, 4].map((spd) => (
              <button
                key={spd}
                onClick={() => setStreamSpeed(spd)}
                className={`px-2 py-1 rounded transition-all cursor-pointer ${
                  streamSpeed === spd
                    ? 'bg-cyan text-industrial-950 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {spd}x
              </button>
            ))}
          </div>

          {/* Audio Alarm Toggle */}
          <button
            onClick={() => setAudioAlertsEnabled(!audioAlertsEnabled)}
            title={audioAlertsEnabled ? 'Disable Audio Synthesizer' : 'Enable Audio Synthesizer'}
            className={`p-1.5 rounded-lg border text-xs transition-all cursor-pointer ${
              audioAlertsEnabled
                ? 'bg-cyan-950/60 border-cyan/50 text-cyan'
                : 'bg-industrial-800 border-slate-700 text-slate-400 hover:text-slate-200'
            }`}
          >
            {audioAlertsEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Export CSV */}
          <button
            onClick={exportTelemetryCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan/10 border border-cyan/40 text-cyan hover:bg-cyan/20 text-xs font-mono font-semibold transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>EXPORT CSV</span>
          </button>

          {/* Reset Baseline */}
          <button
            onClick={resetToNormal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-industrial-800 border border-slate-700/60 text-slate-300 hover:text-white hover:bg-industrial-750 text-xs font-mono font-medium transition-all cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>RESET</span>
          </button>
        </div>
      </div>

      {/* Notification Toast */}
      {importNotification && (
        <div className={`my-3 p-3 rounded-xl border flex items-center justify-between text-xs font-mono transition-all ${
          importNotification.type === 'success'
            ? 'bg-emerald-950/80 border-emerald-500/60 text-emerald-200'
            : 'bg-red-950/80 border-red-500/60 text-red-200'
        }`}>
          <div className="flex items-center gap-2">
            {importNotification.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <Skull className="w-4 h-4 text-red-400 shrink-0" />
            )}
            <span>{importNotification.message}</span>
          </div>
          <button
            onClick={() => setImportNotification(null)}
            className="text-slate-400 hover:text-white p-1"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* IF IMPORTED DATASET IS ACTIVE: Display Interactive Playback Scrubber */}
      {isImportActive && importedDataset && (
        <div className="mt-4 p-4 rounded-xl bg-industrial-950/80 border border-emerald-500/40 shadow-inner space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span className="text-slate-200 font-bold">{importedDataset.filename}</span>
              <span className="text-slate-500">•</span>
              <span className="text-cyan">{importedDataset.totalFrames} telemetry samples</span>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-slate-300">
                Frame <strong className="text-emerald-400">{importedDataset.currentFrameIndex + 1}</strong> of {importedDataset.totalFrames}
                ({Math.round(((importedDataset.currentFrameIndex + 1) / importedDataset.totalFrames) * 100)}%)
              </span>
              <button
                onClick={exitImportMode}
                className="flex items-center gap-1 px-2.5 py-1 rounded bg-industrial-800 hover:bg-industrial-700 border border-slate-700 text-[11px] text-slate-300 cursor-pointer"
              >
                <X className="w-3 h-3 text-red-400" />
                <span>EXIT IMPORT MODE</span>
              </button>
            </div>
          </div>

          {/* Scrubber Range Slider */}
          <div className="space-y-1">
            <input
              type="range"
              min="0"
              max={importedDataset.totalFrames - 1}
              value={importedDataset.currentFrameIndex}
              onChange={(e) => seekImportFrame(parseInt(e.target.value, 10))}
              className="w-full h-2 bg-industrial-800 rounded-lg appearance-none cursor-pointer accent-emerald-400"
            />
            <div className="flex justify-between text-[10px] font-mono text-slate-500">
              <span>Start (T=0)</span>
              <span>Drag slider to scrub through uploaded telemetry time series</span>
              <span>End (Frame {importedDataset.totalFrames})</span>
            </div>
          </div>

          {/* Stepper Buttons */}
          <div className="flex items-center justify-center gap-3 pt-1">
            <button
              onClick={() => seekImportFrame(importedDataset.currentFrameIndex - 1)}
              className="flex items-center gap-1 px-3 py-1 rounded-lg bg-industrial-800 hover:bg-industrial-750 border border-slate-700 text-xs font-mono text-slate-300 cursor-pointer"
            >
              <SkipBack className="w-3 h-3" />
              <span>PREV FRAME</span>
            </button>
            <button
              onClick={toggleImportPlayback}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg border text-xs font-mono font-bold cursor-pointer ${
                importedDataset.isPlaying
                  ? 'bg-amber-950/80 border-amber-500 text-amber-300'
                  : 'bg-emerald-600 border-emerald-400 text-white'
              }`}
            >
              {importedDataset.isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              <span>{importedDataset.isPlaying ? 'PAUSE PLAYBACK' : 'START PLAYBACK'}</span>
            </button>
            <button
              onClick={() => seekImportFrame(importedDataset.currentFrameIndex + 1)}
              className="flex items-center gap-1 px-3 py-1 rounded-lg bg-industrial-800 hover:bg-industrial-750 border border-slate-700 text-xs font-mono text-slate-300 cursor-pointer"
            >
              <span>NEXT FRAME</span>
              <SkipForward className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      {/* Preset Datasets & Template Download Quick Bar */}
      <div className="mt-4 pt-3 flex flex-wrap items-center justify-between gap-2 text-xs font-mono border-t border-slate-800/80">
        <div className="flex items-center gap-2 text-slate-400">
          <Sparkles className="w-3.5 h-3.5 text-cyan" />
          <span>OR LOAD PRE-PACKAGED TEST RUNS:</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => loadPresetImport('run_to_failure')}
            className="px-2.5 py-1 rounded bg-industrial-800/90 hover:bg-industrial-750 border border-cyan/40 text-cyan text-[11px] font-mono cursor-pointer"
          >
            📂 Run-to-Failure (60s)
          </button>
          <button
            onClick={() => loadPresetImport('thermal_runaway')}
            className="px-2.5 py-1 rounded bg-industrial-800/90 hover:bg-industrial-750 border border-amber/40 text-amber text-[11px] font-mono cursor-pointer"
          >
            🔥 Thermal Runaway (60s)
          </button>
          <button
            onClick={() => loadPresetImport('vibration_excursion')}
            className="px-2.5 py-1 rounded bg-industrial-800/90 hover:bg-industrial-750 border border-purple-400/40 text-purple-300 text-[11px] font-mono cursor-pointer"
          >
            ⚡ Vibration Spike (60s)
          </button>
          <button
            onClick={handleDownloadTemplate}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-industrial-800 hover:bg-industrial-750 border border-slate-700 text-slate-300 text-[11px] font-mono cursor-pointer"
            title="Download CSV format template"
          >
            <FileCode className="w-3 h-3 text-slate-400" />
            <span>Template CSV</span>
          </button>
        </div>
      </div>

      {/* Edge Simulation Presets Grid */}
      <div className="mt-5">
        <div className="text-[11px] font-mono tracking-wider text-slate-400 uppercase mb-3 flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5 text-cyan" />
          <span>EDGE FAULT SIMULATION PRESETS</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {presets.map((preset) => {
            const Icon = preset.icon;
            const isCurrent = !isImportActive && !manualOverride && simulationMode === preset.id;
            return (
              <button
                key={preset.id}
                onClick={() => {
                  if (isImportActive) exitImportMode();
                  setManualOverride(false);
                  setSimulationMode(preset.id);
                }}
                className={`flex flex-col items-start p-3.5 rounded-xl border text-left transition-all duration-300 cursor-pointer ${
                  isCurrent
                    ? preset.activeBorder
                    : 'bg-industrial-800/60 border-slate-800 hover:border-slate-700/80 text-slate-300'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1.5">
                  <div className={`p-1.5 rounded-lg bg-industrial-900 border border-slate-700/50 ${preset.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  {isCurrent && (
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-industrial-950 font-bold tracking-wider">
                      ACTIVE
                    </span>
                  )}
                </div>
                <div className="text-xs font-bold font-display tracking-tight text-slate-100">
                  {preset.label}
                </div>
                <div className="text-[10px] text-slate-400 mt-1 leading-snug">
                  {preset.description}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Manual Direct Overrides (Interactive Sliders) */}
      <div className="mt-6 pt-5 border-t border-slate-800/80">
        <div className="flex items-center justify-between mb-3">
          <div className="text-[11px] font-mono tracking-wider text-slate-400 uppercase flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-slate-400" />
            <span>REAL-TIME SENSOR PARAMETER OVERRIDES ({manualOverride ? 'MANUAL ENGAGED' : 'STREAM AUTO'})</span>
          </div>
          {manualOverride && (
            <span className="text-[10px] font-mono text-amber bg-amber-950/60 border border-amber-500/40 px-2 py-0.5 rounded">
              Manual Sliders Override Active
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-industrial-800/40 p-4 rounded-xl border border-slate-800">
          {/* Current Slider */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-slate-400">Phase Current (A):</span>
              <span className="font-bold text-cyan">{sensorData.current.toFixed(1)} A</span>
            </div>
            <input
              type="range"
              min="0"
              max={limits.currentMax}
              step="0.1"
              value={sensorData.current}
              onChange={(e) => {
                if (isImportActive) exitImportMode();
                setManualSensorValues({ current: parseFloat(e.target.value) });
              }}
              className="w-full h-1.5 bg-industrial-700 rounded-lg appearance-none cursor-pointer accent-cyan"
            />
            <div className="flex justify-between text-[9px] font-mono text-slate-500">
              <span>0 A</span>
              <span>Nominal: {limits.currentNominal}A</span>
              <span>Trip: {limits.currentMax}A</span>
            </div>
          </div>

          {/* Temperature Slider */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-slate-400">Motor Surface Temp (°C):</span>
              <span className="font-bold text-amber">{sensorData.temperature.toFixed(1)} °C</span>
            </div>
            <input
              type="range"
              min="20"
              max={limits.tempMax}
              step="0.5"
              value={sensorData.temperature}
              onChange={(e) => {
                if (isImportActive) exitImportMode();
                setManualSensorValues({ temperature: parseFloat(e.target.value) });
              }}
              className="w-full h-1.5 bg-industrial-700 rounded-lg appearance-none cursor-pointer accent-amber"
            />
            <div className="flex justify-between text-[9px] font-mono text-slate-500">
              <span>20 °C</span>
              <span>Nominal: {limits.tempNominal}°C</span>
              <span>Trip: {limits.tempMax}°C</span>
            </div>
          </div>

          {/* Vibration Slider */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-slate-400">MPU6050 Vibration (g RMS):</span>
              <span className="font-bold text-purple-400">{sensorData.vibration.toFixed(2)} g</span>
            </div>
            <input
              type="range"
              min="0.1"
              max={limits.vibrationMax}
              step="0.05"
              value={sensorData.vibration}
              onChange={(e) => {
                if (isImportActive) exitImportMode();
                setManualSensorValues({ vibration: parseFloat(e.target.value) });
              }}
              className="w-full h-1.5 bg-industrial-700 rounded-lg appearance-none cursor-pointer accent-purple-400"
            />
            <div className="flex justify-between text-[9px] font-mono text-slate-500">
              <span>0.1 g</span>
              <span>Nominal: {limits.vibrationNominal}g</span>
              <span>Trip: {limits.vibrationMax}g</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
