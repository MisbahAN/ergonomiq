import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import type { LucideIcon } from "lucide-react";
import {
  Activity,
  AlertTriangle,
  Camera,
  Eye,
  Loader2,
  Play,
  Square,
  Watch,
  Zap,
} from "lucide-react";
import { usePostureVision } from "@/hooks/usePostureVision";
import { formatDuration } from "@/utils/postureMath";
import { firestoreService } from "@/lib/firestoreService";
import { useAuthStore } from "@/hooks/useAuthStore";
import { useToast } from "@/hooks/use-toast";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const formatPercent = (value: number) => `${value.toFixed(1)}%`;
const formatDegrees = (value: number) => `${value.toFixed(1)}°`;

export default function PostureMonitor() {
  const {
    videoRef,
    canvasRef,
    startSession,
    stopSession,
    postureMetrics,
    eyeMetrics,
    sessionState,
    isModelLoading,
    error,
    statusBadge,
    sessionPayload,
    clearSessionPayload,
  } = usePostureVision();
  const { user } = useAuthStore();
  const { toast } = useToast();
  const [isSyncingSession, setIsSyncingSession] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [trendData, setTrendData] = useState<TrendPoint[]>([]);
  const lastTrendSampleRef = useRef(0);

  useEffect(() => {
    if (!sessionPayload) return;

    let cancelled = false;

    const syncSession = async () => {
      if (!user) {
        toast({
          title: "Sign in to save sessions",
          description: "Log in to keep your posture and eye analytics synced.",
          variant: "destructive",
        });
        clearSessionPayload();
        return;
      }

      setIsSyncingSession(true);
      setSyncError(null);

      try {
        const tasks: Promise<unknown>[] = [];
        if (sessionPayload.postureSession) {
          const postureSession = sessionPayload.postureSession;
          tasks.push(
            firestoreService.logPostureSession(user.uid, {
              postureData: postureSession.postureData,
              frequency: postureSession.frequency,
              timestampStart: postureSession.timestampStart,
              timestampEnd: postureSession.timestampEnd,
              device: postureSession.device,
              processed: false,
            })
          );
        }

        if (sessionPayload.eyeSession) {
          const eyeSession = sessionPayload.eyeSession;
          tasks.push(
            firestoreService.logEyeStrainSession(user.uid, {
              timestampStart: eyeSession.timestampStart,
              duration: eyeSession.duration,
              device: eyeSession.device,
              avgBlinkRate: eyeSession.avgBlinkRate,
              totalBlinks: eyeSession.totalBlinks,
              avgEAR: eyeSession.avgEAR,
              eyeClosureEvents: eyeSession.eyeClosureEvents,
              strainAlerts: eyeSession.strainAlerts,
              lowBlinkRateAlerts: eyeSession.lowBlinkRateAlerts,
              takeBreakAlerts: eyeSession.takeBreakAlerts,
              eyesStrainedAlerts: eyeSession.eyesStrainedAlerts,
              maxSessionTimeWithoutBreak: eyeSession.maxSessionTimeWithoutBreak,
              processed: false,
            })
          );
        }

        await Promise.all(tasks);

        if (!cancelled) {
          toast({
            title: "Session synced",
            description: "Posture & eye metrics saved to your analytics feed.",
          });
        }
      } catch (err) {
        console.error("Failed to sync session", err);
        if (!cancelled) {
          setSyncError("Failed to sync this session. Try again from the dashboard.");
          toast({
            title: "Sync failed",
            description: "We couldn't save your session. Check your connection and retry.",
            variant: "destructive",
          });
        }
      } finally {
        if (!cancelled) {
          setIsSyncingSession(false);
          clearSessionPayload();
        }
      }
    };

    syncSession();

    return () => {
      cancelled = true;
    };
  }, [sessionPayload, user, clearSessionPayload, toast]);

  const isSessionActive = sessionState.active;
  const canStartSession = !isSessionActive && !isModelLoading && !isSyncingSession;

  const postureInsights = useMemo(() => {
    if (!postureMetrics.alerts.length && !eyeMetrics.warnings.length) {
      return ["Aligned posture and relaxed eyes - keep it up!"];
    }
    return [...postureMetrics.alerts, ...eyeMetrics.warnings];
  }, [postureMetrics.alerts, eyeMetrics.warnings]);

  const calibrationPercent = Math.round(
    postureMetrics.calibrationProgress * 100
  );

  useEffect(() => {
    if (!sessionState.active || !postureMetrics.calibrated) return;
    const now = Date.now();
    if (now - lastTrendSampleRef.current < 1000) return;
    lastTrendSampleRef.current = now;

    const neckQuality = Math.max(0, 100 - Math.max(0, postureMetrics.neckDropPercent));
    const blinkRate = eyeMetrics.recentBlinkAverage;
    const timeLabel = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });

    setTrendData((prev) => {
      const next = [...prev, {
        time: timeLabel,
        postureQuality: Number(neckQuality.toFixed(1)),
        blinkRate: Number(blinkRate.toFixed(1)),
      }];
      return next.slice(-90);
    });
  }, [sessionState.active, postureMetrics, eyeMetrics]);

  const diagnostics = useMemo(() => buildDiagnostics(postureMetrics, eyeMetrics), [
    postureMetrics,
    eyeMetrics,
  ]);

  return (
    <div className="min-h-screen pb-16">
      <div className="pt-28 px-6 md:px-10 max-w-7xl mx-auto space-y-8">
        <header className="space-y-3">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Neck &amp; Eye Coach
          </h1>
          <p className="text-muted-foreground max-w-2xl">
            Mirrors the calibration, neck-drop, and blink-tracking logic from
            our computer-vision model. Calibrate once, then monitor posture +
            eye strain in real time - all client-side so Vercel-friendly.
          </p>
        </header>



        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="glass rounded-3xl p-6 space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <Camera className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold">Webcam Feed</h2>
                {error && (
                  <span className="text-xs text-destructive flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    {error}
                  </span>
                )}
              </div>

              <div className="relative rounded-2xl border border-border overflow-hidden bg-black/60">
                <video
                  ref={videoRef}
                  className="w-full aspect-video object-cover opacity-90"
                  playsInline
                  muted
                  autoPlay
                  style={{ transform: "scaleX(-1)" }}
                />
                <canvas
                  ref={canvasRef}
                  className="absolute inset-0 w-full h-full pointer-events-none"
                />
                {!isSessionActive && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6 text-muted-foreground backdrop-blur-sm">
                    <Camera className="h-12 w-12 mb-3 text-muted-foreground/50" />
                    <p className="text-sm">
                      Start a session to calibrate shoulders, neck, and blinks.
                      Data stays on-device.
                    </p>
                  </div>
                )}
                {isModelLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/60 text-white text-sm">
                    Loading MediaPipe models…
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={startSession}
                  disabled={!canStartSession}
                  className="flex-1"
                >
                  {isModelLoading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Play className="h-4 w-4 mr-2" />
                  )}
                  {isModelLoading
                    ? "Preparing…"
                    : isSyncingSession
                      ? "Syncing to Firebase…"
                      : "Start Session"}
                </Button>
                <Button
                  onClick={stopSession}
                  disabled={!isSessionActive}
                  variant="outline"
                  className="flex-1"
                >
                  <Square className="h-4 w-4 mr-2" />
                  Stop Session
                </Button>
              </div>

              {isSyncingSession && (
                <p className="text-xs text-muted-foreground text-center">
                  Uploading posture & eye telemetry to Firebase…
                </p>
              )}
              {syncError && (
                <p className="text-xs text-destructive text-center">{syncError}</p>
              )}

            </div>

            <div className="glass rounded-3xl p-6">
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Zap className="h-4 w-4 text-primary" />
                Live Diagnostics
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  diagnostics.find(d => d.title.toLowerCase().includes('neck drop')),
                  diagnostics.find(d => d.title.toLowerCase().includes('head tilt')),
                  diagnostics.find(d => d.title.toLowerCase().includes('shoulder tilt'))
                ]
                .filter((item): item is Diagnostic => item !== undefined)
                .map((diagnostic) => (
                  <DiagnosticCard key={diagnostic.title} {...diagnostic} />
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-5">
            <div className="glass rounded-3xl p-5">
              <div className="flex items-center gap-3 mb-4">
                <Eye className="h-4 w-4 text-primary" />
                <div>
                  <h3 className="text-base font-semibold">Eye Strain Analysis</h3>
                  <p className="text-xs text-muted-foreground">Real-time eye health metrics from face mesh analysis.</p>
                </div>
              </div>
              <div className="space-y-4">
                {[
                  diagnostics.find(d => d.title.toLowerCase().includes('ear')),
                  diagnostics.find(d => d.title.toLowerCase().includes('blink average')),
                  diagnostics.find(d => d.title.toLowerCase().includes('blink count')),
                  diagnostics.find(d => d.title.toLowerCase().includes('session time'))
                ]
                .filter((item): item is Diagnostic => item !== undefined)
                .map((diagnostic) => (
                  <DiagnosticCard key={diagnostic.title} {...diagnostic} />
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="glass rounded-3xl p-6">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-xl font-semibold">Session trend</h2>
              <p className="text-xs text-muted-foreground">
                Recent posture quality vs. blink cadence sampled every second.
              </p>
            </div>
            <div className="text-xs text-muted-foreground flex items-center gap-4">
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-emerald-500" /> Posture %
              </span>
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-primary" /> Blinks/min
              </span>
            </div>
          </div>
          <div className="h-72">
            {trendData.length ? (
              <ResponsiveContainer>
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="time" stroke="hsl(var(--muted-foreground))" tickLine={false} minTickGap={20} />
                  <YAxis stroke="hsl(var(--muted-foreground))" tickLine={false} domain={[0, 120]} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--background))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "12px",
                      fontSize: "12px",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="postureQuality"
                    stroke="#10b981"
                    strokeWidth={3}
                    dot={false}
                    name="Posture quality"
                  />
                  <Line
                    type="monotone"
                    dataKey="blinkRate"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={false}
                    name="Blink rate"
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-sm text-muted-foreground border border-dashed border-border/60 rounded-2xl">
                Start a session to see live trends.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoPill({
  label,
  value,
  icon: Icon,
  className,
}: {
  label: string;
  value: string;
  icon: LucideIcon;
  className?: string;
}) {
  return (
    <div className="glass rounded-xl px-4 py-2 flex items-center gap-3 text-sm font-medium">
      <Icon className="h-4 w-4 text-primary" />
      <div>
        <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        <p className={`text-sm ${className ?? ""}`}>{value}</p>
      </div>
    </div>
  );
}

function MetricPanel({
  title,
  subtitle,
  icon: Icon,
  children,
}: {
  title: string;
  subtitle: string;
  icon: LucideIcon;
  children: React.ReactNode;
}) {
  return (
    <div className="glass rounded-3xl p-5 space-y-4">
      <div className="flex items-center gap-3">
        <Icon className="h-4 w-4 text-primary" />
        <div>
          <h3 className="text-base font-semibold">{title}</h3>
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        </div>
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function MetricRow({
  label,
  value,
  helper,
  severity,
}: {
  label: string;
  value: string;
  helper?: string;
  severity?: "ok" | "warn" | "alert";
}) {
  const color =
    severity === "alert"
      ? "text-red-500"
      : severity === "warn"
      ? "text-amber-500"
      : "text-foreground";

  return (
    <div className="rounded-2xl border border-border px-4 py-3">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className={`text-base font-semibold ${color}`}>{value}</span>
      </div>
      {helper && <p className="text-xs text-muted-foreground mt-1">{helper}</p>}
    </div>
  );
}

function getSeverity(
  value: number,
  thresholds: { warn: number; alert: number }
) {
  if (value >= thresholds.alert) return "alert";
  if (value >= thresholds.warn) return "warn";
  return "ok";
}

type TrendPoint = {
  time: string;
  postureQuality: number;
  blinkRate: number;
};

type Diagnostic = {
  title: string;
  value: string;
  helper: string;
  status: "ok" | "warn" | "alert";
  progress?: number;
  detail?: string;
};

function buildDiagnostics(
  postureMetrics: ReturnType<typeof usePostureVision>["postureMetrics"],
  eyeMetrics: ReturnType<typeof usePostureVision>["eyeMetrics"]
): Diagnostic[] {
  const neckDrop = Math.max(0, postureMetrics.neckDropPercent);
  const headTilt = Math.abs(postureMetrics.headTiltDeg);
  const shoulderTilt = Math.abs(postureMetrics.shoulderTiltDeg);
  const blinkAvg = eyeMetrics.recentBlinkAverage;
  const sessionSeconds = eyeMetrics.sessionSeconds;
  const ear = eyeMetrics.ear || 0;
  const blinkCountCurrentMinute = eyeMetrics.blinkCountCurrentMinute;

  return [
    {
      title: "Neck drop",
      value: formatPercent(neckDrop),
      helper: "Target under 10%",
      status: getSeverity(neckDrop, { warn: 8, alert: 12 }),
      progress: Math.min(100, (neckDrop / 12) * 100 || 0),
      detail: postureMetrics.alerts.find((a) => a.toLowerCase().includes("neck")) ??
        "Aligned with baseline",
    },
    {
      title: "Head tilt",
      value: formatDegrees(headTilt),
      helper: "Alert above 12°",
      status: getSeverity(headTilt, { warn: 5, alert: 12 }),
      progress: Math.min(100, (headTilt / 12) * 100 || 0),
      detail: postureMetrics.alerts.find((a) => a.toLowerCase().includes("head")) ??
        "Balanced alignment",
    },
    {
      title: "Shoulder tilt",
      value: formatDegrees(shoulderTilt),
      helper: "Alert above 8°",
      status: getSeverity(shoulderTilt, { warn: 4, alert: 8 }),
      progress: Math.min(100, (shoulderTilt / 8) * 100 || 0),
      detail: postureMetrics.alerts.find((a) => a.toLowerCase().includes("shoulder")) ??
        "Even shoulder alignment",
    },
    {
      title: "Blink average",
      value: `${blinkAvg.toFixed(1)} / min`,
      helper: "Healthy ≥ 10 blinks/min",
      status: blinkAvg < 8 ? "alert" : blinkAvg < 10 ? "warn" : "ok",
      progress: Math.min(100, (blinkAvg / 15) * 100 || 0),
      detail:
        eyeMetrics.warnings[0] ??
        (blinkAvg < 10 ? "Take a 20-20-20 break" : "Comfortable blink cadence"),
    },
    {
      title: "EAR",
      value: ear ? ear.toFixed(2) : "-",
      helper: "Eye aspect ratio ≥ 0.25 healthy",
      status: ear < 0.20 ? "alert" : ear < 0.25 ? "warn" : "ok",
      progress: Math.min(100, (ear / 0.6) * 100 || 0),
      detail: ear < 0.25 ? "Eyes may be too closed" : "Good eye openness",
    },
    {
      title: "Session time",
      value: formatDuration(sessionSeconds),
      helper: "Break every 20 min",
      status: sessionSeconds >= 1200 ? "alert" : sessionSeconds >= 900 ? "warn" : "ok",
      progress: Math.min(100, (sessionSeconds / 1200) * 100 || 0),
      detail:
        sessionSeconds >= 1200
          ? "Time to stand and reset"
          : `${Math.max(0, 20 - Math.floor(sessionSeconds / 60))} min until break`,
    },
    {
      title: "Blink count (curr min)",
      value: blinkCountCurrentMinute.toString(),
      helper: "Resets every minute",
      status: blinkCountCurrentMinute < 5 ? "alert" : blinkCountCurrentMinute < 8 ? "warn" : "ok",
      progress: Math.min(100, (blinkCountCurrentMinute / 15) * 100 || 0),
      detail: blinkCountCurrentMinute < 8 ? "Low blink count for minute" : "Normal blink activity",
    },
  ];
}

function DiagnosticCard({ title, value, helper, status, progress, detail }: Diagnostic) {
  const color =
    status === "alert"
      ? "text-red-500"
      : status === "warn"
      ? "text-amber-500"
      : "text-emerald-500";

  return (
    <div className="rounded-3xl border border-border/60 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wide">{title}</p>
          <p className={`text-2xl font-semibold ${color}`}>{value}</p>
        </div>
        <span
          className={`text-xs font-semibold px-2 py-1 rounded-full ${
            status === "alert"
              ? "bg-red-500/10 text-red-500"
              : status === "warn"
              ? "bg-amber-500/10 text-amber-500"
              : "bg-emerald-500/10 text-emerald-500"
          }`}
        >
          {status === "alert" ? "ALERT" : status === "warn" ? "WARN" : "GOOD"}
        </span>
      </div>
      <p className="text-xs text-muted-foreground">{helper}</p>
      {progress !== undefined && (
        <div className="h-2 rounded-full bg-muted">
          <div
            className={`h-full rounded-full ${
              status === "alert"
                ? "bg-red-500"
                : status === "warn"
                ? "bg-amber-500"
                : "bg-emerald-500"
            }`}
            style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
          />
        </div>
      )}
      {detail && <p className="text-xs text-muted-foreground">{detail}</p>}
    </div>
  );
}
