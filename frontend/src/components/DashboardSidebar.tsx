import { useNavigate } from "react-router-dom";
import { Activity, BarChart3, Shield, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";

export function DashboardSidebar() {
  const navigate = useNavigate();

  return (
    <div className="w-56 bg-[#0a0a0a] border-r border-[#1a1a1a] flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-[#1a1a1a]">
        <div className="flex items-center gap-2 mb-1">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <span className="text-lg font-bold text-primary-foreground font-['Space_Mono']">E</span>
          </div>
          <span className="text-sm font-bold font-['Space_Mono'] tracking-wider">ERGONOMIQ</span>
        </div>
        <p className="text-[10px] text-muted-foreground font-['Space_Mono'] tracking-wide">DESK HEALTH OS</p>
      </div>

      {/* Navigation */}
      <div className="flex-1 p-4">
        <div className="mb-4">
          <p className="text-[10px] text-primary font-['Space_Mono'] tracking-wider mb-2 px-2">● TOOLS</p>
          <div className="space-y-1">
            <Button
              variant="ghost"
              className="w-full justify-start h-9 px-3 bg-[#1a1a1a] hover:bg-[#252525] font-['Space_Mono'] text-xs"
              onClick={() => navigate('/dashboard')}
            >
              <BarChart3 className="mr-2 h-4 w-4" />
              OVERVIEW
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start h-9 px-3 hover:bg-[#1a1a1a] font-['Space_Mono'] text-xs"
              onClick={() => navigate('/posture')}
            >
              <Activity className="mr-2 h-4 w-4" />
              POSTURE MONITOR
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start h-9 px-3 hover:bg-[#1a1a1a] font-['Space_Mono'] text-xs"
            >
              <Shield className="mr-2 h-4 w-4" />
              ANALYTICS
            </Button>
          </div>
        </div>

        <div className="pt-4 border-t border-[#1a1a1a]">
          <Button
            variant="ghost"
            className="w-full justify-start h-9 px-3 hover:bg-[#1a1a1a] font-['Space_Mono'] text-xs text-muted-foreground"
          >
            <Settings className="mr-2 h-4 w-4" />
            SETTINGS
          </Button>
        </div>
      </div>
    </div>
  );
}
