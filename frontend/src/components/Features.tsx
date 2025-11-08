import { Activity, Hand, Lightbulb, BarChart3 } from "lucide-react";

const features = [
  {
    icon: Activity,
    title: "Real-time Posture Detection",
    description: "Advanced AI analyzes your sitting posture continuously, alerting you to slouching and misalignment before they cause problems.",
  },
  {
    icon: Hand,
    title: "Wrist Health Insights",
    description: "Monitor repetitive strain indicators and get personalized recommendations to prevent carpal tunnel and other RSI conditions.",
  },
  {
    icon: Lightbulb,
    title: "Personalized Ergonomic Tips",
    description: "Receive custom advice based on your unique work habits, desk setup, and movement patterns throughout the day.",
  },
  {
    icon: BarChart3,
    title: "Analytics Dashboard",
    description: "Track your progress over time with detailed metrics, trends, and insights to improve your workspace health.",
  },
];

export function Features() {
  return (
    <section id="features" className="py-20 px-6">
      <div className="max-w-6xl mx-auto">
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
        
        <div className="grid md:grid-cols-2 gap-8">
          {features.map((feature, index) => (
            <div 
              key={index}
              className="group relative p-8 rounded-3xl glass border border-border/50 float-card overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative z-10">
                <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                    <feature.icon className="h-6 w-6 text-primary-foreground" />
                  </div>
                </div>
                <h3 className="text-2xl font-semibold mb-3 text-foreground">{feature.title}</h3>
                <p className="text-base leading-relaxed text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
