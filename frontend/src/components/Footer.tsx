import { Activity } from "lucide-react";

export function Footer() {
  return (
    <footer className="py-12 px-6 border-t">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            <span className="font-bold text-lg bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Ergonomiq
            </span>
          </div>
          
          <div className="text-center md:text-right">
            <p className="text-muted-foreground">
              Built by{" "}
              <a
                className="font-semibold text-primary hover:underline"
                href="https://github.com/MisbahAN/777777"
                target="_blank"
                rel="noreferrer"
              >
                Team 777777
              </a>
            </p>
            <p className="text-sm text-muted-foreground mt-1">Nathacks 2025 · ergonomiq.dev</p>
          </div>
        </div>
        
        <div className="mt-8 pt-8 border-t text-center text-sm text-muted-foreground">
          <p>
            © 2025{" "}
            <a
              href="https://www.ergonomiq.dev"
              className="font-semibold hover:underline"
              target="_blank"
              rel="noreferrer"
            >
              Ergonomiq.dev
            </a>
            . All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
