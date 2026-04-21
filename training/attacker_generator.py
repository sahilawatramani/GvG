import json
from dataclasses import dataclass
from pathlib import Path

import numpy as np
import pandas as pd
import torch
from torch import nn
from torch.utils.data import DataLoader, TensorDataset

from .ids_model import HybridIDSModel


@dataclass
class GeneratorFeedback:
    round_id: int
    detection_rate: float
    stealth_weight: float
    generator_loss: float


class ConditionalGenerator(nn.Module):
    def __init__(self, latent_dim: int, num_classes: int, feature_dim: int, class_embedding_dim: int = 16) -> None:
        super().__init__()
        self.class_embedding = nn.Embedding(num_classes, class_embedding_dim)
        self.network = nn.Sequential(
            nn.Linear(latent_dim + class_embedding_dim, 256),
            nn.LayerNorm(256),
            nn.GELU(),
            nn.Linear(256, 256),
            nn.LayerNorm(256),
            nn.GELU(),
            nn.Linear(256, feature_dim),
            nn.Tanh(),
        )

    def forward(self, noise: torch.Tensor, labels: torch.Tensor) -> torch.Tensor:
        embedding = self.class_embedding(labels)
        return self.network(torch.cat([noise, embedding], dim=1))


class ConditionalDiscriminator(nn.Module):
    def __init__(self, num_classes: int, feature_dim: int, class_embedding_dim: int = 16) -> None:
        super().__init__()
        self.class_embedding = nn.Embedding(num_classes, class_embedding_dim)
        self.network = nn.Sequential(
            nn.Linear(feature_dim + class_embedding_dim, 256),
            nn.LeakyReLU(0.2),
            nn.Dropout(0.2),
            nn.Linear(256, 128),
            nn.LeakyReLU(0.2),
            nn.Dropout(0.2),
            nn.Linear(128, 1),
        )

    def forward(self, features: torch.Tensor, labels: torch.Tensor) -> torch.Tensor:
        embedding = self.class_embedding(labels)
        return self.network(torch.cat([features, embedding], dim=1)).squeeze(-1)


class AdversarialTrafficGenerator:
    def __init__(
        self,
        feature_names: list[str],
        num_classes: int,
        feature_dim: int,
        device: str = "cpu",
        random_state: int = 42,
        latent_dim: int = 32,
        batch_size: int = 64,
        epochs: int = 40,
        learning_rate: float = 2e-4,
    ) -> None:
        torch.manual_seed(random_state)
        np.random.seed(random_state)
        self.feature_names = feature_names
        self.num_classes = num_classes
        self.feature_dim = feature_dim
        self.device = torch.device(device)
        self.random_state = random_state
        self.latent_dim = latent_dim
        self.batch_size = batch_size
        self.epochs = epochs
        self.learning_rate = learning_rate
        self.generator = ConditionalGenerator(latent_dim, num_classes, feature_dim).to(self.device)
        self.discriminator = ConditionalDiscriminator(num_classes, feature_dim).to(self.device)
        self.generator_optimizer = torch.optim.Adam(self.generator.parameters(), lr=learning_rate, betas=(0.5, 0.999))
        self.discriminator_optimizer = torch.optim.Adam(
            self.discriminator.parameters(),
            lr=learning_rate,
            betas=(0.5, 0.999),
        )
        self.bce_loss = nn.BCEWithLogitsLoss()
        self.attack_class_distribution: np.ndarray | None = None
        self.attack_rows: np.ndarray | None = None
        self.attack_labels: np.ndarray | None = None
        self.class_centroids: dict[int, torch.Tensor] = {}
        self.benign_centroid: torch.Tensor | None = None
        self.feedback_history: list[GeneratorFeedback] = []
        self.stealth_weight = 0.35

    def _make_loader(self, features: np.ndarray, labels: np.ndarray) -> DataLoader:
        feature_tensor = torch.as_tensor(features, dtype=torch.float32)
        label_tensor = torch.as_tensor(labels, dtype=torch.long)
        dataset = TensorDataset(feature_tensor, label_tensor)
        return DataLoader(
            dataset,
            batch_size=min(self.batch_size, len(dataset)) if len(dataset) else 1,
            shuffle=True,
        )

    def fit(
        self,
        x_train: np.ndarray,
        y_train_binary: np.ndarray,
        y_train_multiclass: np.ndarray,
    ) -> None:
        attack_mask = y_train_binary == 1
        benign_mask = y_train_binary == 0
        attack_rows = x_train[attack_mask].astype(np.float32)
        attack_labels = y_train_multiclass[attack_mask].astype(np.int64)
        if len(attack_rows) == 0:
            raise RuntimeError("No attack rows available for cGAN training.")

        self.attack_rows = attack_rows
        self.attack_labels = attack_labels
        self.benign_centroid = torch.as_tensor(
            x_train[benign_mask].mean(axis=0),
            dtype=torch.float32,
            device=self.device,
        )
        for class_id in np.unique(attack_labels):
            class_rows = attack_rows[attack_labels == class_id]
            self.class_centroids[int(class_id)] = torch.as_tensor(
                class_rows.mean(axis=0),
                dtype=torch.float32,
                device=self.device,
            )

        self.attack_class_distribution = attack_labels.copy()
        loader = self._make_loader(attack_rows, attack_labels)

        for _ in range(self.epochs):
            for real_features, class_labels in loader:
                real_features = real_features.to(self.device)
                class_labels = class_labels.to(self.device)
                batch_size = len(real_features)
                valid = torch.ones(batch_size, device=self.device)
                fake = torch.zeros(batch_size, device=self.device)

                noise = torch.randn(batch_size, self.latent_dim, device=self.device)
                fake_features = self.generator(noise, class_labels)

                self.discriminator_optimizer.zero_grad()
                real_loss = self.bce_loss(self.discriminator(real_features, class_labels), valid)
                fake_loss = self.bce_loss(self.discriminator(fake_features.detach(), class_labels), fake)
                discriminator_loss = 0.5 * (real_loss + fake_loss)
                discriminator_loss.backward()
                self.discriminator_optimizer.step()

                self.generator_optimizer.zero_grad()
                noise = torch.randn(batch_size, self.latent_dim, device=self.device)
                generated = self.generator(noise, class_labels)
                adversarial_loss = self.bce_loss(self.discriminator(generated, class_labels), valid)
                centroid_targets = torch.stack([self.class_centroids[int(label)] for label in class_labels.tolist()])
                reconstruction_loss = nn.functional.mse_loss(generated, centroid_targets)
                generator_loss = adversarial_loss + 0.15 * reconstruction_loss
                generator_loss.backward()
                self.generator_optimizer.step()

    def adversarial_fine_tune(
        self,
        ids_model: HybridIDSModel,
        rounds: int,
        source_multiclass: np.ndarray,
        sample_count: int,
    ) -> list[GeneratorFeedback]:
        if self.attack_class_distribution is None:
            raise RuntimeError("Generator must be fit before adversarial fine-tuning.")

        ids_model.tabular_model.eval()
        for parameter in ids_model.tabular_model.parameters():
            parameter.requires_grad_(False)

        attack_labels = source_multiclass[source_multiclass > 0]
        if len(attack_labels) == 0:
            attack_labels = self.attack_class_distribution

        for round_id in range(1, rounds + 1):
            label_batch = np.random.choice(attack_labels, size=sample_count, replace=True)
            class_labels = torch.as_tensor(label_batch, dtype=torch.long, device=self.device)
            valid = torch.ones(sample_count, device=self.device)

            self.generator_optimizer.zero_grad()
            noise = torch.randn(sample_count, self.latent_dim, device=self.device)
            generated = self.generator(noise, class_labels)
            gan_loss = self.bce_loss(self.discriminator(generated, class_labels), valid)
            ids_attack_probability = torch.sigmoid(ids_model.predict_logits_tabular_tensor(generated)).mean()
            centroid_targets = torch.stack([self.class_centroids[int(label)] for label in class_labels.tolist()])
            reconstruction_loss = nn.functional.mse_loss(generated, centroid_targets)
            if self.benign_centroid is None:
                benign_pull = torch.tensor(0.0, device=self.device)
            else:
                benign_pull = nn.functional.mse_loss(generated.mean(dim=0), self.benign_centroid)
            total_loss = gan_loss + 0.15 * reconstruction_loss + 0.05 * benign_pull + self.stealth_weight * ids_attack_probability
            total_loss.backward()
            self.generator_optimizer.step()

            generated_np = generated.detach().cpu().numpy()
            detected = ids_model.predict_tabular(generated_np).labels
            detection_rate = float(detected.mean())
            if detection_rate > 0.80:
                self.stealth_weight = min(1.2, self.stealth_weight + 0.08)
            else:
                self.stealth_weight = max(0.10, self.stealth_weight - 0.03)
            self.feedback_history.append(
                GeneratorFeedback(
                    round_id=round_id,
                    detection_rate=detection_rate,
                    stealth_weight=float(self.stealth_weight),
                    generator_loss=float(total_loss.detach().cpu()),
                )
            )
        return self.feedback_history

    def _sample_labels(
        self,
        sample_count: int,
        source_multiclass: np.ndarray | None = None,
    ) -> np.ndarray:
        if source_multiclass is not None:
            attack_labels = source_multiclass[source_multiclass > 0]
            if len(attack_labels):
                return np.random.choice(attack_labels, size=sample_count, replace=True)
        if self.attack_class_distribution is None:
            raise RuntimeError("Generator has not been fit.")
        return np.random.choice(self.attack_class_distribution, size=sample_count, replace=True)

    def generate_tabular(
        self,
        sample_count: int,
        source_multiclass: np.ndarray | None = None,
    ) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
        sampled_labels = self._sample_labels(sample_count, source_multiclass=source_multiclass)
        with torch.no_grad():
            noise = torch.randn(sample_count, self.latent_dim, device=self.device)
            label_tensor = torch.as_tensor(sampled_labels, dtype=torch.long, device=self.device)
            generated = self.generator(noise, label_tensor).cpu().numpy().astype(np.float32)
        return generated, np.ones(sample_count, dtype=np.int8), sampled_labels.astype(np.int32)

    def generate_sequences(
        self,
        sequence_length: int,
        sample_count: int,
        source_multiclass: np.ndarray | None = None,
    ) -> tuple[np.ndarray, np.ndarray]:
        sequence_rows, _, _ = self.generate_tabular(
            sample_count=sample_count * sequence_length,
            source_multiclass=source_multiclass,
        )
        sequences = sequence_rows.reshape(sample_count, sequence_length, self.feature_dim).astype(np.float32)
        return sequences, np.ones(sample_count, dtype=np.int8)

    def save_state(self, path: Path) -> None:
        payload = {
            "latent_dim": self.latent_dim,
            "epochs": self.epochs,
            "learning_rate": self.learning_rate,
            "stealth_weight": self.stealth_weight,
            "feedback_history": [feedback.__dict__ for feedback in self.feedback_history],
        }
        path.write_text(json.dumps(payload, indent=2), encoding="utf-8")

    def save_checkpoint(self, path: Path) -> None:
        torch.save(
            {
                "generator_state_dict": self.generator.state_dict(),
                "discriminator_state_dict": self.discriminator.state_dict(),
                "latent_dim": self.latent_dim,
                "num_classes": self.num_classes,
                "feature_dim": self.feature_dim,
                "random_state": self.random_state,
                "stealth_weight": self.stealth_weight,
            },
            path,
        )

    def save_samples(
        self,
        features: np.ndarray,
        multiclass_labels: np.ndarray,
        path: Path,
    ) -> None:
        frame = pd.DataFrame(features, columns=self.feature_names)
        frame["label_multiclass"] = multiclass_labels
        frame["label_binary"] = 1
        frame.to_csv(path, index=False)

    @classmethod
    def load(cls, path: Path, feature_names: list[str], device: str = "cpu") -> "AdversarialTrafficGenerator":
        payload = torch.load(path, map_location=device)
        generator = cls(
            feature_names=feature_names,
            num_classes=payload["num_classes"],
            feature_dim=payload["feature_dim"],
            device=device,
            random_state=payload["random_state"],
            latent_dim=payload["latent_dim"]
        )
        generator.generator.load_state_dict(payload["generator_state_dict"])
        generator.discriminator.load_state_dict(payload["discriminator_state_dict"])
        generator.stealth_weight = payload.get("stealth_weight", 0.35)
        generator.generator.eval()
        generator.discriminator.eval()
        return generator
