# GvG: GAN-vs-GAN Defense for Intrusion Detection Systems

## Overview

This project implements an end-to-end intrusion detection workflow inspired by the GAN-vs-GAN defense idea described in the project PDF and architecture SVGs.

The pipeline is designed around one simple entrypoint:

```bash
python main.py
```

When `main.py` runs, it executes the full sequence:

1. Preprocess raw CICIDS2017 CSV files
2. Save clean train/validation/test splits into `preprocessed/`
3. Train a baseline IDS model
4. Train an attacker-side adversarial traffic generator
5. Generate obfuscated attack samples
6. Retrain the IDS with adversarial samples
7. Evaluate clean and adversarial robustness
8. Save metrics, models, and generated outputs into `artifacts/`
9. Score custom CSV inputs from `custom_input/`

The project is organized in OOP format so that preprocessing, training, generation, evaluation, and custom-input scoring are connected cleanly through reusable classes.

## Project Goal

The main goal of this project is to study how an IDS can be improved against evasive attacks that are intentionally modified to look more like benign traffic.

The idea follows this adversarial-defense workflow:

1. Train a defender IDS on clean data
2. Train an attacker model to generate difficult attack-like samples
3. Evaluate whether the IDS can still detect them
4. Retrain the IDS with generated adversarial traffic
5. Measure whether robustness improves

This makes the IDS less dependent on only standard attack patterns and more prepared for harder, obfuscated attack traffic.

## Problem Statement

Traditional or static IDS pipelines often perform well on known traffic distributions but degrade when the attack behavior changes. Modern adversarial generation methods can create malicious flows that are harder to detect.

This project addresses that issue by:

- preprocessing CICIDS2017 network flow data
- training a baseline defender model
- simulating attacker-side adversarial traffic generation
- retraining the defender on synthetic attacks
- comparing clean and adversarial performance

## Architecture Summary

The implementation follows the workflow described in the PDF and SVGs:

- `Preprocess`: prepares CICIDS2017 data for model training
- `HybridIDSModel`: acts as the defender IDS
- `AdversarialTrafficGenerator`: acts as the attacker-side generator
- `AdversarialTrainingPipeline`: orchestrates baseline training, adversarial generation, retraining, and evaluation
- `CustomInputRunner`: scores external user-provided CSV files with the trained robust IDS

Conceptually, the system is split into two sides:

### Attacker side

- learns from malicious traffic
- generates obfuscated or blended attack samples
- updates generation behavior using IDS feedback

### Defender side

- learns to classify benign vs malicious traffic
- is evaluated on clean traffic
- is tested against adversarially generated traffic
- is retrained to improve robustness

## Important Note About the Current Implementation

The project structure and workflow follow the GAN-vs-GAN design, but the current implementation uses lightweight scikit-learn models rather than a full deep-learning `Transformer-LSTM + cGAN + TimeGAN` stack.

This was done so the project remains easy to run in a simple local environment with the current dependencies.

So in the current code:

- the defender is implemented as a hybrid of:
  - Random Forest for tabular features
  - Logistic Regression over flattened sequence windows
- the attacker-side generator is implemented as:
  - a feature-space adversarial sample generator using attack/benign blending and stochastic perturbation

This means:

- the workflow is correct and complete
- the artifacts and evaluation flow are connected end to end
- the training loop is adversarial in spirit
- the exact deep architectures from the presentation are approximated, not fully reproduced

## Dataset

The project uses the CICIDS2017 dataset in CSV format.

Expected dataset location:

```text
datasets/MachineLearningCVE/
```

Expected raw files include examples like:

- `Monday-WorkingHours.pcap_ISCX.csv`
- `Tuesday-WorkingHours.pcap_ISCX.csv`
- `Wednesday-workingHours.pcap_ISCX.csv`
- `Thursday-WorkingHours-Morning-WebAttacks.pcap_ISCX.csv`
- `Thursday-WorkingHours-Afternoon-Infilteration.pcap_ISCX.csv`
- `Friday-WorkingHours-Morning.pcap_ISCX.csv`
- `Friday-WorkingHours-Afternoon-PortScan.pcap_ISCX.csv`
- `Friday-WorkingHours-Afternoon-DDos.pcap_ISCX.csv`

If the extracted folder is not present, preprocessing can also use:

```text
datasets/MachineLearningCSV.zip
```

## Current Folder Structure

```text
GvG/
├── main.py
├── __init__.py
├── preprocessing_CICIDS2017.py
├── training/
│   ├── __init__.py
│   ├── config.py
│   ├── data_loader.py
│   ├── ids_model.py
│   ├── attacker_generator.py
│   ├── evaluation.py
│   └── pipeline.py
├── custom_input/
│   ├── __init__.py
│   ├── runner.py
│   └── custom_test.py
├── datasets/
│   └── MachineLearningCVE/
├── preprocessed/
│   ├── training_dataset.csv
│   ├── splits/
│   └── sequences/
├── artifacts/
│   ├── eda/
│   ├── training/
│   ├── generated/
│   ├── custom_input/
│   └── models/
└── README.md
```

## Module-by-Module Explanation

### `preprocessing_CICIDS2017.py`

Responsible for:

- loading raw CICIDS2017 CSV files
- merging them into one dataset
- cleaning columns
- converting features to numeric values
- removing duplicates and invalid rows
- encoding labels
- balancing classes
- selecting useful features
- scaling features
- splitting train, validation, and test data
- creating sequence windows
- exporting processed outputs and EDA artifacts

### `training/config.py`

Defines shared paths and pipeline configuration.

It centralizes:

- project directories
- artifact locations
- model output locations
- sequence length
- random seed
- adversarial rounds
- synthetic sample multiplier

### `training/data_loader.py`

Loads saved outputs from `preprocessed/` and converts them into one structured data bundle for training and evaluation.

### `training/ids_model.py`

Contains the defender IDS model.

The model has two prediction paths:

- tabular prediction on single rows
- sequence prediction on windowed traffic sessions

It also supports:

- training
- saving/loading the trained model
- scoring custom input rows

### `training/attacker_generator.py`

Contains the attacker-side adversarial generator.

It learns simple feature-space attack patterns from the training data and produces new synthetic attack samples that are shifted toward benign-like characteristics while staying malicious in label.

It also maintains a lightweight feedback loop from IDS detection results.

### `training/evaluation.py`

Computes and saves evaluation metrics such as:

- accuracy
- precision
- recall
- F1 score
- ROC-AUC
- false positive rate
- false negative rate
- confusion matrices
- classification reports

### `training/pipeline.py`

This is the orchestration layer for adversarial training.

It performs:

1. baseline IDS training
2. attacker generator fitting
3. adversarial sample generation
4. attacker feedback updates
5. adversarial retraining
6. clean and adversarial evaluation
7. artifact export

### `custom_input/runner.py`

Handles scoring of user-provided custom CSV files after training is complete.

It:

- checks the expected feature schema
- fills missing features with `0.0`
- scores each row with the robust IDS
- optionally scores sequence windows if enough rows are present
- saves results into `artifacts/custom_input/`

### `main.py`

Acts as the single execution entrypoint.

Running `main.py` triggers:

1. preprocessing
2. training
3. adversarial evaluation
4. custom-input scoring

## End-to-End Workflow

### Step 1: Data Collection and Preprocessing

The raw CICIDS2017 CSV files are loaded and merged.

Then the pipeline:

- standardizes column names
- strips invalid values
- converts all usable features to numeric
- removes nulls and duplicates
- encodes multiclass labels
- creates binary benign/malicious labels
- balances the dataset
- selects low-variance-safe features
- scales them
- splits them into training, validation, and testing sets
- creates sequence windows for temporal modeling

The outputs are stored under `preprocessed/`.

### Step 2: Baseline IDS Training

The baseline IDS is trained using the clean preprocessed data only.

This gives a reference measure of how well the defender performs before adversarial retraining.

### Step 3: Attacker-Side Generator Training

The attacker-side generator is fit on malicious traffic patterns. It estimates:

- attack centroids
- attack feature scales
- benign centroid guidance
- attack sequence patterns

This is used to generate harder-to-detect traffic samples.

### Step 4: Adversarial Attack Generation

The generator creates synthetic attack samples by blending attack behavior toward benign patterns and adding stochastic perturbation.

These generated attacks simulate evasive traffic.

### Step 5: Feedback Loop

The generator is updated using IDS detection performance.

If the IDS detects the current synthetic attacks too easily, the blend factor shifts to make future attacks more difficult.

This approximates the adversarial loop shown in the architecture diagram.

### Step 6: Adversarial Retraining

The clean training set is augmented with synthetic attack samples.

A robust IDS is then trained on the augmented data.

### Step 7: Final Evaluation

The project evaluates:

- baseline IDS on clean data
- robust IDS on clean data
- baseline IDS on adversarial samples
- robust IDS on adversarial samples

This lets you compare robustness gains after adversarial retraining.

### Step 8: Custom Input Scoring

Any CSV files placed in `custom_input/` are scored automatically after training completes.

The robust IDS produces:

- row-level binary prediction
- attack probability
- optional sequence-window predictions

## Expected Outputs

### `preprocessed/`

This folder contains processed training-ready data.

Main files:

- `preprocessed/training_dataset.csv`
- `preprocessed/splits/X_train.csv`
- `preprocessed/splits/X_validation.csv`
- `preprocessed/splits/X_test.csv`
- `preprocessed/splits/y_train.csv`
- `preprocessed/splits/y_validation.csv`
- `preprocessed/splits/y_test.csv`
- `preprocessed/sequences/sequences_train.npy`
- `preprocessed/sequences/sequences_validation.npy`
- `preprocessed/sequences/sequences_test.npy`

### `artifacts/eda/`

Contains preprocessing analysis outputs.

Examples:

- `eda_report.txt`
- `label_distribution.csv`
- `null_counts.csv`
- `numeric_summary.csv`
- plot images

### `artifacts/models/`

Contains saved IDS models.

Examples:

- `baseline_ids.pkl`
- `robust_ids.pkl`

### `artifacts/generated/`

Contains synthetic adversarial attack samples.

Examples:

- `validation_adversarial_round_1.csv`
- `validation_adversarial_round_2.csv`
- `synthetic_training_attacks.csv`
- `test_adversarial_samples.csv`

### `artifacts/training/`

Contains metrics and training summaries.

Examples:

- `metrics_summary.csv`
- `final_report.csv`
- `training_manifest.json`
- `generator_state.json`
- confusion matrices
- classification reports
- per-stage metric JSON files

### `artifacts/custom_input/`

Contains scoring outputs for user-provided custom CSVs.

Examples:

- `sample_custom_input_scored.csv`
- `sample_custom_input_sequence_scored.csv`

## Expected Metric Outputs

The project saves metrics for both clean and adversarial evaluation.

Metrics include:

- accuracy
- precision
- recall
- F1 score
- ROC-AUC
- false positive rate
- false negative rate

The main summary file is:

```text
artifacts/training/metrics_summary.csv
```

Typical rows in the summary include:

- `validation_tabular`
- `test_tabular`
- `validation_sequence`
- `test_sequence`
- `test_adversarial_tabular`
- `test_adversarial_sequence`

For both:

- `baseline`
- `robust`

## How the Models Work

### Defender model

The defender is a hybrid IDS:

- `RandomForestClassifier` handles tabular flow-level features
- `LogisticRegression` handles flattened sequence windows

This gives:

- one path for single-record detection
- one path for session-window detection

### Attacker model

The attacker generator:

- learns attack feature centroids
- learns attack feature variability
- references benign traffic mean behavior
- generates modified attack samples by blending and perturbing malicious flows

It also updates its generation strength using validation feedback.

## How Custom Input Works

After training, the pipeline automatically reads all CSV files placed in:

```text
custom_input/
```

Each file is:

1. aligned to the training feature schema
2. missing columns are filled with zeros
3. non-numeric values are coerced to numeric
4. scored by the robust IDS

For each custom CSV, the project saves:

- row-level predictions
- attack probabilities
- sequence-level predictions when possible

If no custom CSV is present, the project creates:

```text
custom_input/sample_custom_input.csv
```

This serves as a template.

## How to Run

## 1. Install dependencies

```bash
pip install -r requirements.txt
```

Current required packages:

- `numpy`
- `pandas`
- `scikit-learn`

Optional packages used by preprocessing:

- `matplotlib`
- `imbalanced-learn`

## 2. Keep the dataset in the expected location

Make sure the CICIDS2017 CSV files are inside:

```text
datasets/MachineLearningCVE/
```

or provide:

```text
datasets/MachineLearningCSV.zip
```

## 3. Run the full pipeline

```bash
python main.py
```

## 4. Check generated outputs

Look at:

- `preprocessed/`
- `artifacts/training/`
- `artifacts/generated/`
- `artifacts/models/`
- `artifacts/custom_input/`

## 5. Run only the custom-input scoring script

```bash
python -m custom_input.custom_test
```

This assumes the trained robust model already exists.

## How to Use with Your Own CSV

1. Put your CSV file in `custom_input/`
2. Make sure the columns match the training features as closely as possible
3. Run:

```bash
python main.py
```

or, if models are already trained:

```bash
python -m custom_input.custom_test
```

Your scored output will be written to:

```text
artifacts/custom_input/
```

## Example Execution Flow

When `python main.py` is executed, this is what happens internally:

1. `Preprocess().run()` prepares the data
2. `AdversarialTrainingPipeline.run()` loads preprocessed splits
3. Baseline IDS is trained
4. Adversarial generator is fit
5. Validation adversarial samples are created
6. Generator feedback is updated
7. Training data is augmented with synthetic attacks
8. Robust IDS is retrained
9. Clean and adversarial metrics are saved
10. `CustomInputRunner.run()` scores files in `custom_input/`

## Main Use Cases

This project is useful for:

- cybersecurity ML project demonstrations
- IDS robustness experiments
- adversarial training workflow demonstrations
- research prototypes for evasive attack detection
- student academic projects on GAN-based cyber defense
- comparative testing of baseline vs adversarially retrained IDS behavior

## Realistic Academic/Project Use Cases

You can use this project for:

- project reports and demonstrations
- architecture walkthroughs based on the supplied PDF/SVGs
- adversarial ML experiments on tabular network flow data
- extending the current implementation into a full deep-learning version
- generating artifacts for evaluation and presentation

## Limitations

The current version has some practical limitations:

- it is not a full cGAN/TimeGAN implementation
- it is not a Transformer-LSTM implementation
- class balancing via undersampling can make the effective training set very small when rare classes exist
- metrics may fluctuate because the balanced dataset is much smaller than the original cleaned dataset
- custom input assumes feature-space compatibility with CICIDS2017 preprocessing output

The biggest current limitation is the balancing strategy: because some classes are extremely rare, undersampling can reduce the dataset sharply. That affects model stability and makes the run more demonstration-oriented than production-ready.

## Suggested Future Improvements

Possible next improvements:

- replace the current IDS with an actual Transformer-LSTM
- replace the generator with real cGAN/TimeGAN/WGAN-GP models
- improve class balancing strategy to avoid collapsing to very small training sets
- add configuration through CLI arguments or YAML
- add experiment tracking
- add plots for metric comparison across baseline and robust models
- save feature-importance analysis
- add multiclass attack-type prediction
- add real adversarial retraining schedules and stopping criteria

## Troubleshooting

### Dataset not found

If you get a dataset error, confirm that:

- `datasets/MachineLearningCVE/` exists
- the raw CSVs are present
- or `datasets/MachineLearningCSV.zip` exists

### Custom input not scoring

Make sure:

- `artifacts/models/robust_ids.pkl` exists
- your CSV is inside `custom_input/`
- the CSV can be interpreted as numeric feature columns

### Matplotlib cache warning

You may see a matplotlib cache-directory warning in restricted environments. This does not stop the main workflow unless plotting fails completely.

### Metrics look too perfect

Because the current balanced dataset may become very small, some evaluation scores can be optimistic or unstable. This is expected in the current demonstration-oriented pipeline.

## Output Summary at a Glance

After a successful run, you should expect:

- processed datasets in `preprocessed/`
- EDA reports in `artifacts/eda/`
- trained models in `artifacts/models/`
- generated adversarial samples in `artifacts/generated/`
- evaluation metrics in `artifacts/training/`
- scored custom files in `artifacts/custom_input/`

## Recommended Demo Flow

If you are presenting this project, a good demo order is:

1. explain the problem of evasive malicious traffic
2. show the preprocessing pipeline
3. show the baseline IDS idea
4. explain attacker-side adversarial generation
5. show retraining and robustness evaluation
6. open `metrics_summary.csv`
7. show generated attack samples
8. show custom input scoring output

## Conclusion

This project provides a complete, runnable, OOP-based adversarial IDS workflow aligned with the GAN-vs-GAN defense idea in your presentation material.

It is especially useful as:

- a project submission base
- a demo-ready cybersecurity ML pipeline
- a strong starting point for future deep-learning expansion

The current implementation already supports full flow execution from one main file, artifact generation, adversarial retraining, and custom CSV scoring in a connected structure.
