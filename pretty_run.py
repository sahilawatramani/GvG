from __future__ import annotations

from eda import main as eda_main
from run_preprocessing import main as preprocessing_main
from run_training import main as training_main


def _section(title: str) -> None:
    print()
    print(f"{'=' * 12} {title} {'=' * 12}")


def main() -> dict[str, object]:
    summary: dict[str, object] = {}

    _section("Preprocessing")
    summary["preprocessing"] = preprocessing_main()

    _section("Training")
    summary["training"] = training_main()

    _section("EDA")
    summary["eda"] = eda_main()

    _section("Summary")
    preprocessing_result = summary.get("preprocessing", {})
    training_result = summary.get("training", {})
    eda_result = summary.get("eda", {})
    print(f"[pretty_run] Preprocessing: {preprocessing_result.get('message', 'done')}")
    print(f"[pretty_run] Training: {training_result.get('message', 'done')}")
    print(f"[pretty_run] EDA plots: {len(eda_result.get('plot_paths', []))}")
    return summary


if __name__ == "__main__":
    main()