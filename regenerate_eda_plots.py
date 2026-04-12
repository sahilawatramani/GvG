from __future__ import annotations

from pathlib import Path

import pandas as pd

try:
    import matplotlib.pyplot as plt
    from matplotlib.ticker import FuncFormatter, MaxNLocator
except ImportError:  # pragma: no cover - optional dependency
    plt = None
    FuncFormatter = None
    MaxNLocator = None


PROJECT_ROOT = Path(__file__).resolve().parent
EDA_DIR = PROJECT_ROOT / "artifacts" / "eda"
PLOT_DIR = EDA_DIR / "plots"


def _format_thousands(value: float, _position: int | None = None) -> str:
    return f"{value:,.0f}"


def _format_compact(value: float) -> str:
    absolute_value = abs(float(value))
    if absolute_value >= 1_000_000_000:
        return f"{value / 1_000_000_000:.1f}B"
    if absolute_value >= 1_000_000:
        return f"{value / 1_000_000:.1f}M"
    if absolute_value >= 1_000:
        return f"{value / 1_000:.1f}K"
    if absolute_value >= 100:
        return f"{value:.0f}"
    return f"{value:.1f}"


def _annotate_bars(axis, bars, formatter=lambda value: f"{value:,.0f}", offset: float = 0.01) -> None:
    y_max = max((bar.get_height() for bar in bars), default=0.0)
    for bar in bars:
        height = float(bar.get_height())
        if height <= 0:
            continue
        axis.text(
            bar.get_x() + bar.get_width() / 2,
            height + (y_max * offset if y_max else offset),
            formatter(height),
            ha="center",
            va="bottom",
            fontsize=9,
            rotation=0,
        )


def _save_label_distribution(label_distribution: pd.DataFrame) -> Path:
    plot_path = PLOT_DIR / "label_distribution.png"
    figure, axis = plt.subplots(figsize=(12, 7))
    ordered = label_distribution.sort_values("count", ascending=False).reset_index(drop=True)
    bars = axis.bar(ordered["label"], ordered["count"], color="#c44e52", width=0.72)
    axis.set_title("Label Distribution", fontsize=15, fontweight="bold")
    axis.set_xlabel("Label", fontsize=12)
    axis.set_ylabel("Count", fontsize=12)
    axis.set_ylim(0, ordered["count"].max() * 1.18)
    axis.yaxis.set_major_formatter(FuncFormatter(_format_thousands))
    axis.yaxis.set_major_locator(MaxNLocator(nbins=8, integer=True))
    axis.grid(axis="y", linestyle="--", alpha=0.3)
    axis.tick_params(axis="x", rotation=30)
    _annotate_bars(axis, bars, formatter=lambda value: f"{int(value):,}", offset=0.015)
    figure.tight_layout()
    figure.savefig(plot_path, dpi=250, bbox_inches="tight")
    plt.close(figure)
    return plot_path


def _save_missing_values(null_counts: pd.DataFrame) -> Path:
    plot_path = PLOT_DIR / "missing_values.png"
    figure, axis = plt.subplots(figsize=(13, 7))
    non_zero = null_counts.loc[null_counts["null_count"] > 0].sort_values("null_count", ascending=False).head(20)
    if non_zero.empty:
        axis.text(
            0.5,
            0.5,
            "No missing values were found in the dataset.",
            ha="center",
            va="center",
            fontsize=14,
            fontweight="bold",
            transform=axis.transAxes,
        )
        axis.set_axis_off()
    else:
        bars = axis.barh(non_zero["column"], non_zero["null_count"], color="#4c72b0", height=0.72)
        axis.set_title("Top Columns by Missing Values", fontsize=15, fontweight="bold")
        axis.set_xlabel("Null Count", fontsize=12)
        axis.set_ylabel("Column", fontsize=12)
        axis.xaxis.set_major_formatter(FuncFormatter(_format_thousands))
        axis.xaxis.set_major_locator(MaxNLocator(nbins=8, integer=True))
        axis.grid(axis="x", linestyle="--", alpha=0.3)
        axis.set_xlim(0, non_zero["null_count"].max() * 1.15)
        for bar in bars:
            width = float(bar.get_width())
            axis.text(width + max(non_zero["null_count"].max() * 0.01, 1), bar.get_y() + bar.get_height() / 2, f"{int(width):,}", va="center", fontsize=9)
    figure.tight_layout()
    figure.savefig(plot_path, dpi=250, bbox_inches="tight")
    plt.close(figure)
    return plot_path


def _save_top_variance(numeric_summary: pd.DataFrame) -> Path:
    plot_path = PLOT_DIR / "top_feature_variance.png"
    variance_series = numeric_summary["std"].sort_values(ascending=False).head(15)
    figure, axis = plt.subplots(figsize=(13, 7))
    bars = axis.bar(variance_series.index, variance_series.values, color="#55a868", width=0.72)
    axis.set_title("Top Numeric Features by Standard Deviation", fontsize=15, fontweight="bold")
    axis.set_xlabel("Feature", fontsize=12)
    axis.set_ylabel("Standard Deviation", fontsize=12)
    axis.set_yscale("log")
    axis.yaxis.set_major_formatter(FuncFormatter(lambda value, _position: _format_compact(value)))
    axis.grid(axis="y", linestyle="--", alpha=0.3, which="both")
    axis.tick_params(axis="x", rotation=40)
    axis.set_ylim(bottom=max(float(variance_series.min()) * 0.75, 0.1))
    y_max = max(float(variance_series.max()), 1.0)
    for index, bar in enumerate(bars):
        height = float(bar.get_height())
        label_y = height * (1.03 if index % 2 == 0 else 1.08)
        axis.text(
            bar.get_x() + bar.get_width() / 2,
            label_y,
            _format_compact(height),
            ha="center",
            va="bottom",
            fontsize=9,
            rotation=0,
        )
    axis.set_ylim(top=y_max * 1.25)
    figure.tight_layout()
    figure.savefig(plot_path, dpi=250, bbox_inches="tight")
    plt.close(figure)
    return plot_path


def _save_correlation_heatmap(numeric_summary: pd.DataFrame) -> Path | None:
    variance_series = numeric_summary["std"].sort_values(ascending=False).head(15)
    selected_columns = variance_series.index.tolist()
    if len(selected_columns) < 2:
        return None

    numeric_source = pd.read_csv(EDA_DIR / "numeric_summary.csv", index_col=0)
    frame = pd.DataFrame(index=selected_columns)
    for column in selected_columns:
        frame[column] = numeric_source.loc[column, "mean"] if column in numeric_source.index else 0.0

    # Rebuild a more useful correlation plot from the preprocessed raw feature file instead of
    # the summary table alone, using the same high-variance feature subset.
    training_dataset = PROJECT_ROOT / "preprocessed" / "training_dataset.csv"
    if not training_dataset.exists():
        return None

    raw_frame = pd.read_csv(training_dataset)
    feature_frame = raw_frame.loc[:, [column for column in selected_columns if column in raw_frame.columns]]
    if feature_frame.shape[1] < 2:
        return None

    correlation = feature_frame.corr()
    plot_path = PLOT_DIR / "correlation_heatmap.png"
    figure, axis = plt.subplots(figsize=(13, 11))
    image = axis.imshow(correlation, cmap="coolwarm", aspect="auto", vmin=-1, vmax=1)
    axis.set_title("Correlation Heatmap", fontsize=15, fontweight="bold")
    axis.set_xticks(range(len(correlation.columns)))
    axis.set_xticklabels(correlation.columns, rotation=90, fontsize=8)
    axis.set_yticks(range(len(correlation.index)))
    axis.set_yticklabels(correlation.index, fontsize=8)
    colorbar = figure.colorbar(image, ax=axis, fraction=0.046, pad=0.04)
    colorbar.set_label("Correlation", fontsize=11)

    for row_index in range(correlation.shape[0]):
        for column_index in range(correlation.shape[1]):
            value = float(correlation.iat[row_index, column_index])
            axis.text(
                column_index,
                row_index,
                f"{value:.2f}",
                ha="center",
                va="center",
                fontsize=6,
                color="black" if abs(value) < 0.65 else "white",
            )

    figure.tight_layout()
    figure.savefig(plot_path, dpi=250, bbox_inches="tight")
    plt.close(figure)
    return plot_path


def regenerate_eda_plots() -> list[Path]:
    if plt is None:
        raise RuntimeError("matplotlib is required to regenerate EDA plots.")

    PLOT_DIR.mkdir(parents=True, exist_ok=True)
    label_distribution = pd.read_csv(EDA_DIR / "label_distribution.csv")
    null_counts = pd.read_csv(EDA_DIR / "null_counts.csv")
    numeric_summary = pd.read_csv(EDA_DIR / "numeric_summary.csv", index_col=0)

    created_paths = [
        _save_label_distribution(label_distribution),
        _save_missing_values(null_counts),
        _save_top_variance(numeric_summary),
    ]

    heatmap_path = _save_correlation_heatmap(numeric_summary)
    if heatmap_path is not None:
        created_paths.append(heatmap_path)

    return created_paths


def main() -> None:
    created_paths = regenerate_eda_plots()
    print("Regenerated EDA plots:")
    for path in created_paths:
        print(f"  {path}")


if __name__ == "__main__":
    main()