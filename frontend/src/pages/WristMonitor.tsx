import { useMemo, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { hardwareApi } from "@/lib/hardwareApi";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDuration } from "@/utils/postureMath";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Activity, AlertTriangle, BarChart3, Clock, RefreshCw, Watch } from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const REFRESH_MS = 8000;

export default function WristMonitor() {
  const { data, isFetching, isLoading, error, refetch } = useQuery({
    queryKey: ["rsiAnalytics"],
    queryFn: () => hardwareApi.getRsiAnalytics(),
    enabled: !hardwareApi.isDisabled,
    refetchInterval: hardwareApi.isDisabled ? false : REFRESH_MS,
  });

  const summary = data?.summary;
  const sessions = data?.sessions ?? [];
  const detections = data?.detections ?? [];

  const chartPoints = useMemo(() => {
    if (!sessions.length) return [];
    return sessions.map((session, index) => ({
      label:
        new Date(session.recordedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) ??
        `Session ${index + 1}`,
      duration: Number(session.durationSeconds.toFixed(2)),
    }));
  }, [sessions]);

  const avgDurationLabel = summary ? formatDuration(summary.averageSessionSeconds) : "--:--";
  const longestDurationLabel = summary ? formatDuration(summary.longestSessionSeconds) : "--:--";

  const statusBadge = (() => {
    if (hardwareApi.isDisabled) return { label: "API disabled", variant: "destructive" as const };
    if (error) return { label: "Device offline", variant: "destructive" as const };
    if (isFetching) return { label: "Syncing…", variant: "secondary" as const };
    return { label: "Live", variant: "default" as const };
  })();

  return (
    <div className="min-h-screen pb-16">
      <div className="pt-28 px-6 md:px-10 max-w-6xl mx-auto space-y-8">
        <header className="space-y-3">
          <div className="flex items-center gap-3">
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              BioAmp Wrist Monitor
            </h1>
            <Badge variant={statusBadge.variant}>{statusBadge.label}</Badge>
          </div>
          <p className="text-muted-foreground max-w-3xl">
            Stream wristband detections, log RSI-heavy typing streaks, and trend your recovery over time.
            This view refreshes automatically every few seconds while the hardware shim posts to <code>/rsi</code>.
          </p>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={hardwareApi.isDisabled}
              className="inline-flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
              Manual Refresh
            </Button>
            <span className="text-xs uppercase tracking-wide text-muted-foreground">
              Auto-refresh {REFRESH_MS / 1000}s
            </span>
          </div>
        </header>

        {hardwareApi.isDisabled && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Hardware API disabled</AlertTitle>
            <AlertDescription>
              Set <code>VITE_HARDWARE_API_URL</code> (or run <code>uvicorn hardware.api.main:app --reload</code>) so
              the BioAmp wristband can post typing sessions to <code>http://localhost:8000/rsi</code>.
            </AlertDescription>
          </Alert>
        )}

        {error && !hardwareApi.isDisabled && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Unable to reach the wrist API</AlertTitle>
            <AlertDescription>
              Check that the FastAPI shim is running on port 8000. The page will retry automatically.
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard
            icon={<Watch className="h-5 w-5 text-primary" />}
            label="Average typing session"
            value={avgDurationLabel}
            subtext={summary ? `${summary.totalSessions} total sessions` : "Waiting for telemetry"}
            loading={isLoading}
          />
          <StatCard
            icon={<Activity className="h-5 w-5 text-accent" />}
            label="Longest typing session"
            value={longestDurationLabel}
            subtext={
              summary ? `${summary.longestSessionSeconds.toFixed(1)}s sustained load` : "No sessions yet"
            }
            loading={isLoading}
          />
          <StatCard
            icon={<Clock className="h-5 w-5 text-primary" />}
            label="Total risk time"
            value={summary ? formatDuration(summary.totalRiskSeconds) : "--:--"}
            subtext={summary ? "Since the last boot" : "Waiting for readings"}
            loading={isLoading}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 glass border-border/40">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-2xl">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  Typing Session Trend
                </CardTitle>
                <CardDescription>Most recent {chartPoints.length || 0} wrist detections</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="h-72">
              {chartPoints.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartPoints}>
                    <defs>
                      <linearGradient id="rsiGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.5} />
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                    <XAxis
                      dataKey="label"
                      tickFormatter={(value) => value}
                      tick={{ fill: "var(--muted-foreground)" }}
                    />
                    <YAxis
                      unit="s"
                      tick={{ fill: "var(--muted-foreground)" }}
                      width={60}
                      domain={[0, (dataMax: number) => Math.max(dataMax, 5)]}
                    />
                    <Tooltip
                      contentStyle={{ background: "hsl(var(--background))", borderRadius: "12px" }}
                      formatter={(value: number) => [`${value.toFixed(2)}s`, "Duration"]}
                    />
                    <Area
                      type="monotone"
                      dataKey="duration"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      fill="url(#rsiGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                  Waiting for the first wrist interval to finish…
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="glass border-border/40">
            <CardHeader>
              <CardTitle>Recent Sessions</CardTitle>
              <CardDescription>Latest BioAmp typing streaks</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {sessions.slice(-6).reverse().map((session) => (
                <div
                  key={session.id}
                  className="rounded-2xl border border-border/40 p-3 hover:bg-primary/5 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">{formatDuration(session.durationSeconds)}</span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(session.recordedAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Cumulative strain: {session.cumulativeRiskSeconds.toFixed(1)}s
                  </div>
                </div>
              ))}
              {!sessions.length && (
                <p className="text-sm text-muted-foreground">No wrist sessions logged yet.</p>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="glass border border-border/40">
          <CardHeader>
            <CardTitle>Detection feed</CardTitle>
            <CardDescription>Real-time sustained activation events reported by the wrist module</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {detections.slice(-8).reverse().map((event) => (
              <div
                key={event.id}
                className="flex items-center justify-between rounded-2xl border border-border/30 px-4 py-2"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center">
                    <Activity className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      Envelope {event.meanEnvelope?.toFixed(2) ?? "—"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      t={event.timecodeSeconds?.toFixed(2) ?? "—"}s in-session
                    </p>
                  </div>
                </div>
                <span className="text-xs text-muted-foreground">
                  {new Date(event.recordedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            ))}
            {!detections.length && (
              <p className="text-sm text-muted-foreground">Waiting for the first sustained activation event.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

interface StatCardProps {
  icon: ReactNode;
  label: string;
  value: string;
  subtext: string;
  loading?: boolean;
}

function StatCard({ icon, label, value, subtext, loading }: StatCardProps) {
  return (
    <Card className="glass border-border/40 backdrop-blur-lg">
      <CardContent className="flex flex-col gap-2 p-6">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-2xl bg-primary/10 flex items-center justify-center">{icon}</div>
          <div>
            <p className="text-sm uppercase tracking-widest text-muted-foreground">{label}</p>
            <p className="text-3xl font-semibold">{loading ? "…" : value}</p>
          </div>
        </div>
        <span className="text-xs text-muted-foreground">{subtext}</span>
      </CardContent>
    </Card>
  );
}
