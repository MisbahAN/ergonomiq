# Team 777777 - Ergonomiq + Wireless Patch

A comprehensive ergonomic wellness system built for **Nathacks 2025** that combines computer vision and EMG sensors to monitor and prevent workplace injuries. The system includes both a frontend wellness dashboard and a hardware component for real-time ergonomic feedback.

## 🌟 Project Overview

Ergonomiq is an AI-powered desk health companion that helps users maintain proper posture, reduce eye strain, and prevent wrist injuries during long work sessions. The system features:

- **Real-time posture monitoring** using computer vision
- **Eye strain prevention** with blink tracking and session time alerts
- **RSI (Repetitive Strain Injury) detection** using EMG sensors
- **Comprehensive analytics dashboard** with trend visualization
- **User-friendly UI/UX** with notification system
- **Hardware integration** for advanced wrist monitoring

## 🏗️ System Architecture

The project is composed of two main components:

### Frontend (Ergonomiq)
- **React/TypeScript** application with Vite build tool
- **MediaPipe integration** for computer vision processing
- **Firebase backend** for authentication and data storage
- **Tailwind CSS + shadcn/ui** for modern UI components
- **Live posture and eye monitoring** via webcam
- **Analytics dashboard** with trend visualization

### Hardware (Wireless Patch)
- **EMG sensors** connected via wires to user's forearm
- **Arduino Mega** running StandardFirmata
- **Python-based signal processing** with SciPy/NumPy
- **FastAPI backend** for data transmission
- **RSI risk monitoring** with haptic feedback

## 📊 Features

### Posture Monitoring
- Real-time neck drop detection
- Shoulder and head tilt monitoring
- Calibration system for personal baseline
- Visual feedback with landmarks overlay
- 30-frame calibration process

### Eye Strain Prevention
- Blink rate tracking using MediaPipe Face Landmarker
- Eye Aspect Ratio (EAR) calculation
- 20-20-20 rule reminders
- Session time alerts after 20 minutes of continuous work
- Low blink rate warnings

### Wrist Strain Monitoring
- EMG-based muscle activity detection
- Sustained activation pattern recognition
- Real-time RSI risk tracking
- Accumulated risk time calculation
- Haptic feedback for high-risk situations

### Analytics Dashboard
- Comprehensive posture score tracking
- Eye strain risk assessment
- Wrist strain trend visualization
- Weekly improvement metrics
- Session history with detailed analytics

## 🚀 Quick Start

### Prerequisites
- Node.js (v18 or higher)
- Python 3.8 or higher
- Arduino Mega or compatible board with StandardFirmata
- EMG sensors (e.g., MyoWare Muscle Sensor)
- Camera access for posture monitoring

### Complete System Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/MisbahAN/777777.git
   cd 777777
   ```

2. **Setup Frontend**
   ```bash
   cd frontend
   npm install
   ```

3. **Configure Firebase**
   - Create a Firebase project at [Firebase Console](https://console.firebase.google.com)
   - Enable Firestore and Authentication
   - Create `.env` file with your Firebase configuration:
     ```env
     VITE_FIREBASE_API_KEY=your_firebase_api_key
     VITE_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
     VITE_FIREBASE_PROJECT_ID=your_firebase_project_id
     VITE_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
     VITE_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
     VITE_FIREBASE_APP_ID=your_firebase_app_id
     ```

4. **Setup Hardware** (Optional if using hardware)
   ```bash
   cd ../hardware/api
   python3 -m venv .venv
   source .venv/bin/activate  # Linux/macOS
   pip install -r requirements.txt
   pip install pyfirmata scipy matplotlib numpy
   ```

5. **Hardware Setup**
   - Upload `StandardFirmata.ino` to your Arduino
   - Connect EMG sensors to analog pin A0
   - Connect LED to digital pin 13 (optional)
   - Update `SERIAL_PORT` in `RSIDetection.py` with your device port

6. **Run the complete system**
   Terminal 1 (Hardware API):
   ```bash
   cd hardware/api
   uvicorn main:app --reload --host 0.0.0.0 --port 8000
   ```

   Terminal 2 (Hardware Detection - if using real hardware):
   ```bash
   cd hardware
   python RSIDetection.py
   ```

   Terminal 3 (Frontend):
   ```bash
   cd frontend
   npm run dev
   ```

The application will be available at `http://localhost:5173`

## 📁 Directory Structure

```
777777/
├── frontend/           # React/TypeScript frontend application
│   ├── src/
│   │   ├── components/ # UI components
│   │   ├── hooks/      # Custom React hooks (usePostureVision, useAuthStore)
│   │   ├── lib/        # Service libraries (Firebase, hardware API)
│   │   ├── pages/      # Application views (Dashboard, PostureMonitor, etc.)
│   │   └── utils/      # Helper functions
│   ├── public/         # Static assets
│   └── package.json    # Dependencies and scripts
├── hardware/           # EMG-based wrist monitoring system
│   ├── api/            # FastAPI backend for hardware data
│   │   ├── main.py     # API endpoints for RSI analytics
│   │   └── requirements.txt
│   ├── StandardFirmata.ino  # Arduino firmware
│   ├── RSIDetection.py      # EMG processing and detection
│   ├── debug.py             # Simulated data for development
│   └── posture.py           # Haptic feedback server
├── README.md           # This file
└── .gitignore
```

## 🛠️ Technology Stack

### Frontend Technologies
- **Framework**: React 18.3.1 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS, shadcn/ui
- **State Management**: Zustand, React Query
- **Computer Vision**: MediaPipe Pose/Face Landmarker
- **Charts**: Recharts for data visualization
- **Authentication**: Firebase Auth
- **Database**: Firebase Firestore

### Hardware Technologies
- **Microcontroller**: Arduino Mega with StandardFirmata
- **Sensors**: Surface EMG sensors
- **Communication**: pyFirmata for Arduino interfacing
- **Backend**: FastAPI for data transmission
- **Signal Processing**: SciPy, NumPy for EMG analysis
- **Packaging**: Python virtual environments

## 🔗 API Endpoints

### Frontend to Backend
- `POST /vibrate` - Trigger haptic feedback (from posture monitoring)
- `POST /rsi` - Send RSI telemetry data from hardware
- `GET /rsi` - Retrieve RSI analytics for frontend

### Data Flow
- Frontend sends posture alerts to `http://localhost:8000/vibrate`
- Hardware sends RSI data to `http://localhost:8000/rsi`
- Frontend polls `http://localhost:8000/rsi` for wrist analytics

## 🧪 Development

### Running with Simulated Hardware
If you don't have the hardware, you can still develop the frontend with simulated data:

1. Start the API server:
   ```bash
   cd hardware/api
   uvicorn main:app --reload --host 0.0.0.0 --port 8000
   ```

2. Send simulated data:
   ```bash
   cd hardware
   python debug.py
   ```

3. Start the frontend:
   ```bash
   cd frontend
   npm run dev
   ```

### Using Real Hardware
1. Ensure your Arduino is connected with StandardFirmata uploaded
2. Update the serial port in `hardware/RSIDetection.py`
3. Run the detection script: `python hardware/RSIDetection.py`
4. Start the API server: `uvicorn hardware/api/main:app --reload --host 0.0.0.0 --port 8000`
5. Start the frontend: `npm run dev`

## 📊 Data Models

### Posture Session
- `timestampStart/End`: Session start/end times
- `postureData`: String of 0s/1s representing good/bad posture frames
- `totalFrames`, `badFrames`: Frame counts and ratios
- `frequency`: Sampling frequency
- `triggerAlert`: Boolean indicating if alert was triggered

### Eye Strain Session
- `timestampStart`: Session start time
- `duration`: Session length in seconds
- `avgBlinkRate`: Average blinks per minute
- `totalBlinks`, `avgEAR`: Eye metrics
- `strainAlerts`, `lowBlinkRateAlerts`: Alert counts

### RSI Session
- `recordedAt`: Timestamp of risk interval
- `durationSeconds`: Duration of high-risk period
- `cumulativeRiskSeconds`: Total accumulated risk time
- `meanEnvelope`: Average EMG envelope value

## 📈 Analytics & Metrics

### Posture Analytics
- **Posture Score**: Percentage of time in good posture (target >80%)
- **Neck Drop**: Percentage of neck lean forward
- **Shoulder Tilt**: Degree of uneven shoulders
- **Head Tilt**: Degree of head rotation/tilt
- **Weekly Improvement**: Trend analysis

### Eye Strain Analytics
- **Blink Rate**: Blends per minute (healthy ≥10/min)
- **Eye Aspect Ratio**: EAR ≥ 0.25 indicates healthy eye openness
- **Session Time**: Duration before 20-minute break recommendation
- **Eye Strain Risk**: LOW/MEDIUM/HIGH classification

### Wrist Strain Analytics
- **Total Risk Time**: Cumulative time in high-risk state
- **Average Session Time**: Average duration of risk intervals
- **Longest Session**: Longest continuous risk period
- **Detection Events**: Number of high-risk muscle activations

## 🤝 Contributing

We welcome contributions to improve the Ergonomiq system! To contribute:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes in the appropriate directory (frontend or hardware)
4. Test your changes thoroughly
5. Add documentation if needed
6. Commit your changes: `git commit -m 'Add amazing feature'`
7. Push to the branch: `git push origin feature/amazing-feature`
8. Open a Pull Request

### Development Guidelines
- Follow existing code style and conventions
- Add tests where appropriate
- Update documentation for new features
- Keep frontend and hardware changes separate in commits when possible
- Ensure security and privacy considerations in data handling

## 🏷️ Built With

### Frontend Stack
- [React](https://react.dev/) - Component-based UI library
- [TypeScript](https://www.typescriptlang.org/) - Type-safe JavaScript
- [Vite](https://vitejs.dev/) - Fast build tool
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework
- [shadcn/ui](https://ui.shadcn.com/) - Accessible UI components
- [MediaPipe](https://mediapipe.dev/) - Computer vision framework
- [Firebase](https://firebase.google.com/) - Backend services

### Hardware Stack
- [Arduino](https://www.arduino.cc/) - Microcontroller platform
- [pyFirmata](https://github.com/tino/pyFirmata) - Python-Arduino communication
- [FastAPI](https://fastapi.tiangolo.com/) - Python web framework
- [SciPy/NumPy](https://scipy.org/) - Scientific computing
- [StandardFirmata](https://github.com/firmata/arduino) - Arduino communication protocol

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🎓 About Nathacks 2025

Built by **Team 777777** during Nathacks 2025, this project represents an innovative approach to workplace wellness that combines AI-powered computer vision with hardware-based biometric monitoring to create a comprehensive ergonomic solution.

## ❤️ Acknowledgments

- The MediaPipe team for providing excellent computer vision tools
- The Arduino/Firmata community for accessible hardware integration
- Nathacks 2025 for providing the platform for this innovation
- Open source communities that made this project possible

---
Made with ❤️ by **Team 777777** for **Nathacks 2025**