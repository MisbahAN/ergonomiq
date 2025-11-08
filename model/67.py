import cv2
import mediapipe as mp
import numpy as np
import time
import os

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


# ---------- Initialization ----------

mp_pose = mp.solutions.pose
mp_drawing = mp.solutions.drawing_utils
pose = mp_pose.Pose(static_image_mode=False,
                    min_detection_confidence=0.5,
                    min_tracking_confidence=0.5)

cap = cv2.VideoCapture(0)

calibration_shoulder_angles = []
calibration_neck_angles = []
calibration_shoulder_tilts = []
calibration_head_rolls = []
calibration_frames = 0
is_calibrated = False
last_alert_time = 0
alert_cooldown = 5
sound_file = "alert.mp3"  # put an mp3 in same folder
print("Starting webcam... Sit upright for calibration (about 3 seconds).")


# ---------- Main Loop ----------

while cap.isOpened():
    ret, frame = cap.read()
    if not ret:
        continue

    frame = cv2.flip(frame, 1)
    rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    results = pose.process(rgb)

    if results.pose_landmarks:
        lm = results.pose_landmarks.landmark

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
            neck_drop_ratio = 0.1  # 10 percent drop = bad
            is_calibrated = True
            print("Calibration complete.")

        # ---------- Drawing ----------
        mp_drawing.draw_landmarks(
            frame, results.pose_landmarks, mp_pose.POSE_CONNECTIONS,
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
                    if os.path.exists(sound_file):
                        os.system(f"afplay '{sound_file}' &")

                    last_alert_time = current_time
                cv2.rectangle(frame, (0, 0), (frame.shape[1], 80), (0, 0, 255), -1)
                cv2.putText(frame, "STRAIGHTEN UP!", (40, 55),
                            cv2.FONT_HERSHEY_SIMPLEX, 1.6, (255, 255, 255), 4)
            else:
                status = "Good Posture"
                color = (0, 255, 0)

            # ---------- Stats (larger text) ----------
            cv2.putText(frame, f"{status}", (20, 120), cv2.FONT_HERSHEY_SIMPLEX, 1.4, color, 3)
            cv2.putText(frame, f"Neck drop: {neck_drop*100:.1f}%", (20, 170), cv2.FONT_HERSHEY_SIMPLEX, 1.0, (255, 255, 255), 2)
            cv2.putText(frame, f"Head tilt: {head_roll:.1f}°", (20, 210), cv2.FONT_HERSHEY_SIMPLEX, 1.0, (255, 255, 255), 2)
            cv2.putText(frame, f"Side tilt: {shoulder_tilt:.1f}°", (20, 250), cv2.FONT_HERSHEY_SIMPLEX, 1.0, (255, 255, 255), 2)

    cv2.imshow("Posture Corrector", frame)
    if cv2.waitKey(1) & 0xFF == ord("q"):
        break

cap.release()
cv2.destroyAllWindows()
