from pathlib import Path

import numpy as np
import pandas as pd

from training.config import PipelineConfig
from training.ids_model import HybridIDSModel


class CustomInputRunner:
    def __init__(self, config: PipelineConfig | None = None) -> None:
        self.config = config or PipelineConfig()
        self.config.ensure_directories()
        self.model_path = self.config.model_dir / "robust_ids.pt"

    def _log(self, message: str) -> None:
        print(f"[custom-input] {message}")

    def _load_feature_names(self) -> list[str]:
        return self.config.feature_names_path.read_text(encoding="utf-8").splitlines()

    def ensure_sample_input(self) -> Path:
        template_path = self.config.custom_input_dir / "sample_custom_input.csv"
        if template_path.exists():
            return template_path

        feature_names = self._load_feature_names()
        sample_frame = pd.read_csv(self.config.split_dir / "X_test.csv").head(5)
        sample_frame = sample_frame.loc[:, feature_names]
        sample_frame.to_csv(template_path, index=False)
        self._log(f"Created sample custom input at {template_path}")
        return template_path

    def _align_features(self, frame: pd.DataFrame, feature_names: list[str]) -> pd.DataFrame:
        aligned = frame.copy()
        for column in feature_names:
            if column not in aligned.columns:
                aligned[column] = 0.0
        aligned = aligned.loc[:, feature_names]
        for column in aligned.columns:
            aligned[column] = pd.to_numeric(aligned[column], errors="coerce").fillna(0.0).astype(np.float32)
        return aligned

    def run(self) -> list[Path]:
        feature_names = self._load_feature_names()
        self.ensure_sample_input()
        model = HybridIDSModel.load(self.model_path, device=self.config.device)
        output_paths: list[Path] = []

        for input_path in sorted(self.config.custom_input_dir.glob("*.csv")):
            frame = pd.read_csv(input_path)
            aligned = self._align_features(frame, feature_names)
            tabular_predictions, sequence_predictions = model.score_custom_rows(
                aligned.to_numpy(dtype=np.float32),
                sequence_length=self.config.sequence_length,
            )

            scored_frame = aligned.copy()
            scored_frame["predicted_binary_label"] = tabular_predictions.labels
            scored_frame["attack_probability"] = np.round(tabular_predictions.probabilities, 6)
            scored_output = self.config.custom_output_dir / f"{input_path.stem}_scored.csv"
            scored_frame.to_csv(scored_output, index=False)
            output_paths.append(scored_output)

            if sequence_predictions is not None:
                sequence_frame = pd.DataFrame(
                    {
                        "window_end_row": np.arange(self.config.sequence_length - 1, len(aligned)),
                        "predicted_binary_label": sequence_predictions.labels,
                        "attack_probability": np.round(sequence_predictions.probabilities, 6),
                    }
                )
                sequence_output = self.config.custom_output_dir / f"{input_path.stem}_sequence_scored.csv"
                sequence_frame.to_csv(sequence_output, index=False)
                output_paths.append(sequence_output)

            self._log(f"Processed {input_path.name}")

        return output_paths
