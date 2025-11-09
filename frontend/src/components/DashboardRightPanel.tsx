import { Button } from "@/components/ui/button";

export function DashboardRightPanel() {
  const currentDate = new Date();
  const dayName = currentDate.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase();
  const fullDate = currentDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).toUpperCase();
  const time = currentDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

  return (
    <div className="w-80 bg-[#0a0a0a] border-l border-[#1a1a1a] flex flex-col">
      {/* Time & Location */}
      <div className="p-6 border-b border-[#1a1a1a]">
        <p className="text-[10px] text-muted-foreground font-['Space_Mono'] tracking-wide mb-2">{dayName}</p>
        <p className="text-xs text-muted-foreground font-['Space_Mono'] mb-1">{fullDate}</p>
        <h2 className="text-4xl font-bold font-['Space_Mono'] mb-4">{time}</h2>
        <div className="flex items-center justify-between text-[10px] font-['Space_Mono'] text-muted-foreground">
          <span>18°C</span>
          <span>YOUR LOCATION</span>
          <span>UTC-5</span>
        </div>
      </div>

      {/* Notifications */}
      <div className="flex-1 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-primary text-xl">●</span>
            <span className="text-xs font-['Space_Mono'] font-bold">2 NOTIFICATIONS</span>
          </div>
          <Button variant="ghost" className="text-[10px] font-['Space_Mono'] h-6 px-2">
            CLEAR ALL
          </Button>
        </div>

        <div className="space-y-3">
          <div className="bg-[#0d1117] border border-[#1a1a1a] rounded-lg p-4">
            <div className="flex items-start gap-2 mb-2">
              <span className="text-emerald-500 text-xs">●</span>
              <div className="flex-1">
                <p className="text-xs font-['Space_Mono'] font-bold mb-1">POSTURE IMPROVED</p>
                <p className="text-[10px] text-muted-foreground leading-relaxed">
                  Your posture score has increased by 5% today. Great job!
                </p>
                <p className="text-[9px] text-muted-foreground mt-2">2 HOURS AGO</p>
              </div>
            </div>
          </div>

          <div className="bg-[#0d1117] border border-[#1a1a1a] rounded-lg p-4">
            <div className="flex items-start gap-2 mb-2">
              <span className="text-blue-500 text-xs">●</span>
              <div className="flex-1">
                <p className="text-xs font-['Space_Mono'] font-bold mb-1">BREAK REMINDER</p>
                <p className="text-[10px] text-muted-foreground leading-relaxed">
                  Time to take a 20-20-20 break. Your blink rate dipped below the healthy range.
                </p>
                <p className="text-[9px] text-muted-foreground mt-2">4 HOURS AGO</p>
              </div>
            </div>
          </div>
        </div>

        <Button className="w-full mt-4 bg-[#1a1a1a] hover:bg-[#252525] font-['Space_Mono'] text-xs">
          SHOW ALL (4)
        </Button>
      </div>
    </div>
  );
}
