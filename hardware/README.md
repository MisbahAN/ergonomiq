# Wireless Patch - EMG-Based Wrist Strain Monitoring System

The Wireless Patch is an EMG (Electromyography) hardware device that integrates with the Ergonomiq application to monitor wrist strain and prevent Repetitive Strain Injury (RSI) during typing and computer use. It uses surface EMG sensors connected via wires to the user's body at specific points to detect muscle activity in the forearm and provides real-time feedback about typing patterns and accumulated risk.

## 📋 Overview

The hardware component monitors muscle activity using EMG sensors connected to an Arduino, processes the data to detect sustained muscle activation patterns that indicate high risk for RSI, and sends alerts to the Ergonomiq frontend application. The system includes both real hardware monitoring and simulated data capabilities for development purposes.

## 🏗️ Architecture

### Hardware Components
- **Arduino Mega** (or compatible board) running StandardFirmata firmware
- **EMG Sensors** connected via wired electrodes to specific points on the user's body (forearm)
- **LED Indicator** on digital pin 13 for visual feedback
- **Optional Haptic Feedback** module for physical alerts

### Software Stack
- **Python** with pyFirmata for Arduino communication
- **FastAPI** for the backend API server
- **EMG Signal Processing** using SciPy and NumPy
- **Filtering Algorithms** for noise reduction and envelope detection

## 🚀 Getting Started

### Prerequisites
- Arduino Mega (or compatible board)
- EMG sensors (e.g., MyoWare Muscle Sensor)
- Jumper wires for connections
- Python 3.8 or higher
- Arduino IDE (for uploading StandardFirmata)

### Hardware Setup

1. **Upload StandardFirmata to Arduino**
   - Open Arduino IDE
   - Load `StandardFirmata.ino` (provided in this repository)
   - Select your Arduino board and port
   - Upload the firmware to your Arduino

2. **Connect EMG Sensors**
   - Connect EMG sensor to analog pin A0 on the Arduino
   - Connect LED to digital pin 13 (optional, for visual feedback)
   - Ensure proper power (VCC) and ground (GND) connections

3. **Identify Serial Port**
   - Check the Arduino IDE or system devices to find your Arduino's serial port
   - Common formats:
     - macOS: `/dev/cu.usbmodem1201` (or similar)
     - Linux: `/dev/ttyACM0` (or similar)
     - Windows: `COM3` (or similar)

### Software Installation

1. **Navigate to API Directory**
   ```bash
   cd hardware/api
   ```

2. **Create Virtual Environment**
   ```bash
   python3 -m venv .venv
   source .venv/bin/activate  # Linux/macOS
   # or .venv\Scripts\activate  # Windows
   ```

3. **Install Dependencies**
   ```bash
   pip install -r requirements.txt
   pip install pyfirmata scipy matplotlib numpy
   ```

4. **Configure Serial Port**
   Edit `RSIDetection.py` and update the `SERIAL_PORT` variable with your Arduino's port:
   ```python
   SERIAL_PORT = '/dev/cu.usbmodem1201'  # Replace with your port
   ```

## 🛠️ Running the System

### Option 1: Full Hardware Setup
Run the RSI detection system with real hardware:

```bash
cd hardware
python RSIDetection.py
```

This will:
- Connect to the Arduino via pyFirmata
- Calibrate the EMG sensors for 12 seconds
- Monitor sustained muscle activation patterns
- Send RSI interval data to the API
- Trigger haptic feedback when risk is detected

### Option 2: FastAPI Backend Only
Run the API server without hardware:

```bash
cd hardware/api
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Option 3: Simulated Data (for Development)
Run with simulated data instead of hardware:

```bash
cd hardware
python debug.py
```

This continuously sends simulated RSI events to the API without requiring physical hardware.

### Option 4: Frontend Integration
To use with the Ergonomiq frontend, ensure both the API and frontend are running:

Terminal 1 (API):
```bash
cd hardware/api
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Terminal 2 (Hardware - only if using real hardware):
```bash
cd hardware
python RSIDetection.py
```

Terminal 3 (Frontend):
```bash
cd frontend
npm run dev
```

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