from dataclasses import dataclass, field
from pathlib import Path

import torch


@dataclass
class PipelineConfig:
    project_root: Path = field(default_factory=lambda: Path(__file__).resolve().parents[1])
    preprocessed_dir: Path = field(init=False)
    split_dir: Path = field(init=False)
    sequence_dir: Path = field(init=False)
    artifact_dir: Path = field(init=False)
    training_artifact_dir: Path = field(init=False)
    generated_dir: Path = field(init=False)
    custom_input_dir: Path = field(init=False)
    custom_output_dir: Path = field(init=False)
    model_dir: Path = field(init=False)
    feature_names_path: Path = field(init=False)
    label_encoder_path: Path = field(init=False)
    sequence_length: int = 10
    random_state: int = 42
    adversarial_rounds: int = 2
    synthetic_multiplier: float = 0.75
    ids_epochs: int = 18
    gan_epochs: int = 40
    ids_learning_rate: float = 1e-3
    gan_learning_rate: float = 2e-4
    ids_batch_size: int = 64
    gan_batch_size: int = 64
    latent_dim: int = 32
    device: str = field(init=False)

    def __post_init__(self) -> None:
        self.preprocessed_dir = self.project_root / "preprocessed"
        self.split_dir = self.preprocessed_dir / "splits"
        self.sequence_dir = self.preprocessed_dir / "sequences"
        self.artifact_dir = self.project_root / "artifacts"
        self.training_artifact_dir = self.artifact_dir / "training"
        self.generated_dir = self.artifact_dir / "generated"
        self.custom_input_dir = self.project_root / "custom_input"
        self.custom_output_dir = self.artifact_dir / "custom_input"
        self.model_dir = self.artifact_dir / "models"
        self.feature_names_path = self.artifact_dir / "feature_names.txt"
        self.label_encoder_path = self.artifact_dir / "label_encoder.pkl"
        self.device = "cuda" if torch.cuda.is_available() else "cpu"

    def ensure_directories(self) -> None:
        for path in (
            self.training_artifact_dir,
            self.generated_dir,
            self.custom_input_dir,
            self.custom_output_dir,
            self.model_dir,
        ):
            path.mkdir(parents=True, exist_ok=True)
