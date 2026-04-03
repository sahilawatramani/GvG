from training.config import PipelineConfig

from .runner import CustomInputRunner


def main() -> None:
    config = PipelineConfig()
    runner = CustomInputRunner(config)
    outputs = runner.run()
    print("Custom input outputs:")
    for output in outputs:
        print(f"  {output}")


if __name__ == "__main__":
    main()
