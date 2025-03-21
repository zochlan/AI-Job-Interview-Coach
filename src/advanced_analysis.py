from transformers import pipeline
import torch
from typing import Dict, List, Optional, Any, Tuple, Union, cast, TypedDict, Sequence
import numpy as np

class SentimentResult(TypedDict):
    label: str
    score: float

class ZeroShotResult(TypedDict):
    labels: List[str]
    scores: List[float]

class AdvancedNLPAnalysis:
    def __init__(self):
        """Initialize the advanced NLP analysis components."""
        self.sentiment_analyzer = pipeline("sentiment-analysis", return_all_scores=False)
        self.zero_shot_classifier = pipeline("zero-shot-classification")
        self.question_categories = ["technical", "leadership", "general"]
        
    def analyze_sentiment(self, text: str) -> Dict[str, Union[str, float]]:
        """
        Analyze the sentiment of the given text.
        
        Args:
            text (str): The text to analyze
            
        Returns:
            Dict[str, Union[str, float]]: Sentiment scores and label
        """
        try:
            result = self.sentiment_analyzer(text)
            if not result or not isinstance(result, list):
                return {"label": "NEUTRAL", "score": 0.5}
            first_result = result[0]
            if not isinstance(first_result, dict):
                return {"label": "NEUTRAL", "score": 0.5}
            return {
                "label": str(first_result.get("label", "NEUTRAL")),
                "score": float(first_result.get("score", 0.5))
            }
        except Exception as e:
            print(f"Error in sentiment analysis: {e}")
            return {"label": "NEUTRAL", "score": 0.5}
    
    def categorize_question(self, question: str) -> str:
        """
        Categorize the question type using zero-shot classification.
        
        Args:
            question (str): The question to categorize
            
        Returns:
            str: The category of the question
        """
        try:
            result = self.zero_shot_classifier(
                question,
                candidate_labels=self.question_categories
            )
            if not result or not isinstance(result, list):
                return "general"
            first_result = result[0]
            if not isinstance(first_result, dict):
                return "general"
            labels = first_result.get("labels", [])
            if not labels:
                return "general"
            return str(labels[0])
        except Exception as e:
            print(f"Error in question categorization: {e}")
            return "general"
    
    def extract_keywords(self, text: str) -> List[Tuple[str, int]]:
        """
        Extract key terms from the text.
        
        Args:
            text (str): The text to analyze
            
        Returns:
            List[Tuple[str, int]]: List of (word, frequency) tuples
        """
        # Simple keyword extraction based on frequency
        words = text.lower().split()
        word_freq: Dict[str, int] = {}
        for word in words:
            if len(word) > 3:  # Ignore short words
                word_freq[word] = word_freq.get(word, 0) + 1
        
        # Return top 5 keywords
        return sorted(word_freq.items(), key=lambda x: x[1], reverse=True)[:5]
    
    def analyze_response_quality(self, response: str) -> Dict[str, float]:
        """
        Analyze the quality of the response.
        
        Args:
            response (str): The response to analyze
            
        Returns:
            Dict[str, float]: Quality metrics
        """
        # Calculate basic metrics
        words = response.split()
        sentences = response.split('.')
        
        metrics: Dict[str, float] = {
            "length": float(len(words)),
            "sentence_count": float(len(sentences)),
            "avg_sentence_length": float(len(words)) / max(len(sentences), 1),
            "vocabulary_richness": float(len(set(words))) / len(words)
        }
        
        # Add sentiment analysis
        sentiment = self.analyze_sentiment(response)
        metrics["sentiment_score"] = float(sentiment["score"])
        
        return metrics
    
    def generate_detailed_feedback(self, 
                                 question: str, 
                                 response: str) -> Dict[str, Any]:
        """
        Generate detailed feedback for the response.
        
        Args:
            question (str): The interview question
            response (str): The candidate's response
            
        Returns:
            Dict[str, Any]: Detailed feedback and analysis
        """
        # Get question category
        category = self.categorize_question(question)
        
        # Analyze response quality
        quality_metrics = self.analyze_response_quality(response)
        
        # Extract keywords
        keywords = self.extract_keywords(response)
        
        # Generate feedback based on metrics
        feedback = self._generate_feedback_text(quality_metrics, category)
        
        return {
            "category": category,
            "quality_metrics": quality_metrics,
            "keywords": keywords,
            "feedback": feedback,
            "sentiment": self.analyze_sentiment(response)
        }
    
    def _generate_feedback_text(self, 
                              metrics: Dict[str, float], 
                              category: str) -> str:
        """
        Generate feedback text based on quality metrics.
        
        Args:
            metrics (Dict[str, float]): Quality metrics
            category (str): Question category
            
        Returns:
            str: Generated feedback text
        """
        feedback_parts: List[str] = []
        
        # Length feedback
        if metrics["length"] < 50:
            feedback_parts.append("Your response could be more detailed.")
        elif metrics["length"] > 200:
            feedback_parts.append("Consider being more concise.")
            
        # Structure feedback
        if metrics["sentence_count"] < 3:
            feedback_parts.append("Try structuring your response with multiple sentences.")
            
        # Vocabulary feedback
        if metrics["vocabulary_richness"] < 0.5:
            feedback_parts.append("Consider using more varied vocabulary.")
            
        # Category-specific feedback
        if category == "technical":
            feedback_parts.append("Include specific technical details and examples.")
        elif category == "leadership":
            feedback_parts.append("Focus on specific actions and outcomes.")
        else:
            feedback_parts.append("Provide concrete examples to support your points.")
            
        return " ".join(feedback_parts)

def main():
    """Demonstrate the usage of AdvancedNLPAnalysis."""
    analyzer = AdvancedNLPAnalysis()
    
    # Example questions and responses
    examples = [
        {
            "question": "Tell me about a time you showed leadership",
            "response": "I led a team of 5 developers in completing a critical project under tight deadlines. I organized daily stand-ups, assigned tasks based on expertise, and ensured clear communication between team members. The project was delivered on time and received positive feedback from stakeholders."
        },
        {
            "question": "Explain object-oriented programming",
            "response": "Object-oriented programming is a programming paradigm based on the concept of objects that contain data and code. The four main principles are encapsulation, inheritance, polymorphism, and abstraction. For example, in Python, a class defines an object's structure and behavior."
        },
        {
            "question": "How do you handle conflict at work?",
            "response": "I believe in addressing conflicts directly and professionally. I focus on understanding different perspectives, finding common ground, and working towards a mutually beneficial solution. For instance, when team members had different approaches to a project, I facilitated a discussion to combine the best aspects of each approach."
        }
    ]
    
    print("Advanced Analysis Results:")
    print("-" * 50)
    
    for example in examples:
        print(f"\nQuestion: {example['question']}")
        print(f"Response: {example['response']}")
        
        analysis = analyzer.generate_detailed_feedback(example['question'], example['response'])
        
        print("\nAnalysis Results:")
        print(f"Category: {analysis['category']}")
        print("\nQuality Metrics:")
        for metric, value in analysis['quality_metrics'].items():
            print(f"- {metric}: {value:.2f}")
        
        print("\nKey Terms:")
        for word, freq in analysis['keywords']:
            print(f"- {word}: {freq}")
        
        print("\nSentiment Analysis:")
        print(f"- Label: {analysis['sentiment']['label']}")
        print(f"- Score: {analysis['sentiment']['score']:.2f}")
        
        print("\nFeedback:")
        print(analysis['feedback'])
        print("-" * 50)

if __name__ == "__main__":
    main() 