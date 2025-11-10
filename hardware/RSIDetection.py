import os
import serial
import time
import matplotlib.pyplot as plt
import numpy as np
from scipy.signal import butter, filtfilt, find_peaks
import pyfirmata
import requests


'''
HOW TO RUN THIS FILE:

1. Install the requirements (I didnt make a requirements.txt my bad)
2. Connect Arduino as shown in the EXG Pill docs
3. Connect to Analog input terminal A0
4. Verify and Run StandardFirmata.ino 
5. Change SERIAL_PORT to whatever is shown in Aruino IDE 
6. Open the terminal and find the folder
7. run RSIDetection.py
8. Wait for the calibration and then start going
'''

# Configure serial port
SERIAL_PORT = '/dev/cu.usbmodem1201'  # Replace with your Arduino's port
BAUD_RATE = 9600      # Match the Arduino's serial rate

# Band-pass filter parameters
LOW_CUTOFF = 74.5     # Low cutoff frequency in Hz
HIGH_CUTOFF = 149.5   # High cutoff frequency in Hz
SAMPLING_RATE = 500   # Sampling rate in Hz (update to your actual rate)

# Envelope filter parameters
ENVELOPE_CUTOFF = 10  # Low-pass filter cutoff for envelope extraction (in Hz)
ENVELOPE_PROMINENCE = 0.3 # Promonience for the envelope peak detection
ENVELOPE_HEIGHT = 5 
THRESHOLD_STD_MULTIPLIER = 1.5
SUSTAIN_DURATION = 2
ENVELOPE_WIDTH = 0.0025 
BREAK_TOLERANCE = 1
# Typing detection tuning
TYPING_MIN_FREQ = 0.5    # Minimum repetition rate (Hz)
TYPING_MAX_FREQ = 10.0    # Maximum repetition rate (Hz)
ACTIVITY_WINDOW = 2.0    # Seconds of envelope history to analyze frequency
PEAK_PROMINENCE = 0.3    # How strong envelope peaks must be
rsi_risk_start_time = None
rsi_risk_accumulated = 0.0
last_rsi_check_time = time.time()

API_ENDPOINT = "http://localhost:8000/rsi"
VIBRATE_ENDPOINT = os.environ.get("VIBRATE_ENDPOINT", "http://localhost:8000/vibrate")
VIBRATE_TIMEOUT_SECONDS = float(os.environ.get("VIBRATE_TIMEOUT", 5))


envelope_history = []
envelope_time_history = []


def trigger_remote_vibration(reason: str) -> bool:
    """Fire the vibration motor via the /vibrate Flask endpoint."""
    try:
        response = requests.get(
            VIBRATE_ENDPOINT,
            params={"reason": reason},
            timeout=VIBRATE_TIMEOUT_SECONDS,
        )
        if response.status_code == 200:
            print(f"[VIBRATE] Triggered via {VIBRATE_ENDPOINT} ({reason})")
            return True
        print(
            f"[VIBRATE] Endpoint returned {response.status_code}: {response.text[:80]}"
        )
    except requests.exceptions.RequestException as exc:
        print(f"[VIBRATE] Failed to reach endpoint: {exc}")
    return False

# Initialize serial connection
try:
    board = pyfirmata.ArduinoMega(SERIAL_PORT, baudrate=BAUD_RATE)
    it = pyfirmata.util.Iterator(board)
    it.start()
except Exception as e:
    print(f"Error: {e}")
    exit()

# Band-pass filter design and application
def butter_bandpass(lowcut, highcut, fs, order=4):
    nyquist = 0.5 * fs
    low = lowcut / nyquist
    high = highcut / nyquist
    b, a = butter(order, [low, high], btype='band')
    return b, a

def apply_bandpass_filter(data, lowcut, highcut, fs, order=4):
    b, a = butter_bandpass(lowcut, highcut, fs, order)
    return filtfilt(b, a, data)

# Function to calculate the envelope of the EMG signal
def calculate_envelope(emg_signal, sampling_rate, cutoff_freq=5.0):
    rectified_signal = np.abs(emg_signal)
    nyquist_freq = sampling_rate / 2.0
    normalized_cutoff = cutoff_freq / nyquist_freq
    b, a = butter(4, normalized_cutoff, btype='low')
    envelope = filtfilt(b, a, rectified_signal)
    return envelope



# Main program
data = []
buffer = []
buffer_size = int(SAMPLING_RATE * 0.2)  # 0.1 seconds buffer
time_points = []
start_time = time.time()

i = 0
j = 0
try:
    board.get_pin('a:0:i')
    board.get_pin('a:1:i')
    board.get_pin('a:2:i')
    board.get_pin('a:3:i')
    board.get_pin('a:4:i')
    board.get_pin('a:15:i')
    board.get_pin('d:13:o')
    board.digital[13].write(0.0)
    print("Calibrating....")

    activation_start_time = None
    activation_triggered = False

    baseline_mean = None
    baseline_std = None
    while True:
        
        #beg = time.time()'''
        beg = time.time()

        analog_input0 = board.analog[0].read()
        analog_input1 = board.analog[1].read()
        analog_input2 = board.analog[2]
        analog_input3 = board.analog[3]
        analog_input4 = board.analog[4]
        analog_input15 = board.analog[15].read()
        

        value = analog_input0
        time.sleep(0.001)  
        if value is not None:
            value = int(value*1000)
            
            data.append(value)
            time_points.append(time.time() - start_time)
            buffer.append(value)
            #print(f"Time to process: {time.time() - beg}")
    
        if time.time() - start_time >= 12:
            if j == 0:
                print("Initialization Finished — calculating baseline stats...")
                all_data_array = np.array(data)
                filtered_init = apply_bandpass_filter(all_data_array, LOW_CUTOFF, HIGH_CUTOFF, SAMPLING_RATE)
                envelope_init = calculate_envelope(filtered_init, SAMPLING_RATE, ENVELOPE_CUTOFF)
                baseline_mean = np.mean(envelope_init)
                baseline_std = np.std(envelope_init)
                print(f"Baseline mean: {baseline_mean:.3f}, std: {baseline_std:.3f}")
                j += 1
            if len(buffer) >= buffer_size:
                buffer_array = np.array(buffer)

                # Apply filters and detect peaks
                filtered = apply_bandpass_filter(buffer_array, LOW_CUTOFF, HIGH_CUTOFF, SAMPLING_RATE)
                envelope = calculate_envelope(filtered, SAMPLING_RATE, ENVELOPE_CUTOFF)
                current_time = time.time() - start_time


                # Maintain rolling envelope history for rhythm analysis
                envelope_history.extend(envelope.tolist())
                envelope_time_history.extend([current_time] * len(envelope))

                # Keep only the last ACTIVITY_WINDOW seconds
                while len(envelope_time_history) > 0 and (current_time - envelope_time_history[0]) > ACTIVITY_WINDOW:
                    envelope_time_history.pop(0)
                    envelope_history.pop(0)
                

                mean_env = np.mean(envelope)


                # Update threshold dynamically if baseline exists
                if baseline_mean is not None and baseline_std is not None:
                    # Slow adaptation to long-term changes
                    alpha = 0.001  # small smoothing factor
                    baseline_mean = (1 - alpha) * baseline_mean + alpha * mean_env
                    baseline_std = (1 - alpha) * baseline_std + alpha * np.std(envelope)
                    adaptive_threshold = baseline_mean + THRESHOLD_STD_MULTIPLIER * baseline_std
                else:
                    adaptive_threshold = 0  # Safe fallback until baseline computed


                # Analyze rhythmicity of recent envelope segment
                if len(envelope_history) > 5:
                    env_segment = np.array(envelope_history)
                    peaks, _ = find_peaks(env_segment, prominence=PEAK_PROMINENCE)
                    num_peaks = len(peaks)

                    # Estimate repetition rate (Hz)
                    if len(envelope_time_history) > 1:
                        duration = envelope_time_history[-1] - envelope_time_history[0]
                        repetition_rate = num_peaks / max(duration, 1e-6)
                    else:
                        repetition_rate = 0.0

                    is_typing_like = TYPING_MIN_FREQ <= repetition_rate <= TYPING_MAX_FREQ
                else:
                    is_typing_like = False

                # Grace period–based sustained activation detection + RSI tracking
                if mean_env > adaptive_threshold:                    # Currently active above threshold
                    if activation_start_time is None:
                        activation_start_time = current_time  # Start new activation
                    last_active_time = current_time  # Update last time we were above threshold

                    # --- [RSI TIMER START] ---
                    if rsi_risk_start_time is None:
                        rsi_risk_start_time = current_time  # Begin a new RSI risk interval
                    # --- [RSI TIMER END] ---

                    if (current_time - activation_start_time) >= SUSTAIN_DURATION and not activation_triggered:
                        activation_triggered = True
                        activation_start_time = None
                        print(f"[DETECTION] Sustained activation detected at t = {current_time:.2f}s (mean envelope = {mean_env:.2f})")
                        try:
                            payload = {
                                "event_type": "detection",
                                "time": current_time,
                                "mean_envelope": mean_env
                            }
                            requests.post(API_ENDPOINT, json=payload)
                        except requests.exceptions.RequestException as e:
                            print(f"Failed to send detection event: {e}")
                        triggered = trigger_remote_vibration("sustained_activation")
                        if not triggered:
                            # Fallback to direct board control if HTTP fails
                            board.digital[13].write(1.0)
                            time.sleep(2)
                            board.digital[13].write(0.0)
                        else:
                            time.sleep(2)

                else:
                    # Below threshold — check if within grace period
                    if 'last_active_time' in locals() and (current_time - last_active_time) <= BREAK_TOLERANCE:
                        # Do nothing, allow short dropouts
                        pass
                    else:
                        # Too long below threshold — reset sustained detection
                        activation_start_time = None
                        activation_triggered = False

                        # --- [RSI TIMER START] ---
                        # If previously in RSI risk state, accumulate elapsed time
                        if rsi_risk_start_time is not None:
                            elapsed_risk_time = current_time - rsi_risk_start_time
                            rsi_risk_accumulated += elapsed_risk_time
                            print(f"[RSI] End of risk interval (+{elapsed_risk_time:.2f}s). Total RSI risk time: {rsi_risk_accumulated:.2f}s")
                            try:
                                payload = {
                                    "event_type": "rsi_interval",
                                    "elapsed_time": elapsed_risk_time,
                                    "total_time": rsi_risk_accumulated
                                }
                                requests.post(API_ENDPOINT, json=payload)
                            except requests.exceptions.RequestException as e:
                                print(f"Failed to send RSI Interval event: {e}")
                            rsi_risk_start_time = None
                        # --- [RSI TIMER END] ---

            
                i += 1

                # Clear the buffer
                buffer = []
                #time.sleep(0.001)

                

except KeyboardInterrupt:
    print("Stopping data collection")
    print("[RSI] Total Risk time: " + str(rsi_risk_accumulated))
    
