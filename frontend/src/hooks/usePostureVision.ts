import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  FaceLandmarker,
  FaceLandmarkerResult,
  FilesetResolver,
  PoseLandmarker,
  PoseLandmarkerResult,
} from "@mediapipe/tasks-vision";
import {
  FACE_EYE_INDICES,
  POSE_LANDMARKS,
  XYPoint,
  calculateAngle,
  calculateEAR,
  clamp,
  degreesFromSlope,
  formatDuration,
  mean,
} from "@/utils/postureMath";

export type PostureLevel = "info" | "ok" | "alert";

export interface NeckPostureMetrics {
  calibrated: boolean;
  calibrationProgress: number;
  status: string;
  level: PostureLevel;
  neckDropPercent: number;
  shoulderTiltDeg: number;
  headTiltDeg: number;
  alerts: string[];
}

export interface EyeStrainMetrics {
  ear: number | null;
  blinkCountCurrentMinute: number;
  totalBlinks: number;
  recentBlinkAverage: number;
  warnings: string[];
  sessionSeconds: number;
}

export interface VisionSessionState {
  active: boolean;
  durationSeconds: number;
  formattedDuration: string;
}

const CALIBRATION_FRAMES = 30;
const EAR_THRESHOLD = 0.23;
const STRAIN_TIME_THRESHOLD = 20 * 60;
const UPDATE_THROTTLE_MS = 250;
const NECK_DROP_LIMIT = 0.1;
const SIDE_TILT_THRESHOLD = 5;
const HEAD_TILT_THRESHOLD = 8;

type Baseline = {
  shoulderAngle: number;
  neckAngle: number;
  shoulderTilt: number;
  headRoll: number;
  neckHeight: number;
};

type CalibrationState = {
  frames: number;
  shoulderAngles: number[];
  neckAngles: number[];
  shoulderTilts: number[];
  headRolls: number[];
  baseline: Baseline | null;
};

type EyeProcessingState = {
  blinkHistory: number[];
  currentMinuteIndex: number;
  blinkCountThisMinute: number;
  closureEvents: number;
  lastBlinkTimestamp: number;
};

type FaceLandmarksPoints = FaceLandmarkerResult["faceLandmarks"] extends Array<
  infer T
>
  ? T
  : null;

const initialPosture: NeckPostureMetrics = {
  calibrated: false,
  calibrationProgress: 0,
  status: "Sit upright to calibrate",
  level: "info",
  neckDropPercent: 0,
  shoulderTiltDeg: 0,
  headTiltDeg: 0,
  alerts: ["Align shoulders and ears in frame"],
};

const initialEye: EyeStrainMetrics = {
  ear: null,
  blinkCountCurrentMinute: 0,
  totalBlinks: 0,
  recentBlinkAverage: 0,
  warnings: [],
  sessionSeconds: 0,
};

const createCalibrationState = (): CalibrationState => ({
  frames: 0,
  shoulderAngles: [],
  neckAngles: [],
  shoulderTilts: [],
  headRolls: [],
  baseline: null,
});

const createEyeProcessingState = (): EyeProcessingState => ({
  blinkHistory: [],
  currentMinuteIndex: 1,
  blinkCountThisMinute: 0,
  closureEvents: 0,
  lastBlinkTimestamp: 0,
});

export function usePostureVision() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const poseLandmarkerRef = useRef<PoseLandmarker | null>(null);
  const faceLandmarkerRef = useRef<FaceLandmarker | null>(null);
  const animationRef = useRef<number | null>(null);

  const calibrationRef = useRef<CalibrationState>(createCalibrationState());
  const postureMetricsRef = useRef<NeckPostureMetrics>(initialPosture);
  const eyeMetricsRef = useRef<EyeStrainMetrics>(initialEye);
  const eyeProcessingRef = useRef<EyeProcessingState>(
    createEyeProcessingState()
  );
  const sessionStartRef = useRef<number | null>(null);
  const sessionActiveRef = useRef(false);
  const lastEmitRef = useRef(0);

  const [postureMetrics, setPostureMetrics] = useState(initialPosture);
  const [eyeMetrics, setEyeMetrics] = useState(initialEye);
  const [sessionState, setSessionState] = useState<VisionSessionState>({
    active: false,
    durationSeconds: 0,
    formattedDuration: "00:00",
  });
  const [isModelLoading, setIsModelLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const emitMetrics = useCallback(() => {
    const now = performance.now();
    if (now - lastEmitRef.current < UPDATE_THROTTLE_MS) return;

    setPostureMetrics({ ...postureMetricsRef.current });
    setEyeMetrics({ ...eyeMetricsRef.current });
    lastEmitRef.current = now;
  }, []);

  const resetStates = useCallback(() => {
    calibrationRef.current = createCalibrationState();
    postureMetricsRef.current = initialPosture;
    eyeMetricsRef.current = initialEye;
    eyeProcessingRef.current = createEyeProcessingState();
    lastEmitRef.current = 0;
    setPostureMetrics(initialPosture);
    setEyeMetrics(initialEye);
  }, []);

  const updateSessionDuration = useCallback(() => {
    if (!sessionActiveRef.current || !sessionStartRef.current) {
      setSessionState({
        active: false,
        durationSeconds: 0,
        formattedDuration: "00:00",
      });
      return;
    }
    const seconds = Math.floor((Date.now() - sessionStartRef.current) / 1000);
    setSessionState({
      active: true,
      durationSeconds: seconds,
      formattedDuration: formatDuration(seconds),
    });
  }, []);

  useEffect(() => {
    if (!sessionActiveRef.current) return;
    const id = window.setInterval(updateSessionDuration, 1000);
    return () => window.clearInterval(id);
  }, [updateSessionDuration, sessionState.active]);

  const loadModels = useCallback(async () => {
    if (poseLandmarkerRef.current && faceLandmarkerRef.current) return;
    setIsModelLoading(true);

    const vision = await FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.11/wasm"
    );

    poseLandmarkerRef.current = await PoseLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath:
          "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_heavy/float16/1/pose_landmarker_heavy.task",
        delegate: "GPU",
      },
      runningMode: "VIDEO",
      minPoseDetectionConfidence: 0.5,
      minPosePresenceConfidence: 0.5,
      minTrackingConfidence: 0.5,
      numPoses: 1,
    });

    faceLandmarkerRef.current = await FaceLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath:
          "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
        delegate: "GPU",
      },
      runningMode: "VIDEO",
      minFaceDetectionConfidence: 0.5,
      minFacePresenceConfidence: 0.5,
      minTrackingConfidence: 0.5,
      numFaces: 1,
      outputFaceBlendshapes: false,
      outputFacialTransformationMatrixes: false,
    });

    setIsModelLoading(false);
  }, []);

  const stopDetectionLoop = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
  }, []);

  const stopSession = useCallback(() => {
    sessionActiveRef.current = false;
    stopDetectionLoop();

    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }

    sessionStartRef.current = null;
    updateSessionDuration();
    resetStates();
  }, [resetStates, stopDetectionLoop, updateSessionDuration]);

  const drawPose = useCallback(
    (result: PoseLandmarkerResult, facePoints: FaceLandmarksPoints) => {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      if (!canvas || !video) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const width = (canvas.width = video.videoWidth);
      const height = (canvas.height = video.videoHeight);

      ctx.clearRect(0, 0, width, height);
      ctx.save();
      ctx.scale(-1, 1);
      ctx.translate(-width, 0);

      const connections: [number, number][] = [
        [11, 12],
        [11, 23],
        [12, 24],
        [23, 24],
        [11, 13],
        [13, 15],
        [12, 14],
        [14, 16],
      ];

      result.landmarks?.forEach((landmarkList) => {
        connections.forEach(([startIdx, endIdx]) => {
          const start = landmarkList[startIdx];
          const end = landmarkList[endIdx];
          if (
            !start ||
            !end ||
            (start.visibility ?? 0) < 0.4 ||
            (end.visibility ?? 0) < 0.4
          ) {
            return;
          }
          ctx.beginPath();
          ctx.moveTo(start.x * width, start.y * height);
          ctx.lineTo(end.x * width, end.y * height);
          ctx.strokeStyle = "#22c55e";
          ctx.lineWidth = 3;
          ctx.stroke();
        });

        const leftShoulder = landmarkList[POSE_LANDMARKS.LEFT_SHOULDER];
        const rightShoulder = landmarkList[POSE_LANDMARKS.RIGHT_SHOULDER];
        const leftEar = landmarkList[POSE_LANDMARKS.LEFT_EAR];
        const rightEar = landmarkList[POSE_LANDMARKS.RIGHT_EAR];
        const leftEye = landmarkList[POSE_LANDMARKS.LEFT_EYE];
        const rightEye = landmarkList[POSE_LANDMARKS.RIGHT_EYE];

        if (
          leftShoulder &&
          rightShoulder &&
          leftEar &&
          rightEar &&
          leftEye &&
          rightEye
        ) {
          const shoulderMid = {
            x: (leftShoulder.x + rightShoulder.x) / 2,
            y: (leftShoulder.y + rightShoulder.y) / 2,
          };
          const headMid = {
            x: (leftEye.x + rightEye.x) / 2,
            y: (leftEye.y + rightEye.y) / 2,
          };

          ctx.strokeStyle = "#2563eb";
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(shoulderMid.x * width, 0);
          ctx.lineTo(shoulderMid.x * width, height);
          ctx.stroke();

          ctx.strokeStyle = "#22c55e";
          ctx.beginPath();
          ctx.moveTo(leftShoulder.x * width, leftShoulder.y * height);
          ctx.lineTo(rightShoulder.x * width, rightShoulder.y * height);
          ctx.stroke();

          ctx.strokeStyle = "#facc15";
          ctx.beginPath();
          ctx.moveTo(shoulderMid.x * width, shoulderMid.y * height);
          ctx.lineTo(headMid.x * width, headMid.y * height);
          ctx.stroke();
        }
      });

      if (facePoints) {
        ctx.strokeStyle = "#f97316";
        ctx.fillStyle = "#fb923c";
        FACE_EYE_INDICES.LEFT.concat(FACE_EYE_INDICES.RIGHT).forEach((idx) => {
          const lm = facePoints[idx];
          if (!lm) return;
          ctx.beginPath();
          ctx.arc(lm.x * width, lm.y * height, 2.5, 0, Math.PI * 2);
          ctx.fill();
        });
      }

      ctx.restore();

      const metrics = postureMetricsRef.current;
      const eyes = eyeMetricsRef.current;
      ctx.save();
      ctx.textBaseline = "top";
      if (metrics.level === "alert") {
        ctx.fillStyle = "rgba(255,0,0,0.6)";
        ctx.fillRect(0, 0, width, 80);
        ctx.fillStyle = "#ffffff";
        ctx.font = "28px sans-serif";
        ctx.fillText("STRAIGHTEN UP!", 40, 20);
        ctx.font = "16px sans-serif";
        metrics.alerts.slice(0, 2).forEach((alert, idx) => {
          ctx.fillText(`• ${alert}`, 40, 50 + idx * 18);
        });
      } else {
        ctx.fillStyle = "rgba(0,0,0,0.45)";
        ctx.fillRect(0, 0, width, 110);
        ctx.fillStyle = "#ffffff";
        ctx.font = "20px 'Inter', sans-serif";
        ctx.fillText(metrics.status, 20, 20);
        ctx.font = "14px 'Inter', sans-serif";
        ctx.fillStyle = "#d1d5db";
        ctx.fillText(
          `Neck drop: ${metrics.neckDropPercent.toFixed(1)}%`,
          20,
          55
        );
        ctx.fillText(`Head tilt: ${metrics.headTiltDeg.toFixed(1)}°`, 20, 75);
        ctx.fillText(
          `Shoulder tilt: ${metrics.shoulderTiltDeg.toFixed(1)}°`,
          220,
          75
        );
      }

      ctx.fillStyle = "rgba(0,0,0,0.45)";
      ctx.fillRect(width - 230, 0, 230, 120 + eyes.warnings.length * 18);
      ctx.fillStyle = "#ffffff";
      ctx.font = "16px 'Inter', sans-serif";
      ctx.fillText(
        eyes.ear ? `EAR: ${eyes.ear.toFixed(2)}` : "EAR: -",
        width - 210,
        15
      );
      ctx.font = "14px 'Inter', sans-serif";
      ctx.fillStyle = "#e2e8f0";
      ctx.fillText(
        `Blinks/min: ${eyes.recentBlinkAverage.toFixed(1)}`,
        width - 210,
        40
      );
      ctx.fillText(
        `Session: ${formatDuration(eyes.sessionSeconds)}`,
        width - 210,
        60
      );

      if (eyes.warnings.length) {
        ctx.fillStyle = "#fbbf24";
        ctx.font = "13px 'Inter', sans-serif";
        eyes.warnings.forEach((warning, idx) => {
          ctx.fillText(`• ${warning}`, width - 210, 85 + idx * 18);
        });
      }

      if (!metrics.calibrated) {
        ctx.fillStyle = "rgba(0,0,0,0.4)";
        ctx.fillRect(0, height - 24, width, 24);
        ctx.fillStyle = "#0ea5e9";
        ctx.fillRect(0, height - 24, width * metrics.calibrationProgress, 24);
        ctx.fillStyle = "#fff";
        ctx.font = "14px sans-serif";
        ctx.fillText(
          `Calibrating... ${Math.round(
            metrics.calibrationProgress * 30
          )}/30 frames`,
          20,
          height - 22
        );
      }

      ctx.restore();
    },
    []
  );

  const updatePostureState = useCallback(
    (
      poseLandmarks: PoseLandmarkerResult["landmarks"][0],
      width: number,
      height: number
    ) => {
      if (!poseLandmarks) return;

      const getPoint = (
        idx: number
      ): (XYPoint & { visibility: number }) | null => {
        const lm = poseLandmarks[idx];
        if (!lm) return null;
        return {
          x: lm.x * width,
          y: lm.y * height,
          visibility: lm.visibility ?? 0,
        };
      };

      const leftShoulder = getPoint(POSE_LANDMARKS.LEFT_SHOULDER);
      const rightShoulder = getPoint(POSE_LANDMARKS.RIGHT_SHOULDER);
      const leftEar = getPoint(POSE_LANDMARKS.LEFT_EAR);
      const rightEar = getPoint(POSE_LANDMARKS.RIGHT_EAR);
      const leftEye = getPoint(POSE_LANDMARKS.LEFT_EYE);
      const rightEye = getPoint(POSE_LANDMARKS.RIGHT_EYE);

      if (
        !leftShoulder ||
        !rightShoulder ||
        !leftEar ||
        !rightEar ||
        !leftEye ||
        !rightEye
      ) {
        postureMetricsRef.current = {
          ...postureMetricsRef.current,
          status: "Need better framing",
          level: "info",
          alerts: ["Position upper body fully in frame"],
        };
        emitMetrics();
        return;
      }

      const keyVisible =
        leftShoulder.visibility > 0.4 &&
        rightShoulder.visibility > 0.4 &&
        leftEar.visibility > 0.3 &&
        rightEar.visibility > 0.3;
      if (!keyVisible) {
        postureMetricsRef.current = {
          ...postureMetricsRef.current,
          status: "Tracking lost",
          level: "info",
          alerts: ["Improve lighting or sit closer to camera"],
        };
        emitMetrics();
        return;
      }

      const shoulderAngle = calculateAngle(
        { x: leftShoulder.x, y: leftShoulder.y },
        { x: rightShoulder.x, y: rightShoulder.y },
        { x: rightShoulder.x, y: 0 }
      );
      const neckAngleLeft = calculateAngle(
        { x: leftEar.x, y: leftEar.y },
        { x: leftShoulder.x, y: leftShoulder.y },
        { x: leftShoulder.x, y: 0 }
      );
      const neckAngleRight = calculateAngle(
        { x: rightEar.x, y: rightEar.y },
        { x: rightShoulder.x, y: rightShoulder.y },
        { x: rightShoulder.x, y: 0 }
      );
      const neckAngle = (neckAngleLeft + neckAngleRight) / 2;
      const shoulderTilt = degreesFromSlope(
        rightShoulder.y - leftShoulder.y,
        rightShoulder.x - leftShoulder.x + 1e-6
      );
      const headRoll = degreesFromSlope(
        rightEye.y - leftEye.y,
        rightEye.x - leftEye.x + 1e-6
      );
      const earMidpointY = (leftEar.y + rightEar.y) / 2;
      const shoulderMidpointY = (leftShoulder.y + rightShoulder.y) / 2;
      const neckHeight = Math.abs(earMidpointY - shoulderMidpointY);

      const calibration = calibrationRef.current;
      if (!calibration.baseline && calibration.frames < CALIBRATION_FRAMES) {
        calibration.shoulderAngles.push(shoulderAngle);
        calibration.neckAngles.push(neckAngle);
        calibration.shoulderTilts.push(shoulderTilt);
        calibration.headRolls.push(headRoll);
        calibration.frames += 1;

        postureMetricsRef.current = {
          ...postureMetricsRef.current,
          calibrated: false,
          calibrationProgress: calibration.frames / CALIBRATION_FRAMES,
          status: "Calibrating upright baseline",
          level: "info",
          alerts: ["Hold steady for 3 seconds"],
        };

        if (calibration.frames === CALIBRATION_FRAMES) {
          calibration.baseline = {
            shoulderAngle: mean(calibration.shoulderAngles),
            neckAngle: mean(calibration.neckAngles),
            shoulderTilt: mean(calibration.shoulderTilts),
            headRoll: mean(calibration.headRolls),
            neckHeight,
          };
          postureMetricsRef.current = {
            ...postureMetricsRef.current,
            calibrated: true,
            status: "Good Posture",
            level: "ok",
            calibrationProgress: 1,
            alerts: ["Live monitoring enabled"],
          };
        }
        emitMetrics();
        return;
      }

      const baseline = calibration.baseline;
      if (!baseline) return;

      const neckDropRatio = baseline.neckHeight
        ? clamp(
            (baseline.neckHeight - neckHeight) / baseline.neckHeight,
            -0.5,
            0.5
          )
        : 0;
      const neckDropPercent = neckDropRatio * 100;

      const alerts: string[] = [];
      const badNeck = neckDropRatio > NECK_DROP_LIMIT;
      const badTilt =
        Math.abs(shoulderTilt - baseline.shoulderTilt) > SIDE_TILT_THRESHOLD;
      const badHead =
        Math.abs(headRoll - baseline.headRoll) > HEAD_TILT_THRESHOLD;

      if (badNeck) alerts.push("Neck leaning forward");
      if (badTilt) alerts.push("Shoulders uneven");
      if (badHead) alerts.push("Head tilt detected");

      const hasAlerts = alerts.length > 0;
      const status = hasAlerts ? "POOR POSTURE" : "Good Posture";
      const level: PostureLevel = hasAlerts ? "alert" : "ok";

      postureMetricsRef.current = {
        calibrated: true,
        calibrationProgress: 1,
        status,
        level,
        neckDropPercent: Number(neckDropPercent.toFixed(1)),
        shoulderTiltDeg: Number(
          (shoulderTilt - baseline.shoulderTilt).toFixed(1)
        ),
        headTiltDeg: Number((headRoll - baseline.headRoll).toFixed(1)),
        alerts: hasAlerts ? alerts : ["Maintain upright posture"],
      };
      emitMetrics();
    },
    [emitMetrics]
  );

  const updateEyeState = useCallback(
    (faceLandmarks: FaceLandmarksPoints, width: number, height: number) => {
      if (!sessionStartRef.current) return;
      const processing = eyeProcessingRef.current;
      const nowSeconds = Date.now() / 1000;
      let earValue: number | null = null;

      if (faceLandmarks) {
        const makeEye = (indices: readonly number[]) =>
          indices.map((idx) => ({
            x: faceLandmarks[idx].x * width,
            y: faceLandmarks[idx].y * height,
          }));
        const leftEye = makeEye(FACE_EYE_INDICES.LEFT);
        const rightEye = makeEye(FACE_EYE_INDICES.RIGHT);
        const leftEAR = calculateEAR(leftEye);
        const rightEAR = calculateEAR(rightEye);
        earValue = (leftEAR + rightEAR) / 2;

        if (earValue < EAR_THRESHOLD) {
          if (nowSeconds - processing.lastBlinkTimestamp > 0.3) {
            processing.lastBlinkTimestamp = nowSeconds;
            processing.blinkCountThisMinute += 1;
          }
          if (earValue < EAR_THRESHOLD * 0.8) {
            processing.closureEvents += 1;
          }
        }
      }

      const sessionSeconds = (Date.now() - sessionStartRef.current) / 1000;
      const minuteElapsed = Math.floor(sessionSeconds / 60);
      if (minuteElapsed >= processing.currentMinuteIndex) {
        processing.blinkHistory.push(processing.blinkCountThisMinute);
        processing.blinkCountThisMinute = 0;
        processing.currentMinuteIndex = minuteElapsed + 1;
      }

      const recent = processing.blinkHistory.slice(-3);
      const recentAvg =
        recent.length > 0
          ? recent.reduce((sum, val) => sum + val, 0) / recent.length
          : processing.blinkCountThisMinute;

      const warnings: string[] = [];
      if (recentAvg < 10 && minuteElapsed > 0) {
        warnings.push("LOW BLINK RATE");
      }
      if (sessionSeconds > STRAIN_TIME_THRESHOLD) {
        warnings.push("TAKE A BREAK");
      }
      if (processing.closureEvents > 50) {
        warnings.push("EYES STRAINED");
      }

      eyeMetricsRef.current = {
        ear: earValue,
        blinkCountCurrentMinute: processing.blinkCountThisMinute,
        totalBlinks:
          processing.blinkHistory.reduce((sum, val) => sum + val, 0) +
          processing.blinkCountThisMinute,
        recentBlinkAverage: Number(recentAvg.toFixed(1)),
        warnings,
        sessionSeconds,
      };
      emitMetrics();
    },
    [emitMetrics]
  );

  const processFrame = useCallback(
    (poseResult: PoseLandmarkerResult, faceLandmarks: FaceLandmarksPoints) => {
      const video = videoRef.current;
      if (!video || !poseResult.landmarks?.[0]) return;
      const width = video.videoWidth;
      const height = video.videoHeight;

      updatePostureState(poseResult.landmarks[0], width, height);
      updateEyeState(faceLandmarks, width, height);
    },
    [updateEyeState, updatePostureState]
  );

  const detectionLoop = useCallback(() => {
    if (!sessionActiveRef.current) return;
    const video = videoRef.current;
    const poseLandmarker = poseLandmarkerRef.current;
    if (!video || !poseLandmarker) return;

    if (video.readyState < 2) {
      animationRef.current = requestAnimationFrame(detectionLoop);
      return;
    }

    const timestamp = performance.now();
    const poseResult = poseLandmarker.detectForVideo(video, timestamp);
    const faceResult = faceLandmarkerRef.current?.detectForVideo(
      video,
      timestamp
    );

    if (poseResult) {
      const facePoints = faceResult?.faceLandmarks?.[0] ?? null;
      processFrame(poseResult, facePoints);
      drawPose(poseResult, facePoints);
    }

    animationRef.current = requestAnimationFrame(detectionLoop);
  }, [drawPose, processFrame]);

  const startSession = useCallback(async () => {
    if (sessionActiveRef.current) return;
    try {
      setError(null);
      await loadModels();

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });

      if (!videoRef.current) {
        throw new Error("Video element missing");
      }

      videoRef.current.srcObject = stream;
      await videoRef.current.play();

      sessionStartRef.current = Date.now();
      sessionActiveRef.current = true;
      updateSessionDuration();
      resetStates();

      animationRef.current = requestAnimationFrame(detectionLoop);
    } catch (err) {
      console.error(err);
      setError("Unable to start camera session. Check permissions.");
      stopSession();
    }
  }, [
    detectionLoop,
    loadModels,
    resetStates,
    stopSession,
    updateSessionDuration,
  ]);

  useEffect(() => {
    return () => {
      stopSession();
    };
  }, [stopSession]);

  const statusBadge = useMemo(() => {
    if (postureMetrics.level === "alert") {
      return { label: "POOR POSTURE", color: "text-red-500" };
    }
    if (postureMetrics.level === "ok") {
      return { label: "Good Posture", color: "text-emerald-500" };
    }
    return { label: "Calibrating", color: "text-slate-400" };
  }, [postureMetrics.level]);

  return {
    videoRef,
    canvasRef,
    startSession,
    stopSession,
    postureMetrics,
    eyeMetrics,
    sessionState,
    isModelLoading,
    error,
    statusBadge,
  };
}
