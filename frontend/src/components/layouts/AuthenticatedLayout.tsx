import { ReactNode, useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { DashboardNavbar } from "@/components/DashboardNavbar";

interface AuthenticatedLayoutProps {
  children: ReactNode;
}

export function AuthenticatedLayout({ children }: AuthenticatedLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Mock authentication check - in real app, check token/session
    const authStatus = localStorage.getItem("isAuthenticated");
    
    if (authStatus === "true") {
      setIsAuthenticated(true);
    } else {
      // Redirect to login if not authenticated
      navigate("/login", { state: { from: location.pathname } });
    }
    
    setIsLoading(false);
  }, [navigate, location.pathname]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="glass rounded-2xl p-8">
          <div className="animate-pulse flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-primary/30" />
            <div className="h-4 w-32 bg-primary/20 rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect via useEffect
  }

  return (
    <div className="min-h-screen animate-fade-in">
      <DashboardNavbar />
      <main>{children}</main>
      
      {/* Global Footer */}
      <footer className="border-t border-border/50 mt-12">
        <div className="max-w-7xl mx-auto px-8 py-6 text-center">
          <p className="text-xs text-muted-foreground hover:text-primary transition-colors cursor-default inline-block hover-scale">
            Posturely · Team 777777 · Hackathon 2025 · MedTech & EduTech Track
          </p>
        </div>
      </footer>
    </div>
  );
}
