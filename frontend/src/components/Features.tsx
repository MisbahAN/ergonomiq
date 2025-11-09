import { useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  Hand,
  Eye,
  Lightbulb,
  RefreshCw,
  BarChart3,
  Sparkles,
} from "lucide-react";

const SCROLL_SPEED = 0.3;
const DUPLICATE_SETS = 10;

const features = [
  {
    icon: Activity,
    title: "Neck calibration + drop % alerts",
    description:
      "30-frame baseline mirrors our Python CV model, then calls out neck drop, head tilt, and uneven shoulders live.",
  },
  {
    icon: Eye,
    title: "Blink + EAR monitoring",
    description:
      "MediaPipe face mesh computes Eye Aspect Ratio, blinks/min, and 20-20-20 reminders without sending video to servers.",
  },
  {
    icon: Hand,
    title: "RSI wristband prototype",
    description:
      "BioAmp EXG Pill samples wrist muscle strain and triggers a local haptic puck today - wireless wristband coming soon.",
  },
  {
    icon: Lightbulb,
    title: "Local-first deployment",
    description:
      "Everything runs in-browser, so you can ship on Vercel with zero backend services or GPU hosting.",
  },
  {
    icon: RefreshCw,
    title: "Break automation",
    description:
      "Session timers and strain heuristics schedule micro-breaks, stretches, and hydration nudges before fatigue settles in.",
  },
  {
    icon: BarChart3,
    title: "Actionable analytics",
    description:
      "Unified dashboard surfaces posture quality, blink consistency, and (soon) RSI telemetry with trend lines.",
  },
  {
    icon: Sparkles,
    title: "Ergonomic coaching",
    description:
      "Context-aware tips translate sensor readings into human advice - monitor height, seating tweaks, lighting, and more.",
  },
];

export function Features() {
  const beltRef = useRef<HTMLDivElement | null>(null);
  const animationRef = useRef<number | null>(null);
  const beltWidthRef = useRef(0);

  const [offset, setOffset] = useState(0);
  const [isHovering, setIsHovering] = useState(false);

  const repeatedFeatures = useMemo(
    () => Array.from({ length: DUPLICATE_SETS }, () => features).flat(),
    []
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    const belt = beltRef.current;
    if (!belt) return;

    const updateWidth = () => {
      beltWidthRef.current = belt.scrollWidth / 2;
    };

    updateWidth();

    if (typeof ResizeObserver !== "undefined") {
      const observer = new ResizeObserver(updateWidth);
      observer.observe(belt);
      return () => observer.disconnect();
    }

    window.addEventListener("resize", updateWidth);
    return () => window.removeEventListener("resize", updateWidth);
  }, [repeatedFeatures]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const animate = () => {
      setOffset((prev) => {
        if (isHovering) return prev;
        let next = prev - SCROLL_SPEED;
        const limit = beltWidthRef.current;

        if (limit > 0 && next <= -limit) {
          next += limit;
        }

        return next;
      });

      animationRef.current = window.requestAnimationFrame(animate);
    };

    animationRef.current = window.requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        window.cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isHovering]);

  return (
    <section id="features" className="py-20 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Everything you need for{" "}
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              optimal desk health
            </span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Comprehensive tools to prevent workplace injuries and maintain peak productivity
          </p>
        </div>

        <div className="my-16 overflow-visible">
          <div
            className="relative"
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
          >
            <div
              ref={beltRef}
              className="flex gap-8 will-change-transform"
              style={{ transform: `translateX(${offset}px)` }}
            >
              {repeatedFeatures.map((feature, index) => (
                <div
                  key={`${feature.title}-${index}`}
                  className="w-[22rem] h-72 flex-shrink-0 rounded-[3rem] border border-white/20 dark:border-white/10 shadow-lg bg-white/80 dark:bg-[#292a2c]/80 backdrop-blur-md transition-all duration-500 hover:scale-[1.02] hover:shadow-[0_25px_60px_rgba(255,93,174,0.25)] flex flex-col items-center justify-center text-center px-10"
                >
                  <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl text-[#ff5dae]">
                    <feature.icon className="h-8 w-8" />
                  </div>
                  <h3 className="text-2xl font-semibold mb-3 text-gray-800 dark:text-gray-200">
                    {feature.title}
                  </h3>
                  <p className="text-base leading-relaxed text-gray-600 dark:text-gray-300">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
