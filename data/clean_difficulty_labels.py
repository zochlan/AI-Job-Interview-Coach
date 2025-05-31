import pandas as pd

def standardize_difficulty(val):
    if pd.isnull(val):
        return 'unknown'
    val = str(val).strip().lower()
    if val in ['beginner', 'easy']:
        return 'beginner'
    elif val in ['intermediate', 'medium']:
        return 'intermediate'
    elif val in ['advanced', 'hard']:
        return 'advanced'
    else:
        return 'unknown'

# Load the master Q&A file
df = pd.read_csv('data/master_questions_answers.csv')
df['difficulty'] = df['difficulty'].apply(standardize_difficulty)

# Save cleaned file
cleaned_path = 'data/master_questions_answers_cleaned.csv'
df.to_csv(cleaned_path, index=False)
print(f'Cleaned difficulty labels. Saved to {cleaned_path}')
print(df['difficulty'].value_counts())
