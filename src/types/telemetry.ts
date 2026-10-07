export interface TelemetryLimits {
  currentMax: number;       // e.g. 30.0 A
  currentNominal: number;   // e.g. 14.5 A
  tempMax: number;          // e.g. 100.0 °C
  tempNominal: number;      // e.g. 46.0 °C
  vibrationMax: number;     // e.g. 7.5 g RMS
  vibrationNominal: number; // e.g. 0.85 g RMS
}

export type HealthSeverity = 'NORMAL' | 'WARNING' | 'CRITICAL';

export type IsoVibrationZone = 'ZONE_A' | 'ZONE_B' | 'ZONE_C' | 'ZONE_D';

export interface SensorReading {
  current: number;          // RMS Current (A)
  temperature: number;      // DS18B20 Temp (°C)
  vibration: number;        // MPU6050 Vibration (g RMS)
  tempRate: number;         // ΔT/Δt in °C/min
  vibrationRate: number;    // ΔV/Δt in g/min
  currentRate: number;      // ΔI/Δt in A/min
  rpm: number;              // Shaft RPM
  powerFactor: number;      // PF
  isoZone: IsoVibrationZone;
  timestamp: number;        // Unix ms
}

export interface RULCalculation {
  healthIndex: number;      // H(t) 0-100%
  failureRisk: number;      // 0-100% (100 - H(t))
  rulDays: number;          // Days to shutdown
  rulLowerBound: number;    // 95% CI lower
  rulUpperBound: number;    // 95% CI upper
  severity: HealthSeverity;
  estimatedShutdownDate: Date;
  primaryDegradationFactor: 'VIBRATION' | 'THERMAL' | 'CURRENT' | 'NONE';
  wearRateMultiplier: number;
}

export interface TelemetryHistoryPoint {
  timeLabel: string;
  timestamp: number;
  current: number;
  temperature: number;
  vibration: number;
  healthIndex: number;
  rulDays: number;
}

export type SimulationMode = 
  | 'NORMAL'
  | 'BEARING_OVERHEAT'
  | 'MISALIGNMENT_SPIKE'
  | 'CURRENT_OVERLOAD'
  | 'CRITICAL_AVALANCHE';

export interface DiagnosticsItem {
  name: string;
  component: string;
  probability: number;
  severity: HealthSeverity;
  symptom: string;
  actionRequired: string;
}

export interface MotorMetadata {
  assetId: string;
  name: string;
  model: string;
  powerRatingKw: number;
  voltage: string;
  ratedSpeedRpm: number;
  operatingHours: number;
  installationDate: string;
  isoClass: string;
}

export interface ImportedTelemetryFrame {
  timestamp: number;
  timeLabel: string;
  current: number;
  temperature: number;
  vibration: number;
  rpm?: number;
}

export interface ImportedDatasetState {
  filename: string;
  totalFrames: number;
  currentFrameIndex: number;
  isPlaying: boolean;
  frames: ImportedTelemetryFrame[];
}
