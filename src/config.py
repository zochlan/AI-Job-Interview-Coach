import os
from typing import Dict, Any
from dataclasses import dataclass
from pathlib import Path

@dataclass
class ModelConfig:
    model_name: str = 'bert-base-uncased'
    max_length: int = 512
    num_labels: int = 2
    batch_size: int = 8
    learning_rate: float = 2e-5
    epochs: int = 3
    early_stopping_patience: int = 3
    early_stopping_min_delta: float = 0.0

@dataclass
class PathConfig:
    base_dir: Path = Path(__file__).parent.parent
    data_dir: Path = base_dir / 'data'
    model_dir: Path = base_dir / 'models'
    log_dir: Path = base_dir / 'logs'
    
    # Data files
    train_file: Path = data_dir / 'interview_train.csv'
    val_file: Path = data_dir / 'interview_val.csv'
    
    # Model files
    model_file: Path = model_dir / 'model.pt'
    training_history_file: Path = model_dir / 'training_history.json'
    
    # Log files
    training_log_file: Path = log_dir / 'training.log'
    analysis_log_file: Path = log_dir / 'analysis.log'

@dataclass
class LogConfig:
    level: str = 'INFO'
    format: str = '%(asctime)s - %(levelname)s - %(message)s'
    date_format: str = '%Y-%m-%d %H:%M:%S'

@dataclass
class Config:
    model: ModelConfig = ModelConfig()
    paths: PathConfig = PathConfig()
    logging: LogConfig = LogConfig()
    
    def __post_init__(self):
        # Create necessary directories
        self.paths.data_dir.mkdir(parents=True, exist_ok=True)
        self.paths.model_dir.mkdir(parents=True, exist_ok=True)
        self.paths.log_dir.mkdir(parents=True, exist_ok=True)

# Create global config instance
config = Config() 