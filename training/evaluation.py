import json
from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score,
    roc_auc_score,
)

from .ids_model import PredictionBundle


class MetricsRecorder:
    def __init__(self, artifact_dir: Path) -> None:
        self.artifact_dir = artifact_dir
        self.artifact_dir.mkdir(parents=True, exist_ok=True)

    def evaluate_binary(
        self,
        split_name: str,
        stage_name: str,
        y_true: np.ndarray,
        predictions: PredictionBundle,
    ) -> dict[str, float | str]:
        tn, fp, fn, tp = confusion_matrix(y_true, predictions.labels, labels=[0, 1]).ravel()
        try:
            roc_auc = float(roc_auc_score(y_true, predictions.probabilities))
        except ValueError:
            roc_auc = float("nan")
        metrics = {
            "split": split_name,
            "stage": stage_name,
            "accuracy": float(accuracy_score(y_true, predictions.labels)),
            "precision": float(precision_score(y_true, predictions.labels, zero_division=0)),
            "recall": float(recall_score(y_true, predictions.labels, zero_division=0)),
            "f1": float(f1_score(y_true, predictions.labels, zero_division=0)),
            "roc_auc": roc_auc,
            "false_positive_rate": float(fp / max(fp + tn, 1)),
            "false_negative_rate": float(fn / max(fn + tp, 1)),
        }

        prefix = f"{stage_name}_{split_name}"
        report = classification_report(y_true, predictions.labels, zero_division=0, output_dict=True)
        confusion = pd.DataFrame(
            confusion_matrix(y_true, predictions.labels, labels=[0, 1]),
            index=["actual_0", "actual_1"],
            columns=["pred_0", "pred_1"],
        )

        (self.artifact_dir / f"{prefix}_metrics.json").write_text(
            json.dumps(metrics, indent=2),
            encoding="utf-8",
        )
        (self.artifact_dir / f"{prefix}_classification_report.json").write_text(
            json.dumps(report, indent=2),
            encoding="utf-8",
        )
        confusion.to_csv(self.artifact_dir / f"{prefix}_confusion_matrix.csv")
        return metrics

    def save_summary(self, rows: list[dict[str, float | str]]) -> None:
        summary_frame = pd.DataFrame(rows)
        summary_frame.to_csv(self.artifact_dir / "metrics_summary.csv", index=False)
