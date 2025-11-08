import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center px-6 pt-32 pb-20">
      {/* Animated gradient background */}
      <div className="absolute inset-0 -z-10 animate-gradient bg-gradient-to-br from-primary-light/30 via-background to-background bg-[length:200%_200%]" />
      <div className="absolute inset-0 -z-10 animate-gradient-slow bg-[radial-gradient(circle_at_30%_20%,hsl(var(--primary-light)),transparent_50%)] bg-[length:150%_150%]" />
      
      <div className="max-w-5xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 glass rounded-full px-4 py-2 mb-8 animate-fade-in">
          <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
          <span className="text-sm font-medium">AI-Powered Health Monitoring</span>
        </div>
        
        <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight animate-fade-in">
          #1 AI Posture and RSI Coach{" "}
          <span className="bg-gradient-to-r from-primary via-accent to-primary-dark bg-clip-text text-transparent">
            for Desk Workers
          </span>
        </h1>
        
        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 animate-fade-in">
          Analyze your sitting posture and wrist health in real-time with AI. 
          Built for developers, students, and professionals.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in">
          <Button 
            asChild 
            size="lg"
            className="rounded-full bg-primary hover:bg-primary-dark text-primary-foreground font-semibold text-lg px-8 py-6 shadow-lg hover:shadow-xl transition-all hover:scale-105"
          >
            <Link to="/auth">
              Try it now
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
          <Button 
            asChild 
            size="lg"
            variant="outline"
            className="rounded-full glass border-2 font-semibold text-lg px-8 py-6 hover:bg-primary/10 transition-all"
          >
            <Link to="#features">
              Learn more
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
