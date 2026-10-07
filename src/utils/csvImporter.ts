import type { ImportedTelemetryFrame } from '../types/telemetry';

export function parseTelemetryFile(content: string, filename: string): {
  success: boolean;
  frames: ImportedTelemetryFrame[];
  error?: string;
} {
  try {
    const trimmed = content.trim();
    if (!trimmed) {
      return { success: false, frames: [], error: 'The uploaded file is empty.' };
    }

    // Try parsing as JSON first
    if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
      try {
        const json = JSON.parse(trimmed);
        const array = Array.isArray(json) ? json : json.data || json.telemetry || json.rows;
        if (Array.isArray(array) && array.length > 0) {
          const frames = parseJsonRows(array);
          if (frames.length > 0) {
            return { success: true, frames };
          }
        }
      } catch {
        // Fall back to CSV parsing
      }
    }

    // Parse as CSV / Delimited text
    const lines = trimmed.split(/\r?\n/).filter(line => line.trim().length > 0);
    if (lines.length === 0) {
      return { success: false, frames: [], error: 'No data rows found in file.' };
    }

    // Determine delimiter: comma, semicolon, tab
    const firstLine = lines[0];
    let delimiter = ',';
    if (firstLine.includes('\t')) delimiter = '\t';
    else if (firstLine.includes(';') && !firstLine.includes(',')) delimiter = ';';

    const headers = splitLine(firstLine, delimiter).map(h => h.trim().toLowerCase().replace(/[\s_\-()[\]]/g, ''));
    
    // Find column indexes
    let currentIdx = headers.findIndex(h => h.includes('current') || h.includes('amp') || h === 'i');
    let tempIdx = headers.findIndex(h => h.includes('temp') || h === 't' || h.includes('celsius'));
    let vibIdx = headers.findIndex(h => h.includes('vib') || h.includes('accel') || h === 'v' || h.includes('grms'));
    let timeIdx = headers.findIndex(h => h.includes('time') || h.includes('timestamp') || h.includes('date'));
    let rpmIdx = headers.findIndex(h => h.includes('rpm') || h.includes('speed'));

    // Check if first line was data without headers
    let startLine = 1;
    if (currentIdx === -1 && tempIdx === -1 && vibIdx === -1) {
      // First line might be numbers
      const parsedFirst = splitLine(firstLine, delimiter).map(v => parseFloat(v));
      if (parsedFirst.length >= 3 && !isNaN(parsedFirst[0]) && !isNaN(parsedFirst[1]) && !isNaN(parsedFirst[2])) {
        currentIdx = 0;
        tempIdx = 1;
        vibIdx = 2;
        startLine = 0;
      } else {
        return {
          success: false,
          frames: [],
          error: `Could not identify telemetry columns in "${filename}". Expected headers containing Current (A), Temperature (°C), and Vibration (g).`,
        };
      }
    }

    // Fallbacks if only some matched
    if (currentIdx === -1) currentIdx = 0;
    if (tempIdx === -1) tempIdx = 1;
    if (vibIdx === -1) vibIdx = 2;

    const frames: ImportedTelemetryFrame[] = [];
    const now = Date.now();

    for (let i = startLine; i < lines.length; i++) {
      const parts = splitLine(lines[i], delimiter);
      if (parts.length < 3) continue;

      const rawCurrent = parseFloat(parts[currentIdx]);
      const rawTemp = parseFloat(parts[tempIdx]);
      const rawVib = parseFloat(parts[vibIdx]);

      if (isNaN(rawCurrent) || isNaN(rawTemp) || isNaN(rawVib)) {
        continue; // Skip invalid row
      }

      let timeLabel = `T+${frames.length}s`;
      let timestamp = now + frames.length * 1000;

      if (timeIdx !== -1 && parts[timeIdx]) {
        const rawTimeStr = parts[timeIdx].trim();
        const parsedTimestamp = Number(rawTimeStr);
        if (!isNaN(parsedTimestamp) && parsedTimestamp > 1000000000) {
          timestamp = parsedTimestamp;
          const d = new Date(timestamp);
          timeLabel = `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')}`;
        } else {
          timeLabel = rawTimeStr;
        }
      }

      let rpm = 1485;
      if (rpmIdx !== -1 && parts[rpmIdx]) {
        const parsedRpm = parseFloat(parts[rpmIdx]);
        if (!isNaN(parsedRpm)) rpm = parsedRpm;
      }

      frames.push({
        timestamp,
        timeLabel,
        current: Number(rawCurrent.toFixed(2)),
        temperature: Number(rawTemp.toFixed(2)),
        vibration: Number(rawVib.toFixed(2)),
        rpm,
      });
    }

    if (frames.length === 0) {
      return { success: false, frames: [], error: 'No valid numeric telemetry data rows could be parsed.' };
    }

    return { success: true, frames };
  } catch (err) {
    return {
      success: false,
      frames: [],
      error: `Failed to parse file: ${err instanceof Error ? err.message : 'Unknown error'}`,
    };
  }
}

function splitLine(line: string, delimiter: string): string[] {
  // Simple CSV splitter handling basic quotes
  const pattern = new RegExp(
    `(\\s*"[^"]*"\\s*|[^${delimiter}]+|(?=${delimiter}))`,
    'g'
  );
  const result: string[] = [];
  let match: RegExpExecArray | null;
  
  if (!line.includes('"')) {
    return line.split(delimiter).map(s => s.trim());
  }

  while ((match = pattern.exec(line)) !== null) {
    let cell = match[0].trim();
    if (cell.startsWith('"') && cell.endsWith('"')) {
      cell = cell.slice(1, -1);
    }
    result.push(cell);
  }
  return result;
}

function parseJsonRows(rows: Record<string, unknown>[]): ImportedTelemetryFrame[] {
  const frames: ImportedTelemetryFrame[] = [];
  const now = Date.now();

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (typeof row !== 'object' || row === null) continue;

    const current = Number(row.current ?? row.current_a ?? row.Current ?? row.I ?? row.amps ?? 14.5);
    const temperature = Number(row.temperature ?? row.temperature_c ?? row.temp ?? row.Temp ?? row.T ?? 45.0);
    const vibration = Number(row.vibration ?? row.vibration_grms ?? row.vib ?? row.Vib ?? row.V ?? 0.85);
    const rpm = Number(row.rpm ?? row.RPM ?? 1485);

    if (!isNaN(current) && !isNaN(temperature) && !isNaN(vibration)) {
      const timeLabel = String(row.timeLabel ?? row.time ?? row.Time ?? `T+${i}s`);
      const timestamp = Number(row.timestamp ?? now + i * 1000);

      frames.push({
        timestamp,
        timeLabel,
        current: Number(current.toFixed(2)),
        temperature: Number(temperature.toFixed(2)),
        vibration: Number(vibration.toFixed(2)),
        rpm,
      });
    }
  }

  return frames;
}

// Generate realistic pre-configured dataset for run-to-failure testing
export function generateSampleDataset(scenario: 'run_to_failure' | 'thermal_runaway' | 'vibration_excursion'): {
  filename: string;
  frames: ImportedTelemetryFrame[];
  csvContent: string;
} {
  const frames: ImportedTelemetryFrame[] = [];
  const now = Date.now();
  const totalFrames = 60; // 60 seconds / cycles timeline

  let filename = 'industrial_run_to_failure_telemetry.csv';

  for (let i = 0; i < totalFrames; i++) {
    const t = i / totalFrames; // 0 to 1 progress
    const timestamp = now + i * 1000;
    const d = new Date(timestamp);
    const timeLabel = `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')}`;

    let current = 14.5;
    let temp = 45.0;
    let vib = 0.85;

    if (scenario === 'run_to_failure') {
      filename = 'bearing_run_to_failure_60s.csv';
      // Exponential wear progression: starts nominal, grows steadily, accelerates into failure
      current = 14.5 + t * 12.0 + Math.sin(i * 0.3) * 0.6 + (Math.random() - 0.5) * 0.3;
      temp = 45.0 + Math.pow(t, 1.6) * 48.0 + (Math.random() - 0.5) * 0.4;
      vib = 0.85 + Math.pow(t, 2.0) * 6.2 + (Math.random() - 0.5) * 0.15;
    } else if (scenario === 'thermal_runaway') {
      filename = 'stator_thermal_runaway_60s.csv';
      current = 15.0 + (t > 0.4 ? (t - 0.4) * 16 : 0) + (Math.random() - 0.5) * 0.4;
      temp = 46.0 + Math.pow(t, 1.3) * 52.0 + (Math.random() - 0.5) * 0.3;
      vib = 0.90 + t * 2.8 + (Math.random() - 0.5) * 0.1;
    } else {
      filename = 'misalignment_vibration_spike_60s.csv';
      current = 14.8 + t * 4.5 + (Math.random() - 0.5) * 0.3;
      temp = 45.5 + t * 18.0 + (Math.random() - 0.5) * 0.3;
      vib = 0.85 + Math.pow(t, 1.4) * 6.0 + (Math.random() - 0.5) * 0.2;
    }

    frames.push({
      timestamp,
      timeLabel,
      current: Number(Math.max(0, current).toFixed(2)),
      temperature: Number(Math.max(20, temp).toFixed(2)),
      vibration: Number(Math.max(0.1, vib).toFixed(2)),
      rpm: Math.round(1485 - t * 65 + (Math.random() - 0.5) * 10),
    });
  }

  const csvHeader = 'Timestamp,TimeLabel,Current_A,Temperature_C,Vibration_gRMS,RPM\n';
  const csvRows = frames.map(f => `${f.timestamp},${f.timeLabel},${f.current},${f.temperature},${f.vibration},${f.rpm}`).join('\n');
  const csvContent = csvHeader + csvRows;

  return { filename, frames, csvContent };
}
