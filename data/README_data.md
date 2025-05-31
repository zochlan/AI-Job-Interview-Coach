# AI Job Interview Coach — Data Documentation

## Overview
This folder contains the integrated and cleaned datasets used for the AI-powered interview coach application. Data has been sourced from multiple public and custom datasets in CSV and JSON formats, then standardized for downstream NLP and ML tasks.

---

## Data Files
- **master_questions_answers.csv**: Raw merged Q&A pairs from all sources.
- **master_questions_answers_cleaned.csv**: Cleaned version with standardized difficulty labels.
- **cleaned_interview_train.csv, cleaned_interview_val.csv, cleaned_interview_test.csv**: Labeled datasets for supervised ML (good/bad answers).
- **Mock_interview_questions.json**: Original large JSON dataset.
- **Software Questions.csv, tester-interview-questions-and-answers.csv**: Original Q&A CSVs.

---

## Columns (master_questions_answers_cleaned.csv)
- `question`: The interview question (string)
- `answer`: The model/sample answer (string)
- `category`: Thematic or technical category (string)
- `difficulty`: One of `beginner`, `intermediate`, `advanced`, `unknown` (string)
- `source`: Dataset origin (string)

---

## Data Cleaning & Integration Steps
1. Loaded all CSV and JSON Q&A datasets into pandas DataFrames.
2. Standardized column names and selected relevant fields.
3. Merged all Q&A pairs into a single master file.
4. Standardized difficulty labels and filled missing values as `unknown`.
5. Saved cleaned and labeled splits for ML training.

---

## Exploratory Data Analysis (EDA)
- **Total Q&A pairs:** 5,288
- **Sources:** mock_json (5,000), software_questions (200), tester_questions (88)
- **Categories:** 76 unique (e.g., Programming, Web Development, DevOps)
- **Difficulty distribution:**
    - beginner: 1,694
    - intermediate: 1,781
    - advanced: 1,725
    - unknown: 88
- **No missing questions, answers, or categories.**

---

## Usage
- Use `master_questions_answers_cleaned.csv` for question serving, practice, and as a source of model/sample answers.
- Use cleaned train/val/test splits for ML model training and evaluation.

---

## Important Note: Missing Model File

The file `answer_classifier_model/model.safetensors` (255 MB) is not included in this repository due to GitHub's 100 MB file size limit.

To use the answer classifier functionality:
1. Train your own model using `train_answer_classifier.py`
2. Or download a pre-trained model and place it in `data/answer_classifier_model/`
3. The application will work without this file, but answer classification features will be limited

---

## Contact
For questions or contributions, contact the project maintainer.
