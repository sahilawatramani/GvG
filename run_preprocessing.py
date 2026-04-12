from __future__ import annotations

import shutil
from pathlib import Path

from preprocessing_CICIDS2017 import Preprocess
from training import PipelineConfig


def _has_preprocessing_outputs(config: PipelineConfig) -> bool:
    required_paths = (
        config.preprocessed_dir / "training_dataset.csv",
        config.split_dir / "X_train.csv",
        config.split_dir / "X_validation.csv",
        config.split_dir / "X_test.csv",
        config.split_dir / "y_train.csv",
        config.split_dir / "y_validation.csv",
        config.split_dir / "y_test.csv",
        config.sequence_dir / "sequences_train.npy",
        config.sequence_dir / "sequences_validation.npy",
        config.sequence_dir / "sequences_test.npy",
    )
    return all(path.exists() for path in required_paths)


def _mirror_dataset_if_needed(config: PipelineConfig) -> Path | None:
    target_dir = config.project_root / "datasets" / "MachineLearningCVE"
    if target_dir.exists() and any(target_dir.iterdir()):
        return target_dir

    source_dir = config.project_root / "data"
    if not source_dir.exists():
        return None

    csv_files = sorted(source_dir.glob("*.csv"))
    if not csv_files:
        return None

    target_dir.mkdir(parents=True, exist_ok=True)
    for csv_path in csv_files:
        shutil.copy2(csv_path, target_dir / csv_path.name)
    return target_dir


def run_preprocessing() -> dict[str, object]:
    config = PipelineConfig()
    if _has_preprocessing_outputs(config):
        message = f"Preprocessing outputs already exist in {config.preprocessed_dir}; skipping."
        print(f"[preprocessing] {message}")
        return {"skipped": True, "message": message, "preprocessed_dir": config.preprocessed_dir}

    mirrored_dir = _mirror_dataset_if_needed(config)
    if mirrored_dir is not None:
        print(f"[preprocessing] Mirrored raw CSVs to {mirrored_dir}")

    preprocessor = Preprocess(artifact_dir=str(config.artifact_dir), output_dir=str(config.preprocessed_dir))
    print("[preprocessing] Starting preprocessing run.")
    result = preprocessor.run()
    message = f"Preprocessing completed in {config.preprocessed_dir}."
    print(f"[preprocessing] {message}")
    return {
        "skipped": False,
        "message": message,
        "preprocessed_dir": config.preprocessed_dir,
        "dataset_dir": mirrored_dir,
        "rows": len(result) if hasattr(result, "__len__") else None,
    }


def main() -> dict[str, object]:
    return run_preprocessing()


if __name__ == "__main__":
    main()