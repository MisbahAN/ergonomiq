import { useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
} from "recharts";
import { useQuery } from "@tanstack/react-query";
import {
  firestoreService,
  PostureSession,
  EyeStrainSession,
  UserDocument,
} from "@/lib/firestoreService";
import { useAuthStore } from "@/hooks/useAuthStore";
import {
  Loader2,
  Activity,
  Eye,
  Coffee,
  AlertTriangle,
  Clock,
  Sparkles,
} from "lucide-react";
import { hardwareApi, type RsiSession } from "@/lib/hardwareApi";

const dateFormatter = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" });

type CombinedChartPoint = {
  label: string;
  postureQuality?: number;
  blinkRate?: number;
  wristMinutes?: number;
};

type AnalyticsPayload = {
  user: UserDocument | null;
  postureSessions: PostureSession[];
  eyeSessions: EyeStrainSession[];
};

const fetchAnalytics = async (uid: string): Promise<AnalyticsPayload> => {
  const [user, postureSessions, eyeSessions] = await Promise.all([
    firestoreService.getUser(uid),
    firestoreService.getUserPostureSessions(uid, 30),
    firestoreService.getUserEyeStrainSessions(uid, 30),
  ]);

  return { user, postureSessions, eyeSessions };
};

export default function Dashboard() {
  const { user } = useAuthStore();
  const uid = user?.uid;

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["analytics", uid],
    queryFn: () => fetchAnalytics(uid as string),
    enabled: !!uid,
    staleTime: 1000 * 60,
  });

  const analytics = data?.user?.analytics;
  const postureSessions = data?.postureSessions ?? [];
  const eyeSessions = data?.eyeSessions ?? [];
  const { data: rsiAnalytics } = useQuery({
    queryKey: ["rsiAnalytics", uid],
    queryFn: () => hardwareApi.getRsiAnalytics(),
    enabled: !!uid && !hardwareApi.isDisabled,
    staleTime: 1000 * 30,
  });
  const wristSessions = rsiAnalytics?.sessions ?? [];

  const hour = new Date().getHours();
  const timeOfDay = hour < 12 ? "morning" : hour < 18 ? "afternoon" : "evening";
  const displayName =
    user?.displayName?.split(" ")[0] ?? user?.email?.split("@")[0] ?? "there";

  const chartData = useMemo(
    () => buildHabitChart(postureSessions, eyeSessions, wristSessions),
    [postureSessions, eyeSessions, wristSessions]
  );

  const blinkHistory = useMemo(() => buildBlinkHistory(eyeSessions), [eyeSessions]);

  const insights = useMemo(
    () => buildInsights(analytics, postureSessions, eyeSessions),
    [analytics, postureSessions, eyeSessions]
  );

  const postureScore = analytics?.postureScore ?? 0;
  const avgSessionTime = analytics?.avgSessionTime ?? 0;
  const eyeRisk = analytics?.eyeStrainRisk ?? "LOW";
  const breakStatus = analytics?.breakStatus ?? 0;
  const weeklyImprovement = analytics?.weeklyImprovement ?? 0;

  if (!uid) {
    return (
      <div className="min-h-screen pb-12 flex items-center justify-center text-center px-6">
        <div className="glass rounded-3xl p-10 max-w-lg space-y-4">
          <h2 className="text-2xl font-semibold">Sign in to view analytics</h2>
          <p className="text-muted-foreground">
            Your posture, eye strain, and break trends will appear here once you log in and run a webcam session.
          </p>
        </div>
      </div>
    );
  }

  if (isLoading && uid) {
    return (
      <div className="min-h-screen pb-12 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if ((isError || !data) && uid) {
    return (
      <div className="min-h-screen pb-12 flex items-center justify-center text-center px-6">
        <div className="glass rounded-3xl p-10 max-w-lg space-y-4">
          <AlertTriangle className="h-6 w-6 text-destructive mx-auto" />
          <h2 className="text-xl font-semibold">Unable to load analytics</h2>
          <p className="text-muted-foreground">Check your network connection and try again.</p>
          <button
            onClick={() => refetch()}
            className="text-sm font-semibold text-primary hover:text-primary/80"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-12">
      <div className="pt-28 px-6 md:px-10 max-w-6xl mx-auto space-y-10">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              {`Good ${timeOfDay}, ${displayName}`}
            </h1>
            <p className="text-muted-foreground">Track how your desk habits are trending and where to focus today.</p>
          </div>
          <button
            onClick={() => refetch()}
            className="text-sm text-primary hover:text-primary/80 font-medium"
          >
            Refresh data
          </button>
        </header>

        <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <MetricCard
            icon={Activity}
            label="Posture score"
            value={`${postureScore.toFixed(0)}%`}
            helper={`${weeklyImprovement >= 0 ? "+" : ""}${weeklyImprovement.toFixed(1)} pts vs last week`}
          />
          <MetricCard
            icon={Clock}
            label="Avg session time"
            value={`${avgSessionTime.toFixed(1)}h`}
            helper="Daily monitoring"
          />
          <MetricCard
            icon={Eye}
            label="Eye strain risk"
            value={eyeRisk}
            helper={eyeSessions[0] ? `${eyeSessions[0].avgBlinkRate.toFixed(0)} blinks/min` : "No data yet"}
          />
          <MetricCard
            icon={Coffee}
            label="Breaks today"
            value={`${breakStatus}`}
            helper="20-20-20 reminders"
          />
        </section>

        <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="glass rounded-3xl p-6 xl:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold">Habit trend</h2>
                <p className="text-xs text-muted-foreground">
                  Posture %, blink cadence, and wrist strain minutes per day
                </p>
              </div>
              <div className="text-xs text-muted-foreground flex items-center gap-4">
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" /> Posture %
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-primary" /> Blinks/min
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-orange-400" /> Wrist minutes
                </span>
              </div>
            </div>
            <div className="h-80">
              {chartData.length ? (
                <ResponsiveContainer>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis dataKey="label" stroke="hsl(var(--muted-foreground))" tickLine={false} />
                    <YAxis
                      yAxisId="left"
                      stroke="hsl(var(--muted-foreground))"
                      tickLine={false}
                      domain={[0, 120]}
                    />
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      stroke="hsl(var(--muted-foreground))"
                      tickLine={false}
                      domain={[0, (dataMax: number) => Math.max(dataMax, 5)]}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--background))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "12px",
                        fontSize: "12px",
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="postureQuality"
                      name="Posture quality"
                      stroke="#10b981"
                      strokeWidth={3}
                      dot={false}
                      connectNulls
                    />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="blinkRate"
                      name="Blink rate"
                      stroke="hsl(var(--primary))"
                      strokeWidth={3}
                      strokeDasharray="5 5"
                      dot={false}
                      connectNulls
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="wristMinutes"
                      name="Wrist session (min)"
                      stroke="#fb923c"
                      strokeWidth={3}
                      dot
                      connectNulls
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <EmptyState message="Run a posture session to unlock habit trends." />
              )}
            </div>
          </div>

          <div className="glass rounded-3xl p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <h2 className="text-base font-semibold">Habit insights</h2>
            </div>
            {insights.length ? (
              <ul className="space-y-4">
                {insights.map((insight) => (
                  <li key={insight.title} className="border border-border/40 rounded-2xl p-4">
                    <p className="text-sm font-semibold mb-1">{insight.title}</p>
                    <p className="text-xs text-muted-foreground">{insight.detail}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState message="Insights will appear once you log a few sessions." />
            )}
          </div>
        </section>

        <section className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <div className="glass rounded-3xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold">Recent posture sessions</h2>
                <p className="text-xs text-muted-foreground">Latest webcam captures</p>
              </div>
            </div>
            {postureSessions.length ? (
              <div className="space-y-3">
                {postureSessions.slice(0, 5).map((session) => {
                  const quality = (1 - clampNumber(session.badRatio)) * 100;
                  return (
                    <div
                      key={session.id ?? session.timestampEnd?.toString() ?? Math.random()}
                      className="flex items-center justify-between border border-border/40 rounded-2xl px-4 py-3"
                    >
                      <div>
                        <p className="text-sm font-semibold">{formatDate(session.timestampEnd)}</p>
                        <p className="text-xs text-muted-foreground">
                          {(session.totalFrames ?? 0)} frames captured
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold">{quality.toFixed(0)}%</p>
                        <p className="text-xs text-muted-foreground">
                          {(session.badRatio * 100).toFixed(0)}% bad frames
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <EmptyState message="No posture sessions yet." />
            )}
          </div>

          <div className="glass rounded-3xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold">Blink rate history</h2>
                <p className="text-xs text-muted-foreground">Higher = healthier eyes</p>
              </div>
            </div>
            <div className="h-64">
              {blinkHistory.length ? (
                <ResponsiveContainer>
                  <BarChart data={blinkHistory}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis dataKey="label" stroke="hsl(var(--muted-foreground))" tickLine={false} />
                    <YAxis stroke="hsl(var(--muted-foreground))" tickLine={false} domain={[0, 30]} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--background))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "12px",
                        fontSize: "12px",
                      }}
                    />
                    <Bar dataKey="blinkRate" name="Blinks/min" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <EmptyState message="No eye sessions yet." />
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  helper,
}: {
  icon: typeof Activity;
  label: string;
  value: string;
  helper: string;
}) {
  return (
    <div className="glass rounded-3xl p-5 flex flex-col gap-2">
      <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
        <Icon className="h-4 w-4 text-primary" />
        {label}
      </div>
      <div className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
        {value}
      </div>
      <p className="text-xs text-muted-foreground">{helper}</p>
    </div>
  );
}

const toDate = (value: any): Date | null => {
  if (!value) return null;
  if (typeof value.toDate === "function") return value.toDate();
  if (value instanceof Date) return value;
  return null;
};

const clampNumber = (value?: number | null, min = 0, max = 1) => {
  if (value === undefined || value === null || Number.isNaN(value)) return min;
  return Math.min(max, Math.max(min, value));
};

const average = (values: number[]): number | undefined => {
  if (!values.length) return undefined;
  const sum = values.reduce((acc, value) => acc + value, 0);
  return Number((sum / values.length).toFixed(1));
};

const buildHabitChart = (
  postureSessions: PostureSession[],
  eyeSessions: EyeStrainSession[],
  wristSessions: RsiSession[]
): CombinedChartPoint[] => {
  const map = new Map<
    string,
    { date: Date; posture: number[]; blink: number[]; wrist: number[] }
  >();

  postureSessions.forEach((session) => {
    const date = toDate(session.timestampEnd) ?? toDate(session.timestampStart) ?? new Date();
    const key = dateFormatter.format(date);
    const quality = (1 - clampNumber(session.badRatio)) * 100;
    if (!map.has(key)) {
      map.set(key, { date, posture: [], blink: [], wrist: [] });
    }
    map.get(key)!.posture.push(Number(quality.toFixed(1)));
  });

  eyeSessions.forEach((session) => {
    const date = toDate(session.timestampStart) ?? new Date();
    const key = dateFormatter.format(date);
    if (!map.has(key)) {
      map.set(key, { date, posture: [], blink: [], wrist: [] });
    }
    map.get(key)!.blink.push(Number(session.avgBlinkRate?.toFixed(1) ?? 0));
  });

  wristSessions.forEach((session) => {
    const date = new Date(session.recordedAt);
    const key = dateFormatter.format(date);
    if (!map.has(key)) {
      map.set(key, { date, posture: [], blink: [], wrist: [] });
    }
    map
      .get(key)!
      .wrist.push(Number((session.durationSeconds / 60).toFixed(2)));
  });

  return Array.from(map.values())
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .slice(-10)
    .map((entry) => ({
      label: dateFormatter.format(entry.date),
      postureQuality: average(entry.posture),
      blinkRate: average(entry.blink),
      wristMinutes: average(entry.wrist),
    }));
};

const buildBlinkHistory = (eyeSessions: EyeStrainSession[]) =>
  eyeSessions
    .slice(0, 8)
    .map((session) => ({
      label: dateFormatter.format(toDate(session.timestampStart) ?? new Date()),
      blinkRate: Number(session.avgBlinkRate?.toFixed(1) ?? 0),
    }))
    .reverse();

type Insight = { title: string; detail: string };

const buildInsights = (
  analytics: UserDocument["analytics"] | undefined,
  postureSessions: PostureSession[],
  eyeSessions: EyeStrainSession[]
): Insight[] => {
  const insights: Insight[] = [];
  const postureScore = analytics?.postureScore ?? 0;
  const blinkRate = eyeSessions[0]?.avgBlinkRate ?? 0;
  const lowBlinkAlerts = eyeSessions.reduce((sum, session) => sum + (session.lowBlinkRateAlerts ?? 0), 0);

  if (postureScore < 80) {
    insights.push({
      title: "Posture is dipping",
      detail: "Average posture score this week fell below 80%. Recalibrate and keep shoulders relaxed against the chair back.",
    });
  } else {
    insights.push({
      title: "Posture is holding steady",
      detail: "Great job! Maintain the current baseline by starting every session centered in frame.",
    });
  }

  if (blinkRate && blinkRate < 12) {
    insights.push({
      title: "Blink cadence is low",
      detail: "Blink rate dropped under 12 blinks/min. Follow the 20-20-20 rule to reset eye moisture.",
    });
  }

  if (lowBlinkAlerts > 0) {
    insights.push({
      title: "Break reminders fired",
      detail: `${lowBlinkAlerts} low-blink reminders triggered recently. Stand, stretch wrists, and reset your gaze before jumping back in.`,
    });
  }

  const latestSession = postureSessions[0];
  if (latestSession && clampNumber(latestSession.badRatio) > 0.4) {
    insights.push({
      title: "Latest session flagged",
      detail: "More than 40% of frames were marked as poor posture. Elevate your laptop or bring the chair closer to reduce neck drop.",
    });
  }

  return insights.slice(0, 3);
};

const formatDate = (value: PostureSession["timestampEnd"]) => {
  const date = toDate(value);
  if (!date) return "Unknown";
  return `${dateFormatter.format(date)} · ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
};

const EmptyState = ({ message }: { message: string }) => (
  <div className="h-full flex items-center justify-center text-center text-sm text-muted-foreground border border-dashed border-border/60 rounded-2xl p-6">
    {message}
  </div>
);
