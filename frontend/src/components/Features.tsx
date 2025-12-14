import { useEffect, useMemo, useRef, useState } from "react";
import { Activity, Hand, Eye } from "lucide-react";

const SCROLL_SPEED = 0.3;
const DUPLICATE_SETS = 2;

const features = [
  {
    icon: Activity,
    title: "Posture analytics + monitoring",
    description:
      "Track head tilt, shoulder drift, and spine alignment live, then log every session as a posture score you can trend.",
  },
  {
    icon: Hand,
    title: "Wrist strain analytics + monitoring",
    description:
      "The Wirless Patch captures wrist angles and muscle strain in real time, flagging risky intervals with timestamps.",
  },
  {
    icon: Eye,
    title: "Eye strain analytics + monitoring",
    description:
      "Blink rate and distance cues alert you the moment you lean in or stop blinking, with history that proves progress.",
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
      beltWidthRef.current = belt.scrollWidth / DUPLICATE_SETS;
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

        <div className="my-16 overflow-hidden">
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
                  className="w-[22rem] h-72 flex-shrink-0 rounded-[3rem] border border-white/20 dark:border-white/10 shadow-lg bg-white/80 dark:bg-[#292a2c]/80 backdrop-blur-md transition-all duration-500 hover:scale-[1.02] hover:shadow-[0_25px_60px_rgba(255,93,174,0.25)] flex flex-col items-center justify-start text-center px-10 py-8 gap-4"
                >
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl text-[#ff5dae]">
                    <feature.icon className="h-8 w-8" />
                  </div>
                  <h3 className="text-2xl font-semibold text-gray-800 dark:text-gray-200">
                    {feature.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-300">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-background via-background/80 to-transparent dark:from-background dark:via-background/70"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-background via-background/80 to-transparent dark:from-background dark:via-background/70"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
