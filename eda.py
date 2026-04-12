from __future__ import annotations

import json
from pathlib import Path
from typing import Any

import pandas as pd

try:
    import matplotlib.pyplot as plt
except ImportError:  # pragma: no cover - optional dependency
    plt = None

from training import PipelineConfig


METRIC_COLUMNS = ("accuracy", "precision", "recall", "f1", "roc_auc", "false_positive_rate", "false_negative_rate")
HISTORY_COLUMNS = (
    "tabular_train_loss",
    "sequence_train_loss",
    "tabular_validation_loss",
    "sequence_validation_loss",
)


def _load_json_metrics(training_dir: Path) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    for path in sorted(training_dir.glob("*_metrics.json")):
        try:
            payload = json.loads(path.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError):
            continue
        payload["source_file"] = path.name
        rows.append(payload)
    return rows


def _load_history_frames(training_dir: Path) -> dict[str, pd.DataFrame]:
    frames: dict[str, pd.DataFrame] = {}
    for path in sorted(training_dir.glob("*_training_history.csv")):
        try:
            frames[path.stem] = pd.read_csv(path)
        except (OSError, pd.errors.EmptyDataError):
            continue
    return frames


def _print_summary(metrics_rows: list[dict[str, Any]], summary_frame: pd.DataFrame | None) -> None:
    print("[eda] Metric summary")
    if summary_frame is not None and not summary_frame.empty:
        display_columns = [column for column in ("stage", "split", *METRIC_COLUMNS) if column in summary_frame.columns]
        print(summary_frame.loc[:, display_columns].to_string(index=False))
        print()

    if not metrics_rows:
        print("[eda] No per-split metrics JSON files were found.")
        return

    for row in metrics_rows:
        label = f"{row.get('stage', 'unknown')} / {row.get('split', 'unknown')}"
        values = ", ".join(f"{key}={row[key]:.4f}" for key in METRIC_COLUMNS if key in row and pd.notna(row[key]))
        print(f"[eda] {label}: {values}")


def _plot_histories(history_frames: dict[str, pd.DataFrame], output_dir: Path) -> list[Path]:
    if plt is None:
        print("[eda] Matplotlib is unavailable; skipping plot generation.")
        return []

    output_dir.mkdir(parents=True, exist_ok=True)
    plot_paths: list[Path] = []
    for stem, frame in history_frames.items():
        available_columns = [column for column in HISTORY_COLUMNS if column in frame.columns]
        if not available_columns:
            continue

        figure, axis = plt.subplots(figsize=(10, 6))
        for column in available_columns:
            axis.plot(frame.index + 1, frame[column], marker="o", linewidth=2, label=column)

        axis.set_title(stem.replace("_", " ").title())
        axis.set_xlabel("Epoch")
        axis.set_ylabel("Loss")
        axis.grid(True, alpha=0.3)
        axis.legend()
        figure.tight_layout()

        plot_path = output_dir / f"{stem}.png"
        figure.savefig(plot_path, dpi=200)
        plot_paths.append(plot_path)
        plt.show()
        plt.close(figure)

    return plot_paths


def _plot_metric_summary(summary_frame: pd.DataFrame, output_dir: Path) -> Path | None:
    if plt is None or summary_frame.empty:
        return None

    available_columns = [column for column in METRIC_COLUMNS if column in summary_frame.columns]
    if not available_columns:
        return None

    figure, axis = plt.subplots(figsize=(12, 6))
    x_labels = [f"{row.get('stage', 'stage')} / {row.get('split', 'split')}" for _, row in summary_frame.iterrows()]
    x_positions = list(range(len(summary_frame)))
    for column in available_columns:
        axis.plot(x_positions, summary_frame[column], marker="o", linewidth=2, label=column)

    axis.set_xticks(x_positions)
    axis.set_xticklabels(x_labels, rotation=30, ha="right")
    axis.set_title("Training Metrics Summary")
    axis.set_ylabel("Score")
    axis.grid(True, alpha=0.3)
    axis.legend(ncols=2)
    figure.tight_layout()

    output_dir.mkdir(parents=True, exist_ok=True)
    plot_path = output_dir / "metrics_summary.png"
    figure.savefig(plot_path, dpi=200)
    plt.show()
    plt.close(figure)
    return plot_path


def run_eda() -> dict[str, object]:
    config = PipelineConfig()
    training_dir = config.training_artifact_dir
    plot_dir = training_dir / "eda_plots"

    metrics_rows = _load_json_metrics(training_dir)
    summary_path = training_dir / "metrics_summary.csv"
    summary_frame: pd.DataFrame | None = None
    if summary_path.exists():
        try:
            summary_frame = pd.read_csv(summary_path)
        except (OSError, pd.errors.EmptyDataError):
            summary_frame = None

    _print_summary(metrics_rows, summary_frame)

    plot_paths: list[Path] = []
    history_frames = _load_history_frames(training_dir)
    plot_paths.extend(_plot_histories(history_frames, plot_dir))
    summary_plot = _plot_metric_summary(summary_frame, plot_dir) if summary_frame is not None else None
    if summary_plot is not None:
        plot_paths.append(summary_plot)

    if plot_paths:
        print("[eda] Saved plots:")
        for path in plot_paths:
            print(f"[eda]   {path}")
    else:
        print("[eda] No plots were generated.")

    return {
        "metrics_rows": metrics_rows,
        "summary_path": summary_path if summary_path.exists() else None,
        "plot_paths": plot_paths,
        "training_dir": training_dir,
    }


def main() -> dict[str, object]:
    return run_eda()


if __name__ == "__main__":
    main()