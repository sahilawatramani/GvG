# Backend API Integration Guide

This document describes how to integrate the GvG Defense frontend with your Python backend.

## Overview

The frontend expects a RESTful API that provides:
1. System status and health checks
2. Dataset statistics
3. Training history and metrics
4. Adversarial analysis data
5. Model artifacts
6. Custom input scoring

## Base Configuration

### Environment Variables

Create a `.env` file in the project root:

```env
VITE_API_URL=http://localhost:8000
VITE_API_TIMEOUT=30000
```

### API Client Setup

Create `src/app/lib/api.ts`:

```typescript
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const API_TIMEOUT = Number(import.meta.env.VITE_API_TIMEOUT) || 30000;

async function apiRequest<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

export const api = {
  get: <T>(endpoint: string) => apiRequest<T>(endpoint),
  post: <T>(endpoint: string, data: any) =>
    apiRequest<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};
```

## Required Endpoints

### 1. System Status

**Endpoint**: `GET /api/status`

**Response**:
```json
{
  "preprocessing": "complete",
  "baselineIDS": "complete",
  "cGANAttacker": "complete",
  "robustIDS": "complete",
  "customScoring": "ready",
  "lastUpdated": "2026-04-05T14:32:00Z"
}
```

**Integration**:
```typescript
export async function fetchSystemStatus() {
  return api.get<SystemStatus>('/api/status');
}
```

### 2. Quick Metrics

**Endpoint**: `GET /api/metrics/quick`

**Response**:
```json
{
  "baselineAccuracy": 0.9542,
  "robustAccuracy": 0.9687,
  "adversarialDetectionRate": 0.8934,
  "totalSamplesProcessed": 287432,
  "adversarialSamplesGenerated": 12547,
  "trainingTime": "2h 34m"
}
```

### 3. Dataset Statistics

**Endpoint**: `GET /api/dataset/stats`

**Response**:
```json
{
  "totalRows": 2830743,
  "cleanedRows": 2830540,
  "features": 78,
  "sequenceLength": 10,
  "classes": [
    {
      "name": "BENIGN",
      "count": 2273097,
      "percentage": 80.3
    }
  ],
  "splits": {
    "train": 1981378,
    "validation": 424662,
    "test": 424500
  }
}
```

### 4. Training History

**Endpoint**: `GET /api/training/history`

**Response**:
```json
{
  "baseline": [
    {
      "epoch": 1,
      "accuracy": 0.7234,
      "loss": 0.5632,
      "val_accuracy": 0.7123,
      "val_loss": 0.5789
    }
  ],
  "robust": [...],
  "generator": [
    {
      "round": 1,
      "loss": 0.8234,
      "fooling_rate": 0.2345,
      "stealth_score": 0.3456
    }
  ]
}
```

### 5. Adversarial Analysis

**Endpoint**: `GET /api/adversarial/analysis`

**Response**:
```json
{
  "generatedSamples": 12547,
  "stealthySamples": 8934,
  "detectedByBaseline": 3456,
  "detectedByRobust": 10234,
  "avgPerturbationMagnitude": 0.0342,
  "rounds": [
    {
      "round": 1,
      "generated": 1500,
      "detected_baseline": 1234,
      "detected_robust": 1423,
      "fooling_rate": 0.2345
    }
  ]
}
```

### 6. Performance Metrics

**Endpoint**: `GET /api/metrics`

**Response**:
```json
{
  "baseline": {
    "accuracy": 0.9542,
    "precision": 0.9478,
    "recall": 0.9512,
    "f1": 0.9495,
    "roc_auc": 0.9834,
    "fpr": 0.0423,
    "fnr": 0.0488,
    "confusion_matrix": [[...]]
  },
  "robust": {...},
  "classNames": ["BENIGN", "DoS", "PortScan", "DDoS", "Infiltration"]
}
```

### 7. Custom Input Scoring

**Endpoint**: `POST /api/score`

**Request**:
```json
{
  "file": "base64_encoded_csv_content"
}
```

Or use multipart/form-data:
```typescript
const formData = new FormData();
formData.append('file', csvFile);

const response = await fetch(`${API_BASE}/api/score`, {
  method: 'POST',
  body: formData,
});
```

**Response**:
```json
{
  "totalRows": 1234,
  "sequences": 617,
  "predictions": [
    {
      "class": "BENIGN",
      "count": 892,
      "percentage": 72.3
    }
  ],
  "avgConfidence": 0.9234,
  "processingTime": "2.3s"
}
```

### 8. Artifacts List

**Endpoint**: `GET /api/artifacts`

**Response**:
```json
[
  {
    "id": "1",
    "name": "baseline_ids_checkpoint.h5",
    "type": "model",
    "category": "Baseline IDS",
    "size": "143 MB",
    "timestamp": "2026-04-05T12:45:00Z",
    "path": "/models/baseline_ids_epoch10.h5"
  }
]
```

### 9. Artifact Download

**Endpoint**: `GET /api/artifacts/:id/download`

**Response**: Binary file stream

## Usage in Components

### Example: Dashboard Page

Replace mock data import with API call:

```typescript
import { useEffect, useState } from 'react';
import { fetchSystemStatus, fetchQuickMetrics } from '../lib/api';

export function Dashboard() {
  const [status, setStatus] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetchSystemStatus(),
      fetchQuickMetrics(),
    ])
      .then(([statusData, metricsData]) => {
        setStatus(statusData);
        setMetrics(metricsData);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;
  if (!status || !metrics) return <ErrorState />;

  // Render with real data
  return (
    <div>
      <MetricCard
        label="Baseline Accuracy"
        value={(metrics.baselineAccuracy * 100).toFixed(2) + "%"}
        icon={Target}
      />
      {/* ... */}
    </div>
  );
}
```

### Example: Custom Input Scoring

```typescript
async function handleFileUpload(file: File) {
  setIsScoring(true);

  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE}/api/score`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Scoring failed');
    }

    const results = await response.json();
    setResults(results);
  } catch (error) {
    console.error('Scoring error:', error);
    // Show error to user
  } finally {
    setIsScoring(false);
  }
}
```

## Error Handling

Implement consistent error handling:

```typescript
export class APIError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    message?: string
  ) {
    super(message || `API Error: ${status} ${statusText}`);
  }
}

// In your API client
if (!response.ok) {
  throw new APIError(response.status, response.statusText);
}

// In your components
try {
  const data = await fetchData();
} catch (error) {
  if (error instanceof APIError) {
    if (error.status === 404) {
      // Handle not found
    } else if (error.status === 500) {
      // Handle server error
    }
  }
}
```

## Loading States

Show loading indicators while fetching:

```typescript
function MyPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchData()
      .then(setData)
      .catch(setError)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorState error={error} />;
  if (!data) return <EmptyState />;

  return <div>{/* Render data */}</div>;
}
```

## WebSocket Support (Optional)

For real-time updates during training:

```typescript
// src/app/lib/websocket.ts
export class TrainingSocket {
  private ws: WebSocket;

  constructor() {
    this.ws = new WebSocket('ws://localhost:8000/ws/training');
    this.ws.onmessage = this.handleMessage;
  }

  handleMessage = (event: MessageEvent) => {
    const data = JSON.parse(event.data);
    // Emit custom event or use state management
    window.dispatchEvent(new CustomEvent('training-update', { detail: data }));
  };

  close() {
    this.ws.close();
  }
}

// In component
useEffect(() => {
  const socket = new TrainingSocket();
  
  const handleUpdate = (event: CustomEvent) => {
    setTrainingData(event.detail);
  };

  window.addEventListener('training-update', handleUpdate);

  return () => {
    socket.close();
    window.removeEventListener('training-update', handleUpdate);
  };
}, []);
```

## Testing API Integration

### Mock API Server

For development, create a simple mock server:

```bash
npm install -D json-server
```

Create `db.json`:
```json
{
  "status": {...},
  "metrics": {...},
  "dataset": {...}
}
```

Run mock server:
```bash
npx json-server --watch db.json --port 8000
```

### Testing

```typescript
// Test API integration
describe('API Integration', () => {
  test('fetches system status', async () => {
    const status = await fetchSystemStatus();
    expect(status.preprocessing).toBe('complete');
  });
});
```

## CORS Configuration

Ensure your Python backend allows CORS:

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Vite dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

## Rate Limiting

Implement client-side rate limiting:

```typescript
class RateLimiter {
  private lastCall = 0;
  private minInterval = 1000; // 1 second

  async throttle<T>(fn: () => Promise<T>): Promise<T> {
    const now = Date.now();
    const timeSinceLastCall = now - this.lastCall;

    if (timeSinceLastCall < this.minInterval) {
      await new Promise(resolve =>
        setTimeout(resolve, this.minInterval - timeSinceLastCall)
      );
    }

    this.lastCall = Date.now();
    return fn();
  }
}
```

## Caching

Implement simple caching:

```typescript
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 60000; // 1 minute

export async function fetchWithCache<T>(
  key: string,
  fetcher: () => Promise<T>
): Promise<T> {
  const cached = cache.get(key);
  
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  const data = await fetcher();
  cache.set(key, { data, timestamp: Date.now() });
  return data;
}
```

## Security Considerations

1. **Authentication**: Add JWT tokens to headers
2. **Input Validation**: Validate all user inputs
3. **File Upload**: Limit file sizes and types
4. **Error Messages**: Don't expose sensitive information
5. **HTTPS**: Use HTTPS in production

## Deployment

When deploying, configure:

1. Production API URL in environment variables
2. Proper CORS settings
3. API rate limits
4. Error monitoring (e.g., Sentry)
5. Analytics (optional)

## Support

For backend-specific questions, refer to your Python backend documentation.
