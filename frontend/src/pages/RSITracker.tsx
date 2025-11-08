import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Hand, Play, Square, TrendingUp } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { Progress } from "@/components/ui/progress";

// Mock data for different time periods
const mockDataToday = [
  { time: '9am', activity: 15 },
  { time: '10am', activity: 28 },
  { time: '11am', activity: 35 },
  { time: '12pm', activity: 22 },
  { time: '1pm', activity: 18 },
  { time: '2pm', activity: 32 },
  { time: '3pm', activity: 45 },
  { time: '4pm', activity: 38 },
  { time: '5pm', activity: 25 },
];

const mockDataWeek = [
  { time: 'Mon', activity: 42 },
  { time: 'Tue', activity: 38 },
  { time: 'Wed', activity: 55 },
  { time: 'Thu', activity: 48 },
  { time: 'Fri', activity: 62 },
  { time: 'Sat', activity: 28 },
  { time: 'Sun', activity: 20 },
];

const mockDataMonth = [
  { time: 'Week 1', activity: 45 },
  { time: 'Week 2', activity: 52 },
  { time: 'Week 3', activity: 48 },
  { time: 'Week 4', activity: 55 },
];

export default function RSITracker() {
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [activeTab, setActiveTab] = useState<'Today' | 'Week' | 'Month'>('Today');

  const getCurrentData = () => {
    switch (activeTab) {
      case 'Today':
        return mockDataToday;
      case 'Week':
        return mockDataWeek;
      case 'Month':
        return mockDataMonth;
      default:
        return mockDataToday;
    }
  };

  const wellnessTips = [
    "Take micro-breaks every 45 minutes.",
    "Stretch your fingers and rotate your wrists.",
    "Avoid resting wrists on hard surfaces.",
    "Use ergonomic keyboard/mouse.",
    "Keep wrists in neutral position while typing.",
    "Perform wrist exercises before long work sessions.",
  ];

  const handleStartSession = () => {
    setIsSessionActive(true);
  };

  const handleStopSession = () => {
    setIsSessionActive(false);
  };

  return (
    <div className="min-h-screen pb-12">
      <div className="pt-28 px-8 max-w-7xl mx-auto">
        {/* Device notice banner */}
        <div className="glass rounded-2xl px-4 py-3 mb-4 border border-primary/20 bg-primary/5">
          <p className="text-xs text-foreground/80 text-center">
            🔌 RSI wristband device coming soon — for now, connect BioAmp locally via USB.
          </p>
        </div>

        {/* Header with hardware badge */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Your Wrist Health Overview
            </h1>
            <p className="text-muted-foreground">Real-time and historical RSI insights powered by EMG data.</p>
          </div>
          <div className="glass rounded-xl px-4 py-2 border border-primary/20">
            <p className="text-xs text-muted-foreground">Hardware:</p>
            <p className="text-sm font-semibold text-primary">BioAmp EXG pill</p>
            <p className="text-xs text-muted-foreground">(Local Mode)</p>
          </div>
        </div>

        {/* Session Control */}
        <div className="glass rounded-2xl px-6 py-3 mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {isSessionActive && (
              <>
                <span className="flex items-center gap-2 text-sm text-emerald-500">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                  EMG Session Active
                </span>
                <span className="text-xs text-muted-foreground">
                  Local EMG data stream (Simulated for testing)
                </span>
              </>
            )}
            {!isSessionActive && (
              <span className="text-sm text-muted-foreground">No active EMG session</span>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleStartSession}
              disabled={isSessionActive}
              size="sm"
              className="bg-primary hover:bg-primary-dark text-primary-foreground"
            >
              <Play className="h-4 w-4 mr-2" />
              Start Local EMG Session
            </Button>
            <Button
              onClick={handleStopSession}
              disabled={!isSessionActive}
              size="sm"
              variant="outline"
            >
              <Square className="h-4 w-4 mr-2" />
              Stop
            </Button>
          </div>
        </div>

        {/* Wrist Metrics Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Current Wrist Strain */}
          <div className="glass rounded-2xl p-6 float-card">
            <div className="flex items-center gap-2 mb-4">
              <Hand className="h-5 w-5 text-primary" />
              <h3 className="text-sm font-semibold text-foreground/70">CURRENT WRIST STRAIN</h3>
            </div>
            <div className="space-y-3">
              <div className="text-5xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                68%
              </div>
              <Progress value={68} className="h-2" />
              <p className="text-xs text-muted-foreground">Moderate strain detected</p>
            </div>
          </div>

          {/* Fatigue Risk Index */}
          <div className="glass rounded-2xl p-6 float-card">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-amber-500 text-xs">●</span>
              <h3 className="text-sm font-semibold text-foreground/70">FATIGUE RISK INDEX</h3>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="text-4xl font-bold text-amber-500">MEDIUM</div>
                <TrendingUp className="h-6 w-6 text-amber-500" />
              </div>
              <div className="relative h-20 flex items-end gap-1">
                <div className="w-1/5 bg-emerald-500/30 rounded-t" style={{ height: '40%' }} />
                <div className="w-1/5 bg-emerald-500/50 rounded-t" style={{ height: '60%' }} />
                <div className="w-1/5 bg-amber-500 rounded-t" style={{ height: '80%' }} />
                <div className="w-1/5 bg-amber-500/50 rounded-t" style={{ height: '60%' }} />
                <div className="w-1/5 bg-red-500/30 rounded-t" style={{ height: '40%' }} />
              </div>
              <p className="text-xs text-muted-foreground">Take breaks to reduce fatigue</p>
            </div>
          </div>

          {/* Muscle Activation Level */}
          <div className="glass rounded-2xl p-6 float-card">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-primary text-xs">●</span>
              <h3 className="text-sm font-semibold text-foreground/70">MUSCLE ACTIVATION LEVEL</h3>
            </div>
            <div className="space-y-3">
              <div className="flex items-baseline gap-2">
                <div className="text-5xl font-bold text-primary">342</div>
                <div className="text-sm text-muted-foreground">µV</div>
              </div>
              <div className="text-xs text-muted-foreground space-y-1">
                <div className="flex justify-between">
                  <span>Baseline:</span>
                  <span className="font-semibold">180 µV</span>
                </div>
                <div className="flex justify-between">
                  <span>Peak:</span>
                  <span className="font-semibold">480 µV</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                {isSessionActive ? "Live monitoring..." : "Start session to monitor"}
              </p>
            </div>
          </div>
        </div>

        {/* Trend Analytics Graph */}
        <div className="glass rounded-2xl p-6 float-card mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold mb-1">Wrist Strain / EMG Activity Over Time</h2>
              <p className="text-xs text-muted-foreground">
                Live RSI monitoring prototype — cloud sync coming soon.
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant={activeTab === 'Today' ? 'default' : 'ghost'}
                size="sm"
                className={`text-xs ${
                  activeTab === 'Today'
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-primary/10'
                }`}
                onClick={() => setActiveTab('Today')}
              >
                Today
              </Button>
              <Button
                variant={activeTab === 'Week' ? 'default' : 'ghost'}
                size="sm"
                className={`text-xs ${
                  activeTab === 'Week'
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-primary/10'
                }`}
                onClick={() => setActiveTab('Week')}
              >
                Week
              </Button>
              <Button
                variant={activeTab === 'Month' ? 'default' : 'ghost'}
                size="sm"
                className={`text-xs ${
                  activeTab === 'Month'
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-primary/10'
                }`}
                onClick={() => setActiveTab('Month')}
              >
                Month
              </Button>
            </div>
          </div>

          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={getCurrentData()}>
                <defs>
                  <linearGradient id="activityGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis
                  dataKey="time"
                  stroke="hsl(var(--muted-foreground))"
                  style={{ fontSize: '12px' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  stroke="hsl(var(--muted-foreground))"
                  style={{ fontSize: '12px' }}
                  axisLine={false}
                  tickLine={false}
                  label={{ value: 'Muscle Activity (µV)', angle: -90, position: 'insideLeft', style: { fontSize: '12px' } }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '12px',
                    fontSize: '12px',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="activity"
                  stroke="hsl(var(--primary))"
                  strokeWidth={3}
                  fill="url(#activityGradient)"
                  name="EMG Activity"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="flex items-center justify-center mt-4 gap-6">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-primary" />
              <span className="text-xs text-muted-foreground">Muscle Activity Level</span>
            </div>
          </div>
        </div>

        {/* Tips & Exercises Section */}
        <div className="glass rounded-2xl p-6 float-card mb-8">
          <h3 className="text-xl font-semibold mb-4">Improve Your Wrist Health</h3>
          <div className="overflow-x-auto scrollbar-hide">
            <div className="flex gap-4 pb-2">
              {wellnessTips.map((tip, index) => (
                <div
                  key={index}
                  className="glass-strong rounded-xl p-5 min-w-[280px] border-2 border-primary/20 hover:border-primary hover:shadow-lg transition-all hover:-translate-y-1"
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">💡</span>
                    <p className="text-sm text-foreground/80 leading-relaxed">{tip}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer - moved to AuthenticatedLayout */}
      </div>
    </div>
  );
}
