export type XYPoint = { x: number; y: number };

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
  LEFT_HIP: 23,
  RIGHT_HIP: 24,
} as const;

export const FACE_EYE_INDICES = {
  LEFT: [33, 160, 158, 133, 153, 144] as const,
  RIGHT: [362, 385, 387, 263, 373, 380] as const,
};

export function calculateAngle(a: XYPoint, b: XYPoint, c: XYPoint): number {
  const ba = { x: a.x - b.x, y: a.y - b.y };
  const bc = { x: c.x - b.x, y: c.y - b.y };

  const dot = ba.x * bc.x + ba.y * bc.y;
  const magBA = Math.hypot(ba.x, ba.y);
  const magBC = Math.hypot(bc.x, bc.y);
  if (magBA === 0 || magBC === 0) return 0;

  const cosine = clamp(dot / (magBA * magBC), -1, 1);
  return (Math.acos(cosine) * 180) / Math.PI;
}

export function calculateEAR(points: XYPoint[]): number {
  if (points.length !== 6) return 0;
  const vertical1 = euclidean(points[1], points[5]);
  const vertical2 = euclidean(points[2], points[4]);
  const horizontal = euclidean(points[0], points[3]);
  if (horizontal === 0) return 0;
  return (vertical1 + vertical2) / (2.0 * horizontal);
}

export function euclidean(p1: XYPoint, p2: XYPoint): number {
  return Math.hypot(p1.x - p2.x, p1.y - p2.y);
}

export function mean(values: number[]): number {
  if (!values.length) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function degreesFromSlope(deltaY: number, deltaX: number): number {
  return (Math.atan2(deltaY, deltaX) * 180) / Math.PI;
}

export function formatDuration(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60);
  return `${minutes.toString().padStart(2, "0")}:${seconds
    .toString()
    .padStart(2, "0")}`;
}
