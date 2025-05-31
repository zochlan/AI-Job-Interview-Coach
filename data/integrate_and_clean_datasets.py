import pandas as pd
import json
import os

# Paths
DATA_DIR = 'data'

# 1. Load CSV datasets
def load_csvs():
    files = [
        ('Software Questions.csv', ','),
        ('tester-interview-questions-and-answers.csv', ';'),
        ('interview_train.csv', ','),
        ('interview_val.csv', ','),
        ('interview_test.csv', ',')
    ]
    dfs = {}
    for fname, sep in files:
        path = os.path.join(DATA_DIR, fname)
        if os.path.exists(path):
            try:
                dfs[fname] = pd.read_csv(path, sep=sep, encoding='utf-8')
            except UnicodeDecodeError:
                dfs[fname] = pd.read_csv(path, sep=sep, encoding='ISO-8859-1')
    return dfs

# 2. Load JSON dataset
def load_json():
    json_path = os.path.join(DATA_DIR, 'Mock_interview_questions.json')
    if os.path.exists(json_path):
        with open(json_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        # Assuming structure: {"questions": [ ... ]}
        df = pd.json_normalize(data['questions'])
        return df
    return None

# 3. Standardize and clean DataFrames
def standardize_software_questions(df):
    return df.rename(columns={
        'Question': 'question',
        'Answer': 'answer',
        'Category': 'category',
        'Difficulty': 'difficulty'
    })[['question', 'answer', 'category', 'difficulty']].assign(source='software_questions')

def standardize_tester_questions(df):
    return df.rename(columns={
        'question': 'question',
        'answer': 'answer'
    })[['question', 'answer']].assign(category='QA', difficulty=None, source='tester_questions')

def standardize_train_val_test(df, source):
    # For train/val/test sets with labels
    cols = ['question', 'response', 'label', 'category'] if 'category' in df.columns else ['question', 'response', 'label']
    df = df[cols].copy()
    df['source'] = source
    return df

def standardize_mock_json(df):
    # Try to extract question/answer/category/difficulty if present
    cols = {
        'question': 'question',
        'answer': 'answer',
        'category': 'category',
        'difficulty': 'tier', # using 'tier' as difficulty
        'source': 'source'
    }
    for col in cols.values():
        if col not in df.columns:
            df[col] = None
    return df.rename(columns={v: k for k, v in cols.items()})[
        ['question', 'answer', 'category', 'difficulty', 'source']
    ].assign(source='mock_json')

# 4. Main integration function
def integrate_all():
    dfs = load_csvs()
    mock_df = load_json()
    all_rows = []
    # Standardize and collect
    if 'Software Questions.csv' in dfs:
        all_rows.append(standardize_software_questions(dfs['Software Questions.csv']))
    if 'tester-interview-questions-and-answers.csv' in dfs:
        all_rows.append(standardize_tester_questions(dfs['tester-interview-questions-and-answers.csv']))
    if mock_df is not None:
        all_rows.append(standardize_mock_json(mock_df))
    # Merge all Q&A for question serving/model answers
    master_qa = pd.concat(all_rows, ignore_index=True)
    # Save master Q&A
    master_qa.to_csv(os.path.join(DATA_DIR, 'master_questions_answers.csv'), index=False)
    # Save train/val/test sets as cleaned versions
    for split in ['interview_train.csv', 'interview_val.csv', 'interview_test.csv']:
        if split in dfs:
            std = standardize_train_val_test(dfs[split], source=split.replace('.csv',''))
            std.to_csv(os.path.join(DATA_DIR, f'cleaned_{split}'), index=False)
    print('Integration and cleaning complete!')
    print(f'Master Q&A shape: {master_qa.shape}')
    print('Sample rows:')
    print(master_qa.head())

if __name__ == '__main__':
    integrate_all()
