import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns

# Load the master Q&A dataset
df = pd.read_csv('data/master_questions_answers.csv')

print('--- BASIC INFO ---')
print(df.info())
print('\n--- SAMPLE ROWS ---')
print(df.sample(10))

print('\n--- MISSING VALUES ---')
print(df.isnull().sum())

print('\n--- CATEGORY DISTRIBUTION ---')
print(df['category'].value_counts(dropna=False))

print('\n--- DIFFICULTY DISTRIBUTION ---')
print(df['difficulty'].value_counts(dropna=False))

print('\n--- SOURCE DISTRIBUTION ---')
print(df['source'].value_counts(dropna=False))

# Plot category distribution
plt.figure(figsize=(12,6))
sns.countplot(y='category', data=df, order=df['category'].value_counts().index)
plt.title('Question Category Distribution')
plt.tight_layout()
plt.savefig('data/category_distribution.png')
plt.close()

# Plot difficulty distribution (if present)
if 'difficulty' in df.columns and df['difficulty'].notnull().any():
    plt.figure(figsize=(8,4))
    sns.countplot(x='difficulty', data=df, order=df['difficulty'].value_counts().index)
    plt.title('Question Difficulty Distribution')
    plt.tight_layout()
    plt.savefig('data/difficulty_distribution.png')
    plt.close()

# Show a few samples from each source
for src in df['source'].unique():
    print(f'\n--- SAMPLE Q&A FROM SOURCE: {src} ---')
    print(df[df['source']==src][['question','answer','category','difficulty']].sample(3, random_state=42, replace=True))

print('\nEDA complete. Plots saved to data/.')
