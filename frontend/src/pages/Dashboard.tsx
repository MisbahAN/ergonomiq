import { TrendingUp } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/hooks/useAuthStore";

const weeklyData = [
  { week: '06/07', posture: 92, blinkRate: 18 },
  { week: '07/07', posture: 88, blinkRate: 16 },
  { week: '08/07', posture: 86, blinkRate: 15 },
  { week: '09/07', posture: 90, blinkRate: 17 },
  { week: '10/07', posture: 82, blinkRate: 13 },
  { week: '11/07', posture: 95, blinkRate: 19 },
  { week: '12/07', posture: 89, blinkRate: 16 },
  { week: '13/07', posture: 91, blinkRate: 18 },
];

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<'WEEK' | 'MONTH' | 'YEAR'>('WEEK');
  const { user } = useAuthStore();

  const hour = new Date().getHours();
  const timeOfDay = hour < 12 ? "morning" : hour < 18 ? "afternoon" : "evening";
  const displayName =
    user?.displayName?.split(" ")[0] ??
    user?.email?.split("@")[0] ??
    "there";

  return (
    <div className="min-h-screen pb-12">
      <div className="pt-28 px-8 max-w-7xl mx-auto">
        {/* Welcome Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            {`Good ${timeOfDay}, ${displayName}`} 👋
          </h1>
          <p className="text-muted-foreground">Your posture summary today</p>
        </div>

        {/* Scrollable Content */}
        <div className="space-y-8">
          {/* Top Metric Cards */}
          <div className="grid grid-cols-3 gap-6">
            {/* Posture Score Card */}
            <div className="glass rounded-2xl p-6 hover:shadow-lg transition-all">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-primary text-xs">●</span>
                  <h3 className="text-xs font-semibold text-foreground/70">POSTURE SCORE</h3>
                </div>
              </div>
              <div className="flex items-end gap-2 mb-2">
                <span className="text-5xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">87%</span>
                <div className="mb-2 space-y-1">
                  <TrendingUp className="h-4 w-4 text-emerald-500" />
                  <TrendingUp className="h-4 w-4 text-emerald-500" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">DAILY AVERAGE</p>
            </div>

            {/* Session Time Card */}
            <div className="glass rounded-2xl p-6 hover:shadow-lg transition-all">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-primary text-xs">●</span>
                  <h3 className="text-xs font-semibold text-foreground/70">SESSION TIME</h3>
                </div>
              </div>
              <div className="flex items-end gap-2 mb-2">
                <span className="text-5xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">2.4h</span>
                <div className="mb-2 space-y-1">
                  <svg className="h-4 w-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                  <svg className="h-4 w-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">ACTIVE TODAY</p>
            </div>

            {/* Eye Strain Risk Card */}
            <div className="glass rounded-2xl p-6 hover:shadow-lg transition-all">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-primary text-xs">●</span>
                  <h3 className="text-xs font-semibold text-foreground/70">EYE STRAIN RISK</h3>
                </div>
              </div>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-5xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">LOW</span>
                <div className="px-3 py-1 bg-primary/20 border border-primary rounded text-xs text-primary">
                  15 BLINKS/MIN ●
                </div>
              </div>
              <p className="text-xs text-muted-foreground">Blink cadence within the healthy range</p>
            </div>
          </div>

          {/* Chart Section */}
          <div className="glass rounded-2xl p-6 hover:shadow-lg transition-all">
            <div className="flex items-center justify-between mb-6">
              <div className="flex gap-2">
                <Button
                  variant={activeTab === 'WEEK' ? 'default' : 'ghost'}
                  className={`h-8 px-4 text-xs ${
                    activeTab === 'WEEK'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-transparent hover:bg-primary/10'
                  }`}
                  onClick={() => setActiveTab('WEEK')}
                >
                  WEEK
                </Button>
                <Button
                  variant={activeTab === 'MONTH' ? 'default' : 'ghost'}
                  className={`h-8 px-4 text-xs ${
                    activeTab === 'MONTH'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-transparent hover:bg-primary/10'
                  }`}
                  onClick={() => setActiveTab('MONTH')}
                >
                  MONTH
                </Button>
                <Button
                  variant={activeTab === 'YEAR' ? 'default' : 'ghost'}
                  className={`h-8 px-4 text-xs ${
                    activeTab === 'YEAR'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-transparent hover:bg-primary/10'
                  }`}
                  onClick={() => setActiveTab('YEAR')}
                >
                  YEAR
                </Button>
              </div>
              <div className="flex items-center gap-6 text-xs">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-emerald-500" />
                  <span className="text-muted-foreground">POSTURE %</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-primary" />
                  <span className="text-muted-foreground">BLINKS/MIN</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-amber-500" />
                  <span className="text-muted-foreground">BREAKS</span>
                </div>
              </div>
            </div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis 
                    dataKey="week" 
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
                    domain={[0, 120]}
                    ticks={[0, 20, 40, 60, 80, 100, 120]}
                    tickFormatter={(value) => `${value}%`}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '12px',
                      fontSize: '12px',
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="posture" 
                    stroke="#10b981" 
                    strokeWidth={3}
                    name="Posture Quality"
                    dot={false}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="blinkRate" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={3}
                    name="Blink Rate"
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Bottom Section - Weekly Improvement */}
          <div className="grid grid-cols-2 gap-6">
            <div className="glass rounded-2xl p-6 hover:shadow-lg transition-all">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-primary text-xs">●</span>
                <h3 className="text-xs font-semibold text-foreground/70">WEEKLY IMPROVEMENT</h3>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">+18%</span>
                  <span className="text-xs text-emerald-500">● IMPROVING</span>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Great progress this week! Your posture has improved significantly.
                </p>
              </div>
            </div>

            <div className="glass rounded-2xl p-6 hover:shadow-lg transition-all">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-emerald-500 text-xs">●</span>
                <h3 className="text-xs font-semibold text-foreground/70">BREAK STATUS</h3>
                <span className="ml-auto px-2 py-1 bg-emerald-500/20 border border-emerald-500/30 rounded text-xs text-emerald-500">
                  ON TIME
                </span>
              </div>
              <div className="space-y-2">
                <div className="text-3xl font-bold text-emerald-500">8/10</div>
                <p className="text-xs text-muted-foreground">BREAKS TAKEN TODAY</p>
              </div>
            </div>
          </div>

          {/* Footer - moved to AuthenticatedLayout */}
        </div>
      </div>
    </div>
  );
}
