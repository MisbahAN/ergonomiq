'use client';

import { useEffect, useState, useCallback } from 'react';
import { PoseLandmarks, PostureAnalysis, analyzePosture, SmoothingFilter, calculateSittingMetrics, SittingMetrics } from '@/lib/poseUtils';

interface PostureAnalyzerProps {
  landmarks: PoseLandmarks;
  onPostureUpdate?: (analysis: PostureAnalysis) => void;
}

export default function PostureAnalyzer({ landmarks, onPostureUpdate }: PostureAnalyzerProps) {
  const [analysis, setAnalysis] = useState<PostureAnalysis | null>(null);
  const [smoothedAnalysis, setSmoothedAnalysis] = useState<PostureAnalysis | null>(null);
  const [sittingMetrics, setSittingMetrics] = useState<SittingMetrics | null>(null);
  
  // Smoothing filters for different metrics
  const [angleFilter] = useState(() => new SmoothingFilter(3));
  // Removed forward head position; no offset filter
  const [trunkFilter] = useState(() => new SmoothingFilter(3));
  const [kneeFilter] = useState(() => new SmoothingFilter(3));
  const [elbowFilter] = useState(() => new SmoothingFilter(3));
  const [pelvicFilter] = useState(() => new SmoothingFilter(3));
  const [confidenceFilter] = useState(() => new SmoothingFilter(5));

  // Analyze posture when landmarks change
  const analyzeCurrentPosture = useCallback(() => {
    const currentAnalysis = analyzePosture(landmarks.landmarks);
    setAnalysis(currentAnalysis);

    // Compute additional sitting metrics (knee, elbow, etc.)
    const rawSitting = calculateSittingMetrics(landmarks.landmarks);
    const kneeVal = rawSitting.kneeDeg.visible ? kneeFilter.update(rawSitting.kneeDeg.value) : 0;
    const elbowVal = rawSitting.elbowDeg.visible ? elbowFilter.update(rawSitting.elbowDeg.value) : 0;
    const pelvicVal = rawSitting.pelvicTiltDeg.visible ? pelvicFilter.update(rawSitting.pelvicTiltDeg.value) : 0;
    setSittingMetrics({
      ...rawSitting,
      kneeDeg: { ...rawSitting.kneeDeg, value: kneeVal },
      elbowDeg: { ...rawSitting.elbowDeg, value: elbowVal },
      pelvicTiltDeg: { ...rawSitting.pelvicTiltDeg, value: pelvicVal },
    });

    // Apply smoothing to key metrics
    const smoothedMetrics = {
      ...currentAnalysis.metrics,
      headNeckAngle: angleFilter.update(currentAnalysis.metrics.headNeckAngle),
      // forward head position removed
      trunkFlexion: currentAnalysis.metrics.spineVisible
        ? trunkFilter.update(currentAnalysis.metrics.trunkFlexion)
        : 0,
      confidence: confidenceFilter.update(currentAnalysis.metrics.confidence),
    };

    // Re-classify with smoothed metrics
    let smoothedStatus = currentAnalysis.status;
    let smoothedSeverity = currentAnalysis.severity;
    let smoothedMessage = currentAnalysis.message;

    if (!currentAnalysis.metrics.spineVisible) {
      smoothedStatus = 'borderline';
      smoothedSeverity = 'low';
      smoothedMessage = 'Spine not in view';
    } else if (smoothedMetrics.trunkFlexion <= 15) {
      smoothedStatus = 'good';
      smoothedSeverity = 'low';
      smoothedMessage = 'Good posture!';
    } else if (smoothedMetrics.trunkFlexion > 25) {
      smoothedStatus = 'slouching';
      smoothedSeverity = smoothedMetrics.trunkFlexion > 35 ? 'high' : 'medium';
      smoothedMessage = `Slouching detected (${smoothedMetrics.trunkFlexion.toFixed(1)}° trunk flexion)`;
    } else {
      smoothedStatus = 'borderline';
      smoothedSeverity = 'low';
      smoothedMessage = 'Posture needs improvement';
    }

    const smoothedAnalysis: PostureAnalysis = {
      status: smoothedStatus,
      metrics: smoothedMetrics,
      severity: smoothedSeverity,
      message: smoothedMessage,
    };

    setSmoothedAnalysis(smoothedAnalysis);
    
    if (onPostureUpdate) {
      onPostureUpdate(smoothedAnalysis);
    }
  }, [landmarks, onPostureUpdate, angleFilter, trunkFilter, kneeFilter, elbowFilter, pelvicFilter, confidenceFilter]);

  useEffect(() => {
    analyzeCurrentPosture();
  }, [analyzeCurrentPosture]);

  if (!analysis || !smoothedAnalysis) {
    return null;
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'good':
        return '✅';
      case 'slouching':
        return '⚠️';
      default:
        return '⚪';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good':
        return 'status-good';
      case 'slouching':
        return 'status-slouching';
      default:
        return 'status-borderline';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'confidence-high';
    if (confidence >= 0.6) return 'confidence-medium';
    return 'confidence-low';
  };

  const getConfidenceLabel = (confidence: number) => {
    if (confidence >= 0.8) return 'High';
    if (confidence >= 0.6) return 'Medium';
    return 'Low';
  };

  return (
    <div className="mt-6 space-y-4">
      {/* Real-time Angle Display */}
      <div className="rounded-lg p-4 border bg-card text-card-foreground">
        <h3 className="text-lg font-bold mb-3 text-center">Live Posture Angles</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {smoothedAnalysis.metrics.headNeckAngle.toFixed(1)}°
            </div>
            <div className="text-sm text-muted-foreground">Neck Angle</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {smoothedAnalysis.metrics.trunkFlexion.toFixed(1)}°
            </div>
            <div className="text-sm text-muted-foreground">Trunk Angle</div>
          </div>
        </div>
      </div>

      {/* Main Status Display */}
      <div className="rounded-lg border bg-card text-card-foreground p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold">Posture Status</h3>
          <div className={`status-badge ${getStatusColor(smoothedAnalysis.status)}`}>
            <span className="mr-2">{getStatusIcon(smoothedAnalysis.status)}</span>
            {smoothedAnalysis.status.charAt(0).toUpperCase() + smoothedAnalysis.status.slice(1).replace('-', ' ')}
          </div>
        </div>

        <p className="text-muted-foreground mb-4">{smoothedAnalysis.message}</p>

        {/* Confidence Bar */}
        <div className="mb-4">
          <div className="flex justify-between text-sm text-muted-foreground mb-2">
            <span>Tracking Quality</span>
            <span>{getConfidenceLabel(smoothedAnalysis.metrics.confidence)}</span>
          </div>
          <div className="confidence-bar">
            <div
              className={`confidence-fill ${getConfidenceColor(smoothedAnalysis.metrics.confidence)}`}
              style={{ width: `${smoothedAnalysis.metrics.confidence * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Main Posture Angles Display */}
      <div className="rounded-lg border bg-card text-card-foreground p-6 mb-6">
        <h3 className="text-xl font-bold mb-4 text-center">Posture Analysis</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Neck Angle */}
          <div className="text-center">
            <div className="mb-2">
              <h4 className="text-lg font-semibold">Neck Angle</h4>
              <p className="text-sm text-muted-foreground">Head alignment with vertical</p>
            </div>
            <div className="relative inline-block">
              <div className="text-4xl font-bold text-blue-600 mb-2">
                {smoothedAnalysis.metrics.headNeckAngle.toFixed(1)}°
              </div>
              <div className="w-32 h-2 bg-gray-200 rounded-full mx-auto">
                <div 
                  className={`h-2 rounded-full transition-all duration-300 ${
                    smoothedAnalysis.metrics.headNeckAngle <= 15 ? 'bg-green-500' :
                    smoothedAnalysis.metrics.headNeckAngle <= 25 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${Math.min(100, (smoothedAnalysis.metrics.headNeckAngle / 30) * 100)}%` }}
                />
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                {smoothedAnalysis.metrics.headNeckAngle <= 15 ? '✅ Good' : 
                 smoothedAnalysis.metrics.headNeckAngle <= 25 ? '⚠️ Moderate' : '❌ Poor'}
              </div>
            </div>
          </div>

          {/* Trunk Angle */}
          <div className="text-center">
            <div className="mb-2">
              <h4 className="text-lg font-semibold">Trunk Angle</h4>
              <p className="text-sm text-muted-foreground">Spine alignment with vertical</p>
            </div>
            <div className="relative inline-block">
              {smoothedAnalysis.metrics.spineVisible ? (
                <div className="text-4xl font-bold text-purple-600 mb-2">
                  {smoothedAnalysis.metrics.trunkFlexion.toFixed(1)}°
                </div>
              ) : (
                <div className="text-4xl font-bold text-muted-foreground mb-2">
                  Spine not in view
                </div>
              )}
              <div className="w-32 h-2 bg-gray-200 rounded-full mx-auto">
                <div 
                  className={`h-2 rounded-full transition-all duration-300 ${
                    !smoothedAnalysis.metrics.spineVisible ? 'bg-gray-400' :
                    smoothedAnalysis.metrics.trunkFlexion <= 15 ? 'bg-green-500' :
                    smoothedAnalysis.metrics.trunkFlexion <= 25 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${!smoothedAnalysis.metrics.spineVisible ? 0 : Math.min(100, (smoothedAnalysis.metrics.trunkFlexion / 40) * 100)}%` }}
                />
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                {!smoothedAnalysis.metrics.spineVisible ? '⚪ Spine not in view' :
                 smoothedAnalysis.metrics.trunkFlexion <= 15 ? '✅ Good' : 
                 smoothedAnalysis.metrics.trunkFlexion <= 25 ? '⚠️ Moderate' : '❌ Poor'}
              </div>
            </div>
          </div>
        </div>

        {/* Forward Head Position removed */}
      </div>

      {/* Detailed Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-lg border bg-card text-card-foreground p-4">
          <h4 className="font-medium mb-2">Raw Neck Angle</h4>
          <div className="text-2xl font-bold text-blue-600">
            {analysis.metrics.headNeckAngle.toFixed(1)}°
          </div>
          <div className="text-sm text-muted-foreground">
            Smoothed: {smoothedAnalysis.metrics.headNeckAngle.toFixed(1)}°
          </div>
        </div>

        <div className="rounded-lg border bg-card text-card-foreground p-4">
          <h4 className="font-medium mb-2">Raw Trunk Angle</h4>
          {analysis.metrics.spineVisible ? (
            <div className="text-2xl font-bold text-purple-600">
              {analysis.metrics.trunkFlexion.toFixed(1)}°
            </div>
          ) : (
            <div className="text-2xl font-bold text-muted-foreground">
              Spine not in view
            </div>
          )}
          <div className="text-sm text-muted-foreground">
            {smoothedAnalysis.metrics.spineVisible ? (
              <>Smoothed: {smoothedAnalysis.metrics.trunkFlexion.toFixed(1)}°</>
            ) : (
              <>Smoothed: —</>
            )}
          </div>
        </div>

        {/* Knee Angle */}
        <div className="rounded-lg border bg-card text-card-foreground p-4">
          <h4 className="font-medium mb-2">Knee Angle</h4>
          <div className="text-2xl font-bold text-teal-600">
            {sittingMetrics?.kneeDeg.visible ? `${sittingMetrics.kneeDeg.value.toFixed(1)}°` : 'N/A'}
          </div>
          <div className="text-sm text-muted-foreground">Higher within 80–110° is generally better</div>
        </div>
      </div>

      {/* Additional Upper Limb Metric */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
        <div className="rounded-lg border bg-card text-card-foreground p-4">
          <h4 className="font-medium mb-2">Elbow Angle</h4>
          <div className="text-2xl font-bold text-amber-600">
            {sittingMetrics?.elbowDeg.visible ? `${sittingMetrics.elbowDeg.value.toFixed(1)}°` : 'N/A'}
          </div>
          <div className="text-sm text-muted-foreground">Target around 90–110°</div>
        </div>
        <div className="rounded-lg border bg-card text-card-foreground p-4">
          <h4 className="font-medium mb-2">Pelvic Tilt</h4>
          <div className="text-2xl font-bold text-indigo-600">
            {sittingMetrics?.pelvicTiltDeg.visible ? `${sittingMetrics.pelvicTiltDeg.value.toFixed(1)}°` : 'N/A'}
          </div>
          <div className="text-sm text-muted-foreground">Lower absolute angle is generally better</div>
        </div>
        <div className="rounded-lg border bg-card text-card-foreground p-4">
          <h4 className="font-medium mb-2">Confidence</h4>
          <div className="text-2xl font-bold text-green-600">
            {(smoothedAnalysis.metrics.confidence * 100).toFixed(0)}%
          </div>
          <div className="text-sm text-muted-foreground">
            Tracking quality
          </div>
        </div>
      </div>

      {/* Tips and Recommendations */}
      <div className="rounded-lg border bg-card text-card-foreground p-4">
        <h4 className="font-medium mb-2">💡 Posture Tips</h4>
        <ul className="text-sm text-muted-foreground space-y-1">
          {smoothedAnalysis.status === 'good' && (
            <li>• Keep up the great posture! Remember to take breaks every 30 minutes.</li>
          )}
          {smoothedAnalysis.status === 'slouching' && (
            <>
              <li>• Sit up straight with your shoulders back and down</li>
              <li>• Adjust your chair height so your knees are at 90 degrees</li>
            </>
          )}
          
          {smoothedAnalysis.status === 'borderline' && (
            <>
              <li>• Make small adjustments to improve your posture</li>
              <li>• Focus on keeping your head aligned with your spine</li>
              <li>• Take regular breaks to stretch and move around</li>
            </>
          )}
        </ul>
      </div>
    </div>
  );
}
