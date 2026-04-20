# Development Guide

## Project Overview

GvG Defense is a research-grade frontend for a cybersecurity AI project that uses adversarial GAN training to create robust intrusion detection systems.

## Getting Started

### Prerequisites

- Node.js 18+ or compatible runtime
- npm or pnpm package manager

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## Architecture

### Frontend Stack

- **React 18.3.1**: Modern React with hooks
- **React Router 7**: Client-side routing with data mode
- **Tailwind CSS v4**: Utility-first styling
- **Recharts**: Chart and data visualization
- **Motion (Framer Motion)**: Smooth animations
- **Lucide React**: Icon library

### Directory Structure

```
src/
├── app/
│   ├── components/         # Reusable UI components
│   │   ├── AnimatedCounter.tsx
│   │   ├── EmptyState.tsx
│   │   ├── LoadingSpinner.tsx
│   │   ├── MetricCard.tsx
│   │   ├── StatusBadge.tsx
│   │   └── index.ts
│   ├── layouts/           # Page layouts
│   │   └── RootLayout.tsx
│   ├── lib/              # Utilities and data
│   │   ├── mockData.ts
│   │   └── utils.ts
│   ├── pages/            # Route pages
│   │   ├── Adversarial.tsx
│   │   ├── Architecture.tsx
│   │   ├── Artifacts.tsx
│   │   ├── CustomInput.tsx
│   │   ├── Dashboard.tsx
│   │   ├── Dataset.tsx
│   │   ├── Metrics.tsx
│   │   ├── NotFound.tsx
│   │   ├── Pipeline.tsx
│   │   └── Training.tsx
│   ├── App.tsx           # Root component
│   └── routes.tsx        # Router configuration
└── styles/
    ├── fonts.css
    ├── index.css
    ├── tailwind.css
    └── theme.css
```

## Key Features

### 1. Dashboard Page
- System status overview
- Quick metrics with animated counters
- Performance comparison charts
- Quick action links

### 2. Pipeline Visualization
- Visual representation of the ML pipeline
- Attacker vs Defender dynamics
- Stage outputs and durations

### 3. Dataset Overview
- CICIDS2017 statistics
- Interactive charts for class distribution
- Train/validation/test split visualization

### 4. Training Monitor
- Baseline IDS training history
- Robust IDS adversarial retraining
- Generator progress tracking
- Model checkpoint management

### 5. Adversarial Analysis
- Attack generation statistics
- Detection rate comparison
- Fooling rate progression
- Perturbation analysis

### 6. Metrics Dashboard
- Comprehensive performance metrics
- Confusion matrices
- Error rate analysis
- Downloadable reports

### 7. Custom Input Scoring
- CSV file upload
- Schema validation
- Real-time predictions
- Results visualization

### 8. Artifacts Explorer
- Search and filter artifacts
- Category-based organization
- Download management

### 9. Architecture Guide
- GAN-vs-GAN concept explanation
- Technical component breakdown
- Visual architecture diagram

## Design System

### Color Palette

```css
/* Primary Colors */
--cyber-graphite: #1a1d24;       /* Main background */
--cyber-graphite-dark: #0f1117;  /* Deep background */

/* Accent Colors */
--cyber-blue: #3b82f6;           /* Primary actions */
--cyber-blue-light: #0ea5e9;     /* Highlights */
--cyber-green: #10b981;          /* Success/Detection */
--cyber-ember: #ef4444;          /* Attacks/Warnings */
--cyber-steel: #4a5568;          /* Secondary elements */
```

### Typography

- Headings use default font with medium weight (500)
- Body text uses normal weight (400)
- Monospace for code snippets

### Spacing

- 4px base unit
- Consistent padding: 4, 8, 12, 16, 24, 32px
- Gap spacing: 4, 8, 16, 24px

## Component Development

### Creating a New Component

1. Create component file in `src/app/components/`
2. Export from `src/app/components/index.ts`
3. Use TypeScript for type safety
4. Follow naming convention: PascalCase

Example:

```typescript
import { motion } from "motion/react";

interface MyComponentProps {
  title: string;
  value: number;
}

export function MyComponent({ title, value }: MyComponentProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="rounded-xl border border-[#2d3139] bg-[#1a1d24] p-6"
    >
      <h3>{title}</h3>
      <p>{value}</p>
    </motion.div>
  );
}
```

### Creating a New Page

1. Create page file in `src/app/pages/`
2. Add route in `src/app/routes.tsx`
3. Add navigation item in `src/app/layouts/RootLayout.tsx`

## Data Integration

### Mock Data

The application includes mock data in `src/app/lib/mockData.ts`. This demonstrates the expected data structure from the backend.

### Backend Integration

To integrate with a real backend:

1. Create API client in `src/app/lib/api.ts`
2. Replace mock data imports with API calls
3. Add loading and error states
4. Handle authentication if needed

Example API integration:

```typescript
// src/app/lib/api.ts
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export async function fetchMetrics() {
  const response = await fetch(`${API_BASE}/api/metrics`);
  if (!response.ok) throw new Error('Failed to fetch metrics');
  return response.json();
}

// In your page component
import { useEffect, useState } from 'react';
import { fetchMetrics } from '../lib/api';

export function Metrics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMetrics()
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;
  // ... render with data
}
```

## Animation Guidelines

Use Motion (Framer Motion) for:
- Page transitions
- Card reveals
- Progress indicators
- Interactive elements

Example patterns:

```typescript
// Staggered list animation
{items.map((item, index) => (
  <motion.div
    key={item.id}
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.1 }}
  >
    {item.content}
  </motion.div>
))}

// Hover effect
<motion.div
  whileHover={{ scale: 1.02 }}
  whileTap={{ scale: 0.98 }}
>
  Click me
</motion.div>
```

## Responsive Design

- Mobile-first approach
- Breakpoints: sm (640px), md (768px), lg (1024px), xl (1280px)
- Test on multiple screen sizes
- Use Tailwind responsive prefixes: `sm:`, `md:`, `lg:`, `xl:`

## Performance Optimization

- Use React.memo for expensive components
- Implement virtualization for long lists
- Lazy load charts and heavy components
- Optimize images with proper formats and sizes

## Testing

```bash
# Run type checking
npx tsc --noEmit

# Test build
npm run build
```

## Deployment

### Environment Variables

Create `.env` file:

```env
VITE_API_URL=https://api.yourbackend.com
```

### Build and Deploy

```bash
# Build for production
npm run build

# The dist/ folder contains the production build
# Deploy to your hosting service (Vercel, Netlify, etc.)
```

## Best Practices

1. **Type Safety**: Always use TypeScript types
2. **Accessibility**: Include ARIA labels and semantic HTML
3. **Performance**: Minimize re-renders and optimize bundle size
4. **Code Quality**: Keep components focused and reusable
5. **Documentation**: Comment complex logic
6. **Consistency**: Follow established patterns

## Troubleshooting

### Common Issues

**Issue**: Charts not rendering
**Solution**: Ensure parent has defined height

**Issue**: Animations stuttering
**Solution**: Use transform properties, avoid animating layout properties

**Issue**: Dark mode not applying
**Solution**: Check that `dark` class is on root element

## Resources

- [React Documentation](https://react.dev)
- [React Router Documentation](https://reactrouter.com)
- [Tailwind CSS Documentation](https://tailwindcss.com)
- [Recharts Documentation](https://recharts.org)
- [Motion Documentation](https://motion.dev)

## Contributing

When adding features:
1. Follow existing code patterns
2. Maintain type safety
3. Update documentation
4. Test responsive behavior
5. Ensure accessibility

## Support

For questions or issues, refer to the main README.md or project documentation.
