# AI Job Interview Coach

An AI-powered system that provides real-time feedback and analysis for job interview responses.

## Features

- **Model Training Pipeline**: BERT-based model training for interview response analysis
- **Interview Analysis**: Comprehensive analysis of interview responses
- **Advanced NLP Analysis**: Sophisticated analysis including sentiment analysis, keyword extraction, and quality metrics
- **Configuration Management**: Centralized system configuration

## Project Structure

```
.
├── src/
│   ├── config.py           # Configuration management
│   ├── model_training.py   # Model training pipeline
│   ├── interview_analysis.py # Basic interview analysis
│   └── advanced_analysis.py # Advanced NLP analysis
├── data/
│   ├── processed/         # Processed datasets
│   └── raw/              # Raw datasets
├── models/               # Trained model checkpoints
└── requirements.txt      # Project dependencies
```

## Setup

1. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

## Usage

1. Train the model:
```bash
python src/model_training.py
```

2. Analyze interview responses:
```bash
python src/interview_analysis.py
```

3. Run advanced analysis:
```bash
python src/advanced_analysis.py
```

## Requirements

- Python 3.8+
- PyTorch
- Transformers
- Pandas
- NumPy
- Scikit-learn

## License

MIT License 