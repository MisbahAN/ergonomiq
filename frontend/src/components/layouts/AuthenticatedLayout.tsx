import { ReactNode, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { DashboardNavbar } from "@/components/DashboardNavbar";
import { useAuthStore } from "@/hooks/useAuthStore";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";

interface AuthenticatedLayoutProps {
  children: ReactNode;
}

export function AuthenticatedLayout({ children }: AuthenticatedLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, login, logout } = useAuthStore();

  useEffect(() => {
    // Listen for auth state changes
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        // User is signed in
        login(user);
      } else {
        // User is signed out
        logout();
        // Redirect to login if not authenticated
        navigate("/login", { state: { from: location.pathname } });
      }
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, [navigate, location.pathname, login, logout]);

  // Show loading state while checking auth status
  if (!isAuthenticated) {
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

  return (
    <div className="relative min-h-screen animate-fade-in overflow-hidden bg-background">
      {/* Shared animated gradient background used on landing/auth pages */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 animate-gradient bg-gradient-to-br from-primary-light/15 via-background to-background bg-[length:200%_200%] dark:from-primary-dark/30 dark:via-background dark:to-background" />
        <div className="absolute inset-0 animate-gradient-slow bg-[radial-gradient(circle_at_30%_20%,hsl(var(--primary-light)),transparent_55%)] bg-[length:150%_150%] opacity-80 dark:bg-[radial-gradient(circle_at_70%_40%,hsl(var(--primary)),transparent_60%)]" />
      </div>
      <DashboardNavbar />
      <main>{children}</main>

      {/* Global Footer */}
      <footer className="border-t border-border/50 mt-12">
        <div className="max-w-7xl mx-auto px-8 py-6 text-center">
          <p className="text-xs text-muted-foreground hover:text-primary transition-colors cursor-default inline-block hover-scale">
            Posturely · Team 777777 · Nathacks 2025
          </p>
        </div>
      </footer>
    </div>
  );
}
