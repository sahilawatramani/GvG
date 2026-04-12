from __future__ import annotations

import tempfile
from pathlib import Path

import pandas as pd

from custom_input import CustomInputRunner
from training import PipelineConfig


def _build_validation_frame(config: PipelineConfig) -> pd.DataFrame:
    feature_names = config.feature_names_path.read_text(encoding="utf-8").splitlines()
    rows = []
    for row_index in range(config.sequence_length):
        rows.append({name: float(row_index) for name in feature_names})
    return pd.DataFrame(rows)


def run_test_pipeline() -> dict[str, object]:
    config = PipelineConfig()
    required_paths = (
        config.feature_names_path,
        config.model_dir / "robust_ids.pt",
        config.split_dir / "X_test.csv",
    )
    missing = [path for path in required_paths if not path.exists()]
    if missing:
        print("[test] Missing artifacts:")
        for path in missing:
            print(f"[test]   {path}")
        print("[test] Run pretty_run.py first to generate preprocessing and training outputs.")
        return {"ready": False, "missing": missing}

    validation_frame = _build_validation_frame(config)

    with tempfile.TemporaryDirectory(prefix="gvg_test_") as temp_root:
        temp_root_path = Path(temp_root)
        config.custom_input_dir = temp_root_path / "custom_input"
        config.custom_output_dir = temp_root_path / "custom_output"

        runner = CustomInputRunner(config)
        request_path = config.custom_input_dir / "validation_input.csv"
        validation_frame.to_csv(request_path, index=False)
        output_paths = runner.run()

        scored_path = config.custom_output_dir / "validation_input_scored.csv"
        scored_frame = pd.read_csv(scored_path)

        print("[test] Tabular prediction preview:")
        print(scored_frame[["predicted_binary_label", "attack_probability"]].head().to_string(index=False))

        sequence_frame = None
        sequence_path = config.custom_output_dir / "validation_input_sequence_scored.csv"
        if sequence_path.exists():
            sequence_frame = pd.read_csv(sequence_path)
            print()
            print("[test] Sequence prediction preview:")
            print(sequence_frame.head().to_string(index=False))

        return {
            "ready": True,
            "tabular_output": scored_path,
            "sequence_output": sequence_path if sequence_frame is not None else None,
            "written_outputs": output_paths,
        }


def main() -> dict[str, object]:
    return run_test_pipeline()


if __name__ == "__main__":
    main()