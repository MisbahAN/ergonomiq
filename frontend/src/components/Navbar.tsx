import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "./ThemeToggle";
import { Activity } from "lucide-react";

export function Navbar() {
  return (
    <nav className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-5xl">
      <div className="glass rounded-[2rem] px-6 py-3 shadow-lg">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-bold text-xl">
            <Activity className="h-6 w-6 text-primary" />
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Ergonomiq
            </span>
          </Link>
          
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Button 
              asChild 
              className="rounded-full bg-primary hover:bg-primary-dark text-primary-foreground font-medium px-6"
            >
              <Link to="/auth">Try now</Link>
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}
