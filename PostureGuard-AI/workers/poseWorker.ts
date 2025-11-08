// Web Worker for off-main-thread pose detection
// This helps keep the main thread responsive during pose detection

import { PoseLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';

let poseLandmarker: PoseLandmarker | null = null;
let isInitialized = false;

// Initialize the pose landmarker in the worker
async function initializePoseLandmarker() {
  try {
    const vision = await FilesetResolver.forVisionTasks(
      'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.11/wasm'
    );

    poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_heavy/float16/1/pose_landmarker_heavy.task',
        delegate: 'GPU'
      },
      runningMode: 'VIDEO',
      numPoses: 1,
      minPoseDetectionConfidence: 0.5,
      minPosePresenceConfidence: 0.5,
      minTrackingConfidence: 0.5
    });

    isInitialized = true;
    
    // Notify main thread that initialization is complete
    self.postMessage({ type: 'initialized' });
  } catch (error) {
    console.error('Failed to initialize pose landmarker in worker:', error);
    self.postMessage({ 
      type: 'error', 
      error: 'Failed to initialize pose detection' 
    });
  }
}

// Handle messages from main thread
self.onmessage = async (event) => {
  const { type, data } = event.data;

  switch (type) {
    case 'init':
      await initializePoseLandmarker();
      break;

    case 'detect':
      if (!isInitialized || !poseLandmarker) {
        self.postMessage({ 
          type: 'error', 
          error: 'Pose landmarker not initialized' 
        });
        return;
      }

      try {
        // Create ImageBitmap from the image data
        const imageBitmap = await createImageBitmap(data.imageData);
        
        // Detect pose
        const result = poseLandmarker.detectForVideo(imageBitmap, data.timestamp);
        
        // Send result back to main thread
        self.postMessage({
          type: 'detectionResult',
          result: {
            landmarks: result.landmarks,
            worldLandmarks: result.worldLandmarks,
            timestamp: data.timestamp
          }
        });

        // Clean up ImageBitmap
        imageBitmap.close();
      } catch (error) {
        console.error('Pose detection error in worker:', error);
        self.postMessage({ 
          type: 'error', 
          error: 'Pose detection failed' 
        });
      }
      break;

    default:
      console.warn('Unknown message type:', type);
  }
};

// Initialize on worker load
initializePoseLandmarker();
