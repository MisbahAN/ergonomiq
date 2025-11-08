// Pose landmark indices from MediaPipe
export const POSE_LANDMARKS = {
  NOSE: 0,
  LEFT_EYE_INNER: 1,
  LEFT_EYE: 2,
  LEFT_EYE_OUTER: 3,
  RIGHT_EYE_INNER: 4,
  RIGHT_EYE: 5,
  RIGHT_EYE_OUTER: 6,
  LEFT_EAR: 7,
  RIGHT_EAR: 8,
  MOUTH_LEFT: 9,
  MOUTH_RIGHT: 10,
  LEFT_SHOULDER: 11,
  RIGHT_SHOULDER: 12,
  LEFT_ELBOW: 13,
  RIGHT_ELBOW: 14,
  LEFT_WRIST: 15,
  RIGHT_WRIST: 16,
  LEFT_PINKY: 17,
  RIGHT_PINKY: 18,
  LEFT_INDEX: 19,
  RIGHT_INDEX: 20,
  LEFT_THUMB: 21,
  RIGHT_THUMB: 22,
  LEFT_HIP: 23,
  RIGHT_HIP: 24,
  LEFT_KNEE: 25,
  RIGHT_KNEE: 26,
  LEFT_ANKLE: 27,
  RIGHT_ANKLE: 28,
  LEFT_HEEL: 29,
  RIGHT_HEEL: 30,
  LEFT_FOOT_INDEX: 31,
  RIGHT_FOOT_INDEX: 32,
} as const;

export type PoseLandmarkIndex = typeof POSE_LANDMARKS[keyof typeof POSE_LANDMARKS];

export interface PoseLandmark {
  x: number;
  y: number;
  z: number;
  visibility?: number;
  presence?: number;
}

export interface PoseLandmarks {
  landmarks: PoseLandmark[];
  worldLandmarks?: PoseLandmark[];
}

export type PostureStatus = 'good' | 'slouching' | 'borderline';

// Extended types for comprehensive posture analysis
export type Landmark = { x: number; y: number; z?: number; visibility?: number };
export type PoseFrame = { t: number; landmarks: Landmark[]; quality: { blur?: number; backlight?: number } };

export type MetricValue = { 
  value: number; 
  sigma: number; 
  level: "green"|"yellow"|"red"|"na"; 
  visible: boolean;
  confidence?: number;
};

// Removed BoolMetric as feet support metric is no longer tracked

export type SittingMetrics = {
  cvaDeg: MetricValue;                    // Craniovertebral Angle
  trunkDeg: MetricValue;                  // Thoracic Flexion / Trunk Angle
  pelvicTiltDegDelta: MetricValue;        // Pelvic Tilt (relative to baseline)
  pelvicTiltDeg: MetricValue;             // Pelvic Tilt absolute angle
  elbowDeg: MetricValue;                  // Elbow Angle
  kneeDeg: MetricValue;                   // Knee Angle
  neckVarDegPerMin: MetricValue;          // Neck Flexion Variability
  ergoScore: MetricValue;                 // Overall Ergonomic Score
};

export interface PostureMetrics {
  headNeckAngle: number; // degrees
  trunkFlexion: number; // degrees
  shoulderWidth: number; // normalized
  confidence: number; // average visibility of key landmarks
  spineVisible: boolean; // shoulders and hips confidently visible
  sittingMetrics?: SittingMetrics; // Extended metrics
}

export interface PostureAnalysis {
  status: PostureStatus;
  metrics: PostureMetrics;
  severity: 'low' | 'medium' | 'high';
  message: string;
}

// Math utilities
export function calculateAngle(
  point1: PoseLandmark,
  point2: PoseLandmark,
  point3: PoseLandmark
): number {
  const vector1 = {
    x: point1.x - point2.x,
    y: point1.y - point2.y,
  };
  const vector2 = {
    x: point3.x - point2.x,
    y: point3.y - point2.y,
  };

  const dotProduct = vector1.x * vector2.x + vector1.y * vector2.y;
  const magnitude1 = Math.sqrt(vector1.x * vector1.x + vector1.y * vector1.y);
  const magnitude2 = Math.sqrt(vector2.x * vector2.x + vector2.y * vector2.y);

  if (magnitude1 === 0 || magnitude2 === 0) return 0;

  const cosAngle = dotProduct / (magnitude1 * magnitude2);
  const angle = Math.acos(Math.max(-1, Math.min(1, cosAngle)));
  return (angle * 180) / Math.PI;
}

export function calculateDistance(point1: PoseLandmark, point2: PoseLandmark): number {
  const dx = point1.x - point2.x;
  const dy = point1.y - point2.y;
  return Math.sqrt(dx * dx + dy * dy);
}

export function getMidpoint(point1: PoseLandmark, point2: PoseLandmark): PoseLandmark {
  return {
    x: (point1.x + point2.x) / 2,
    y: (point1.y + point2.y) / 2,
    z: (point1.z + point2.z) / 2,
    visibility: Math.min(point1.visibility || 0, point2.visibility || 0),
  };
}

export function isLandmarkVisible(landmark: PoseLandmark, threshold: number = 0.3): boolean {
  return (landmark.visibility || 0) >= threshold;
}

// Posture analysis functions
export function analyzePosture(landmarks: PoseLandmark[]): PostureAnalysis {
  const leftShoulder = landmarks[POSE_LANDMARKS.LEFT_SHOULDER];
  const rightShoulder = landmarks[POSE_LANDMARKS.RIGHT_SHOULDER];
  const leftHip = landmarks[POSE_LANDMARKS.LEFT_HIP];
  const rightHip = landmarks[POSE_LANDMARKS.RIGHT_HIP];
  const nose = landmarks[POSE_LANDMARKS.NOSE];
  const leftEar = landmarks[POSE_LANDMARKS.LEFT_EAR];
  const rightEar = landmarks[POSE_LANDMARKS.RIGHT_EAR];

  // Check if key landmarks are visible
  const keyLandmarks = [leftShoulder, rightShoulder, leftHip, rightHip, nose];
  const visibleLandmarks = keyLandmarks.filter(landmark => 
    isLandmarkVisible(landmark, 0.3)
  );
  const confidence = visibleLandmarks.length / keyLandmarks.length;

  if (confidence < 0.6) {
    return {
      status: 'borderline',
      metrics: {
        headNeckAngle: 0,
        trunkFlexion: 0,
        shoulderWidth: 0,
        confidence,
        spineVisible: false,
      },
      severity: 'low',
      message: 'Insufficient pose visibility for analysis',
    };
  }

  // Calculate shoulder width for normalization
  const shoulderWidth = calculateDistance(leftShoulder, rightShoulder);
  
  // Calculate shoulder and hip midpoints
  const shoulderMidpoint = getMidpoint(leftShoulder, rightShoulder);
  const hipMidpoint = getMidpoint(leftHip, rightHip);
  const spineMidpoint = getMidpoint(shoulderMidpoint, hipMidpoint);
  
  // Create vertical reference points (canvas/mediapipe y increases downward)
  const verticalUp = { ...shoulderMidpoint, y: shoulderMidpoint.y - 1 };
  
  // Determine visibility of spine landmarks
  const leftShoulderVisible = isLandmarkVisible(leftShoulder, 0.3);
  const rightShoulderVisible = isLandmarkVisible(rightShoulder, 0.3);
  const leftHipVisible = isLandmarkVisible(leftHip, 0.3);
  const rightHipVisible = isLandmarkVisible(rightHip, 0.3);
  const spineVisible = leftShoulderVisible && rightShoulderVisible && leftHipVisible && rightHipVisible;

  // Calculate trunk flexion using spine midpoint for stability
  // Angle between vertical DOWN at spine center and the line to hip midpoint
  const trunkFlexion = spineVisible
    ? calculateAngle({ ...spineMidpoint, y: spineMidpoint.y + 1 }, spineMidpoint, hipMidpoint)
    : 0;
  
  // Calculate head-neck angle
  // Use ear midpoint for head position, or nose if ears not visible
  const headCenter = isLandmarkVisible(leftEar, 0.3) && isLandmarkVisible(rightEar, 0.3) 
    ? getMidpoint(leftEar, rightEar)
    : nose;
  
  const headNeckAngle = calculateAngle(verticalUp, shoulderMidpoint, headCenter);

  const metrics: PostureMetrics = {
    headNeckAngle,
    trunkFlexion,
    shoulderWidth,
    confidence,
    spineVisible,
  };

  // Classification logic
  let status: PostureStatus;
  let severity: 'low' | 'medium' | 'high';
  let message: string;

  if (!spineVisible) {
    status = 'borderline';
    severity = 'low';
    message = 'Spine not in view';
  } else if (trunkFlexion <= 15) {
    status = 'good';
    severity = 'low';
    message = 'Good posture!';
  } else if (trunkFlexion > 25) {
    status = 'slouching';
    severity = trunkFlexion > 35 ? 'high' : 'medium';
    message = `Slouching detected (${trunkFlexion.toFixed(1)}° trunk flexion)`;
  } else {
    status = 'borderline';
    severity = 'low';
    message = 'Posture needs improvement';
  }

  return {
    status,
    metrics,
    severity,
    message,
  };
}

// Classification helper
export function classify(value: number, bands: { 
  green: readonly [number, number]; 
  yellow: readonly [number, number]; 
  red: readonly [number, number] 
}): "green"|"yellow"|"red" {
  if (value >= bands.green[0] && value <= bands.green[1]) return "green";
  if (value >= bands.yellow[0] && value <= bands.yellow[1]) return "yellow";
  return "red";
}

// Specialized classification for complex ranges
export function classifyElbow(value: number): "green"|"yellow"|"red" {
  if (value >= 90 && value <= 110) return "green";
  if ((value >= 75 && value < 90) || (value > 110 && value <= 125)) return "yellow";
  return "red";
}

export function classifyKnee(value: number): "green"|"yellow"|"red" {
  if (value >= 80 && value <= 110) return "green";
  if ((value >= 70 && value < 80) || (value > 110 && value <= 120)) return "yellow";
  return "red";
}

export function classifyPelvicTilt(value: number): "green"|"yellow"|"red" {
  const absValue = Math.abs(value);
  if (absValue <= 10) return "green";
  if (absValue <= 20) return "yellow";
  return "red";
}

// Threshold definitions for all metrics
export const METRIC_THRESHOLDS = {
  cvaDeg: { green: [50, 180], yellow: [40, 50], red: [0, 40] },
  trunkDeg: { green: [0, 20], yellow: [20, 30], red: [30, 180] },
  pelvicTiltDegDelta: { green: [-10, 10], yellow: [-20, -10], red: [-180, -20] }, // Note: yellow range needs adjustment
  elbowDeg: { green: [90, 110], yellow: [75, 90], red: [0, 75] }, // Note: needs separate ranges
  kneeDeg: { green: [80, 110], yellow: [70, 80], red: [0, 70] }, // Note: needs separate ranges
  neckVarDegPerMin: { green: [0, 6], yellow: [6, 10], red: [10, 180] },
} as const;

// One-Euro filter for smoothing
export class OneEuroFilter {
  private minCutoff: number;
  private beta: number;
  private dcutoff: number;
  private x: LowPassFilter;
  private dx: LowPassFilter;
  private lastTime: number;

  constructor(freq: number = 30, minCutoff: number = 1.0, beta: number = 0.007, dcutoff: number = 1.0) {
    this.minCutoff = minCutoff;
    this.beta = beta;
    this.dcutoff = dcutoff;
    this.x = new LowPassFilter(this.alpha(this.minCutoff, freq));
    this.dx = new LowPassFilter(this.alpha(this.dcutoff, freq));
    this.lastTime = 0;
  }

  private alpha(cutoff: number, freq: number): number {
    const te = 1.0 / freq;
    const tau = 1.0 / (2 * Math.PI * cutoff);
    return 1.0 / (1.0 + tau / te);
  }

  update(x: number, timestamp?: number): number {
    const now = timestamp || performance.now();
    const dt = this.lastTime > 0 ? (now - this.lastTime) / 1000 : 1.0 / 30.0;
    this.lastTime = now;

    if (dt <= 0) return this.x.lastValue();

    const dx = this.x.hasLastValue() ? (x - this.x.lastValue()) / dt : 0;
    const edx = this.dx.update(dx);
    const cutoff = this.minCutoff + this.beta * Math.abs(edx);
    this.x.setAlpha(this.alpha(cutoff, 1.0 / dt));
    return this.x.update(x);
  }

  reset(): void {
    this.x.reset();
    this.dx.reset();
    this.lastTime = 0;
  }
}

class LowPassFilter {
  private y: number = 0;
  private alpha: number;
  private hasLast: boolean = false;

  constructor(alpha: number) {
    this.alpha = alpha;
  }

  update(x: number): number {
    if (!this.hasLast) {
      this.y = x;
      this.hasLast = true;
    } else {
      this.y = this.alpha * x + (1 - this.alpha) * this.y;
    }
    return this.y;
  }

  setAlpha(alpha: number): void {
    this.alpha = alpha;
  }

  lastValue(): number {
    return this.y;
  }

  hasLastValue(): boolean {
    return this.hasLast;
  }

  reset(): void {
    this.y = 0;
    this.hasLast = false;
  }
}

// Smoothing utilities (simple moving average)
export class SmoothingFilter {
  private buffer: number[] = [];
  private maxSize: number;

  constructor(maxSize: number = 5) {
    this.maxSize = maxSize;
  }

  update(value: number): number {
    this.buffer.push(value);
    if (this.buffer.length > this.maxSize) {
      this.buffer.shift();
    }
    return this.buffer.reduce((sum, val) => sum + val, 0) / this.buffer.length;
  }

  reset(): void {
    this.buffer = [];
  }
}

// Comprehensive seated posture analysis
export function calculateSittingMetrics(
  landmarks: PoseLandmark[], 
  baseline?: { pelvicTilt: number; shoulderWidth: number },
  neckHistory: number[] = []
): SittingMetrics {
  const leftShoulder = landmarks[POSE_LANDMARKS.LEFT_SHOULDER];
  const rightShoulder = landmarks[POSE_LANDMARKS.RIGHT_SHOULDER];
  const leftHip = landmarks[POSE_LANDMARKS.LEFT_HIP];
  const rightHip = landmarks[POSE_LANDMARKS.RIGHT_HIP];
  const leftEar = landmarks[POSE_LANDMARKS.LEFT_EAR];
  const rightEar = landmarks[POSE_LANDMARKS.RIGHT_EAR];
  const nose = landmarks[POSE_LANDMARKS.NOSE];
  const leftElbow = landmarks[POSE_LANDMARKS.LEFT_ELBOW];
  const leftWrist = landmarks[POSE_LANDMARKS.LEFT_WRIST];
  const leftKnee = landmarks[POSE_LANDMARKS.LEFT_KNEE];
  const leftAnkle = landmarks[POSE_LANDMARKS.LEFT_ANKLE];

  // Helper function to create metric value
  const createMetric = (value: number, visible: boolean, confidence: number = 1.0): MetricValue => ({
    value,
    sigma: visible ? 0.1 : 1.0, // Low uncertainty when visible
    level: visible ? classify(value, METRIC_THRESHOLDS.cvaDeg) : "na", // Will be overridden
    visible,
    confidence
  });

  // BoolMetric removed (feet support no longer used)
  const shoulderMidpoint = getMidpoint(leftShoulder, rightShoulder);
  const hipMidpoint = getMidpoint(leftHip, rightHip);

  // 1. Craniovertebral Angle (CVA)
  const cvaVisible = isLandmarkVisible(leftEar, 0.3) && isLandmarkVisible(rightEar, 0.3) && 
                     isLandmarkVisible(leftShoulder, 0.3) && isLandmarkVisible(rightShoulder, 0.3);
  const earMidpoint = cvaVisible ? getMidpoint(leftEar, rightEar) : nose;
  const cvaAngle = cvaVisible ? calculateAngle(
    { ...shoulderMidpoint, y: shoulderMidpoint.y - 1 }, // Vertical up
    shoulderMidpoint,
    earMidpoint
  ) : 0;

  // 2. Trunk Angle (already calculated)
  const trunkVisible = isLandmarkVisible(leftShoulder, 0.3) && isLandmarkVisible(rightShoulder, 0.3) &&
                       isLandmarkVisible(leftHip, 0.3) && isLandmarkVisible(rightHip, 0.3);
  const trunkAngle = trunkVisible ? calculateAngle(
    { ...shoulderMidpoint, y: shoulderMidpoint.y + 1 }, // Vertical down
    shoulderMidpoint,
    hipMidpoint
  ) : 0;

  // 4. Pelvic Tilt (relative to baseline)
  const pelvicVisible = trunkVisible;
  const currentPelvicTilt = pelvicVisible ? calculateAngle(
    { x: 0, y: 0, z: 0 }, // Horizontal reference
    leftHip,
    rightHip
  ) : 0;
  const pelvicTiltDelta = baseline ? currentPelvicTilt - baseline.pelvicTilt : 0;

  // 5. Elbow Angle
  const elbowVisible = isLandmarkVisible(leftShoulder, 0.3) && isLandmarkVisible(leftElbow, 0.3) && 
                       isLandmarkVisible(leftWrist, 0.3);
  const elbowAngle = elbowVisible ? calculateAngle(leftShoulder, leftElbow, leftWrist) : 0;

  // 6. Knee Angle
  const kneeVisible = isLandmarkVisible(leftHip, 0.3) && isLandmarkVisible(leftKnee, 0.3) && 
                      isLandmarkVisible(leftAnkle, 0.3);
  const kneeAngle = kneeVisible ? calculateAngle(leftHip, leftKnee, leftAnkle) : 0;

  // 7. Neck Variability (over last 60s)
  const neckVarVisible = neckHistory.length > 10;
  const neckVariability = neckVarVisible ? calculateStandardDeviation(neckHistory) * 60 : 0; // Convert to per-minute

  // 8. Ergonomic Score (weighted aggregation)
  const weights = { head: 0.25, trunk: 0.25, pelvis: 0.15, upperLimb: 0.2, lowerBody: 0.15 };
  const scores = {
    head: cvaVisible ? (cvaAngle >= 50 ? 1.0 : cvaAngle >= 40 ? 0.7 : 0.4) : 0,
    trunk: trunkVisible ? (trunkAngle <= 20 ? 1.0 : trunkAngle <= 30 ? 0.7 : 0.4) : 0,
    pelvis: pelvicVisible ? (Math.abs(pelvicTiltDelta) <= 10 ? 1.0 : Math.abs(pelvicTiltDelta) <= 20 ? 0.7 : 0.4) : 0,
    upperLimb: elbowVisible ? (elbowAngle >= 90 && elbowAngle <= 110 ? 1.0 : 
                               (elbowAngle >= 75 && elbowAngle <= 125) ? 0.7 : 0.4) : 0,
    lowerBody: kneeVisible ? (kneeAngle >= 80 && kneeAngle <= 110 ? 1.0 : 
                              (kneeAngle >= 70 && kneeAngle <= 120) ? 0.7 : 0.4) : 0
  };
  
  const ergoScore = (scores.head * weights.head + scores.trunk * weights.trunk + 
                     scores.pelvis * weights.pelvis + scores.upperLimb * weights.upperLimb + 
                     scores.lowerBody * weights.lowerBody) * 100;

  return {
    cvaDeg: createMetric(cvaAngle, cvaVisible),
    trunkDeg: createMetric(trunkAngle, trunkVisible),
    pelvicTiltDegDelta: createMetric(pelvicTiltDelta, pelvicVisible),
    pelvicTiltDeg: createMetric(currentPelvicTilt, pelvicVisible),
    elbowDeg: createMetric(elbowAngle, elbowVisible),
    kneeDeg: createMetric(kneeAngle, kneeVisible),
    neckVarDegPerMin: createMetric(neckVariability, neckVarVisible),
    ergoScore: createMetric(ergoScore, true, 0.8)
  };
}

// Helper function to calculate standard deviation
function calculateStandardDeviation(values: number[]): number {
  if (values.length < 2) return 0;
  const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
  const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / (values.length - 1);
  return Math.sqrt(variance);
}
