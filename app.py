from __future__ import annotations

from typing import Any

import pandas as pd

try:  # pragma: no cover - optional dependency
    from fastapi import FastAPI, HTTPException
    from fastapi.middleware.cors import CORSMiddleware
except ImportError:  # pragma: no cover - keep the module importable without FastAPI installed
    FastAPI = None
    HTTPException = RuntimeError
    CORSMiddleware = None

from custom_input import CustomInputRunner
from training import PipelineConfig
from training.ids_model import HybridIDSModel


def _require_ready_artifacts(config: PipelineConfig) -> None:
    required_paths = (
        config.feature_names_path,
        config.model_dir / "robust_ids.pt",
        config.split_dir / "X_test.csv",
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


if FastAPI is not None:
    app = FastAPI(title="GvG IDS API", version="1.0.0")
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.get("/")
    def health_check() -> dict[str, str]:
        return {"status": "ok", "service": "gvg-ids-api"}

    @app.post("/predict")
    def predict(payload: Any) -> dict[str, Any]:
        frame = _payload_to_frame(payload)
        return _score_frame(frame)
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

    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=False)


if __name__ == "__main__":
    main()