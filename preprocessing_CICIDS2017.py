"""
Robust CICIDS2017 preprocessing pipeline.

Run the full pipeline through:
    from preprocessing_CICIDS2017 import Preprocess
    Preprocess().run()
"""

import os
import pickle
import warnings
import zipfile
from typing import Iterable, List

import numpy as np
import pandas as pd
from sklearn.feature_selection import VarianceThreshold
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder, StandardScaler

warnings.filterwarnings("ignore")


class Preprocess:
    def __init__(
        self,
        dataset_dir: str = os.path.join("datasets", "MachineLearningCVE"),
        zip_path: str = os.path.join("datasets", "MachineLearningCSV.zip"),
        artifact_dir: str = "artifacts",
        output_dir: str = "preprocessed",
        output_filename: str = "training_dataset.csv",
        random_state: int = 42,
        test_size: float = 0.20,
        validation_size: float = 0.25,
    ) -> None:
        self.dataset_dir = dataset_dir
        self.zip_path = zip_path
        self.artifact_dir = artifact_dir
        self.output_dir = output_dir
        self.output_csv = os.path.join(output_dir, output_filename)
        self.random_state = random_state
        self.test_size = test_size
        self.validation_size = validation_size

    def ensure_directories(self) -> None:
        os.makedirs(self.artifact_dir, exist_ok=True)
        os.makedirs(self.output_dir, exist_ok=True)

    def resolve_dataset_dir(self) -> str:
        if os.path.isdir(self.dataset_dir):
            print(f"Using existing dataset directory: {self.dataset_dir}")
            return self.dataset_dir

        if os.path.isfile(self.zip_path):
            os.makedirs(self.dataset_dir, exist_ok=True)
            with zipfile.ZipFile(self.zip_path, "r") as zip_file:
                zip_file.extractall(self.dataset_dir)
                print(f"Extracted {len(zip_file.namelist())} files to {self.dataset_dir}")
            return self.dataset_dir

        raise FileNotFoundError(
            f"Dataset not found. Expected CSVs in '{self.dataset_dir}' "
            f"or zip file at '{self.zip_path}'."
        )

    def find_csv_files(self, root_dir: str) -> List[str]:
        csv_files: List[str] = []
        for root, _, files in os.walk(root_dir):
            for file_name in files:
                if file_name.lower().endswith(".csv"):
                    csv_files.append(os.path.join(root, file_name))

        csv_files.sort()
        if not csv_files:
            raise FileNotFoundError(f"No CSV files found under '{root_dir}'.")

        print(f"Found {len(csv_files)} CSV files")
        for file_path in csv_files:
            print(f"  {file_path}")
        return csv_files

    def clean_column_names(self, df: pd.DataFrame) -> pd.DataFrame:
        cleaned_df = df.copy()
        cleaned_df.columns = cleaned_df.columns.str.strip()
        return cleaned_df

    def normalize_label_column(self, df: pd.DataFrame) -> pd.DataFrame:
        normalized_df = self.clean_column_names(df)
        if "Label" not in normalized_df.columns:
            raise ValueError(f"Label column not found. Columns: {normalized_df.columns.tolist()}")
        normalized_df["Label"] = normalized_df["Label"].astype(str).str.strip()
        return normalized_df

    def clean_single_file(self, file_path: str) -> pd.DataFrame:
        print(f"\nLoading {os.path.basename(file_path)}...")
        df = pd.read_csv(file_path, encoding="utf-8", low_memory=False)
        print(f"  Raw shape: {df.shape}")

        df = self.normalize_label_column(df)
        feature_df = df.drop(columns=["Label"]).copy()

        for column in feature_df.columns:
            feature_df[column] = pd.to_numeric(feature_df[column], errors="coerce")

        clean_df = feature_df.copy()
        clean_df["Label"] = df["Label"]
        clean_df.replace([np.inf, -np.inf], np.nan, inplace=True)

        before_drop = len(clean_df)
        clean_df.dropna(inplace=True)
        clean_df.drop_duplicates(inplace=True)
        clean_df.reset_index(drop=True, inplace=True)

        numeric_columns = clean_df.drop(columns=["Label"]).columns
        clean_df[numeric_columns] = clean_df[numeric_columns].astype(np.float32)

        removed_rows = before_drop - len(clean_df)
        print(f"  Clean shape: {clean_df.shape} (removed {removed_rows:,} rows)")
        return clean_df

    def load_and_clean_dataset(self, csv_files: Iterable[str]) -> pd.DataFrame:
        frames = [self.clean_single_file(file_path) for file_path in csv_files]
        merged_df = pd.concat(frames, ignore_index=True)
        merged_df.drop_duplicates(inplace=True)
        merged_df.reset_index(drop=True, inplace=True)
        print(f"\nMerged clean dataset shape: {merged_df.shape}")
        return merged_df

    def encode_labels(self, labels: pd.Series) -> tuple[np.ndarray, np.ndarray, LabelEncoder]:
        label_encoder = LabelEncoder()
        multiclass_labels = label_encoder.fit_transform(labels)
        binary_labels = (labels != "BENIGN").astype(np.int8).to_numpy()

        with open(os.path.join(self.artifact_dir, "label_encoder.pkl"), "wb") as file_obj:
            pickle.dump(label_encoder, file_obj)

        print("\nLabel mapping:")
        for index, label_name in enumerate(label_encoder.classes_):
            count = int((multiclass_labels == index).sum())
            print(f"  {index:2d} -> {label_name:<40s} count: {count:>8,}")

        return multiclass_labels, binary_labels, label_encoder

    def select_numeric_features(self, df: pd.DataFrame) -> pd.DataFrame:
        feature_df = df.drop(columns=["Label"]).select_dtypes(include=[np.number]).copy()
        if feature_df.empty:
            raise ValueError("No numeric features available after cleaning.")
        return feature_df

    def remove_constant_features(self, feature_df: pd.DataFrame) -> tuple[pd.DataFrame, List[str]]:
        variance_filter = VarianceThreshold(threshold=0.0)
        filtered_array = variance_filter.fit_transform(feature_df)
        feature_names = feature_df.columns[variance_filter.get_support()].tolist()
        filtered_df = pd.DataFrame(filtered_array, columns=feature_names).astype(np.float32)

        feature_names_path = os.path.join(self.artifact_dir, "feature_names.txt")
        with open(feature_names_path, "w", encoding="utf-8") as file_obj:
            file_obj.write("\n".join(feature_names))

        removed_features = feature_df.shape[1] - len(feature_names)
        print(f"\nRemoved {removed_features} constant features")
        print(f"Final feature count: {len(feature_names)}")
        return filtered_df, feature_names

    def split_dataset(
        self,
        features: pd.DataFrame,
        multiclass_labels: np.ndarray,
        binary_labels: np.ndarray,
    ) -> tuple[np.ndarray, ...]:
        feature_array = features.to_numpy(dtype=np.float32)

        try:
            split_result = train_test_split(
                feature_array,
                multiclass_labels,
                binary_labels,
                test_size=self.test_size,
                random_state=self.random_state,
                stratify=multiclass_labels,
            )
        except ValueError:
            print("Falling back to non-stratified train/test split due to class sparsity.")
            split_result = train_test_split(
                feature_array,
                multiclass_labels,
                binary_labels,
                test_size=self.test_size,
                random_state=self.random_state,
                stratify=None,
            )

        x_temp, x_test, y_mc_temp, y_mc_test, y_bin_temp, y_bin_test = split_result

        try:
            second_split = train_test_split(
                x_temp,
                y_mc_temp,
                y_bin_temp,
                test_size=self.validation_size,
                random_state=self.random_state,
                stratify=y_mc_temp,
            )
        except ValueError:
            print("Falling back to non-stratified validation split due to class sparsity.")
            second_split = train_test_split(
                x_temp,
                y_mc_temp,
                y_bin_temp,
                test_size=self.validation_size,
                random_state=self.random_state,
                stratify=None,
            )

        x_train, x_val, y_mc_train, y_mc_val, y_bin_train, y_bin_val = second_split

        print("\nDataset splits:")
        print(f"  Train:      {len(x_train):>10,}")
        print(f"  Validation: {len(x_val):>10,}")
        print(f"  Test:       {len(x_test):>10,}")

        return (
            x_train,
            x_val,
            x_test,
            y_mc_train,
            y_mc_val,
            y_mc_test,
            y_bin_train,
            y_bin_val,
            y_bin_test,
        )

    def scale_splits(
        self,
        x_train: np.ndarray,
        x_val: np.ndarray,
        x_test: np.ndarray,
    ) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
        scaler = StandardScaler()
        x_train_scaled = scaler.fit_transform(x_train).astype(np.float32)
        x_val_scaled = scaler.transform(x_val).astype(np.float32)
        x_test_scaled = scaler.transform(x_test).astype(np.float32)

        with open(os.path.join(self.artifact_dir, "scaler_standard.pkl"), "wb") as file_obj:
            pickle.dump(scaler, file_obj)

        return x_train_scaled, x_val_scaled, x_test_scaled

    def build_split_frame(
        self,
        x_data: np.ndarray,
        y_multiclass: np.ndarray,
        y_binary: np.ndarray,
        feature_names: List[str],
        split_name: str,
    ) -> pd.DataFrame:
        split_df = pd.DataFrame(x_data, columns=feature_names)
        split_df["label_multiclass"] = y_multiclass.astype(np.int32)
        split_df["label_binary"] = y_binary.astype(np.int8)
        split_df["split"] = split_name
        return split_df

    def save_training_dataset(
        self,
        x_train_scaled: np.ndarray,
        x_val_scaled: np.ndarray,
        x_test_scaled: np.ndarray,
        y_mc_train: np.ndarray,
        y_mc_val: np.ndarray,
        y_mc_test: np.ndarray,
        y_bin_train: np.ndarray,
        y_bin_val: np.ndarray,
        y_bin_test: np.ndarray,
        feature_names: List[str],
    ) -> pd.DataFrame:
        final_df = pd.concat(
            [
                self.build_split_frame(x_train_scaled, y_mc_train, y_bin_train, feature_names, "train"),
                self.build_split_frame(x_val_scaled, y_mc_val, y_bin_val, feature_names, "validation"),
                self.build_split_frame(x_test_scaled, y_mc_test, y_bin_test, feature_names, "test"),
            ],
            ignore_index=True,
        )

        final_df.to_csv(self.output_csv, index=False)
        print(f"\nSaved training-ready dataset to {self.output_csv}")
        print(f"Final dataset shape: {final_df.shape}")
        return final_df

    def run(self) -> pd.DataFrame:
        self.ensure_directories()
        dataset_dir = self.resolve_dataset_dir()
        csv_files = self.find_csv_files(dataset_dir)
        raw_df = self.load_and_clean_dataset(csv_files)

        labels = raw_df["Label"]
        feature_df = self.select_numeric_features(raw_df)
        multiclass_labels, binary_labels, _ = self.encode_labels(labels)
        filtered_features, feature_names = self.remove_constant_features(feature_df)

        (
            x_train,
            x_val,
            x_test,
            y_mc_train,
            y_mc_val,
            y_mc_test,
            y_bin_train,
            y_bin_val,
            y_bin_test,
        ) = self.split_dataset(filtered_features, multiclass_labels, binary_labels)

        x_train_scaled, x_val_scaled, x_test_scaled = self.scale_splits(x_train, x_val, x_test)
        final_df = self.save_training_dataset(
            x_train_scaled,
            x_val_scaled,
            x_test_scaled,
            y_mc_train,
            y_mc_val,
            y_mc_test,
            y_bin_train,
            y_bin_val,
            y_bin_test,
            feature_names,
        )

        print("\nPreprocessing complete")
        print(f"Rows: {len(final_df):,}")
        print(f"Features: {len(feature_names):,}")
        print("Output files:")
        print(f"  {self.output_csv}")
        print(f"  {os.path.join(self.artifact_dir, 'label_encoder.pkl')}")
        print(f"  {os.path.join(self.artifact_dir, 'scaler_standard.pkl')}")
        print(f"  {os.path.join(self.artifact_dir, 'feature_names.txt')}")
        return final_df


if __name__ == "__main__":
    Preprocess().run()
