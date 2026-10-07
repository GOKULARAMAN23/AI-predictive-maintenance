import { useState, useEffect, useRef, useCallback } from 'react';
import type {
  SensorReading,
  RULCalculation,
  TelemetryLimits,
  TelemetryHistoryPoint,
  SimulationMode,
  HealthSeverity,
  IsoVibrationZone,
  DiagnosticsItem,
  MotorMetadata,
  ImportedDatasetState,
  ImportedTelemetryFrame
} from '../types/telemetry';
import { playAlertBeep } from '../utils/audioAlert';
import { parseTelemetryFile, generateSampleDataset } from '../utils/csvImporter';

export const DEFAULT_LIMITS: TelemetryLimits = {
  currentMax: 30.0,       // A
  currentNominal: 14.5,   // A
  tempMax: 100.0,         // °C
  tempNominal: 46.0,      // °C
  vibrationMax: 7.5,      // g RMS
  vibrationNominal: 0.85, // g RMS
};

export const DEFAULT_MOTOR: MotorMetadata = {
  assetId: 'MTR-IND-8840X',
  name: 'Primary Slurry Feed Pump Induction Motor',
  model: 'ABB M3BP 280SMB 4-Pole',
  powerRatingKw: 75,
  voltage: '415V 3-Phase 50Hz',
  ratedSpeedRpm: 1485,
  operatingHours: 14820,
  installationDate: '2023-11-14',
  isoClass: 'ISO 10816-3 Class II (Rigid Support)',
};

const MAX_HISTORY_POINTS = 35;
const MAX_DAYS_BASELINE = 90;
const GAMMA = 1.8; // Non-linear industrial wear exponent

export function computeRUL(
  reading: Pick<SensorReading, 'current' | 'temperature' | 'vibration' | 'tempRate'>,
  limits: TelemetryLimits = DEFAULT_LIMITS
): RULCalculation {
  const { current, temperature, vibration, tempRate } = reading;

  // Normalized ratios capped at realistic values
  const vRatio = Math.min(Math.max(vibration / limits.vibrationMax, 0), 1.5);
  const tRatio = Math.min(Math.max(temperature / limits.tempMax, 0), 1.5);
  const iRatio = Math.min(Math.max(current / limits.currentMax, 0), 1.5);

  // Health Index Formula: H(t) = 100 - [ 0.40 * (V/Vmax) + 0.35 * (T/Tmax) + 0.25 * (I/Imax) ] * 100
  const degradation = (0.40 * vRatio + 0.35 * tRatio + 0.25 * iRatio) * 100;
  const rawHealth = 100 - degradation;
  const healthIndex = Math.max(0, Math.min(100, Number(rawHealth.toFixed(1))));

  // Failure Risk Index (%) = 100 - H(t)
  const failureRisk = Math.max(0, Math.min(100, Number((100 - healthIndex).toFixed(1))));

  // Exponential Degradation RUL Formula: RUL = MaxDays * (H(t) / 100)^gamma
  const healthRatio = healthIndex / 100;
  let rawRUL = MAX_DAYS_BASELINE * Math.pow(healthRatio, GAMMA);

  // Apply acceleration penalty if thermal rate is increasing rapidly
  if (tempRate > 1.0) {
    const ratePenalty = Math.min(0.4, (tempRate - 1.0) * 0.1);
    rawRUL = rawRUL * (1 - ratePenalty);
  }

  const rulDays = Math.max(0.1, Number(rawRUL.toFixed(1)));

  // Determine Severity
  let severity: HealthSeverity = 'NORMAL';
  if (rulDays < 10 || healthIndex < 40) {
    severity = 'CRITICAL';
  } else if (rulDays <= 30 || healthIndex < 70) {
    severity = 'WARNING';
  }

  // Confidence bounds (95% CI)
  const uncertainty = (100 - healthIndex) * 0.003 + 0.05;
  const rulLowerBound = Math.max(0, Number((rulDays * (1 - uncertainty)).toFixed(1)));
  const rulUpperBound = Number((rulDays * (1 + uncertainty)).toFixed(1));

  // Determine Primary Degradation Factor
  let primaryDegradationFactor: 'VIBRATION' | 'THERMAL' | 'CURRENT' | 'NONE' = 'NONE';
  const factors = [
    { type: 'VIBRATION' as const, score: 0.40 * vRatio },
    { type: 'THERMAL' as const, score: 0.35 * tRatio },
    { type: 'CURRENT' as const, score: 0.25 * iRatio },
  ];
  factors.sort((a, b) => b.score - a.score);
  if (healthIndex < 85) {
    primaryDegradationFactor = factors[0].type;
  }

  // Calculate estimated shutdown date
  const shutdownMs = Date.now() + rulDays * 24 * 60 * 60 * 1000;
  const estimatedShutdownDate = new Date(shutdownMs);

  return {
    healthIndex,
    failureRisk,
    rulDays,
    rulLowerBound,
    rulUpperBound,
    severity,
    estimatedShutdownDate,
    primaryDegradationFactor,
    wearRateMultiplier: Number((1 / (Math.max(0.05, healthRatio))).toFixed(2)),
  };
}

function determineIsoZone(vibration: number): IsoVibrationZone {
  if (vibration < 1.4) return 'ZONE_A';
  if (vibration < 2.8) return 'ZONE_B';
  if (vibration < 4.5) return 'ZONE_C';
  return 'ZONE_D';
}

export function useMotorTelemetry() {
  const [limits] = useState<TelemetryLimits>(DEFAULT_LIMITS);
  const [motor] = useState<MotorMetadata>(DEFAULT_MOTOR);
  const [simulationMode, setSimulationMode] = useState<SimulationMode>('NORMAL');
  const [isLiveStream, setIsLiveStream] = useState<boolean>(true);
  const [streamSpeed, setStreamSpeed] = useState<number>(1); // 1x, 2x, 4x
  const [audioAlertsEnabled, setAudioAlertsEnabled] = useState<boolean>(false);
  const [manualOverride, setManualOverride] = useState<boolean>(false);

  // Imported dataset state
  const [importedDataset, setImportedDataset] = useState<ImportedDatasetState | null>(null);
  const [importNotification, setImportNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Sensor state
  const [sensorData, setSensorData] = useState<SensorReading>({
    current: 14.8,
    temperature: 46.2,
    vibration: 0.92,
    tempRate: 0.05,
    vibrationRate: 0.01,
    currentRate: 0.02,
    rpm: 1482,
    powerFactor: 0.88,
    isoZone: 'ZONE_A',
    timestamp: Date.now(),
  });

  // History buffer
  const [history, setHistory] = useState<TelemetryHistoryPoint[]>([]);

  // Derived RUL
  const rul = computeRUL(sensorData, limits);

  // Diagnostics items derived from physics engine
  const diagnostics: DiagnosticsItem[] = [
    {
      name: 'DE Bearing Outer Race Wear (BPFO)',
      component: 'Drive-End Spherical Roller Bearing',
      probability: Math.min(99, Math.max(5, Math.round((sensorData.vibration / limits.vibrationMax) * 85 + (sensorData.temperature > 70 ? 25 : 0)))),
      severity: sensorData.vibration > 4.5 ? 'CRITICAL' : sensorData.vibration > 2.5 ? 'WARNING' : 'NORMAL',
      symptom: sensorData.vibration > 3.0 ? 'High-frequency 3.58x harmonic modulation detected' : 'Normal vibration envelope',
      actionRequired: sensorData.vibration > 4.5 ? 'Immediate shutdown & bearing cartridge overhaul' : sensorData.vibration > 2.5 ? 'Schedule lubrication & spectral FFT inspection' : 'Continuous monitoring',
    },
    {
      name: 'Stator Winding Thermal Stress',
      component: 'Class H Copper Insulation',
      probability: Math.min(99, Math.max(3, Math.round((sensorData.temperature / limits.tempMax) * 90 + (sensorData.tempRate > 1.0 ? 20 : 0)))),
      severity: sensorData.temperature > 85 ? 'CRITICAL' : sensorData.temperature > 65 ? 'WARNING' : 'NORMAL',
      symptom: sensorData.tempRate > 1.2 ? `Rapid thermal rise gradient (+${sensorData.tempRate.toFixed(2)}°C/min)` : 'Steady thermal equilibrium',
      actionRequired: sensorData.temperature > 85 ? 'Reduce VFD drive load by 40% immediately' : sensorData.temperature > 65 ? 'Inspect cooling shroud & air intake filter' : 'Nominal cooling operating',
    },
    {
      name: 'Rotor Angular Misalignment / Dynamic Unbalance',
      component: 'Flexible Grid Coupling / Shaft 1X',
      probability: Math.min(99, Math.max(8, Math.round((sensorData.vibration / limits.vibrationMax) * 70 + (sensorData.current > 20 ? 25 : 0)))),
      severity: sensorData.vibration > 4.8 ? 'CRITICAL' : sensorData.vibration > 2.8 ? 'WARNING' : 'NORMAL',
      symptom: sensorData.vibration > 3.5 ? '1X/2X shaft running speed vibration excursion' : 'Laser alignment within tolerance (< 0.05 mm/m)',
      actionRequired: sensorData.vibration > 4.0 ? 'Laser realign drive coupling before next shift' : 'Inspect rubber element at scheduled PM',
    },
    {
      name: 'Phase Current Asymmetry & VFD Harmonic Distortion',
      component: 'Stator Phase Coils & Inverter Stage',
      probability: Math.min(99, Math.max(4, Math.round((sensorData.current / limits.currentMax) * 80))),
      severity: sensorData.current > 25 ? 'CRITICAL' : sensorData.current > 18 ? 'WARNING' : 'NORMAL',
      symptom: sensorData.current > 22 ? `High RMS current draw (${sensorData.current.toFixed(1)} A)` : 'Balanced 3-phase draw (< 1.5% unbalance)',
      actionRequired: sensorData.current > 25 ? 'Verify supply line voltage and check pump impellers' : 'Nominal phase loading',
    },
  ];

  // Ref tracking previous values for delta rates
  const prevReadingRef = useRef<{
    temp: number;
    vib: number;
    current: number;
    time: number;
  }>({
    temp: sensorData.temperature,
    vib: sensorData.vibration,
    current: sensorData.current,
    time: Date.now(),
  });

  const prevSeverityRef = useRef<HealthSeverity>(rul.severity);

  // Initialize initial history
  useEffect(() => {
    const initialPoints: TelemetryHistoryPoint[] = [];
    const now = Date.now();
    for (let i = MAX_HISTORY_POINTS; i >= 0; i--) {
      const timeMs = now - i * 2000;
      const d = new Date(timeMs);
      const timeLabel = `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')}`;
      
      const jitterCurrent = 14.5 + Math.sin(i * 0.4) * 0.8 + (Math.random() - 0.5) * 0.3;
      const jitterTemp = 45.8 + Math.cos(i * 0.2) * 1.2 + (Math.random() - 0.5) * 0.4;
      const jitterVib = 0.88 + Math.sin(i * 0.5) * 0.15 + (Math.random() - 0.5) * 0.08;

      const calc = computeRUL({
        current: jitterCurrent,
        temperature: jitterTemp,
        vibration: jitterVib,
        tempRate: 0.05,
      });

      initialPoints.push({
        timeLabel,
        timestamp: timeMs,
        current: Number(jitterCurrent.toFixed(1)),
        temperature: Number(jitterTemp.toFixed(1)),
        vibration: Number(jitterVib.toFixed(2)),
        healthIndex: calc.healthIndex,
        rulDays: calc.rulDays,
      });
    }
    setHistory(initialPoints);
  }, []);

  // Beep when crossing threshold into warning or critical
  useEffect(() => {
    if (audioAlertsEnabled && rul.severity !== prevSeverityRef.current) {
      if (rul.severity === 'CRITICAL') {
        playAlertBeep('critical');
      } else if (rul.severity === 'WARNING') {
        playAlertBeep('warning');
      }
    }
    prevSeverityRef.current = rul.severity;
  }, [rul.severity, audioAlertsEnabled]);

  // Apply a telemetry frame (used by both live stream and imported dataset playback)
  const applyTelemetryFrame = useCallback((frame: ImportedTelemetryFrame) => {
    const now = Date.now();
    const dtMinutes = Math.max(0.001, (now - prevReadingRef.current.time) / 60000);

    const tempRate = Number(((frame.temperature - prevReadingRef.current.temp) / dtMinutes).toFixed(2));
    const vibRate = Number(((frame.vibration - prevReadingRef.current.vib) / dtMinutes).toFixed(2));
    const currRate = Number(((frame.current - prevReadingRef.current.current) / dtMinutes).toFixed(2));

    prevReadingRef.current = {
      temp: frame.temperature,
      vib: frame.vibration,
      current: frame.current,
      time: now,
    };

    const isoZone = determineIsoZone(frame.vibration);

    const newReading: SensorReading = {
      current: frame.current,
      temperature: frame.temperature,
      vibration: frame.vibration,
      tempRate,
      vibrationRate: vibRate,
      currentRate: currRate,
      rpm: frame.rpm ?? 1485,
      powerFactor: Number((0.88 - (frame.current > 20 ? 0.08 : 0)).toFixed(2)),
      isoZone,
      timestamp: now,
    };

    const newRul = computeRUL(newReading, limits);

    setSensorData(newReading);

    setHistory((prevHist) => {
      const nextHist = [
        ...prevHist.slice(1),
        {
          timeLabel: frame.timeLabel || new Date(now).toLocaleTimeString(),
          timestamp: now,
          current: newReading.current,
          temperature: newReading.temperature,
          vibration: newReading.vibration,
          healthIndex: newRul.healthIndex,
          rulDays: newRul.rulDays,
        },
      ];
      return nextHist;
    });
  }, [limits]);

  // Main Streaming Engine (Handles either Live Simulation or Imported Playback)
  useEffect(() => {
    if (!isLiveStream || manualOverride) return;

    const intervalMs = Math.max(150, 1000 / streamSpeed);

    const timer = setInterval(() => {
      // 1. IF PLAYING AN IMPORTED DATASET
      if (importedDataset && importedDataset.isPlaying) {
        setImportedDataset((prev) => {
          if (!prev) return null;
          const nextIndex = (prev.currentFrameIndex + 1) % prev.totalFrames;
          const frame = prev.frames[nextIndex];
          if (frame) {
            applyTelemetryFrame(frame);
          }
          return {
            ...prev,
            currentFrameIndex: nextIndex,
          };
        });
        return;
      }

      // 2. DEFAULT LIVE EDGE SIMULATION
      const now = Date.now();
      const dtMinutes = Math.max(0.001, (now - prevReadingRef.current.time) / 60000);

      let targetCurrent = DEFAULT_LIMITS.currentNominal;
      let targetTemp = DEFAULT_LIMITS.tempNominal;
      let targetVib = DEFAULT_LIMITS.vibrationNominal;
      let rpmJitter = 1485 + (Math.random() - 0.5) * 8;

      switch (simulationMode) {
        case 'BEARING_OVERHEAT':
          targetCurrent = 17.5 + Math.random() * 1.5;
          targetTemp = 86.0 + Math.random() * 4.5;
          targetVib = 3.4 + Math.random() * 0.8;
          rpmJitter = 1472 + (Math.random() - 0.5) * 12;
          break;

        case 'MISALIGNMENT_SPIKE':
          targetCurrent = 19.8 + Math.random() * 2.2;
          targetTemp = 58.0 + Math.random() * 3.0;
          targetVib = 5.8 + Math.random() * 1.2;
          rpmJitter = 1465 + (Math.random() - 0.5) * 20;
          break;

        case 'CURRENT_OVERLOAD':
          targetCurrent = 27.8 + Math.random() * 1.8;
          targetTemp = 78.5 + Math.random() * 5.0;
          targetVib = 2.9 + Math.random() * 0.6;
          rpmJitter = 1440 + (Math.random() - 0.5) * 15;
          break;

        case 'CRITICAL_AVALANCHE':
          targetCurrent = 28.5 + Math.random() * 2.0;
          targetTemp = 93.0 + Math.random() * 5.0;
          targetVib = 6.9 + Math.random() * 0.8;
          rpmJitter = 1410 + (Math.random() - 0.5) * 30;
          break;

        case 'NORMAL':
        default:
          targetCurrent = DEFAULT_LIMITS.currentNominal + (Math.random() - 0.5) * 1.2;
          targetTemp = DEFAULT_LIMITS.tempNominal + (Math.random() - 0.5) * 1.8;
          targetVib = DEFAULT_LIMITS.vibrationNominal + (Math.random() - 0.5) * 0.25;
          break;
      }

      setSensorData((prev) => {
        const smoothFactor = simulationMode === 'NORMAL' ? 0.35 : 0.2;
        const newCurrent = Number((prev.current + (targetCurrent - prev.current) * smoothFactor + (Math.random() - 0.5) * 0.2).toFixed(1));
        const newTemp = Number((prev.temperature + (targetTemp - prev.temperature) * smoothFactor + (Math.random() - 0.5) * 0.15).toFixed(1));
        const newVib = Number(Math.max(0.2, (prev.vibration + (targetVib - prev.vibration) * smoothFactor + (Math.random() - 0.5) * 0.08)).toFixed(2));

        const tempRate = Number(((newTemp - prevReadingRef.current.temp) / dtMinutes).toFixed(2));
        const vibRate = Number(((newVib - prevReadingRef.current.vib) / dtMinutes).toFixed(2));
        const currRate = Number(((newCurrent - prevReadingRef.current.current) / dtMinutes).toFixed(2));

        prevReadingRef.current = {
          temp: newTemp,
          vib: newVib,
          current: newCurrent,
          time: now,
        };

        const updatedIsoZone = determineIsoZone(newVib);

        const newReading: SensorReading = {
          current: newCurrent,
          temperature: newTemp,
          vibration: newVib,
          tempRate,
          vibrationRate: vibRate,
          currentRate: currRate,
          rpm: Math.round(rpmJitter),
          powerFactor: Number((0.88 - (newCurrent > 20 ? 0.08 : 0)).toFixed(2)),
          isoZone: updatedIsoZone,
          timestamp: now,
        };

        // Update history
        const d = new Date(now);
        const timeLabel = `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')}`;
        const newRul = computeRUL(newReading, limits);

        setHistory((prevHist) => {
          const nextHist = [
            ...prevHist.slice(1),
            {
              timeLabel,
              timestamp: now,
              current: newReading.current,
              temperature: newReading.temperature,
              vibration: newReading.vibration,
              healthIndex: newRul.healthIndex,
              rulDays: newRul.rulDays,
            },
          ];
          return nextHist;
        });

        return newReading;
      });
    }, intervalMs);

    return () => clearInterval(timer);
  }, [isLiveStream, manualOverride, streamSpeed, simulationMode, limits, importedDataset, applyTelemetryFrame]);

  // Import file handler
  const loadImportedFile = useCallback(async (file: File) => {
    try {
      const text = await file.text();
      const result = parseTelemetryFile(text, file.name);

      if (!result.success || result.frames.length === 0) {
        setImportNotification({
          type: 'error',
          message: result.error || 'Failed to parse telemetry file.',
        });
        return { success: false, message: result.error || 'Parse error' };
      }

      const newDataset: ImportedDatasetState = {
        filename: file.name,
        totalFrames: result.frames.length,
        currentFrameIndex: 0,
        isPlaying: true,
        frames: result.frames,
      };

      setImportedDataset(newDataset);
      setManualOverride(false);
      setIsLiveStream(true);
      applyTelemetryFrame(result.frames[0]);

      setImportNotification({
        type: 'success',
        message: `Successfully loaded "${file.name}" with ${result.frames.length} telemetry frames. Dashboard is now running from imported stream!`,
      });

      return { success: true, message: `Loaded ${result.frames.length} frames.` };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown file error';
      setImportNotification({ type: 'error', message });
      return { success: false, message };
    }
  }, [applyTelemetryFrame]);

  // Load sample pre-configured dataset
  const loadPresetImport = useCallback((scenario: 'run_to_failure' | 'thermal_runaway' | 'vibration_excursion') => {
    const sample = generateSampleDataset(scenario);
    const newDataset: ImportedDatasetState = {
      filename: sample.filename,
      totalFrames: sample.frames.length,
      currentFrameIndex: 0,
      isPlaying: true,
      frames: sample.frames,
    };

    setImportedDataset(newDataset);
    setManualOverride(false);
    setIsLiveStream(true);
    applyTelemetryFrame(sample.frames[0]);

    setImportNotification({
      type: 'success',
      message: `Loaded sample dataset "${sample.filename}" (${sample.frames.length} frames). Streaming playback started!`,
    });
  }, [applyTelemetryFrame]);

  // Playback navigation controls
  const toggleImportPlayback = useCallback(() => {
    if (!importedDataset) return;
    setImportedDataset((prev) => prev ? { ...prev, isPlaying: !prev.isPlaying } : null);
    setIsLiveStream((prev) => !prev);
  }, [importedDataset]);

  const seekImportFrame = useCallback((frameIndex: number) => {
    if (!importedDataset) return;
    const clamped = Math.max(0, Math.min(importedDataset.totalFrames - 1, frameIndex));
    setImportedDataset((prev) => prev ? { ...prev, currentFrameIndex: clamped } : null);
    const frame = importedDataset.frames[clamped];
    if (frame) {
      applyTelemetryFrame(frame);
    }
  }, [importedDataset, applyTelemetryFrame]);

  const exitImportMode = useCallback(() => {
    setImportedDataset(null);
    setImportNotification(null);
    resetToNormal();
  }, []);

  // Handler for manual overrides
  const setManualSensorValues = useCallback((updates: Partial<SensorReading>) => {
    setManualOverride(true);
    setSensorData((prev) => {
      const merged = { ...prev, ...updates, timestamp: Date.now() };
      merged.isoZone = determineIsoZone(merged.vibration);
      return merged;
    });
  }, []);

  const resetToNormal = useCallback(() => {
    setManualOverride(false);
    setSimulationMode('NORMAL');
    setImportedDataset(null);
    setSensorData({
      current: DEFAULT_LIMITS.currentNominal,
      temperature: DEFAULT_LIMITS.tempNominal,
      vibration: DEFAULT_LIMITS.vibrationNominal,
      tempRate: 0.04,
      vibrationRate: 0.01,
      currentRate: 0.02,
      rpm: 1485,
      powerFactor: 0.88,
      isoZone: 'ZONE_A',
      timestamp: Date.now(),
    });
  }, []);

  const exportTelemetryCSV = useCallback(() => {
    const headers = 'Timestamp,Time,Current_A,Temperature_C,Vibration_gRMS,HealthIndex_Pct,RUL_Days\n';
    const rows = history.map(h => 
      `${h.timestamp},${h.timeLabel},${h.current},${h.temperature},${h.vibration},${h.healthIndex},${h.rulDays}`
    ).join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `machine_dna_telemetry_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [history]);

  return {
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
    // Import dataset API
    importedDataset,
    importNotification,
    setImportNotification,
    loadImportedFile,
    loadPresetImport,
    toggleImportPlayback,
    seekImportFrame,
    exitImportMode,
  };
}
