import spacy
from transformers import pipeline
import os
from .advanced_analysis import AdvancedNLPAnalysis

# Global variables for NLP models
nlp = None
sentiment_analyzer = None
question_answering = None
advanced_analyzer = None

def initialize_nlp():
    """Initialize NLP models and pipelines"""
    global nlp, sentiment_analyzer, question_answering, advanced_analyzer
    
    # Load SpaCy model for general NLP tasks
    try:
        nlp = spacy.load("en_core_web_sm")
    except OSError:
        # Download the model if it's not installed
        os.system("python -m spacy download en_core_web_sm")
        nlp = spacy.load("en_core_web_sm")
    
    # Initialize Hugging Face pipelines
    sentiment_analyzer = pipeline("sentiment-analysis")
    question_answering = pipeline("question-answering")
    
    # Initialize advanced analysis
    advanced_analyzer = AdvancedNLPAnalysis()

def analyze_response(response_text, question_context):
    """
    Analyze interview response using NLP
    
    Args:
        response_text (str): The candidate's response
        question_context (str): The interview question and any additional context
    
    Returns:
        dict: Analysis results including:
            - STAR components identified
            - Key points mentioned
            - Sentiment analysis
            - Completeness score
            - Professional tone analysis
            - Response clarity metrics
            - Improvement suggestions
    """
    doc = nlp(response_text)
    
    # Basic analysis
    star_components = identify_star_components(doc)
    key_points = extract_key_points(doc)
    sentiment = sentiment_analyzer(response_text)[0]
    completeness_score = calculate_completeness(star_components)
    
    # Advanced analysis
    professional_tone = advanced_analyzer.analyze_professional_tone(response_text)
    clarity_metrics = advanced_analyzer.analyze_clarity(response_text)
    response_summary = advanced_analyzer.generate_summary(response_text)
    
    analysis_results = {
        'star_components': star_components,
        'key_points': key_points,
        'sentiment': sentiment,
        'completeness_score': completeness_score,
        'professional_tone': professional_tone,
        'clarity_metrics': clarity_metrics,
        'summary': response_summary
    }
    
    # Generate improvement suggestions
    suggestions = advanced_analyzer.get_improvement_suggestions(analysis_results)
    analysis_results['improvement_suggestions'] = suggestions
    
    return analysis_results

def identify_star_components(doc):
    """
    Identify STAR (Situation, Task, Action, Result) components in the response
    """
    # Initialize components
    components = {
        'situation': [],
        'task': [],
        'action': [],
        'result': []
    }
    
    # Keywords and phrases for each component
    star_indicators = {
        'situation': ['when', 'while', 'during', 'at', 'in'],
        'task': ['needed to', 'had to', 'responsible for', 'goal was'],
        'action': ['implemented', 'developed', 'created', 'managed', 'led'],
        'result': ['resulted in', 'achieved', 'increased', 'improved']
    }
    
    # Analyze sentences
    for sent in doc.sents:
        sent_text = sent.text.lower()
        
        for component, indicators in star_indicators.items():
            if any(indicator in sent_text for indicator in indicators):
                components[component].append(sent.text)
    
    return components

def extract_key_points(doc):
    """
    Extract key points from the response using NLP
    """
    key_points = []
    
    # Extract named entities
    entities = [(ent.text, ent.label_) for ent in doc.ents]
    
    # Extract important noun phrases
    noun_phrases = [chunk.text for chunk in doc.noun_chunks]
    
    # Extract verbs with their objects
    actions = []
    for token in doc:
        if token.pos_ == "VERB":
            verb_phrase = token.text
            obj = next((child.text for child in token.children if child.dep_ in ['dobj', 'pobj']), '')
            if obj:
                verb_phrase += f" {obj}"
            actions.append(verb_phrase)
    
    return {
        'entities': entities,
        'noun_phrases': noun_phrases,
        'actions': actions
    }

def calculate_completeness(star_components):
    """
    Calculate how complete the STAR response is
    """
    scores = {
        'situation': 0.25,
        'task': 0.25,
        'action': 0.25,
        'result': 0.25
    }
    
    total_score = sum(scores[component] for component, content in star_components.items() if content)
    return total_score 