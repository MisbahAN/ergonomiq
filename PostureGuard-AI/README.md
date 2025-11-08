# PostureGuard AI

> Real-time posture monitoring and analysis using AI-powered pose detection

PostureGuard AI is an intelligent posture detection application that helps you maintain healthy sitting habits by providing real-time feedback on your posture using advanced computer vision and machine learning techniques.

## 🌟 Features

- **Real-Time Pose Detection**: Live posture analysis using MediaPipe Tasks Vision
- **Comprehensive Metrics**: Track neck angle, trunk flexion, elbow position, knee angle, and more
- **Smart Smoothing**: Advanced filtering algorithms reduce noise for stable readings
- **Visual Feedback**: Live skeleton overlay and color-coded status indicators
- **Privacy-First**: All processing happens locally in your browser - no data leaves your device
- **Multi-Camera Support**: Choose from available cameras with automatic device detection
- **Responsive Design**: Works on desktop and mobile devices
- **Dark/Light Theme**: Toggle between themes for comfortable usage

## 🏗️ Project Structure

```
PostureGuard-AI/
├── app/                      # Next.js 14 App Router
│   ├── layout.tsx           # Root layout with theme provider
│   └── page.tsx             # Main application page
├── components/              # React components
│   ├── ui/                  # shadcn/ui components
│   │   ├── badge.tsx
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   ├── select.tsx
│   │   └── separator.tsx
│   ├── PoseDetection.tsx    # Core pose detection component
│   ├── PostureAnalyzer.tsx  # Posture analysis and metrics display
│   ├── mode-toggle.tsx      # Dark/light theme toggle
│   └── theme-provider.tsx   # Theme context provider
├── lib/                     # Utility libraries
│   ├── poseUtils.ts         # Pose analysis algorithms and utilities
│   └── utils.ts             # General utilities (cn function)
├── styles/                  # Global styles
│   └── globals.css          # Tailwind CSS and custom styles
├── workers/                 # Web Workers (if needed)
│   └── poseWorker.ts        # Pose processing worker
├── public/                  # Static assets
│   └── favicon.ico
└── config files             # Configuration files
    ├── next.config.js       # Next.js configuration
    ├── tailwind.config.js   # Tailwind CSS configuration
    ├── tsconfig.json        # TypeScript configuration
    ├── postcss.config.js    # PostCSS configuration
    └── components.json      # shadcn/ui configuration
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ (LTS recommended)
- npm or yarn package manager
- A modern web browser with camera support
- HTTPS connection (required for camera access)

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/your-username/PostureGuard-AI.git
   cd PostureGuard-AI
   ```

2. **Install dependencies**

   ```bash
   npm install
   # or
   yarn install
   ```

3. **Run the development server**

   ```bash
   npm run dev
   # or
   yarn dev
   ```

4. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

### Production Build

```bash
# Build the application
npm run build

# Start the production server
npm start
```

## 🎯 How It Works

### Core Technologies

1. **MediaPipe Tasks Vision**: Google's advanced pose detection model

   - Uses the heavy pose landmarker model for accuracy
   - Detects 33 3D landmarks on the human body
   - Runs entirely in the browser using WebAssembly

2. **Real-Time Analysis Engine**

   - Calculates key posture angles (neck, trunk, limbs)
   - Applies smoothing filters to reduce noise
   - Provides instant feedback on posture quality

3. **Advanced Metrics**
   - **Craniovertebral Angle (CVA)**: Head position relative to shoulders
   - **Trunk Flexion**: Spine alignment with vertical axis
   - **Pelvic Tilt**: Hip alignment and stability
   - **Elbow Angle**: Upper limb positioning
   - **Knee Angle**: Lower limb positioning
   - **Confidence Score**: Tracking quality assessment

### Usage Instructions

1. **Camera Setup**

   - Allow camera access when prompted
   - Select your preferred camera from the dropdown
   - Position yourself so your upper body is visible

2. **Start Detection**

   - Click "Start Camera" to begin video feed
   - Click "Start Detection" to begin pose analysis
   - Ensure good lighting for optimal results

3. **Monitor Your Posture**
   - Watch the real-time metrics update
   - Follow the color-coded status indicators:
     - 🟢 **Green**: Good posture
     - 🟡 **Yellow**: Needs improvement
     - 🔴 **Red**: Poor posture
   - Read the tips and recommendations provided

## 🧠 Technical Details

### Pose Analysis Pipeline

```typescript
// Core analysis flow
Camera Feed → MediaPipe Model → Pose Landmarks →
Angle Calculations → Smoothing Filters →
Classification → User Feedback
```

### Key Algorithms

- **Angle Calculation**: Vector-based angle computation between body landmarks
- **Smoothing**: Moving average and One-Euro filters for stable readings
- **Classification**: Rule-based posture assessment with configurable thresholds
- **Ergonomic Scoring**: Weighted composite score across multiple metrics

### Performance Optimizations

- Efficient landmark processing at 30 FPS
- Selective rendering to minimize GPU usage
- Smart throttling for UI updates
- Memory-efficient filter implementations

## 🛠️ Development

### Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui (Radix UI primitives)
- **AI/ML**: MediaPipe Tasks Vision
- **Build Tool**: Next.js built-in bundler

### Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

### Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 🔒 Privacy & Security

- **Local Processing**: All pose detection runs in your browser
- **No Data Collection**: Camera data never leaves your device
- **No Server Required**: Fully client-side application
- **HTTPS Enforced**: Secure camera access protocols
- **Open Source**: Transparent and auditable codebase

## 📊 Supported Metrics

| Metric        | Description                   | Optimal Range | Status    |
| ------------- | ----------------------------- | ------------- | --------- |
| Neck Angle    | Head alignment with vertical  | 0-15°         | ✅ Active |
| Trunk Flexion | Spine curvature from vertical | 0-15°         | ✅ Active |
| Elbow Angle   | Upper arm to forearm angle    | 90-110°       | ✅ Active |
| Knee Angle    | Thigh to shin angle           | 80-110°       | ✅ Active |
| Pelvic Tilt   | Hip alignment deviation       | ±10°          | ✅ Active |
| Confidence    | Landmark detection quality    | >80%          | ✅ Active |

## 🌐 Browser Compatibility

- Chrome 88+ (Recommended)
- Firefox 85+
- Safari 14+
- Edge 88+

**Note**: Camera access requires HTTPS in production environments.

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Acknowledgments

- **MediaPipe Team** for the excellent pose detection models
- **Google** for MediaPipe Tasks Vision
- **Vercel** for Next.js framework
- **shadcn** for the beautiful UI components
- **Radix UI** for accessible primitives

## 📞 Support

For questions, issues, or feature requests:

- Open an issue on GitHub
- Check existing documentation
- Review the code examples in the repository

---

Built with ❤️ for HTN 2025 • [Live Demo](https://your-domain.com) • [GitHub](https://github.com/anthonyhana04/PostureGuard-AI)
