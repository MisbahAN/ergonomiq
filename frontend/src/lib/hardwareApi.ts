type RiskLevel = "LOW" | "MEDIUM" | "HIGH";
type Recommendation = "none" | "micro_break" | "full_break";

export interface ConnectResponse {
  ports: string[];
  connected: boolean;
  activePort?: string;
  device: "bioamp_exg_pill";
  timestamp: string;
}

export interface CalibrationResponse {
  status: "idle" | "calibrating" | "ready";
  durationSeconds: number;
  startedAt: string;
  completesAt: string;
  message: string;
}

export interface SessionResponse {
  sessionId: string;
  status: "idle" | "running" | "paused" | "stopped";
  timestampStart: string;
  durationSeconds: number;
  device: "bioamp_exg_pill";
  processed: boolean;
}

export interface VibrateResponse {
  status: "scheduled" | "completed";
  durationSeconds: number;
  startedAt: string;
  completesAt: string;
}

export interface StreamSignals {
  raw: number[];
  filtered: number[];
  envelope: number[];
}

export interface StreamMetrics {
  fatigueRisk: number;
  rsiRisk: RiskLevel;
  emgSignalAvg: number;
  muscleLoad: number;
  signalQuality: number;
  recommendedAction: Recommendation;
  timestamp: string;
}

export interface StreamResponse {
  sessionId: string;
  timestamp: string;
  device: "bioamp_exg_pill";
  signals: StreamSignals;
  metrics: StreamMetrics;
}

export interface TelemetryEvent {
  id: string;
  type: "risk" | "activation" | string;
  timestamp: string;
  payload: Record<string, unknown>;
}

export interface RsiSummary {
  totalSessions: number;
  averageSessionSeconds: number;
  longestSessionSeconds: number;
  totalRiskSeconds: number;
}

export interface RsiSession {
  id: string;
  recordedAt: string;
  durationSeconds: number;
  cumulativeRiskSeconds: number;
  meanEnvelope?: number | null;
}

export interface RsiDetection {
  id: string;
  recordedAt: string;
  timecodeSeconds?: number | null;
  meanEnvelope?: number | null;
}

export interface RsiAnalyticsResponse {
  summary: RsiSummary;
  sessions: RsiSession[];
  detections: RsiDetection[];
}

const PROD_DISABLES_API =
  import.meta.env.PROD && !import.meta.env.VITE_HARDWARE_API_URL;

const rawCandidates = [
  import.meta.env.VITE_HARDWARE_API_URL,
  import.meta.env.DEV ? "http://localhost:8000" : undefined,
  import.meta.env.DEV ? "http://localhost:8080" : undefined,
].filter(Boolean) as string[];

const normalizeBase = (url: string) => url.replace(/\/+$/, "");

let resolvedBase: string | null = null;

const getCandidateBases = () => {
  const normalized = rawCandidates.map(normalizeBase);
  if (resolvedBase) {
    return [resolvedBase, ...normalized.filter((base) => base !== resolvedBase)];
  }
  return normalized;
};

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  if (PROD_DISABLES_API) {
    throw new Error("HARDWARE_API_DISABLED");
  }

  const candidates = getCandidateBases();
  if (!candidates.length) {
    throw new Error("NO_HARDWARE_API_BASE");
  }

  let lastError: unknown = null;
  for (const base of candidates) {
    const url = `${base}${path.startsWith("/") ? path : `/${path}`}`;
    try {
      const response = await fetch(url, {
        ...init,
        headers: {
          "Content-Type": "application/json",
          ...(init?.headers ?? {}),
        },
      });

      if (!response.ok) {
        throw new Error(`Hardware API ${response.status}: ${response.statusText}`);
      }

      const text = await response.text();
      const data = text ? (JSON.parse(text) as T) : (undefined as T);
      resolvedBase = base;
      return data;
    } catch (error) {
      lastError = error;
      resolvedBase = null;
    }
  }

  throw lastError ?? new Error("Failed to reach hardware API");
}

export const hardwareApi = {
  isDisabled: PROD_DISABLES_API,
  get baseUrl() {
    return resolvedBase ?? rawCandidates[0] ?? null;
  },
  connect: () => request<ConnectResponse>("/connect"),
  calibrate: () =>
    request<CalibrationResponse>("/calibrate", {
      method: "POST",
    }),
  startSession: () =>
    request<SessionResponse>("/start", {
      method: "POST",
    }),
  pauseSession: () =>
    request<SessionResponse>("/pause", {
      method: "POST",
    }),
  stopSession: () =>
    request<SessionResponse>("/stop", {
      method: "POST",
    }),
  vibrate: () =>
    request<VibrateResponse>("/vibrate", {
      method: "POST",
    }),
  stream: () => request<StreamResponse>("/stream"),
  getTelemetryEvents: () => request<TelemetryEvent[]>("/telemetry/events"),
  getRsiAnalytics: () => request<RsiAnalyticsResponse>("/rsi"),
};

export type WristApiErrorCode =
  | "HARDWARE_API_DISABLED"
  | "NO_HARDWARE_API_BASE"
  | string;
