import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import type { LucideIcon } from "lucide-react";
import {
  Activity,
  AlertTriangle,
  Camera,
  Eye,
  Play,
  Square,
  Watch,
  Zap,
} from "lucide-react";
import { usePostureVision } from "@/hooks/usePostureVision";
import { formatDuration } from "@/utils/postureMath";

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
  } = usePostureVision();

  const isSessionActive = sessionState.active;

  const postureInsights = useMemo(() => {
    if (!postureMetrics.alerts.length && !eyeMetrics.warnings.length) {
      return ["Aligned posture and relaxed eyes — keep it up!"];
    }
    return [...postureMetrics.alerts, ...eyeMetrics.warnings];
  }, [postureMetrics.alerts, eyeMetrics.warnings]);

  const calibrationPercent = Math.round(
    postureMetrics.calibrationProgress * 100
  );

  const rsiHighlights = [
    "BioAmp EXG Pill reads wrist muscle fatigue locally.",
    "Prototype haptic puck vibrates when strain exceeds thresholds.",
    "Shipping plan: wireless wristband that streams to this dashboard.",
  ];

  return (
    <div className="min-h-screen pb-16">
      <div className="pt-28 px-6 md:px-10 max-w-7xl mx-auto space-y-8">
        <div className="glass rounded-2xl px-4 py-3 inline-flex items-center gap-3 text-xs text-muted-foreground">
          <Zap className="h-4 w-4 text-primary" />
          <span>
            Live CV analytics run entirely in-browser — no Python backend
            required.
          </span>
        </div>

        <header className="space-y-3">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Neck &amp; Eye Coach
          </h1>
          <p className="text-muted-foreground max-w-2xl">
            Mirrors the calibration, neck-drop, and blink-tracking logic from
            our computer-vision model. Calibrate once, then monitor posture +
            eye strain in real time — all client-side so Vercel-friendly.
          </p>
        </header>

        <section className="glass rounded-2xl px-6 py-4 flex flex-wrap gap-6 items-center justify-between">
          <div className="flex flex-wrap gap-6 text-sm">
            <InfoPill
              label="Session"
              value={sessionState.formattedDuration}
              icon={Watch}
            />
            <InfoPill
              label="Status"
              value={statusBadge.label}
              icon={Activity}
              className={statusBadge.color}
            />
            <InfoPill
              label={postureMetrics.calibrated ? "Calibrated" : "Calibrating"}
              value={
                postureMetrics.calibrated
                  ? "Baseline locked"
                  : `${calibrationPercent}%`
              }
              icon={Camera}
            />
          </div>
          {isSessionActive && (
            <div className="flex items-center gap-2 text-emerald-500 text-sm font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Monitoring live
            </div>
          )}
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="glass rounded-3xl p-6 space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <Camera className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold">Webcam Feed (Local)</h2>
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
                  disabled={isSessionActive || isModelLoading}
                  className="flex-1"
                >
                  <Play className="h-4 w-4 mr-2" />
                  {isModelLoading ? "Preparing…" : "Start Session"}
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

              <div className="bg-primary/10 border border-primary/20 rounded-xl px-4 py-3 text-xs text-primary">
                This feed mirrors{" "}
                <code className="font-mono">model/Posture.py</code> logic:
                30-frame calibration, neck-drop alerts, EAR-based blink
                tracking, and cooldown logic — now entirely client-side.
              </div>
            </div>

            <div className="glass rounded-3xl p-6">
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Zap className="h-4 w-4 text-primary" />
                Live Insights
              </h3>
              <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                {postureInsights.map((tip, idx) => (
                  <div
                    key={`${tip}-${idx}`}
                    className="glass-strong rounded-2xl px-5 py-4 min-w-[240px] border border-primary/10 text-sm text-foreground/80"
                  >
                    {tip}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-5">
            <MetricPanel
              title="Neck Posture"
              subtitle="Calibration-aware posture logic from the CV model."
              icon={Activity}
            >
              <MetricRow
                label="Neck drop"
                value={formatPercent(postureMetrics.neckDropPercent)}
                severity={getSeverity(postureMetrics.neckDropPercent, {
                  warn: 8,
                  alert: 15,
                })}
                helper="% drop vs. calibrated ear-to-shoulder distance"
              />
              <MetricRow
                label="Head tilt"
                value={formatDegrees(postureMetrics.headTiltDeg)}
                severity={getSeverity(Math.abs(postureMetrics.headTiltDeg), {
                  warn: 5,
                  alert: 12,
                })}
                helper="Roll relative to baseline head alignment"
              />
              <MetricRow
                label="Shoulder tilt"
                value={formatDegrees(postureMetrics.shoulderTiltDeg)}
                severity={getSeverity(
                  Math.abs(postureMetrics.shoulderTiltDeg),
                  {
                    warn: 4,
                    alert: 8,
                  }
                )}
                helper="Left/right shoulder offset vs. calibration"
              />
            </MetricPanel>

            <MetricPanel
              title="Eye Strain"
              subtitle="Face mesh tracks EAR, blinks/min, and strain windows."
              icon={Eye}
            >
              <MetricRow
                label="EAR"
                value={eyeMetrics.ear ? eyeMetrics.ear.toFixed(2) : "—"}
                helper="Eye Aspect Ratio — lower means eyes closed"
              />
              <MetricRow
                label="Blinks (current min)"
                value={eyeMetrics.blinkCountCurrentMinute.toString()}
                helper="Resets every minute"
              />
              <MetricRow
                label="Avg blinks (last 3 min)"
                value={eyeMetrics.recentBlinkAverage.toFixed(1)}
                severity={getSeverity(10 - eyeMetrics.recentBlinkAverage, {
                  warn: 2,
                  alert: 4,
                })}
                helper="Target ≥10 blinks per minute"
              />
              <MetricRow
                label="Session time"
                value={formatDuration(eyeMetrics.sessionSeconds)}
                helper="Used for 20-20-20 reminders"
              />
              {!!eyeMetrics.warnings.length && (
                <div className="text-xs text-amber-500 mt-2 space-y-1">
                  {eyeMetrics.warnings.map((warning) => (
                    <div key={warning} className="flex items-center gap-2">
                      <AlertTriangle className="h-3 w-3" />
                      {warning}
                    </div>
                  ))}
                </div>
              )}
            </MetricPanel>

            <MetricPanel
              title="RSI Prototype"
              subtitle="BioAmp EXG wristband (local testing)"
              icon={AlertTriangle}
            >
              <p className="text-sm text-muted-foreground mb-3">
                Our muscle-signal wristband isn’t wired into this dashboard yet.
                Internally we stream BioAmp EXG Pill data to a local vibrator
                puck that warns when typing strain spikes. Public release:
                Bluetooth wristband that syncs here.
              </p>
              <ul className="space-y-2 text-xs text-muted-foreground">
                {rsiHighlights.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">•</span>
                    {item}
                  </li>
                ))}
              </ul>
            </MetricPanel>
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
