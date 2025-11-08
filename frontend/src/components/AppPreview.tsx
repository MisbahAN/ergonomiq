import CardSwap, { Card } from './CardSwap';
import dashboardPreview from '@/assets/dashboard-preview.jpg';
import postureMonitorPreview from '@/assets/posture-monitor-preview.jpg';
import rsiTrackerPreview from '@/assets/rsi-tracker-preview.jpg';

export function AppPreview() {
  return (
    <section className="py-32 px-6 relative overflow-hidden">
      <div className="max-w-6xl mx-auto">
        <div className="text-left max-w-xl">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            See it in{" "}
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              action
            </span>
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            Get real-time insights into your posture, wrist health, and ergonomic habits with our intuitive dashboard and monitoring tools.
          </p>
        </div>
        
        <div style={{ height: '600px', position: 'relative' }}>
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
    </section>
  );
}
