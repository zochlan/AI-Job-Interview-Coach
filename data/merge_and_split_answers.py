import pandas as pd
from sklearn.model_selection import train_test_split
import glob
import os

# List all labeled answer datasets to merge (update this list as needed)
DATA_FILES = [
    'interview_train.csv',
    'interview_val.csv',
    'interview_test.csv',
    'cleaned_interview_train.csv',
    'cleaned_interview_val.csv',
    'cleaned_interview_test.csv',
    'tester-interview-questions-and-answers.csv',
    'master_questions_answers_cleaned.csv',
]

DATA_DIR = os.path.dirname(__file__)
all_dfs = []

for fname in DATA_FILES:
    fpath = os.path.join(DATA_DIR, fname)
    if os.path.exists(fpath):
        try:
            df = pd.read_csv(fpath)
            # Only keep columns relevant for answer training (adjust as needed)
            # Try to find columns for answer text and label
            answer_col = None
            label_col = None
            for col in df.columns:
                if col.lower() in ['answer', 'response', 'user_answer', 'user_response']:
                    answer_col = col
                if col.lower() in ['label', 'quality', 'is_good', 'is_bad', 'good', 'bad', 'score']:
                    label_col = col
            if answer_col is not None and label_col is not None:
                df = df[[answer_col, label_col]].rename(columns={answer_col: 'answer', label_col: 'label'})
                all_dfs.append(df)
        except Exception as e:
            print(f"Could not process {fname}: {e}")

if not all_dfs:
    raise RuntimeError("No datasets could be loaded. Check DATA_FILES paths and format.")

# Concatenate all data
merged_df = pd.concat(all_dfs, ignore_index=True)

# Drop rows with missing values or duplicates
merged_df = merged_df.dropna().drop_duplicates()

# Shuffle
merged_df = merged_df.sample(frac=1, random_state=42).reset_index(drop=True)

# Convert label to int if possible
try:
    merged_df['label'] = merged_df['label'].astype(int)
except Exception:
    # If not int, try to map good/bad to 1/0
    merged_df['label'] = merged_df['label'].astype(str).map({'good': 1, 'bad': 0, '1': 1, '0': 0})

# Split
train_df, temp_df = train_test_split(merged_df, test_size=0.2, random_state=42, stratify=merged_df['label'])
val_df, test_df = train_test_split(temp_df, test_size=0.5, random_state=42, stratify=temp_df['label'])

# Save
train_df.to_csv(os.path.join(DATA_DIR, 'all_answers_train.csv'), index=False)
val_df.to_csv(os.path.join(DATA_DIR, 'all_answers_val.csv'), index=False)
test_df.to_csv(os.path.join(DATA_DIR, 'all_answers_test.csv'), index=False)

print(f"Merged dataset size: {len(merged_df)}")
print(f"Train: {len(train_df)}, Val: {len(val_df)}, Test: {len(test_df)}")
print("Saved to all_answers_train.csv, all_answers_val.csv, all_answers_test.csv")
