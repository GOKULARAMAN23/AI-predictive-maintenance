import React, { useState } from 'react';
import { useMotorTelemetry } from './hooks/useMotorTelemetry';
import { CircularRULGauge } from './components/CircularRULGauge';
import { TelemetryCard } from './components/TelemetryCard';
import { TelemetryChart } from './components/TelemetryChart';
import { DiagnosticsMatrix } from './components/DiagnosticsMatrix';
import { SimulationControls } from './components/SimulationControls';
import { Header } from './components/Header';
import { AlarmBanner } from './components/AlarmBanner';
import { ShieldAlert, Terminal } from 'lucide-react';

export const Dashboard: React.FC = () => {
  const {
    sensorData,
    limits,
    motor,
    rul,
    history,
    diagnostics,
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
    setManualSensorValues,
    resetToNormal,
    exportTelemetryCSV,
    // Import API
    importedDataset,
    importNotification,
    setImportNotification,
    loadImportedFile,
    loadPresetImport,
    toggleImportPlayback,
    seekImportFrame,
    exitImportMode,
  } = useMotorTelemetry();

  const [emergencyModalOpen, setEmergencyModalOpen] = useState(false);

  // Extract individual history streams for sparklines
  const currentHistory = history.map(h => ({ timeLabel: h.timeLabel, value: h.current }));
  const tempHistory = history.map(h => ({ timeLabel: h.timeLabel, value: h.temperature }));
  const vibHistory = history.map(h => ({ timeLabel: h.timeLabel, value: h.vibration }));

  const handleControlledStop = () => {
    setEmergencyModalOpen(true);
  };

  const confirmControlledStop = () => {
    setEmergencyModalOpen(false);
    resetToNormal();
    setIsLiveStream(false);
  };

  return (
    <div className="min-h-screen bg-industrial-950 text-slate-100 bg-grid-overlay relative selection:bg-cyan selection:text-industrial-950 pb-16">
      {/* Top Navbar */}
      <Header 
        motor={motor} 
        severity={rul.severity} 
        isStreaming={isLiveStream} 
      />

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 space-y-6">
        {/* Dynamic Alarm Banner (Visible during warning/critical states) */}
        <AlarmBanner 
          rul={rul} 
          onEmergencyStop={handleControlledStop} 
        />

        {/* Hero Section: Circular Gauge + 3 Sensor Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Hero Circular Gauge (5 cols on lg) */}
          <div className="lg:col-span-5 flex flex-col">
            <CircularRULGauge 
              rul={rul} 
              isStreaming={isLiveStream} 
            />
          </div>

          {/* 3 Telemetry Cards (7 cols on lg) */}
          <div className="lg:col-span-7 flex flex-col justify-between gap-4">
            {/* 1. Stator Current Card */}
            <TelemetryCard
              type="current"
              value={sensorData.current}
              rate={sensorData.currentRate}
              nominal={limits.currentNominal}
              maxLimit={limits.currentMax}
              historyData={currentHistory}
              unit="A"
              sensorModel="LEM HASS 50-S Transducer"
            />

            {/* 2. Motor Surface Temperature Card */}
            <TelemetryCard
              type="temperature"
              value={sensorData.temperature}
              rate={sensorData.tempRate}
              nominal={limits.tempNominal}
              maxLimit={limits.tempMax}
              historyData={tempHistory}
              unit="°C"
              sensorModel="Dallas DS18B20 1-Wire Probe"
            />

            {/* 3. Vibration Intensity Card */}
            <TelemetryCard
              type="vibration"
              value={sensorData.vibration}
              rate={sensorData.vibrationRate}
              nominal={limits.vibrationNominal}
              maxLimit={limits.vibrationMax}
              historyData={vibHistory}
              isoZone={sensorData.isoZone}
              unit="g"
              sensorModel="MPU6050 6-DOF Triaxial I2C"
            />
          </div>
        </div>

        {/* Synchronized Telemetry Timeline Chart */}
        <TelemetryChart 
          history={history} 
          limits={limits} 
        />

        {/* Bottom Grid: Simulation & File Import Controls + Diagnostics Matrix */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Simulation, File Import & Stress Testing Engine */}
          <SimulationControls
            simulationMode={simulationMode}
            setSimulationMode={setSimulationMode}
            isLiveStream={isLiveStream}
            setIsLiveStream={setIsLiveStream}
            streamSpeed={streamSpeed}
            setStreamSpeed={setStreamSpeed}
            audioAlertsEnabled={audioAlertsEnabled}
            setAudioAlertsEnabled={setAudioAlertsEnabled}
            manualOverride={manualOverride}
            setManualOverride={setManualOverride}
            sensorData={sensorData}
            setManualSensorValues={setManualSensorValues}
            resetToNormal={resetToNormal}
            exportTelemetryCSV={exportTelemetryCSV}
            limits={limits}
            // Import dataset API
            importedDataset={importedDataset}
            importNotification={importNotification}
            setImportNotification={setImportNotification}
            loadImportedFile={loadImportedFile}
            loadPresetImport={loadPresetImport}
            toggleImportPlayback={toggleImportPlayback}
            seekImportFrame={seekImportFrame}
            exitImportMode={exitImportMode}
          />

          {/* Root-Cause Diagnostics & Prescriptive AI */}
          <DiagnosticsMatrix 
            diagnostics={diagnostics} 
          />
        </div>

        {/* Live Mathematical Formula & Asset Verification HUD */}
        <div className="p-5 rounded-2xl bg-industrial-900/80 border border-slate-800/80 text-xs font-mono text-slate-400 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <span className="text-slate-300 font-bold flex items-center gap-1.5">
              <Terminal className="w-4 h-4 text-cyan" />
              PHYSICS-INFORMED MATHEMATICAL RUL ENGINE FORMULATION
            </span>
            <span className="text-slate-500">ISO 13373-1 & VDI 3832 Compliant</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-3 bg-industrial-950/80 rounded-xl border border-slate-800 space-y-1">
              <span className="text-cyan font-semibold">1. Normalized Health Index H(t):</span>
              <p className="text-slate-300 font-mono">
                H(t) = 100 - [ 0.40·(V/{limits.vibrationMax}g) + 0.35·(T/{limits.tempMax}°C) + 0.25·(I/{limits.currentMax}A) ] × 100
              </p>
              <p className="text-emerald-400">
                Current Output: <strong>H(t) = {rul.healthIndex}%</strong> | Wear Rate Multiplier: {rul.wearRateMultiplier}x
              </p>
            </div>

            <div className="p-3 bg-industrial-950/80 rounded-xl border border-slate-800 space-y-1">
              <span className="text-cyan font-semibold">2. Non-Linear Exponential Wear RUL:</span>
              <p className="text-slate-300 font-mono">
                RUL(days) = 90 × ( H(t) / 100 )<sup>1.8</sup>
              </p>
              <p className="text-cyan">
                Estimated Remaining Days: <strong>{rul.rulDays} Days</strong> (95% CI: {rul.rulLowerBound}d – {rul.rulUpperBound}d)
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Controlled Emergency Stop Confirmation Modal */}
      {emergencyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="max-w-md w-full p-6 rounded-2xl bg-industrial-900 border border-red-500/80 shadow-[0_0_40px_rgba(255,30,86,0.4)] space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-red-950 border border-red-500 text-red-400">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white font-display">
                  CONFIRM CONTROLLED SHUTDOWN
                </h3>
                <p className="text-xs text-red-300 font-mono">
                  Asset {motor.assetId} — 75kW Slurry Feed Motor
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-300 font-mono leading-relaxed">
              Initiating this protocol will ramp down the VFD inverter over 45 seconds, engage electro-mechanical shaft brakes, and log a critical thermal-vibration event to the enterprise SCADA ledger.
            </p>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                onClick={() => setEmergencyModalOpen(false)}
                className="px-4 py-2 rounded-lg border border-slate-700 bg-industrial-800 text-slate-300 hover:text-white text-xs font-mono font-semibold cursor-pointer"
              >
                CANCEL
              </button>
              <button
                onClick={confirmControlledStop}
                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-mono font-bold shadow-lg cursor-pointer"
              >
                EXECUTE SHUTDOWN
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
