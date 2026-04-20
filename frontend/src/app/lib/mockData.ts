// ============================================
// GvG Defense — Default / Fallback Data
// Used as initial state before API loads, and
// as fallback values when the backend is offline.
// ============================================

export const systemStatus = {
  preprocessing: "complete",
  baselineIDS: "complete",
  cGANAttacker: "complete",
  robustIDS: "complete",
  customScoring: "ready",
  lastUpdated: new Date().toISOString(),
  threatLevel: 42,
  activeConnections: 0,
  packetsAnalyzed: 0,
};

export const quickMetrics = {
  baselineAccuracy: 0,
  robustAccuracy: 0,
  adversarialDetectionRate: 0,
  totalSamplesProcessed: 0,
  adversarialSamplesGenerated: 0,
  trainingTime: "-",
  attackSuccessRate: 0,
  modelLatency: 0,
};

export const sparklines = {
  baselineAccuracy: [] as number[],
  robustAccuracy: [] as number[],
  adversarialDetection: [] as number[],
  samplesProcessed: [] as number[],
  adversarialGenerated: [] as number[],
  attackSuccess: [] as number[],
};

export const datasetStats = {
  totalRows: 0,
  cleanedRows: 0,
  features: 0,
  sequenceLength: 10,
  classes: [] as { name: string; count: number; percentage: number; color: string }[],
  splits: { train: 0, validation: 0, test: 0 },
  featureCategories: [] as { name: string; count: number; color: string }[],
};

export const trainingHistory = {
  baseline: [] as { epoch: number; tabular_train_loss: number; sequence_train_loss: number; tabular_validation_loss: number; sequence_validation_loss: number }[],
  robust: [] as { epoch: number; tabular_train_loss: number; sequence_train_loss: number; tabular_validation_loss: number; sequence_validation_loss: number }[],
  generator: [] as { round_id: number; detection_rate: number; stealth_weight: number; generator_loss: number }[],
};

export const adversarialAnalysis = {
  generatedSamples: 0,
  rounds: [] as { round_id: number; detection_rate: number; stealth_weight: number; generator_loss: number }[],
  generatorState: null as null | { latent_dim: number; epochs: number; learning_rate: number; stealth_weight: number },
};

export const metricsData = {
  baseline: {
    accuracy: 0,
    precision: 0,
    recall: 0,
    f1: 0,
    roc_auc: 0,
    fpr: 0,
    fnr: 0,
  },
  robust: {
    accuracy: 0,
    precision: 0,
    recall: 0,
    f1: 0,
    roc_auc: 0,
    fpr: 0,
    fnr: 0,
  },
  classNames: ["BENIGN", "ATTACK"],
  confusionMatrices: {} as Record<string, { rows: string[]; cols: string[]; values: number[][] }>,
};

export const artifacts = [] as {
  id: string;
  name: string;
  type: string;
  category: string;
  size: string;
  timestamp: string;
  path: string;
}[];

export const pipelineStages = [
  {
    id: "preprocessing",
    name: "Preprocessing",
    status: "complete",
    description: "CICIDS2017 cleaning & sequencing",
    duration: "-",
    outputs: [],
  },
  {
    id: "baseline",
    name: "Baseline IDS",
    status: "complete",
    description: "Transformer-LSTM training",
    duration: "-",
    outputs: [],
  },
  {
    id: "cgan",
    name: "cGAN Attacker",
    status: "complete",
    description: "Adversarial generation",
    duration: "-",
    outputs: [],
  },
  {
    id: "robust",
    name: "Robust IDS",
    status: "complete",
    description: "Adversarial retraining",
    duration: "-",
    outputs: [],
  },
  {
    id: "evaluation",
    name: "Evaluation",
    status: "complete",
    description: "Metrics & comparison",
    duration: "-",
    outputs: [],
  },
  {
    id: "scoring",
    name: "Custom Scoring",
    status: "ready",
    description: "Upload & predict",
    duration: "-",
    outputs: [],
  },
];
