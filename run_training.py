from __future__ import annotations

from training import AdversarialTrainingPipeline, PipelineConfig


def _has_training_outputs(config: PipelineConfig) -> bool:
    required_paths = (
        config.model_dir / "robust_ids.pt",
        config.training_artifact_dir / "metrics_summary.csv",
        config.training_artifact_dir / "final_report.csv",
        config.training_artifact_dir / "training_manifest.json",
    )
    return all(path.exists() for path in required_paths) and any(config.training_artifact_dir.iterdir())


def run_training() -> dict[str, object]:
    config = PipelineConfig()
    config.ensure_directories()

    if _has_training_outputs(config):
        message = f"Training outputs already exist in {config.training_artifact_dir}; skipping."
        print(f"[training] {message}")
        return {"skipped": True, "message": message, "training_artifact_dir": config.training_artifact_dir}

    pipeline = AdversarialTrainingPipeline(config)
    print("[training] Starting training pipeline.")
    results = pipeline.run()
    message = f"Training completed; artifacts saved to {config.training_artifact_dir}."
    print(f"[training] {message}")
    return {
        "skipped": False,
        "message": message,
        "training_artifact_dir": config.training_artifact_dir,
        "results": results,
    }


def main() -> dict[str, object]:
    return run_training()


if __name__ == "__main__":
    main()