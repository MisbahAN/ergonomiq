import cv2
import mediapipe as mp
import numpy as np
import time
import os
from scipy.spatial import distance

# ---------- Optional sound ----------
try:
    from playsound import playsound
except ImportError:
    playsound = None


# ---------- Helper Functions ----------

def calculate_angle(a, b, c):
    a = np.array(a)
    b = np.array(b)
    c = np.array(c)
    ba = a - b
    bc = c - b
    cosine_angle = np.dot(ba, bc) / (np.linalg.norm(ba) * np.linalg.norm(bc))
    return np.degrees(np.arccos(np.clip(cosine_angle, -1.0, 1.0)))


def eye_aspect_ratio(eye_points):
    """Calculate eye aspect ratio from 6 eye landmarks"""
    # Calculate vertical distances
    vertical1 = distance.euclidean(eye_points[1], eye_points[5])
    vertical2 = distance.euclidean(eye_points[2], eye_points[4])
    
    # Calculate horizontal distance
    horizontal = distance.euclidean(eye_points[0], eye_points[3])
    
    # Eye Aspect Ratio
    ear = (vertical1 + vertical2) / (2.0 * horizontal)
    return ear


# ---------- Initialization ----------

mp_pose = mp.solutions.pose
mp_face_mesh = mp.solutions.face_mesh
mp_drawing = mp.solutions.drawing_utils

pose = mp_pose.Pose(static_image_mode=False,
                    min_detection_confidence=0.5,
                    min_tracking_confidence=0.5)

face_mesh = mp_face_mesh.FaceMesh(
    static_image_mode=False,
    max_num_faces=1,
    min_detection_confidence=0.5,
    min_tracking_confidence=0.5)

cap = cv2.VideoCapture(0)

# Posture calibration variables
calibration_shoulder_angles = []
calibration_neck_angles = []
calibration_shoulder_tilts = []
calibration_head_rolls = []
calibration_frames = 0
is_calibrated = False
last_alert_time = 0
alert_cooldown = 5
sound_file = "alert.mp3"

# Eye strain variables
EYE_CLOSED_THRESHOLD = 0.23
STRAIN_TIME_THRESHOLD = 20 * 60  # 20 minutes
session_start_time = time.time()
last_blink_time = time.time()
blink_count = 0
current_minute = 1
blinks_per_minute = []
eye_closure_events = 0
last_eye_alert_time = 0

# MediaPipe eye landmark indices (from face mesh)
LEFT_EYE_INDICES = [33, 160, 158, 133, 153, 144]
RIGHT_EYE_INDICES = [362, 385, 387, 263, 373, 380]

print("Starting webcam... Sit upright for calibration (about 3 seconds).")


# ---------- Main Loop ----------

while cap.isOpened():
    ret, frame = cap.read()
    if not ret:
        continue

    frame = cv2.flip(frame, 1)
    rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    
    # Process pose
    pose_results = pose.process(rgb)
    
    # Process face mesh for eyes
    face_results = face_mesh.process(rgb)
    
    # ---------- EYE STRAIN DETECTION ----------
    strain_warnings = []
    avg_ear = None
    
    if face_results.multi_face_landmarks:
        for face_landmarks in face_results.multi_face_landmarks:
            # Get eye landmarks
            h, w = frame.shape[:2]
            
            left_eye = []
            for idx in LEFT_EYE_INDICES:
                landmark = face_landmarks.landmark[idx]
                left_eye.append((landmark.x * w, landmark.y * h))
            
            right_eye = []
            for idx in RIGHT_EYE_INDICES:
                landmark = face_landmarks.landmark[idx]
                right_eye.append((landmark.x * w, landmark.y * h))
            
            # Calculate EAR
            left_ear = eye_aspect_ratio(np.array(left_eye))
            right_ear = eye_aspect_ratio(np.array(right_eye))
            avg_ear = (left_ear + right_ear) / 2.0
            
            # Blink detection
            current_time = time.time()
            if avg_ear < EYE_CLOSED_THRESHOLD:
                if current_time - last_blink_time > 0.3:
                    blink_count += 1
                    last_blink_time = current_time
                
                # Count eye closure events
                if avg_ear < EYE_CLOSED_THRESHOLD * 0.8:
                    eye_closure_events += 1
            
            # Draw eye landmarks
            for point in left_eye + right_eye:
                cv2.circle(frame, (int(point[0]), int(point[1])), 1, (0, 255, 255), -1)
    
    # Calculate session time and blink rate
    session_time = time.time() - session_start_time
    minute_elapsed = int(session_time // 60)
    
    if minute_elapsed >= current_minute:
        blinks_per_minute.append(blink_count)
        current_minute = minute_elapsed + 1
        blink_count = 0
    
    # Check strain indicators
    recent_minutes = min(3, len(blinks_per_minute))
    if recent_minutes > 0:
        recent_average = sum(blinks_per_minute[-recent_minutes:]) / recent_minutes
        if recent_average < 10:
            strain_warnings.append("LOW BLINK RATE")
    
    if session_time > STRAIN_TIME_THRESHOLD:
        strain_warnings.append("TAKE A BREAK")
    
    if eye_closure_events > 50:
        strain_warnings.append("EYES STRAINED")
    
    # ---------- POSTURE DETECTION ----------
    if pose_results.pose_landmarks:
        lm = pose_results.pose_landmarks.landmark

        # Landmarks
        left_shoulder = (int(lm[mp_pose.PoseLandmark.LEFT_SHOULDER].x * frame.shape[1]),
                         int(lm[mp_pose.PoseLandmark.LEFT_SHOULDER].y * frame.shape[0]))
        right_shoulder = (int(lm[mp_pose.PoseLandmark.RIGHT_SHOULDER].x * frame.shape[1]),
                          int(lm[mp_pose.PoseLandmark.RIGHT_SHOULDER].y * frame.shape[0]))
        left_ear = (int(lm[mp_pose.PoseLandmark.LEFT_EAR].x * frame.shape[1]),
                    int(lm[mp_pose.PoseLandmark.LEFT_EAR].y * frame.shape[0]))
        right_ear = (int(lm[mp_pose.PoseLandmark.RIGHT_EAR].x * frame.shape[1]),
                     int(lm[mp_pose.PoseLandmark.RIGHT_EAR].y * frame.shape[0]))
        left_eye = (int(lm[mp_pose.PoseLandmark.LEFT_EYE].x * frame.shape[1]),
                    int(lm[mp_pose.PoseLandmark.LEFT_EYE].y * frame.shape[0]))
        right_eye = (int(lm[mp_pose.PoseLandmark.RIGHT_EYE].x * frame.shape[1]),
                     int(lm[mp_pose.PoseLandmark.RIGHT_EYE].y * frame.shape[0]))

        # Angles
        shoulder_angle = calculate_angle(left_shoulder, right_shoulder, (right_shoulder[0], 0))
        neck_angle_left = calculate_angle(left_ear, left_shoulder, (left_shoulder[0], 0))
        neck_angle_right = calculate_angle(right_ear, right_shoulder, (right_shoulder[0], 0))
        neck_angle = (neck_angle_left + neck_angle_right) / 2

        # Tilts
        shoulder_tilt = np.degrees(np.arctan(
            (right_shoulder[1] - left_shoulder[1]) /
            (right_shoulder[0] - left_shoulder[0] + 1e-6)
        ))
        head_roll = np.degrees(np.arctan(
            (right_eye[1] - left_eye[1]) /
            (right_eye[0] - left_eye[0] + 1e-6)
        ))

        # ---------- Calibration ----------
        if not is_calibrated and calibration_frames < 30:
            calibration_shoulder_angles.append(shoulder_angle)
            calibration_neck_angles.append(neck_angle)
            calibration_shoulder_tilts.append(shoulder_tilt)
            calibration_head_rolls.append(head_roll)
            calibration_frames += 1

            progress = int((calibration_frames / 30) * frame.shape[1])
            cv2.rectangle(frame, (0, frame.shape[0] - 20),
                          (progress, frame.shape[0]), (0, 255, 255), -1)
            cv2.putText(frame, f"Calibrating {calibration_frames}/30",
                        (20, 60), cv2.FONT_HERSHEY_SIMPLEX, 1.1,
                        (0, 255, 255), 3)
        elif not is_calibrated:
            shoulder_baseline = np.mean(calibration_shoulder_angles)
            neck_baseline = np.mean(calibration_neck_angles)
            tilt_baseline = np.mean(calibration_shoulder_tilts)
            head_baseline = np.mean(calibration_head_rolls)

            baseline_ear_y = (left_ear[1] + right_ear[1]) / 2
            baseline_shoulder_y = (left_shoulder[1] + right_shoulder[1]) / 2
            baseline_neck_height = abs(baseline_ear_y - baseline_shoulder_y)

            neck_forward_threshold = 8
            tilt_threshold = 5
            head_threshold = 8
            neck_drop_ratio = 0.1
            is_calibrated = True
            print("Calibration complete.")

        # ---------- Drawing ----------
        mp_drawing.draw_landmarks(
            frame, pose_results.pose_landmarks, mp_pose.POSE_CONNECTIONS,
            mp_drawing.DrawingSpec(color=(0, 255, 0), thickness=2, circle_radius=3),
            mp_drawing.DrawingSpec(color=(255, 0, 0), thickness=2, circle_radius=2),
        )
        mid_x = int(frame.shape[1] / 2)
        cv2.line(frame, (mid_x, 0), (mid_x, frame.shape[0]), (255, 0, 0), 2)
        cv2.line(frame, left_shoulder, right_shoulder, (0, 255, 0), 2)

        # ---------- Feedback ----------
        if is_calibrated:
            current_time = time.time()

            # Measure current ear–shoulder vertical distance
            ear_y = (left_ear[1] + right_ear[1]) / 2
            shoulder_y = (left_shoulder[1] + right_shoulder[1]) / 2
            neck_height = abs(ear_y - shoulder_y)
            neck_drop = (baseline_neck_height - neck_height) / baseline_neck_height

            bad_neck_forward = neck_drop > neck_drop_ratio
            bad_side = abs(shoulder_tilt - tilt_baseline) > tilt_threshold
            bad_head = abs(head_roll - head_baseline) > head_threshold

            if bad_neck_forward or bad_side or bad_head:
                status = "POOR POSTURE"
                color = (0, 0, 255)
                if current_time - last_alert_time > alert_cooldown:
                    print("Poor posture detected! Sit upright.")
                    if playsound is not None and os.path.exists(sound_file):
                        playsound(sound_file)
                    last_alert_time = current_time
                    
                cv2.rectangle(frame, (0, 0), (frame.shape[1], 80), (0, 0, 255), -1)
                cv2.putText(frame, "STRAIGHTEN UP!", (40, 55),
                            cv2.FONT_HERSHEY_SIMPLEX, 1.6, (255, 255, 255), 4)
            else:
                status = "Good Posture"
                color = (0, 255, 0)

            # ---------- Stats ----------
            cv2.putText(frame, f"{status}", (20, 120), cv2.FONT_HERSHEY_SIMPLEX, 1.4, color, 3)
            cv2.putText(frame, f"Neck drop: {neck_drop*100:.1f}%", (20, 170), 
                       cv2.FONT_HERSHEY_SIMPLEX, 1.0, (255, 255, 255), 2)
            cv2.putText(frame, f"Head tilt: {head_roll:.1f}°", (20, 210), 
                       cv2.FONT_HERSHEY_SIMPLEX, 1.0, (255, 255, 255), 2)
            cv2.putText(frame, f"Side tilt: {shoulder_tilt:.1f}°", (20, 250), 
                       cv2.FONT_HERSHEY_SIMPLEX, 1.0, (255, 255, 255), 2)
    
    # ---------- Eye Strain Display ----------
    if is_calibrated:
        y_offset = 290
        
        # Display eye strain warnings
        if strain_warnings and time.time() - last_eye_alert_time > alert_cooldown:
            print(f"Eye strain detected: {', '.join(strain_warnings)}")
            last_eye_alert_time = time.time()
        
        for warning in strain_warnings:
            cv2.putText(frame, warning, (20, y_offset),
                       cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 165, 255), 2)
            y_offset += 35
        
        # Display EAR value
        if avg_ear is not None:
            cv2.putText(frame, f"EAR: {avg_ear:.2f}", (20, y_offset),
                       cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 255, 255), 2)
            y_offset += 35
        
        # Display session time
        minutes = int(session_time // 60)
        seconds = int(session_time % 60)
        cv2.putText(frame, f"Session: {minutes:02d}:{seconds:02d}", (20, y_offset),
                   cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 255, 255), 2)
        y_offset += 35
        
        # Display blink count
        total_blinks = sum(blinks_per_minute) + blink_count
        cv2.putText(frame, f"Blinks: {total_blinks}", (20, y_offset),
                   cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 255, 255), 2)

    cv2.imshow("Posture & Eye Strain Monitor", frame)
    if cv2.waitKey(1) & 0xFF == ord("q"):
        break

cap.release()
cv2.destroyAllWindows()