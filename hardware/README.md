# Wireless Patch - EMG-Based Wrist Strain Monitoring System

The Wireless Patch is an EMG (Electromyography) hardware device that integrates with the Ergonomiq application (live at [ergonomiq.dev](https://www.ergonomiq.dev/) — we even joke about it as “erqonomiq.dev”) to monitor wrist strain and prevent Repetitive Strain Injury (RSI) during typing and computer use. It uses a **BioAmp EXG Pill** surface EMG sensor wired to the user’s forearm to detect muscle activity and provides real-time feedback about typing patterns and accumulated risk.

## 📋 Overview

The hardware component monitors muscle activity using EMG sensors connected to an Arduino, processes the data to detect sustained muscle activation patterns that indicate high risk for RSI, and sends alerts to the Ergonomiq frontend application. The system includes both real hardware monitoring and simulated data capabilities for development purposes.

## 🏗️ Architecture

### Hardware Components
- **Arduino Mega** (or compatible board) running StandardFirmata firmware
- **BioAmp EXG Pill EMG sensor** connected via wired electrodes to the forearm
- **Motion Vibrato haptic module** for physical alerts
- **Optional status LED** for visual debugging

### Software Stack
- **Python** with pyFirmata for Arduino communication
- **FastAPI** for the backend API server
- **EMG Signal Processing** using SciPy and NumPy
- **Filtering Algorithms** for noise reduction and envelope detection

## 🚀 Getting Started

### Prerequisites
- Arduino Mega (or compatible board)
- **BioAmp EXG Pill** EMG sensor (primary sensor supported)
- Motion Vibrato (or similar haptic) module
- Jumper wires for connections
- Python 3.8 or higher
- Arduino IDE (for uploading StandardFirmata)

### Hardware Setup

1. **Upload StandardFirmata to Arduino**
   - Open Arduino IDE
   - Load `StandardFirmata.ino` (provided in this repository)
   - Select your Arduino board and port
   - Upload the firmware to your Arduino

2. **Wire the BioAmp EXG Pill + Motion Vibrato**
   - BioAmp EXG Pill → analog pin A0 (signal) plus VCC/GND rails
   - Motion Vibrato module → digital pin 13 (or any PWM pin you prefer)
   - Ensure the pill’s reference electrode is attached to a neutral point on the body

3. **Identify Serial Port**
   - Check the Arduino IDE or system devices to find your Arduino's serial port
   - Common formats:
     - macOS: `/dev/cu.usbmodem1201` (or similar)
     - Linux: `/dev/ttyACM0` (or similar)
     - Windows: `COM3` (or similar)

### Software Installation & Demo Workflow

We mirror what’s live on [https://www.ergonomiq.dev/](https://www.ergonomiq.dev/) (aka erqonomiq.dev) with a simple three-terminal flow:

1. **Frontend (posture + wrist dashboards)**
   ```bash
   cd frontend
   npm install   # first run
   npm run dev
   ```

2. **FastAPI shim (RSI telemetry)**
   ```bash
   cd hardware/api
   conda activate nh25
   uvicorn main:app --reload --host 0.0.0.0 --port 8000
   ```

3. **Hardware demos**
   - *Wrist monitor (real hardware)*  
     ```bash
     cd hardware
     conda activate nh25
     python RSIDetection.py
     ```
     Streams the BioAmp EXG Pill + Motion Vibrato data into the Wrist Strain Coach.

   - *Posture monitor (debug/demo script)*  
     ```bash
     cd hardware
     python posture.py
     ```
     Replays the posture monitor logic we ran at Nathacks 2025.

> **Reminder:** Edit `SERIAL_PORT` inside `RSIDetection.py` to match your Arduino port before running these steps.

## 📊 API Endpoints

The FastAPI backend provides the following endpoints:

### GET `/rsi`
**Description**: Retrieve current RSI analytics data
**Response**: 
- `summary`: RSI summary statistics
- `sessions`: List of RSI sessions
- `detections`: List of detection events

**Response Format**:
```json
{
  "summary": {
    "totalSessions": 5,
    "averageSessionSeconds": 60.5,
    "longestSessionSeconds": 120.0,
    "totalRiskSeconds": 300.0
  },
  "sessions": [...],
  "detections": [...]
}
```

### POST `/rsi`
**Description**: Send RSI telemetry data
**Request Body**:
- `event_type`: "detection" or "rsi_interval" 
- `time`: (for detections) Time in seconds since session start
- `mean_envelope`: (for detections) Mean envelope value
- `elapsed_time`: (for intervals) Duration of RSI interval in seconds
- `total_time`: (for intervals) Total accumulated risk time

## ⚙️ Signal Processing Algorithm

### EMG Processing Pipeline:
1. **Raw Signal Acquisition**: 500Hz sampling from analog pin
2. **Band-pass Filtering**: 74.5-149.5 Hz to isolate muscle activity
3. **Rectification**: Convert to absolute values
4. **Envelope Detection**: Low-pass filter (10Hz cutoff) to extract amplitude envelope
5. **Adaptive Thresholding**: Uses baseline mean + 1.5×std to detect activation
6. **Sustained Activation Detection**: 2-second minimum with 1-second grace period
7. **RSI Risk Accumulation**: Time spent in sustained activation states

### Detection Parameters:
- **Low cutoff**: 74.5 Hz
- **High cutoff**: 149.5 Hz
- **Sampling rate**: 500 Hz
- **Envelope cutoff**: 10 Hz
- **Threshold multiplier**: 1.5 standard deviations above baseline
- **Sustain duration**: 2 seconds minimum
- **Break tolerance**: 1 second grace period

## 📈 Data Model

### RSI Session
- `id`: Unique identifier
- `recordedAt`: Timestamp of session
- `durationSeconds`: Duration of risk interval
- `cumulativeRiskSeconds`: Total accumulated risk time
- `meanEnvelope`: Average envelope value during interval

### RSI Detection
- `id`: Unique identifier
- `recordedAt`: Timestamp of detection
- `timecodeSeconds`: Time in session when detected
- `meanEnvelope`: Envelope value at detection

### RSI Summary
- `totalSessions`: Count of RSI intervals
- `averageSessionSeconds`: Average duration
- `longestSessionSeconds`: Longest interval
- `totalRiskSeconds`: Total accumulated risk time

## 🔧 Configuration

### Environment Variables
- `VIBRATE_ENDPOINT`: Endpoint for haptic feedback (default: `http://localhost:8000/vibrate`)
- `VIBRATE_TIMEOUT`: Timeout for vibration requests (default: 5 seconds)

### Tuning Parameters
In `RSIDetection.py`, you can adjust:
- `LOW_CUTOFF` / `HIGH_CUTOFF`: Filter frequency bounds
- `THRESHOLD_STD_MULTIPLIER`: Sensitivity to muscle activation
- `SUSTAIN_DURATION`: Minimum activation time to trigger alert
- `BREAK_TOLERANCE`: Grace period before resetting detection

## 🤝 Integration with Ergonomiq Frontend

The hardware API integrates seamlessly with the Ergonomiq frontend:

1. **Frontend Configuration**: Set `VITE_HARDWARE_API_URL` to point to the API server
2. **Real-time Updates**: Frontend polls `/rsi` endpoint every 8 seconds
3. **Dashboard Display**: RSI data appears in the wrist strain monitoring section
4. **User Notifications**: When risk levels are high, users receive visual and optional email alerts

## 🐛 Troubleshooting

### Common Issues:
1. **Serial Port Connection**: Verify the correct serial port is specified and Arduino is connected
2. **Firmata Not Running**: Ensure StandardFirmata is uploaded to the Arduino
3. **Permission Issues**: On Linux, you may need to add your user to the `dialout` group
4. **API Connection**: Verify the API server is running on the expected port

### Debugging Tips:
- Check serial connections with `ls /dev/cu.*` (macOS) or `ls /dev/tty*` (Linux)
- Use the `debug.py` script to test API connectivity without hardware
- Monitor the console output for calibration and detection messages

## 📚 References

- [pyFirmata Documentation](https://pyfirmata.readthedocs.io/en/latest/)
- [Arduino Firmata Protocol](https://github.com/firmata/arduino)
- [EMG Signal Processing Techniques](https://en.wikipedia.org/wiki/Electromyography)

## 🛡️ Safety & Disclaimers

- This system is designed for educational and wellness purposes only
- EMG sensors should be properly placed on the skin for accurate readings
- The system is not a medical device and should not be used for medical diagnosis
- Always practice good ergonomics and take regular breaks regardless of system alerts

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Commit your changes (`git commit -m 'Add amazing feature'`)
5. Push to the branch (`git push origin feature/amazing-feature`)
6. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](../LICENSE) file for details.

---
Built by Team 777777 for Nathacks 2025 as part of the Ergonomiq ecosystem
