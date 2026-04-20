from __future__ import annotations

import csv
import json
import os
from pathlib import Path
from typing import Any

import numpy as np
import pandas as pd

try:  # pragma: no cover - optional dependency
    from fastapi import FastAPI, HTTPException
    from fastapi.middleware.cors import CORSMiddleware
    from fastapi.responses import FileResponse
except ImportError:  # pragma: no cover - keep the module importable without FastAPI installed
    FastAPI = None
    HTTPException = RuntimeError
    CORSMiddleware = None
    FileResponse = None

from custom_input import CustomInputRunner
from training import PipelineConfig
from training.ids_model import HybridIDSModel


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _require_ready_artifacts(config: PipelineConfig) -> None:
    """Check only the artifacts that are truly required for prediction."""
    required_paths = (
        config.feature_names_path,
        config.model_dir / "robust_ids.pt",
    )
    missing = [path for path in required_paths if not path.exists()]
    if missing:
        joined = ", ".join(str(path) for path in missing)
        raise HTTPException(status_code=503, detail=f"Model artifacts are not ready: {joined}")


def _payload_to_frame(payload: Any) -> pd.DataFrame:
    if isinstance(payload, dict):
        return pd.DataFrame([payload])
    if isinstance(payload, list) and payload and all(isinstance(row, dict) for row in payload):
        return pd.DataFrame(payload)
    raise HTTPException(status_code=400, detail="Request body must be a JSON object or a non-empty list of objects.")


def _score_frame(frame: pd.DataFrame) -> dict[str, Any]:
    config = PipelineConfig()
    _require_ready_artifacts(config)

    runner = CustomInputRunner(config)
    feature_names = runner._load_feature_names()
    aligned = runner._align_features(frame, feature_names)

    model = HybridIDSModel.load(config.model_dir / "robust_ids.pt", device=config.device)
    tabular_predictions, sequence_predictions = model.score_custom_rows(
        aligned.to_numpy(dtype="float32"),
        sequence_length=config.sequence_length,
    )

    response: dict[str, Any] = {
        "input_rows": int(len(aligned)),
        "tabular_predictions": [
            {
                "row": int(index),
                "predicted_binary_label": int(label),
                "attack_probability": float(probability),
            }
            for index, (label, probability) in enumerate(zip(tabular_predictions.labels, tabular_predictions.probabilities))
        ],
        "sequence_predictions": None,
    }

    if sequence_predictions is not None:
        response["sequence_predictions"] = [
            {
                "window_end_row": int(index + config.sequence_length - 1),
                "predicted_binary_label": int(label),
                "attack_probability": float(probability),
            }
            for index, (label, probability) in enumerate(zip(sequence_predictions.labels, sequence_predictions.probabilities))
        ]

    return response


def _safe_float(value: Any) -> float | None:
    """Convert a value to float, returning None for NaN/Inf/missing."""
    if value is None:
        return None
    try:
        f = float(value)
        if np.isnan(f) or np.isinf(f):
            return None
        return f
    except (ValueError, TypeError):
        return None


def _read_json(path: Path) -> Any:
    """Read a JSON file, replacing NaN literals."""
    text = path.read_text(encoding="utf-8")
    text = text.replace("NaN", "null")
    return json.loads(text)


# ---------------------------------------------------------------------------
# App
# ---------------------------------------------------------------------------

if FastAPI is not None:
    app = FastAPI(title="GvG IDS API", version="1.0.0")
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # ------------------------------------------------------------------
    # Core endpoints
    # ------------------------------------------------------------------

    @app.get("/")
    def health_check() -> dict[str, str]:
        return {"status": "ok", "service": "gvg-ids-api"}

    @app.post("/predict")
    def predict(payload: Any) -> dict[str, Any]:
        frame = _payload_to_frame(payload)
        return _score_frame(frame)

    # ------------------------------------------------------------------
    # Artifact endpoints — serve real training data to the frontend
    # ------------------------------------------------------------------

    @app.get("/artifacts/manifest")
    def get_manifest() -> dict[str, Any]:
        """Training manifest: feature count, row counts, label names, hyperparams."""
        config = PipelineConfig()
        manifest_path = config.training_artifact_dir / "training_manifest.json"
        if not manifest_path.exists():
            raise HTTPException(status_code=404, detail="Training manifest not found")
        return _read_json(manifest_path)

    @app.get("/artifacts/metrics")
    def get_metrics() -> dict[str, Any]:
        """All evaluation metrics from individual JSON files, grouped by stage."""
        config = PipelineConfig()
        training_dir = config.training_artifact_dir
        if not training_dir.exists():
            raise HTTPException(status_code=404, detail="Training artifacts not found")

        metrics: list[dict[str, Any]] = []
        for json_path in sorted(training_dir.glob("*_metrics.json")):
            data = _read_json(json_path)
            # Sanitise floats
            for key in list(data.keys()):
                if isinstance(data[key], float):
                    data[key] = _safe_float(data[key])
            metrics.append(data)

        # Also parse the summary CSV for a flat view
        summary_path = training_dir / "metrics_summary.csv"
        summary_rows: list[dict[str, Any]] = []
        if summary_path.exists():
            with open(summary_path, encoding="utf-8") as f:
                reader = csv.DictReader(f)
                for row in reader:
                    cleaned: dict[str, Any] = {}
                    for k, v in row.items():
                        cleaned[k] = _safe_float(v) if k not in ("split", "stage") else v
                    summary_rows.append(cleaned)

        return {"individual": metrics, "summary": summary_rows}

    @app.get("/artifacts/training-history")
    def get_training_history() -> dict[str, Any]:
        """Training loss curves for baseline and robust models."""
        config = PipelineConfig()
        training_dir = config.training_artifact_dir
        result: dict[str, Any] = {}

        for stage in ("baseline", "robust"):
            csv_path = training_dir / f"{stage}_training_history.csv"
            if csv_path.exists():
                df = pd.read_csv(csv_path)
                epochs: list[dict[str, Any]] = []
                for i, row in df.iterrows():
                    epoch: dict[str, Any] = {"epoch": int(i) + 1}
                    for col in df.columns:
                        epoch[col] = _safe_float(row[col])
                    epochs.append(epoch)
                result[stage] = epochs

        if not result:
            raise HTTPException(status_code=404, detail="Training history not found")
        return result

    @app.get("/artifacts/generator")
    def get_generator() -> dict[str, Any]:
        """Generator state and feedback data."""
        config = PipelineConfig()
        training_dir = config.training_artifact_dir

        state_path = training_dir / "generator_state.json"
        feedback_path = training_dir / "generator_feedback.csv"

        result: dict[str, Any] = {}

        if state_path.exists():
            result["state"] = _read_json(state_path)

        if feedback_path.exists():
            df = pd.read_csv(feedback_path)
            result["feedback"] = df.to_dict(orient="records")

        if not result:
            raise HTTPException(status_code=404, detail="Generator data not found")
        return result

    @app.get("/artifacts/eda")
    def get_eda() -> dict[str, Any]:
        """EDA report and label distribution."""
        config = PipelineConfig()
        eda_dir = config.artifact_dir / "eda"

        result: dict[str, Any] = {}

        # EDA report text
        report_path = eda_dir / "eda_report.txt"
        if report_path.exists():
            result["report"] = report_path.read_text(encoding="utf-8")

        # Label distribution
        label_path = eda_dir / "label_distribution.csv"
        if label_path.exists():
            df = pd.read_csv(label_path)
            result["label_distribution"] = df.to_dict(orient="records")

        # Available plot filenames
        plots_dir = eda_dir / "plots"
        if plots_dir.exists():
            result["plots"] = [p.name for p in sorted(plots_dir.glob("*.png"))]

        if not result:
            raise HTTPException(status_code=404, detail="EDA data not found")
        return result

    @app.get("/artifacts/confusion-matrices")
    def get_confusion_matrices() -> dict[str, Any]:
        """All confusion matrices from CSV files."""
        config = PipelineConfig()
        training_dir = config.training_artifact_dir

        matrices: dict[str, Any] = {}
        for csv_path in sorted(training_dir.glob("*_confusion_matrix.csv")):
            key = csv_path.stem.replace("_confusion_matrix", "")
            df = pd.read_csv(csv_path, index_col=0)
            matrices[key] = {
                "rows": df.index.tolist(),
                "cols": df.columns.tolist(),
                "values": df.values.tolist(),
            }

        if not matrices:
            raise HTTPException(status_code=404, detail="Confusion matrices not found")
        return matrices

    @app.get("/artifacts/eda/plots/{filename}")
    def get_eda_plot(filename: str) -> FileResponse:
        """Serve an EDA plot image."""
        config = PipelineConfig()
        plot_path = config.artifact_dir / "eda" / "plots" / filename
        if not plot_path.exists() or not plot_path.suffix.lower() in (".png", ".jpg", ".jpeg", ".svg"):
            raise HTTPException(status_code=404, detail="Plot not found")
        return FileResponse(plot_path, media_type=f"image/{plot_path.suffix.lstrip('.')}")

else:
    app = None


def create_app() -> Any:
    if app is None:
        raise RuntimeError("FastAPI is not installed. Install fastapi and uvicorn to use app.py.")
    return app


def main() -> None:
    if app is None:
        raise RuntimeError("FastAPI is not installed. Install fastapi and uvicorn to use app.py.")
    import uvicorn

    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("app:app", host="0.0.0.0", port=port, reload=False)


if __name__ == "__main__":
    main()