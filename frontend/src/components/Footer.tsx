import { Activity } from "lucide-react";

export function Footer() {
  return (
    <footer className="py-12 px-6 border-t">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            <span className="font-bold text-lg bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Posturely
            </span>
          </div>
          
          <div className="text-center md:text-right">
            <p className="text-muted-foreground">
              Built by{" "}
              <span className="font-semibold text-primary">Team 777777</span>
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Nathacks 2025
            </p>
          </div>
        </div>
        
        <div className="mt-8 pt-8 border-t text-center text-sm text-muted-foreground">
          <p>© 2025 Posturely. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
