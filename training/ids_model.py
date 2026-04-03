from dataclasses import dataclass
from pathlib import Path

import numpy as np
import torch
from torch import nn
from torch.utils.data import DataLoader, TensorDataset


@dataclass
class PredictionBundle:
    labels: np.ndarray
    probabilities: np.ndarray


class TabularIDSHead(nn.Module):
    def __init__(self, input_dim: int, dropout: float = 0.2) -> None:
        super().__init__()
        hidden_one = max(64, input_dim * 2)
        hidden_two = max(32, input_dim)
        self.network = nn.Sequential(
            nn.Linear(input_dim, hidden_one),
            nn.LayerNorm(hidden_one),
            nn.GELU(),
            nn.Dropout(dropout),
            nn.Linear(hidden_one, hidden_two),
            nn.LayerNorm(hidden_two),
            nn.GELU(),
            nn.Dropout(dropout),
            nn.Linear(hidden_two, 1),
        )

    def forward(self, features: torch.Tensor) -> torch.Tensor:
        return self.network(features).squeeze(-1)


class TransformerLSTMSequenceHead(nn.Module):
    def __init__(
        self,
        input_dim: int,
        model_dim: int = 64,
        num_heads: int = 4,
        transformer_layers: int = 2,
        lstm_hidden_dim: int = 64,
        dropout: float = 0.2,
    ) -> None:
        super().__init__()
        self.input_projection = nn.Linear(input_dim, model_dim)
        encoder_layer = nn.TransformerEncoderLayer(
            d_model=model_dim,
            nhead=num_heads,
            dim_feedforward=model_dim * 4,
            dropout=dropout,
            batch_first=True,
            activation="gelu",
        )
        self.transformer = nn.TransformerEncoder(encoder_layer, num_layers=transformer_layers)
        self.lstm = nn.LSTM(
            input_size=model_dim,
            hidden_size=lstm_hidden_dim,
            num_layers=1,
            batch_first=True,
            bidirectional=True,
        )
        self.classifier = nn.Sequential(
            nn.LayerNorm(lstm_hidden_dim * 2),
            nn.Linear(lstm_hidden_dim * 2, lstm_hidden_dim),
            nn.GELU(),
            nn.Dropout(dropout),
            nn.Linear(lstm_hidden_dim, 1),
        )

    def forward(self, sequences: torch.Tensor) -> torch.Tensor:
        projected = self.input_projection(sequences)
        encoded = self.transformer(projected)
        lstm_output, _ = self.lstm(encoded)
        pooled = lstm_output.mean(dim=1)
        return self.classifier(pooled).squeeze(-1)


class HybridIDSModel:
    def __init__(
        self,
        input_dim: int,
        sequence_length: int,
        device: str = "cpu",
        random_state: int = 42,
        learning_rate: float = 1e-3,
        batch_size: int = 64,
        epochs: int = 18,
        positive_class_weight: float = 1.0,
    ) -> None:
        torch.manual_seed(random_state)
        np.random.seed(random_state)
        self.input_dim = input_dim
        self.sequence_length = sequence_length
        self.device = torch.device(device)
        self.random_state = random_state
        self.learning_rate = learning_rate
        self.batch_size = batch_size
        self.epochs = epochs
        self.positive_class_weight = positive_class_weight
        self.tabular_model = TabularIDSHead(input_dim).to(self.device)
        self.sequence_model = TransformerLSTMSequenceHead(input_dim).to(self.device)
        self.history: dict[str, list[float]] = {
            "tabular_train_loss": [],
            "sequence_train_loss": [],
            "tabular_validation_loss": [],
            "sequence_validation_loss": [],
        }

    def _make_loader(self, x_data: np.ndarray, y_data: np.ndarray, is_sequence: bool) -> DataLoader:
        features = torch.as_tensor(x_data, dtype=torch.float32)
        targets = torch.as_tensor(y_data, dtype=torch.float32)
        dataset = TensorDataset(features, targets)
        return DataLoader(
            dataset,
            batch_size=min(self.batch_size, len(dataset)) if len(dataset) else 1,
            shuffle=not is_sequence,
        )

    def _pos_weight_tensor(self) -> torch.Tensor:
        return torch.tensor([self.positive_class_weight], dtype=torch.float32, device=self.device)

    def _binary_loss(self, logits: torch.Tensor, targets: torch.Tensor) -> torch.Tensor:
        return nn.functional.binary_cross_entropy_with_logits(
            logits,
            targets,
            pos_weight=self._pos_weight_tensor(),
        )

    def _train_epoch(
        self,
        model: nn.Module,
        optimizer: torch.optim.Optimizer,
        loader: DataLoader,
        is_sequence: bool,
    ) -> float:
        model.train()
        losses: list[float] = []
        for features, targets in loader:
            features = features.to(self.device)
            targets = targets.to(self.device)
            optimizer.zero_grad()
            logits = model(features if is_sequence else features)
            loss = self._binary_loss(logits, targets)
            loss.backward()
            optimizer.step()
            losses.append(float(loss.detach().cpu()))
        return float(np.mean(losses)) if losses else 0.0

    def _evaluate_loss(self, model: nn.Module, x_data: np.ndarray, y_data: np.ndarray, is_sequence: bool) -> float:
        if len(x_data) == 0:
            return 0.0
        model.eval()
        with torch.no_grad():
            features = torch.as_tensor(x_data, dtype=torch.float32, device=self.device)
            targets = torch.as_tensor(y_data, dtype=torch.float32, device=self.device)
            logits = model(features if is_sequence else features)
            return float(self._binary_loss(logits, targets).cpu())

    def fit(
        self,
        x_train: np.ndarray,
        y_train: np.ndarray,
        sequence_train: np.ndarray,
        sequence_y_train: np.ndarray,
        x_validation: np.ndarray | None = None,
        y_validation: np.ndarray | None = None,
        sequence_validation: np.ndarray | None = None,
        sequence_y_validation: np.ndarray | None = None,
    ) -> None:
        tabular_loader = self._make_loader(x_train, y_train, is_sequence=False)
        sequence_loader = self._make_loader(sequence_train, sequence_y_train, is_sequence=True)
        tabular_optimizer = torch.optim.AdamW(self.tabular_model.parameters(), lr=self.learning_rate, weight_decay=1e-4)
        sequence_optimizer = torch.optim.AdamW(
            self.sequence_model.parameters(),
            lr=self.learning_rate,
            weight_decay=1e-4,
        )

        for _ in range(self.epochs):
            tabular_loss = self._train_epoch(self.tabular_model, tabular_optimizer, tabular_loader, is_sequence=False)
            sequence_loss = self._train_epoch(
                self.sequence_model,
                sequence_optimizer,
                sequence_loader,
                is_sequence=True,
            )
            self.history["tabular_train_loss"].append(tabular_loss)
            self.history["sequence_train_loss"].append(sequence_loss)

            if x_validation is not None and y_validation is not None:
                self.history["tabular_validation_loss"].append(
                    self._evaluate_loss(self.tabular_model, x_validation, y_validation, is_sequence=False)
                )
            if sequence_validation is not None and sequence_y_validation is not None:
                self.history["sequence_validation_loss"].append(
                    self._evaluate_loss(
                        self.sequence_model,
                        sequence_validation,
                        sequence_y_validation,
                        is_sequence=True,
                    )
                )

    def predict_logits_tabular_tensor(self, features: torch.Tensor) -> torch.Tensor:
        return self.tabular_model(features)

    def predict_tabular(self, features: np.ndarray) -> PredictionBundle:
        self.tabular_model.eval()
        with torch.no_grad():
            tensor = torch.as_tensor(features, dtype=torch.float32, device=self.device)
            probabilities = torch.sigmoid(self.tabular_model(tensor)).cpu().numpy()
        labels = (probabilities >= 0.5).astype(np.int8)
        return PredictionBundle(labels=labels, probabilities=probabilities)

    def predict_sequences(self, sequences: np.ndarray) -> PredictionBundle:
        self.sequence_model.eval()
        with torch.no_grad():
            tensor = torch.as_tensor(sequences, dtype=torch.float32, device=self.device)
            probabilities = torch.sigmoid(self.sequence_model(tensor)).cpu().numpy()
        labels = (probabilities >= 0.5).astype(np.int8)
        return PredictionBundle(labels=labels, probabilities=probabilities)

    def score_custom_rows(
        self,
        features: np.ndarray,
        sequence_length: int,
    ) -> tuple[PredictionBundle, PredictionBundle | None]:
        tabular_predictions = self.predict_tabular(features)
        sequence_predictions = None
        if len(features) >= sequence_length:
            windows = [
                features[start_idx : start_idx + sequence_length]
                for start_idx in range(0, len(features) - sequence_length + 1)
            ]
            sequence_array = np.asarray(windows, dtype=np.float32)
            sequence_predictions = self.predict_sequences(sequence_array)
        return tabular_predictions, sequence_predictions

    def save(self, path: Path) -> None:
        payload = {
            "state_dict_tabular": self.tabular_model.state_dict(),
            "state_dict_sequence": self.sequence_model.state_dict(),
            "input_dim": self.input_dim,
            "sequence_length": self.sequence_length,
            "random_state": self.random_state,
            "learning_rate": self.learning_rate,
            "batch_size": self.batch_size,
            "epochs": self.epochs,
            "positive_class_weight": self.positive_class_weight,
            "history": self.history,
        }
        torch.save(payload, path)

    @classmethod
    def load(cls, path: Path, device: str = "cpu") -> "HybridIDSModel":
        payload = torch.load(path, map_location=device)
        model = cls(
            input_dim=payload["input_dim"],
            sequence_length=payload["sequence_length"],
            device=device,
            random_state=payload["random_state"],
            learning_rate=payload["learning_rate"],
            batch_size=payload["batch_size"],
            epochs=payload["epochs"],
            positive_class_weight=payload.get("positive_class_weight", 1.0),
        )
        model.tabular_model.load_state_dict(payload["state_dict_tabular"])
        model.sequence_model.load_state_dict(payload["state_dict_sequence"])
        model.history = payload.get("history", model.history)
        model.tabular_model.eval()
        model.sequence_model.eval()
        return model
