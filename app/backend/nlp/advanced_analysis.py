from transformers import pipeline
import spacy
from textblob import TextBlob
import numpy as np

class AdvancedNLPAnalysis:
    def __init__(self):
        self.zero_shot_classifier = pipeline("zero-shot-classification")
        self.summarizer = pipeline("summarization")
        
    def analyze_professional_tone(self, text):
        """Analyze the professional tone of the response"""
        candidate_labels = [
            "professional",
            "casual",
            "technical",
            "confident",
            "uncertain"
        ]
        
        result = self.zero_shot_classifier(text, candidate_labels)
        return {
            'tone_classification': dict(zip(result['labels'], result['scores']))
        }
    
    def generate_summary(self, text):
        """Generate a concise summary of the response"""
        summary = self.summarizer(text, max_length=130, min_length=30, do_sample=False)
        return summary[0]['summary_text']
    
    def analyze_clarity(self, text):
        """Analyze the clarity and coherence of the response"""
        blob = TextBlob(text)
        sentences = blob.sentences
        
        metrics = {
            'avg_sentence_length': np.mean([len(str(s).split()) for s in sentences]),
            'polarity': blob.sentiment.polarity,
            'subjectivity': blob.sentiment.subjectivity
        }
        
        return metrics
    
    def get_improvement_suggestions(self, analysis_results):
        """Generate improvement suggestions based on analysis results"""
        suggestions = []
        
        # Check STAR completeness
        star_components = analysis_results['star_components']
        for component, content in star_components.items():
            if not content:
                suggestions.append(f"Include {component.capitalize()} component: Describe the {component} in your response")
        
        # Check professional tone
        tone = analysis_results.get('tone_classification', {})
        if tone.get('professional', 0) < 0.6:
            suggestions.append("Consider using more professional language")
        
        # Check clarity metrics
        clarity = analysis_results.get('clarity', {})
        if clarity.get('avg_sentence_length', 0) > 25:
            suggestions.append("Consider breaking down long sentences for better clarity")
        
        return suggestions 