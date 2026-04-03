import pickle
from dataclasses import dataclass
from pathlib import Path

import numpy as np
import pandas as pd

from .config import PipelineConfig


@dataclass
class PreprocessedDataBundle:
    feature_names: list[str]
    label_names: list[str]
    x_train: np.ndarray
    x_validation: np.ndarray
    x_test: np.ndarray
    y_train_binary: np.ndarray
    y_validation_binary: np.ndarray
    y_test_binary: np.ndarray
    y_train_multiclass: np.ndarray
    y_validation_multiclass: np.ndarray
    y_test_multiclass: np.ndarray
    sequences_train: np.ndarray
    sequences_validation: np.ndarray
    sequences_test: np.ndarray
    sequence_y_train_binary: np.ndarray
    sequence_y_validation_binary: np.ndarray
    sequence_y_test_binary: np.ndarray
    sequence_y_train_multiclass: np.ndarray
    sequence_y_validation_multiclass: np.ndarray
    sequence_y_test_multiclass: np.ndarray


class PreprocessedDataLoader:
    def __init__(self, config: PipelineConfig) -> None:
        self.config = config

    def _load_csv(self, path: Path) -> np.ndarray:
        return pd.read_csv(path).to_numpy(dtype=np.float32)

    def _load_label_csv(self, path: Path) -> tuple[np.ndarray, np.ndarray]:
        frame = pd.read_csv(path)
        multiclass = frame["label_multiclass"].to_numpy(dtype=np.int32)
        binary = frame["label_binary"].to_numpy(dtype=np.int8)
        return multiclass, binary

    def load(self) -> PreprocessedDataBundle:
        feature_names = self.config.feature_names_path.read_text(encoding="utf-8").splitlines()
        with self.config.label_encoder_path.open("rb") as file_obj:
            label_encoder = pickle.load(file_obj)

        y_train_multiclass, y_train_binary = self._load_label_csv(self.config.split_dir / "y_train.csv")
        y_validation_multiclass, y_validation_binary = self._load_label_csv(
            self.config.split_dir / "y_validation.csv"
        )
        y_test_multiclass, y_test_binary = self._load_label_csv(self.config.split_dir / "y_test.csv")

        return PreprocessedDataBundle(
            feature_names=feature_names,
            label_names=label_encoder.classes_.tolist(),
            x_train=self._load_csv(self.config.split_dir / "X_train.csv"),
            x_validation=self._load_csv(self.config.split_dir / "X_validation.csv"),
            x_test=self._load_csv(self.config.split_dir / "X_test.csv"),
            y_train_binary=y_train_binary,
            y_validation_binary=y_validation_binary,
            y_test_binary=y_test_binary,
            y_train_multiclass=y_train_multiclass,
            y_validation_multiclass=y_validation_multiclass,
            y_test_multiclass=y_test_multiclass,
            sequences_train=np.load(self.config.sequence_dir / "sequences_train.npy"),
            sequences_validation=np.load(self.config.sequence_dir / "sequences_validation.npy"),
            sequences_test=np.load(self.config.sequence_dir / "sequences_test.npy"),
            sequence_y_train_binary=np.load(self.config.sequence_dir / "sequence_labels_train_binary.npy"),
            sequence_y_validation_binary=np.load(
                self.config.sequence_dir / "sequence_labels_validation_binary.npy"
            ),
            sequence_y_test_binary=np.load(self.config.sequence_dir / "sequence_labels_test_binary.npy"),
            sequence_y_train_multiclass=np.load(
                self.config.sequence_dir / "sequence_labels_train_multiclass.npy"
            ),
            sequence_y_validation_multiclass=np.load(
                self.config.sequence_dir / "sequence_labels_validation_multiclass.npy"
            ),
            sequence_y_test_multiclass=np.load(
                self.config.sequence_dir / "sequence_labels_test_multiclass.npy"
            ),
        )
