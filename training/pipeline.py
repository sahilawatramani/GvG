import json

import numpy as np
import pandas as pd

from .attacker_generator import AdversarialTrafficGenerator
from .config import PipelineConfig
from .data_loader import PreprocessedDataBundle, PreprocessedDataLoader
from .evaluation import MetricsRecorder
from .ids_model import HybridIDSModel


class AdversarialTrainingPipeline:
    def __init__(self, config: PipelineConfig | None = None) -> None:
        self.config = config or PipelineConfig()
        self.config.ensure_directories()
        self.data_loader = PreprocessedDataLoader(self.config)
        self.metrics = MetricsRecorder(self.config.training_artifact_dir)

    def _log(self, message: str) -> None:
        print(f"[training] {message}")

    def _save_training_manifest(self, bundle: PreprocessedDataBundle) -> None:
        manifest = {
            "feature_count": len(bundle.feature_names),
            "train_rows": int(len(bundle.x_train)),
            "validation_rows": int(len(bundle.x_validation)),
            "test_rows": int(len(bundle.x_test)),
            "sequence_train_rows": int(len(bundle.sequences_train)),
            "sequence_validation_rows": int(len(bundle.sequences_validation)),
            "sequence_test_rows": int(len(bundle.sequences_test)),
            "label_names": bundle.label_names,
            "device": self.config.device,
            "ids_epochs": self.config.ids_epochs,
            "gan_epochs": self.config.gan_epochs,
            "latent_dim": self.config.latent_dim,
        }
        (self.config.training_artifact_dir / "training_manifest.json").write_text(
            json.dumps(manifest, indent=2),
            encoding="utf-8",
        )

    def _save_history(self, stage_name: str, model: HybridIDSModel) -> None:
        pd.DataFrame(model.history).to_csv(
            self.config.training_artifact_dir / f"{stage_name}_training_history.csv",
            index=False,
        )

    def _class_weight(self, y_binary: np.ndarray) -> float:
        positives = float(np.sum(y_binary == 1))
        negatives = float(np.sum(y_binary == 0))
        return max(1.0, negatives / max(positives, 1.0))

    def _build_ids(self, bundle: PreprocessedDataBundle, random_state_offset: int = 0) -> HybridIDSModel:
        return HybridIDSModel(
            input_dim=len(bundle.feature_names),
            sequence_length=self.config.sequence_length,
            device=self.config.device,
            random_state=self.config.random_state + random_state_offset,
            learning_rate=self.config.ids_learning_rate,
            batch_size=self.config.ids_batch_size,
            epochs=self.config.ids_epochs,
            positive_class_weight=self._class_weight(bundle.y_train_binary),
        )

    def _evaluate_clean(
        self,
        model: HybridIDSModel,
        bundle: PreprocessedDataBundle,
        stage_name: str,
    ) -> list[dict[str, float | str]]:
        return [
            self.metrics.evaluate_binary(
                split_name="validation_tabular",
                stage_name=stage_name,
                y_true=bundle.y_validation_binary,
                predictions=model.predict_tabular(bundle.x_validation),
            ),
            self.metrics.evaluate_binary(
                split_name="test_tabular",
                stage_name=stage_name,
                y_true=bundle.y_test_binary,
                predictions=model.predict_tabular(bundle.x_test),
            ),
            self.metrics.evaluate_binary(
                split_name="validation_sequence",
                stage_name=stage_name,
                y_true=bundle.sequence_y_validation_binary,
                predictions=model.predict_sequences(bundle.sequences_validation),
            ),
            self.metrics.evaluate_binary(
                split_name="test_sequence",
                stage_name=stage_name,
                y_true=bundle.sequence_y_test_binary,
                predictions=model.predict_sequences(bundle.sequences_test),
            ),
        ]

    def _evaluate_adversarial(
        self,
        model: HybridIDSModel,
        stage_name: str,
        x_adv: np.ndarray,
        y_adv: np.ndarray,
        sequences_adv: np.ndarray,
        sequence_y_adv: np.ndarray,
    ) -> list[dict[str, float | str]]:
        rows = []
        if len(x_adv):
            rows.append(
                self.metrics.evaluate_binary(
                    split_name="test_adversarial_tabular",
                    stage_name=stage_name,
                    y_true=y_adv,
                    predictions=model.predict_tabular(x_adv),
                )
            )
        if len(sequences_adv):
            rows.append(
                self.metrics.evaluate_binary(
                    split_name="test_adversarial_sequence",
                    stage_name=stage_name,
                    y_true=sequence_y_adv,
                    predictions=model.predict_sequences(sequences_adv),
                )
            )
        return rows

    def _augment_training_data(
        self,
        bundle: PreprocessedDataBundle,
        generator: AdversarialTrafficGenerator,
    ) -> tuple[np.ndarray, np.ndarray, np.ndarray, np.ndarray]:
        attack_rows = int(np.sum(bundle.y_train_binary == 1))
        attack_sequences = int(np.sum(bundle.sequence_y_train_binary == 1))
        synthetic_count = max(4, int(attack_rows * self.config.synthetic_multiplier))
        synthetic_sequence_count = max(2, int(attack_sequences * self.config.synthetic_multiplier))
        x_generated, y_generated_binary, y_generated_multiclass = generator.generate_tabular(
            sample_count=synthetic_count,
            source_multiclass=bundle.y_train_multiclass,
        )
        sequence_generated, sequence_generated_binary = generator.generate_sequences(
            sequence_length=self.config.sequence_length,
            sample_count=synthetic_sequence_count,
            source_multiclass=bundle.sequence_y_train_multiclass,
        )
        generator.save_samples(
            x_generated,
            y_generated_multiclass,
            self.config.generated_dir / "synthetic_training_attacks.csv",
        )
        x_augmented = np.vstack([bundle.x_train, x_generated]).astype(np.float32)
        y_augmented = np.concatenate([bundle.y_train_binary, y_generated_binary]).astype(np.int8)
        sequences_augmented = np.concatenate([bundle.sequences_train, sequence_generated]).astype(np.float32)
        sequence_y_augmented = np.concatenate([bundle.sequence_y_train_binary, sequence_generated_binary]).astype(np.int8)
        return x_augmented, y_augmented, sequences_augmented, sequence_y_augmented

    def run(self) -> dict[str, object]:
        self._log("Loading preprocessed splits and sequence files.")
        bundle = self.data_loader.load()
        self._save_training_manifest(bundle)

        self._log("Step 1: training Transformer-LSTM IDS baseline.")
        baseline_model = self._build_ids(bundle)
        baseline_model.fit(
            x_train=bundle.x_train,
            y_train=bundle.y_train_binary,
            sequence_train=bundle.sequences_train,
            sequence_y_train=bundle.sequence_y_train_binary,
            x_validation=bundle.x_validation,
            y_validation=bundle.y_validation_binary,
            sequence_validation=bundle.sequences_validation,
            sequence_y_validation=bundle.sequence_y_validation_binary,
        )
        baseline_model_path = self.config.model_dir / "baseline_ids.pt"
        baseline_model.save(baseline_model_path)
        self._save_history("baseline", baseline_model)
        summary_rows = self._evaluate_clean(baseline_model, bundle, stage_name="baseline")

        self._log("Step 2: training conditional GAN attacker on malicious traffic.")
        generator = AdversarialTrafficGenerator(
            feature_names=bundle.feature_names,
            num_classes=len(bundle.label_names),
            feature_dim=len(bundle.feature_names),
            device=self.config.device,
            random_state=self.config.random_state,
            latent_dim=self.config.latent_dim,
            batch_size=self.config.gan_batch_size,
            epochs=self.config.gan_epochs,
            learning_rate=self.config.gan_learning_rate,
        )
        generator.fit(
            x_train=bundle.x_train,
            y_train_binary=bundle.y_train_binary,
            y_train_multiclass=bundle.y_train_multiclass,
        )
        generator.save_checkpoint(self.config.model_dir / "attacker_cgan.pt")

        self._log("Step 3: adversarially fine-tuning the generator against baseline IDS feedback.")
        feedback = generator.adversarial_fine_tune(
            ids_model=baseline_model,
            rounds=self.config.adversarial_rounds,
            source_multiclass=bundle.y_validation_multiclass,
            sample_count=max(4, int(np.sum(bundle.y_validation_binary == 1))),
        )
        for item in feedback:
            x_val_adv, _, y_val_adv_mc = generator.generate_tabular(
                sample_count=max(4, int(np.sum(bundle.y_validation_binary == 1))),
                source_multiclass=bundle.y_validation_multiclass,
            )
            generator.save_samples(
                x_val_adv,
                y_val_adv_mc,
                self.config.generated_dir / f"validation_adversarial_round_{item.round_id}.csv",
            )
            self._log(
                f"Round {item.round_id}: detection_rate={item.detection_rate:.4f}, "
                f"stealth_weight={item.stealth_weight:.4f}"
            )
        generator.save_state(self.config.training_artifact_dir / "generator_state.json")

        self._log("Step 4: retraining IDS on clean plus cGAN-generated attacks.")
        x_augmented, y_augmented, sequences_augmented, sequence_y_augmented = self._augment_training_data(
            bundle,
            generator,
        )
        robust_model = self._build_ids(bundle, random_state_offset=9)
        robust_model.fit(
            x_train=x_augmented,
            y_train=y_augmented,
            sequence_train=sequences_augmented,
            sequence_y_train=sequence_y_augmented,
            x_validation=bundle.x_validation,
            y_validation=bundle.y_validation_binary,
            sequence_validation=bundle.sequences_validation,
            sequence_y_validation=bundle.sequence_y_validation_binary,
        )
        robust_model_path = self.config.model_dir / "robust_ids.pt"
        robust_model.save(robust_model_path)
        self._save_history("robust", robust_model)

        self._log("Step 5: evaluating clean and adversarial robustness.")
        summary_rows.extend(self._evaluate_clean(robust_model, bundle, stage_name="robust"))

        adversarial_test_count = max(4, int(np.sum(bundle.y_test_binary == 1)))
        x_test_adv, y_test_adv, y_test_adv_mc = generator.generate_tabular(
            sample_count=adversarial_test_count,
            source_multiclass=bundle.y_test_multiclass,
        )
        sequence_test_adv, sequence_y_test_adv = generator.generate_sequences(
            sequence_length=self.config.sequence_length,
            sample_count=max(2, int(np.sum(bundle.sequence_y_test_binary == 1))),
            source_multiclass=bundle.sequence_y_test_multiclass,
        )
        generator.save_samples(
            x_test_adv,
            y_test_adv_mc,
            self.config.generated_dir / "test_adversarial_samples.csv",
        )
        summary_rows.extend(
            self._evaluate_adversarial(
                model=baseline_model,
                stage_name="baseline",
                x_adv=x_test_adv,
                y_adv=y_test_adv,
                sequences_adv=sequence_test_adv,
                sequence_y_adv=sequence_y_test_adv,
            )
        )
        summary_rows.extend(
            self._evaluate_adversarial(
                model=robust_model,
                stage_name="robust",
                x_adv=x_test_adv,
                y_adv=y_test_adv,
                sequences_adv=sequence_test_adv,
                sequence_y_adv=sequence_y_test_adv,
            )
        )
        self.metrics.save_summary(summary_rows)
        pd.DataFrame(summary_rows).to_csv(self.config.training_artifact_dir / "final_report.csv", index=False)
        pd.DataFrame([item.__dict__ for item in feedback]).to_csv(
            self.config.training_artifact_dir / "generator_feedback.csv",
            index=False,
        )
        self._log(f"Training artifacts saved to {self.config.training_artifact_dir}")
        return {
            "bundle": bundle,
            "baseline_model_path": baseline_model_path,
            "robust_model_path": robust_model_path,
            "metrics_summary_path": self.config.training_artifact_dir / "metrics_summary.csv",
            "feature_names": bundle.feature_names,
        }
