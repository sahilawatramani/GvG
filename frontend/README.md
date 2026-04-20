# GvG Defense: GAN-vs-GAN Intrusion Detection System

A modern, research-grade frontend dashboard for the GAN-vs-GAN adversarial training framework for intrusion detection systems.

## Overview

This application provides a comprehensive interface for researchers and security professionals to visualize, analyze, and interact with a cybersecurity AI system that uses adversarial training to create robust intrusion detection models.

### Key Features

- **Dashboard**: Real-time system status, key metrics, and performance overview
- **Pipeline Visualization**: End-to-end workflow from data preprocessing to adversarial defense
- **Dataset Explorer**: CICIDS2017 statistics, class distribution, and data splits
- **Training Monitor**: Model training history, metrics, and checkpoint management
- **Adversarial Analysis**: Attack generation statistics and detection comparison
- **Metrics Dashboard**: Comprehensive performance evaluation with confusion matrices
- **Custom Input Scoring**: Upload CSV files and get real-time predictions
- **Artifacts Explorer**: Browse and download models, visualizations, and reports
- **Architecture Guide**: Detailed explanation of the GAN-vs-GAN framework

## Technology Stack

- **React 18** with TypeScript
- **React Router 7** for navigation
- **Tailwind CSS v4** for styling
- **Recharts** for data visualization
- **Motion** (Framer Motion) for animations
- **Lucide React** for icons

## Design System

The application uses a custom cybersecurity-focused dark theme with:

- **Dark Graphite** (#1a1d24, #0f1117) - Primary backgrounds
- **Steel** (#4a5568, #6b7280) - Secondary elements
- **Signal Blue** (#3b82f6, #0ea5e9) - Primary actions and highlights
- **Cyber Green** (#10b981) - Success states and detection metrics
- **Ember** (#ef4444, #f97316) - Attack indicators and warnings

## Project Structure

```
src/app/
├── components/          # Reusable UI components
│   ├── LoadingSpinner.tsx
│   ├── MetricCard.tsx
│   └── StatusBadge.tsx
├── layouts/            # Layout components
│   └── RootLayout.tsx
├── lib/                # Utilities and data
│   ├── mockData.ts
│   └── utils.ts
├── pages/              # Route pages
│   ├── Dashboard.tsx
│   ├── Pipeline.tsx
│   ├── Dataset.tsx
│   ├── Training.tsx
│   ├── Adversarial.tsx
│   ├── Metrics.tsx
│   ├── CustomInput.tsx
│   ├── Artifacts.tsx
│   └── Architecture.tsx
├── routes.tsx          # Router configuration
└── App.tsx            # Application entry point
```

## Backend Integration

The frontend is designed to work with a Python backend that provides:

1. **Preprocessing Endpoints**: CICIDS2017 data cleaning and sequencing
2. **Training Endpoints**: Baseline and robust IDS model training
3. **Generator Endpoints**: cGAN adversarial sample generation
4. **Evaluation Endpoints**: Metrics calculation and confusion matrices
5. **Scoring Endpoint**: Custom CSV file prediction (`POST /api/score`)
6. **Artifacts Endpoints**: Model checkpoints, visualizations, and reports

### Expected API Structure

```typescript
// Example API integration points
const API_BASE = process.env.VITE_API_URL || 'http://localhost:8000';

// Endpoints
GET  /api/status              // System status
GET  /api/metrics             // Performance metrics
GET  /api/dataset/stats       // Dataset statistics
GET  /api/training/history    // Training history
GET  /api/adversarial/analysis // Adversarial analysis
POST /api/score               // Score custom CSV
GET  /api/artifacts           // List artifacts
GET  /api/artifacts/:id       // Download artifact
```

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## Mock Data

The application includes comprehensive mock data to demonstrate all features without requiring a live backend. This makes it suitable for:

- Demo presentations
- Frontend development
- UI/UX testing
- Documentation

## Features in Detail

### Dashboard
- System status overview
- Quick metrics cards
- Performance comparison charts
- Pipeline status tracking
- Quick action links

### Pipeline Visualization
- Visual workflow representation
- Stage-by-stage breakdown
- Attacker vs Defender dynamics
- Output tracking

### Dataset Overview
- Total rows and cleaning statistics
- Class distribution pie chart
- Train/validation/test split visualization
- Feature category breakdown

### Training Monitor
- Baseline IDS training curves
- Robust IDS adversarial retraining
- Generator progress tracking
- Model checkpoint summaries

### Adversarial Analysis
- Generated attack sample statistics
- Detection rate comparison
- Fooling rate progression
- Round-by-round breakdown
- Perturbation analysis

### Metrics Dashboard
- Performance comparison charts
- Error rate analysis
- Confusion matrices for baseline and robust models
- Detailed metrics table
- Downloadable reports

### Custom Input Scoring
- Drag-and-drop CSV upload
- Schema validation guidance
- Real-time prediction results
- Prediction distribution visualization
- Export functionality

### Artifacts Explorer
- Search and filter functionality
- Category and type organization
- Download management
- Storage summaries

### Architecture Guide
- GAN-vs-GAN concept explanation
- System architecture diagram
- Technical component breakdown
- Key innovations highlight

## Responsive Design

The application is fully responsive and works seamlessly across:
- Desktop (1920px+)
- Laptop (1280px+)
- Tablet (768px+)
- Mobile (375px+)

## Accessibility

- Semantic HTML structure
- ARIA labels where appropriate
- Keyboard navigation support
- High contrast color scheme
- Clear visual hierarchy

## Performance Optimizations

- Code splitting with React Router
- Lazy loading for charts
- Optimized animations with Motion
- Minimal re-renders with proper React patterns

## Future Enhancements

- Real-time WebSocket updates for training progress
- Interactive model exploration
- Advanced filtering and search
- Data export in multiple formats
- User authentication and role-based access
- Multi-language support

## License

This project is designed for research and educational purposes.

## Contact

For questions about the GAN-vs-GAN framework or this frontend implementation, please refer to the project documentation.
