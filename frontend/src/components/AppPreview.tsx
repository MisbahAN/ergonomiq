import CardSwap, { Card } from "./CardSwap";
import dashboardPreview from "@/assets/dashboard-preview.jpg";
import postureMonitorPreview from "@/assets/posture-monitor-preview.jpg";
import rsiTrackerPreview from "@/assets/rsi-tracker-preview.jpg";
import { CheckCircle2 } from "lucide-react";

const highlights = [
  {
    title: "Neck + head analytics",
    description: "Calibrate once to unlock neck-drop %, head roll deltas, and shoulder symmetry cards.",
  },
  {
    title: "Eye strain radar",
    description: "EAR, blinks/min, and break timers visualize how your eyes are coping during deep work.",
  },
  {
    title: "RSI wristband pathway",
    description: "Prototype BioAmp EXG Pill feed for typists today, consumer wristband integration next.",
  },
  {
    title: "Local deployment",
    description: "Ship the same CV logic used by our Python script directly in the browser — no backend servers.",
  },
];

export function AppPreview() {
  return (
    <section className="py-32 px-6 relative overflow-hidden">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col lg:flex-row items-center lg:items-start gap-12">
          <div className="w-full lg:w-5/12 text-left">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              See it in{" "}
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                action
              </span>
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Get real-time insights into your posture, wrist health, and ergonomic habits with our intuitive dashboard and monitoring tools.
            </p>
            <div className="space-y-6">
              {highlights.map((item) => (
                <div key={item.title} className="flex items-start gap-4">
                  <div className="mt-1">
                    <CheckCircle2 className="h-5 w-5 text-[#ff5dae]" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-gray-100">{item.title}</p>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="w-full lg:w-7/12">
            <div style={{ height: "600px", position: "relative" }}>
              <CardSwap
                cardDistance={60}
                verticalDistance={70}
                delay={5000}
                pauseOnHover={false}
                width={600}
                height={450}
              >
                <Card>
                  <img src={dashboardPreview} alt="Analytics Dashboard" />
                </Card>
                <Card>
                  <img src={postureMonitorPreview} alt="Posture Monitor" />
                </Card>
                <Card>
                  <img src={rsiTrackerPreview} alt="RSI Tracker" />
                </Card>
              </CardSwap>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
