# Ergonomiq - Your AI-Powered Desk Health Companion

Ergonomiq is an advanced ergonomic monitoring application that uses computer vision to help you maintain good posture, reduce eye strain, and prevent wrist pain during long work sessions. Built by Team 777777 for Nathacks 2025, it combines real-time webcam analysis with hardware integration to create a comprehensive wellness solution.

## 🌟 Key Features

### Posture Monitoring
- **Real-time posture analysis** using MediaPipe Pose Landmarker
- **Neck drop detection** with customizable alerts
- **Shoulder and head tilt monitoring**
- **Calibration system** to establish personal baseline
- **Visual feedback** with landmarks and status indicators

### Eye Strain Prevention
- **Webcam-based blink tracking** using MediaPipe Face Landmarker
- **Eye Aspect Ratio (EAR)** calculation for drowsiness detection
- **Blink rate monitoring** with 20-20-20 rule reminders
- **Session time tracking** to encourage regular breaks

### Wrist Strain Monitoring
- **Hardware integration** with Wirless Patch wearable device
- **RSI (Repetitive Strain Injury) detection** during typing sessions
- **Risk level tracking** for cumulative wrist strain
- **Time-based alerts** for extended typing sessions

### Dashboard Analytics
- **Trend visualization** for posture, eye strain, and wrist metrics
- **Historical session tracking** with performance analytics
- **Personalized insights** based on your ergonomic patterns
- **Progress tracking** with weekly improvement metrics

## 🛠️ Technology Stack

### Frontend Framework
- **React** (v18.3.1) - Component-based UI library
- **TypeScript** - Type-safe JavaScript development
- **Vite** - Fast build tool and development server
- **React Router** - Client-side routing

### UI Components & Styling
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - Accessible UI components
- **Radix UI** - Low-level UI primitives
- **Lucide React** - Beautiful icon library
- **Recharts** - Interactive charting library

### Computer Vision & Analytics
- **MediaPipe** - Google's ML solution for real-time vision processing
- **Pose Landmarker** - Body pose estimation from Google
- **Face Landmarker** - Facial landmark detection for eye tracking
- **Canvas API** - Real-time video overlay rendering

### Backend & Data Management
- **Firebase Authentication** - User authentication system
- **Firebase Firestore** - NoSQL database for session storage
- **React Query** - Server state management
- **Zustand** - Global state management

### Additional Libraries
- **Zod** - Schema validation
- **React Hook Form** - Form validation and management
- **Next Themes** - Dark/light mode support
- **Sonner & Toast** - Notification system

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm, yarn, or bun package manager
- Camera access for posture monitoring
- (Optional) Wirless Patch hardware for wrist monitoring

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/MisbahAN/777777.git
cd 777777/frontend
```

2. **Install dependencies**
```bash
# Using npm
npm install

# Using yarn
yarn install

# Using bun
bun install
```

3. **Environment Configuration**
Create a `.env` file in the `frontend` directory with the following variables:

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
VITE_FIREBASE_PROJECT_ID=your_firebase_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
VITE_FIREBASE_APP_ID=your_firebase_app_id

# Hardware API Configuration (Optional)
VITE_HARDWARE_API_URL=http://localhost:8000

# Development
VITE_APP_TITLE=Ergonomiq
```

4. **Run the development server**
```bash
# Using npm
npm run dev

# Using yarn
yarn dev

# Using bun
bun run dev
```

The application will be available at `http://localhost:8000`

### Firebase Setup

To run the application with full functionality:

1. Create a new Firebase project at [Firebase Console](https://console.firebase.google.com)
2. Enable Firestore Database and Authentication (Email/Password and Google Sign-In)
3. Add your domain to authorized domains in Firebase Authentication
4. Update your `.env` file with the Firebase configuration values

### Hardware Integration (Optional)

The wrist monitoring feature connects to a local API server for the Wirless Patch device:

1. Ensure the hardware API server is running (typically on port 8000)
2. Set `VITE_HARDWARE_API_URL` to the appropriate endpoint
3. Run the hardware server using: `uvicorn hardware.api.main:app --reload`

## 📊 Application Structure

```
frontend/
├── public/                 # Static assets
├── src/
│   ├── components/         # Reusable UI components
│   ├── hooks/              # Custom React hooks
│   │   ├── useAuthStore.ts # Authentication state management
│   │   └── usePostureVision.ts # Core posture monitoring logic
│   ├── lib/                # Service and utility libraries
│   │   ├── authService.ts  # Firebase authentication
│   │   ├── firestoreService.ts # Database operations
│   │   └── hardwareApi.ts  # Wrist monitoring API
│   ├── pages/              # Application views
│   │   ├── Dashboard.tsx   # Main analytics dashboard
│   │   ├── PostureMonitor.tsx # Posture monitoring page
│   │   ├── WristMonitor.tsx # Wrist strain monitoring
│   │   └── Profile.tsx     # User profile settings
│   ├── utils/              # Helper functions
│   │   └── postureMath.ts  # Posture calculation algorithms
│   └── App.tsx             # Main application router
├── components.json         # shadcn/ui configuration
├── package.json            # Project dependencies
└── vite.config.ts          # Build configuration
```

## 📋 Core Functionality

### Posture Monitoring Algorithm

The posture monitoring system works by:

1. **Calibration Phase**: Captures 30 frames to establish baseline posture (shoulder angle, neck angle, head roll)
2. **Real-time Analysis**: Compares current pose to baseline using pose landmarks
3. **Alert System**: Triggers alerts when neck drop exceeds 10%, shoulder tilt exceeds 8°, or head tilt exceeds 12°
4. **Session Recording**: Logs posture quality over time as a string of 0s (good) and 1s (bad) at 1-sample-per-second frequency

### Eye Strain Detection

- Monitors blink rate and eye aspect ratio (EAR) 
- Triggers "LOW BLINK RATE" alert when below 10 blinks/minute
- Alerts "TAKE A BREAK" after 20 minutes of continuous work
- Shows "EYES STRAINED" when excessive eye closure events detected

### Wrist Monitoring

- Connects to the Wirless Patch hardware device via local API
- Tracks typing sessions and wrist strain levels
- Monitors cumulative risk during extended keyboard use
- Provides trend analysis for wrist strain over time

## 🔐 Authentication & Data Privacy

- Uses Firebase Authentication (email/password and Google sign-in)
- Session data is stored securely in Firestore
- All computer vision processing happens client-side for privacy
- Users can manage notification preferences in the profile section
- All personal data is encrypted in transit and at rest

## 📈 Data Analytics

The application provides comprehensive analytics including:

- **Posture Score**: Daily percentage of good posture (target >80%)
- **Eye Strain Risk**: Low/Medium/High classification based on blink patterns
- **Session Time**: Duration of continuous computer use
- **Break Frequency**: Number of recommended breaks taken
- **Weekly Trends**: Improvements in ergonomic habits over time

## 🧪 Seeding Database

To populate the database with sample data for testing:

```bash
npm run seed:firestore
```

To clean up seeded data:

```bash
npm run seed:firestore:cleanup
```

## 🔧 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run build:dev` - Build for development
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build
- `npm run seed:firestore` - Seed Firestore with sample data
- `npm run seed:firestore:cleanup` - Clean up seeded data

## 🌐 API Integration

### Firebase Firestore Collections

- `users` - User profiles, settings, and analytics
- `users/{uid}/postureSessions` - Posture session data
- `users/{uid}/eyeStrainSessions` - Eye strain session data
- `users/{uid}/devices` - Registered hardware devices

### Hardware API Endpoints

- `/connect` - Connect to hardware device
- `/calibrate` - Start calibration sequence
- `/start` - Begin a session
- `/stop` - End current session
- `/vibrate` - Trigger haptic feedback
- `/stream` - Get real-time metrics
- `/rsi` - Get RSI analytics
- `/telemetry/events` - Get telemetry events

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Commit your changes (`git commit -m 'Add amazing feature'`)
5. Push to the branch (`git push origin feature/amazing-feature`)
6. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🎓 About Team 777777

Built during Nathacks 2025, Ergonomiq aims to revolutionize workplace wellness by combining AI-powered computer vision with hardware sensors to create an all-in-one ergonomic monitoring solution.

---
Made with ❤️ by Team 777777 for Nathacks 2025