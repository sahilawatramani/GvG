from custom_input import CustomInputRunner
from preprocessing_CICIDS2017 import Preprocess
from training import AdversarialTrainingPipeline, PipelineConfig


def main() -> None:
    config = PipelineConfig()
    preprocessor = Preprocess(artifact_dir=str(config.artifact_dir), output_dir=str(config.preprocessed_dir))
    preprocessor.run()

    pipeline = AdversarialTrainingPipeline(config)
    training_results = pipeline.run()
    print(f"[main] Metrics summary: {training_results['metrics_summary_path']}")

    custom_runner = CustomInputRunner(config)
    custom_outputs = custom_runner.run()
    print("[main] Custom input outputs:")
    for output in custom_outputs:
        print(f"  {output}")


if __name__ == "__main__":
    main()
