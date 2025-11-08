'use client';

import { useState, useCallback } from 'react';
import PoseDetection from '@/components/PoseDetection';
import PostureAnalyzer from '@/components/PostureAnalyzer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface LandmarkData {
  landmarks: Array<{ x: number; y: number; z: number; visibility?: number }>;
}

export default function Home() {
  const [landmarks, setLandmarks] = useState<LandmarkData | null>(null);
  const [showInstructions, setShowInstructions] = useState(true);

  const handlePostureUpdate = useCallback(() => {
    // Analysis handled by PostureAnalyzer component
  }, []);

  const handleLandmarksUpdate = useCallback((landmarkData: LandmarkData) => {
    setLandmarks(landmarkData);
  }, []);

  return (
    <div className="space-y-10">
      {/* Hero */}
      <section className="text-center">
        <Badge variant="secondary" className="mb-3">HTN 2025 Project</Badge>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-3">Real‑Time Posture Detection</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Monitor your posture live with AI pose detection and get instant feedback to improve your sitting habits.
        </p>
        <div className="mt-6 flex items-center justify-center gap-3">
          <Button onClick={() => setShowInstructions(true)}>How it works</Button>
          <a href="#app" className="text-sm underline text-muted-foreground hover:text-foreground">Skip to app</a>
        </div>
      </section>

      {showInstructions && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center px-4">
          <div className="w-full max-w-lg rounded-lg border bg-background p-6 shadow-lg">
            <div className="mb-3">
              <h3 className="text-lg font-semibold leading-none tracking-tight">Getting Started</h3>
              <p className="text-sm text-muted-foreground">Follow these steps for best results.</p>
            </div>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>1. Allow camera access when prompted</li>
              <li>2. Sit facing the camera with your upper body visible</li>
              <li>3. Click Start Camera, then Start Detection</li>
              <li>4. Keep good lighting and avoid occlusions</li>
              <li>5. Watch your status and tips update in real time</li>
            </ul>
            <div className="flex gap-3 pt-4">
              <Button className="flex-1" onClick={() => setShowInstructions(false)}>Got it</Button>
              <Button variant="secondary" className="flex-1" onClick={() => window.location.reload()}>Refresh</Button>
            </div>
          </div>
        </div>
      )}

      {/* App Section */}
      <section id="app" className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="text-center">
              <CardTitle>Live Camera Feed</CardTitle>
              <CardDescription>Start the camera and begin detection to see your pose.</CardDescription>
            </CardHeader>
            <CardContent>
              <PoseDetection 
                onPostureUpdate={handlePostureUpdate}
                onLandmarksUpdate={handleLandmarksUpdate}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="text-center">
              <CardTitle>Posture Analysis</CardTitle>
              <CardDescription>Smoothed metrics and tips updated in real time.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="max-h-[70vh] overflow-y-auto pr-2">
                {landmarks ? (
                  <PostureAnalyzer
                    landmarks={landmarks}
                    onPostureUpdate={handlePostureUpdate}
                  />
                ) : (
                  <div className="text-center text-sm text-muted-foreground">No data yet. Start the camera to begin.</div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer info inline with layout footer */}
      <div className="text-center text-muted-foreground text-sm">
        This runs entirely in your browser. No external servers receive camera data.
      </div>
    </div>
  );
}
