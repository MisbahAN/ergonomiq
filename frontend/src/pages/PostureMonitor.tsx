import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Camera, Play, Square } from "lucide-react";

export default function PostureMonitor() {
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [sessionDuration, setSessionDuration] = useState(0);
  const [currentTipIndex, setCurrentTipIndex] = useState(0);

  // Mock metrics
  const [metrics] = useState({
    neckAngle: 24.5,
    trunkAngle: 12.3,
    rawNeckAngle: 26.1,
    smoothedNeckAngle: 24.2,
    rawTrunkAngle: 13.8,
    smoothedTrunkAngle: 12.1,
    kneeAngle: 89.4,
    elbowAngle: 94.2,
    pelvicTilt: 8.7,
  });

  const [postureRating] = useState({ good: 75, poor: 25 });

  const tips = [
    "Straighten your back — your trunk angle is too high.",
    "Relax your shoulders.",
    "Try adjusting your chair height.",
    "Keep your monitor at eye level.",
    "Take a break every 30 minutes.",
    "Ensure your feet are flat on the floor.",
  ];

  // Session timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isSessionActive) {
      interval = setInterval(() => {
        setSessionDuration((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isSessionActive]);

  // Rotate tips
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTipIndex((prev) => (prev + 1) % tips.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [tips.length]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const currentTime = new Date().toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const handleStartSession = () => {
    setIsSessionActive(true);
    setSessionDuration(0);
  };

  const handleStopSession = () => {
    setIsSessionActive(false);
  };

  return (
    <div className="min-h-screen pb-12">
      <div className="pt-28 px-8 max-w-7xl mx-auto">
        {/* Header with prototype notice */}
        <div className="mb-6">
          <div className="glass rounded-2xl px-4 py-3 mb-4 inline-block">
            <p className="text-xs text-muted-foreground">
              ⚡ This is a prototype. Vision model integration coming soon.
            </p>
          </div>
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Posture Monitor
          </h1>
          <p className="text-muted-foreground">Real-time ergonomic awareness and coaching</p>
        </div>

        {/* Session info bar */}
        <div className="glass rounded-2xl px-6 py-3 mb-6 flex items-center justify-between">
          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Current Time:</span>
              <span className="font-semibold">{currentTime}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Session Duration:</span>
              <span className="font-semibold">{formatDuration(sessionDuration)}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isSessionActive && (
              <span className="flex items-center gap-2 text-sm text-emerald-500">
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                Active
              </span>
            )}
          </div>
        </div>

        {/* Main layout: two columns */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Left column - Camera Feed */}
          <div className="lg:col-span-2 space-y-4">
            <div className="glass rounded-2xl p-6 float-card">
              <div className="flex items-center gap-2 mb-4">
                <Camera className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold">Live Camera Feed (Local Only)</h2>
              </div>

              {/* Camera placeholder */}
              <div className="relative aspect-video bg-gradient-to-br from-muted/30 to-muted/10 rounded-xl border-2 border-dashed border-border flex items-center justify-center mb-4 overflow-hidden">
                {isSessionActive && (
                  <div className="absolute inset-0 bg-primary/5 animate-pulse" />
                )}
                <div className="text-center">
                  <Camera className="h-16 w-16 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">
                    {isSessionActive ? "Session Active - Analyzing Posture..." : "Camera feed will appear here"}
                  </p>
                </div>
              </div>

              {/* Info badge */}
              <div className="bg-primary/10 border border-primary/20 rounded-lg px-4 py-2 mb-4">
                <p className="text-xs text-foreground/70">
                  📹 For testing only — uses local webcam stream. Cloud device support coming soon.
                </p>
              </div>

              {/* Control buttons */}
              <div className="flex gap-3">
                <Button
                  onClick={handleStartSession}
                  disabled={isSessionActive}
                  className="flex-1 bg-primary hover:bg-primary-dark text-primary-foreground"
                >
                  <Play className="h-4 w-4 mr-2" />
                  Start Local Session
                </Button>
                <Button
                  onClick={handleStopSession}
                  disabled={!isSessionActive}
                  variant="outline"
                  className="flex-1"
                >
                  <Square className="h-4 w-4 mr-2" />
                  Stop Session
                </Button>
              </div>
            </div>

            {/* Posture Rating Card */}
            <div className="glass rounded-2xl p-6 float-card">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <span className="text-primary">●</span>
                Posture Rating
              </h3>
              <div className="space-y-4">
                <div className="flex items-end gap-4">
                  <div className="text-6xl font-bold bg-gradient-to-r from-emerald-500 to-primary bg-clip-text text-transparent">
                    {postureRating.good}%
                  </div>
                  <div className="mb-2">
                    <span className="text-emerald-500 text-sm font-semibold">GOOD</span>
                  </div>
                </div>
                <div className="h-3 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-primary transition-all duration-500"
                    style={{ width: `${postureRating.good}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  {postureRating.good >= 70
                    ? "Excellent posture! Keep it up."
                    : postureRating.good >= 50
                    ? "Good posture, minor adjustments needed."
                    : "Poor posture detected. Please adjust your position."}
                </p>
              </div>
            </div>
          </div>

          {/* Right column - Metrics */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold mb-2">Live Metrics</h2>

            {/* Metrics cards */}
            <div className="space-y-3">
              <MetricCard label="Neck Angle" value={metrics.neckAngle} unit="°" active={isSessionActive} />
              <MetricCard label="Trunk Angle" value={metrics.trunkAngle} unit="°" active={isSessionActive} />
              <MetricCard label="Raw Neck Angle" value={metrics.rawNeckAngle} unit="°" active={isSessionActive} />
              <MetricCard
                label="Smoothed Neck Angle"
                value={metrics.smoothedNeckAngle}
                unit="°"
                active={isSessionActive}
              />
              <MetricCard label="Raw Trunk Angle" value={metrics.rawTrunkAngle} unit="°" active={isSessionActive} />
              <MetricCard
                label="Smoothed Trunk Angle"
                value={metrics.smoothedTrunkAngle}
                unit="°"
                active={isSessionActive}
              />
              <MetricCard label="Knee Angle" value={metrics.kneeAngle} unit="°" active={isSessionActive} />
              <MetricCard label="Elbow Angle" value={metrics.elbowAngle} unit="°" active={isSessionActive} />
              <MetricCard label="Pelvic Tilt" value={metrics.pelvicTilt} unit="°" active={isSessionActive} />
            </div>
          </div>
        </div>

        {/* Tips Section */}
        <div className="glass rounded-2xl p-6 float-card mb-8">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <span className="text-primary">💡</span>
            Posture Tips
          </h3>
          <div className="overflow-x-auto scrollbar-hide">
            <div className="flex gap-4 pb-2">
              {tips.map((tip, index) => (
                <div
                  key={index}
                  className={`glass-strong rounded-xl p-4 min-w-[300px] transition-all duration-500 ${
                    index === currentTipIndex
                      ? "border-2 border-primary shadow-lg scale-105"
                      : "border border-transparent"
                  }`}
                >
                  <p className="text-sm text-foreground/80">{tip}</p>
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

// Metric Card Component
function MetricCard({
  label,
  value,
  unit,
  active,
}: {
  label: string;
  value: number;
  unit: string;
  active: boolean;
}) {
  return (
    <div className="glass rounded-xl p-4 hover:shadow-lg transition-all">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-muted-foreground font-medium">{label}</span>
        {active && <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />}
      </div>
      <div className="flex items-baseline gap-1">
        <span className={`text-2xl font-bold ${active ? "text-primary" : "text-foreground"}`}>
          {value.toFixed(1)}
        </span>
        <span className="text-sm text-muted-foreground">{unit}</span>
      </div>
    </div>
  );
}
