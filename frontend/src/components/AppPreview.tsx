import CardSwap, { Card } from "./CardSwap";
import { CheckCircle2 } from "lucide-react";

const highlights = [
  {
    title: "Neck + wrist signal sync",
    description:
      "See Wirless Patch strain events stacked against neck-drop and head-roll deltas in one timeline.",
  },
  {
    title: "Eye strain radar",
    description:
      "Eye aspect ratio, blink frequency, and 20-20-20 reminders visualize how your eyes cope during deep work blocks.",
  },
  {
    title: "Bad habit analytics",
    description:
      "Track the exact angles, durations, and sessions that cause pain so you can coach yourself like an athlete.",
  },
];

const previewImages = [
  {
    src: "/landing-page-images/dashboard.png",
    alt: "Ergonomiq dashboard overview",
  },
  {
    src: "/landing-page-images/posture-monitor.png",
    alt: "Posture camera calibration",
  },
  {
    src: "/landing-page-images/wrist-monitor.png",
    alt: "Wrist strain coach",
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
              Young tech workers are growing up with screens, and every bad
              position today becomes tomorrow&apos;s chronic injury. Ergonomiq
              shows you the micro-moments that wreck your spine, wrists, and
              eyes, plus the proof that you&apos;re fixing them.
            </p>
            <div className="space-y-6">
              {highlights.map((item) => (
                <div key={item.title} className="flex items-start gap-4">
                  <div className="mt-1">
                    <CheckCircle2 className="h-5 w-5 text-[#ff5dae]" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-gray-100">
                      {item.title}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {item.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-sm text-muted-foreground mt-10">
              The real question is: are you going to wait until you&apos;re in
              pain to do something about it?
            </p>
          </div>

          <div className="w-full lg:w-7/12">
            <div style={{ height: "600px", position: "relative" }}>
              <CardSwap
                cardDistance={60}
                verticalDistance={70}
                delay={1900}
                pauseOnHover={false}
                width={600}
                height={450}
              >
                {previewImages.map((image) => (
                  <Card key={image.src}>
                    <img src={image.src} alt={image.alt} loading="lazy" />
                  </Card>
                ))}
              </CardSwap>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
