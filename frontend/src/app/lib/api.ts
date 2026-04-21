// ============================================
// GvG Defense — API Service Layer
// ============================================

const API_BASE = import.meta.env.VITE_API_URL || "/api";

// ---- Core Types ----

export interface HealthResponse {
  status: string;
  service: string;
}

export interface TabularPrediction {
  row: number;
  predicted_binary_label: number;
  attack_probability: number;
}

export interface SequencePrediction {
  window_end_row: number;
  predicted_binary_label: number;
  attack_probability: number;
}

export interface PredictResponse {
  input_rows: number;
  tabular_predictions: TabularPrediction[];
  sequence_predictions: SequencePrediction[] | null;
}

// ---- Artifact Types ----

export interface ManifestResponse {
  feature_count: number;
  train_rows: number;
  validation_rows: number;
  test_rows: number;
  sequence_train_rows: number;
  sequence_validation_rows: number;
  sequence_test_rows: number;
  label_names: string[];
  device: string;
  ids_epochs: number;
  gan_epochs: number;
  latent_dim: number;
}

export interface MetricEntry {
  split: string;
  stage: string;
  accuracy: number | null;
  precision: number | null;
  recall: number | null;
  f1: number | null;
  roc_auc: number | null;
  false_positive_rate: number | null;
  false_negative_rate: number | null;
}

export interface MetricsResponse {
  individual: MetricEntry[];
  summary: MetricEntry[];
}

export interface TrainingEpoch {
  epoch: number;
  tabular_train_loss: number;
  sequence_train_loss: number;
  tabular_validation_loss: number;
  sequence_validation_loss: number;
}

export interface TrainingHistoryResponse {
  baseline?: TrainingEpoch[];
  robust?: TrainingEpoch[];
}

export interface GeneratorFeedback {
  round_id: number;
  detection_rate: number;
  stealth_weight: number;
  generator_loss: number;
}

export interface GeneratorState {
  latent_dim: number;
  epochs: number;
  learning_rate: number;
  stealth_weight: number;
  feedback_history: GeneratorFeedback[];
}

export interface GeneratorResponse {
  state?: GeneratorState;
  feedback?: GeneratorFeedback[];
}

export interface LabelEntry {
  label: string;
  count: number;
}

export interface EdaResponse {
  report?: string;
  label_distribution?: LabelEntry[];
  plots?: string[];
}

export interface ConfusionMatrixEntry {
  rows: string[];
  cols: string[];
  values: number[][];
}

export type ConfusionMatricesResponse = Record<string, ConfusionMatrixEntry>;

// ---- Health Check ----

export async function checkHealth(): Promise<HealthResponse> {
  const res = await fetch(`${API_BASE}/`, { signal: AbortSignal.timeout(5000) });
  if (!res.ok) throw new Error(`Health check failed: ${res.status}`);
  return res.json();
}

// ---- Predict ----

export async function predictTraffic(
  rows: Record<string, number>[]
): Promise<PredictResponse> {
  const res = await fetch(`${API_BASE}/predict`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(rows),
  });
  if (!res.ok) {
    const body = await res.text();
    let detail = `Server error ${res.status}`;
    try {
      const parsed = JSON.parse(body);
      if (parsed.detail) detail = parsed.detail;
    } catch {
      /* ignore parse errors */
    }
    throw new Error(detail);
  }
  return res.json();
}

export interface EvasionShift {
  feature: string;
  original: number;
  morphed: number;
  shift: "increased" | "decreased";
}

export interface EvasionResponse {
  original_features: number[];
  morphed_features: number[];
  top_shifts: EvasionShift[];
  counter_measures: string[];
}

export async function simulateEvasion(
  row: Record<string, number>
): Promise<EvasionResponse> {
  const res = await fetch(`${API_BASE}/simulate_evasion`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify([row]),
  });
  if (!res.ok) {
    const body = await res.text();
    let detail = `Server error ${res.status}`;
    try {
      const parsed = JSON.parse(body);
      if (parsed.detail) detail = parsed.detail;
    } catch {
      /* ignore parse errors */
    }
    throw new Error(detail);
  }
  return res.json();
}


// ---- Artifact Endpoints ----

async function fetchJSON<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, { signal: AbortSignal.timeout(10000) });
  if (!res.ok) throw new Error(`API error ${res.status}: ${path}`);
  return res.json();
}

export function fetchManifest(): Promise<ManifestResponse> {
  return fetchJSON<ManifestResponse>("/artifacts/manifest");
}

export function fetchMetrics(): Promise<MetricsResponse> {
  return fetchJSON<MetricsResponse>("/artifacts/metrics");
}

export function fetchTrainingHistory(): Promise<TrainingHistoryResponse> {
  return fetchJSON<TrainingHistoryResponse>("/artifacts/training-history");
}

export function fetchGenerator(): Promise<GeneratorResponse> {
  return fetchJSON<GeneratorResponse>("/artifacts/generator");
}

export function fetchEda(): Promise<EdaResponse> {
  return fetchJSON<EdaResponse>("/artifacts/eda");
}

export function fetchConfusionMatrices(): Promise<ConfusionMatricesResponse> {
  return fetchJSON<ConfusionMatricesResponse>("/artifacts/confusion-matrices");
}

export function edaPlotUrl(filename: string): string {
  return `${API_BASE}/artifacts/eda/plots/${filename}`;
}

// ---- CSV Parser (client-side, no dependencies) ----

export function parseCSV(text: string): Record<string, number>[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) throw new Error("CSV must have a header row and at least one data row.");

  // Parse header
  const headers = parseCSVLine(lines[0]);

  // Parse data rows
  const rows: Record<string, number>[] = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.length !== headers.length) continue; // skip malformed rows

    const row: Record<string, number> = {};
    for (let j = 0; j < headers.length; j++) {
      const key = headers[j].trim();
      if (!key) continue;
      const num = Number(values[j]);
      row[key] = isNaN(num) ? 0 : num;
    }
    rows.push(row);
  }

  if (rows.length === 0) throw new Error("No valid data rows found in the CSV.");
  return rows;
}

/** Simple CSV line parser that handles quoted fields */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ",") {
        result.push(current.trim());
        current = "";
      } else {
        current += ch;
      }
    }
  }
  result.push(current.trim());
  return result;
}

// ---- File reader helper ----

export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsText(file);
  });
}
