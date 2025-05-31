import pandas as pd
import random
import os
import logging
from typing import Optional

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load the cleaned master Q&A dataset once
DATA_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'data', 'master_questions_answers_cleaned.csv')

# Default questions in case the data file doesn't exist
DEFAULT_QUESTIONS = [
    {
        'question': 'Tell me about yourself.',
        'answer': 'I would highlight my relevant experience, skills, and what makes me a good fit for this role.',
        'category': 'behavioral',
        'difficulty': 'beginner',
        'source': 'default',
        'type': 'behavioral'
    },
    {
        'question': 'What is your greatest strength?',
        'answer': 'I would mention a strength relevant to the job and provide a specific example.',
        'category': 'behavioral',
        'difficulty': 'beginner',
        'source': 'default',
        'type': 'behavioral'
    },
    {
        'question': 'Describe a challenge you faced at work.',
        'answer': 'I would use the STAR method: Situation, Task, Action, Result.',
        'category': 'behavioral',
        'difficulty': 'intermediate',
        'source': 'default',
        'type': 'behavioral'
    }
]

# Try to load the data file, or use default questions if it doesn't exist
try:
    if os.path.exists(DATA_PATH):
        df = pd.read_csv(DATA_PATH)
        logger.info(f"Loaded {len(df)} questions from {DATA_PATH}")
    else:
        logger.warning(f"Data file {DATA_PATH} not found. Using default questions.")
        df = pd.DataFrame(DEFAULT_QUESTIONS)
except Exception as e:
    logger.error(f"Error loading question data: {e}")
    df = pd.DataFrame(DEFAULT_QUESTIONS)

def get_technical_categories():
    # Define non-technical categories (expand as needed)
    non_technical_keywords = ['behavioral', 'situational', 'star']
    categories = df['category'].unique()
    technical_categories = [cat for cat in categories if not any(kw in cat.lower() for kw in non_technical_keywords)]
    return technical_categories

def get_random_question(category: Optional[str] = None, difficulty: Optional[str] = None, categories: Optional[list] = None):
    filtered = df
    if categories:
        filtered = filtered[filtered['category'].isin(categories)]
    elif category:
        filtered = filtered[filtered['category'].str.lower() == category.lower()]
    if difficulty:
        filtered = filtered[filtered['difficulty'].str.lower() == difficulty.lower()]
    if filtered.empty:
        return None
    row = filtered.sample(1).iloc[0]
    # Infer type from category or question text
    cat = str(row['category']).lower()
    qtext = str(row['question']).lower()
    if any(word in cat for word in ['behavioral', 'situational', 'star']) or any(word in qtext for word in ['tell me', 'describe', 'give an example', 'how did you']):
        qtype = 'behavioral'
    else:
        qtype = 'technical'
    return {
        'question': row['question'],
        'answer': row['answer'],
        'category': row['category'],
        'difficulty': row['difficulty'],
        'source': row['source'],
        'type': qtype
    }


def get_next_question(difficulty='easy'):
    """Get the next question based on difficulty level."""
    # Map difficulty levels
    difficulty_map = {
        'easy': 'beginner',
        'medium': 'intermediate',
        'hard': 'advanced'
    }

    # Use the mapped difficulty or default to beginner
    mapped_difficulty = difficulty_map.get(difficulty, 'beginner')

    # Try to get a question with the specified difficulty
    question = get_random_question(difficulty=mapped_difficulty)

    # If no question found, fall back to any difficulty
    if not question:
        question = get_random_question()

    # Format the question for the API response
    if question:
        return {
            'question': question['question'],
            'category': question['category'],
            'difficulty': difficulty,
            'type': question['type']
        }

    # Fallback to a hardcoded question if all else fails
    return {
        'question': 'Tell me about yourself.',
        'category': 'behavioral',
        'difficulty': 'easy',
        'type': 'behavioral'
    }

if __name__ == '__main__':
    # Demo: print a random question
    print(get_random_question())
    # Demo: print a random beginner question from Programming
    print(get_random_question(category='Computer Science > Programming', difficulty='beginner'))
    # Demo: get next question based on difficulty
    print(get_next_question('medium'))
